//build:20240715
//Koristi se za pojednostavljenje upotrebe protokola za komunikaciju pri slabom osvjetljenju UART komponente. UART je enkapsuliran u ovom workeru, a korisnik treba samo da se pretplati na događaj eventcenter-a kako bi slušao UART.
import log from './dxLogger.js'
import uart from './dxUart.js'
import common from './dxCommon.js';
import dxMap from './dxMap.js'
import * as os from "os";
import std from './dxStd.js'
const map = dxMap.get('default')
const id = "{{id}}"
const options = map.get("__vguart__run_init" + id)
const timeout = 100
const longTimeout = 500

function run() {
    uart.open(options.type, options.path, options.id)
    log.info('vg uart start......,id =', id)
    std.setInterval(() => {
        try {
            // Način primanja podataka
            if (options.passThrough) {
                // Prolazni mod, prilagođen za Wiegand i slično
                passThrough()
            }
            if(options.type == uart.TYPE.USBHID){
                receiveUsb() 
            } else {
                // Mod protokola za komunikaciju pri slabom osvjetljenju
                receive()
            }
        } catch (error) {
            log.error(error)
        }
    }, 10)
}

// Prolazni mod
function passThrough() {
    let pack = [];
    let buffer = readOne()
    while (buffer !== null) {
        pack.push(buffer)
        os.sleep(10)
        buffer = readOne()
    }
    if (pack.length !== 0) {
        __bus.fire(uart.VG.RECEIVE_MSG + options.id, pack)//bus.newworker的时候会import eventbus as __bus
    }
}

function receive() {
    //Prva 2 bajta moraju biti 55aa
    let buffer = readOne()
    if (buffer === null) {
        return;
    }
    if (buffer == 85) {//0x55
        buffer = readOne()
        if (buffer != 170) {//0xaa
            return;
        }
    } else {
        return;
    }
    let pack = {};
    // Čitanje komandne riječi (zauzima 1 bajt)
    buffer = readOne()
    if (buffer === null) {
        return;
    }
    pack.cmd = buffer
    if (options.result) {
        // Čitanje riječi rezultata (zauzima 1 bajt)
        buffer = readOne()
        if (buffer === null) {
            return;
        }
        pack.result = buffer;
    } else {
        pack.result = 0//0 ne utiče na rezultat BCC izračuna
    }
    // Zaglavlje komande je parsirano, čitanje riječi dužine (zauzima 2 bajta)
    let len1 = readOne()
    if (len1 === null) {
        return;
    }
    let len2 = readOne()
    if (len2 === null) {
        return;
    }
    // Parsiranje riječi dužine, dobijanje dužine polja podataka
    let len = len1 + len2 * 256
    // Čitanje specificirane dužine podataka na osnovu riječi dužine
    pack.length = len
    if (len > 0) {
        buffer = uart.receive(len, longTimeout, options.id)
        if (buffer === null) {
            return;
        }
        pack.data = Array.from(buffer);
    } else {
        pack.data = 0
    }
    // Čitanje 1 bajta kontrolnog zbira
    buffer = readOne()
    if (buffer === null) {
        return;
    }
    let bcc = valid(pack, buffer)
    let res = { cmd: int2hex(pack.cmd), length: pack.length, bcc: bcc }
    if (pack.length > 0) {
        res.data = common.arrToHex(pack.data)
    }
    if (options.result) {
        res.result = int2hex(pack.result)
    }
    __bus.fire(uart.VG.RECEIVE_MSG + options.id, res)//Prilikom kreiranja novog radnika (bus.newworker), eventbus se importuje kao __bus
}


function receiveUsb() {
    let arr = uart.receive(1024, 100, options.id)
    if (arr && arr[0] == 0x55 && arr[1] == 0xAA) {
        let cmd = arr[2]
        let dlen = arr[4] * 256 + arr[3]
        if (dlen > (1024 - 6)) {
            let tempLen = dlen - 1024 + 5 
            while(tempLen >= 0){
                let tempArr = uart.receive(1024, 100, options.id)
                tempLen = tempLen - tempArr.length
                let newArr = new Uint8Array(arr.length + tempArr.length)
                newArr.set(arr)
                newArr.set(tempArr, arr.length)
                arr = newArr
            }
        }
        let data = (dlen == 0 ? [] : Object.values(arr.slice(5, 5 + dlen)))
        let bcc = common.calculateBcc([0x55, 0xAA, arr[2], arr[3], arr[4]].concat(data))
        data = data.map(v => v.toString(16).padStart(2, '0')).join('')
        if (bcc == arr[5 + dlen]) {
            let res = { "cmd": cmd.toString(16).padStart(2, '0'), "length": dlen, "data": data, "bcc": true }
            __bus.fire(uart.VG.RECEIVE_MSG + options.id, res)//Prilikom kreiranja novog radnika (bus.newworker), eventbus se importuje kao __bus
        }
    }
}

function valid(pack, bcc) {
    let temp = common.calculateBcc([0x55, 0xaa, pack.cmd, pack.result, pack.length % 256, Math.floor(pack.length / 256)].concat(pack.data))
    return temp === bcc
}
function readOne() {
    let buffer = uart.receive(1, timeout, options.id)
    if (buffer) {
        return parseInt(buffer);
    }
    return null
}
function int2hex(num) {
    return num.toString(16).padStart(2, '0')
}

try {
    run()
} catch (error) {
    log.error(error, error.stack)
}