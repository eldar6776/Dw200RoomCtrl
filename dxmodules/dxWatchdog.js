//build 20240425
// The watchdog component is used to monitor whether the application is stuck and set a timeout. If the dog is not fed after this time, it will automatically trigger the device to restart.
// Note that you may need to initializegpio before using the watchdog
// Dependent components dxDriver, dxLogger, dxCommon, dxMap, dxGpio
import { watchdogClass } from './libvbar-b-dxwatchdog.so'
import dxMap from './dxMap.js'
import logger from './dxLogger.js'
import dxCommon from './dxCommon.js'

const map = dxMap.get("___watchdog")
const watchdogObj = new watchdogClass();

const watchdog = {}
watchdog.last = new Date().getTime()
/**
 * Turn on the watchdog device
 *  @param {number} type required
 * @param {string} id handleid, not required (if you initialize multiple instances, you need to pass in a unique id)
 */
watchdog.open = function (type, id) {
	let pointer = watchdogObj.open(type)
	if (pointer === undefined || pointer === null) {
		throw new Error("watchdog.open: open failed")
	}
	dxCommon.handleId("watchdog", id, pointer)
}
/**
 * Control the specified channel switch
 * @param {number} chan channel id,required
 * @param {string} id handleid, not required (must match the id in init)
 * @returns true/false
 */
watchdog.enable = function (chan, id) {
	let pointer = dxCommon.handleId("watchdog", id)
	return watchdogObj.enable(pointer, chan)
}
/**
 * Turn on the total watchdog timer
 *  @param {*} timeout required
 * @param {string} id handleid, not required (must match the id in init)
 * @returns true/false
 */
watchdog.start = function (timeout, id) {
	let pointer = dxCommon.handleId("watchdog", id)
	return watchdogObj.start(pointer, timeout)
}
/**
 * Check/determine whether it is a power-on reset and whether the watchdog has been started
 * @param {string} id handleid, not required (must match the id in init)
 * @returns true/false
 */
watchdog.isPoweron = function (id) {
	let pointer = dxCommon.handleId("watchdog", id)
	return watchdogObj.isPoweron(pointer)
}
/**
 * Designated channel for feeding dogs
 * @param {*} chan channel id, required
 * @param {string} id handleid, not required (must match the id in init)
 * @returns true/false
 */
watchdog.restart = function (chan, id) {
	let pointer = dxCommon.handleId("watchdog", id)
	return watchdogObj.restart(pointer, chan)
}
/**
 * Turn off the watchdog timer
 * @param {string} id handleid, not required (must match the id in init)
 * @returns true/false
 */
watchdog.stop = function (id) {
	let pointer = dxCommon.handleId("watchdog", id)
	return watchdogObj.stop(pointer)
}
/**
 * Turn off the watchdog device
 * @param {string} id handleid, not required (must match the id in init)
 * @returns true/false
 */
watchdog.close = function (id) {
	let pointer = dxCommon.handleId("watchdog", id)
	return watchdogObj.close(pointer)
}
/**
 * Check the dog feeding situation of each thread in a loop. If any thread does not feed the dog, the restart will not be started.
 * @param {number} chan channel id, required
 * @param {string} id handleid, not required (must match the id in init)
 */
watchdog.loop = function (chan, id) {
	const now = new Date().getTime()
	const minus = now - watchdog.last
	if (minus > 3000 || minus < 0) {//每3秒检查一次或者小于0代表操作了往前改时间
		watchdog.last = now
		let keys = map.keys()
		let check = true
		for (let i = 0; i < keys.length; i++) {
			let key = keys[i]
			let value = map.get(key)
			const temp = now - value.now
			if (temp > value.timeout * 1000 && temp < 1700000000) {
				logger.error(`The worker ${key} did not feed the dog in time.`, temp)
				check = false
				break
			}
		}
		if (check) {
			this.restart(chan, id)
		}
	}
}
/**
 * Different threads for feeding dogs
 * @param {string} flag thread identification, required cannot be empty
 * @param {number} timeout How long the thread can not feed the dog (seconds), the default is 10 seconds
 */
watchdog.feed = function (flag, timeout = 10) {
	if (!flag || flag.length <= 0) {
		return
	}
	map.put(flag, { now: new Date().getTime(), timeout: timeout })
}

export default watchdog;
