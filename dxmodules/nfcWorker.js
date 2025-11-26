//build:20240524
// It is used to simplify the use of the low-light communication protocol of the NFC component. The NFC is encapsulated in this worker. The user only needs to subscribe to the event of the event center to monitor the NFC.
import log from './dxLogger.js'
import nfc from './dxNfc.js'
import dxMap from './dxMap.js'
import std from './dxStd.js'
import * as os from "os";
const map = dxMap.get('default')
const options = map.get("__nfc__run_init")

function run() {
    nfc.worker.beforeLoop(options)
    log.info('nfc start......')
    std.setInterval(() => {
        try {
            nfc.worker.loop(options)
        } catch (error) {
            log.error(error)
        }
    }, 10)
}

try {
    run()
} catch (error) {
    log.error(error)
}