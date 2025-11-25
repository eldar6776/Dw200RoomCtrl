//build 20240524
//Accept gpio input
//Dependent components: dxLogger,dxDriver,dxEventBus
import { gpioKeyClass } from './libvbar-m-dxkey.so'
import bus from './dxEventBus.js'
import * as os from "os";
const gpioKeyObj = new gpioKeyClass();
const gpioKey = {}

/**
 * gpioKey initialization
 * @returns true: success, false: failure
 */
gpioKey.init = function () {
	const res = gpioKeyObj.init()
	if (res) {
		gpioKeyObj.registerCb("gpioKeyCb")
	}
	return res
}

/**
 * gpioKey deinitialization
 * @returns true: success, false: failure
 */
gpioKey.deinit = function () {
	gpioKeyObj.unRegisterCb("gpioKeyCb")
	return gpioKeyObj.deinit()
}

/**
 * Determine whether the gpioKey message queue is empty
 * @returns true: success, false: failure
 */
gpioKey.msgIsEmpty = function () {
	return gpioKeyObj.msgIsEmpty()
}

/**
 * Read data from the gpioKey message queue
 * @returns json message object, format: {"code":30,"type":1,"value":1}
 */
gpioKey.msgReceive = function () {
	let msg = gpioKeyObj.msgReceive()
	return JSON.parse(msg);
}

gpioKey.RECEIVE_MSG = '__gpioKey__MsgReceive'

/**
 * Simplify the use of the gpiokey component, no need to poll to get data, the data will be sent out through the eventbus
 * run will only be executed once
 * If you need to get data in real time, you can subscribe to the event of eventbus. The topic of the event is GPIO_KEY, and the content of the event is similar to {"code":30,"type":1,"value":1}
 * Among them, code is the identifier of the gpio, which indicates which gpio has input. The value can only be 0, and 1 usually represents low level and high level.
 * type is the event type, which follows the Linux standard input regulations. The following are some commonly used ones:
	(0x01): Key event, including all keyboard and button events. For example, when a key on the keyboard is pressed or released, this type of event will be reported.
	(0x05): Switch event, for example, the switch of the laptop cover can report the open and closed status.
	(Ox11): LED event, used to control the LED indicator on the device,
	(Ox12): Sound event, used to control the sound output on the device,
	(0x16): Power event, can be used to report power button events or low battery
 * 
 */
gpioKey.run = function () {
	bus.newWorker("__gpiokey", '/app/code/dxmodules/gpioKeyWorker.js')
}

/**
 * If gpioKey is a separate thread, you can directly use the run function, which will automatically start a thread,
 * If you want to join other existing threads, you can use the following encapsulated functions
 */
gpioKey.worker = {
	// Before the while loop
	beforeLoop: function () {
		gpioKey.init()
	},
	// in the while loop
	loop: function () {
		if (!gpioKey.msgIsEmpty()) {
			let res = gpioKey.msgReceive();
			bus.fire(gpioKey.RECEIVE_MSG, res)
		}
	}
}
export default gpioKey;
