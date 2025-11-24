// build : 20240419
// PWM (Pulse Width Modulation) se koristi za simulaciju izlaznog napona ili snage, za kontrolu zujalica, brzine motora, svjetline LED dioda, temperature termostata itd.
import { pwmClass } from './libvbar-b-dxpwm.so'
import * as os from "os"
const pwmObj = new pwmClass();

const pwm = {}

/**
 * Zahtjev za PWM kanal, dovoljno je zatražiti jednom.
 * @param {number} channel Broj kanala za zahtjev, podržava kanale 0-7.
 * @returns true/false
 */
pwm.request = function (channel) {
	return pwmObj.request(channel)
}
/**
 * Postavljanje PWM moda
 * @param {number} mode  
	0 --> CPU mod, kontinuirani talasni oblik.
	1 --> DMA mod, određeni broj talasnih oblika.
	2 --> DMA mod, kontinuirani talasni oblik.
 * @returns true/false
 */
pwm.setMode = function (mode) {
	return pwmObj.setMode(mode)
}
/**
 * Postavljanje PWM perioda, što je vrijeme potrebno za jedan potpuni ciklus PWM signala.
 * @param {number} periodNs  Vrijednost PWM perioda za postavljanje (jedinica: ns).
 * @returns true/false
 */
pwm.setPeriod = function (periodNs) {
	return pwmObj.setPeriod(periodNs)
}
/**
 * Postavljanje PWM radnog ciklusa (duty cycle), što je vrijeme tokom kojeg je signal na visokom nivou (impuls) unutar jednog potpunog ciklusa.
 * @param {number} dutyNs  Vrijednost PWM radnog ciklusa za postavljanje (vrijeme visokog nivoa, jedinica: ns).
 * @returns true/false
 */
pwm.setDuty = function (dutyNs) {
	return pwmObj.setDuty(dutyNs)
}
/**
 * Postavljanje PWM moda 2, broj talasnih oblika u modu sa određenim brojem instrukcija.
 * @param {number} dutyNs 
 * @returns true/false
 */
pwm.setDmaDuty = function (dutyNs) {
	return pwmObj.setDmaDuty(dutyNs)
}
/**
 * Omogućavanje određenog kanala
 * @param {number} channel  Broj kanala za zahtjev, podržava kanale 0-7.
 * @param {boolean} on 
 * @returns true/false
 */
pwm.enable = function (channel, on) {
	return pwmObj.enable(channel, on)
}
/**
 * Zatvaranje odabranog kanala
 * @param {number} channel Ulazni parametar, broj kanala za zahtjev, podržava kanale 0-7.
 * @returns true/false
 */
pwm.free = function (channel) {
	return pwmObj.free(channel)
}
/**
 * Postavljanje PWM perioda za određeni kanal
 * @param {number} channel  Broj kanala za zahtjev, podržava kanale 0-7.
 * @param {number} periodNs  Vrijednost PWM perioda za postavljanje (jedinica: ns).
 * @returns true/false
 */
pwm.setPeriodByChannel = function (channel, periodNs) {
	return pwmObj.setPeriodByChannel(channel, periodNs)
}
/**
 * Postavljanje PWM radnog ciklusa za određeni kanal
 * @param {number} channel  Broj kanala za zahtjev, podržava kanale 0-7.
 * @param {number} dutyNs Vrijednost PWM radnog ciklusa za postavljanje (vrijeme visokog nivoa, jedinica: ns).
 * @returns true/false
 */
pwm.setDutyByChannel = function (channel, dutyNs) {
	return pwmObj.setDutyByChannel(channel, dutyNs);
}
/**
* Zujanje, potrebno je prvo pozvati request, setPeriodByChannel i enable prije upotrebe.
* @param {object} options Parametri zujanja
* 		@param {number} options.channel  Broj kanala za zahtjev, podržava kanale 0-7, obavezno.
* 		@param {number} options.period  Vrijednost PWM perioda za postavljanje (jedinica: ns), zadano je 366166.
* 		@param {number} options.count Broj zujanja, zadano je 1.
* 		@param {number} options.time Vrijeme zujanja, zadano je 50 milisekundi. Ako želite dugo zujanje, obično je 500 milisekundi.
* 		@param {number} options.interval Interval između dva zujanja, zadano je 50 milisekundi.
* 		@param {number} options.volume Jačina zujanja, zadano je 50.
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
			// Nema intervala nakon posljednjeg zujanja
			os.sleep(interval)
		}
	}
}

export default pwm;
