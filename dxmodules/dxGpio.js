// build : 20240524
// gpio output, can only output 2 states, high level / low level, if connected to a relay, high level is on, low level is off
import { gpioClass } from './libvbar-b-dxgpio.so'
const gpioObj = new gpioClass();
const gpio = {}

/**
 * Initialization, only needs to be executed once
 * @returns true/false
 */
gpio.init = function () {
	return gpioObj.init();
}

/**
 * Release gpio resources
 * @returns true/false
 */
gpio.deinit = function () {
	return gpioObj.exit();
}

/**
 * Apply for gpio, each gpio only needs to be applied for once
 * @param {number} gpio The identifier of the gpio, different devices have different identifiers, required
 * @returns true/false
 */
gpio.request = function (gpio_) {
	let res = gpioObj.request(gpio_)
	if (!res) {
		return res
	}
	gpioObj.setFunc(gpio_, 0x04);
	return true
}

/**
 * Release the specified gpio
 * @param {number} gpio The identifier of the gpio, different devices have different identifiers, required
 * @returns true/false
 */
gpio.free = function (gpio_) {
	return gpioObj.free(gpio_);
}

/**
 * Specify gpio to output high/low level
 * @param {number} gpio The identifier of the gpio, different devices have different identifiers, required
 * @param {number} value It can only be 1 and 0, 1 means high level, 0 means low level, the default is high level, required
 * @returns true/false
 */
gpio.setValue = function (gpio_, value) {
	return gpioObj.setValue(gpio_, value);
}

/**
 * Get the current output of the specified gpio: high/low level
 * @param {number} gpio The identifier of the gpio, different devices have different identifiers, required
 * @returns 1 and 0, 1 for high level, 0 for low level
 */
gpio.getValue = function (gpio_) {
	return gpioObj.getValue(gpio_);
}

/**
 * Apply for gpio, each gpio only needs to be applied for once
 * @param {number} gpio The identifier of the gpio, different devices have different identifiers, required
 * @returns true/false
 */
gpio.requestGpio = function (gpio_) {
	let res = gpioObj.request(gpio_)
	return res
}

/**
 * Set gpio function
 * @param {number} gpio The identifier of the gpio, different devices have different identifiers, required
 * @param {number} func gpio function attributes, different devices have different function attributes, required
 * @returns true/false
 */
gpio.setFuncGpio = function (gpio_, func) {
	let res = gpioObj.setFunc(gpio_, func)
	return res
}

/**
 * Set the pull-up state of the specified gpio
 * @param {number} gpio The identifier of the gpio, different devices have different identifiers, required
 * @param {number} state Pull-up state, required
 * @returns true/false
 */
gpio.setPullState = function (gpio_, state) {
	return gpioObj.setPullState(gpio_, state);
}

/**
 * Get the pull-up state of the specified gpio
 * @param {number} gpio The identifier of the gpio, different devices have different identifiers, required
 * @returns Pull-up state (int)
 */
gpio.getPullState = function (gpio_) {
	return gpioObj.getPullState(gpio_);
}
/**
 * Set the driving capability of the specified gpio
 * @param {number} gpio The identifier of the gpio, different devices have different identifiers, required
 * @param {number} strength Capability, required
 * @returns true/false
 */
gpio.setDriveStrength = function (gpio_, strength) {
	return gpioObj.setDriveStrength(gpio_, strength);
}

/**
 * Get the driving capability of the specified gpio
 * @param {number} gpio The identifier of the gpio, different devices have different identifiers, required
 * @returns Capability (int)
 */
gpio.getDriveStrength = function (gpio_) {
	return gpioObj.getDriveStrength(gpio_);
}

export default gpio;
