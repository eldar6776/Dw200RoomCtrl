//build:20240524
//Koristi se za pojednostavljenje upotrebe protokola za komunikaciju pri slabom osvjetljenju gpioKey komponente. gpioKey je enkapsuliran u ovom workeru, a korisnik treba samo da se pretplati na događaj eventbus-a kako bi slušao gpioKey.
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