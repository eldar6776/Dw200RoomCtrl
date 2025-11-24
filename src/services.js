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

pool.callback((data) => {
    let topic = data.topic
    let msg = data.data
    
    // Debug logiranje za sve događaje
    log.debug("[Services] Event received - Topic: " + topic)
    
    switch (topic) {
        case "password":
            log.info("[Services] PASSWORD event: " + JSON.stringify(msg))
            accessService.access(msg)
            break;
        case dxNet.STATUS_CHANGE:
            log.info("[Services] NETWORK STATUS CHANGE")
            netService.netStatusChanged(msg)
            break;
        case dxMqtt.CONNECTED_CHANGED + driver.mqtt.id:
            log.info("[Services] MQTT CONNECTION CHANGED")
            mqttService.connectedChanged(msg)
            break;
        case dxMqtt.RECEIVE_MSG + driver.mqtt.id:
            log.info("[Services] MQTT MESSAGE RECEIVED")
            mqttService.receiveMsg(msg)
            break;
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
        case dxNfc.RECEIVE_MSG:
            log.info("═══════════════════════════════════════════════════════════")
            log.info("  💳 NFC CARD DETECTED")
            log.info("═══════════════════════════════════════════════════════════")
            nfcService.receiveMsg(msg)
            break;
        case dxGpioKey.RECEIVE_MSG:
            log.debug("[Services] GPIO KEY event")
            gpioKeyService.receiveMsg(msg)
            break;
        case dxUart.VG.RECEIVE_MSG + driver.uartBle.id:
            log.debug("[Services] BLE UART event")
            uartBleService.receiveMsg(msg)
            break;
        case "bleupgrade":
            log.info("[Services] BLE UPGRADE event")
            driver.uartBle.upgrade(msg)
            break;
        default:
            log.error("[Services] UNKNOWN TOPIC: " + topic)
            break;
    }
})
