import bus from '../dxmodules/dxEventBus.js'
import code from '../dxmodules/dxCode.js'
import logger from '../dxmodules/dxLogger.js'
import common from '../modules/commonExtended.js'
//import nfc from '../modules/nfcExtended.js'
//import screen from '../modules/screen.js'
//import auth from '../modules/auth.js'






const eventBusExtended = {}

eventBusExtended.bus = bus
eventBusExtended.handlers = {}






eventBusExtended.init = function(){
    /*bus.on(code.RECEIVE_MSG, (data) => {
        callHandlers(code.RECEIVE_MSG, data)
    })

    this.bus.on(nfc.nfc.RECEIVE_MSG, (data) => {
        callHandlers(nfc.nfc.RECEIVE_MSG, data)
    })

    this.bus.on(screen.EVENTS.OPEN_PAGE, (data) => {
        callHandlers(screen.EVENTS.OPEN_PAGE, data)
    })

    this.bus.on(auth.EVENTS.DOOR_PASSWORD_VALID, (data) => {
        callHandlers(auth.EVENTS.DOOR_PASSWORD_VALID, data)
    })

    this.bus.on(auth.EVENTS.DOOR_PASSWORD_INVALID, (data) => {
        callHandlers(auth.EVENTS.DOOR_PASSWORD_INVALID, data)
    })

    this.bus.on(auth.EVENTS.NFC_CARD_VALID, (data) => {
        callHandlers(auth.EVENTS.NFC_CARD_VALID, data)
    })

    this.bus.on(auth.EVENTS.NFC_CARD_INVALID, (data) => {
        callHandlers(auth.EVENTS.NFC_CARD_INVALID, data)
    })*/
}






eventBusExtended.on = function (event, callback) {
    if (common.isAnonymousFunction(callback)) {
        throw new Error("Callback can't be anonymous")
    }

    if(!Object.hasOwn(event)){
        eventBusExtended.bus.on(event, (data) => {
            callHandlers(event, data)
        })
    }

    if (event && callback) {
        if (!this.handlers[event]) {
            this.handlers[event] = []
        }

        this.handlers[event].push(callback)
    }
}






eventBusExtended.off = function(event, callback){
    if(event && callback && this.handlers[event]){
        const index = this.handlers[event].indexOf(callback)
        if(index !== (-1)) this.handlers[event].splice(index, 1)
    }
}






eventBusExtended.fire = function(event, data){
    this.bus.fire(event, data)
}




/*
--------------------PRIVATE--------------------
*/


let callHandlers = function(event, data){
    if(event && eventBusExtended.handlers[event]){
        for (const cb of eventBusExtended.handlers[event]) {
            cb(data)
        }
    }
}



export default eventBusExtended
