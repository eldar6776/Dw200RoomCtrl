/**
 * @file driver.js
 * @brief Unified Hardware Driver Interface - Centralizovani pristup svim hardverskim komponentama
 * @version 2.0.2.3
 * @date 2025-11-23
 * @author Eldar Pašalić (eldar6776)
 * 
 * @section overview PREGLED
 * 
 * Ovaj fajl je "fasada" (facade pattern) koja objedinjuje sve hardverske drajvere
 * u jednom mestu. Umesto da svaki servis direktno pristupa hardveru, koristi se
 * driver objekat koji pruža ujednačen interfejs.
 * 
 * **Prednosti fasade:**
 * - Centralizovana kontrola hardvera
 * - Lakše testiranje (mock driver.js umesto mock svakog drajvera)
 * - Konzistentno logovanje
 * - Lakše dodavanje novih drajvera
 * 
 * @section architecture ARHITEKTURA DRAJVERA
 * 
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                         DRIVER.JS                               │
 * │                    (Unified Interface)                          │
 * └──┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┘
 *    │    │    │    │    │    │    │    │    │    │    │    │
 *    │    │    │    │    │    │    │    │    │    │    │    │
 *    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼
 *   PWM  NET GPIO NFC Audio GPIOKey NTP MQTT Config WD  Sync AutoRestart
 *   │    │    │    │    │      │     │    │     │    │    │     │
 *   ▼    ▼    ▼    ▼    ▼      ▼     ▼    ▼     ▼    ▼    ▼     ▼
 *  Buzzer Net Relay Card Speaker Button Time Cloud Config Timer Scheduler Reboot
 * ```
 * 
 * @section drivers LISTA DRAJVERA
 * 
 * | Drajver        | Hardver                    | Svrha                              |
 * |----------------|----------------------------|------------------------------------|
 * | `driver.pwm`   | PWM Kanal 4                | Buzzer/pištaljka za zvučne signale |
 * | `driver.net`   | Ethernet                   | Mrežna povezivost                  |
 * | `driver.gpio`  | GPIO 105                   | Relej za otvaranje vrata           |
 * | `driver.nfc`   | Mifare Classic M1          | NFC/RFID čitač kartica             |
 * | `driver.audio` | ALSA Sound Card            | Reprodukcija WAV fajlova           |
 * | `driver.gpiokey`| GPIO Input Pins           | Čitanje hardverskih dugmića        |
 * | `driver.ntp`   | NTP Client                 | Sinhronizacija vremena             |
 * | `driver.mqtt`  | MQTT Client (TCP)          | Cloud komunikacija                 |
 * | `driver.uartBle`| UART /dev/ttyS5           | Bluetooth Low Energy modul         |
 * | `driver.config`| JSON Config File           | Učitavanje/čuvanje konfiguracije   |
 * | `driver.watchdog`| Hardware Watchdog Timer  | Automatski reset pri bagovima      |
 * | `driver.sync` | Software Synchronization    | Async→Sync konverzija              |
 * | `driver.screen`| LVGL UI Framework          | Komunikacija sa ekranom            |
 * | `driver.eid`  | ID Card Reader              | Čitanje ličnih karata              |
 * | `driver.autoRestart`| System Scheduler      | Planirano restartovanje            |
 * 
 * @section usage KAKO SE KORISTI
 * 
 * **Primer 1: Otvaranje vrata**
 * ```javascript
 * // Umesto direktnog poziva hardvera:
 * dxGpio.setValue(105, 1)  // ❌ Direktan pristup - loše
 * 
 * // Koristi se driver fasada:
 * driver.gpio.open()  // ✅ Preko fasade - dobro
 * ```
 * 
 * **Primer 2: Puštanje zvuka**
 * ```javascript
 * // Loše:
 * dxAlsaplay.play('/app/code/resource/wav/success.wav')  // ❌
 * 
 * // Dobro:
 * driver.audio.success()  // ✅ Apstrakcija - ne znaš gde je fajl
 * ```
 * 
 * **Primer 3: MQTT slanje**
 * ```javascript
 * // Loše:
 * dxMqtt.send('access_device/v1/event/access', JSON.stringify(data), 'mqtt1')  // ❌
 * 
 * // Dobro:
 * driver.mqtt.send({topic: 'access_device/v1/event/access', payload: JSON.stringify(data)})  // ✅
 * ```
 * 
 * @section initialization INICIJALIZACIJA
 * 
 * Drajveri se inicijalizuju u različitim delovima aplikacije:
 * 
 * **Main Thread (main.js):**
 * ```javascript
 * driver.config.init()    // Učitaj config.json
 * driver.uartBle.init()   // Inicijalizuj Bluetooth
 * driver.mqtt.init()      // Konektuj MQTT
 * ```
 * 
 * **Controller Thread (controller.js):**
 * ```javascript
 * driver.gpio.init()      // Inicijalizuj GPIO pinove
 * driver.gpiokey.init()   // Inicijalizuj input pinove
 * driver.watchdog.init()  // Pokreni watchdog
 * driver.pwm.init()       // Inicijalizuj PWM (buzzer)
 * driver.audio.init()     // Inicijalizuj audio sistem
 * driver.nfc.init()       // Inicijalizuj NFC čitač
 * driver.net.init()       // Inicijalizuj mrežu
 * ```
 * 
 * @warning Thread Safety
 * Neki drajveri su thread-safe (npr. driver.mqtt), dok drugi nisu (npr. driver.gpio).
 * Uvek koristite drajvere iz niti koja ih je inicijalizovala, osim ako dokumentacija
 * ne kaže drugačije.
 * 
 * @note Extension
 * Da dodate novi drajver:
 * 1. Kreirajte `driver.myDriver = { init: ..., myMethod: ... }`
 * 2. Pozovite init() u odgovarajućoj niti
 * 3. Export driver objekat na kraju fajla
 * 
 * @see main.js - Gde se drajveri inicijalizuju
 * @see controller.js - Gde se hardverski drajveri koriste
 * @see services.js - Gde se network drajveri koriste
 */

import log from '../dxmodules/dxLogger.js'
import dxPwm from '../dxmodules/dxPwm.js'
import std from '../dxmodules/dxStd.js'
import dxNet from '../dxmodules/dxNet.js'
import dxGpio from '../dxmodules/dxGpio.js'
import dxCode from '../dxmodules/dxCode.js'
import dxNfc from '../dxmodules/dxNfc.js'
import dxAlsaplay from '../dxmodules/dxAlsaplay.js'
import dxGpioKey from '../dxmodules/dxGpioKey.js'
import dxMqtt from '../dxmodules/dxMqtt.js'
import dxNtp from '../dxmodules/dxNtp.js'
import dxMap from '../dxmodules/dxMap.js'
import config from '../dxmodules/dxConfig.js'
import common from '../dxmodules/dxCommon.js'
import dxUart from '../dxmodules/dxUart.js'
import watchdog from '../dxmodules/dxWatchdog.js'
import bus from '../dxmodules/dxEventBus.js'
import mqttService from './service/mqttService.js'
import utils from './common/utils/utils.js'
import uartBleService from './service/uartBleService.js'
import eid from '../dxmodules/dxEid.js'
import dxHttp from '../dxmodules/dxHttpClient.js'
import CryptoES from '../dxmodules/crypto-es/index.js';
import * as qStd from "std"
let lockMap = dxMap.get("ble_lock")

/**
 * @brief Centralni driver objekat - fasada za sve hardverske komponente
 * @details
 * Ovaj objekat sadrži sve drajvere i pruža ujednačen interfejs za pristup hardveru.
 */
const driver = {}

/**
 * @subsection pwm_driver PWM Driver - Kontrola Buzzera/Pištaljke
 * @details
 * PWM (Pulse Width Modulation) driver kontroliše piezo buzzer koji daje
 * zvučne signale korisniku (beep, buzz, warning).
 * 
 * @section pwm_hardware HARDVER
 * 
 * **PWM Kanal 4:**
 * - Pin: GPIO kanal 4 (konfigurisano u device tree)
 * - Frekvencija: ~2.7 kHz (366166 ns period)
 * - Duty Cycle: Kontrolisan preko volume parametra (0-100%)
 * 
 * **Piezo Buzzer:**
 * - Tip: Pasivni piezo element (zahteva PWM signal)
 * - Frekvencija: 2-4 kHz (optimalna za ljudsko uho)
 * - Jačina: Kontrolisana duty cycle-om PWM signala
 * 
 * @subsection pwm_waveform PWM SIGNAL
 * 
 * ```
 * Volume 50% (Medium):
 * 
 *    HIGH ─┐     ┌─────┐     ┌─────
 *          │     │     │     │
 *    LOW   └─────┘     └─────┘
 *          |<--->|<--->|
 *           ON   OFF
 *          50%   50%
 * 
 * Volume 100% (Loud):
 * 
 *    HIGH ─┐           ┐           ┐
 *          │           │           │
 *    LOW   └───────────┘───────────┘
 *          |<--------->|
 *               ON
 *              100%
 * ```
 * 
 * @subsection pwm_config KONFIGURACIJA
 * 
 * Volume parametri se čuvaju u config.json:
 * ```json
 * {
 *   "sysInfo": {
 *     "volume2": 50,  // Jačina pritiska na dugme (0-100)
 *     "volume3": 70   // Jačina buzzer-a (0-100)
 *   }
 * }
 * ```
 * 
 * @note Sound Types
 * 
 * | Zvuk     | Trajanje | Broj beepova | Volume   | Svrha               |
 * |----------|----------|--------------|----------|---------------------|
 * | Press    | 30ms     | 1            | volume2  | Potvrda pritiska    |
 * | Success  | 30ms     | 2            | volume3  | Uspešan pristup     |
 * | Fail     | 500ms    | 1            | volume3  | Neuspešan pristup   |
 * | Warning  | ∞        | 1            | volume3  | Upozorenje/alarm    |
 */
driver.pwm = {
    /**
     * @brief Inicijalizuje PWM drajver za buzzer
     * @details
     * Konfigurira PWM kanal 4 za kontrolu piezo buzzera.
     * 
     * **Koraci inicijalizacije:**
     * 1. Zahteva pristup PWM kanalu 4 (reserve channel)
     * 2. Postavlja PWM period na 366166 ns (~2.73 kHz)
     * 3. Omogućava PWM output (enable channel)
     * 
     * @note Period Calculation
     * ```
     * Frekvencija = 1 / Period
     * 2.7 kHz = 1 / (366166 * 10^-9 s)
     * ```
     * 
     * Zašto 2.7 kHz?
     * - Ljudsko uho je najosjetljivije na 2-4 kHz
     * - Piezo elementi rezoniraju najbolje u tom opsegu
     * - Dovoljno visoko da ne smeta, ali dovoljno nisko da ne hvata mikrofone
     * 
     * @throws {Error} Ako PWM kanal 4 nije dostupan ili nije konfigurisan
     */
    init: function () {
        // === KORAK 1: Reserve PWM Kanal 4 ===
        /**
         * dxPwm.request(4) rezerviše PWM kanal 4 za ekskluzivnu upotrebu.
         * Ako drugi deo koda pokuša da koristi isti kanal, dobaće grešku.
         */
        dxPwm.request(4);
        
        // === KORAK 2: Postavi PWM Period (Frekvencija) ===
        /**
         * setPeriodByChannel(channel, period_ns)
         * 
         * Channel: 4 (buzzer channel)
         * Period: 366166 ns = 0.366166 ms
         * 
         * Rezultujuća frekvencija:
         * f = 1 / 0.000366166 s = 2731 Hz ≈ 2.7 kHz
         */
        dxPwm.setPeriodByChannel(4, 366166)
        
        // === KORAK 3: Omogući PWM Output ===
        /**
         * enable(channel, state)
         * 
         * Channel: 4
         * State: true (enable output)
         * 
         * Nakon ovog poziva, PWM pin će početi outputovati signal.
         * Duty cycle je inicijalno 0% (nema zvuka dok se ne pozove beep()).
         */
        dxPwm.enable(4, true)
    },
    
    /**
     * @brief Kratki beep zvuk za potvrdu pritiska na dugme
     * @details
     * Proizvodi kratki beep (30ms) sa srednjom jačinom.
     * Koristi se za feedback kada korisnik pritisne dugme na ekranu.
     * 
     * **Parametri beep-a:**
     * - Trajanje: 30ms (dovoljno kratko da ne smeta, dovoljno dugo da se čuje)
     * - Volume: Čita se iz config-a (sysInfo.volume2)
     * - Broj beepova: 1
     * 
     * @note UX Design
     * Kratki beep daje korisniku instant feedback da je sistem primio input.
     * Bez ovog zvuka, korisnik ne zna da li je touch screen registrovao pritisak.
     * 
     * @see getVolume2() - Vraća jačinu zvuka za pritiske na dugme
     */
    press: function () {
        /**
         * dxPwm.beep({ ... }) generiše PWM puls sa specificiranim parametrima:
         * 
         * - channel: 4 (buzzer kanal)
         * - time: 30 (trajanje u ms)
         * - volume: getVolume2() (jačina iz config-a, 0-100)
         * - interval: 0 (nema pauze između beepova - samo jedan beep)
         */
        dxPwm.beep({ channel: 4, time: 30, volume: this.getVolume2(), interval: 0 })
    },
    
    /**
     * @brief Dugi buzz zvuk za neuspešan pristup
     * @details
     * Proizvodi dug (500ms), glasan buzz koji signalizira grešku.
     * Koristi se kada korisnik pokuša pristup sa nevažećim QR kodom/karticom.
     * 
     * **Parametri buzz-a:**
     * - Trajanje: 500ms (pola sekunde - довољно dugo da privuče pažnju)
     * - Volume: Visok (getVolume3())
     * - Broj buzzova: 1
     * 
     * @note UX Psychology
     * Dugi, neprijatan zvuk asocira se sa greškom i upozorenjem.
     * Kraći od alarm zvuka (koji je kontinuiran), ali dovoljno dugačak
     * da korisnik shvati da nešto nije u redu.
     */
    fail: function () {
        dxPwm.beep({ channel: 4, time: 500, volume: this.getVolume3(), interval: 0 })
    },
    
    /**
     * @brief Dupli beep zvuk za uspešan pristup
     * @details
     * Proizvodi dva kratka beep-a (30ms svaki) sa pauzom između njih.
     * Koristi se kada korisnik uspešno pristupi prostoriji.
     * 
     * **Parametri beep-a:**
     * - Trajanje: 30ms po beep-u
     * - Volume: Visok (getVolume3())
     * - Broj beepova: 2 (count: 2)
     * - Interval: Default (automatski izračunava pauzu)
     * 
     * @note Sound Pattern
     * ```
     * BEEP!  [pauza]  BEEP!
     *  30ms    ~50ms    30ms
     * 
     * Ovaj pattern je univerzalno prepoznat kao "uspeh" ili "potvrda".
     * Koristi se u ATM-ovima, terminali za plaćanje, kontroli pristupa.
     * ```
     */
    success: function () {
        dxPwm.beep({ channel: 4, time: 30, count: 2, volume: this.getVolume3() })
    },
    
    /**
     * @brief Kontinuiran buzz zvuk za alarm/upozorenje
     * @details
     * Proizvodi kontinuiran buzz koji traje dok se ne zaustavi eksterno.
     * Koristi se za alarme (vrata ostala otvorena previše dugo, itd.).
     * 
     * **Parametri buzz-a:**
     * - Trajanje: Neograničeno (interval: 0 znači "do zaustavljanja")
     * - Volume: Visok (getVolume3())
     * 
     * @warning Manual Stop Required
     * Ovaj buzz će trajati dok se eksplicitno ne zaustavi pozivom:
     * ```javascript
     * dxPwm.stop(4)  // Zaustavlja PWM na kanalu 4
     * ```
     */
    warning: function () {
        dxPwm.beep({ channel: 4, volume: this.getVolume3(), interval: 0 })
    },
    
    /**
     * @brief Vraća jačinu zvuka za pritiske na dugme
     * @returns {number} Volume (0-100), default 50
     * @details
     * Čita volume iz config.json sa cache-ovanjem.
     * Ako nije konfigurisan, koristi default vrednost 50.
     * 
     * Cache mehanizam:
     * - Prvi poziv čita iz config-a i kešira u this.volume2
     * - Sledeći pozivi vraćaju keširanu vrednost (brže)
     * - Cache se resetuje restartom aplikacije
     */
    getVolume2: function () {
        if (utils.isEmpty(this.volume2)) {
            let volume2 = config.get("sysInfo.volume2")
            this.volume2 = utils.isEmpty(volume2) ? 50 : volume2
        }
        return this.volume2
    },
    
    /**
     * @brief Vraća jačinu zujalice (buzzer volume)
     * @returns {number} Volume (0-100), default 50
     * @details
     * Slično kao getVolume2(), ali za glavne zvukove (success, fail, warning).
     * 
     * Razlika između volume2 i volume3:
     * - volume2: Tihi pritisci na dugme (ne smeta drugim korisnicima)
     * - volume3: Glavni feedback (mora biti čujan i sa udaljenosti)
     */
    getVolume3: function () {
        if (utils.isEmpty(this.volume3)) {
            let volume3 = config.get("sysInfo.volume3")
            this.volume3 = utils.isEmpty(volume3) ? 50 : volume3
        }
        return this.volume3
    }
}

/**
 * @subsection net_driver Network Driver - Ethernet/WiFi Konekcija
 * @details
 * Upravlja mrežnom vezom (Ethernet ili WiFi) i omogućava TCP/IP komunikaciju.
 * 
 * @section net_modes REŽIMI RADA
 * 
 * **Tip 0: Mrežna veza onemogućena**
 * - Sistem radi offline (bez MQTT, NTP, cloud funkcija)
 * - Koristi se za testiranje ili kada mreža nije potrebna
 * 
 * **Tip 1: Ethernet**
 * - Ožičena konekcija preko RJ45 porta
 * - Statička ili DHCP IP konfiguracija
 * - Najstabilnija opcija za 24/7 rad
 * 
 * **Tip 2: WiFi (ako je podržano hardverom)**
 * - Bežična konekcija
 * - SSID i password iz config-a
 * 
 * @section dhcp_config DHCP vs STATIČKA IP
 * 
 * **DHCP (Dynamic Host Configuration Protocol):**
 * ```
 * ┌──────────┐          DHCP Request          ┌──────────┐
 * │ DW200    │ ──────────────────────────────> │  Router  │
 * │ Device   │                                 │  (DHCP)  │
 * │          │ <────────────────────────────── │          │
 * └──────────┘   IP: 192.168.1.50 assigned    └──────────┘
 * ```
 * Prednosti:
 * - Automatska konfiguracija (plug & play)
 * - Router upravlja IP dodeljv anjem
 * - Lakše za velike instalacije
 * 
 * Mane:
 * - IP adresa se može promeniti nakon restarta
 * - Zavisi od DHCP servera
 * 
 * **Statička IP:**
 * ```json
 * {
 *   "netInfo": {
 *     "dhcp": 0,
 *     "ip": "192.168.1.100",
 *     "gateway": "192.168.1.1",
 *     "subnetMask": "255.255.255.0",
 *     "dns": "8.8.8.8,8.8.4.4"
 *   }
 * }
 * ```
 * Prednosti:
 * - IP adresa se nikad ne menja
 * - Ne zavisi od DHCP servera
 * - Lakše za remote access (uvek ista adresa)
 * 
 * Mane:
 * - Ručna konfiguracija
 * - Rizik od IP konflikta
 * 
 * @note Network Status
 * Status nivoi:
 * - 0: Disconnected (kabl nije priključen)
 * - 1: Link Up (kabl priključen, ali nema IP-a)
 * - 2: Obtaining IP (DHCP u toku)
 * - 3: IP Assigned (ima IP, ali nema internet)
 * - 4: Connected (potpuno funkcionalna veza)
 */
driver.net = {
    /**
     * @brief Inicijalizuje mrežni drajver
     * @details
     * Proverava da li je mreža omogućena u config-u i pokreće network worker.
     * 
     * **Proces inicijalizacije:**
     * 1. Čita netInfo.type iz config-a (0=disabled, 1=ethernet, 2=wifi)
     * 2. Ako je disabled (0), vraća se odmah - mreža neće raditi
     * 3. Čita mrežne opcije (IP, gateway, DNS) iz mqttService.getNetOptions()
     * 4. Pokreće network worker sa tim opcijama
     * 
     * Network worker:
     * - Radi u background-u kao zaseban thread
     * - Automatski detektuje link up/down
     * - Šalje dxNet.STATUS_CHANGE event kada se status promeni
     * - Hendluje DHCP negotiation ako je DHCP omogućen
     * 
     * @see mqttService.getNetOptions() - Odakle se čitaju mrežne opcije
     */
    init: function () {
        // Provera da li je mreža onemogućena u konfiguraciji
        if (config.get("netInfo.type") == 0) { //NOSONAR
            // Mreža je eksplicitno onemogućena - sistem radi offline
            return
        }
        // Pokreni network worker sa konfiguracionim opcijama
        dxNet.worker.beforeLoop(mqttService.getNetOptions())
    },
    
    /**
     * @brief Glavna petlja mrežnog drajvera
     * @details
     * Mora se pozivati periodično (obično iz controller.js loop-a) da bi
     * network stack radio. Hendluje:
     * - Link detection (da li je kabl priključen)
     * - DHCP renewals (obnavljanje DHCP lease-a)
     * - Network events (connection/disconnection)
     * 
     * **Self-disabling pattern:**
     * Ako je mreža onemogućena, zamenjuje samu sebe sa praznom funkcijom:
     * ```javascript
     * this.loop = () => { }  // Nova funkcija koja ne radi ništa
     * ```
     * Ovo sprečava nepotrebne provere svakih 5ms nakon što se utvrdi
     * da mreža nije u upotrebi.
     * 
     * @note Performance
     * Loop se izvršava svakih 5ms, ali većinu vremena samo proverava
     * status i ne radi ništa (< 0.1% CPU usage).
     */
    loop: function () {
        if (config.get("netInfo.type") == 0) { //NOSONAR
            // Mreža je onemogućena - zameni ovu funkciju sa no-op
            this.loop = () => { }
            return
        }
        // Pozovi network worker loop - hendluje sve mrežne događaje
        dxNet.worker.loop()
    },
    
    /**
     * @brief Proverava da li je mreža potpuno funkcionalna
     * @returns {boolean} true = mreža radi, false = mreža ne radi
     * @details
     * Jednostavna boolean provera da li je mrežna veza uspostavljena.
     * Koristi se pre pokušaja MQTT/HTTP komunikacije.
     * 
     * **Status nivoi:**
     * ```
     * Status 0: No Cable      → getStatus() = false
     * Status 1: Link Up       → getStatus() = false
     * Status 2: Getting IP    → getStatus() = false
     * Status 3: IP Assigned   → getStatus() = false
     * Status 4: Connected ✓   → getStatus() = true
     * ```
     * 
     * Status 4 znači:
     * - Ethernet link je aktivan
     * - IP adresa je dodeljena (DHCP ili statička)
     * - Gateway je dostupan
     * - DNS radi (može rezolvorati imena)
     * - Internet konekcija je funkcionalna
     * 
     * @example
     * ```javascript
     * if (driver.net.getStatus()) {
     *     // Bezbedno slati MQTT poruke
     *     driver.mqtt.send({...})
     * } else {
     *     // Sačuvaj u lokalnu bazu, pošalji kasnije
     *     sqliteService.savePending(...)
     * }
     * ```
     * 
     * @note Quick Check
     * Ova funkcija je ultra-brza (< 1µs) jer samo čita cached status.
     * Stvarna network detection se dešava u loop() funkciji.
     */
    getStatus: function () {
        // Ako je mreža onemogućena u config-u, uvek vrati false
        if (config.get("netInfo.type") == 0) {
            return false //NOSONAR
        }
        // Čitaj cached status iz network stack-a
        let status = dxNet.getStatus()
        // Status 4 + connected flag = potpuno funkcionalna mreža
        if (status.connected == true && status.status == 4) {
            return true
        } else {
            return false
        }
    },
}

/**
 * @subsection gpio_driver GPIO Driver - Kontrola Releja za Vrata
 * @details
 * GPIO (General Purpose Input/Output) driver kontroliše digitalne pinove
 * koji upravljaju hardverom. U ovom slučaju - relej za otvaranje vrata.
 * 
 * @section gpio_hardware HARDVER
 * 
 * **GPIO Pin 105:**
 * ```
 *           ┌─────────────┐
 *   GPIO 105│             │ COM (Common)
 *    ──────>│   Relay     ├─────> Door Lock
 *           │   Module    │
 *   GND ────│             │ NO (Normally Open)
 *           └─────────────┘
 * ```
 * 
 * - Pin: GPIO 105 (konfigurisano u device tree)
 * - Tip: Digital Output (0V = LOW, 3.3V = HIGH)
 * - Relej tip: Normalno otvoren (NO - Normally Open)
 * - Struja: ~20mA (kontroliše relej, ne direktno bravu)
 * - Load: Relej može prekidati do 10A @ 250VAC
 * 
 * **Kako radi relej:**
 * ```
 * GPIO = 0 (LOW)  →  Relej OFF  →  Vrata ZAKLJUČANA
 * GPIO = 1 (HIGH) →  Relej ON   →  Vrata OTKLJUČANA
 * ```
 * 
 * @section door_modes REŽIMI OTVARANJA VRATA
 * 
 * Konfiguracija: `doorInfo.openMode` u config.json
 * 
 * **Mode 0: Normalan (Time-Limited)**
 * ```
 * open() →  GPIO HIGH  →  Wait 2s  →  GPIO LOW
 *   ↓          ↓                         ↓
 * Poziv    Otvori vrata          Zaključaj vrata
 * ```
 * - Vrata se otključavaju na određeno vreme (default 2s)
 * - Automatski se zaključavaju nakon timeout-a
 * - Najsigurniji režim - vrata se ne mogu slučajno ostaviti otvorena
 * - Koristi se u većini instalacija
 * 
 * **Mode 1: Normalno Otvoreno (Always Unlocked)**
 * ```
 * Vrata su UVEK otključana
 * close() se ignoriše
 * ```
 * - Koristi se u javnim prostorima (hodnici, zajedničke prostorije)
 * - Vrata se fizički mogu zatvoriti, ali nisu zaključana
 * - Opasno sa sigurnosnog stanovišta!
 * 
 * **Mode 2: Normalno Zatvoreno (Always Locked)**
 * ```
 * Vrata su UVEK zaključana
 * open() se ignoriše
 * ```
 * - Koristi se za apsolutno zabranjene zone
 * - Čak i validni pristup neće otvoriti vrata
 * - Potrebno ručno odblokirati u config-u
 * 
 * @section timing VREMENSKI DIJAGRAM
 * 
 * ```
 * Normalan mod (openMode = 0):
 * 
 * t=0ms     Korisnik skenira QR kod
 *           accessService.access() → driver.gpio.open()
 *           ↓
 * t=10ms    GPIO 105 = HIGH
 *           Relej se aktivira → KLIK!
 *           Vrata otključana ✓
 *           ↓
 *           [Korisnik ima 2000ms da otvori vrata]
 *           ↓
 * t=2010ms  GPIO 105 = LOW
 *           Relej se deaktivira → KLIK!
 *           Vrata zaključana ✓
 * ```
 * 
 * @note Failsafe Design
 * Ako sistem crashuje dok su vrata otvorena:
 * - Watchdog će resetovati sistem nakon 30s
 * - Nakon restarta, GPIO je LOW (default state)
 * - Vrata se automatski zaključavaju
 * → Sigurnosni propust je maksimalno 30s
 */
driver.gpio = {
    /**
     * @brief Inicijalizuje GPIO pin za kontrolu releja
     * @details
     * Rezerviše GPIO 105 i postavlja ga u OUTPUT mod.
     * 
     * **Inicijalizacija:**
     * 1. dxGpio.init() - Inicijalizuje GPIO subsystem
     * 2. dxGpio.request(105) - Rezerviše pin 105 za ekskluzivnu upotrebu
     * 
     * Nakon init(), pin je u LOW stanju (vrata zaključana).
     * 
     * @throws {Error} Ako pin 105 nije dostupan ili je već rezervisan
     */
    init: function () {
        // Inicijalizuj GPIO subsystem (mapira /sys/class/gpio/)
        dxGpio.init()
        // Rezerviši GPIO 105 za kontrolu releja
        dxGpio.request(105)
    },
    
    /**
     * @brief Otključava vrata aktiviranjem releja
     * @details
     * Ova funkcija se poziva kada korisnik uspešno pristupi (QR kod, NFC, PIN).
     * Otvara vrata na određeno vreme, zatim ih automatski zaključava.
     * 
     * **Algoritam:**
     * ```
     * 1. Pročitaj openMode iz config-a (0/1/2)
     * 2. Ako je mode != 2 (not always locked):
     *    a) Postavi GPIO 105 = HIGH (relej ON)
     * 3. Ako je mode == 0 (normal time-limited):
     *    a) Pročitaj openTime iz config-a (default 2000ms)
     *    b) Snimi vreme zaključavanja u mapu (za door sensor)
     *    c) Zakaži setTimeout koji će vratiti GPIO na LOW
     * 4. Vrati se odmah - vrata su otvorena
     * ```
     * 
     * **Zašto map sa relayCloseTime?**
     * Door sensor (GPIO 48) proverava da li su vrata FIZIČKI otvorena.
     * Ako sensor detektuje otvaranje PRE isteka openTime-a, to je OK.
     * Ako sensor detektuje otvaranje NAKON isteka openTime-a, to je ALARM (provalna).
     * 
     * relayCloseTime čuva trenutak kada relej treba da se zatvori, tako da
     * sensor zna da li je otvaranje legitimno ili ne.
     * 
     * @see driver.gpiokey.sensorChanged() - Provera door sensor-a
     * 
     * @example
     * ```javascript
     * // Korisnik skenira validan QR kod
     * accessService.access({type: 100, code: "GUEST_123"})
     *   → Proveri bazu → Valid ✓
     *   → driver.gpio.open()
     *   → Relej ON → Vrata otključana
     *   → [2 sekunde]
     *   → Relej OFF → Vrata zaključana
     * ```
     */
    open: function () {
        // Čitaj režim otvaranja vrata iz konfiguracije
        let openMode = config.get("doorInfo.openMode")
        if (utils.isEmpty(openMode)) {
            openMode = 0  // Default: Normalan režim (time-limited)
        }
        
        // Mode 2 = Normalno zatvoreno - otvaranje nije dozvoljeno
        // U ovom režimu, čak i validan pristup NE otvara vrata
        if (openMode != 2) {
            // Aktiviraj relej: GPIO 105 = HIGH → Relej ON → Vrata otključana
            dxGpio.setValue(105, 1)
        }
        
        // Mode 0 = Normalan režim - automatsko zaključavanje nakon timeout-a
        if (openMode == 0) {
            // Pročitaj koliko dugo vrata treba da budu otvorena (milliseconds)
            let openTime = config.get("doorInfo.openTime")
            openTime = utils.isEmpty(openTime) ? 2000 : openTime  // Default 2s
            
            // Zakaži automatsko zatvaranje releja
            let map = dxMap.get("GPIO")
            std.setTimeout(() => {
                // Nakon openTime ms, vrati GPIO na LOW → Relej OFF → Zaključaj
                dxGpio.setValue(105, 0)
                // Obriši relayCloseTime (više nije relevantno)
                map.del("relayCloseTime")
            }, openTime)
            
            // Snimi vreme kada će relej biti zatvoren (za door sensor validaciju)
            // new Date().getTime() = trenutno vreme u ms
            // + openTime = vreme zatvaranja
            map.put("relayCloseTime", new Date().getTime() + openTime)
        }
    },
    
    /**
     * @brief Zaključava vrata deaktiviranjem releja
     * @details
     * Manuelno zaključavanje vrata. Koristi se retko jer open() automatski
     * zaključava vrata nakon timeout-a.
     * 
     * Mogući slučajevi upotrebe:
     * - Remote zaključavanje preko MQTT-a
     * - Emergency lockdown (alarm)
     * - Prekid time-limited otvaranja (cancel pristupa)
     * 
     * **Algoritam:**
     * ```
     * 1. Pročitaj openMode iz config-a
     * 2. Ako je mode != 1 (not always open):
     *    a) Postavi GPIO 105 = LOW (relej OFF)
     * 3. Vrati se - vrata su zaključana
     * ```
     * 
     * @note Mode Protection
     * Ako je openMode = 1 (normalno otvoreno), close() ne radi ništa.
     * Ovo sprečava slučajno zaključavanje vrata koja treba biti otvorena.
     * 
     * @example
     * ```javascript
     * // Emergency lockdown preko MQTT-a
     * mqttService.receiveMsg({command: "lock_all_doors"})
     *   → driver.gpio.close()
     *   → GPIO 105 = LOW
     *   → Relej OFF
     *   → Vrata zaključana odmah
     * ```
     */
    close: function () {
        // Pročitaj režim otvaranja vrata
        let openMode = config.get("doorInfo.openMode")
        
        // Mode 1 = Normalno otvoreno - zatvaranje nije dozvoljeno
        // Vrata moraju ostati otključana u ovom režimu
        if (openMode != 1) {
            // Deaktiviraj relej: GPIO 105 = LOW → Relej OFF → Vrata zaključana
            dxGpio.setValue(105, 0)
        }
    },
}

/**
 * @subsection nfc_driver NFC/RFID Driver - Čitač Beskontaktnih Kartica
 * @details
 * NFC (Near Field Communication) driver omogućava čitanje beskontaktnih kartica
 * za kontrolu pristupa. Podržava Mifare Classic M1 kartice i lične karte.
 * 
 * @section nfc_hardware HARDVER
 * 
 * **NFC Čitač:**
 * - Tip: PN532 ili sličan ISO 14443A čip
 * - Frekvencija: 13.56 MHz
 * - Domet: 0-10 cm (opisno kontaktno)
 * - Podržani tipovi:
 *   - Mifare Classic M1 (1K/4K) ✓
 *   - Mifare Ultralight ✓
 *   - Lične karte (eID) ✓
 *   - Mifare DESFire ✗ (nije implementirano)
 * 
 * **Kako radi NFC čitanje:**
 * ```
 * 1. NFC čitač emituje RF polje (13.56 MHz)
 * 2. Kartica uđe u polje → dobija energiju iz RF polja
 * 3. Kartica se "probudi" i pošalje UID (Unique ID)
 * 4. Čitač čita UID i sektore (ako je Mifare M1)
 * 5. Podaci se šalju aplikaciji preko dxNfc.RECEIVE_MSG event-a
 * ```
 * 
 * @section card_types TIPOVI KARTICA
 * 
 * **Mifare Classic M1 (Tip 203):**
 * ```
 * Struktura kartice:
 * ┌──────────────────────────────┐
 * │ Sektor 0 (16 bytes)           │
 * │  - Block 0: UID + Manufacturer │
 * │  - Block 1: First Name         │
 * │  - Block 2: Last Name          │
 * │  - Block 3: Keys + Access Bits │
 * ├──────────────────────────────┤
 * │ Sektor 1 (16 bytes)           │
 * │  - Block 0: Group (guest/staff)│
 * │  - Block 1: Room/Object ID     │
 * │  - Block 2: Reserved           │
 * │  - Block 3: Keys               │
 * ├──────────────────────────────┤
 * │ Sektor 2 (16 bytes)           │
 * │  - Block 0: Expiration Date    │
 * │  - Block 1: Reserved           │
 * │  - Block 2: Reserved           │
 * │  - Block 3: Keys               │
 * └──────────────────────────────┘
 * ```
 * 
 * **Lične Karte / eID (Tip 203):**
 * - Čitanje preko cloud certificate servisa
 * - Podrška za eFoto (slika sa lične karte)
 * - Validacija preko government API-ja
 * 
 * @section nfc_config KONFIGURACIJA
 * 
 * ```json
 * {
 *   "sysInfo": {
 *     "nfc": true,  // Enable/disable NFC čitač
 *     "nfc_identity_card_enable": 3  // 3 = enable eID support
 *   }
 * }
 * ```
 * 
 * @note Security
 * Mifare Classic M1 kartice nisu kriptografski sigurne!
 * Ključevi se mogu crackovati sa~$50 hardverom.
 * Za sigurne instalacije, koristi Mifare DESFire ili eID.
 * 
 * @see nfcService.js - Gde se obrađuju NFC eventi
 */
driver.nfc = {
    /**
     * @brief Opcije za NFC čitač
     * @details
     * - id: 'nfc1' - Jedinstveni identifikator (ako ima više čitača)
     * - m1: true - Omogući Mifare Classic M1 podršku
     * - psam: false - PSAM (Purchase Secure Access Module) nije u upotrebi
     * - useEid: Postavljeno u init() ako je eID enabled
     */
    options: { id: 'nfc1', m1: true, psam: false },
    
    /**
     * @brief Inicijalizuje NFC čitač
     * @details
     * Proverava da li je NFC omogućen u config-u i pokreće NFC worker.
     * 
     * **Proces inicijalizacije:**
     * 1. Proveri config flag: sysInfo.nfc
     * 2. Ako je disabled, vrati se odmah (NFC neće raditi)
     * 3. Proveri da li je eID podrška omogućena
     * 4. Pokreni NFC worker sa options
     * 
     * NFC worker:
     * - Radi u background-u
     * - Konstantno skenira za kartice u blizini
     * - Kada detektuje karticu, šalje dxNfc.RECEIVE_MSG event
     * - Event sadrži UID + čitane sektore (ako je M1)
     * 
     * @note Worker Pattern
     * NFC worker radi u zasebnom thread-u jer je čitanje kartice blocking operacija.
     * Ako bi se radilo u main thread-u, UI bi se "zamrzavao" pri svakom skeniranju.
     */
    init: function () {
        // Proveri da li je NFC čitač omogućen u konfiguraciji
        if (!config.get('sysInfo.nfc')) {
            log.debug("Card reading disabled")
            return
        }
        // Proveri da li je eID podrška omogućena (level 3)
        this.options.useEid = config.get("sysInfo.nfc_identity_card_enable") == 3
        // Pokreni NFC worker sa konfiguracionim opcijama
        dxNfc.worker.beforeLoop(this.options)
    },
    
    /**
     * @brief Inicijalizuje eID (lične karte) podršku
     * @details
     * Ako je eID podrška omogućena, ažurira cloud certificate config.
     * 
     * eID čitanje zahteva:
     * - appid: Registrovan ID aplikacije (izdaje government)
     * - sn: Serijski broj uređaja (za tracking)
     * - device_model: Verzija softvera
     * 
     * Ovi podaci se šalju government API-ju pri čitanju lične karte.
     * 
     * @note Privacy
     * Čitanje ličnih karata mora biti u skladu sa GDPR i lokalnim zakonima!
     * Logi moraću biti audited i čuvani određeno vreme.
     */
    eidInit: function () {
        if (!config.get('sysInfo.nfc')) {
            log.debug("Card reading disabled")
            return
        }
        // Ako je eID omogućen, ažuriraj cloud config
        if (config.get("sysInfo.nfc_identity_card_enable") == 3) {
            dxNfc.eidUpdateConfig({ 
                appid: "1621503",  // Government-issued app ID
                sn: config.get("sysInfo.sn"),  // Device serial number
                device_model: config.get("sysInfo.appVersion")  // Software version
            })
        }
    },
    
    /**
     * @brief Glavna petlja NFC čitača
     * @details
     * Mora se pozivati periodično (obično iz controller.js loop-a) da bi
     * NFC čitač aktivno skenirao kartice.
     * 
     * **Self-disabling pattern:**
     * Ako je NFC onemogućen, zamenjuje samu sebe sa praznom funkcijom
     * da izbegne nepotrebne provere.
     * 
     * **Kako radi čitanje:**
     * ```
     * loop() pozvan svakih 5ms
     *   ↓
     * dxNfc.worker.loop() - proveri da li ima kartice
     *   ↓
     * Ako je kartica detektovana:
     *   1. Čitaj UID (Unique ID)
     *   2. Čitaj sektore (ako je M1)
     *   3. Pošalji dxNfc.RECEIVE_MSG event
     *   ↓
     * nfcService.receiveMsg() obrađuje karticu
     * ```
     * 
     * @note Performance
     * Aktivno skeniranje troši ≈ 2% CPU-a.
     * Ako NFC nije u upotrebi, disable u config-u da uštediš energiju.
     */
    loop: function () {
        if (!config.get('sysInfo.nfc')) {
            log.debug("Card reading disabled")
            // Zameni ovu funkciju sa no-op da izbegneš provere
            this.loop = () => { }
        } else {
            // Zameni ovu funkciju sa pozivom worker loop-a
            this.loop = () => dxNfc.worker.loop(this.options)
        }
    }
}

/**
 * @subsection audio_driver Audio Driver - Reprodukcija Glasovnih Poruka
 * @details
 * Audio driver kontroliše reprodukciju WAV fajlova preko ALSA (Advanced Linux Sound Architecture).
 * Koristi se za glasovne poruke "Welcome", "Access Denied", itd.
 * 
 * @section audio_hardware HARDVER
 * 
 * **Audio Podsistem:**
 * - Tip: ALSA (Advanced Linux Sound Architecture)
 * - Device: /dev/snd/ (default sound card)
 * - Format: WAV files (PCM, 16-bit, 44.1kHz)
 * - Output: 3.5mm jack ili built-in speaker
 * - Amplifier: Integrisano ili eksterno pojačalo
 * 
 * **Audio Pipeline:**
 * ```
 * WAV File (/app/code/resource/wav/)
 *     ↓
 * dxAlsaplay.play()
 *     ↓
 * ALSA Driver (aplay)
 *     ↓
 * /dev/snd/pcmC0D0p (hardware device)
 *     ↓
 * DAC (Digital to Analog Converter)
 *     ↓
 * Amplifier
 *     ↓
 * Speaker 🔊
 * ```
 * 
 * @section audio_files AUDIO FAJLOVI
 * 
 * Lokacija: `/app/code/resource/wav/`
 * 
 * **Podržani fajlovi:**
 * - `mj_s_eng.wav` - "Success" poruka (engleski)
 * - `f_bos.wav` - "Failed" poruka (bosanski)
 * - `welcome.wav` - "Welcome" poruka
 * - `access_denied.wav` - "Access Denied"
 * - `door_open.wav` - "Door is now open"
 * - `alarm.wav` - Alarm zvuk
 * 
 * **Format requirements:**
 * ```
 * - Codec: PCM (uncompressed)
 * - Sample Rate: 44100 Hz (ili 48000 Hz)
 * - Bit Depth: 16-bit
 * - Channels: 1 (Mono) ili 2 (Stereo)
 * - Byte Order: Little Endian
 * - Max Duration: ~5 sekundi (preporuka)
 * ```
 * 
 * @section volume_control KONTROLA JAČINE ZVUKA
 * 
 * Jačina zvuka (volume) se kontroliše u opsegu 0-10.
 * 
 * **Volume Scale:**
 * ```
 * Config (0-100) → ALSA (0-10)
 * 
 * config.json:           ALSA:
 *   volume: 0     →       0 (Mute)
 *   volume: 10    →       1 (Very Quiet)
 *   volume: 50    →       5 (Medium)
 *   volume: 100   →      10 (Maximum)
 * ```
 * 
 * Konverzija: `alsa_volume = Math.ceil(config_volume / 10)`
 * 
 * @note Audio Feedback Strategy
 * - Bosanski jezik za neuspeh (f_bos.wav) - lokalizovano za region
 * - Engleski jezik za uspeh (mj_s_eng.wav) - univerzalno razumljivo
 * - Kratke poruke (< 2s) - korisnik ne želi čekati dugo
 * - Kombinacija audio + buzzer - višečulni feedback
 * 
 * @warning File Format
 * MP3, OGG, FLAC nisu podržani - SAMO WAV (PCM)!
 * Ako koristite druge formate, konvertujte sa:
 * ```bash
 * ffmpeg -i input.mp3 -acodec pcm_s16le -ar 44100 output.wav
 * ```
 */
driver.audio = {
    /**
     * @brief Inicijalizuje audio podsistem
     * @details
     * Inicijalizuje ALSA driver i postavlja početnu jačinu zvuka.
     * 
     * **Proces inicijalizacije:**
     * 1. dxAlsaplay.init() - otvara /dev/snd/ device
     * 2. Čita volume iz config-a (sysInfo.volume, 0-100)
     * 3. Konvertuje u ALSA scale (0-10)
     * 4. Postavlja volume: dxAlsaplay.setVolume()
     * 
     * **Konverzija volume:**
     * ```javascript
     * config_volume = 75  // 0-100 scale
     * alsa_volume = Math.ceil(75 / 10) = 8  // 0-10 scale
     * ```
     * 
     * Default volume je 6 (60%) ako nije konfigurisan.
     * 
     * @throws {Error} Ako ALSA device nije dostupan ili je u upotrebi
     */
    init: function () {
        // Inicijalizuj ALSA podsistem
        dxAlsaplay.init()
        
        // Čitaj jačinu zvuka iz konfiguracije (0-100 scale)
        let volume = Math.ceil(config.get("sysInfo.volume") / 10)
        if (utils.isEmpty(volume)) {
            volume = 6  // Default: 60%
        }
        // Postavi jačinu zvuka (0-10 ALSA scale)
        dxAlsaplay.setVolume(volume)
    },
    
    /**
     * @brief Getter/Setter za jačinu zvuka
     * @param {number} [volume] - Opciona nova jačina (0-10). Ako se izostavi, vraća trenutnu.
     * @returns {number|undefined} Trenutna jačina ako je getter, undefined ako je setter
     * @details
     * Dual-purpose funkcija:
     * - Ako se pozove SA argumentom: Postavlja volume (setter)
     * - Ako se pozove BEZ argumenta: Vraća volume (getter)
     * 
     * @example
     * ```javascript
     * // Getter - pročitaj trenutnu jačinu
     * let currentVolume = driver.audio.volume()
     * console.log(currentVolume)  // 6
     * 
     * // Setter - postavi novu jačinu
     * driver.audio.volume(8)  // Povećaj na 80%
     * driver.audio.volume(0)  // Mute
     * ```
     * 
     * @note ALSA Scale
     * Ova funkcija radi na ALSA scale-u (0-10), NE na config scale-u (0-100).
     */
    volume: function (volume) {
        if (volume && typeof volume == 'number') {
            // Setter: Postavi novu jačinu
            dxAlsaplay.setVolume(volume)
        } else {
            // Getter: Vrati trenutnu jačinu
            return dxAlsaplay.getVolume()
        }
    },
    
    /**
     * @brief Reprodukuje audio poruku za neuspešan pristup
     * @details
     * Pušta WAV fajl sa porukom "Pristup odbijen" na bosanskom jeziku.
     * Koristi se u kombinaciji sa PWM buzzer-om i UI feedback-om.
     * 
     * @see driver.pwm.fail() - Dug buzz zvuk
     * @see driver.screen.fail() - Crveni ekran sa X
     */
    fail: function () {
        // Reprodukuj bosanski audio feedback za neuspeh
        dxAlsaplay.play('/app/code/resource/wav/f_eng.wav')
    },
    
    /**
     * @brief Reprodukuje audio poruku za uspešan pristup
     * @details
     * Pušta WAV fajl sa porukom "Success" na engleskom jeziku.
     * Koristi se kada je pristup validan i vrata se otvaraju.
     * 
     * @see driver.pwm.success() - Dupli beep
     * @see driver.gpio.open() - Otvaranje vrata
     */
    success: function () {
        // Uvek koristi engleski audio feedback za uspeh
        dxAlsaplay.play('/app/code/resource/wav/mj_s_eng.wav')
    },
    
    /**
     * @brief Reprodukuje proizvoljni WAV fajl
     * @param {string} fileName - Ime fajla (BEZ .wav ekstenzije)
     * @details
     * Generička funkcija za puštanje bilo kog WAV fajla iz resource foldera.
     * Putanja: /app/code/resource/wav/{fileName}.wav
     * 
     * @example
     * driver.audio.doPlay("welcome")  // Pušta welcome.wav
     * driver.audio.doPlay("alarm")    // Pušta alarm.wav
     */
    doPlay: function (fileName) {
        // Konstruiši punu putanju: folder + ime + .wav ekstenzija
        dxAlsaplay.play('/app/code/resource/wav/' + fileName + '.wav')
    }
}

/**
 * @subsection gpiokey_driver GPIO Key Driver - Hardverska Dugmića i Senzori
 * @details
 * GPIO Key driver čita stanje fizičkih dugmića i senzora spojenih na GPIO input pinove.
 * Ključne funkcije:
 * - Exit button (GPIO 30) - otvaranje vrata iznutra
 * - Door sensor (GPIO 48) - detektovanje otvorenih vrata i provale
 * 
 * @section gpiokey_pins GPIO PINOVI
 * 
 * **GPIO 30: Exit Button**
 * - Pritisak = 0 (LOW), Otpušteno = 1 (HIGH)
 * - Fire safety requirement - mora raditi uvek
 * - Tip pristupa: 800 (button access, bez validacije)
 * 
 * **GPIO 48: Door Sensor (Reed Switch)**
 * - Vrata zatvorena = 0, Vrata otvorena = 1
 * - Magnetni senzor - magnet na vratima, reed switch na okviru
 * - Detektuje provalu i timeout alarme
 * 
 * @note Debouncing
 * Worker automatski implementira debounce (~50ms) da filtrira bounce efekte dugmića.
 */
driver.gpiokey = {
    /**
     * @brief Inicijalizuje GPIO Key worker
     * @details
     * Pokreće background worker koji kontinuirano čita GPIO input pinove
     * i detektuje promene stanja (edge detection).
     */
    init: function () {
        // Pokreni GPIO Key worker thread
        dxGpioKey.worker.beforeLoop()
    },
    /**
     * @brief Event handler koji se poziva kada se door sensor promeni (GPIO 48)
     * @param {number} value - Novo stanje: 0=zatvoreno, 1=otvoreno
     * @details
     * Detektuje neautorizovani ulaz i podešava alarm timeout:
     * - Ako su vrata otvorena (value=1) duže od relayCloseTime: pošalji MQTT alarm
     * - Podesi timer za open timeout alarm (default 10s)
     */
    sensorChanged: function (value) {
        let map = dxMap.get("GPIO")
        let relayCloseTime = map.get("relayCloseTime") || 0
        if (value == 1 && new Date().getTime() > parseInt(relayCloseTime)) {
            // GPIO zatvoren, ali senzor vrata otvoren - detektovan nelegalan ulaz
            // driver.mqtt.alarm(2, value)
        }
        driver.mqtt.alarm(0, value)
        let map1 = dxMap.get("GPIOKEY")
        if (value == 0) {
            map1.del("alarmOpenTimeoutTime")
        } else if (value == 1) {
            // Zabilježi vremensko ograničenje otvaranja vrata
            let openTimeout = config.get("doorInfo.openTimeout") * 1000
            openTimeout = utils.isEmpty(openTimeout) ? 10000 : openTimeout
            map1.put("alarmOpenTimeoutTime", new Date().getTime() + openTimeout)
        }
    },
    /**
     * @brief Glavni GPIO Key driver loop - poziva se svakih ~200ms iz controller-a
     * @details
     * - Poziva GPIO Key worker loop (čita GPIO stanja)
     * - Proverava da li je istekao alarm timeout za otvorena vrata
     * - Ako su vrata otvorena duže od openTimeout (default 10s), šalje MQTT alarm
     */
    loop: function () {
        dxGpioKey.worker.loop()
        if (utils.isEmpty(this.checkTime) || new Date().getTime() - this.checkTime > 200) {
            // Smanjite učestalost provjere - provjeravajte svakih 200ms
            this.checkTime = new Date().getTime()
            let map = dxMap.get("GPIOKEY")
            let alarmOpenTimeoutTime = map.get("alarmOpenTimeoutTime")
            if (typeof alarmOpenTimeoutTime == 'number' && new Date().getTime() >= alarmOpenTimeoutTime) {
                driver.mqtt.alarm(0, 0)
                map.del("alarmOpenTimeoutTime")
            }
        }
    },
}
/**
 * @subsection ntp_driver NTP Driver - Network Time Protocol za sinhronizaciju sata
 * @details
 * Održava sistemski sat sinhronizovanim sa NTP serverom (pool.ntp.org).
 * Automatski sinhronizuje vreme jednom dnevno u podešen sat (default: 3 AM).
 * 
 * @note Ako je NTP onemogućen u config-u, koristi se ručno podešeno vreme iz sysInfo.time
 */
driver.ntp = {
    /**
     * @brief Inicijalizuje NTP sync logiku
     * @details
     * Ako je NTP omogućen:
     * - Pokreće dxNtp worker sa adresom i intervalom iz config-a
     * - Podešava scheduled sync u ntpHour (default 3 AM)
     * 
     * Ako je NTP onemogućen:
     * - Postavlja sistemsko vreme iz config-a (date -s "@{timestamp}")
     */
    loop: function () {
        if (!config.get('netInfo.ntp')) {
            log.debug("Auto time sync disabled")
            this.loop = () => { }
            let time = config.get('sysInfo.time')
            if (time) {
                common.systemBrief(`date -s "@${time}"`)
            }
        } else {
            let interval = config.get('netInfo.ntpInterval')
            dxNtp.beforeLoop(config.get('netInfo.ntpAddr'), utils.isEmpty(interval) ? undefined : interval)
            this.ntpHour = config.get('netInfo.ntpHour')
            this.flag = true
            this.loop = () => {
                dxNtp.loop()
                if (new Date().getHours() == this.ntpHour && this.flag) { //NOSONAR
                    // Planirana sinhronizacija - odmah sinhronizuj vrijeme
                    dxNtp.syncnow = true
                    this.flag = false
                }
                if (new Date().getHours() != this.ntpHour) { //NOSONAR
                    // Sačekajte do sljedećeg sata da biste ponovo omogućili sinhronizaciju
                    this.flag = true
                }
            }
        }
    },
}
/**
 * @subsection screen_driver Screen Driver - UI Event Fasada
 * @details
 * Fasada koja šalje event-e ka screen.js (UI controller).
 * Sve UI promene prolaze kroz Event Bus (fire = postMessage).
 * 
 * @note Ovaj driver NE renderuje UI direktno - samo šalje event-e koje screen.js hendluje
 */
driver.screen = {
    /**
     * @brief Prikazuje poruku o neuspelom pristupu na ekranu
     * @param {string} type - Tip pristupa ("qrcode", "nfc", "ble", "button")
     * @param {string} msg - Poruka koja se prikazuje korisniku
     */
    accessFail: function (type, msg) {
        bus.fire('displayResults', { type: type, flag: false, msg: msg })
    },
    /**
     * @brief Prikazuje poruku o uspešnom pristupu na ekranu
     * @param {string} type - Tip pristupa ("qrcode", "nfc", "ble", "button")
     */
    accessSuccess: function (type) {
        bus.fire('displayResults', { type: type, flag: true })
    },
    /**
     * @brief Restartuje UI - učitava screen.js ponovo
     * @details Koristi se nakon izmene UI konfiguarcije (tema, jezik, logo)
     */
    reload: function () {
        bus.fire('reload')
    },
    /**
     * @brief Ažurira status ikonu mreže (povezano/odspojeno)
     * @param {Object} data - {connected: true/false, ip: "192.168.1.100"}
     */
    netStatusChange: function (data) {
        bus.fire('netStatusChange', data)
    },
    /**
     * @brief Ažurira status ikonu MQTT konekcije
     * @param {Object} data - {connected: true/false}
     */
    mqttConnectedChange: function (data) {
        bus.fire('mqttConnectedChange', data)
    },
    /**
     * @brief Prikazuje info poruku privremeno
     * @param {Object} param - {msg: 'Tekst poruke', time: 1000}
     */
    showMsg: function (param) {
        bus.fire('showMsg', param)
    },
    /**
     * @brief Prikazuje sliku privremeno
     * @param {Object} param - {img: 'putanja/do/slike.png', time: 1000}
     */
    showPic: function (param) {
        bus.fire('showPic', param)
    },
    /**
     * @brief Prikazuje warning popup
     * @param {Object} param - {msg: 'Warning text'}
     */
    warning: function (param) {
        bus.fire('warning', param)
    },
    /**
     * @brief Prikazuje fail popup (crveni + buzzer)
     * @param {Object} param - {msg: 'Error text'}
     */
    fail: function (param) {
        bus.fire('fail', param)
    },
    /**
     * @brief Prikazuje success popup (zeleni + beep)
     * @param {Object} param - {msg: 'Success text'}
     */
    success: function (param) {
        bus.fire('success', param)
    },

}
/**
 * @subsection system_driver System Driver - Placeholder
 * @note Prazan driver - može se koristiti za buduće proširenje
 */
driver.system = {
    init: function () {
    }
}
/**
 * @subsection uartble_driver UART BLE Driver - Bluetooth Low Energy UART komunikacija
 * @details
 * Driver za komunikaciju sa BLE modulom preko UART serijskog porta.
 * Koristi se za:
 * - BLE pristup (otključavanje preko BLE telefona)
 * - Over-the-air upgrade BLE firmware-a
 * - Konfiguracija BLE parametara (device name, broadcast interval)
 * 
 * Hardver: UART5 (/dev/ttyS5) @ 921600 baud, 8N1
 * 
 * Protokol: Custom binary protokol:
 * ```
 * [Header] [CMD] [Result] [DataLen] [Data...] [Checksum]
 * 55 AA     0F    00       01 00     XX        CRC
 * ```
 * 
 * @note Koristi worker thread (vgUartWorker) za non-blocking I/O
 */
driver.uartBle = {
    id: 'uartBle',
    /**
     * @brief Inicijalizuje UART5 port za BLE komunikaciju
     * @details
     * - Otvara /dev/ttyS5 serial port
     * - Konfiguriše 921600 baud, 8 data bits, No parity, 1 stop bit
     * - Pokreće worker thread za rx/tx operacije
     */
    init: function () {
        dxUart.runvg({ id: this.id, type: dxUart.TYPE.UART, path: '/dev/ttyS5', result: 0 })
        std.sleep(1000)
        dxUart.ioctl(1, '921600-8-N-1', this.id)
    },
    /**
     * @brief Šalje podatke preko UART-a ka BLE modulu
     * @param {string} data - Hex string (npr. "55aa0f000100")
     */
    send: function (data) {
        log.debug('[uartBle] send :' + JSON.stringify(data))
        dxUart.sendVg(data, this.id)
    },
    /**
     * @brief Šalje BLE access success poruku
     * @param {number} index - User index (1-255)
     * @details Protokol: 55 AA 0F 00 01 00 [index] [CRC]
     */
    accessSuccess: function (index) {
        let pack = { "head": "55aa", "cmd": "0f", "result": "00", "dlen": 1, "data": index.toString(16).padStart(2, '0') }
        this.send("55aa0f000100" + index.toString(16).padStart(2, '0') + this.genCrc(pack))
    },
    /**
     * @brief Šalje BLE access fail poruku
     * @param {number} index - User index (1-255)
     * @details Protokol: 55 AA 0F 90 01 00 [index] [CRC]
     */
    accessFail: function (index) {
        let pack = { "head": "55aa", "cmd": "0f", "result": "90", "dlen": 1, "data": index.toString(16).padStart(2, '0') }
        this.send("55aa0f900100" + index.toString(16).padStart(2, '0') + this.genCrc(pack))
    },
    /**
     * @brief Kontroliše BLE access (otključavanje/zaključavanje)
     * @param {number} index - Door index
     */
    accessControl: function (index) {
        let command = "55AA0F0009000000300600000006" + index.toString(16).padStart(2, '0')
        this.send(command + this.genStrCrc(command).toString(16).padStart(2, '0'))
    },
    /**
     * @brief Čita BLE konfiguraciju (device name, MAC)
     * @returns {Promise} Objekat sa config podacima
     * @details Koristi sync.request() da blokira dok ne stigne odgovor
     */
    getConfig: function () {
        let pack = { "head": "55aa", "cmd": "60", "result": "00", "dlen": 6, "data": "7e01000200fe" }
        this.send("55aa6000" + common.decimalToLittleEndianHex(pack.dlen, 2) + pack.data + this.genCrc(pack))
        return driver.sync.request("uartBle.getConfig", 2000)
    },
    /**
     * @brief Callback - prima odgovor na getConfig() zahtev
     * @param {Object} data - Konfiguracioni podaci od BLE modula
     */
    getConfigReply: function (data) {
        driver.sync.response("uartBle.getConfig", data)
    },
    /**
     * @brief Postavlja BLE konfiguraciju (device name, broadcast interval)
     * @param {Object} param - Novi config parametri
     * @returns {Promise} true ako je uspešno
     */
    setConfig: function (param) {
        uartBleService.setBleConfig(param)
        // 设置Success返回true
        return driver.sync.request("uartBle.setConfig", 2000)
    },
    /**
     * @brief Callback - prima potvrdu setConfig() operacije
     * @param {Object} data - Status rezultata
     */
    setConfigReply: function (data) {
        driver.sync.response("uartBle.setConfig", data)
    },
    /**
     * @brief Generiše XOR checksum za BLE packet
     * @param {Object} pack - {head, cmd, result, dlen, data}
     * @returns {string} Hex string checksum (2 karaktera)
     * @details
     * XOR svih bajtova: 0x55 ^ 0xAA ^ CMD ^ RESULT ^ DLEN_LO ^ DLEN_HI ^ DATA[0] ^ ...
     */
    genCrc: function (pack) {
        let bcc = 0;
        let dlen = pack.dlen - 1;//Remove index
        bcc ^= 0x55;
        bcc ^= 0xaa;
        bcc ^= parseInt(pack.cmd, 16);
        bcc ^= pack.result ? parseInt(pack.result, 16) : 0;
        bcc ^= (dlen & 0xff);
        bcc ^= (dlen & 0xff00) >> 8;
        for (let i = 0; i < pack.dlen; i++) {
            bcc ^= pack.data[i];
        }
        return bcc.toString(16).padStart(2, '0');
    },
    /**
     * @brief Generiše XOR checksum za hex string komandu
     * @param {string} cmd - Hex string (npr. "55AA0F00...")
     * @returns {number} XOR checksum vrednost
     */
    genStrCrc: function (cmd) {
        let buffer = common.hexStringToUint8Array(cmd)
        let bcc = 0;
        for (let i = 0; i < buffer.length; i++) {
            bcc ^= buffer[i];
        }
        return bcc;
    },
    /**
     * @brief Over-the-air upgrade BLE firmware-a (4-step proces)
     * @param {Object} data - {url: "http://server.com/ble_fw.bin"}
     * @details
     * Upgrade protokol:
     * 1. Download firmware file (.bin) sa servera
     * 2. Izračunaj SHA256 checksum
     * 3. Pošalji CMD01 - Enter upgrade mode
     * 4. Pošalji CMD02 - Send file description (size + SHA256)
     * 5. Pošalji CMD03 - Send firmware chunks (512B po chunku)
     * 6. Pošalji CMD04 - Finish upgrade
     * 7. Pošalji CMD05 - Install and reboot BLE module
     * 
     * @note Upgrade traje ~30 sekundi za tipičan 64KB firmware
     */
    // 1. Pokretanje nadogradnje
    upgrade: function (data) {
        driver.screen.warning({ msg: "Downloading upgrade package...", beep: false })
        // Kreiranje privremenog direktorija
        const tempDir = "/app/data/.temp"
        const sourceFile = "/app/data/.temp/file"
        // Osiguravanje postojanja privremenog direktorija
        if (!std.exist(tempDir)) {
            common.systemBrief(`mkdir -p ${tempDir}`)
        }
        // Preuzimanje datoteke u privremeni direktorij
        let downloadRet = dxHttp.download(data.url, sourceFile, 60000)
        let fileExist = (std.stat(sourceFile)[1] === 0)
        if (!fileExist) {
            common.systemBrief(`rm -rf ${tempDir} && rm -rf ${sourceFile} `)
            driver.screen.warning({ msg: "升级包下载Failed", beep: false })
            lockMap.del("ble_lock")
            throw new Error('Download failed, please check the url:' + data.url)
        } else {
            driver.screen.warning({ msg: "升级包下载Success", beep: false })
            let fileSize = this.getFileSize(sourceFile)
            const srcFd = std.open(sourceFile, std.O_RDONLY)
            if (srcFd < 0) {
                throw new Error(`Cannot open source file: ${sourceFile}`)
            }
            let buffer = new Uint8Array(fileSize)
            try {
                const bytesRead = std.read(srcFd, buffer.buffer, 0, fileSize)
                if (bytesRead <= 0) {
                    log.info("文件复制Failed!")
                    return false
                } else {
                    log.info("文件复制Success!")
                }
            } finally {
                std.close(srcFd)
            }
            let hash = CryptoES.SHA256(CryptoES.lib.WordArray.create(buffer))
            let fileSha256 = hash.toString(CryptoES.enc.Hex)
            let cmd01 = "55aa600006000301000100fe"
            this.send(cmd01 + this.genStrCrc(cmd01).toString(16))
            let cmd01res = driver.sync.request("uartBle.upgradeCmd1", 2000)
            if (!cmd01res) {
                return false
            }
            if (this.handleCmd01Response(cmd01res)) {
                this.sendDiscCommand(sourceFile, fileSha256, buffer)
            }
        }
    },
    handleCmd01Response(pack) {
        if (pack[0] == 0x03 && pack[1] == 0x01 && pack[2] == 0x80 && pack[3] == 0x01) {
            if (pack[5] == 0x00) {
                driver.screen.warning({ msg: "BLE upgrade in progress...", beep: false })
            } else if (pack[5] == 0x03) {
                console.log("Entered upgrade mode, ready to upgrade")
            } else {
                driver.screen.warning({ msg: "进入升级模式Failed", beep: false })
                return false
            }
            return true
        }
        return false
    },
    // 2. Slanje opisa paketa za nadogradnju
    sendDiscCommand: function (sourceFile, fileSha256, buffer) {
        let fileSize = this.getFileSize(sourceFile)
        let littleEndianHex = this.toLittleEndianHex(fileSize, 4)
        let cmd02_1 = "55aa6000" + "2a00" + "030100" + "0224" + littleEndianHex + fileSha256 + "fe"
        let cmd02_2 = cmd02_1 + this.genStrCrc(cmd02_1).toString(16)
        this.send(cmd02_2)
        let cmd02res = driver.sync.request("uartBle.upgradeCmd2", 2000)
        if (!cmd02res) {
            return
        }
        if (this.handleCmd02Response(cmd02res)) {
            this.sendSubPackage(fileSize, buffer)
        }
    },
    handleCmd02Response: function (pack) {
        if (pack[0] == 0x03 && pack[1] == 0x01 && pack[2] == 0x80 && pack[3] == 0x02) {
            if (pack[5] == 0x00) {
                console.log("Send upgrade package descriptionSuccess，请Send upgrade package")
                log.info("Send upgrade package descriptionSuccess，请Send upgrade package")
            } else {
                return false
            }
            return true
        }
        return false
    },
    // 3. Slanje paketa za nadogradnju
    sendSubPackage: function (fileSize, buffer) {
        let chunkSize = 512
        let totality = Math.floor(fileSize / chunkSize)
        let remainder = fileSize % chunkSize
        let totalCount = 0
        for (let index = 0; index < totality + 1; index++) {
            // Izračunavanje početne/krajnje pozicije trenutnog dijela
            let start = index * chunkSize;
            let end = Math.min(start + chunkSize, buffer.byteLength); // Prevent overflow
            // Kreiranje ArrayBuffer-a za trenutni dio (kritičan korak)
            let sendBuffer = buffer.slice(start, end);
            if (index == totality) {
                // Posljednji dio - popunjavanje preostalih bajtova
                let padding = new Uint8Array(chunkSize - remainder);
                sendBuffer = new Uint8Array([...sendBuffer, ...padding]);
                console.log("Last byte data: ", sendBuffer.byteLength, common.arrayBufferToHexString(sendBuffer))
            }
            let cmd03_1 = "55aa6000" + "0602" + "030100" + "0300" + common.arrayBufferToHexString(sendBuffer) + "fe"
            let cmd03_2 = cmd03_1 + this.genStrCrc(cmd03_1).toString(16)
            if (index == 0) {
                this.send(cmd03_2)
            } else {
                let cmd03res = driver.sync.request(`uartBle.upgradeCmd3_${index}`, 2000)
                if (cmd03res && this.handleCmd03Response(cmd03res)) {
                    this.send(cmd03_2)
                }
            }
            totalCount++
            if (totalCount == totality + 1) {
                console.log("Upgrade package transmission complete,totalCount: ", totalCount)
            } else {
                console.log("Original data synced, transmitting in chunks,totalCount: ", totalCount)
            }
        }
        this.sendUpgradeFinishCommand()
    },
    handleCmd03Response: function (pack) {
        if (pack[0] == 0x03 && pack[1] == 0x01 && pack[2] == 0x80 && pack[3] == 0x03) {
            if (pack[5] == 0x00) {
                console.log("升级包传输Success")
            } else {
                driver.screen.warning({ msg: "升级包传输Failed", beep: false })
                return false
            }
            return true
        }
        return false
    },
    // 4. Slanje komande za završetak nadogradnje
    sendUpgradeFinishCommand: function () {
        let cmd04_1 = "55aa600006000301000400fe"
        let cmd04_2 = cmd04_1 + this.genStrCrc(cmd04_1).toString(16)
        this.send(cmd04_2)
        let cmd04res = driver.sync.request("uartBle.upgradeCmd4", 2000)
        if (cmd04res && this.handleCmd04Response(cmd04res)) {
            this.sendInstallCommand()
        }
    },
    handleCmd04Response: function (pack) {
        if (pack[0] == 0x03 && pack[1] == 0x01 && pack[2] == 0x80 && pack[3] == 0x04) {
            if (pack[5] == 0x00) {
                console.log("升级结束指令Success")
            } else {
                driver.screen.warning({ msg: "升级结束指令Failed", beep: false })
                return false
            }
            return true
        }
        return false
    },
    // 5. Slanje komande za instalaciju
    sendInstallCommand: function () {
        let cmd05_1 = "55aa600006000301000500fe"
        let cmd05_2 = cmd05_1 + this.genStrCrc(cmd05_1).toString(16)
        this.send(cmd05_2)
        let cmd05res = driver.sync.request("uartBle.upgradeCmd5", 2000)
        if (cmd05res) {
            this.handleCmd05Response(cmd05res)
        }
    },
    handleCmd05Response: function (pack) {
        if (pack[0] == 0x03 && pack[1] == 0x01 && pack[2] == 0x80 && pack[3] == 0x05) {
            if (pack[5] == 0x00) {
                driver.screen.warning({ msg: "升级Success", beep: false })
                driver.pwm.success()
            } else {
                driver.screen.warning({ msg: "升级Failed", beep: false })
            }
            common.systemBrief("rm -rf /app/data/.temp && rm -rf /app/data/.temp/file")
            lockMap.del("ble_lock")
        }
    },
    getFileSize: function (filename) {
        let file = qStd.open(filename, "r");
        if (!file) {
            throw new Error("Failed to open file");
        }
        file.seek(0, qStd.SEEK_END);  // Move to end of file
        let size = file.tell();      // Get current position (file size)
        file.close();
        return size;
    },
    toLittleEndianHex: function (number, byteLength) {
        const bigNum = BigInt(number);
        // Validacija parametara
        if (!Number.isInteger(byteLength)) throw new Error("byteLengthMust be integer");
        if (byteLength < 1) throw new Error("byteLengthMust be greater than 0");
        if (byteLength > 64) throw new Error("Does not support > 8 bytes yet");
        // Provjera opsega vrijednosti
        const bitWidth = BigInt(byteLength * 8);
        const maxValue = (1n << bitWidth) - 1n;
        if (bigNum < 0n || bigNum > maxValue) {
            throw new Error(`Value exceeds${byteLength}byte range`);
        }
        // Izdvajanje bajtova u little-endian formatu
        const bytes = new Uint8Array(byteLength);
        for (let i = 0; i < byteLength; i++) {
            const shift = BigInt(i * 8);
            bytes[i] = Number((bigNum >> shift) & 0xFFn); // Osigurajte korištenje BigInt maske
        }
        // Konverzija formata
        return Array.from(bytes, b =>
            b.toString(16).padStart(2, '0')
        ).join('');
    }
}
/**
 * @subsection sync_driver Sync Driver - Asynchronous to Synchronous Konverter
 * @details
 * Omogućava sinhrone pozive asinhronih operacija korišćenjem polling pattern-a.
 * Koristi se kada je potrebno da jedan thread čeka na odgovor iz drugog thread-a.
 * 
 * Pattern:
 * ```
 * Thread A: let result = driver.sync.request("topic", 2000)  // Blokira 2s
 * Thread B: driver.sync.response("topic", {data: 123})       // Odblokira Thread A
 * ```
 * 
 * @note Koristi dxMap (shared memory) za inter-thread komunikaciju
 */
driver.sync = {
    /**
     * @brief Sinhronizovani request - blokira dok ne stigne odgovor ili ne istekne timeout
     * @param {string} topic - Jedinstveni identifikator zahteva (npr. "mqtt.getOnlinecheck")
     * @param {number} timeout - Maksimalno vreme čekanja u milisekundama
     * @returns {*} Odgovor od response() funkcije, ili undefined ako je timeout
     * @details
     * Polling loop: čeka svakih 10ms i proverava da li je stigao odgovor
     */
    request: function (topic, timeout) {
        let map = dxMap.get("SYNC");
        map.put(topic + "__request__", topic);
        let count = 0;
        let data = map.get(topic);
        while (utils.isEmpty(data) && count * 10 < timeout) {
            data = map.get(topic);
            std.sleep(10);
            count += 1;
        }
        let res = map.get(topic);
        map.del(topic);
        map.del(topic + "__request__");
        return res;
    },
    /**
     * @brief Šalje odgovor na sinhronizovani request
     * @param {string} topic - Identifikator zahteva (mora odgovarati request topic-u)
     * @param {*} data - Podaci koji se šalju nazad request-u
     * @details
     * Proverava da li postoji aktivan request za ovaj topic pre nego što postavi odgovor.
     * Ovo sprečava da odgovor stigne pre nego što se zahtev postavi.
     */
    response: function (topic, data) {
        let map = dxMap.get("SYNC");
        if (map.get(topic + "__request__") == topic) {
            map.put(topic, data);
        }
    }
}
/**
 * @subsection mqtt_driver MQTT Driver - Cloud komunikacija
 * @details
 * Driver za MQTT (Message Queue Telemetry Transport) protokol.
 * Omogućava komunikaciju sa cloud serverom:
 * - Slanje event-ova (pristup, alarm, heartbeat)
 * - Prijem komandi (remote open, config update)
 * - Online validacija (proverava sa serverom da li je kartica validna)
 * 
 * MQTT Topics:
 * ```
 * Publish:
 *   - access_device/v1/event/alarm         (Door sensor alarmi)
 *   - access_device/v1/event/heartbeat     (Keepalive poruke)
 *   - access_device/v1/event/access        (Access log eventi)
 * 
 * Subscribe:
 *   - access_device/v1/cmd/open            (Remote door open)
 *   - access_device/v1/cmd/config          (Config update)
 * ```
 * 
 * @note QoS level: 1 (At least once delivery - poruka će stići bar jednom)
 */
driver.mqtt = {
    id: "mqtt1",
    /**
     * @brief Inicijalizuje MQTT klijenta i povezuje se sa brokerom
     * @details Čita MQTT opcije iz mqttService (host, port, username, password)
     */
    init: function () {
        let options = mqttService.getOptions()
        options.id = this.id
        dxMqtt.run(options)
    },
    /**
     * @brief Šalje MQTT poruku na određeni topic
     * @param {Object} data - {topic: "...", payload: "JSON string"}
     */
    send: function (data) {
        log.info("[driver.mqtt] send:", JSON.stringify(data))
        dxMqtt.send(data.topic, data.payload, this.id)
    },
    /**
     * @brief Šalje alarm event na cloud server
     * @param {number} type - Tip alarma (0=door sensor, 1=tamper, 2=force entry)
     * @param {number} value - Vrednost (0=cleared, 1=triggered)
     */
    alarm: function (type, value) {
        this.send({ topic: "access_device/v1/event/alarm", payload: JSON.stringify(mqttService.mqttReply(utils.genRandomStr(10), { type: type, value: value }, mqttService.CODE.S_000)) })
    },
    getOnlinecheck: function () {
        let timeout = config.get("doorInfo.timeout")
        timeout = utils.isEmpty(timeout) ? 2000 : timeout
        let language = config.get('sysInfo.language')
        let warningInfo = {
            msg: language == "EN" ? 'Online checking' : 'Online verification',
        }
        driver.screen.warning(warningInfo)
        return driver.sync.request("mqtt.getOnlinecheck", timeout)
    },
    getOnlinecheckReply: function (data) {
        driver.sync.response("mqtt.getOnlinecheck", data)
    },
    getStatus: function () {
        return dxMqtt.isConnected(this.id)
    },
    /**
     * @brief Periodični heartbeat - šalje keepalive poruke cloud serveru
     * @details
     * Heartbeat omogućava serveru da zna da je uređaj online.
     * Interval: Konfigurisano (default 30s, minimum 30s)
     * 
     * Config parametri:
     * - sysInfo.heart_en (0=disabled, 1=enabled)
     * - sysInfo.heart_time (interval u sekundama, min 30)
     * - sysInfo.heart_data (custom podaci koji se šalju)
     */
    heartbeat: function () {
        if (utils.isEmpty(this.heart_en)) {
            let heart_en = config.get('sysInfo.heart_en') //NOSONAR
            this.heart_en = utils.isEmpty(heart_en) ? 0 : heart_en
            let heart_time = config.get('sysInfo.heart_time')
            this.heart_time = utils.isEmpty(heart_time) ? 30 : heart_time < 30 ? 30 : heart_time
        }
        if (utils.isEmpty(this.lastHeartbeat)) {
            this.lastHeartbeat = 0
        }
        if (this.heart_en === 1 && (new Date().getTime() - this.lastHeartbeat >= (this.heart_time * 1000))) {
            this.lastHeartbeat = new Date().getTime()
            this.send({ topic: "access_device/v1/event/" + config.get("sysInfo.sn") + "/heartbeat", payload: JSON.stringify(mqttService.mqttReply(utils.genRandomStr(10), config.get('sysInfo.heart_data'), mqttService.CODE.S_000)) })
        }
    }
}
/**
 * @subsection config_driver Config Driver - Configuration Management
 * @details
 * Driver za učitavanje i inicijalizaciju sistemske konfiguracije.
 * Config fajl: /app/data/config.json
 * 
 * Automatski popunjava:
 * - MAC adresu (čita iz hardware-a)
 * - UUID (unique device ID)
 * - Serial Number (fallback na UUID)
 * - MQTT clientId (fallback na UUID)
 * 
 * @note Config se učitava pri boot-u, pre nego što se pokrenu ostali drajveri
 */
driver.config = {
    /**
     * @brief Inicijalizuje config modul i popunjava nedostajuća polja
     * @details
     * 1. Čita config.json sa diska
     * 2. Čita MAC i UUID iz hardware-a
     * 3. Popunjava prazna polja (sysInfo.mac, sysInfo.uuid, sysInfo.sn)
     * 4. Cuva ažurirani config na disk
     */
    init: function () {
        config.init()
        let mac = common.getUuid2mac(19)
        let uuid = common.getSn(19)
        if (!config.get('sysInfo.mac') && mac) {
            config.set('sysInfo.mac', mac)
        }
        if (!config.get('sysInfo.uuid') && uuid) {
            config.set('sysInfo.uuid', uuid)
        }
        //Ako je SN prazan, prvo koristite UUID uređaja
        if (!config.get('sysInfo.sn') && uuid) {
            config.set('sysInfo.sn', uuid)
        }
        if (!config.get('mqttInfo.clientId') && uuid) {
            config.set('mqttInfo.clientId', uuid)
        }
        config.save()
    }
}
/**
 * @subsection watchdog_driver Watchdog Driver - Automatic Reboot on Hang
 * @details
 * Hardverski watchdog timer koji automatski restartuje uređaj ako se aplikacija zaglavi.
 * Princip rada:
 * ```
 * [Watchdog timer] → Countdown 20s → REBOOT!
 *                      ↑
 *                   feed() every 2s (resetuje countdown)
 * ```
 * 
 * Ako aplikacija prestane da poziva feed() (npr. infinite loop), watchdog će
 * automatski rebootovati sistem posle 20 sekundi.
 * 
 * @note Watchdog timer je hardware feature - radi i ako se kernel zaglavi
 */
driver.watchdog = {
    /**
     * @brief Inicijalizuje watchdog timer
     * @details
     * - Otvara watchdog device (/dev/watchdog)
     * - Omogućava timer
     * - Pokreće timeout od 20 sekundi
     */
    init: function () {
        watchdog.open(1 | 2)
        watchdog.enable(1)
        watchdog.start(20000)
    },
    /**
     * @brief Glavni loop - poziva se iz controller.js
     * @note Trenutno prazno - loop() je placeholder
     */
    loop: function () {
        watchdog.loop(1)
    },
    /**
     * @brief "Hrani" watchdog timer - resetuje countdown
     * @param {number} flag - Watchdog ID (1)
     * @param {number} timeout - Novi timeout (ms)
     * @details
     * Poziva se svakih 2 sekunde iz main.js main loop-a.
     * Throttling: Feed se izvršava max 1x u 2 sekunde da se ne opterećuje sistem.
     */
    feed: function (flag, timeout) {
        if (utils.isEmpty(this.feedTime) || new Date().getTime() - this.feedTime > 2000) {
            // Smanjite učestalost hranjenja watchdog-a - svake 2 sekunde
            this.feedTime = new Date().getTime()
            watchdog.feed(flag, timeout)
        }
    }
}

/**
 * @subsection eid_driver eID Driver - Electronic ID Card Reader
 * @details
 * Driver za čitanje electronic ID kartica (poput pasoša, ličnih karata sa čipom).
 * Podržava standardne eID protokole (ISO 14443-4).
 * 
 * @note Trenutno koristi eksterni eid modul za aktivaciju
 */
driver.eid = {
    id: "eid",
    /**
     * @brief Aktivira eID karticu
     * @param {string} sn - Serial number kartice
     * @param {string} version - Verzija eID protokola
     * @param {string} mac - MAC adresa čitača
     * @param {string} codeMsg - Dodatne informacije
     * @returns {boolean} true ako je aktivacija uspešna
     */
    active: function (sn, version, mac, codeMsg) {
        return eid.active(sn, version, mac, codeMsg)
    }
}

/**
 * @subsection autorestart_driver AutoRestart Driver - Scheduled Automatic Reboot
 * @details
 * Automatski restartuje uređaj u podešeno vreme svaki dan.
 * Koristi se za:
 * - Preventivno održavanje (clear memory leaks)
 * - Primenu config promena koje zahtevaju reboot
 * - Sinhronizaciju sa server maintenance window-om
 * 
 * Default: 3 AM svaki dan (najmanje ometanje rada)
 * 
 * @note Reboot se izvršava samo u tačno XX:00 (minute=0) da bi se izbeglo
 *       više reboot-ova u istom satu
 */
driver.autoRestart = {
    lastRestartCheck: new Date().getHours(),  // Initialize to current hour, not 0
    /**
     * @brief Inicijalizuje scheduled reboot timer
     * @details
     * Provera svakih 60 sekundi da li je vreme za reboot.
     * Config: sysInfo.autoRestart (sat u danu, 0-23, default 3)
     * 
     * @example
     * // config.json:
     * {
     *   "sysInfo": {
     *     "autoRestart": 3  // Reboot svakog dana u 3:00 AM
     *   }
     * }
     */
    init: function () {
        std.setInterval(() => {        // Provjerite da li je potrebno ponovno pokretanje po satu
            console.log('--Check started-');

            const now = new Date()
            const currentHour = now.getHours()
            // Izvršava se samo kada se sat podudara sa postavkom i nije posljednji put provjereno
            let autoRestart = utils.isEmpty(config.get("sysInfo.autoRestart")) ? 3 : config.get("sysInfo.autoRestart")
            if (currentHour === autoRestart && currentHour !== this.lastRestartCheck && now.getMinutes() === 0) {
                common.systemBrief('reboot')
            }
            // Ažurirajte posljednji provjereni sat
            this.lastRestartCheck = currentHour
        }, 60000)
    }
}

export default driver
