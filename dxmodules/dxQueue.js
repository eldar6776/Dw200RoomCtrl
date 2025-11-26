import { queueClass } from './libvbar-m-dxqueue.so'

const queueObj = new queueClass();

function base(name) {

    /**
     * Get the data from the top of the queue
     * @param {*} topic queue name
     * @returns 
     */
    function pop() {
        if (!name || name.length < 1) {
            throw new Error("dxQueue.pop:name should not be null or empty")
        }
        return queueObj.pop(name)
    }
    /**
     * @brief puts data into the queue
     * @param {*} name Queue name
     * @param {*} value The data to be put into the queue
     */
    function push(value) {
        if (!name || name.length < 1) {
            throw new Error("dxQueue.push:name should not be null or empty")
        }
        if (!value || value.length < 1) {
            throw new Error("dxQueue.push:value should not be null or empty")
        }
        return queueObj.push(name, value)
    }

    function size() {
        return queueObj.size(name)
    }
    function destroy() {
        return queueObj.destroy(name)
    }
    return { pop, push, size, destroy };
}


const queue = {
    get: function (name) {
        if (!name || name.length == 0) {
            throw new Error("dxQueue.get:name should not be null or empty")
        }
        queueObj.create(name)
        return base(name)
    },
}


export default queue;

