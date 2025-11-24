//build 20240425
//Watchdog komponenta, koristi se za nadzor da li je aplikacija zaglavljena. Postavlja se vremensko ograničenje, i ako se u tom vremenu ne "nahrani pas", automatski će se pokrenuti ponovno pokretanje uređaja.
//Napomena: Prije korištenja watchdog-a možda će biti potrebno prvo inicijalizirati GPIO.
//Zavisne komponente: dxDriver, dxLogger, dxCommon, dxMap, dxGpio
import { watchdogClass } from './libvbar-b-dxwatchdog.so'
import dxMap from './dxMap.js'
import logger from './dxLogger.js'
import dxCommon from './dxCommon.js'

const map = dxMap.get("___watchdog")
const watchdogObj = new watchdogClass();

const watchdog = {}
watchdog.last = new Date().getTime()
/**
 * Otvaranje watchdog uređaja
 * @param {number} type Obavezno
 * @param {string} id ID rukovatelja, nije obavezno (ako se inicijalizira više instanci, potrebno je unijeti jedinstveni ID)
 */
watchdog.open = function (type, id) {
	let pointer = watchdogObj.open(type)
	if (pointer === undefined || pointer === null) {
		throw new Error("watchdog.open: open failed")
	}
	dxCommon.handleId("watchdog", id, pointer)
}
/**
 * Kontrola prekidača određenog kanala
 * @param {number} chan ID kanala, obavezno
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
watchdog.enable = function (chan, id) {
	let pointer = dxCommon.handleId("watchdog", id)
	return watchdogObj.enable(pointer, chan)
}
/**
 * Pokretanje glavnog tajmera watchdog-a
 * @param {*} timeout Obavezno
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
watchdog.start = function (timeout, id) {
	let pointer = dxCommon.handleId("watchdog", id)
	return watchdogObj.start(pointer, timeout)
}
/**
 * Provjera da li je došlo do resetovanja napajanja, da li je watchdog već pokrenut
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
watchdog.isPoweron = function (id) {
	let pointer = dxCommon.handleId("watchdog", id)
	return watchdogObj.isPoweron(pointer)
}
/**
 * "Hranjenje psa" za određeni kanal
 * @param {*} chan ID kanala, obavezno
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
watchdog.restart = function (chan, id) {
	let pointer = dxCommon.handleId("watchdog", id)
	return watchdogObj.restart(pointer, chan)
}
/**
 * Isključivanje glavnog tajmera watchdog-a
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
watchdog.stop = function (id) {
	let pointer = dxCommon.handleId("watchdog", id)
	return watchdogObj.stop(pointer)
}
/**
 * Isključivanje watchdog uređaja
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
watchdog.close = function (id) {
	let pointer = dxCommon.handleId("watchdog", id)
	return watchdogObj.close(pointer)
}
/**
 * Periodično provjerava stanje "hranjenja psa" za svaku nit. Ako bilo koja nit nije "nahranila psa", 'restart' se neće pokrenuti.
 * @param {number} chan ID kanala, obavezno
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 */
watchdog.loop = function (chan, id) {
	const now = new Date().getTime()
	const minus = now - watchdog.last
	if (minus > 3000 || minus < 0) {//Provjerava se svake 3 sekunde, ili ako je manje od 0, znači da je vrijeme promijenjeno unazad
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
 * "Hranjenje psa" od strane različitih niti
 * @param {string} flag Identifikator niti, obavezno i ne smije biti prazno
 * @param {number} timeout Koliko dugo nit može da ne "hrani psa" (u sekundama), zadano je 10 sekundi
 */
watchdog.feed = function (flag, timeout = 10) {
	if (!flag || flag.length <= 0) {
		return
	}
	map.put(flag, { now: new Date().getTime(), timeout: timeout })
}

export default watchdog;
