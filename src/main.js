/**
 * @file main.js
 * @brief Glavna ulazna tačka aplikacije za DW200 sistem kontrole pristupa u hotelu
 * @version 2.0.2.3
 * @date 2025-11-23
 * @author Eldar Dedić (eldar6776)
 * 
 * @section pregled PREGLED SISTEMA
 * Ovaj fajl predstavlja srce aplikacije - glavnu ulaznu tačku koja pokreće i koordinira
 * sve komponente DW200 sistema kontrole pristupa. Sistem je dizajniran kao multi-threaded
 * aplikacija gdje svaka važna funkcionalnost radi u vlastitoj niti (worker thread).
 * 
 * @subsection komponente KLJUČNE KOMPONENTE
 * 
 * 1. **Event Bus (dxEventBus)**
 *    - Omogućava komunikaciju između niti (threads) bez direktnih referenci
 *    - Publish/Subscribe pattern - niti šalju događaje (events) koje druge niti slušaju
 *    - Primer: QR skener detektuje kod → šalje event → Service worker obrađuje
 * 
 * 2. **Worker Threads (Radne niti)**
 *    - **QR Scanner Worker** (code.js) - Kontinuirano skenira QR kodove sa kamere
 *    - **Controller Worker** (controller.js) - Upravlja hardverom (GPIO, NFC, Watchdog)
 *    - **Service Pool** (services.js) - Pool od 3 worker-a za obradu događaja pristupa
 * 
 * 3. **Screen/UI (screen.js)**
 *    - Upravlja prikazom na ekranu (LVGL biblioteka)
 *    - Prikazuje poruke dobrodošlice, greške, statusne indikatore
 * 
 * 4. **Drivers (driver.js)**
 *    - Hardverski drajveri: GPIO (relej), NFC (čitač kartica), UART (Bluetooth), MQTT
 * 
 * 5. **Database (SQLite)**
 *    - Lokalna baza podataka sa ovlašćenjima (permissions), zapisima pristupa (access logs)
 * 
 * @section architecture ARHITEKTURA APLIKACIJE
 * 
 * ```
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │                         GLAVNA NIT (Main Thread)                    │
 * │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
 * │  │   Screen UI  │  │  Watchdog    │  │  Main Event Loop (5ms)   │  │
 * │  │  (LVGL GUI)  │  │  (30s feed)  │  │  - Feed watchdog         │  │
 * │  └──────────────┘  └──────────────┘  │  - Update screen         │  │
 * │                                        └──────────────────────────┘  │
 * └─────────────────────────────────────────────────────────────────────┘
 *                                  │
 *                        Event Bus (dxEventBus)
 *                                  │
 *    ┌─────────────────────────────┼─────────────────────────────────┐
 *    │                             │                                 │
 * ┌──▼──────────────┐   ┌─────────▼──────────┐   ┌─────────────────▼────┐
 * │  QR Scanner     │   │  Controller Worker  │   │  Service Pool (3x)   │
 * │  Worker Thread  │   │  Worker Thread      │   │  Worker Threads      │
 * │                 │   │                     │   │                      │
 * │ - Kamera /dev/  │   │ - GPIO Init & Loop  │   │ - accessService      │
 * │   video11       │   │ - NFC Reader        │   │ - mqttService        │
 * │ - QR Decoder    │   │ - Watchdog Feed     │   │ - nfcService         │
 * │ - 5ms loop      │   │ - Network           │   │ - codeService        │
 * │                 │   │ - 5ms loop          │   │ - Event handling     │
 * └─────────────────┘   └─────────────────────┘   └──────────────────────┘
 * ```
 * 
 * @section lifecycle ŽIVOTNI CIKLUS APLIKACIJE
 * 
 * **1. INICIJALIZACIJA (Startup)**
 * ```
 * startWorkers() → Inicijalizuje sve komponente:
 *   ├─ Config Service (učitavanje konfiguracije iz JSON fajla)
 *   ├─ UART BLE (Bluetooth modul na /dev/ttyS5)
 *   ├─ MQTT Client (veza sa cloud serverom)
 *   ├─ SQLite Database (lokalna baza podataka)
 *   ├─ QR Scanner Worker (kreira novu nit za skeniranje)
 *   └─ NTP Time Sync (sinhronizacija vremena sa NTP serverom)
 * ```
 * 
 * **2. KREIRANJE WORKER NITI**
 * ```
 * bus.newWorker('qr_scanner', '/app/code/src/code.js')
 *   → Kreira novu JavaScript nit koja izvršava code.js
 *   → QR skener radi u beskonačnoj petlji i detektuje kodove
 * ```
 * 
 * **3. REGISTRACIJA EVENT HANDLER-A**
 * ```
 * bus.on(dxCode.RECEIVE_MSG, QRCodeHandler)
 *   → Kada QR skener detektuje kod, poziva se QRCodeHandler funkcija
 *   → Handler konvertuje binarne podatke u string i prosleđuje codeService
 * ```
 * 
 * **4. INICIJALIZACIJA UI-a**
 * ```
 * screen.init() → Kreira LVGL korisni interface:
 *   ├─ mainView (glavni ekran sa statusom)
 *   ├─ passwordView (ekran za unos PIN koda)
 *   └─ popWin (popup prozori za poruke)
 * ```
 * 
 * **5. POKRETANJE KONTROLERA**
 * ```
 * bus.newWorker('controller', '/app/code/src/controller.js')
 *   → Kontroler inicijalizuje hardver (GPIO, NFC, Watchdog)
 *   → Radi u 5ms petlji i čita stanje hardvera
 * ```
 * 
 * **6. POKRETANJE SERVICE POOL-a**
 * ```
 * pool.init('/app/code/src/services.js', bus, topics, 3, 100)
 *   → Kreira 3 worker niti za obradu događaja
 *   → Red čekanja od 100 događaja
 *   → Svaki worker obrađuje događaje sa liste topics
 * ```
 * 
 * **7. GLAVNA PETLJA (Main Loop)**
 * ```
 * std.setInterval(() => {
 *   watchdog.feed("main", 30000)  → Hrani watchdog da spreči reboot
 *   watchdog.loop()                → Proverava stanje watchdog-a
 *   screen.loop()                  → Ažurira UI (LVGL handler)
 * }, 5)
 * ```
 * 
 * @section workflow TOK PODATAKA - PRIMER: QR KOD SKENIRANJE
 * 
 * ```
 * 1. QR Scanner Worker (code.js)
 *    │ Kamera detektuje QR kod
 *    │ Dekoder parsira sliku → dobija string (npr. "GUEST_12345")
 *    │
 *    ▼ Šalje event
 * 
 * 2. Event Bus (dxEventBus)
 *    │ Topic: dxCode.RECEIVE_MSG
 *    │ Data: ArrayBuffer (binarne podatke)
 *    │
 *    ▼ Obaveštava sve pretplatnike (subscribers)
 * 
 * 3. Main Thread (main.js)
 *    │ QRCodeHandler funkcija prima podatke
 *    │ Konvertuje: ArrayBuffer → Hex → UTF-8 String
 *    │ Poziva: codeService.code(str)
 *    │
 *    ▼ Event se prosleđuje dalje
 * 
 * 4. Service Pool (services.js)
 *    │ Worker prima event sa istim topic-om
 *    │ Switch statement → dxCode.RECEIVE_MSG case
 *    │ Poziva: accessService.access({type: 100, code: "GUEST_12345"})
 *    │
 *    ▼ Obrada pristupa
 * 
 * 5. Access Service (accessService.js)
 *    │ Proverava da li je kod u SQLite bazi
 *    │ Validira vremenska ograničenja
 *    │ Ako je OK → Otvori vrata (GPIO relej)
 *    │ Ako nije → Prikaži grešku
 *    │
 *    ▼ Feedback korisniku
 * 
 * 6. Screen (screen.js)
 *    │ Prikaži poruku "Dobrodošli" ili "Pristup odbijen"
 *    │ Audio feedback (uspeh.wav ili greska.wav)
 *    │ Buzzer (pištaljka) - kratki "beep" ili dug "buzz"
 *    │
 *    ▼ Logovanje
 * 
 * 7. SQLite Database
 *    │ Snimi log pristupa: vreme, tip, kod, rezultat
 *    │ Prijavi na MQTT server (cloud)
 *    └─ Ažuriraj statistiku
 * ```
 * 
 * @section topics LISTA DOGAĐAJA (Event Topics)
 * 
 * Aplikacija sluša sledeće događaje koji se šalju kroz Event Bus:
 * 
 * | Topic                          | Izvor             | Opis                                    |
 * |--------------------------------|-------------------|-----------------------------------------|
 * | `bleupgrade`                   | MQTT Service      | Zahtev za nadogradnju Bluetooth modula  |
 * | `dxCode.RECEIVE_MSG`           | QR Scanner Worker | QR kod je skeniran                      |
 * | `code`                         | Manual Trigger    | Ručno pokretanje skeniranja             |
 * | `password`                     | Password View     | Korisnik uneo PIN kod                   |
 * | `dxNfc.RECEIVE_MSG`            | NFC Driver        | NFC kartica detektovana                 |
 * | `dxGpioKey.RECEIVE_MSG`        | GPIO Driver       | Pritisnuto dugme na hardveru            |
 * | `dxUart.VG.RECEIVE_MSG + id`   | UART Driver       | Primljena poruka sa Bluetooth modula    |
 * | `dxNet.STATUS_CHANGE`          | Network Driver    | Promena statusa mrežne veze             |
 * | `dxMqtt.CONNECTED_CHANGED + id`| MQTT Driver       | Promena statusa MQTT veze               |
 * | `dxMqtt.RECEIVE_MSG + id`      | MQTT Driver       | Primljena MQTT poruka sa servera        |
 * 
 * @section hardware HARDVERSKI RESURSI
 * 
 * **GPIO Pinovi:**
 * - GPIO 105: Relej za otvaranje vrata (OUTPUT)
 * 
 * **PWM:**
 * - Kanal 4: Buzzer/pištaljka za zvučne signale
 * 
 * **UART:**
 * - /dev/ttyS5: Bluetooth Low Energy (BLE) modul (921600 baud, 8N1)
 * 
 * **Video:**
 * - /dev/video11: USB kamera za QR skeniranje (800x600 rezolucija)
 * 
 * **NFC:**
 * - Mifare Classic M1 čitač kartica (ISO 14443A)
 * 
 * **Network:**
 * - Ethernet: Statička ili DHCP konfiguracija
 * - MQTT: TCP veza sa cloud serverom
 * - NTP: Sinhronizacija vremena (pool.ntp.org)
 * 
 * @section database STRUKTURA BAZE PODATAKA
 * 
 * **SQLite baza:** `/app/data/db/app.db`
 * 
 * **Tabele:**
 * 1. `permissions` - Ovlašćenja za pristup (QR kodovi, NFC kartice, PIN-ovi)
 * 2. `access_records` - Zapisi o pokušajima pristupa (uspešni i neuspešni)
 * 3. `security_keys` - Ključevi za enkripciju (AES, RSA)
 * 
 * @section configuration KONFIGURACIJA
 * 
 * **Fajl:** `/app/data/config/config.json`
 * 
 * Glavni parametri:
 * - `sysInfo.sn`: Serijski broj uređaja (UUID)
 * - `sysInfo.deviceName`: Ime uređaja (npr. "Room 505")
 * - `mqttInfo.mqttAddr`: Adresa MQTT servera
 * - `netInfo.ip`: IP adresa uređaja
 * - `doorInfo.openTime`: Vreme držanja releja (ms)
 * 
 * @warning KRITIČNO: Watchdog Timer
 * Aplikacija MORA pozvati `watchdog.feed()` svakih 30 sekundi, inače će se
 * sistem automatski restartovati. Ovo je sigurnosna mera protiv "zamrzavanja".
 * 
 * @note Performance
 * Glavna petlja radi na 5ms (200 FPS), što omogućava brz odziv na korisničke akcije.
 * 
 * @see controller.js - Hardverska kontrola
 * @see services.js - Obrada događaja
 * @see screen.js - Korisnički interfejs
 * @see driver.js - Hardverski drajveri
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
 * @brief QR Kod Event Handler - Obrađuje detektovane QR kodove
 * @details
 * Ova funkcija je callback koji se automatski poziva kada QR scanner worker
 * detektuje QR kod pomoću kamere. Podaci stižu kao ArrayBuffer (niz bajtova)
 * i moraju se konvertovati u čitljiv string.
 * 
 * @section workflow TOK OBRADE QR KODA
 * ```
 * 1. QR Scanner Worker (code.js) skenira kameru → detektuje QR kod
 * 2. Scanner šalje event sa topic-om: dxCode.RECEIVE_MSG
 * 3. Event Bus poziva ovu funkciju kao handler
 * 4. Funkcija konvertuje binarne podatke (ArrayBuffer) → String
 * 5. String se prosleđuje codeService.code() za dalju obradu
 * ```
 * 
 * @param {ArrayBuffer} data - Sirovi binarni podaci QR koda
 *                             Format: ArrayBuffer → Uint8Array bajtova
 *                             Primer: [0x48, 0x65, 0x6C, 0x6C, 0x6F] = "Hello"
 * 
 * @subsection konverzija PROCES KONVERZIJE PODATAKA
 * ```javascript
 * // Korak 1: ArrayBuffer → Hex String
 * // [0x48, 0x65, 0x6C, 0x6C, 0x6F] → "48656C6C6F"
 * let hexString = common.arrayBufferToHexString(data)
 * 
 * // Korak 2: Hex String → UTF-8 String
 * // "48656C6C6F" → "Hello"
 * let str = common.utf8HexToStr(hexString)
 * ```
 * 
 * @note Event Registration
 * Handler se registruje u startWorkers() funkciji:
 * ```javascript
 * bus.on(dxCode.RECEIVE_MSG, QRCodeHandler)
 * ```
 * 
 * @warning Thread Safety
 * Ova funkcija se poziva iz glavne niti (main thread), ali podaci dolaze
 * iz QR scanner worker niti. Event Bus automatski hendluje sinhronizaciju.
 * 
 * @see codeService.code() - Dalja obrada QR koda
 * @see startWorkers() - Gde se registruje ovaj handler
 * 
 * @throws {Error} Ako konverzija podataka ne uspe (npr. nevažeći UTF-8)
 */
function QRCodeHandler(data) {
    // ASCII art header za vizuelno označavanje u log fajlu
    log.info("═══════════════════════════════════════════════════════════")
    log.info("  🎯 QR CODE DETECTED!")
    log.info("═══════════════════════════════════════════════════════════")
    log.info("[Main] Raw QR data received from scanner")
    log.info("[Main] Data type: " + typeof data)  // Očekujemo: "object" (ArrayBuffer)
    log.info("[Main] Processing QR code...")
    
    try {
        /**
         * @step 1: Konverzija ArrayBuffer → String
         * 
         * Primer toka podataka:
         * 1. Kamera detektuje QR kod sa tekstom "ROOM_505_KEY_ABC123"
         * 2. QR dekoder vraća bajt niz: [0x52, 0x4F, 0x4F, 0x4D, ...]
         * 3. arrayBufferToHexString konvertuje u hex: "524F4F4D..."
         * 4. utf8HexToStr konvertuje u string: "ROOM_505_KEY_ABC123"
         */
        var str = common.utf8HexToStr(common.arrayBufferToHexString(data))
        log.info("[Main] QR Code content: " + str)
        
        /**
         * @step 2: Prosleđivanje Code Service-u
         * 
         * codeService.code() će:
         * - Parsirati format koda (access, config, eid)
         * - Validirati kod u bazi podataka
         * - Pozvati accessService ako je access kod
         * - Izvršiti konfiguraciju ako je config kod
         */
        codeService.code(str)
        
    } catch (error) {
        // Obrada greške - npr. ako QR kod sadrži nevažeće UTF-8 karaktere
        log.error("[Main] Error processing QR code:", error)
    }
}

/**
 * @brief Lista Event Topics za Worker Pool
 * @details
 * Ova lista definiše sve događaje (events) koje Service Worker Pool sluša i obrađuje.
 * Svaki topic predstavlja određenu vrstu događaja koja se može desiti u sistemu.
 * 
 * @section topics_struktura STRUKTURA TOPICS-a
 * 
 * Topics se dele u nekoliko kategorija:
 * 
 * **1. UPGRADE EVENTS**
 * - `bleupgrade` - Zahtev za nadogradnju Bluetooth firmware-a preko UART-a
 * 
 * **2. ACCESS EVENTS (Događaji pristupa)**
 * - `dxCode.RECEIVE_MSG` - QR kod skeniran kamerom
 * - `code` - Ručno pokretanje QR scan-a (iz UI-ja)
 * - `password` - PIN kod unet preko tastature na ekranu
 * - `dxNfc.RECEIVE_MSG` - NFC/RFID kartica detektovana čitačem
 * 
 * **3. HARDWARE EVENTS**
 * - `dxGpioKey.RECEIVE_MSG` - GPIO dugme pritisnuto (fizičko dugme na uređaju)
 * - `dxUart.VG.RECEIVE_MSG + driver.uartBle.id` - UART poruka od BLE modula
 * 
 * **4. NETWORK EVENTS**
 * - `dxNet.STATUS_CHANGE` - Mrežna veza se promenila (connect/disconnect)
 * - `dxMqtt.CONNECTED_CHANGED + driver.mqtt.id` - MQTT veza promenjena
 * - `dxMqtt.RECEIVE_MSG + driver.mqtt.id` - MQTT poruka primljena sa cloud servera
 * 
 * @subsection worker_pool KO OBRAĐUJE OVE EVENTS?
 * 
 * Worker Pool (inicijalizovan u main funkciji) kreira 3 worker niti:
 * ```javascript
 * pool.init('/app/code/src/services.js', bus, topics, 3, 100)
 * //        ^                             ^    ^      ^  ^
 * //        Worker code fajl              |    |      |  Queue size (100 events)
 * //                                      |    |      Number of workers (3)
 * //                                      |    Topics to subscribe
 * //                                      Event Bus instance
 * ```
 * 
 * Svaki worker izvršava services.js kod i sluša sve topics iz ove liste.
 * Kada stigne event sa jednim od ovih topics, worker ga preuzima iz reda
 * i poziva odgovarajući service handler (u services.js switch statement).
 * 
 * @note Performanse
 * 3 worker niti omogućavaju paralelnu obradu događaja. Ako stigne 3 QR koda
 * istovremeno, svaki worker će obraditi po jedan, bez čekanja.
 * 
 * @warning Topic Naming
 * Neki topics se dinamički grade (+ driver.mqtt.id), što znači da će
 * finalni topic biti npr: "dxMqtt.RECEIVE_MSG_mqtt1"
 * 
 * @see services.js - Gde se ovi eventi obrađuju
 * @see pool.init() - Kako se workers inicijalizuju
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
 * @brief Inicijalizuje sve radne niti (workers) i servisne komponente
 * @details
 * Ova funkcija je ključna za pokretanje aplikacije. Ona inicijalizuje sve potrebne
 * komponente sistema u određenom redosledu kako bi obezbedila pravilno funkcionisanje.
 * 
 * @section startup_sequence REDOSLED POKRETANJA
 * 
 * **FAZA 1: Osnovni sistemi**
 * ```
 * 1. Config Service → Učitava /app/data/config/config.json
 *    - Serijski broj (SN/UUID)
 *    - IP adresa
 *    - MQTT kredencijali
 *    - UI podešavanja
 * ```
 * 
 * **FAZA 2: Komunikacioni moduli**
 * ```
 * 2. UART BLE → Inicijalizuje Bluetooth modul
 *    - Port: /dev/ttyS5
 *    - Baudrate: 921600
 *    - Format: 8N1 (8 data bits, No parity, 1 stop bit)
 * 
 * 3. MQTT Client → Konektuje se na cloud server
 *    - Topic prefix: "access_device/v1/"
 *    - QoS: 1 (At least once delivery)
 *    - Keep-alive: 60s
 * ```
 * 
 * **FAZA 3: Lokalna baza podataka**
 * ```
 * 4. SQLite Database → Otvara /app/data/db/app.db
 *    Tabele:
 *    - d1_permission: Ovlašćenja za pristup (QR kodovi, kartice, PIN-ovi)
 *    - d1_pass_record: Zapisi pristupa (history)
 *    - d1_security: Ključevi za enkripciju
 * ```
 * 
 * **FAZA 4: QR Scanner Worker (KRITIČNO!)**
 * ```
 * 5. QR Scanner Worker Thread
 *    a) Kreira novu radnu nit: bus.newWorker('qr_scanner', '/app/code/src/code.js')
 *    b) Worker inicijalizuje kameru (/dev/video11)
 *    c) Worker pokreće dekoder (800x600 rezolucija)
 *    d) Registruje QRCodeHandler na Event Bus
 *    e) Počinje kontinuirano skeniranje (5ms loop)
 * 
 *    VAŽNO: Handler MORA biti registrovan nakon kreiranja worker-a!
 *    bus.on(dxCode.RECEIVE_MSG, QRCodeHandler)
 * ```
 * 
 * **FAZA 5: NTP Time Sync**
 * ```
 * 6. NTP Client → Sinhronizuje sistemsko vreme
 *    - Server: pool.ntp.org (default) ili custom iz config-a
 *    - Interval: 1h (default)
 *    - Retry interval: 1min
 *    - Delay: 2s (čeka da se mrežna veza uspostavi)
 * ```
 * 
 * **FAZA 6: Test podaci (opciono)**
 * ```
 * 7. Test Data Service → Ubacuje testne QR kodove/kartice u bazu
 *    - Delay: 1s (omogućava sistemu da se stabilizuje)
 *    - Samo ako je omogućeno u konfiguraciji
 * ```
 * 
 * @subsection timing VREMENSKI DIJAGRAM
 * ```
 * t=0ms     Config Init
 *           │
 * t=10ms    UART BLE Init
 *           │
 * t=20ms    MQTT Init (connection start)
 *           │
 * t=30ms    SQLite Init
 *           │
 * t=50ms    QR Scanner Worker Created
 *           ├─ Camera init
 *           ├─ Decoder init
 *           └─ Loop started
 * t=60ms    QR Handler Registered ← KRITIČNO!
 *           │
 * t=2000ms  NTP Sync Started (čeka mrežu)
 *           │
 * t=3000ms  Test Data Init (opciono)
 * ```
 * 
 * @note Redosled je bitan!
 * Worker mora biti kreiran PRE registracije handler-a, inače će
 * prvi QR kodovi biti propušteni jer nema ko da ih obradi.
 * 
 * @warning Thread Safety
 * bus.newWorker() kreira novu OS nit (pthread), što znači da QR scanner
 * radi potpuno nezavisno od glavne niti. Event Bus hendluje sinhronizaciju.
 * 
 * @see QRCodeHandler() - Handler koji prima QR kodove
 * @see code.js - QR scanner worker kod
 * @see driver.js - Hardverski drajveri
 */
function startWorkers() {

        driver.config.init()
        
            driver.uartBle.init()
            driver.mqtt.init()
      
                // Inicijalizirajte SQLite bazu podataka
        
                sqlite.init('/app/data/db/app.db')        
                
        
                // === QR SCANNER SETUP (CRITICAL!) ===
        
                log.info("═══════════════════════════════════════════════════════════")
    log.info("  🎬 SETTING UP QR SCANNER")
    log.info("═══════════════════════════════════════════════════════════")
    
    /**
     * @step 1: Kreiranje radne niti za QR skener
     * 
     * bus.newWorker() kreira novu JavaScript radnu nit koja izvršava code.js fajl.
     * Ova nit radi potpuno nezavisno od glavne niti i kontinuirano skenira kameru.
     * 
     * Argumenti:
     * - 'qr_scanner': Jedinstveni ID niti (koristi se za logovanje i debug)
     * - '/app/code/src/code.js': Apsolutna putanja do JavaScript fajla koji se izvršava
     * 
     * Šta code.js radi:
     * 1. Inicijalizuje /dev/video11 kameru (USB ili embedded)
     * 2. Konfigurira QR dekoder (ZBar ili sličan)
     * 3. Pokreće beskonačnu petlju (5ms interval) koja:
     *    - Čita frame sa kamere
     *    - Dekodira QR kod (ako postoji)
     *    - Šalje event sa detektovanim kodom
     */
    log.info("[Main] Creating QR scanner worker...")
    try {
        bus.newWorker('qr_scanner', '/app/code/src/code.js')
        log.info("✅ [Main] QR scanner worker created")
    } catch (error) {
        log.error("❌ [Main] Failed to create QR scanner worker:", error)
    }
    
    /**
     * @step 2: Registracija event handler-a (KRITIČNO!)
     * 
     * Ovo je NAJVAŽNIJI DEO - povezuje QR scanner worker sa obradom koda.
     * 
     * bus.on(topic, callback):
     * - topic: dxCode.RECEIVE_MSG - konstanta koja predstavlja "QR kod detektovan" event
     * - callback: QRCodeHandler - funkcija koja se poziva kada event stigne
     * 
     * Kada QR scanner worker detektuje kod, on poziva:
     * ```javascript
     * bus.fire(dxCode.RECEIVE_MSG, qrData)
     * ```
     * 
     * Event Bus automatski poziva sve registrovane handler-e za taj topic.
     * U ovom slučaju, poziva se QRCodeHandler(qrData).
     * 
     * VAŽNO: Handler MORA biti registrovan nakon kreiranja worker-a,
     * jer inače worker može poslati event PRE nego što je handler spreman.
     */
    log.info("[Main] Registering QR code event handler...")
    bus.on(dxCode.RECEIVE_MSG, QRCodeHandler)
    log.info("✅ [Main] QR code handler registered")
    log.info("═══════════════════════════════════════════════════════════")
    
    // === NTP TIME SYNC SETUP ===
    log.info("═══════════════════════════════════════════════════════════")
    log.info("  ⏰ SETTING UP NTP TIME SYNC")
    log.info("═══════════════════════════════════════════════════════════")
    
    /**
     * @subsection ntp_setup NTP Sinhronizacija Vremena
     * 
     * std.setTimeout() odlaže izvršavanje koda za 2000ms (2 sekunde).
     * Zašto odlaganje?
     * - Mrežna veza (Ethernet/WiFi) treba vreme da se uspostavi
     * - DHCP može trebati nekoliko sekundi da dodeli IP adresu
     * - NTP server zahteva funkcionalan network stack
     * 
     * Ako pokrenemo NTP odmah, connection će failovati jer mreža nije spremna.
     */
    std.setTimeout(() => {
        try {
            // Učitavanje NTP konfiguracije iz config.json
            const ntpServer = config.get("ntp.server") || "pool.ntp.org"
            const ntpInterval = config.get("ntp.interval") || 3600000 // 1 hour = 3600000ms
            const ntpRetry = config.get("ntp.retryInterval") || 60000 // 1 minute = 60000ms
            
            log.info("[NTP] Server: " + ntpServer)
            log.info("[NTP] Sync interval: " + ntpInterval + "ms")
            log.info("[NTP] Retry interval: " + ntpRetry + "ms")
            log.info("[NTP] Starting time synchronization...")
            
            /**
             * dxNtp.startSync() pokreće NTP klijent u pozadini.
             * 
             * Parametri:
             * - ntpServer: Adresa NTP servera (pool.ntp.org je public NTP pool)
             * - ntpInterval: Koliko često sinhronizovati (default 1h)
             * - ntpRetry: Koliko brzo pokušati ponovo ako ne uspe (default 1min)
             * 
             * NTP protokol:
             * 1. Šalje UDP paket na port 123
             * 2. Prima odgovor sa trenutnim vremenom
             * 3. Postavlja sistemsko vreme: `date -s "YYYY-MM-DD HH:MM:SS"`
             */
            dxNtp.startSync(ntpServer, ntpInterval, ntpRetry)
            log.info("✅ [NTP] Time sync started")
        } catch (error) {
            log.error("❌ [NTP] Failed to start time sync:", error)
        }
    }, 2000) // Wait 2 seconds for network
    
    log.info("═══════════════════════════════════════════════════════════")
    
    /**
     * @subsection test_data Inicijalizacija Test Podataka
     * 
     * DISABLED: Test data initialization is now disabled.
     * All credentials must be managed via SQLite database through the web interface.
     * 
     * Previous behavior:
     * - testDataService.initTestData() inserted test QR codes and PIN codes
     * - This was useful for testing but interfered with production database management
     * 
     * Production mode:
     * - Use web interface at http://localhost:3000 to manage credentials
     * - Add QR codes (type 100) and PIN codes (type 300) via API
     * - Delete credentials via web UI or API endpoints
     */
    // std.setTimeout(() => {
    //     testDataService.initTestData()
    // }, 1000)
}

/**
 * @brief Glavna funkcija inicijalizacije aplikacije (IIFE)
 * @details
 * Ovo je IIFE (Immediately Invoked Function Expression) - funkcija koja se
 * izvršava čim se učita. To je entry point koji pokreće celu aplikaciju.
 * 
 * @section iife_pattern IIFE Pattern Objašnjenje
 * 
 * Sintaksa:
 * ```javascript
 * (function () {
 *     // Kod koji se odmah izvršava
 * })();
 * ```
 * 
 * Zašto IIFE?
 * 1. **Scope Isolation** - Varijable unutar funkcije ne "cure" u globalni scope
 * 2. **Initialization** - Kod se izvršava jednom, na startu
 * 3. **Clean Code** - Jasno odvaja initialization od runtime koda
 * 
 * @section init_sequence SEKVENCA INICIJALIZACIJE
 * 
 * **1. Pokretanje Worker-a**
 * ```
 * startWorkers() → Inicijalizuje:
 *   - Config service
 *   - UART BLE
 *   - MQTT client
 *   - SQLite database
 *   - QR scanner worker
 *   - NTP sync
 *   - Test data (optional)
 * ```
 * 
 * **2. Verzija Aplikacije**
 * ```
 * const appVersion = 'dw200_v10_access_v2.0.2.3'
 * config.setAndSave('sysInfo.appVersion', appVersion)
 * 
 * Verzija se čuva u config.json i koristi se za:
 * - Prijavljivanje na MQTT server (server zna koja verzija radi)
 * - OTA updates (provera da li je nova verzija dostupna)
 * - Debug (logovi sadrže verziju)
 * ```
 * 
 * **3. Screen Inicijalizacija**
 * ```
 * screen.init() → Kreira LVGL UI:
 *   ├─ mainView: Glavni ekran (status, vreme, poruke)
 *   ├─ passwordView: Ekran za unos PIN koda
 *   └─ popWin: Popup prozori (greške, uspeh, upozorenja)
 * 
 * UI je bazirano na LVGL (Light and Versatile Graphics Library):
 * - Hardverski akcelerisano (DMA)
 * - Touch screen podrška
 * - Custom font podrška (TTF)
 * ```
 * 
 * **4. Controller Worker**
 * ```
 * bus.newWorker('controller', '/app/code/src/controller.js')
 * 
 * Controller worker inicijalizuje i upravlja hardverom:
 * - GPIO (relej za vrata, LED indikatori)
 * - NFC čitač (Mifare Classic M1)
 * - Watchdog (watchdog timer)
 * - PWM (buzzer/pištaljka)
 * - Audio (WAV player za glasovne poruke)
 * - Network (Ethernet)
 * 
 * Radi u 5ms petlji i konstantno čita stanje hardvera.
 * ```
 * 
 * **5. Service Pool**
 * ```
 * pool.init('/app/code/src/services.js', bus, topics, 3, 100)
 * 
 * Parametri:
 * - '/app/code/src/services.js': Kod koji svaki worker izvršava
 * - bus: Event Bus instanca za komunikaciju
 * - topics: Lista event-a koje workers slušaju (QR, NFC, MQTT, ...)
 * - 3: Broj worker niti (3 paralelne obrade)
 * - 100: Veličina reda čekanja (100 događaja buffer)
 * 
 * Svaki worker izvršava services.js koji ima switch statement:
 * ```javascript
 * switch (topic) {
 *     case dxCode.RECEIVE_MSG: // QR kod
 *         accessService.access(data)
 *         break
 *     case dxNfc.RECEIVE_MSG: // NFC kartica
 *         nfcService.receiveMsg(data)
 *         break
 *     // ...
 * }
 * ```
 * ```
 * 
 * **6. Auto Restart Scheduler (opciono)**
 * ```
 * if (config.get("sysInfo.autoRestart") != -1) {
 *     driver.autoRestart.init()
 * }
 * 
 * Ako je autoRestart omogućen u config-u, sistem će se automatski
 * restartovati u određeno vreme (npr. 03:00 AM svaki dan).
 * 
 * Razlozi za auto restart:
 * - Oslobađanje memorije (memory leaks)
 * - Resetovanje hardware state-a
 * - Primenjen novih config-a koji zahtevaju restart
 * ```
 * 
 * @note Test Server
 * Postoji zaseban Node.js server za testiranje bez hardvera:
 * ```bash
 * node test_server_nodejs.js
 * ```
 * Ovo pokreće web interfejs na http://localhost:8080 gde možete:
 * - Dodati QR kodove u bazu
 * - Dodati RFID kartice
 * - Dodati PIN kodove
 * - Testirati pristup bez fizičkog hardvera
 * 
 * @warning Initialization Order
 * Redosled inicijalizacije je KRITIČAN! Ako promenite redosled, sistem
 * može ne raditi pravilno. Npr. ako pokrenete workers pre Event Bus-a,
 * eventi će biti propušteni.
 * 
 * @see startWorkers() - Worker initialization
 * @see screen.init() - UI initialization
 * @see pool.init() - Service pool initialization
 */
(function () {
    // === FAZA 1: Pokretanje svih worker komponenti ===
    startWorkers()
    
    // === FAZA 2: Čuvanje verzije aplikacije ===
    const appVersion = 'dw200_v10_access_v2.0.2.3'
    config.setAndSave('sysInfo.appVersion', appVersion)
    log.info("=================== version:" + appVersion + " ====================")

    // === FAZA 3: Inicijalizacija korisničkog interfejsa (LVGL) ===
    screen.init()
    
    // === FAZA 4: Kreiranje controller worker-a (hardver management) ===
    bus.newWorker('controller', '/app/code/src/controller.js')
    
    // === FAZA 5: Kreiranje service pool-a (event handling) ===
    /**
     * Worker Pool Architecture:
     * 
     * ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     * │  Worker 1   │  │  Worker 2   │  │  Worker 3   │
     * │             │  │             │  │             │
     * │  Čeka event │  │  Čeka event │  │  Čeka event │
     * └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
     *        │                │                │
     *        └────────────────┴────────────────┘
     *                         │
     *                   ┌─────▼─────┐
     *                   │ Event     │
     *                   │ Queue     │
     *                   │ (100 max) │
     *                   └─────▲─────┘
     *                         │
     *           ┌─────────────┼─────────────┐
     *           │             │             │
     *       QR Event     NFC Event     MQTT Event
     */
    pool.init('/app/code/src/services.js', bus, topics, 3, 100)
    
    // === FAZA 6: Inicijalizacija planera automatskog ponovnog pokretanja ===
    /**
     * Auto restart se pokreće ako je konfigurisan u config.json:
     * ```json
     * {
     *   "sysInfo": {
     *     "autoRestart": 3  // 3 = restart u 03:00 AM
     *   }
     * }
     * ```
     * 
     * Vrednosti:
     * - -1: Auto restart onemogućen
     * - 0-23: Sat u kojem se vrši restart (0 = ponoć, 3 = 03:00, ...)
     */
    if (config.get("sysInfo.autoRestart") || -1 != -1) {
        driver.autoRestart.init()
    }
    
    /**
     * @note Web Test Server (Zasebna aplikacija)
     * Pokrenite sa: node test_server_nodejs.js
     * Omogućava web interfejs na http://localhost:8080 za:
     *   - Dodavanje QR kodova, RFID kartica, PIN kodova u bazu podataka
     *   - Testiranje kontrole pristupa bez fizičkog hardvera
     *   - Simulaciju MQTT poruka
     *   - Pregled logova u realnom vremenu
     */
})();

/**
 * @brief Glavna petlja aplikacije (Main Event Loop)
 * @details
 * Ovo je srce aplikacije - petlja koja se izvršava svakih 5ms (200 puta u sekundi).
 * Održava sistem aktivnim i osvežava kritične komponente.
 * 
 * @section loop_architecture ARHITEKTURA PETLJE
 * 
 * **Frekvencija: 5ms (200 Hz)**
 * ```
 * setInterval(() => { ... }, 5)
 * 
 * Zašto 5ms?
 * - Dovoljno brzo za responsive UI (korisnik ne primećuje lag)
 * - Dovoljno sporo da ne preopterećuje CPU (< 5% CPU usage)
 * - Balans između performansi i battery life-a
 * ```
 * 
 * @subsection loop_tasks ZADACI PETLJE
 * 
 * **1. Watchdog Feed (KRITIČNO!)**
 * ```javascript
 * driver.watchdog.feed("main", 30 * 1000)
 * 
 * Šta je watchdog?
 * - Hardverski timer koji automatski restartuje sistem ako se "zamrzne"
 * - Mora se "hraniti" (feed) svakih 30 sekundi
 * - Ako petlja prestane raditi (infinite loop, crash), watchdog će resetovati uređaj
 * 
 * Parametri:
 * - "main": Identifikator niti koja hrani watchdog (za debug)
 * - 30 * 1000: Timeout u milisekundama (30s)
 * 
 * Primer scenarija:
 * 1. Aplikacija se zaglavi u beskonačnoj petlji
 * 2. Petlja prestaje raditi → watchdog.feed() se ne poziva
 * 3. Nakon 30s, watchdog timer ističe
 * 4. Hardware automatski restartuje sistem
 * 5. Aplikacija se ponovo pokreće u "čistom" stanju
 * ```
 * 
 * **2. Watchdog Loop**
 * ```javascript
 * driver.watchdog.loop()
 * 
 * Proverava stanje watchdog-a:
 * - Da li su SVE niti (main, controller, workers) aktivne?
 * - Da li neka nit kasni sa feed-om?
 * - Da li ima deadlock-ova?
 * 
 * Ako neka nit ne hrani watchdog na vreme, loguje upozorenje:
 * "[Watchdog] Thread 'controller' not responding for 25s!"
 * ```
 * 
 * **3. Screen Update**
 * ```javascript
 * screen.loop()
 * 
 * Osvežava LVGL korisnički interfejs:
 * - Procesira touch screen događaje (tap, swipe, drag)
 * - Ažurira animacije (progress bar, spinner, fade in/out)
 * - Iscrtava izmene na ekranu (dirty regions only)
 * - Ažurira vreme, datum, status indikatore
 * 
 * LVGL Handler Cycle:
 * 1. lv_task_handler() - procesira pending tasks
 * 2. lv_refr_now() - refreshuje ekran ako ima izmena
 * 3. touch_read() - čita touch screen input
 * 
 * Performance:
 * - Samo izmenjeni delovi ekrana se iscrtavaju (partial refresh)
 * - Hardware DMA se koristi za brže crtanje
 * - Double buffering sprečava flickering
 * ```
 * 
 * @section timing_diagram VREMENSKI DIJAGRAM
 * 
 * ```
 * t=0ms     ┌─ Watchdog feed (main)
 *           ├─ Watchdog loop check
 *           └─ Screen update (LVGL)
 *           
 * t=5ms     ┌─ Watchdog feed (main)
 *           ├─ Watchdog loop check
 *           └─ Screen update (LVGL)
 *           
 * t=10ms    ┌─ Watchdog feed (main)
 *           ├─ Watchdog loop check
 *           └─ Screen update (LVGL)
 *           
 * ...       (svaki 5ms)
 *           
 * t=30000ms ⚠️  Ako petlja ne pozove feed(), watchdog resetuje sistem!
 * ```
 * 
 * @subsection performance PERFORMANSE
 * 
 * **CPU Usage:**
 * - Normal: < 5% (većinu vremena čeka u sleep)
 * - Busy: 10-15% (kada se iscrtava UI ili obrađuje event)
 * - Peak: 30% (kada QR scanner + UI + MQTT rade istovremeno)
 * 
 * **Memory:**
 * - Petlja sama ne alocira memoriju (0 bytes per loop)
 * - screen.loop() može alocirati za animacije (~1KB)
 * - Watchdog feed je trivijalan (~10 bytes)
 * 
 * **Latency:**
 * - Od touch eventa do reakcije: < 50ms (10 loop iteracija)
 * - Od QR detektovanja do UI feedback-a: < 100ms
 * 
 * @warning Critical Section
 * Kod u ovoj petlji MORA biti brz (< 1ms izvršavanje).
 * Ako petlja traje duže od 5ms, propušta se sledeći tick!
 * 
 * LOŠE:
 * ```javascript
 * std.setInterval(() => {
 *     std.sleep(10)  // ❌ Blokira petlju!
 *     // Watchdog neće biti hranjen → sistem će se resetovati
 * }, 5)
 * ```
 * 
 * DOBRO:
 * ```javascript
 * std.setInterval(() => {
 *     watchdog.feed("main", 30000)  // ✅ Brzo
 *     screen.loop()                 // ✅ Optimizovano
 * }, 5)
 * ```
 * 
 * @note Error Handling
 * try-catch blok štiti sistem od crashovanja ako neka funkcija baci exception.
 * Umesto da sistem padne, samo loguje grešku i nastavlja dalje.
 * 
 * @see driver.watchdog - Watchdog driver implementacija
 * @see screen.loop() - LVGL UI handler
 * 
 * @throws {Error} Loguje ali ne propagira dalje (sistem nastavlja rad)
 */
std.setInterval(() => {
    try {
        /**
         * @critical Watchdog Feed
         * MORA se pozvati bar jednom svakih 30 sekundi.
         * Parametri:
         * - "main": Thread identifier (za multi-thread watchdog)
         * - 30 * 1000: Timeout u ms (30 sekundi)
         */
        driver.watchdog.feed("main", 30 * 1000)
        
        /**
         * @step Watchdog Loop Check
         * Proverava da li su sve niti žive i reaguju.
         * Ako neka nit ne reaguje, loguje warning ali ne crashuje sistem.
         */
        driver.watchdog.loop()
        
        /**
         * @step Screen Update
         * Ažurira LVGL korisnički interfejs:
         * - Procesira touch events
         * - Ažurira animacije
         * - Iscrtava izmene na ekranu
         * 
         * Poziva: lv_task_handler() → lv_refr_now() → display_driver_flush()
         */
        screen.loop()
    } catch (error) {
        /**
         * Error Handling:
         * Ako bilo koja funkcija baci exception, loguje se ali petlja nastavlja.
         * Ovo sprečava potpuni crash sistema zbog jedne greške.
         * 
         * Primeri grešaka koje se mogu desiti:
         * - LVGL out of memory
         * - Display driver timeout
         * - Watchdog communication error
         */
        log.error(error)
    }
}, 5)  // 5ms interval = 200 Hz frequency

// ═══════════════════════════════════════════════════════════════════════════
// Opcioni debug kod (trenutno zakomentarisan)
// ═══════════════════════════════════════════════════════════════════════════
// std.setInterval(() => {
//     /**
//      * System Brief Command
//      * Izvršava shell komandu i loguje output.
//      * 
//      * `free -b`: Prikazuje slobodnu RAM memoriju u bajtovima
//      * `uptime`: Prikazuje koliko dugo sistem radi
//      * 
//      * Primer output-a:
//      * ```
//      *              total       used       free     shared    buffers     cached
//      * Mem:     524288000  312598528  211689472    4096000   26214400   89128960
//      * -/+ buffers/cache:  197255168  327032832
//      * Swap:             0          0          0
//      *  14:32:15 up 2 days,  3:45,  load average: 0.15, 0.12, 0.08
//      * ```
//      */
//     common.systemBrief("free -b && uptime")
// }, 4000)  // Svakih 4 sekunde (za monitoring memorije)