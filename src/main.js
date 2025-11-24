/**
 * @file main.js
 * @description Glavna ulazna tačka aplikacije za DW200 sistem kontrole pristupa u hotelu
 * @version 2.0.2.3
 * @date 2025-11-23
 * 
 * @pregled
 * This is the main entry point that initializes all system components:
 * - Event Bus for inter-thread communication
 * - Worker threads for QR scanner, controller, and services
 * - Screen/UI management
 * - Database connectivity
 * - Hardware drivers (GPIO, NFC, UART, MQTT)
 * 
 * @architecture
 * Glavna nit:
 *   ├─ Screen UI (mainView, passwordView)
 *   ├─ Watchdog (keeps system alive)
 *   └─ Worker Threads:
 *       ├─ QR Scanner Worker (code.js)
 *       ├─ Controller Worker (controller.js)
 *       └─ Service Pool (services.js)
 */

import log from '../dxmodules/dxLogger.js'
import std from '../dxmodules/dxStd.js'
import config from '../dxmodules/dxConfig.js'
import pool from '../dxmodules/dxWorkerPool.js'
import bus from '../dxmodules/dxEventBus.js'
import screen from './screen.js'
import driver from './driver.js'
import sqlite from './service/sqliteService.js'
import testDataService from './service/testDataService.js'
import dxNet from '../dxmodules/dxNet.js'
import dxCode from '../dxmodules/dxCode.js'
import dxNfc from '../dxmodules/dxNfc.js'
import dxGpioKey from '../dxmodules/dxGpioKey.js'
import dxMqtt from '../dxmodules/dxMqtt.js'
import dxUart from '../dxmodules/dxUart.js'
import common from '../dxmodules/dxCommon.js'
import codeService from './service/codeService.js'
import dxNtp from '../dxmodules/dxNtp.js'

/**
 * Rukovatelj događaja QR koda
 * Called when QR code is detected by the scanner
 */
function QRCodeHandler(data) {
    log.info("═══════════════════════════════════════════════════════════")
    log.info("  🎯 QR CODE DETECTED!")
    log.info("═══════════════════════════════════════════════════════════")
    log.info("[Main] Raw QR data received from scanner")
    log.info("[Main] Data type: " + typeof data)
    log.info("[Main] Processing QR code...")
    
    try {
        // Pretvaranje binarnih podataka u string
        var str = common.utf8HexToStr(common.arrayBufferToHexString(data))
        log.info("[Main] QR Code content: " + str)
        
        // Pass to code service for processing
        codeService.code(str)
        
    } catch (error) {
        log.error("[Main] Error processing QR code:", error)
    }
}

/**
 * Teme događaja koje skup radnika sluša
 * @constant {Array<string>}
 */
let topics = [
    "bleupgrade",                                   // BLE firmware upgrade event
    dxCode.RECEIVE_MSG,                             // QR code scanned event
    "code",                                         // Manual code trigger
    "password",                                     // PIN password input event
    dxNfc.RECEIVE_MSG,                              // NFC/RFID card detected event
    dxGpioKey.RECEIVE_MSG,                          // GPIO button press event
    dxUart.VG.RECEIVE_MSG + driver.uartBle.id,      // BLE UART message event
    dxNet.STATUS_CHANGE,                            // Network status change event
    dxMqtt.CONNECTED_CHANGED + driver.mqtt.id,      // MQTT connection change event
    dxMqtt.RECEIVE_MSG + driver.mqtt.id             // MQTT message received event
]

/**
 * Inicijalizacija radnih niti i osnovnih servisa
 * 
 * @function startWorkers
 * @description Initializes all worker threads and services in the correct order:
 *   1. Configuration system
 *   2. UART BLE communication
 *   3. MQTT connectivity
 *   4. SQLite database
 *   5. QR Scanner worker (Event Bus)
 *   6. Test data (for development/testing)
 * 
 * @note Worker order is critical - config must be initialized first
 */
function startWorkers() {
    // Prvo inicijalizirajte konfiguraciju - druge komponente mogu trebati konfiguracijske vrijednosti
    driver.config.init()
    
    // Inicijalizirajte UART BLE i MQTT (mora biti u glavnoj niti)
    driver.uartBle.init()
    driver.mqtt.init()

    // Inicijalizirajte SQLite bazu podataka
    sqlite.init('/app/data/db/app.db')
    
    // === QR SCANNER SETUP (CRITICAL!) ===
    log.info("═══════════════════════════════════════════════════════════")
    log.info("  🎬 SETTING UP QR SCANNER")
    log.info("═══════════════════════════════════════════════════════════")
    
    // Korak 1: Kreiranje radne niti QR skenera
    log.info("[Main] Creating QR scanner worker...")
    try {
        bus.newWorker('qr_scanner', '/app/code/src/code.js')
        log.info("✅ [Main] QR scanner worker created")
    } catch (error) {
        log.error("❌ [Main] Failed to create QR scanner worker:", error)
    }
    
    // Korak 2: Registracija rukovatelja događaja za detekciju QR koda (KRITIČNO!)
    log.info("[Main] Registering QR code event handler...")
    bus.on(dxCode.RECEIVE_MSG, QRCodeHandler)
    log.info("✅ [Main] QR code handler registered")
    log.info("═══════════════════════════════════════════════════════════")
    
    // === NTP TIME SYNC SETUP ===
    log.info("═══════════════════════════════════════════════════════════")
    log.info("  ⏰ SETTING UP NTP TIME SYNC")
    log.info("═══════════════════════════════════════════════════════════")
    
    std.setTimeout(() => {
        try {
            const ntpServer = config.get("ntp.server") || "pool.ntp.org"
            const ntpInterval = config.get("ntp.interval") || 3600000 // 1 hour
            const ntpRetry = config.get("ntp.retryInterval") || 60000 // 1 minute
            
            log.info("[NTP] Server: " + ntpServer)
            log.info("[NTP] Sync interval: " + ntpInterval + "ms")
            log.info("[NTP] Retry interval: " + ntpRetry + "ms")
            log.info("[NTP] Starting time synchronization...")
            
            dxNtp.startSync(ntpServer, ntpInterval, ntpRetry)
            log.info("✅ [NTP] Time sync started")
        } catch (error) {
            log.error("❌ [NTP] Failed to start time sync:", error)
        }
    }, 2000) // Wait 2 seconds for network
    
    log.info("═══════════════════════════════════════════════════════════")
    
    // Inicijalizacija testnih podataka nakon 1 sekunde (omogućava sistemu da se stabilizuje)
    std.setTimeout(() => {
        testDataService.initTestData()
    }, 1000)
}

/**
 * Main application initialization (IIFE - Immediately Invoked Function Expression)
 *
 * @description Starts the entire application:
 *   1. Worker threads (QR scanner, UART, MQTT)
 *   2. Application version logging
 *   3. Screen/UI initialization
 *   4. Controller worker (hardware management)
 *   5. Service pool (event handling)
 *   6. Auto-restart scheduler (optional)
 */
(function () {
    startWorkers()
    
    const appVersion = 'dw200_v10_access_v2.0.2.3'
    config.setAndSave('sysInfo.appVersion', appVersion)
    log.info("=================== version:" + appVersion + " ====================")

    // Inicijalizacija korisničkog interfejsa ekrana
    screen.init()
    
    // Kreiranje radnika kontrolera (upravlja hardverskim komponentama)
    bus.newWorker('controller', '/app/code/src/controller.js')
    
    // Inicijalizacija skupa radnika za rukovanje događajima (3 radnika, veličina reda 100)
    pool.init('/app/code/src/services.js', bus, topics, 3, 100)
    
    // Inicijalizacija planera automatskog ponovnog pokretanja ako je omogućeno u konfiguraciji
    if (config.get("sysInfo.autoRestart") || -1 != -1) {
        driver.autoRestart.init()
    }
    
    /**
     * @napomena Web Test Server (Zasebna aplikacija)
     * Run it with: node test_server_nodejs.js
     * Provides web interface on http://localhost:8080 for:
     *   - Dodavanje QR kodova, RFID kartica, PIN kodova u bazu podataka
     *   - Testing access control without physical hardware
     */
})();

/**
 * Main event loop (runs every 5ms)
 * 
 * @description Keeps the main thread alive and performs critical tasks:
 *   - Feeds the watchdog to prevent system reboot
 *   - Updates the screen UI
 * 
 * @interval 5ms
 * @throws {Error} Logs error if watchdog or screen update fails
 */
std.setInterval(() => {
    try {
        // Hranjenje watchdog-a da se spriječi ponovno pokretanje sistema (vremensko ograničenje od 30 sekundi)
        driver.watchdog.feed("main", 30 * 1000)
        driver.watchdog.loop()
        
        // Ažuriranje korisničkog interfejsa ekrana
        screen.loop()
    } catch (error) {
        log.error(error)
    }
}, 5)

// std.setInterval(() => {
//     common.systemBrief("free -b && uptime")
// }, 4000)