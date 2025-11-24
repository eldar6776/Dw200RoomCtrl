//build:20240525
//Koristi se za pojednostavljenje upotrebe protokola za komunikaciju pri slabom osvjetljenju 'net' komponente. 'net' je enkapsuliran u ovom workeru, a korisnik treba samo da se pretplati na događaj eventcenter-a kako bi slušao 'net'.
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
