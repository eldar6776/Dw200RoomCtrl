//build: 20240524 
// Audio playback component, only supports wav files
// Dependent components: dxDriver, dxCommon
import { alsaplayClass } from './libvbar-m-dxalsaplay.so'
import dxCommon from './dxCommon.js'
const alsaplayObj = new alsaplayClass();
const alsaplay = {}

/**
 * alsaplay initialization
 * @param {string} id Handle id, optional (if multiple instances are initialized, a unique id needs to be passed in)
 * @param {number} volume Volume, optional
 * @param {number} card optional
 * @param {number} device optional
 * @param {number} mixer_ctl_num optional
 * @returns handle id
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
 * alsaplay deinitialization
 * @param {string} id Handle id, optional (needs to be consistent with the id in init)
 * @returns true/false
 */
alsaplay.deinit = function (id) {
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplayDeinit(pointer)
}

/**
 * Play music file
 * @param {string} path The absolute path of the wav file, the path starts with '/app/code/', usually placed in the resource directory of the project (same level as src), required
 * @param {string} id Handle id, optional (needs to be consistent with the id in init)
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
 * Interrupt the currently playing audio
 * @param {string} id Handle id, optional (needs to be consistent with the id in init)
 * @returns true/false
 */
alsaplay.interrupt = function (id) {
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplayPlayingInterrupt(pointer)
}

/**
 * Clear playback cache
 * @param {string} id Handle id, optional (needs to be consistent with the id in init)
 * @returns true/false
 */
alsaplay.clearPlayCache = function (id) {
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplayClearPlayCache(pointer)
}

/**
 * Get volume
 * @param {string} id Handle id, optional (needs to be consistent with the id in init)
 * @returns Returns the volume of numeric type, which will not exceed the volume range
 */
alsaplay.getVolume = function (id) {
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplayGetVolume(pointer)
}

/**
 * Set volume. If it is set too high or too low, it will default to the maximum or minimum value of the volume range.
 * @param {number} volume required
 * @param {string} id Handle id, optional (needs to be consistent with the id in init)
 * @returns 
 */
alsaplay.setVolume = function (volume, id) {
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplaySetVolume(pointer, volume)
}
/**
 * Get volume range
 * @param {string} id Handle id, optional (needs to be consistent with the id in init)
 * @returns format {"min":0,"max":6}
 */
alsaplay.getVolumeRange = function (id) {
	let pointer = dxCommon.handleId("alsaplay", id)
	return alsaplayObj.alsaplayGetVolumeRange(pointer)
}

export default alsaplay;
