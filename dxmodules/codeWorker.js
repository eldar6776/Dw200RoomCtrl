//build:20240304
//Koristi se za pojednostavljenje upotrebe 'code' komponente. 'code' je enkapsuliran u ovom workeru, a korisnik treba samo da se pretplati na događaj eventcentra kako bi primio skenirani sadržaj.
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