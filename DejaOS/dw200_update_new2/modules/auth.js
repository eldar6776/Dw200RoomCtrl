import bus from '../modules/eventBusExtended.js'





const auth = {}






auth.EVENTS = {
    NFC_CARD_VALID: 'nfcCardValid',
    NFC_CARD_INVALID: 'nfcCardInvalid',
    DOOR_PASSWORD_VALID: 'doorPasswordValid',
    DOOR_PASSWORD_INVALID: 'doorPasswordInvalid'
}








/**
 * @param {Object} nfcData
 */
auth.validateNFCCard = function(nfcData){
    const expirationDate = new Date(nfcData.expirationYear, nfcData.expirationMonth, nfcData.expirationDay, nfcData.expirationHour, nfcData.expirationMinute)
    const currentDate = new Date(2025, 9, 29, 15, 30)
    
    /*if(expirationDate > currentDate){
        bus.fire(auth.EVENTS.NFC_CARD_VALID)
    }

    bus.fire(auth.EVENTS.NFC_CARD_INVALID, nfcData)*/

    bus.fire(auth.EVENTS.NFC_CARD_VALID, nfcData)
}





auth.validateDoorPassword = function(password){
    bus.fire(auth.EVENTS.DOOR_PASSWORD_INVALID)
}






export default auth
