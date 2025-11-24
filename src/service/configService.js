import log from '../../dxmodules/dxLogger.js'
import config from '../../dxmodules/dxConfig.js'
import driver from '../driver.js'
import utils from '../common/utils/utils.js'
import common from '../../dxmodules/dxCommon.js'
import dxNtp from '../../dxmodules/dxNtp.js'
import base64 from '../../dxmodules/dxBase64.js'
import std from '../../dxmodules/dxStd.js'
import * as os from "os";

const configService = {}

// Podudara se sa IP adresama u decimalnom formatu sa tačkama, npr. 192.168.0.1.
const ipCheck = v => /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(v)
// 匹配 www.baidu.com or www.baidu.com:1883 or 192.168.0.1:8080
const ipOrDomainCheckWithPort = v => /^(?:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})(:\d{1,5})?$/.test(v);

// Pozitivan cijeli broj
const regpCheck = v => /^[1-9]\d*$/.test(v)
// Nen negativan cijeli broj
const regnCheck = v => /^([1-9]\d*|0{1})$/.test(v)
// Pravila provjere za sve podržane konfiguracijske stavke i povratni poziv nakon uspješnog postavljanja

const supported = {
    netInfo: {
        type: { rule: v => [0, 1, 2, 4].includes(v) },
        // 1:dinamički, 0:statički
        dhcp: { rule: v => [0, 1].includes(v) },
        ip: { rule: ipCheck },
        gateway: { rule: ipCheck },
        dns: { rule: v => !v.split(",").some(ip => !ipCheck(ip)) },
        subnetMask: { rule: ipCheck },
        netMac: { rule: v => typeof v == 'string' },
        fixed_macaddr_enable: { rule: v => [0, 2].includes(v) },
        // 0: isključeno 1: intervalna sinhronizacija
        ntp: { rule: v => [0, 1].includes(v) },
        ntpAddr: { rule: v => typeof v == 'string' },
        ntpInterval: { rule: regpCheck },
        ntpLocaltime: { rule: regnCheck, callback: v => dxNtp.updateGmt(v) },
    },
    mqttInfo: {
        mqttAddr: { rule: ipOrDomainCheckWithPort },
        clientId: { rule: v => typeof v == 'string' },
        mqttName: { rule: v => typeof v == 'string' },
        password: { rule: v => typeof v == 'string' },
        qos: { rule: v => [0, 1, 2].includes(v) },
        prefix: { rule: v => typeof v == 'string' },
    },
    bleInfo: {
        mac: { rule: v => /^[0-9|a-f|A-F]{12}$/.test(v), callback: v => driver.uartBle.setConfig({ mac: v }) },
        name: { rule: v => typeof v == 'string', callback: v => driver.uartBle.setConfig({ name: v }) },
        secretKey: { rule: v => Array.isArray(v) }
    },
    uiInfo: {
        rotation: {
            rule: v => [0, 1, 2, 3].includes(v), callback: v => {
                switch (v) {
                    case 0:
                        v = 1
                        break;
                    case 1:
                        v = 0
                        break;
                    case 2:
                        v = 3
                        break;
                    case 3:
                        v = 2
                        break;
                }
                config.set("uiInfo.rotation", v)
                driver.screen.reload()
            }
        },
        statusBar: { rule: v => [0, 1].includes(v), callback: v => driver.screen.reload() },
        rotation0BgImage: { rule: v => typeof v == 'string', callback: v => driver.screen.reload() },
        rotation1BgImage: { rule: v => typeof v == 'string', callback: v => driver.screen.reload() },
        rotation2BgImage: { rule: v => typeof v == 'string', callback: v => driver.screen.reload() },
        rotation3BgImage: { rule: v => typeof v == 'string', callback: v => driver.screen.reload() },
        horBgImage: {
            rule: v => typeof v == 'string', callback: v => {
                let suffix = ""
                try {
                    suffix = base64ImageSave(v, true)
                } catch (error) {
                    log.error("解码Failed", error)
                    config.set("uiInfo.horBgImage", "")
                    return
                }
                // Budući da je base64 prevelik, upit za konfiguraciju će biti spor, pa se ova stavka briše nakon postavljanja
                config.set("uiInfo.horBgImage", "")
                if (!suffix) {
                    return
                }
                config.set("uiInfo.rotation1BgImage", "/app/code/resource/image/horBgImage" + suffix)
                config.set("uiInfo.rotation3BgImage", "/app/code/resource/image/horBgImage" + suffix)
                driver.screen.reload()
            }
        },
        verBgImage: {
            rule: v => typeof v == 'string', callback: v => {
                let suffix = ""
                try {
                    suffix = base64ImageSave(v, false)
                } catch (error) {
                    log.error("解码Failed", error)
                    config.set("uiInfo.verBgImage", "")
                    return
                }
                // Budući da je base64 prevelik, ova stavka se briše nakon postavljanja
                config.set("uiInfo.verBgImage", "")
                if (!suffix) {
                    return
                }
                config.set("uiInfo.rotation0BgImage", "/app/code/resource/image/verBgImage" + suffix)
                config.set("uiInfo.rotation2BgImage", "/app/code/resource/image/verBgImage" + suffix)
                driver.screen.reload()
            }
        },
        // Prikaz/sakrivanje datuma 1 uključeno 0 isključeno
        show_date: { rule: v => [0, 1].includes(v), callback: v => driver.screen.reload() },
        // Prikaz/sakrivanje naziva uređaja 1 uključeno 0 isključeno
        show_devname: { rule: v => [0, 1].includes(v), callback: v => driver.screen.reload() },
        //da li je sn skriven 1 prikazuje 0 skriva
        sn_show: { rule: v => [0, 1].includes(v), callback: v => driver.screen.reload() },
        //da li je ip skriven 1 prikazuje 0 skriva
        ip_show: { rule: v => [0, 1].includes(v), callback: v => driver.screen.reload() },
        // buttonText: { rule: v => typeof v == 'string' && v.length <= 6, callback: v => driver.screen.reload() },
        fontPath: { rule: v => typeof v == 'string', callback: v => driver.screen.reload() },
        show_unlocking: { rule: v => [0, 1].includes(v), callback: v => driver.screen.reload() },
    },
    doorInfo: {
        openMode: { rule: v => [0, 1, 2].includes(v), callback: openModeCb },
        openTime: { rule: regpCheck },
        openTimeout: { rule: regpCheck },
        onlinecheck: { rule: v => [0, 1].includes(v) },
        timeout: { rule: regpCheck },
        offlineAccessNum: { rule: regpCheck },
    },
    sysInfo: {
        //jačina glasa
        volume: { rule: regnCheck },
        //Jačina zvuka pritiska na dugme
        volume2: { rule: regnCheck },
        //jačina zujalice
        volume3: { rule: regnCheck },
        //prikaz/sakrivanje broja verzije
        version_show: { rule: v => [0, 1].includes(v), callback: v => driver.screen.reload() },
        heart_time: { rule: regpCheck },
        heart_en: { rule: v => [0, 1].includes(v) },
        heart_data: { rule: v => typeof v == 'string' },
        //broj uređaja
        deviceNum: { rule: regnCheck },
        // Naziv uređaja
        deviceName: { rule: v => typeof v == 'string', callback: v => driver.screen.reload() },
        com_passwd: { rule: v => v.length == 16 },
        // 0:kineski, 1:engleski
        language: {
            rule: v => [0, 1].includes(v), callback: v => {
                config.set("sysInfo.language", v == 1 ? "EN" : "CN")
                driver.screen.reload()
            }
        },
        status: { rule: v => [1, 2].includes(v) },
        nfc_identity_card_enable: { rule: v => [1, 3].includes(v) },
        //1 otvori 0 zatvori
        nfc: { rule: v => [0, 1].includes(v) },
        // Postavljanje sistemskog vremena, u sekundama
        time: { rule: regnCheck, callback: v => common.systemBrief(`date -s "@${v}"`) },
        //Poruka o grešci pri online verifikaciji Prekidač 0 Isključeno 1 Uključeno
        onlinecheckErrorMsg: { rule: v => [0, 1].includes(v) },
        //-1 Isključi automatsko ponovno pokretanje 0-23 Ponovno pokretanje u određeni sat
        autoRestart: { rule: v => typeof v == 'number' && /^(-1|[0-9]|1[0-9]|2[0-3])$/.test(v.toString()) },
    },
    scanInfo: {
        //izbor sistema kodiranja prema bitovima, sve izabrano 64511
        deType: { rule: regnCheck },
        //režim skeniranja 0 je intervalni 1 je jednokratni
        sMode: { rule: v => [0, 1].includes(v) },
        //interval stupa na snagu, vrijeme intervala
        interval: { rule: regnCheck },
    }
}
configService.setSn = function (params) {
    //upisivanje u lokalnu datoteku
    std.saveFile('/etc/.sn', params)
    config.setAndSave('sysInfo.uuid', params)
    config.setAndSave('sysInfo.sn', params)
    config.setAndSave('mqttInfo.clientId', params)
}
// Konfiguracija koja zahtijeva ponovno pokretanje
const needReboot = ["sysInfo.autoRestart", "netInfo", "mqttInfo", "sysInfo.volume", "sysInfo.volume2", "sysInfo.volume3", "sysInfo.heart_time", "sysInfo.heart_en", "sysInfo.nfc_identity_card_enable", 'sysInfo.language',
    'scanInfo.deType', 'sysInfo.nfc']

// Jedinstvena metoda za provjeru korisničke konfiguracije
configService.configVerifyAndSave = function (data) {
    let isReboot = false
    for (const key in data) {
        if (!supported[key]) {
            return key + " not supported"
        }
        const item = data[key];
        if (typeof item != 'object') {
            // Mora biti grupa
            continue
        }
        if (needReboot.includes(key)) {
            isReboot = true
        }
        for (const subKey in item) {
            let option = supported[key][subKey]
            if (utils.isEmpty(option)) {
                return subKey + " not supported"
            }
            const value = item[subKey];
            if (needReboot.includes(key + "." + subKey)) {
                isReboot = true
            }

            if (!option.rule || option.rule(value)) {
                // Nema pravila provjere, ili je provjera prošla
                config.set(key + "." + subKey, value)
                if (option.callback) {
                    log.info("执行配置设置回调")
                    // Izvršavanje povratnog poziva za postavljanje konfiguracije
                    option.callback(value)
                }
            } else {
                return value + " check failure"
            }
        }
    }
    config.save()
    // Provjera konfiguracije koja zahtijeva ponovno pokretanje, ponovno pokretanje za 3 sekunde
    if (isReboot) {
        common.asyncReboot(3)
    }
    return true
}

// Povratni poziv za promjenu načina otvaranja vrata
function openModeCb(value) {
    if (value == 1) {
        driver.gpio.open()
    } else {
        driver.gpio.close()
    }
}

// Spremanje base64 slike
// data:image/jpg;base64,/data:image/jpeg;base64,
// data:image/png;base64,
// data:image/bmp;base64,
function base64ImageSave(value, isHor) {
    if (value == "") {
        return false
    }
    let suffix = ".png"
    // pretvaranje base64 u sliku i spremanje
    let jpg_prefix1 = "data:image/jpg;base64,"
    let jpg_prefix2 = "data:image/jpeg;base64,"
    let png_prefix = "data:image/png;base64,"
    let bmp_prefix = "data:image/bmp;base64,"
    if (value.startsWith(jpg_prefix1)) {
        value = value.slice(jpg_prefix1.length)
        suffix = ".jpg"
    } else if (value.startsWith(jpg_prefix2)) {
        value = value.slice(jpg_prefix2.length)
        suffix = ".jpg"
    } else if (value.startsWith(png_prefix)) {
        value = value.slice(png_prefix.length)
        suffix = ".png"
    } else if (value.startsWith(bmp_prefix)) {
        value = value.slice(bmp_prefix.length)
        suffix = ".bmp"
    } else {
        log.error("base64前缀错误")
        return false
    }

    let buf = base64.toUint8Array(value)
    let fd = os.open("/app/code/resource/image/" + (isHor ? "horBgImage" : "verBgImage") + suffix, os.O_RDWR | os.O_CREAT | os.O_TRUNC);
    let len = os.write(fd, buf.buffer, 0, buf.length)
    console.log("=======================", len);

    if (len != buf.length) {
        log.error("base64转图片Failed")
        return false
    }
    if (os.close(fd) != 0) {
        log.error("存储文件Failed")
        return false
    }
    return suffix
}

export default configService