import log from '../dxmodules/dxLogger.js'
import std from '../dxmodules/dxStd.js'
import driver from './driver.js'

function run() {
    initController()
    log.info("═══════════════════════════════════════════════════════════")
    log.info("  🔄 CONTROLLER MAIN LOOP STARTING")
    log.info("═══════════════════════════════════════════════════════════")
    
    std.setInterval(() => {
        try {
            driver.watchdog.feed("controller", 30 * 1000)
            loop()
        } catch (error) {
            log.error("[Controller] Error in main loop: " + error)
        }
    }, 5)
}

try {
    run()
} catch (error) {
    log.error(error)
}


function initController() {
    log.info("═══════════════════════════════════════════════════════════")
    log.info("  ⚙️ INITIALIZING CONTROLLER")
    log.info("═══════════════════════════════════════════════════════════")
    
    log.info("[Controller] Initializing GPIO...")
    driver.gpio.init()
    log.info("[Controller] Initializing GPIO Keys...")
    driver.gpiokey.init()
    log.info("[Controller] Initializing Watchdog...")
    driver.watchdog.init()
    log.info("[Controller] Initializing PWM (Buzzer)...")
    driver.pwm.init()
    log.info("[Controller] Initializing Audio...")
    driver.audio.init()
    log.info("[Controller] Initializing NFC...")
    driver.nfc.init()
    log.info("[Controller] Initializing NFC EID...")
    driver.nfc.eidInit()
    log.info("[Controller] Initializing Network...")
    driver.net.init()
    
    log.info("✅ [Controller] All components initialized")
    log.info("═══════════════════════════════════════════════════════════")
}


function loop() {
    driver.net.loop() //NOSONAR
    driver.nfc.loop()
    driver.gpiokey.loop()
    driver.ntp.loop()
    driver.mqtt.heartbeat()
}
