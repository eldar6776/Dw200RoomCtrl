//build:20240304
// It is used to simplify the use of the code component, encapsulate the code in this worker, and the user can receive the scanned content only by subscribing to the event of eventcenter
import log from './dxLogger.js'
import dxMap from './dxMap.js'
import * as os from "os";
import code from './dxCode.js'
import std from './dxStd.js'

const map = dxMap.get("default")
let options = map.get("__code__run_init")
let capturerOptions = options.capturer
let decoderOptions = options.decoder
function run() {
    code.worker.beforeLoop(capturerOptions, decoderOptions)
    log.info('code start......')
    std.setInterval(() => {
        try {
            code.worker.loop(options.mode, options.interval)
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