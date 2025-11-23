import logger from '../dxmodules/dxLogger.js'
import code from '../dxmodules/dxCode.js'
import common from '../dxmodules/dxCommon.js'
import std from '../dxmodules/dxStd.js'
import ota from '../dxmodules/dxOta.js'
import ui from "../dxmodules/dxUi.js";
import gpio from "../dxmodules/dxGpio.js"
import config from '../dxmodules/dxConfig.js'
import bus from '../modules/eventBusExtended.js'
import screen from '../modules/screen.js'
//import auth from '../modules/auth.js'




let context ={}







function QRCodeHandler (data) {
      let str = common.utf8HexToStr(common.arrayBufferToHexString(data))
      logger.info(str)
      try {
        str = JSON.parse(str)
        firstPage.setQRStatus('qr ispravan')
      } catch (error) {
        firstPage.setQRStatus('qr neispravan')
      }
      /*if((str.door == 2) && (str.password == 333))
      {
          gpio.setValue(105, 1)
          std.setTimeout(() => {
              gpio.setValue(105, 0)
          }, 2000)
          
      }*/
      //ota.updateHttp(str.url,str.md5, 60, undefined, {"verifyPeer": 0})
      //ota.reboot()
  }








function nfcHandler(data){
  try {

    const nfcData = {}

    //first name
    nfcData.firstName = common.utf8HexToStr(common.uint8ArrayToHexString(nfc.m1cardReadSector(0, 0, 1, 1, [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], 0x60).filter(x => (x !== 0) && (x !== 255))))

    //last name
    nfcData.lastName = common.utf8HexToStr(common.uint8ArrayToHexString(nfc.m1cardReadSector(0, 0, 2, 1, [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], 0x60).filter(x => (x !== 0) && (x !== 255))))

    /*
    1 - group (gost, sobarica,...)
    2,3,4,5 - id sobe
    */
    nfcData.group = common.utf8HexToStr(common.uint8ArrayToHexString(nfc.m1cardReadSector(0, 1, 0, 1, [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], 0x60).filter(x => (x !== 0) && (x !== 255))))
    nfcData.objectID = Number(String.fromCharCode(...nfc.m1cardReadSector(0, 1, 1, 1, [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], 0x60).filter(x => (x !== 0) && (x !== 255))))

    //datum vazenja
    //logger.info(nfc.m1cardReadSector(0, 2, 0, 1, [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], 0x60))
    let sec2logAll = nfc.m1cardReadSector(0, 2, 0, 4, [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], 0x60)



    nfcData.expirationDay = Number(sec2logAll[0].toString(16))
    nfcData.expirationMonth = Number(sec2logAll[1].toString(16))
    nfcData.expirationYear = Number(sec2logAll[2].toString(16))
    nfcData.expirationHour = Number(sec2logAll[3].toString(16))
    nfcData.expirationMinute = Number(sec2logAll[4].toString(16))

    nfcData.controllerID = sec2logAll[7]


    //invaliditet, jezik, spol
    let sec2log0 = common.utf8HexToStr(common.uint8ArrayToHexString(nfc.m1cardReadSector(0, 2, 0, 1, [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF], 0x60).filter(x => (x !== 0) && (x !== 255))))

    nfcData.disability = sec2log0[6]
    nfcData.language = sec2log0[7]
    nfcData.logo = sec2log0[8]
    nfcData.gender = sec2log0[9]

    /*const expirationDate = new Date(nfcData.expirationYear, nfcData.expirationMonth, nfcData.expirationDay, nfcData.expirationHour, nfcData.expirationMinute)
    const currentDate = new Date(2025, 9, 29, 15, 30)*/



    auth.validateNFCCard(nfcData)


    //logger.info(firstName)
    //logger.info(lastName)
  }
  catch (err) {
    logger.info(err)
  }
}
  



  







config.init()
gpio.init()
bus.init()
ui.init({orientation: 1}, context)







bus.bus.newWorker('code', '/app/code/src/codeservice.js')
bus.on(code.RECEIVE_MSG, QRCodeHandler)
//bus.on(nfc.RECEIVE_MSG, nfcHandler)




screen.open(screen.PAGE_IDs.HOME)




let timer = std.setInterval(() => {
    if (ui.handler() < 0) {
        std.clearInterval(timer)
    }
}, 1)


