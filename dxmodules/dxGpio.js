// build : 20240524
// GPIO izlaz, može proizvesti samo 2 stanja: visoki nivo/niski nivo. Ako je spojen na relej, visoki nivo znači uključeno, a niski nivo isključeno.
import { gpioClass } from './libvbar-b-dxgpio.so'
const gpioObj = new gpioClass();
const gpio = {}

/**
 * Inicijalizacija, potrebno je izvršiti samo jednom.
 * @returns true/false
 */
gpio.init = function () {
	return gpioObj.init();
}

/**
 * Oslobađanje GPIO resursa
 * @returns true/false
 */
gpio.deinit = function () {
	return gpioObj.exit();
}

/**
 * Zahtjev za GPIO, svaki GPIO treba zatražiti samo jednom.
 * @param {number} gpio_ Identifikator GPIO-a, različiti uređaji imaju različite identifikatore, obavezno.
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
 * Oslobađanje određenog GPIO-a
 * @param {number} gpio_ Identifikator GPIO-a, različiti uređaji imaju različite identifikatore, obavezno.
 * @returns true/false
 */
gpio.free = function (gpio_) {
	return gpioObj.free(gpio_);
}

/**
 * Postavljanje izlaza određenog GPIO-a na visoki/niski nivo.
 * @param {number} gpio_ Identifikator GPIO-a, različiti uređaji imaju različite identifikatore, obavezno.
 * @param {number} value Može biti samo 1 ili 0. 1 predstavlja visoki nivo, 0 predstavlja niski nivo. Zadano je visoki nivo, obavezno.
 * @returns true/false
 */
gpio.setValue = function (gpio_, value) {
	return gpioObj.setValue(gpio_, value);
}

/**
 * Dobijanje trenutnog izlaza određenog GPIO-a: visoki/niski nivo.
 * @param {number} gpio_ Identifikator GPIO-a, različiti uređaji imaju različite identifikatore, obavezno.
 * @returns 1 ili 0. 1 predstavlja visoki nivo, 0 predstavlja niski nivo.
 */
gpio.getValue = function (gpio_) {
	return gpioObj.getValue(gpio_);
}

/**
 * Zahtjev za GPIO, svaki GPIO treba zatražiti samo jednom.
 * @param {number} gpio_ Identifikator GPIO-a, različiti uređaji imaju različite identifikatore, obavezno.
 * @returns true/false
 */
gpio.requestGpio = function (gpio_) {
	let res = gpioObj.request(gpio_)
	return res
}

/**
 * Postavljanje funkcije GPIO-a
 * @param {number} gpio_ Identifikator GPIO-a, različiti uređaji imaju različite identifikatore, obavezno.
 * @param {number} func Atribut funkcije GPIO-a, različiti uređaji imaju različite atribute funkcija, obavezno.
 * @returns true/false
 */
gpio.setFuncGpio = function (gpio_, func) {
	let res = gpioObj.setFunc(gpio_, func)
	return res
}

/**
 * Postavljanje stanja pull-up otpornika za određeni GPIO.
 * @param {number} gpio_ Identifikator GPIO-a, različiti uređaji imaju različite identifikatore, obavezno.
 * @param {number} state Stanje pull-up otpornika, obavezno.
 * @returns true/false
 */
gpio.setPullState = function (gpio_, state) {
	return gpioObj.setPullState(gpio_, state);
}

/**
 * Dobijanje stanja pull-up otpornika za određeni GPIO.
 * @param {number} gpio_ Identifikator GPIO-a, različiti uređaji imaju različite identifikatore, obavezno.
 * @returns Stanje pull-up otpornika (int)
 */
gpio.getPullState = function (gpio_) {
	return gpioObj.getPullState(gpio_);
}
/**
 * Postavljanje jačine drajvera za određeni GPIO.
 * @param {number} gpio_ Identifikator GPIO-a, različiti uređaji imaju različite identifikatore, obavezno.
 * @param {number} strength Jačina, obavezno.
 * @returns true/false
 */
gpio.setDriveStrength = function (gpio_, strength) {
	return gpioObj.setDriveStrength(gpio_, strength);
}

/**
 * Dobijanje jačine drajvera za određeni GPIO.
 * @param {number} gpio_ Identifikator GPIO-a, različiti uređaji imaju različite identifikatore, obavezno.
 * @returns Jačina (int)
 */
gpio.getDriveStrength = function (gpio_) {
	return gpioObj.getDriveStrength(gpio_);
}

export default gpio;
