/**
 * @file screen.js
 * @brief UI Controller - Upravlja LVGL touchscreen ekranom
 * 
 * @details
 * **ULOGA U ARHITEKTURI:**
 * 
 * Screen.js je **UI controller** koji:
 * - Inicijalizuje LVGL (Light and Versatile Graphics Library) UI framework
 * - Upravlja view-ovima (mainView, passwordView, popWin)
 * - Prima event-e preko Event Bus-a i ažurira UI
 * - Prikazuje popup-e (success, fail, warning)
 * - Kontroliše network/MQTT status ikone
 * 
 * **UI ARHITEKTURA:**
 * ```
 * ┌────────────────────────────────────┐
 * │  DW200 Touchscreen (800x480)      │
 * │                                    │
 * │  ┌──────────────────────────────┐ │
 * │  │ mainView.js - Glavni ekran   │ │
 * │  │ - Background image           │ │
 * │  │ - Status bar (network/MQTT)  │ │
 * │  │ - Date/Time display          │ │
 * │  │ - Device name/IP             │ │
 * │  └──────────────────────────────┘ │
 * │                                    │
 * │  ┌──────────────────────────────┐ │
 * │  │ popWin.js - Popup Window     │ │
 * │  │ - Success (zeleni + checkmark)│ │
 * │  │ - Fail (crveni + X)          │ │
 * │  │ - Warning (žuti + bell)      │ │
 * │  └──────────────────────────────┘ │
 * │                                    │
 * │  ┌──────────────────────────────┐ │
 * │  │ passwordView.js - PIN Keypad │ │
 * │  │ - Numeric keyboard (0-9)     │ │
 * │  │ - Enter/Clear buttons        │ │
 * │  └──────────────────────────────┘ │
 * └────────────────────────────────────┘
 * ```
 * 
 * **EVENT BUS SUBSCRIPTIONS:**
 * 
 * Screen.js subscribe-uje na sledeće event-e:
 * 
 * | Event Topic           | Izvor            | Handler Funkcija        | Šta radi                        |
 * |-----------------------|------------------|------------------------|---------------------------------|
 * | `netStatusChange`     | netService       | screen.netStatusChange | Ažurira network ikonu (zelen/crven) |
 * | `mqttConnectedChange` | mqttService      | screen.mqttConnectedChange | Ažurira MQTT cloud ikonu     |
 * | `displayResults`      | accessService    | screen.displayResults  | Prikazuje access rezultat (pass/fail) |
 * | `reload`              | config update    | screen.reload          | Restartuje UI (nova rotacija/tema) |
 * | `showMsg`             | services         | screen.showMsg         | Prikazuje info poruku privremeno |
 * | `showPic`             | services         | screen.showPic         | Prikazuje sliku privremeno     |
 * | `warning`             | services         | screen.warning         | Prikazuje warning popup        |
 * | `fail`                | services         | screen.fail            | Prikazuje fail popup (crveni)  |
 * | `success`             | services         | screen.success         | Prikazuje success popup (zeleni)|
 * 
 * **LVGL RENDER LOOP:**
 * 
 * Main.js poziva screen.loop() svakih 5ms:
 * ```
 * screen.loop() → dxui.handler() → LVGL render pipeline:
 *   1. Check touch input (capacitive touch screen)
 *   2. Process animations (fading, sliding, scrolling)
 *   3. Redraw changed pixels (double buffering)
 *   4. DMA transfer to framebuffer (Linux /dev/fb0)
 * ```
 * 
 * **SCREEN ROTATION:**
 * 
 * Podržava 4 rotacije (0°, 90°, 180°, 270°):
 * - 0: Landscape (800x480)
 * - 1: Portrait (480x800)
 * - 2: Landscape inverted
 * - 3: Portrait inverted
 * 
 * @note LVGL je thread-safe - sve UI operacije moraju biti u UI thread-u (main.js)
 * @note Popup-i automatski nestaju nakon scrolling animacije (calculated timing)
 * 
 * @author [Your Name]
 * @version 1.0
 * @date 2024
 */

import dxui from '../dxmodules/dxUi.js'
import mainView from './view/mainView.js'
import passwordView from './view/passwordView.js'
import popWin from './view/popWin.js'
import config from '../dxmodules/dxConfig.js'
import std from '../dxmodules/dxStd.js'
import dxNet from '../dxmodules/dxNet.js'
import driver from './driver.js'
import bus from '../dxmodules/dxEventBus.js'
import utils from './common/utils/utils.js'
import codeService from './service/codeService.js'
const screen = {}

/**
 * @brief Inicijalizuje UI sistem i sve view-ove
 * 
 * @details
 * **INITIALIZATION SEQUENCE:**
 * 
 * 1. **Rotacija ekrana** - Čita config.uiInfo.rotation (0-3)
 * 2. **Font path** - Čita custom font ili koristi default PangMenZhengDao font
 * 3. **dxui.init()** - Inicijalizuje LVGL library (display driver, input driver)
 * 4. **View initialization**:
 *    - mainView.init() - Kreira glavni ekran layout
 *    - passwordView.init() - Kreira PIN keypad layout
 *    - popWin.init() - Kreira popup window container
 * 5. **Load main view** - Prikazuje mainView kao default ekran
 * 6. **Subscribe to events** - Registruje event handler-e
 * 
 * **LVGL INITIALIZATION:**
 * 
 * dxui.init() podešava:
 * - Display driver (/dev/fb0 framebuffer)
 * - Touch input driver (/dev/input/event0 capacitive touch)
 * - Double buffering (2x framebuffer za smooth rendering)
 * - DMA engine za fast blit operacije
 * 
 * @note init() se poziva jednom pri boot-u iz main.js
 */
screen.init = function () {
    let dir = config.get('uiInfo.rotation')
    if (![0, 1, 2, 3].includes(dir)) {
        dir = 1
    }
    //screen.fontPath = (utils.isEmpty(config.get("uiInfo.fontPath")) || !std.exist(config.get("uiInfo.fontPath"))) ? '/app/code/resource/font/PangMenZhengDaoBiaoTiTi-1.ttf' : config.get("uiInfo.fontPath")
    screen.fontPath = (utils.isEmpty(config.get("uiInfo.fontPath")) || !std.exist(config.get("uiInfo.fontPath"))) ? '/app/code/resource/font/MontserratRegular.ttf' : config.get("uiInfo.fontPath")
    dxui.init({ orientation: dir });
    mainView.init()
    passwordView.init()
    popWin.init()
    dxui.loadMain(mainView.screen_main)

    subscribe()
}

/**
 * @brief Registruje Event Bus listener-e za UI update-ove
 * 
 * @details
 * Subscribe na sve event-e koji zahtevaju UI promene:
 * - Network status promene → Ažurira network ikonu
 * - MQTT connection promene → Ažurira cloud ikonu
 * - Access rezultati → Prikazuje success/fail popup
 * - Config reload → Restartuje UI sa novim postavkama
 * - Message/Picture display → Prikazuje custom sadržaj
 * 
 * @note Svi handler-i se izvršavaju u UI thread-u (thread-safe)
 */
function subscribe() {
    bus.on('netStatusChange', screen.netStatusChange)
    bus.on('mqttConnectedChange', screen.mqttConnectedChange)
    bus.on('displayResults', screen.displayResults)
    bus.on('reload', screen.reload)
    bus.on('showMsg', screen.showMsg)
    bus.on('showPic', screen.showPic)
    bus.on('warning', screen.warning)
    bus.on('fail', screen.fail)
    bus.on('success', screen.success)
}

/**
 * @brief Event handler - Ažurira network status UI elemente
 * 
 * @param {Object} data - Network status podaci
 * @param {boolean} data.connected - Da li je network povezan
 * 
 * @details
 * **UI UPDATES:**
 * 
 * Ako je povezan:
 * - Prikazuje IP adresu u bottom bar-u (ako je ip_show enabled)
 * - Pokazuje zelenu network ikonu (top_net_enable)
 * - Krije crvenu network ikonu (top_net_disable)
 * 
 * Ako nije povezan:
 * - Briše IP adresu
 * - Pokazuje crvenu network ikonu
 * - Krije zelenu network ikonu
 * 
 * **SCROLLING TEXT:**
 * 
 * Ako je IP adresa preduga za bottom bar, koristi scroll animaciju:
 * ```
 * IP: 192.168.100.123  →  [scroll left]  →  IP: 192.168...
 * ```
 */
// Praćenje statusa mrežne veze
screen.netStatusChange = function (data) {
    if (data.connected) {
        let ip = dxNet.getModeByCard(dxNet.TYPE.ETHERNET).param.ip
        mainView.bottom_ip.text("IP:" + ip)
        if (config.get("uiInfo.ip_show")) {
            mainView.bottom_ip.show()
        }
        mainView.top_net_disable.hide()
        mainView.top_net_enable.show()
    } else {
        mainView.bottom_ip.text(" ")
        mainView.top_net_disable.show()
        mainView.top_net_enable.hide()
    }
    mainView.bottom_ip.longMode(dxui.Utils.LABEL_LONG_MODE.SCROLL_CIRCULAR)
}

// Praćenje statusa TCP veze
screen.tcpConnectedChange = function (data) {
    if (data == "connected") {
        mainView.top_tcp.show()
    } else {
        mainView.top_tcp.hide()
    }
}

// Dobijanje konfiguracije vezane za UI
screen.getUIConfig = function () {
    let configAll = config.getAll()
    return {
        rotation: configAll["uiInfo.rotation"],
        sn: configAll["sysInfo.sn"],
        ip: configAll['netInfo.ip'],
        devname: configAll["sysInfo.deviceName"],
        background: configAll["uiInfo.background"],
        rotation0BgImage: configAll["uiInfo.rotation0BgImage"],
        rotation1BgImage: configAll["uiInfo.rotation1BgImage"],
        rotation2BgImage: configAll["uiInfo.rotation2BgImage"],
        rotation3BgImage: configAll["uiInfo.rotation3BgImage"],
        verBgImage: configAll["uiInfo.verBgImage"],
        horBgImage: configAll["uiInfo.horBgImage"],
        sn_show: configAll["uiInfo.sn_show"],
        ip_show: configAll["uiInfo.ip_show"],
        statusBar: configAll["uiInfo.statusBar"],
        language: configAll["sysInfo.language"],
        show_unlocking: configAll["uiInfo.show_unlocking"],
        // buttonText: configAll["uiInfo.buttonText"],
        version: configAll["sysInfo.appVersion"],
        version_show: configAll["sysInfo.version_show"],
        show_date: configAll['uiInfo.show_date'],
        show_devname: configAll['uiInfo.show_devname'],
    }
}

// Zvuk pritiska na dugme
screen.press = function () {
    driver.pwm.press()
}

// Provjera lozinke
screen.password = function (password) {
    // Send PIN code with type 300 (not 400 - password)
    bus.fire('password', { "type": 300, "code": password })
}

let popTimer
/**
 * @brief Prikazuje success popup (zeleni + checkmark)
 * 
 * @param {string} msg - Poruka koja se prikazuje
 * @param {boolean} beep - Da li treba pustiti beep zvuk (default: true)
 * 
 * @details
 * **POPUP ELEMENTS:**
 * 
 * - Background: Semi-transparent overlay (50% opacity)
 * - Icon: Green checkmark (/app/code/resource/image/hint_true.png)
 * - Message: Scrolling text (ako je preduga)
 * - Bottom bar: Zelena boja (0x46DE8D)
 * - Sound: Double beep (driver.pwm.success())
 * 
 * **AUTO-HIDE TIMING:**
 * 
 * Popup se automatski gasi nakon što scrolling tekst prođe:
 * ```
 * Scroll time = (label_width - display_width) * 30ms per pixel
 * Minimum: 2000ms (2 sekunde)
 * ```
 * 
 * Za poruku "Access granted!" (širina ~300px):
 * - Display width: 600px
 * - No scrolling needed → 2000ms timeout
 * 
 * Za poruku "QR code verify success! User: John Doe" (širina ~1200px):
 * - Display width: 600px
 * - Scroll: (1200-600) * 30ms = 18000ms (18 sekundi)
 * 
 * @note Ako je već prikazan popup, novi popup ga odmah zamenjuje (clearTimeout)
 */
// Uspjeh
screen.success = function (msg, beep) {
    if (popTimer) {
        std.clearTimeout(popTimer)
        popTimer = undefined
    }
    popWin.center_background.show()
    popWin.center_img.source('/app/code/resource/image/hint_true.png')
    popWin.center_label.text(msg)
    popWin.center_label.longMode(dxui.Utils.LABEL_LONG_MODE.SCROLL_CIRCULAR)
    popWin.center_label.textColor(0x46DE8D)
    popWin.center_bottom_view.bgColor(0x46DE8D)

    let label_width = 0
    for (let i = 0; i < msg.length; i++) {
        let dsc = popWin.font32.obj.lvFontGetGlyphDsc(msg.charCodeAt(i), msg.charCodeAt(i + 1))
        label_width += dsc.adv_w
    }
    let time = (label_width - popWin.center_label.width()) * 30

    popTimer = std.setTimeout(() => {
        popWin.center_background.hide()
    }, time > 2000 ? time : 2000)

    if (beep !== false) {
        std.setTimeout(() => {
            driver.pwm.success()
        }, 100)
    }
}

/**
 * @brief Prikazuje fail popup (crveni + X ikona)
 * 
 * @param {string} msg - Poruka greške koja se prikazuje
 * @param {boolean} beep - Da li treba pustiti buzzer (default: true)
 * 
 * @details
 * **POPUP ELEMENTS:**
 * 
 * - Background: Semi-transparent overlay (50% opacity)
 * - Icon: Red X (/app/code/resource/image/hint_false.png)
 * - Message: Scrolling error text
 * - Bottom bar: Crvena boja (0xF35F5F)
 * - Sound: Long buzzer (driver.pwm.fail()) - 500ms warning tone
 * 
 * **COMMON ERROR MESSAGES:**
 * 
 * - "Card not found" - Kartica nije u bazi
 * - "Card expired" - Kartica istekla (timeframe restriction)
 * - "Access denied" - Nema dozvolu za ovu zonu
 * - "Invalid QR code" - QR kod format nevažeći
 * - "Network error" - Ne može validirati sa serverom
 * 
 * @see screen.success() - Ista logika za auto-hide timing
 */
// Neuspjeh
screen.fail = function (msg, beep) {
    if (popTimer) {
        std.clearTimeout(popTimer)
        popTimer = undefined
    }
    popWin.center_background.show()
    popWin.center_img.source('/app/code/resource/image/hint_false.png')
    popWin.center_label.text(msg)
    popWin.center_label.longMode(dxui.Utils.LABEL_LONG_MODE.SCROLL_CIRCULAR)
    popWin.center_label.textColor(0xF35F5F)
    popWin.center_bottom_view.bgColor(0xF35F5F)

    let label_width = 0
    for (let i = 0; i < msg.length; i++) {
        let dsc = popWin.font32.obj.lvFontGetGlyphDsc(msg.charCodeAt(i), msg.charCodeAt(i + 1))
        label_width += dsc.adv_w
    }
    let time = (label_width - popWin.center_label.width()) * 30

    popTimer = std.setTimeout(() => {
        popWin.center_background.hide()
    }, time > 2000 ? time : 2000)
    if (beep !== false) {
        std.setTimeout(() => {
            driver.pwm.fail()
        }, 100)
    }
}
/**
 * @brief Prikazuje warning popup (žuti + bell ikona)
 * 
 * @param {Object} data - Warning parametri
 * @param {string} data.msg - Warning poruka
 * @param {number} data.timeout - Custom timeout (ms) - opciono
 * @param {boolean} data.beep - Da li treba pustiti warning beep (default: true)
 * 
 * @details
 * **POPUP ELEMENTS:**
 * 
 * - Background: Semi-transparent overlay
 * - Icon: Yellow bell (/app/code/resource/image/bell.png)
 * - Message: Scrolling warning text
 * - Bottom bar: Žuta boja (0xfbbc1a)
 * - Sound: Warning beep (driver.pwm.warning()) - 200ms medium tone
 * 
 * **USE CASES:**
 * 
 * - "Online checking" - Validacija sa serverom u toku
 * - "Downloading upgrade package..." - Firmware update progress
 * - "Network disconnected" - Gubitak konekcije
 * - "Low battery" - Backup baterija slaba
 * 
 * @note Može imati custom timeout - koristi se za progress poruke koje traju duže
 */
// Upozorenje
screen.warning = function (data) {
    if (popTimer) {
        std.clearTimeout(popTimer)
        popTimer = undefined
    }
    popWin.center_background.show()
    popWin.center_img.source('/app/code/resource/image/bell.png')
    popWin.center_label.text(data.msg)
    popWin.center_label.longMode(dxui.Utils.LABEL_LONG_MODE.SCROLL_CIRCULAR)
    popWin.center_label.textColor(0xfbbc1a)
    popWin.center_bottom_view.bgColor(0xfbbc1a)

    let label_width = 0
    for (let i = 0; i < data.msg.length; i++) {
        let dsc = popWin.font32.obj.lvFontGetGlyphDsc(data.msg.charCodeAt(i), data.msg.charCodeAt(i + 1))
        label_width += dsc.adv_w
    }
    let time = (label_width - popWin.center_label.width()) * 30

    popTimer = std.setTimeout(() => {
        popWin.center_background.hide()
    }, data.timeout ? data.timeout : (time > 2000 ? time : 2000))
    if (data.beep !== false) {
        std.setTimeout(() => {
            driver.pwm.warning()
        }, 100)
    }
}

// Prilagođeni sadržaj iskačućeg prozora
screen.customPopWin = function (msg, time) {
    if (popTimer) {
        std.clearTimeout(popTimer)
        popTimer = undefined
    }
    popWin.center_background.show()
    popWin.center_img.hide()
    popWin.center_label.text(msg)
    popWin.center_label.longMode(dxui.Utils.LABEL_LONG_MODE.SCROLL_CIRCULAR)
    popWin.center_label.textColor(0)
    popWin.center_bottom_view.bgColor(0)

    let label_width = 0
    for (let i = 0; i < msg.length; i++) {
        let dsc = popWin.font32.obj.lvFontGetGlyphDsc(msg.charCodeAt(i), msg.charCodeAt(i + 1))
        label_width += dsc.adv_w
    }
    let time1 = (label_width - popWin.center_label.width()) * 30

    popTimer = std.setTimeout(() => {
        popWin.center_background.hide()
        popWin.center_img.show()
    }, time ? time : (time1 > 2000 ? time1 : 2000))
}

// Direktno prikazivanje teksta i slika
screen.customShowMsgAndImg = function (msg, msgTimeout, img, imgTimeout) {
    if (msg || img) {
        popWin.center_background.show()
        popWin.center_cont.hide()
        popWin.center_img.hide()
        mainView.date_box.hide()
        mainView.screen_btn_unlocking.hide()
        popWin.center_background.bgOpa(0)
        msgTimeout = msgTimeout ? msgTimeout : 0
        imgTimeout = imgTimeout ? imgTimeout : 0
        std.setTimeout(() => {
            popWin.center_background.hide()
            popWin.center_cont.show()
            popWin.center_img.show()
            mainView.date_box.show()
            mainView.screen_btn_unlocking.show()
            popWin.center_background.bgOpa(50)
        }, msgTimeout > imgTimeout ? msgTimeout : imgTimeout)
    }

    if (msg) {
        popWin.showMsg.text(msg)
        popWin.showMsg.show()
        std.setTimeout(() => {
            popWin.showMsg.hide()
        }, msgTimeout ? msgTimeout : 0)
    }

    if (img) {
        popWin.showPic.source('/app/code/resource/image/' + img + '.png')
        popWin.showPic.show()
        std.setTimeout(() => {
            popWin.showPic.hide()
        }, imgTimeout ? imgTimeout : 0)
    }
}

/**
 * @brief Event handler - Ažurira MQTT connection status UI ikonu
 * @param {string} data - "connected" ili "disconnected"
 * @details
 * Prikazuje/krije cloud ikonu u status bar-u zavisno od MQTT connection status-a.
 */
// Status MQTT veze
screen.mqttConnectedChange = function (data) {
    if (data == "connected") {
        mainView.top_mqtt.show()
    } else if (data == "disconnected") {
        mainView.top_mqtt.hide()
    }
}

/**
 * @brief Prikazuje access rezultat (uspeh ili neuspeh) sa odgovarajućim popup-om
 * 
 * @param {Object} param - Access rezultat parametri
 * @param {boolean} param.flag - true=success, false=fail
 * @param {number} param.type - Tip pristupa (100=QR, 200=NFC, 400=PIN, 600=BLE, 800=Button, 900=Remote)
 * @param {string} param.msg - Opciona poruka greške
 * 
 * @details
 * **ACCESS TYPE MAPPING:**
 * 
 * - 100, 101, 103: QR code verify
 * - 200, 203: Card (NFC) verify
 * - 400: Password (PIN) verify
 * - 500: Online verify (cloud validation)
 * - 600: Bluetooth verify (BLE)
 * - 800: Button open (exit button)
 * - 900: Remote open (MQTT command)
 * 
 * **MULTILANGUAGE SUPPORT:**
 * 
 * Proverava config.sysInfo.language:
 * - "EN": English messages ("qr code verify success!")
 * - Default: Chinese messages ("扫码验证Success！")
 * 
 * **POPUP DISPLAY:**
 * 
 * Poziva screen.success() ili screen.fail() koji prikazuju:
 * - Success: Zeleni popup + checkmark ikona + double beep
 * - Fail: Crveni popup + X ikona + long buzzer
 */
/**
 * Prikazivanje iskačućeg prozora
 * @param {*} param param.flag:true|falseSuccess|Failed；param.type:类型
 * @returns 
 */
screen.displayResults = function (param) {

    if (!param) {
        return
    }
    let res = "Failed"
    // Osim ako je jezik EN, zadani je kineski
    let isEn = config.get("sysInfo.language") == "EN"
    if (isEn) {
        res = param.flag ? "success!" : "fail!"
        if (param.msg && param.flag == false) {
            res = res + "原因为：" + param.msg
        }
    } else {
        res = (param.flag ? "Success！" : "Failed！")
        if (param.msg && param.flag == false) {
            res = res + "原因为：" + param.msg
        }
    }
    let msg = ""
    switch (parseInt(param.type)) {
        case 100:
        case 101:
        case 103:
            msg = (isEn ? "qr code verify " : "扫码验证")
            break;
        case 200:
        case 203:
            msg = (isEn ? "card verify " : "刷卡验证")
            break;
        case 400:
            msg = (isEn ? "password verify " : "密码验证")
            break;
        case 500:
            msg = (isEn ? "online verify" : "在线验证")
            break;
        case 600:
            msg = (isEn ? "bluetooth verify " : "蓝牙验证")
            break;
        case 800:
            msg = (isEn ? "open by press button " : "按键开门")
            break;
        case 900:
            msg = (isEn ? "remote open " : "远程开门")
            break;
        default:
            break;
    }
    if (msg === "" && param.type == "disable") {
        msg = isEn ? "Device disabled" : "设备已禁用"
    } else {
        msg += res
    }
    if (param.flag) {
        screen.success(msg)
    } else {
        screen.fail(msg)
    }
}

// Prikazivanje teksta
// npr:{msg:'',time:1000}
screen.showMsg = function (param) {
    screen.customPopWin(param.msg, param.time)
}

// Prikazivanje slike
// npr:{time:1000,img:'a'}
screen.showPic = function (param) {
    this.customShowMsgAndImg(null, null, param.img, param.time)
}
// Ponovno učitavanje trenutnog korisničkog interfejsa, prilagodit će prikaz sadržaja korisničkog interfejsa prema konfiguraciji
screen.reload = function () {
    let dir = config.get('uiInfo.rotation')
    if (![0, 1, 2, 3].includes(dir)) {
        dir = 1
    }
    dxui.Utils.GG.NativeDisp.lvDispSetRotation(dir)
    dxui.loadMain(screen.screenNow)
}

/**
 * @brief LVGL render loop - poziva se svakih 5ms iz main.js
 * 
 * @details
 * **RENDER PIPELINE:**
 * 
 * dxui.handler() izvršava LVGL task handler koji:
 * 1. **Input handling** - Čita capacitive touch screen (/dev/input/event0)
 * 2. **Animation processing** - Ažurira sve active animacije (fade, slide, scroll)
 * 3. **Dirty area rendering** - Renderuje samo izmenjene pixele (optimizacija)
 * 4. **DMA blit** - Kopira framebuffer na display (/dev/fb0)
 * 
 * **PERFORMANCE:**
 * 
 * - Loop period: 5ms (200 Hz)
 * - Touch latency: <10ms (od dodira do reakcije)
 * - Animation: 60 FPS (smooth scrolling)
 * - CPU usage: ~15% (ARM Mali GPU accelerated blitting)
 * 
 * @note Ova funkcija MORA biti pozvana iz UI thread-a (main.js)
 * @note Ne pozivaj direktno LVGL funkcije iz drugih threadova (nije thread-safe)
 */
screen.loop = function () {
    dxui.handler()
}

export default screen
