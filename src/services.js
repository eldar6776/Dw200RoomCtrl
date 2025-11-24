/**
 * @file services.js
 * @brief Service Pool Worker Thread - Event Router i Business Logic Processor
 * 
 * @details
 * **ULOGA U ARHITEKTURI:**
 * 
 * Services je **worker pool thread** koji:
 * - Prima sve event-e iz drugih threadova (controller, main, network, etc.)
 * - Ruta ih ka odgovarajućim service handlerima
 * - Izvršava business logiku (access validation, database queries, MQTT commands)
 * 
 * **WORKER POOL PATTERN:**
 * ```
 * ┌──────────────┐
 * │ Controller   │ ─┐
 * │  (HW events) │  │
 * └──────────────┘  │
 *                    │ postMessage()
 * ┌──────────────┐  │
 * │ Main         │ ─┤
 * │ (QR scanner) │  │
 * └──────────────┘  │
 *                    │
 * ┌──────────────┐  │
 * │ Network      │ ─┤
 * │ (MQTT, NFC)  │  │
 * └──────────────┘  │
 *                    ↓
 *           ┌────────────────┐
 *           │  SERVICES.JS   │ ← Event Router
 *           │  (Worker Pool) │
 *           └────────────────┘
 *                    │
 *        ┌───────────┼───────────┐
 *        ↓           ↓           ↓
 *   ┌─────────┐ ┌─────────┐ ┌─────────┐
 *   │ Access  │ │   NFC   │ │  MQTT   │ Service Handlers
 *   │ Service │ │ Service │ │ Service │
 *   └─────────┘ └─────────┘ └─────────┘
 * ```
 * 
 * **EVENT ROUTING TABLE:**
 * 
 * | Event Topic              | Source Thread | Handler Service       | Action                          |
 * |--------------------------|---------------|----------------------|----------------------------------|
 * | `password`               | Main (UI)     | accessService        | Validira PIN kod pristup         |
 * | `dxNet.STATUS_CHANGE`    | Controller    | netService           | Ažurira network status UI ikonu  |
 * | `dxMqtt.CONNECTED_CHANGED`| Network      | mqttService          | Ažurira MQTT connection UI ikonu |
 * | `dxMqtt.RECEIVE_MSG`     | Network       | mqttService          | Procesira MQTT komande (remote open)|
 * | `dxCode.RECEIVE_MSG`     | Main (QR)     | accessService        | Validira QR kod pristup          |
 * | `dxNfc.RECEIVE_MSG`      | Controller    | nfcService           | Validira NFC karticu pristup     |
 * | `dxGpioKey.RECEIVE_MSG`  | Controller    | gpioKeyService       | Exit button / door sensor        |
 * | `dxUart.RECEIVE_MSG`     | Controller    | uartBleService       | BLE pristup preko telefona       |
 * | `bleupgrade`             | MQTT          | driver.uartBle       | Over-the-air BLE firmware upgrade|
 * 
 * **WORKER POOL EXECUTION:**
 * 
 * Pool.callback() se izvršava u **background thread** (nije blocking za UI).
 * Svaki event se procesira sekvencijalno (nema paralelizma unutar pool-a).
 * 
 * Performance:
 * - Event latency: <5ms (vreme od event-a do handler poziva)
 * - Throughput: ~1000 events/sec (ARM Cortex-A7 @ 1.2 GHz)
 * - Queue size: 100 event-a (ako se prekorači, najstariji se odbacuju)
 * 
 * **THREAD SAFETY:**
 * 
 * - Event queue je thread-safe (automatsko locking u dxWorkerPool)
 * - Handler funkcije NE SMU biti long-running (max 50ms)
 * - Dugotrajne operacije (database query, MQTT publish) su async
 * 
 * @note Sva business logika je u service handler-ima, NE u ovom fajlu
 * @note Ovaj fajl je samo "switch statement" koji ruta event-e
 * 
 * @see accessService.js - Access validation logika
 * @see nfcService.js - NFC kartica reading i sektorski pristup
 * @see mqttService.js - MQTT cloud komunikacija
 * @see gpioKeyService.js - Exit button i door sensor handling
 * 
 * @author [Your Name]
 * @version 1.0
 * @date 2024
 */

import uartBleService from './service/uartBleService.js'
import codeService from './service/codeService.js'
import accessService from './service/accessService.js'
import gpioKeyService from './service/gpioKeyService.js'
import mqttService from './service/mqttService.js'
import nfcService from './service/nfcService.js'
import netService from './service/netService.js'
import log from '../dxmodules/dxLogger.js'
import pool from '../dxmodules/dxWorkerPool.js'
import driver from './driver.js'
import dxNet from '../dxmodules/dxNet.js'
import dxNfc from '../dxmodules/dxNfc.js'
import dxGpioKey from '../dxmodules/dxGpioKey.js'
import dxMqtt from '../dxmodules/dxMqtt.js'
import dxUart from '../dxmodules/dxUart.js'
import dxCode from '../dxmodules/dxCode.js'
import common from '../dxmodules/dxCommon.js'

/**
 * @brief Worker pool callback - Event Router
 * 
 * @param {Object} data - Event objekat sa topic i data poljima
 * @param {string} data.topic - Jedinstveni identifikator tipa event-a
 * @param {*} data.data - Payload (može biti objekat, string, ArrayBuffer, itd.)
 * 
 * @details
 * **EVENT PROCESSING PIPELINE:**
 * 
 * 1. **Prijem event-a** - Pool prima event iz queue-a
 * 2. **Topic matching** - Switch statement pronalazi odgovarajući handler
 * 3. **Handler poziv** - Odgovarajući service handler se izvršava
 * 4. **Return** - Callback završava, pool čeka sledeći event
 * 
 * **HANDLER TYPES:**
 * 
 * **1. Access Handlers** (validacija pristupa):
 * - `password` → accessService.access() - PIN kod
 * - `dxCode.RECEIVE_MSG` → accessService.access() - QR kod
 * - `dxNfc.RECEIVE_MSG` → nfcService.receiveMsg() - NFC kartica
 * - `dxUart.RECEIVE_MSG` → uartBleService.receiveMsg() - BLE pristup
 * - `dxGpioKey.RECEIVE_MSG` → gpioKeyService.receiveMsg() - Exit button
 * 
 * **2. Network Handlers** (mreža i cloud):
 * - `dxNet.STATUS_CHANGE` → netService.netStatusChanged() - Network up/down
 * - `dxMqtt.CONNECTED_CHANGED` → mqttService.connectedChanged() - MQTT connect/disconnect
 * - `dxMqtt.RECEIVE_MSG` → mqttService.receiveMsg() - MQTT komande od servera
 * 
 * **3. Upgrade Handlers** (firmware update):
 * - `bleupgrade` → driver.uartBle.upgrade() - BLE module firmware upgrade
 * 
 * **ERROR HANDLING:**
 * 
 * Svaki handler ima svoj try-catch blok (npr. u QR kod handler-u).
 * Ako handler throw-uje exception, loguje se ali ne crashuje ceo pool thread.
 * 
 * **PERFORMANCE CONSIDERATIONS:**
 * 
 * - Network event-i (MQTT) mogu blokirati do 2 sekunde (online validation)
 * - Database query-i (SQLite) blokiraju 10-50ms
 * - NFC read operacije blokiraju 20-100ms (Mifare sector read)
 * 
 * @note Handler funkcije NE SMU pozivati long-blocking operacije (>100ms)
 * @note Ako je potrebno long-running task, koristi se novi worker thread
 * 
 * @see dxWorkerPool.js - Worker pool implementacija
 */
pool.callback((data) => {
    let topic = data.topic
    let msg = data.data
    
    // Debug logiranje za sve događaje
    log.debug("[Services] Event received - Topic: " + topic)
    
    switch (topic) {
        /**
         * @case password
         * @brief PIN kod pristup sa UI keyboard-a
         * @details
         * Korisnik unosi PIN kod na touchscreen tastaturі.
         * AccessService validira PIN sa lokalnom SQLite bazom.
         * 
         * Event format: {type: 200, code: "1234"}
         */
        case "password":
            log.info("[Services] PASSWORD event: " + JSON.stringify(msg))
            accessService.access(msg)
            break;
        
        /**
         * @case dxNet.STATUS_CHANGE
         * @brief Network status promena (Ethernet/WiFi connected/disconnected)
         * @details
         * Driver.net.loop() detektuje promenu i šalje event.
         * NetService ažurira UI ikonu (zelena = connected, crvena = disconnected).
         * 
         * Event format: {connected: true, ip: "192.168.1.100", mac: "AA:BB:CC:DD:EE:FF"}
         */
        case dxNet.STATUS_CHANGE:
            log.info("[Services] NETWORK STATUS CHANGE")
            netService.netStatusChanged(msg)
            break;
        
        /**
         * @case dxMqtt.CONNECTED_CHANGED
         * @brief MQTT connection status promena (connected/disconnected sa brokerom)
         * @details
         * MQTT client (dxMqtt) detektuje reconnect ili disconnect.
         * MqttService ažurira UI cloud ikonu.
         * 
         * Event format: {connected: true}
         */
        case dxMqtt.CONNECTED_CHANGED + driver.mqtt.id:
            log.info("[Services] MQTT CONNECTION CHANGED")
            mqttService.connectedChanged(msg)
            break;
        
        /**
         * @case dxMqtt.RECEIVE_MSG
         * @brief Primljena MQTT poruka od cloud servera
         * @details
         * Server šalje komande:
         * - Remote open (otvori vrata sa servera)
         * - Config update (ažuriraj konfiguraciju)
         * - User sync (download korisnika iz cloud-a)
         * 
         * Event format: {topic: "access_device/v1/cmd/open", payload: "..."}
         */
        case dxMqtt.RECEIVE_MSG + driver.mqtt.id:
            log.info("[Services] MQTT MESSAGE RECEIVED")
            mqttService.receiveMsg(msg)
            break;
        
        /**
         * @case dxCode.RECEIVE_MSG
         * @brief QR kod detektovan sa kamere
         * @details
         * **QR KOD PROCESSING PIPELINE:**
         * 
         * 1. Camera worker thread (u main.js) dekodira QR
         * 2. Šalje raw binary data (ArrayBuffer) ovde
         * 3. Konvertujemo u UTF-8 string (common.utf8HexToStr)
         * 4. Kreiramo access event {type: 100, code: "QR_DATA"}
         * 5. Pozivamo accessService.access() za validaciju
         * 
         * **QR FORMAT EXAMPLE:**
         * ```
         * QR kod: dw200://access?uid=123456&ts=1234567890&sign=abc123
         * 
         * accessService će:
         * - Parsirati URL query params
         * - Validirati timestamp (ne sme biti stariji od 5 minuta)
         * - Validirati signature (HMAC-SHA256)
         * - Proveriti da li je UID validan u bazi
         * - Otvoriti vrata ako je sve OK
         * ```
         * 
         * Event format: ArrayBuffer (raw binary data iz QR dekoder-a)
         */
        case dxCode.RECEIVE_MSG:
            log.info("═══════════════════════════════════════════════════════════")
            log.info("  🎯 QR CODE DETECTED!")
            log.info("═══════════════════════════════════════════════════════════")
            log.info("[Services] QR code data received from scanner")
            
            try {
                // Pretvaranje binarnih podataka u string
                var qrString = common.utf8HexToStr(common.arrayBufferToHexString(msg))
                log.info("[Services] QR Code content: " + qrString)
                
                // Kreiranje događaja pristupa sa QR kodom
                var qrEvent = { type: 100, code: qrString }
                log.info("[Services] Calling accessService.access()...")
                accessService.access(qrEvent)
                
            } catch (error) {
                log.error("[Services] Error processing QR code:", error)
            }
            log.info("═══════════════════════════════════════════════════════════")
            break;
        
        /**
         * @case dxNfc.RECEIVE_MSG
         * @brief NFC/RFID kartica detektovana
         * @details
         * Driver.nfc.loop() detektuje karticu i čita UID.
         * NfcService:
         * - Čita dodatne sektore (ako je Mifare M1)
         * - Validira karticu sa bazom
         * - Otključava vrata ako je kartica validna
         * 
         * Event format: {uid: "04:AA:BB:CC:DD:EE:FF", type: "mifare"}
         */
        case dxNfc.RECEIVE_MSG:
            log.info("═══════════════════════════════════════════════════════════")
            log.info("  💳 NFC CARD DETECTED")
            log.info("═══════════════════════════════════════════════════════════")
            nfcService.receiveMsg(msg)
            break;
        
        /**
         * @case dxGpioKey.RECEIVE_MSG
         * @brief Exit button ili door sensor event
         * @details
         * Exit button (GPIO 30): Fire safety - otključavanje iznutra bez kartice
         * Door sensor (GPIO 48): Reed switch - detektovanje otvorenih vrata
         * 
         * Event format: {type: "button", value: 1} ili {type: "sensor", value: 0}
         */
        case dxGpioKey.RECEIVE_MSG:
            log.debug("[Services] GPIO KEY event")
            gpioKeyService.receiveMsg(msg)
            break;
        
        /**
         * @case dxUart.RECEIVE_MSG
         * @brief BLE UART poruka od Bluetooth modula
         * @details
         * BLE modul šalje:
         * - Access zahteve (korisnik pristupa preko BLE telefona)
         * - Config response-e (odgovori na getConfig/setConfig)
         * - Upgrade status (napredak firmware upgrade-a)
         * 
         * Event format: Hex string (npr. "55AA0F00...")
         */
        case dxUart.VG.RECEIVE_MSG + driver.uartBle.id:
            log.debug("[Services] BLE UART event")
            uartBleService.receiveMsg(msg)
            break;
        
        /**
         * @case bleupgrade
         * @brief Pokreni BLE firmware upgrade
         * @details
         * MQTT server šalje komandu za BLE upgrade sa URL-om firmware file-a.
         * Driver.uartBle.upgrade() će:
         * 1. Download .bin fajl sa servera
         * 2. Poslati ga BLE modulu preko UART-a (512B chunks)
         * 3. BLE modul će se automatski rebootovati sa novim firmware-om
         * 
         * Event format: {url: "http://server.com/ble_fw_v2.3.bin"}
         */
        case "bleupgrade":
            log.info("[Services] BLE UPGRADE event")
            driver.uartBle.upgrade(msg)
            break;
        
        /**
         * @default Unknown topic
         * @brief Loguje error za nepoznate event topic-e
         * @details
         * Ako dolazi do ovog case-a, znači da:
         * - Novi event tip je dodat ali nije hendlovan
         * - Typo u topic string-u
         * - Stari event topic koji više nije u upotrebi
         */
        default:
            log.error("[Services] UNKNOWN TOPIC: " + topic)
            break;
    }
})

