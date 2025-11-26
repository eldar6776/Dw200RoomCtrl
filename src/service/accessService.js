import log from '../../dxmodules/dxLogger.js'
import config from '../../dxmodules/dxConfig.js'
import dxMap from '../../dxmodules/dxMap.js'
import std from '../../dxmodules/dxStd.js'
import driver from '../driver.js'
import utils from '../common/utils/utils.js'
import mqttService from "./mqttService.js";
import sqliteService from "./sqliteService.js";
let sqliteFuncs = sqliteService.getFunction()

const accessService = {}

// Logika autentifikacije pristupa
accessService.access = function (data) {
    // Device disabled - no access allowed
    log.info('[accessService] access :' + JSON.stringify(data))
    if (config.get('sysInfo.status') == 2) {
        log.info('Device disabled - no access allowed')
        driver.screen.accessFail("disable")
        // ✅ Koristi bosanski audio feedback
        driver.audio.fail()  // Now plays f_eng.wav
        return
    }
    driver.pwm.press()
    // Rezultat autentifikacije
    let res = false
    // Da li prijaviti zapis o pristupu
    let isReport = true
    // Verifikacija pristupa
    let type = data.type
    let code = data.code
    //Sastavljanje MQTT poruke za prijavu zapisa o komunikaciji
    let record = {
        id: "-1",
        type: parseInt(type),
        code: code,
        time: Math.floor(Date.parse(new Date()) / 1000),
        result: 0,
        extra: { "srcData": code },
        error: ""
    }
    
    // ✅ PROVJERA DA LI JE KARTICA VEĆ VALIDIRANA (iz provjere NFC sektora)
    if (data.validated === true) {
        log.info('[accessService] ✅ Card pre-validated by NFC sector check - granting access')
        res = true
        record.result = 1
        if (data.cardInfo) {
            record.extra = data.cardInfo
        }
    } else if (type == 900) {
        // Daljinsko otvaranje vrata
        res = true
        isReport = false
    } else if (type == 800) {
        // Otvaranje vrata dugmetom
        res = true
        // Ne prijavljuj zapis o pristupu
        isReport = false
    } else if (type == 600 && code == null) {
        // tip == 600 && inostrani Bluetooth
        res = true
    } else {
        //Provjera da li postoji ovlaštenje za ovu vrijednost akreditiva
        res = sqliteFuncs.permissionVerifyByCodeAndType(code, type)
        if (res) {
            let permissions = sqliteFuncs.permissionFindAllByCodeAndType(code)
            let permission = permissions.filter(obj => obj.type == type)[0]
            record.id = permission.id
            record.extra = JSON.parse(permission.extra)
        }
    }
    let onlinecheck
    if (res) {
        record.result = 1
    } else if (config.get("doorInfo.onlinecheck") === 1 && driver.mqtt.getStatus()) {
        // Online verifikacija, direktno prijavljivanje sadržaja, povratna informacija prema rezultatu odgovora
        let map = dxMap.get("VERIFY")
        let serialNo = utils.genRandomStr(10)
        map.put(serialNo, { time: new Date().getTime() })

        driver.mqtt.send({
            topic: "access_device/v1/event/access_online", payload: JSON.stringify(mqttService.mqttReply(serialNo, record, undefined))
        })
        // Čekanje rezultata online verifikacije
        let payload = driver.mqtt.getOnlinecheck()
        if (payload && payload.serialNo == serialNo && payload.code == '000000') {
            res = true
        } else {
            onlinecheck = "验证拒绝"
            map.del(serialNo)
        }
        isReport = false
    }
    // UI iskačući prozor, zujalica i glasovna poruka Uspjeh ili Neuspjeh
    log.info(data)
    if (res) {
        driver.audio.success()
        driver.screen.accessSuccess(type)
        // Open door relay
        driver.gpio.open()
        // Bluetooth odgovor
        if (type == 600) {
            if (code == null) {
                driver.uartBle.accessControl(data.index)
            } else {
                driver.uartBle.accessSuccess(data.index)
            }
        }
    } else {
        driver.audio.fail()
        driver.screen.accessFail(type, config.get("sysInfo.onlinecheckErrorMsg") || 0 == 1 ? onlinecheck : undefined)
        // Bluetooth odgovor
        if (type == 600) {
            if (code == null) {
                driver.uartBle.accessControl(data.index)
            } else {
                driver.uartBle.accessFail(data.index)
            }
        }
    }
    if (isReport) {
        // Prijavljivanje zapisa o komunikaciji
        accessReport(record);
    }
}

// Prijavljivanje zapisa o pristupu u realnom vremenu
function accessReport(record) {
    // Spremanje zapisa o pristupu, provjera gornje granice
    let count = sqliteFuncs.passRecordFindAllCount()
    let configNum = config.get("doorInfo.offlineAccessNum");
    configNum = utils.isEmpty(configNum) ? 2000 : configNum;
    if (configNum > 0) {
        if (parseInt(count[1]) >= configNum) {
            // Dostignut je maksimalan broj za pohranu
            // Brisanje najstarijeg zapisa
            sqliteFuncs.passRecordDelLast()
        }
        let data = JSON.parse(JSON.stringify(record))
        data.extra = JSON.stringify(data.extra)
        sqliteFuncs.passRecordInsert(data)
    }
    let map = dxMap.get("REPORT")
    let serialNo = utils.genRandomStr(10)
    map.del(serialNo)
    map.put(serialNo, { time: new Date().getTime(), list: [record.time] })
    driver.mqtt.send({
        topic: "access_device/v1/event/access", payload: JSON.stringify(mqttService.mqttReply(serialNo, [record], mqttService.CODE.S_000))
    })
}

export default accessService
