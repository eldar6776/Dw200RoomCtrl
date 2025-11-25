//build:20240628
//Event bus, using quickjs's inter-worker data communication to send event notifications between threads.
//Workers cannot communicate directly with each other, they need to be forwarded through the parent (main thread), so 5 possible event notifications need to be implemented
//1. worker1--->parent--->worker2
//2. worker3--->parent
//3. parent--->worker4
//4. parent<-->parent 
//5. worker5<--->worker5, will also be transferred through parent
//Component depends on dxLogger,dxCommon
import std from './dxStd.js'
import logger from './dxLogger.js'
import * as os from "os";
//-------------------------variable--------------------
const bus = {}
const all = {}
const subs = {}
const isMain = (os.Worker.parent === undefined)
bus.id = isMain ? '__main' : null
/**
 * Start a worker on the bus and define a unique id for it
 * Because workers can only be created by the main thread, the newWorker function can only be executed in the main thread
 * Note: The file corresponding to the worker cannot contain an infinite loop like while(true), otherwise the message will not be received. You can use setInterval to implement the loop
 * @param {string} id The unique identifier of the worker cannot be empty
 * @param {object} file The file name corresponding to the worker, the absolute path, usually starts with '/app/code/src'
 */
bus.newWorker = function (id, file) {
    if (!id) {
        throw new Error("eventbus newWorker:'id' should not be empty")
    } if (!file) {
        throw new Error("eventbus newWorker:'file' should not be empty")
    }
    if (!isMain) {
        throw new Error("evnetbus newWorker should be invoke in main thread")
    }
    if (!std.exist(file)) {
        throw new Error("eventbus newWorker: file not found:" + file)
    }
    let content = std.loadFile(file) + `
import __bus from '/app/code/dxmodules/dxEventBus.js'
__bus.id='${id}'
Object.keys(__bus.handlers).forEach(key => {
    __bus.os.Worker.parent.postMessage({ __sub: key, id: __bus.id })
})
__bus.os.Worker.parent.onmessage = function (e) {
    if(!e.data){
        return
    }
    e = e.data
    if (!e || !e.topic) {
        return
    }
    let fun = __bus.handlers[e.topic]
    if (fun) {
        fun(e.data)
    }
}
    `
    let newfile = file + '_' + id + '.js'
    std.saveFile(newfile, content)
    let worker = new os.Worker(newfile)
    all[id] = worker
    worker.onmessage = function (data) {
        if (data.data) {
            if (data.data.__sub) {
                sub(data.data.__sub, data.data.id)
                return
            }
            // The data sent by the worker will call the fire of the main thread again, either the main thread consumes it itself, or forwards it to other workers
            bus.fire(data.data.topic, data.data.data)
        }
    }
}
/**
 * Delete the corresponding worker according to the id, so that the worker thread can end normally
 * @param {string} id 
 */
bus.delWorker = function (id) {
    delete all[id]
}
/**
 * Trigger an event. This event will be sent and ended immediately. If the processing of the received message is time-consuming, it will not affect the order of event sending or cause event loss.
 * The same event can have multiple subscribers, and multiple subscribers can be notified at the same time. Only one event of the same topic is processed within a unit of time.
 * The next event of the same topic is allowed to be processed only after the current topic has been processed by all subscribers
 * 
 * @param {string} topic Event identifier, topic 
 * @param {*} data Data attached to the event
 */
bus.fire = function (topic, data) {
    if (!topic || (typeof topic) != 'string') {
        throw new Error("eventbus :'topic' should not be null");
    }
    if (isMain) {
        if (subs[topic] && subs[topic].length > 0) {
            for (let i = 0; i < subs[topic].length; i++) {
                const id = subs[topic][i]
                if (id === '__main' && bus.handlers[topic]) {
                    bus.handlers[topic](data)
                } else {
                    const worker = all[id]
                    if (worker) {
                        worker.postMessage({ topic: topic, data: data })
                    }
                }
            }
        }
    } else {
        os.Worker.parent.postMessage({ topic: topic, data: data })
    }
}


bus.handlers = {}
/**
 * Subscribe to an event
 * @param {string} topic Event identifier, topic, required
 * @param {function} callback Callback function for event handling, required
 */
bus.on = function (topic, callback) {
    if (!topic || (typeof topic) != 'string') {
        throw new Error("The 'topic' should not be null");
    }
    if (!callback || (typeof callback) != 'function') {
        throw new Error("The 'callback' should be a function");
    }
    sub(topic, bus.id)
    this.handlers[topic] = callback
}
function sub(topic, id) {
    if (isMain) {
        if (!subs[topic]) {
            subs[topic] = []
        }
        if (!subs[topic].includes(id)) {
            subs[topic].push(id)
        }
    } else {
        if (id != null) {
            os.Worker.parent.postMessage({ __sub: topic, id: id })
        }
    }
}
bus.os = os
export default bus
