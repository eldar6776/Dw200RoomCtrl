import common from '../../dxmodules/dxCommon.js';
import log from '../../dxmodules/dxLogger.js'
import qrRule from '../../dxmodules/dxQrRule.js'
import std from '../../dxmodules/dxStd.js'
import config from '../../dxmodules/dxConfig.js'
import base64 from '../../dxmodules/dxBase64.js'
import dxMap from '../../dxmodules/dxMap.js'
import ota from "../../dxmodules/dxOta.js";
import sqliteService from "./sqliteService.js";
import driver from '../driver.js';
import utils from '../common/utils/utils.js';
import configConst from '../common/consts/configConst.js';
import configService from './configService.js';
import accessService from './accessService.js';
import * as os from 'os';
import bus from '../../dxmodules/dxEventBus.js'
let sqliteFuncs = sqliteService.getFunction()
const codeService = {}

codeService.receiveMsg = function (data) {
    log.info("═══════════════════════════════════════════════════════════")
    log.info("  📨 QR CODE RECEIVED FROM SCANNER!")
    log.info("═══════════════════════════════════════════════════════════")
    log.info('[codeService] Raw data type: ' + typeof data)
    log.info('[codeService] Raw data: ' + JSON.stringify(data))
    
    try {
        let str = common.utf8HexToStr(common.arrayBufferToHexString(data))
        log.info('[codeService] Converted string: ' + str)
        log.info('[codeService] Calling code() method...')
        this.code(str)
    } catch (error) {
        log.error('[codeService] Error processing QR data: ' + error)
        log.error('[codeService] Stack: ' + (error.stack || "No stack trace"))
    }
}

codeService.code = function (data) {
    log.info("═══════════════════════════════════════════════════════════")
    log.info("  🔍 PROCESSING QR CODE")
    log.info("═══════════════════════════════════════════════════════════")
    log.info('[codeService] Input code: ' + data)
    
    try {
        log.info('[codeService] Calling qrRule.formatCode()...')
        data = qrRule.formatCode(data, sqliteFuncs)
        log.info('[codeService] Formatted code: ' + JSON.stringify(data))
        
        if (data.type == 'config' || (data.type == '100' && comparePrefix(data.code, "__VGS__0", "__VGS__0".length))) { //NOSONAR
            // Config code
            log.info('[codeService] Detected CONFIG CODE')
            configCode(data.code)
        } else if (data.type == 'eid') {
            //EID activation
            log.info('[codeService] Detected EID CODE')
            driver.pwm.warning()
            let activeResute = driver.eid.active(config.get("sysInfo.sn"), config.get("sysInfo.appVersion"), config.get("sysInfo.mac"), data.code);
            log.info("activeResute:" + activeResute)
            if (activeResute === 0) {
                log.info("EID activationSuccess")
                driver.screen.warning({ msg: 'EID activationSuccess' })
                driver.audio.doPlay("yz_s")
            } else {
                log.info("EID activationFailed")
                driver.screen.warning({ msg: 'EID activationFailed' })
                driver.audio.doPlay("yz_f")
            }
        } else {
            // Access code
            log.info("═══════════════════════════════════════════════════════════")
            log.info("  🚪 ACCESS CODE DETECTED")
            log.info("═══════════════════════════════════════════════════════════")
            log.info("[codeService] Parsed access code:", JSON.stringify(data))
            log.info("[codeService] Type: " + data.type + " (100=QR, 200=RFID, 300=PIN)")
            log.info("[codeService] Code: " + data.code)
            log.info("[codeService] Calling accessService.access()...")
            accessService.access(data)
        }
    } catch (error) {
        log.error('[codeService] Error in code() method: ' + error)
        log.error('[codeService] Stack: ' + (error.stack || "No stack trace"))
    }
}

// Obrada konfiguracijskog koda
function configCode(code) {
    if (!checkConfigCode(code)) {
        driver.pwm.fail()
        log.error("Config code校验Failed")
        return
    }
    let json = utils.parseString(code)
    if (Object.keys(json).length <= 0) {
        try {
            json = JSON.parse(code.slice(code.indexOf("{"), code.lastIndexOf("}") + 1))
        } catch (error) {
            log.error(error)
        }
    }
    log.info("解析Config code：", JSON.stringify(json))
    //Prebacivanje moda
    if (!utils.isEmpty(json.w_model)) {
        try {
            common.setMode(json.w_model)
            driver.pwm.success()
            common.asyncReboot(1)
        } catch (error) {
            log.error(error, error.stack)
            log.info('切换Failed不做任何处理');
            driver.pwm.fail()
        }
        return
    }
    let map = dxMap.get("UPDATE")
    // Vezano za nadogradnju skeniranjem koda
    if (json.update_flag === 1) {
        if (!driver.net.getStatus()) {
            codeService.updateFailed("Please check the network")
            driver.pwm.fail()
            return
        }
        if (map.get("updateFlag")) {
            return
        }

        map.put("updateFlag", true)
        driver.pwm.warning()
        try {
            codeService.updateBegin()
            ota.updateHttp(json.update_addr, json.update_md5, 300)
            codeService.updateEnd()
            driver.pwm.success()
            common.asyncReboot(1)
        } catch (error) {
            codeService.updateFailed(error.message)
            driver.pwm.fail()
        }
        map.del("updateFlag")
        return

    } else if ([2, 3].includes(json.update_flag)) {
        if (utils.isEmpty(json.update_name) || utils.isEmpty(json.update_path)) {
            driver.pwm.fail()
            return
        }
        let downloadPath = "/app/data/upgrades/" + json.update_name
        if (json.update_flag === 2) {
            // Preuzimanje slika, SO datoteka, itd.
            return resourceDownload(json.update_addr, json.update_md5, downloadPath, () => {
                common.systemBrief(`mv "${downloadPath}" "${json.update_path}" `)
            })
        } else if (json.update_flag === 3) {
            // Preuzimanje kompresovanog paketa
            return resourceDownload(json.update_addr, json.update_md5, downloadPath, () => {
                common.systemBrief(`unzip -o "${downloadPath}" -d "${json.update_path}" `)
            })
        }
    }
    if (!utils.isEmpty(json.update_flg)) {
        if (map.get("updateFlag")) {
            return
        }
        if (!driver.net.getStatus()) {
            codeService.updateFailed("Please check the network")
            driver.pwm.fail()
            return
        }
        map.put("updateFlag", true)
        // Kompatibilnost sa starim formatom nadogradnje
        if (utils.isEmpty(json.update_haddr) || utils.isEmpty(json.update_md5)) {
            driver.pwm.fail()
            map.del("updateFlag")
            return
        }
        try {
            driver.pwm.warning()
            codeService.updateBegin()
            const temp = ota.OTA_ROOT + '/temp'
            ota.updateResource(json.update_haddr, json.update_md5, utils.getUrlFileSize(json.update_haddr) / 1024, 
                "\n                source=" + temp + "/vgapp/res/image/*" +
                "\n                target=/app/code/resource/image/" +
                "\n                cp \"$source\" \"$target\"" +
                "\n                source=" + temp + "/vgapp/res/font/*" +
                "\n                target=/app/code/resource/font/" +
                "\n                cp \"$source\" \"$target\"" +
                "\n                source=" + temp + "/vgapp/wav/*" +
                "\n                target=/app/code/resource/wav/" +
                "\n                cp \"$source\" \"$target\"" +
                "\n                rm -rf " + ota.OTA_ROOT +
                "\n                ")
            codeService.updateEnd()
            driver.pwm.success()
            common.asyncReboot(3)
        } catch (error) {
            codeService.updateFailed(error.message)
            driver.pwm.fail()
        }
        map.del("updateFlag")
        return

    }
    // Vezano za konfiguraciju uređaja
    let configData = {}
    for (let key in json) {
        let transKey = key.indexOf(".") >= 0 ? key : configConst.getValueByKey(key)
        if (transKey == 'netInfo.dhcp') {
            json[key] = json[key] == 1 ? 0 : 1
        }
        if (transKey == 'sysInfo.setSn') {
            configService.setSn(json[key])
            common.asyncReboot(1)
            continue
        }
        if (transKey) {
            let keys = transKey.split(".")
            if (utils.isEmpty(configData[keys[0]])) {
                configData[keys[0]] = {}
            }
            configData[keys[0]][keys[1]] = json[key]
        }
    }
    let res = false
    if (Object.keys(configData).length > 0) {
        res = configService.configVerifyAndSave(configData)
    }
    log.info("配置完成res：" + res)
    if (typeof res != 'boolean') {
        log.error(res)
        driver.pwm.fail()
        return
    }
    if (res) {
        driver.pwm.success()
        log.info("配置Success")
    } else {
        driver.pwm.fail()
        log.error("配置Failed")
    }
    if (json.reboot === 1) {
        driver.screen.warning({ msg: config.get("sysInfo.language") == "EN" ? "Rebooting" : "重启中", beep: false })
        common.asyncReboot(1)
    }
}

// Univerzalna metoda za preuzimanje
function resourceDownload(url, md5, path, cb) {
    // Lokalna nadogradnja
    if (utils.isEmpty(url) || utils.isEmpty(md5)) {
        driver.pwm.fail()
        return false
    }

    codeService.updateBegin()
    driver.pwm.warning()

    let ret = utils.waitDownload(url, path, 60 * 1000, md5, utils.getUrlFileSize(url))
    if (!ret) {
        codeService.updateFailed()
        driver.pwm.fail()
        return false
    } else {
        codeService.updateEnd()
        driver.pwm.success()
    }
    if (cb) {
        cb()
    }
    // Preuzimanje završeno, ponovno pokretanje za 1 sekundu
    common.asyncReboot(0)
    std.sleep(2000)
    return true
}

//Provjera konfiguracijskog koda
function checkConfigCode(code) {
    let password = config.get('sysInfo.com_passwd') || '1234567887654321'
    let lastIndex = code.lastIndexOf("--");
    if (lastIndex < 0) {
        lastIndex = code.lastIndexOf("__");
    }
    let firstPart = code.substring(0, lastIndex);
    let secondPart = code.substring(lastIndex + 2);
    let res
    try {
        res = base64.fromHexString(common.arrayBufferToHexString(common.hmac(firstPart, password)))
    } catch (error) {
        log.error(error, error.stack)
        return false
    }
    return res == secondPart;
}

codeService.updateBegin = function () {
    if (config.get("sysInfo.language") == "EN") {
        driver.screen.warning({ msg: "Start Upgrading", beep: false })
    } else {
        driver.screen.warning({ msg: "Start upgrade", beep: false })
    }
}

codeService.updateEnd = function () {
    if (config.get("sysInfo.language") == "EN") {
        driver.screen.warning({ msg: "Upgrade Successfully", beep: false })
    } else {
        driver.screen.warning({ msg: "升级Success", beep: false })
    }
}

codeService.errorMsgMap = {
    "The 'url' and 'md5' param should not be null": "“url”和“md5”参数不能为空",
    "The 'size' param should be a number": "“size” 参数应该是一个数字",
    "The upgrade package is too large, and not be enough space on the disk to download it": "升级包过大，磁盘空间不足，无法下载",
    "Download failed, please check the url:": "下载Failed，请检查网址",
    "Download failed with wrong md5 value": "下载Failed，md5 值错误",
    "Build shell file failed": "构建 shell 文件Failed",
    "Upgrade package download failed": "升级包下载Failed",
    "Please check the network": "请检查网络"
}

codeService.updateFailed = function (errorMsg) {
    if (!errorMsg || errorMsg.includes("Download failed, please check the url")) {
        errorMsg = 'Upgrade package download failed'
    }
    if (config.get("sysInfo.language") == "EN") {
        driver.screen.warning({ msg: "Upgrade Failed: " + (errorMsg ? errorMsg : "Upgrade package download failed"), beep: false })
    } else {
        driver.screen.warning({ msg: "升级Failed: " + (codeService.errorMsgMap[errorMsg] ? codeService.errorMsgMap[errorMsg] : "下载Failed，请检查网址"), beep: false })
    }
}

// Poredi da li su prvih N karaktera dva stringa jednaki
function comparePrefix(str1, str2, N) {
    let substring1 = str1.substring(0, N);
    let substring2 = str2.substring(0, N);
    return substring1 === substring2;
}

export default codeService