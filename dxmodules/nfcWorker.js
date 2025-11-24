//build:20240524
//Koristi se za pojednostavljenje upotrebe protokola za komunikaciju pri slabom osvjetljenju NFC komponente. NFC je enkapsuliran u ovom workeru, a korisnik treba samo da se pretplati na događaj eventcenter-a kako bi slušao NFC.
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