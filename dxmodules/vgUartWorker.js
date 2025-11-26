//build:20240715
//Used to simplify the use of the uart component micro-light communication protocol, encapsulating uart in this worker, users only need to subscribe to eventcenter events to listen to uart
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
            // Receive data mode
            if (options.passThrough) {
                // Transparent transmission mode, compatible with Wiegand and the like
                passThrough()
            }
            if(options.type == uart.TYPE.USBHID){
                receiveUsb() 
            } else {
                // Micro-light communication protocol mode
                receive()
            }
        } catch (error) {
            log.error(error)
        }
    }, 10)
}

// Transparent transmission mode
function passThrough() {
    let pack = [];
    let buffer = readOne()
    while (buffer !== null) {
        pack.push(buffer)
        os.sleep(10)
        buffer = readOne()
    }
    if (pack.length !== 0) {
        __bus.fire(uart.VG.RECEIVE_MSG + options.id, pack)//bus.newworker will import eventbus as __bus
    }
}

function receive() {
    // The first 2 bytes must be 55aa
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
    // Read command word (1 Byte)
    buffer = readOne()
    if (buffer === null) {
        return;
    }
    pack.cmd = buffer
    if (options.result) {
        // Read result word (1 Byte)
        buffer = readOne()
        if (buffer === null) {
            return;
        }
        pack.result = buffer;
    } else {
        pack.result = 0//0 does not affect the calculation result of bcc
    }
    // Command header has been parsed, read length word (2 Bytes)
    let len1 = readOne()
    if (len1 === null) {
        return;
    }
    let len2 = readOne()
    if (len2 === null) {
        return;
    }
    // Parse the length word to get the data field length
    let len = len1 + len2 * 256
    // Read the specified data length according to the length word
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
    // Read 1 Byte checksum
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
    __bus.fire(uart.VG.RECEIVE_MSG + options.id, res)//bus.newworker will import eventbus as __bus
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
            __bus.fire(uart.VG.RECEIVE_MSG + options.id, res)//bus.newworker will import eventbus as __bus
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