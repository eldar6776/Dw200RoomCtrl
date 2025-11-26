//build:20240717
// Thread pool, which loads multiple workers. The thread pool receives tasks or transactions and then dispatches them to idle workers in the thread pool to execute tasks, which is used to solve the bottleneck of multi-transaction processing.
// Device resources are limited, and the number of threads should not be too many. In addition, multiple thread pools are not considered. There is only one globally.
// Component depends on dxLogger, dxCommon, dxStd
import std from './dxStd.js'
import logger from './dxLogger.js'
import * as os from "os";
//-------------------------variable--------------------
const pool = {}
const isMain = (os.Worker.parent === undefined)
let queueSize = 100
const queue = []
const all = {}
pool.os = os
/**
 * Initialize thread pool, set the number of workers and cache queue size. It is possible that multiple workers are not idle, and the cache queue can cache transactions that are too late to process.
 * Because workers can only be created through the main thread, the init function can only be executed in the main thread.
 * Note: The file corresponding to the worker cannot contain an infinite loop like while(true). You can use setInteval to implement the loop.
 * @param {string} The file name corresponding to the file worker, required, absolute path, usually starting with '/app/code/src'
 * @param {Object} bus EventBus object required
 * @param {Array} topics topic group to subscribe required
 * @param {number} count The number of threads, not required, cannot be less than 1, default2,
 * @param {number} maxsize The size of the transaction cache, not required, default100, if it exceeds 100, the oldest transaction is discarded
 */
pool.init = function (file, bus, topics, count = 2, maxsize = 100) {
    if (!file) {
        throw new Error("pool init:'file' should not be empty")
    }
    if (!bus) {
        throw new Error("pool init:'bus' should not be empty")
    }
    if (!topics) {
        throw new Error("pool init:'topics' should not be empty")
    }
    if (!isMain) {
        throw new Error("pool init should be invoked in main thread")
    }
    if (!std.exist(file)) {
        throw new Error("pool init: file not found:" + file)
    }
    queueSize = maxsize
    if (count <= 1) {
        count = 1
    }
    for (let i = 0; i < count; i++) {
        const id = 'pool__id' + i
        let content = std.loadFile(file) + `
import __pool from '/app/code/dxmodules/dxWorkerPool.js'
__pool.id = '${id}'
const __parent = __pool.os.Worker.parent
__parent.onmessage = function (e) {
    if (!e.data) {
        return
    }
    let fun = __pool.callbackFunc
    if (fun) {
        try {
            fun(e.data)
            __parent.postMessage({ id: __pool.id })//通知处理完了idle
        } catch (err) {
            __parent.postMessage({ id: __pool.id, error: err.stack })//通知处理完了idle,但是失败了    
        }
    }
}
            `
        let newfile = file + '_' + id + '.js'
        std.saveFile(newfile, content)
        let worker = new os.Worker(newfile)
        all[id] = { isIdle: true, worker: worker }
        worker.onmessage = function (data) {
            if (!data.data) {
                return
            }
            const id = data.data.id
            if (id) {//通知处理完成的消息
                all[id].isIdle = true
                if (data.data.error) {
                    logger.error(`worker ${id} callback error:${data.data.error}`)
                }
            } else {
                const topic = data.data.topic
                if (topic) {//bus.fire出来的消息
                    bus.fire(topic, data.data.data)
                }
            }
        }
    }
    for (let topic of topics) {
        bus.on(topic, function (d) {
            push({ topic: topic, data: d })
        })
    }

    std.setInterval(function () {
        Object.keys(all).forEach(key => {
            const obj = all[key]
            if (obj.isIdle) {
                let event = take()
                if (event) {
                    obj.isIdle = false
                    obj.worker.postMessage(event)
                }
            }
        });
    }, 5)
}
/**
 * Returns the unique identification id of the thread
 * @returns worker unique identifier
 */
pool.getWorkerId = function () {
    if (isMain) {
        return 'main'
    } else {
        return pool.id
    }
}
/**
 * The transaction topic on subscribeEventBus can subscribe to multiple topics. This function can only be executed in the main thread.
 * @param {Object} bus EventBus object
 * @param {Array} topics topic group to subscribe to
 */
pool.on = function (bus, topics) {
    if (!bus) {
        throw new Error("pool onEventBus:'bus' should not be empty")
    }
    if (!topics) {
        throw new Error("pool onEventBus:'topics' should not be empty")
    }
    if (!isMain) {
        throw new Error("pool onEventBus should be invoked in main thread")
    }

}

pool.callbackFunc = null
/**
 * The worker thread subscribes to the events of the thread pool. There is no need to select a specific topic. All events that the thread pool focuses on will be processed.
 * This function must be executed in the worker thread and cannot be executed in the main thread
 * @param {function} callback function for cb event processing, required
 */
pool.callback = function (cb) {
    if (!cb || (typeof cb) != 'function') {
        throw new Error("pool on :The 'callback' should be a function");
    }
    if (isMain) {
        throw new Error("pool on should not be invoked in main thread")
    }
    pool.callbackFunc = cb
}

function push(item) {
    if (queue.length >= queueSize) {
        const first = JSON.stringify(queue[0])
        logger.error(`pool queue is full,removing oldest element: ${first}`)
        queue.shift(); // 移除最老的元素
    }
    queue.push(item);
}

function take() {
    if (queue.length === 0) {
        return null; // 队列为空时返回 null
    }
    return queue.shift(); // 移除并返回最早添加的元素
}
export default pool
