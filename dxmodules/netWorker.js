//build:20240525
// It is used to simplify the use of the low-light communication protocol of the net component. The net is encapsulated in this worker. The user only needs to subscribe to the event of event center to monitor the net.
import log from './dxLogger.js'
import net from './dxNet.js'
import dxMap from './dxMap.js'
import std from './dxStd.js'
const map = dxMap.get('default')
const options = map.get("__net__run_init")

function run() {
    net.worker.beforeLoop(options)
    log.info('net worker start......')
    std.setInterval (function() {
        try {
            net.worker.loop()
        } catch (error) {
            log.error(error)
        }
    },100)
}
try {
    run()
} catch (error) {
    log.error(error)
}
