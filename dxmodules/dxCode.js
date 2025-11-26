//build: 20240715
//Dependent components: dxDriver,dxMap,dxEventBus,dxLogger,dxCommon,dxQueue
//For identifying and parsing QR code images
import { codeClass } from './libvbar-m-dxcode.so'
import dxMap from './dxMap.js'
import * as os from "os"
import dxCommon from './dxCommon.js';
import bus from './dxEventBus.js'
import log from './dxLogger.js'
const code = {}
const map = dxMap.get('default')
const codeObj = new codeClass();

/**
 * Image capture module initialization
 * @param {object} options Configuration parameters, most can use default values
 *      @param {string} options.path                Required, image capture device path, different for each device, for example, the value corresponding to DW200 is '/dev/video11', and the value corresponding to M500 is '/dev/video0'
 *      @param {number} options.width               Optional, image width, default is 0
 *      @param {number} options.height              Optional, image height, default is 0
 *      @param {number} options.widthbytes          Optional, bytes per pixel GREY: 1, YUV: 2, DW200 default is 1 VF203 default is 2
 *      @param {number} options.pixel_format        Optional, pixel format, default is 1497715271 which means V4L2_PIX_FMT_GREY
 *      @param {number} options.max_channels        Optional, maximum number of supported synchronous output channels, default is 3
 *      @param {number} options.rotation            Optional, rotation angle, default is 90
 *      @param {number} options.frame_num           Optional, frame number, default is 3
 *      @param {string} options.capturerDogId       Optional, camera watchdog handle */
code.capturerInit = function (options) {
    if (options.path === undefined || options.path === null || options.path.length < 1) {
        throw new Error("dxCode.init: 'path' parameter should not be null or empty")
    }
    let pointer = codeObj.capturerInit(options);
    if (!pointer) {
        throw new Error("dxCode.init: init failed")
    }
    os.sleep(100)
    let capturerDogPointer = dxCommon.handleId("watchdog", options.capturerDogId)
    codeObj.capturerRegisterCallback(pointer, "decoderCapturerImage", capturerDogPointer)
    dxCommon.handleId("code", "capturerid", pointer)
}


/**
 * Graphics decoding module initialization
 * @param {object} options Configuration parameters, most can use default values
 *      @param {string} options.name         Required, custom decoder name, fill in as you like
 *      @param {number} options.width        Required, image width, different for different devices, for example, DW200 is 800
 *      @param {number} options.height       Required, image height, different for different devices, for example, DW200 is 600
 *      @param {number} options.widthbytes   Optional, bytes per pixel GREY : 1, YUV : 2, default is 1
 *      @param {object} options.config       Optional, configuration items, default is {}
 *      @param {number} options.max_channels Optional, maximum number of supported synchronous output channels, default is 10 */
code.decoderInit = function (options) {
    if (options.name === null || options.name.length < 1) {
        throw new Error("dxCode.init: 'name' parameter should not be null or empty")
    }
    if (options.width === undefined || options.width === null) {
        throw new Error("dxCode.init: 'width' parameter should not be null")
    }
    if (options.height === undefined || options.height === null) {
        throw new Error("dxCode.init: 'height' parameter should not be null")
    }
    _setDefaultOptions(options, 'config', {});
    _setDefaultOptions(options, 'widthbytes', 1);
    _setDefaultOptions(options, 'maxChannels', 10);
    let pointer = codeObj.decoderInit(options.name, options.config, options.width, options.widthbytes, options.height, options.maxChannels);
    if (!pointer) {
        throw new Error("dxCode.init: init failed")
    }
    os.sleep(100)
    codeObj.decoderCbRegister(pointer, "decoderOut")
    dxCommon.handleId("code", "decoderid", pointer)
    return pointer
}


/**
 * Graphics decoding module configuration update
 * @param {object} options Configuration parameters, most can use default values
 * @param {string} options.decoder         Optional, decoding engine type
 * @param {number} options.deType          Optional, code type
 * @param {number} options.sMode           Optional, filtering strategy based on code content                                                                                                                                                                                  │
 *         Default s_mode = 0                                                                                                                                                                                     │
 *         0 : Interval mode for the same code                                                                                                                                                                              │
 *         1 : Single mode                                                                                                                                                                                        │
 *         2 : Interval mode for different codes
 * @param {number} options.interval        Optional, interval time in interval mode
 * @param {object} options.searchTimeout   Optional, timeout for retrieving code
 * @param {object} options.decoderTimeout  Optional, timeout for decoding
 * @param {number} options.searchMode      Optional, strategy corresponding to the decoding engine
 * @param {object} options.decoderMode     Optional, decoding engine feature configuration
 * @param {number} options.qrMode          Optional, parameter configuration of qr code, not open to the public by default                                                                                                                                                                        │
 *         Default qr_mode = 15                                                                                                                                                                                   │
 *         bit0 : Support qr code with smaller image proportion                                                                                                                                                                       │
 *         bit1 : Support qr code whose locator is not square, which can be disabled by default                                                                                                                                                         │
 *         bit2 : qr code recognition enhancement, for medical, abnormal, wire drawing scenarios, which can be disabled in ordinary scenarios                                                                                                                                       │
 *         bit3 : Dotted qr code enhancement (time-consuming operation), which can be disabled in ordinary scenarios                                                                                                                                                     │
 *         bit4 : Support qr code without quiet zone (time-consuming operation), disabled by default
 * @param {object} options.decoderDelay    Optional, delay between two decodings */
code.decoderUpdateConfig = function (options) {
    if (options === null) {
        throw new Error("dxCode.decoderUpdateConfig: 'options' parameter should not be null or empty")
    }
    let pointer = dxCommon.handleId("code", "decoderid")
    codeObj.decoderUpdateConfig(pointer, options)
    return pointer
}

/**
 * Decoder registers special code callback
 */
code.decodeSpecialCBRegister = function () {
    let pointer = dxCommon.handleId("code", "decoderid")
    let cbType = typeof codeObj.decodeSpecialCBRegister
    // This method was added later to determine that the method does not exist in the library (if it does not exist, it does not need to be called, and related operations have been done in the library)
    if (cbType === "function") {
        return codeObj.decodeSpecialCBRegister(pointer)
    }
}

/**
 * @param {object} options Configuration parameters, most can use default values
 * @param {number} options.method Optional, isp main func
 * @param {number} options.sub_method Optional, isp sub func
 * @param {number} options.target_luminance Optional, image target brightness value
 * @param {number} options.target_percentile Optional, target brightness percentage
 * @param {number} options.sample_gap Optional, sampling interval during calculation
 * @param {number} options.min_exp Optional, minimum exposure value
 * @param {number} options.max_exp Optional, maximum exposure value
 * @param {number} options.min_gain Optional, minimum gain value
 * @param {number} options.max_gain Optional, maximum gain value
 * @returns true/false
 */
code.capturerUpdateIspConfig = function (options) {
    if (options === null) {
        throw new Error("dxCode.capturerUpdateIspConfig: 'options' parameter should not be null or empty")
    }
    let pointer = dxCommon.handleId("code", "capturerid")
    return codeObj.capturerUpdateIspConfig(pointer, options)
}

/**
 * Enable image capture listening thread
 * @param {string} id1 Required, serial port id
 * @param {number} timeout Optional, timeout in milliseconds, image capture will automatically stop if no image capture command is received within the specified time
 * @returns undefined
 */
code.startGetImageListen = function (id1, timeout = 1000) {
    if (id1 === null || id1 === undefined) {
        throw new Error("dxCode.startGetImageListen: 'id1' parameter should not be null or empty")
    }
    return codeObj.startGetImageListen(dxCommon.handleId("uart", id1), dxCommon.handleId("code", "capturerid"), timeout)
}

/**
 * Stop image capture listening thread, only listen for micro-light protocol 5c/5d commands, sending any other commands midway will stop the image capture thread
 * @returns undefined
 */
code.stopGetImageListen = function () {
    return codeObj.stopGetImageListen()
}

/**
 * Get image capture status
 * @returns true/false
 */
code.getImageListenStatus = function () {
    return codeObj.getImageListenStatus()
}

/**
 * Check if the decoder message queue is empty
 */
code.msgIsEmpty = function () {
    let pointer = dxCommon.handleId("code", "decoderid")
    return codeObj.msgIsEmpty(pointer)
}
/**
 * Read data from the decoder message queue
 */
code.msgReceive = function () {
    let pointer = dxCommon.handleId("code", "decoderid")
    return codeObj.msgReceive(pointer)
}

function _setDefaultOptions(options, key, defaultValue) {
    if (options[key] === undefined || options[key] === null) {
        options[key] = defaultValue;
    }
}

/**
 * Check if two Arraybuffer values are the same
 * @param {*} buffer1 
 * @param {*} buffer2 
 * @returns true/false
 */
function bufferIsEqual(buffer1, buffer2) {
    if (!buffer1 || !buffer2 || buffer1.byteLength !== buffer2.byteLength) {
        return false;
    }

    let view1 = new Uint8Array(buffer1);
    let view2 = new Uint8Array(buffer2);

    for (let i = 0; i < view1.length; i++) {
        if (view1[i] !== view2[i]) {
            return false;
        }
    }

    return true;
}

code.RECEIVE_MSG = '__code__MsgReceive'

/**
 * Used to simplify the use of the code component, encapsulating the code in this worker. Users only need to subscribe to eventbus events to listen.
 * @param {object} options 
 *      @param {object} options.capturer  capturer component parameters, refer to capturerInit, required
 *      @param {object} options.decoder  decoder component parameters, refer to decoderInit, required
 *      @param {number} options.mode  Default is interval mode, which means that repeated QR codes will be reported repeatedly, and the reporting interval is interval. If it is 1, it means single mode, and repeated QR codes will only be reported once.
 *      @param {number} options.interval  Scan interval, only meaningful when mode is 0, default is 0.6 seconds
 */

code.run = function (options) {
    if (!options || !options.capturer || !options.decoder) {
        throw new Error("dxcode.run:'options.capturer' and 'options.decoder' parameter should not be null or empty")
    }
    let init = map.get("__code__run_init")
    if (!init) {//Ensure initialization only once
        map.put("__code__run_init", options)
        bus.newWorker("__code", '/app/code/dxmodules/codeWorker.js')
    }
}

/**
 * If the capturer is a separate thread, you can directly use the run function, which will automatically start a thread.
 * If you want to add it to other existing threads, you can use the encapsulated functions below.
 */
code.worker = {
    //Before the while loop
    beforeLoop: function (capturer, decoder) {
        code.capturerInit(capturer)
        code.worker.pointer = code.decoderInit(decoder)
        code.decodeSpecialCBRegister()
    },
    //In the while loop
    loop: function (mode = 0, interval = 600) {
        let pointer = code.worker.pointer
        if (!pointer) {
            pointer = dxCommon.handleId("code", "decoderid")
        }
        if (!codeObj.msgIsEmpty(pointer)) {
            let res = codeObj.msgReceive(pointer)
            if (res != undefined && res != null && res.byteLength > 0) {
                const now = new Date().getTime()
                if (mode == 1) {//Single mode
                    if (!bufferIsEqual(res, code.worker.singleOldContent)) {
                        bus.fire(code.RECEIVE_MSG, res)
                        code.worker.lastTimestamp = now
                        code.worker.singleOldContent = res
                    }
                } else {//Interval mode 
                    let _interval = Math.max(300, interval)//Minimum is 300 milliseconds
                    if ((now - code.worker.lastTimestamp) > _interval || !bufferIsEqual(res, code.worker.intervalOldContent)) {//Do not send duplicate data within 1 second
                        bus.fire(code.RECEIVE_MSG, res)
                        code.worker.lastTimestamp = now
                        code.worker.intervalOldContent = res
                    }
                }
            }
        }
    }
}

export default code;