//build:20240715
// Use this component to read cards, including M1 cards, psam cards, etc.
// Dependent components: dxDriver,dxMap,dxLogger,dxDriver,dxCommon,dxEventBus
import { nfcClass } from './libvbar-p-dxnfc.so'
import dxCommon from './dxCommon.js'
import bus from './dxEventBus.js'
import dxMap from './dxMap.js'
const nfcObj = new nfcClass();
const map = dxMap.get("default")
const nfc = {}

/**
 *  NFC initialize
 * @param {number} useEid Not required, whether to use cloud certificate 0 not used 1 used
 * @param {number} type not required, NFC type 0 MCU 1 Chip
 */
nfc.init = function (useEid = 0, type = 1) {
	let pointer = nfcObj.init(useEid, type)
	if (pointer === undefined || pointer === null) {
		throw new Error("nfc.init: init failed")
	}
	dxCommon.handleId("nfc", 'nfcid', pointer)
}

/**
 * NFC ordinary card registration callback
 */
nfc.cbRegister = function (callback) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.cbRegister(pointer, "nfc_cb", 1, callback)
}

/**
 * NFC PSAM card registration callback
 */
nfc.psamCbRegister = function (callback) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfcPsamCheckVgcardCallback(pointer, callback)
}

/**
 * NFC cancel initialize
 */
nfc.deinit = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	let ret = nfcObj.cbUnregister(pointer, "nfc_cb")
	if (ret === false) {
		throw new Error("nfc.cbUnregister: cbUnregister failed")
	}
	return nfcObj.deinit(pointer)
}

/**
 * NFC card information creation
 * @param {number} cardType Card chip type (original factory definition)
 * @param {ArrayBuffer} cardId card number
 * @param {number} type card type (our own definition)
 * @returns cardInfo(pointer)
 */
nfc.cardInfoCreate = function (cardType, cardId, type) {
	if (!cardType) {
		throw new Error("cardInfoCreate:cardType should not be null or empty")
	}
	if (!cardId) {
		throw new Error("cardInfoCreate:cardId should not be null or empty")
	}
	if (!type) {
		throw new Error("cardInfoCreate:type should not be null or empty")
	}
	return nfcObj.cardInfoCreate(cardType, cardId, type);
}

/**
 * NFC card information destroy
 * @param {pointer} cardInfo card information
 * @returns 
 */
nfc.cardInfoDestory = function (cardInfo) {
	if (!cardInfo) {
		throw new Error("cardInfoDestory:cardInfo should not be null or empty")
	}
	return nfcObj.cardInfoDestory(cardInfo);
}

/**
 * NFC card information copy
 * @param {pointer} cardInfo card information
 * @returns cardInfo(pointer)
 */
nfc.cardInfoCopy = function (cardInfo) {
	if (cardInfo == null) {
		throw new Error("cardInfoCopy:cardInfo should not be null or empty")
	}
	return nfcObj.cardInfoCopy(cardInfo);
}

/**
 * NFC check/determine whether there is a card
 * @returns bool
 */
nfc.isCardIn = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.isCardIn(pointer);
}

/**
 * NFC read M1 card sectors
 * @param {number} taskFlg task flag:
 * 0x00->AUTO tells the scanner that the command can be executed independently and there is no dependency between commands.
 * 0x01->START tells the scanner to start the card operation or the card operation has not yet ended, and there may be dependencies between instructions.
 * 0x02->FINISH tells the scanner that this command is the last command to operate the card and restores the card operating environment to the silent state.
 * @param {number} secNum sector number
 * @param {number} logicBlkNum block number (logical number 0~3 within the sector)
 * @param {number} blkNums block number
 * @param {array} key key, length 6bytes
 * @param {number} keyType key type: A:0x60 B:0x61
 * @returns Array read result undefined:failed
 */
nfc.m1cardReadSector = function (taskFlg, secNum, logicBlkNum, blkNums, key, keyType) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	_validate('m1cardReadSector', taskFlg, secNum, logicBlkNum, blkNums, key, keyType, ' ')
	return nfcObj.m1cardReadSector(pointer, taskFlg, secNum, logicBlkNum, blkNums, key, keyType);
}

/**
 * NFC read M1 card sectors
 * @param {number} taskFlg task flag:
 * 0x00->AUTO tells the scanner that the command can be executed independently and there is no dependency between commands.
 * 0x01->START tells the scanner to start the card operation or the card operation has not yet ended, and there may be dependencies between instructions.
 * 0x02->FINISH tells the scanner that this command is the last command to operate the card and restores the card operating environment to the silent state.
 * @param {number} secNum sector number
 * @param {number} logicBlkNum block number (logical number 0~3 within the sector)
 * @param {number} blkNums block number
 * @param {array} key key, length 6bytes
 * @param {number} keyType key type: A:0x60 B:0x61
 * @param {array} data write data
 * @returns int writing length -1:error
 */
nfc.m1cardWriteSector = function (taskFlg, secNum, logicBlkNum, blkNums, key, keyType, data) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	_validate('m1cardWriteSector', taskFlg, secNum, logicBlkNum, blkNums, key, keyType, data)
	return nfcObj.m1cardWriteSector(pointer, taskFlg, secNum, logicBlkNum, blkNums, key, keyType, data);
}

/**
 * 
 * @param {number} taskFlg task flag:
 * 0x00->AUTO tells the scanner that the command can be executed independently and there is no dependency between commands.
 * 0x01->START tells the scanner to start the card operation or the card operation has not yet ended, and there may be dependencies between instructions.
 * 0x02->FINISH tells the scanner that this command is the last command to operate the card and restores the card operating environment to the silent state.
 * @param {number} blkNums block number
 * @param {array} key key, length 6bytes
 * @param {number} keyType key type: A:0x60 B:0x61
 * @returns Array read result undefined:failed
 */
nfc.m1cardReadBlk = function (taskFlg, blkNum, key, keyType) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	_validate('m1cardReadBlk', taskFlg, 1, 0, blkNum, key, keyType, ' ')
	return nfcObj.m1cardReadBlk(pointer, taskFlg, blkNum, key, keyType);
}

/**
 * 
 * @param {number} taskFlg task flag:
 * 0x00->AUTO tells the scanner that the command can be executed independently and there is no dependency between commands.
 * 0x01->START tells the scanner to start the card operation or the card operation has not yet ended, and there may be dependencies between instructions.
 * 0x02->FINISH tells the scanner that this command is the last command to operate the card and restores the card operating environment to the silent state.
 * @param {number} blkNums block number
 * @param {array} key key, length 6bytes
 * @param {number} keyType key type: A:0x60 B:0x61
 * @param {array} data write data
 * @returns int writing length -1:error
 */
nfc.m1cardWriteBlk = function (taskFlg, blkNum, key, keyType, data) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	_validate('m1cardWriteBlk', taskFlg, 1, 0, blkNum, key, keyType, data)
	return nfcObj.m1cardWriteBlk(pointer, taskFlg, blkNum, key, keyType, data);
}

/**
 * Write values ​​to the registers of the nfc module
 * @param {number} taskFlg task flag:
 * 0x00->AUTO tells the scanner that the command can be executed independently and there is no dependency between commands.
 * 0x01->START tells the scanner to start the card operation or the card operation has not yet ended, and there may be dependencies between instructions.
 * 0x02->FINISH tells the scanner that this command is the last command to operate the card and restores the card operating environment to the silent state.
 * @param {number} regAddr The register address to be written (please refer to the corresponding manual if necessary)
 * @param {number} val value to be written
 * @returns true/false
 */
nfc.nfcRegWrite = function (taskFlg, regAddr, val) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfcRegWrite(pointer, taskFlg, regAddr, val);
}

/**
 * Read the value from the register of the nfc module
 * @param {number} taskFlg task flag:
 * 0x00->AUTO tells the scanner that the command can be executed independently and there is no dependency between commands.
 * 0x01->START tells the scanner to start the card operation or the card operation has not yet ended, and there may be dependencies between instructions.
 * 0x02->FINISH tells the scanner that this command is the last command to operate the card and restores the card operating environment to the silent state.
 * @param {number} regAddr The register address to be read (please refer to the corresponding manual if necessary)

 * @returns {number} read value/null
 */
nfc.nfcRegRead = function (taskFlg, regAddr) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfcRegRead(pointer, taskFlg, regAddr);
}

/**
 * ATS detection
 */
nfc.nfc_iso14443_type_a_get_ats = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfc_iso14443_type_a_get_ats(pointer)
}

/**
 * Card reactivation
 * @returns {boolean} true/false
 */
nfc.iso14443TypeaReactivate = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.iso14443TypeaReactivate(pointer)
}

/**
 * 
 * @param {number} taskFlg task flag:
 * 0x00->AUTO tells the scanner that the command can be executed independently and there is no dependency between commands.
 * 0x01->START tells the scanner to start the card operation or the card operation has not yet ended, and there may be dependencies between instructions.
 * 0x02->FINISH tells the scanner that this command is the last command to operate the card and restores the card operating environment to the silent state.
 * @param {ArrayBuffer} buffer data to send
 * @param {number} bufferLen The length of data to be sent
 * @returns buffer
 */
nfc.iso14443Apdu = function (taskFlg, buffer, bufferLen) {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.iso14443Apdu(pointer, taskFlg, buffer, bufferLen);
}

/**
 * PSAM card power off
 */
nfc.nfcPsamPowerDown = function () {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.nfcPsamPowerDown(pointer);
}

/**
 * NFC changes status/state
 */
nfc.nfcPsamChangeBaud = function () {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.nfcPsamChangeBaud(pointer);
}

/**
 * PSAM card reset
 */
nfc.nfcPsamCardReset = function (force) {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.nfcPsamCardReset(pointer, force);
}

/**
 * sendPSAM APDU command
 */
nfc.nfcPsamCardApdu = function (buffer) {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.nfcPsamCardApdu(pointer, buffer);
}

/**
 * EID update cloud certificate configuration/config
 * @param {object} eidConfig cloud certificate configuration/config
 * @param {string} eidConfig.appid The appid assigned by the platform to the application
 * @param {number} eidConfig.read_len; // Single read card length, default 0x80
 * @param {number} eidConfig.declevel; // Whether to read photos, 1 means not reading, 2 means reading
 * @param {number} eidConfig.loglevel; //Log level, supports 0, 1, 2
 * @param {number} eidConfig.model; // Whether to directly find out the information 0 yes 1 no (that is, 0 means returning to the original route and returning identity information, 1 is forwarding and returning reqid)
 * @param {number} eidConfig.type; // Card type: 0 ID card 1 Electronic ID card
 * @param {number} eidConfig.pic_type; // Photo decoding data type 0 wlt 1 jpg
 * @param {number} eidConfig.envCode; // Environment identification code
 * @param {string} eidConfig.sn[128]; // device serial number
 * @param {string} eidConfig.device_model[128]; // device model
 * @param {number} eidConfig.info_type; // Information return type, 0 identity information structure, 1 original data char
 */
nfc.eidUpdateConfig = function (eidConfig) {
	if (eidConfig == null) {
		throw new Error("eidUpdateConfig:eidConfig should not be null or empty")
	}
	return nfcObj.eidUpdateConfig(eidConfig);
}

/**
 * Read NTAG version number
 *  	@param {number} 		hdl               	nfchandle
 * 	@returns {ArrayBuffer} buffer
 */
nfc.nfcNtagReadVersion = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfcNtagReadVersion(pointer);
}

/**
 * Read NTAG page content. Fixed reading of 4 pages totaling 16 bytes.
 *  	@param {number} 		hdl               	nfchandle
 * @param {number} pageNum starting page address:
 * Read four pages at a time
 * If the address (Addr) is 04h, return pages 04h, 05h, 06h, 07hcontent
 * 	@returns {ArrayBuffer} buffer
 */
nfc.nfcNtagReadPage = function (pageNum) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	if (pageNum == null) {
		throw new Error("nfcNtagReadPage:pageNum should not be null or empty")
	}
	return nfcObj.nfcNtagReadPage(pointer, pageNum);
}

/**
 * Read NTAG multi-page content. Read the buffer of data. The minimum number is the number of pages*4; the length of the data to be read is the number of pages*4.
 *  	@param {number} 		hdl               	nfchandle
* @param {number} start_addr start page address
 * @param {number} end_addr end page address
 * 	@returns {ArrayBuffer} buffer
 */
nfc.nfcNtagFastReadPage = function (start_page, end_page) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	if (start_page == null) {
		throw new Error("nfcNtagFastReadPage:start_page should not be null or empty")
	}
	if (end_page == null) {
		throw new Error("nfcNtagFastReadPage:end_page should not be null or empty")
	}
	return nfcObj.nfcNtagFastReadPage(pointer, start_page, end_page);
}

/**
 * Write NTAG page content
 *  	@param {number} 		hdl               	nfchandle
 * @param {number} pageNum The page number written: valid Addrparameter
 * For NTAG213, page addresses 02h to 2Ch
 * For NTAG215, page addresses 02h to 86h
 * For NTAG216, page addresses 02h to E6h
 * @param {ArrayBuffer} pageData Write the content of the page: four bytes
 * 	@returns {boolean} ture/false
 */
nfc.nfcNtagWritePage = function (pageNum, pageData) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	if (pageNum == null) {
		throw new Error("nfcNtagWritePage:pageNum should not be null or empty")
	}
	if (!pageData) {
		throw new Error("nfcNtagWritePage:pageData should not be null or empty")
	}
	return nfcObj.nfcNtagWritePage(pointer, pageNum, pageData);
}

/**
 * check/determinenfcmessage queue is empty
 * @returns bool
 */
nfc.msgIsEmpty = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.msgIsEmpty(pointer)
}

/**
 * Read data from nfcmessage queue
 * @returns jsonmessage object
 */
nfc.msgReceive = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	let msg = nfcObj.msgReceive(pointer)
	return JSON.parse(msg);
}

function _validate(fun, taskFlg, secNum, logicBlkNum, blkNums, key, keyType, data) {
	if (![0x00, 0x01, 0x02].includes(taskFlg)) {
		throw new Error(fun, ":taskFlg error")
	}
	if (!(secNum >= 0)) {
		throw new Error(fun, ":secNum error")
	}
	if (logicBlkNum == null || logicBlkNum == undefined || logicBlkNum < 0 || logicBlkNum > 3) {
		throw new Error(fun, ":logicBlkNum error")
	}
	if (blkNums == null || blkNums == undefined || blkNums < 0 || blkNums > 59) {
		throw new Error(fun, ":blkNums error")
	}
	if (key == null || key === undefined || key.length < 0) {
		throw new Error(fun, ":key error")
	}
	if (![0x60, 0x61].includes(keyType)) {
		throw new Error(fun, ":keyType error")
	}
	if (data === null || data === undefined) {
		throw new Error(fun, ":data error")
	}
}

nfc.RECEIVE_MSG = '__nfc__MsgReceive'

/**
 * Simplify the use of NFC components. There is no need to poll/polling to get/obtainnetworkstatus/state. The status/state of the network will be sent out through eventcentersend.
 * run will only be executed once, and the basic network configuration/config cannot be modified after execution.
 * If you need to get/obtain card swiping data in real time, you can subscribe to the event of eventCenter. The topic of the event is nfc.CARD, and the content of the event is similar to
 * {id:'card id',card_type:card chip type,id_len:card number length,type:card type,timestamp:'card swiping timestamp',monotonic_timestamp:'relative boot time'}
 * @param {*} options 
 * @param {boolean} options.m1 Not required, normal card callback switch
 * @param {boolean} options.psam not required, psam card callback switch
 */
nfc.run = function (options) {
	if (options === undefined || options.length === 0) {
		throw new Error("dxnfc.run:'options' parameter should not be null or empty")
	}
	let init = map.get("__nfc__run_init")
	if (!init) {//确保只初始化一次
		map.put("__nfc__run_init", options)
		bus.newWorker("__nfc", '/app/code/dxmodules/nfcWorker.js')
	}
}

/**
 * If nfc has a separate thread, you can use runfunction directly, and a thread will be automatically started.
 * If you want to join other existing threads, you can use the following encapsulated function
 */
nfc.worker = {
	// before the while loop
	beforeLoop: function (options) {
		nfc.init(options.useEid)
		// PSAM and normal card callbacks
		if (options.m1) {
			nfc.cbRegister()
		}
		if (options.psam) {
			nfc.psamCbRegister()
		}
	},
	// in while loop
	loop: function () {
		if (!nfc.msgIsEmpty()) {
			let res = nfc.msgReceive();
			bus.fire(nfc.RECEIVE_MSG, res)
		}
	}
}
export default nfc;
