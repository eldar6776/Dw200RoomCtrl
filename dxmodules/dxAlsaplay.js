//build: 20240524 
//Komponenta za reprodukciju zvuka, podržava samo .wav datoteke
//Zavisne komponente: dxDriver, dxCommon
import { alsaplayClass } from './libvbar-m-dxalsaplay.so'
import dxCommon from './dxCommon.js'
const alsaplayObj = new alsaplayClass();
const alsaplay = {}

/**
 * alsaplay inicijalizacija
 * @param {string} id ID rukovatelja, nije obavezno (ako se inicijalizira više instanci, potrebno je unijeti jedinstveni ID)
 * @param {number} volume Jačina zvuka, nije obavezno
 * @param {number} card Kartica, nije obavezno
 * @param {number} device Uređaj, nije obavezno
 * @param {number} mixer_ctl_num mixer_ctl_num, nije obavezno
 * @returns ID rukovatelja
 */
alsaplay.init = function (id, volume, card, device, mixer_ctl_num) {
	if (volume === undefined || volume === null) {
		volume = 30
	}
	if (card === undefined || card === null) {
		card = 0
	}
	if (device === undefined || device === null) {
		device = 0
	}
	if (mixer_ctl_num === undefined || mixer_ctl_num === null) {
		mixer_ctl_num = 3
	}
	let pointer = alsaplayObj.alsaplayInit(volume, card, device, mixer_ctl_num)
	if (pointer === undefined || pointer === null) {
		throw new Error("alsaplay.init: init failed")
	}

	return dxCommon.handleId("alsaplay", id, pointer)
}

/**
 * alsaplay deinicijalizacija
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
alsaplay.deinit = function (id) {
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplayDeinit(pointer)
}

/**
 * Reprodukcija muzičke datoteke
 * @param {string} path Apsolutna putanja do .wav datoteke. Putanja počinje sa '/app/code/', obično se nalazi u 'resource' direktoriju projekta (na istom nivou kao i 'src'), obavezno.
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
alsaplay.play = function (path, id) {
	if (!path) {
		throw new Error("alsaplay.play: 'path' parameter should not be null")
	}
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplayWav(pointer, path)
}

/**
 * Prekid trenutno reproduciranog zvuka
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
alsaplay.interrupt = function (id) {
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplayPlayingInterrupt(pointer)
}

/**
 * Brisanje keša za reprodukciju
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
alsaplay.clearPlayCache = function (id) {
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplayClearPlayCache(pointer)
}

/**
 * Dobijanje jačine zvuka
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns Vraća numeričku vrijednost jačine zvuka, koja neće preći opseg jačine zvuka
 */
alsaplay.getVolume = function (id) {
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplayGetVolume(pointer)
}

/**
 * Postavljanje jačine zvuka. Ako je postavljena vrijednost prevelika ili premala, bit će postavljena na maksimalnu ili minimalnu vrijednost opsega jačine zvuka.
 * @param {number} volume Obavezno
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns 
 */
alsaplay.setVolume = function (volume, id) {
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplaySetVolume(pointer, volume)
}
/**
 * Dobijanje opsega jačine zvuka
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns Format {"min":0,"max":6}
 */
alsaplay.getVolumeRange = function (id) {
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplayGetVolumeRange(pointer)
}

export default alsaplay;
