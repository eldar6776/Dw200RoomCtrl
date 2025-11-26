//build:20240524
// It is used to simplify the use of the low-light communication protocol of the gpioKey component. The gpioKey is encapsulated in this worker. The user only needs to subscribe to the event of eventbus to monitor the gpioKey.
import log from './dxLogger.js'
import gpioKey from './dxGpioKey.js'
import * as os from "os";
import std from './dxStd.js'
function run() {
    gpioKey.worker.beforeLoop()
    log.info('gpioKey start......')
    std.setInterval(() => {
        try {
            gpioKey.worker.loop()
        } catch (error) {
            log.error(error)
        }
    },10)
}

try {
    run()
} catch (error) {
    log.error(error)
}