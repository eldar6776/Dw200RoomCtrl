import logger from '../dxmodules/dxLogger.js'
import common from '../dxmodules/dxCommon.js'
import nfc from '../dxmodules/dxNfc.js'
import bus from '../modules/eventBusExtended.js'
import auth from '../modules/auth.js'






const nfcExtended = {}
nfcExtended.nfc = nfc



let extractedData = null






nfcExtended.init = function(){
    nfcExtended.nfc.worker.beforeLoop({ id: 'nfc1', m1: true, psam: false })
    bus.on(nfcExtended.nfc.RECEIVE_MSG, cardHabdler)
}


nfcExtended.loop = function() {
    if(extractedData){
        auth.validateNFCCard(extractedData)
        extractedData = null
    }

    nfcExtended.nfc.worker.loop()
}







function cardHabdler(data){
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



    extractedData = nfcData

    //auth.validateNFCCard(nfcData)


    //logger.info(firstName)
    //logger.info(lastName)
  }
  catch (err) {
    logger.info(err)
  }
}









export default nfcExtended
