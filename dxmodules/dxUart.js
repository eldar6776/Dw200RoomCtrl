//build: 20240715
// data communication channels, including serial port, USB (Universal Serial Bus) and Wiegand
// Dependent components: dxDriver, dxStd, dxLogger, dxMap, dxEventBus, dxCommon
import { channelClass } from './libvbar-m-dxchannel.so'
import std from './dxStd.js'
import dxMap from './dxMap.js'
import dxCommon from './dxCommon.js'
import bus from './dxEventBus.js'
const uartObj = new channelClass();
const map = dxMap.get('default')
const uart = {}
uart.TYPE = {
	USBKBW: 1,//USB Keyboard Wedge通过USB接口连接键盘，并以韦根协议的形式传输数据
	USBHID: 2,//USB人体接口设备（USB Human Interface Device）通道类型
	UART: 3,//表示UART通道类型，即串口通道
	WIEGAND: 4//韦根（Wiegand）通道类型
}
/**
 * open channel
 * @param {number} type channel type, refer to enumeration TYPE, required
 * @param {string} path Different devices or different types of channels of the same device have different paths. For example, the corresponding value of 485 of DW200 is "/dev/ttyS2", required
 * @param {string} id handleid, not required (if you open multiple instances, you need to pass in a unique id)
 */
uart.open = function (type, path, id) {
	if (type === undefined || type === null) {
		throw new Error("uart.open:'type' should not be null or empty")
	}
	if (path === undefined || path === null) {
		throw new Error("uart.open:'path' should not be null or empty")
	}

	let pointer = uartObj.open(type, path);

	if (pointer === undefined || pointer === null) {
		throw new Error("uart.open: open failed")
	}

	dxCommon.handleId("uart", id, pointer)
}

/**
 * channeldatasend
 * @param {ArrayBuffer} buffer The data to send, required
 * @param {string} id handleid, not required (must match the id in init)
 * @returns true/false
 */
uart.send = function (buffer, id) {
	if (buffer === undefined || buffer === null) {
		throw new Error("uart.send: 'buffer' should not be null or empty")
	}
	let pointer = dxCommon.handleId("uart", id)

	return uartObj.send(pointer, buffer);
}

/**
 * Channel datasend, using low light communication protocol format
 * @param {string/object} data data to send, required
 * @param {string} id handleid, not required (must match the id in init)
 * @returns true/false
 */
uart.sendVg = function (data, id) {
	if (!data) {
        return
    }
    if (typeof data === 'string') {
        uart.send(dxCommon.hexStringToArrayBuffer(data), id)
        return
    }
    let pack = '55aa' + data.cmd
    if (data.hasOwnProperty('result')) {
        pack += data.result
    }
    pack += (data.length % 256).toString(16).padStart(2, '0')
    pack += (Math.floor(data.length / 256)).toString(16).padStart(2, '0')
    pack += data.data
    let all = dxCommon.hexToArr(pack)
    let bcc = dxCommon.calculateBcc(all)
    all.push(bcc)
    uart.send(new Uint8Array(all).buffer, id)
}

/**
 * receiveddata, you need to poll/polling in the thread to get/obtain, and return the Uint8Array type
 * If the received data does not reach the size length, it will continue to wait until the receive reaches the size length. However, if the timeout is very short, it is possible to end the operation before it is completed.
 * @param {number} size The number of bytes of receiveddata, required
 * @param {number} timeout timeout time (milliseconds). This function will block and wait for up to this time and then end. If size data is received in advance, it will also end. If it is not required, the default is 10ms.
 * @param {string} id handleid, not required (must match the id in init)
 * @returns Uint8Array, the byteLength of the return value indicates the length received. If it is 0, it means no data was received.
 */
uart.receive = function (size, timeout, id) {
	if (size === undefined || size === null) {
		throw new Error("uart.receive:'size' should not be null or empty")
	}

	if (timeout === undefined || timeout === null) {
		timeout = 10
	}

	let pointer = dxCommon.handleId("uart", id)

	let res = uartObj.receive(pointer, size, timeout)
	if (res === null) {
		return null
	}
	return new Uint8Array(res)
}

/**
 * Call the channel special IO interface
 * @param {*} request 
 * @param {*} arg 
 * @param {string} id handleid, not required (must match the id in init)
 * @returns true/false
 */
uart.ioctl = function (request, arg, id) {
	let pointer = dxCommon.handleId("uart", id)

	return uartObj.ioctl(pointer, request, arg)
}

/**
 * close channel
 * @param {string} id handleid, not required (must match the id in init)
 * @returns true/false
 */
uart.close = function (id) {
	let pointer = dxCommon.handleId("uart", id)

	return uartObj.close(pointer)
}


/**
 * refresh channel
 *  @param {number} queue_selector required
 * @param {string} id handleid, not required (must match the id in init)
 * @returns true/false
 */
uart.flush = function (queue_selector, id) {
	if (queue_selector == null) {
		throw new Error("queue_selector should not be null or empty")
	}
	let pointer = dxCommon.handleId("uart", id)

	return uartObj.flush(pointer, queue_selector);
}


uart.VG = {
	RECEIVE_MSG: '__uartvg__MsgReceive',
}

/**
 * Simplify the use of low-light communication protocols,
 * 1. Receive data: Receive the binary data of TLV and parse it into objects, and send them out as events of eventbus (uart.VG.RECEIVE_MSG+options.id)
 * Returned object format: {cmd:"2a",result:"01",length:7,data:"0a1acc320fee32",bcc:true}
 * cmd: 1-byte command word, hexadecimal string
 * result: a 1-byte identifier, indicating the result of data processing, success or failed or other status/state. Only feedback data has an identification word, a hexadecimal string
 * length: The length of data, defined in TLV as 2 bytes, which is directly converted into a decimal number.
 * data: multi-byte data field, hexadecimal string
 * bcc: bcc check success or failed
 * 2. senddata: Convert the object into binary data in TLVformat and then send it out. You can use uart.sendVg('data to be sent', id). The dataformat is as follows
 * There are two types of dataformat for send: 1. Object format: {cmd: "2a", result: "01", length: 7, data: "0a1acc320fee32"} 2. Complete hexadecimal string '55AA09000000F6'
 * 3. With the same ID, runvg will only be executed once if called multiple times.
 * 
 * @param {object} options parameters to start
 * @param {number} options.type channel type, refer to enumeration TYPE, required (compatible with USBHID block transmission, default 1024 per block)
 * @param {string} options.path Different devices or different types of channels of the same device have different paths. For example, the corresponding value of 485 of DW200 is "/dev/ttyS2", required
 * @param {number} options.result 0 and 1 (default is 0), indicating whether the receive data or the send data contains the identification byte, 0 means that the received data does not include the identification word, the send data includes the identification word, 1 means vice versa
 * @param {number} options.passThrough passThrough is true, the received data uses transparent transmission mode, not required
 * @param {string} options.id handleid, not required (if you initialize multiple instances, you need to pass in a unique id)
 */
uart.runvg = function (options) {
	if (options === undefined || options.length === 0) {
		throw new Error("dxuart.runvg:'options' parameter should not be null or empty")
	}
	if (options.id === undefined || options.id === null || typeof options.id !== 'string') {
        //  handleid
        options.id = ""
    }
	if (options.type === undefined || options.type === null) {
		throw new Error("dxuart.runvg:'type' should not be null or empty")
	}
	if (options.path === undefined || options.path === null) {
		throw new Error("dxuart.runvg:'path' should not be null or empty")
	}
	let oldfilepre = '/app/code/dxmodules/vgUartWorker'
	let content = std.loadFile(oldfilepre + '.js').replace("{{id}}", options.id)
	let newfile = oldfilepre + options.id + '.js'
	std.saveFile(newfile, content)
	let init = map.get("__vguart__run_init" + options.id)
	if (!init) {//确保只初始化一次
		map.put("__vguart__run_init" + options.id, options)
		bus.newWorker(options.id || "__uart",newfile)
	}
}
export default uart;