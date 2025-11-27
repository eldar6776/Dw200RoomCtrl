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
                log.info("EID activation Success")
                driver.screen.warning({ msg: 'EID activation Success' })
                // TODO: Add sound signal for successful EID activation
                // driver.audio.doPlay("success_sound")
            } else {
                log.info("EID activation Failed")
                driver.screen.warning({ msg: 'EID activation Failed' })
                // TODO: Add sound signal for failed EID activation
                // driver.audio.doPlay("fail_sound")
            }
        } else {
            // Access code
            log.info("═══════════════════════════════════════════════════════════")
            log.info("  🚪 ACCESS CODE DETECTED")
            log.info("═══════════════════════════════════════════════════════════")
            log.info("[codeService] Parsed access code:", JSON.stringify(data))
            log.info("[codeService] Type: " + data.type + " (100=QR, 200/203=NFC Sector, 300=PIN)")
            log.info("[codeService] Code: " + data.code)
            log.info("[codeService] Calling accessService.access()...")
            accessService.access(data)
        }
    } catch (error) {
        log.error('[codeService] Error in code() method: ' + error)
        log.error('[codeService] Stack: ' + (error.stack || "No stack trace"))
    }
}

// Process config code
function configCode(code) {
    if (!checkConfigCode(code)) {
        driver.pwm.fail()
        log.error("Config code validation Failed")
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
    log.info("Parsing Config code: ", JSON.stringify(json))
    //Switching mode
    if (!utils.isEmpty(json.w_model)) {
        try {
            common.setMode(json.w_model)
            driver.pwm.success()
            common.asyncReboot(1)
        } catch (error) {
            log.error(error, error.stack)
            log.info('Switching Failed, no action taken');
            driver.pwm.fail()
        }
        return
    }
    let map = dxMap.get("UPDATE")
    // Related to upgrade by scanning code
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
            // Downloading images, SO files, etc.
            return resourceDownload(json.update_addr, json.update_md5, downloadPath, () => {
                common.systemBrief(`mv "${downloadPath}" "${json.update_path}" `)
            })
        } else if (json.update_flag === 3) {
            // Downloading compressed package
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
        // Compatibility with old upgrade format
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
    // Related to device configuration
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
    log.info("Configuration complete res: " + res)
    if (typeof res != 'boolean') {
        log.error(res)
        driver.pwm.fail()
        return
    }
    if (res) {
        driver.pwm.success()
        log.info("Configuration Success")
    } else {
        driver.pwm.fail()
        log.error("Configuration Failed")
    }
    if (json.reboot === 1) {
        driver.screen.warning({ msg: config.get("sysInfo.language") == "EN" ? "Rebooting" : "Rebooting", beep: false })
        common.asyncReboot(1)
    }
}

// Universal download method
function resourceDownload(url, md5, path, cb) {
    // Local upgrade
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
    // Download complete, rebooting in 1 second
    common.asyncReboot(0)
    std.sleep(2000)
    return true
}

//Verify config code
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
        driver.screen.warning({ msg: "Upgrade Success", beep: false })
    }
}

codeService.errorMsgMap = {
    "The 'url' and 'md5' param should not be null": "The 'url' and 'md5' param should not be null",
    "The 'size' param should be a number": "The 'size' param should be a number",
    "The upgrade package is too large, and not be enough space on the disk to download it": "The upgrade package is too large, and not be enough space on the disk to download it",
    "Download failed, please check the url:": "Download failed, please check the url:",
    "Download failed with wrong md5 value": "Download failed with wrong md5 value",
    "Build shell file failed": "Build shell file failed",
    "Upgrade package download failed": "Upgrade package download failed",
    "Please check the network": "Please check the network"
}

codeService.updateFailed = function (errorMsg) {
    if (!errorMsg || errorMsg.includes("Download failed, please check the url")) {
        errorMsg = 'Upgrade package download failed'
    }
    if (config.get("sysInfo.language") == "EN") {
        driver.screen.warning({ msg: "Upgrade Failed: " + (errorMsg ? errorMsg : "Upgrade package download failed"), beep: false })
    } else {
        driver.screen.warning({ msg: "Upgrade Failed: " + (codeService.errorMsgMap[errorMsg] ? codeService.errorMsgMap[errorMsg] : "Download failed, please check the url"), beep: false })
    }
}

// Compare whether the first N characters of two strings are equal
function comparePrefix(str1, str2, N) {
    let substring1 = str1.substring(0, N);
    let substring2 = str2.substring(0, N);
    return substring1 === substring2;
}

export default codeService