// build : 20240419
// PWM stands for Pulse Width Modulation and is used to simulate output voltage or power to control the buzzer, motor speed, LED brightness, thermostat temperature, etc.
import { pwmClass } from './libvbar-b-dxpwm.so'
import * as os from "os"
const pwmObj = new pwmClass();

const pwm = {}

/**
 * Apply for pwm channel, apply once
 * @param {number} channel The channel number applied for, supports channels 0~7
 * @returns true/false
 */
pwm.request = function (channel) {
	return pwmObj.request(channel)
}
/**
 * Set PWM mode
 * @@param {number} mode 0 --> CPU mode, continuous waveform.
	1 --> DMA mode,指定数量的波形.
	2 --> DMA mode,连续波形.
 * @returns true/false
 */
pwm.setMode = function (mode) {
	return pwmObj.setMode(mode)
}
/**
 * Setting the PWM cycle refers to the time it takes for a complete PWM signal cycle
 * @param {number} periodNs PWM period value to be set (unit: ns)
 * @returns true/false
 */
pwm.setPeriod = function (periodNs) {
	return pwmObj.setPeriod(periodNs)
}
/**
 * Setting the PWM duty cycle refers to the time occupied by the high level (pulse) in a complete cycle
 * @param {number} dutyNs PWM duty cycle to be set (time to set high level, unit: ns)
 * @returns true/false
 */
pwm.setDuty = function (dutyNs) {
	return pwmObj.setDuty(dutyNs)
}
/**
 * Set PWM mode 2, the number of waveform modes for the number of instructions
 * @param {number} dutyNs 
 * @returns true/false
 */
pwm.setDmaDuty = function (dutyNs) {
	return pwmObj.setDmaDuty(dutyNs)
}
/**
 * Enable specified channel
 * @param {number} channel The channel number applied for, supports channels 0~7
 * @param {boolean} on 
 * @returns true/false
 */
pwm.enable = function (channel, on) {
	return pwmObj.enable(channel, on)
}
/**
 * Close selected channel
 * @param {number} channel input parameter, the applied channel number, supports channels 0~7
 * @returns true/false
 */
pwm.free = function (channel) {
	return pwmObj.free(channel)
}
/**
 * Set the PWM period of the specified channel
 * @param {number} channel The channel number applied for, supports channels 0~7
 * @param {number} periodNs PWM period value to be set (unit: ns)
 * @returns true/false
 */
pwm.setPeriodByChannel = function (channel, periodNs) {
	return pwmObj.setPeriodByChannel(channel, periodNs)
}
/**
 * Set the PWM duty cycle of the specified channel
 * @param {number} channel The channel number applied for, supports channels 0~7
 * @param {number} dutyNs PWM duty cycle to be set (time to set high level, unit: ns)
 * @returns true/false
 */
pwm.setDutyByChannel = function (channel, dutyNs) {
	return pwmObj.setDutyByChannel(channel, dutyNs);
}
/**
* Buzzer needs to be requested first, setPeriodByChannel and enable before it can be used.
* @param {object} options beep parameter
* @param {number} options.channel The channel number applied for, supports channels 0~7, required
* @param {number} options.period PWM period value to be set (unit: ns) default is 366166
* @param {number} options.count The number of beeps, default is 1
* @param {number} options.time The beep time, the default is 50 milliseconds, if you want to beep for a long time, it is usually 500 milliseconds.
* @param {number} options.interval The interval between 2 beeps, default is 50 milliseconds
* @param {number} options.volume beep volume, default is 50
*/
pwm.beep = function (options) {
	const {
		count = 1,
		time = 50,
		interval = 50,
		volume = 50,
		period = 366166,
	} = options;
	for (let i = 0; i < count; i++) {
		pwm.setDutyByChannel(options.channel, period * volume / 255)
		os.sleep(time)
		pwm.setDutyByChannel(options.channel, 0)
		if (i < (count - 1)) {
			// The last beep has no interval
			os.sleep(interval)
		}
	}
}

export default pwm;
