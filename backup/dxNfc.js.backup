//build:20240715
//通过这个组件来读取卡，包括M1卡，psam卡之类的
//依赖组件: dxDriver,dxMap,dxLogger,dxDriver,dxCommon,dxEventBus
import { nfcClass } from './libvbar-p-dxnfc.so'
import dxCommon from './dxCommon.js'
import bus from './dxEventBus.js'
import dxMap from './dxMap.js'
const nfcObj = new nfcClass();
const map = dxMap.get("default")
const nfc = {}

/**
 * NFC 初始化
 * @param {number} useEid 非必填，是否使用云证 0不使用 1使用
 * @param {number} type 非必填，NFC类型 0 MCU 1 Chip
 */
nfc.init = function (useEid = 0, type = 1) {
	let pointer = nfcObj.init(useEid, type)
	if (pointer === undefined || pointer === null) {
		throw new Error("nfc.init: init failed")
	}
	dxCommon.handleId("nfc", 'nfcid', pointer)
}

/**
 * NFC 普通卡注册回调
 */
nfc.cbRegister = function (callback) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.cbRegister(pointer, "nfc_cb", 1, callback)
}

/**
 * NFC PSAM卡注册回调
 */
nfc.psamCbRegister = function (callback) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfcPsamCheckVgcardCallback(pointer, callback)
}

/**
 * NFC 取消初始化
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
 * NFC 卡信息创建
 * @param {number} cardType 卡芯片类型(原厂定义)
 * @param {ArrayBuffer} cardId 卡号
 * @param {number} type 卡类型(我们自己定义的)
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
 * NFC 卡信息销毁
 * @param {pointer} cardInfo 卡信息
 * @returns 
 */
nfc.cardInfoDestory = function (cardInfo) {
	if (!cardInfo) {
		throw new Error("cardInfoDestory:cardInfo should not be null or empty")
	}
	return nfcObj.cardInfoDestory(cardInfo);
}

/**
 * NFC 卡信息复制
 * @param {pointer} cardInfo 卡信息
 * @returns cardInfo(pointer)
 */
nfc.cardInfoCopy = function (cardInfo) {
	if (cardInfo == null) {
		throw new Error("cardInfoCopy:cardInfo should not be null or empty")
	}
	return nfcObj.cardInfoCopy(cardInfo);
}

/**
 * NFC 判断是否有卡
 * @returns bool
 */
nfc.isCardIn = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.isCardIn(pointer);
}

/**
 * NFC 读M1卡扇区
 * @param {number} taskFlg 任务标志：
 *                    0x00->AUTO 告知扫码器该指令可单独执行，无指令间的依赖关系。
 *                    0x01->START 告知扫码器开始对卡操作或对卡操作尚未结束，且指令间可能存在依赖关系。
 *                    0x02->FINISH 告知扫码器本条指令是操作卡的最后一条指令，将卡片操作环境恢复到默态。
 * @param {number} secNum 扇区号
 * @param {number} logicBlkNum 块号（在扇区内的逻辑号0~3)
 * @param {number} blkNums 块数
 * @param {array} key 密钥, 长度6bytes
 * @param {number} keyType 密钥类型: A:0x60 B:0x61
 * @returns Array 读取结果 undefined:失败
 */
nfc.m1cardReadSector = function (taskFlg, secNum, logicBlkNum, blkNums, key, keyType) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	_validate('m1cardReadSector', taskFlg, secNum, logicBlkNum, blkNums, key, keyType, ' ')
	return nfcObj.m1cardReadSector(pointer, taskFlg, secNum, logicBlkNum, blkNums, key, keyType);
}

/**
 * NFC 读M1卡扇区
 * @param {number} taskFlg 任务标志：
 *                    0x00->AUTO 告知扫码器该指令可单独执行，无指令间的依赖关系。
 *                    0x01->START 告知扫码器开始对卡操作或对卡操作尚未结束，且指令间可能存在依赖关系。
 *                    0x02->FINISH 告知扫码器本条指令是操作卡的最后一条指令，将卡片操作环境恢复到默态。
 * @param {number} secNum 扇区号
 * @param {number} logicBlkNum 块号（在扇区内的逻辑号0~3)
 * @param {number} blkNums 块数
 * @param {array} key 密钥, 长度6bytes
 * @param {number} keyType 密钥类型: A:0x60 B:0x61
 * @param {array} data 写入数据
 * @returns int 写入长度 -1:错误
 */
nfc.m1cardWriteSector = function (taskFlg, secNum, logicBlkNum, blkNums, key, keyType, data) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	_validate('m1cardWriteSector', taskFlg, secNum, logicBlkNum, blkNums, key, keyType, data)
	return nfcObj.m1cardWriteSector(pointer, taskFlg, secNum, logicBlkNum, blkNums, key, keyType, data);
}

/**
 * 
 * @param {number} taskFlg 任务标志：
 *                    0x00->AUTO 告知扫码器该指令可单独执行，无指令间的依赖关系。
 *                    0x01->START 告知扫码器开始对卡操作或对卡操作尚未结束，且指令间可能存在依赖关系。
 *                    0x02->FINISH 告知扫码器本条指令是操作卡的最后一条指令，将卡片操作环境恢复到默态。
 * @param {number} blkNums 块号
 * @param {array} key 密钥, 长度6bytes
 * @param {number} keyType 密钥类型: A:0x60 B:0x61
 * @returns Array 读取结果 undefined:失败
 */
nfc.m1cardReadBlk = function (taskFlg, blkNum, key, keyType) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	_validate('m1cardReadBlk', taskFlg, 1, 0, blkNum, key, keyType, ' ')
	return nfcObj.m1cardReadBlk(pointer, taskFlg, blkNum, key, keyType);
}

/**
 * 
 * @param {number} taskFlg 任务标志：
 *                    0x00->AUTO 告知扫码器该指令可单独执行，无指令间的依赖关系。
 *                    0x01->START 告知扫码器开始对卡操作或对卡操作尚未结束，且指令间可能存在依赖关系。
 *                    0x02->FINISH 告知扫码器本条指令是操作卡的最后一条指令，将卡片操作环境恢复到默态。
 * @param {number} blkNums 块号
 * @param {array} key 密钥, 长度6bytes
 * @param {number} keyType 密钥类型: A:0x60 B:0x61
 * @param {array} data 写入数据
 * @returns int 写入长度 -1:错误
 */
nfc.m1cardWriteBlk = function (taskFlg, blkNum, key, keyType, data) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	_validate('m1cardWriteBlk', taskFlg, 1, 0, blkNum, key, keyType, data)
	return nfcObj.m1cardWriteBlk(pointer, taskFlg, blkNum, key, keyType, data);
}

/**
 * 向nfc模块的寄存器内写值
 * @param {number} taskFlg 任务标志：
 *                    0x00->AUTO 告知扫码器该指令可单独执行，无指令间的依赖关系。
 *                    0x01->START 告知扫码器开始对卡操作或对卡操作尚未结束，且指令间可能存在依赖关系。
 *                    0x02->FINISH 告知扫码器本条指令是操作卡的最后一条指令，将卡片操作环境恢复到默态。
 * @param {number} regAddr 要写的寄存器地址（必要的话请参考对应手册）
 * @param {number} val 要写入的值
 * @returns true/false
 */
nfc.nfcRegWrite = function (taskFlg, regAddr, val) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfcRegWrite(pointer, taskFlg, regAddr, val);
}

/**
 * 从nfc模块的寄存器内读值
 * @param {number} taskFlg 任务标志：
 *                    0x00->AUTO 告知扫码器该指令可单独执行，无指令间的依赖关系。
 *                    0x01->START 告知扫码器开始对卡操作或对卡操作尚未结束，且指令间可能存在依赖关系。
 *                    0x02->FINISH 告知扫码器本条指令是操作卡的最后一条指令，将卡片操作环境恢复到默态。
 * @param {number} regAddr 要读的寄存器地址（必要的话请参考对应手册）

 * @returns {number} 读取到的值/null
 */
nfc.nfcRegRead = function (taskFlg, regAddr) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfcRegRead(pointer, taskFlg, regAddr);
}

/**
 * ATS检测
 */
nfc.nfc_iso14443_type_a_get_ats = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfc_iso14443_type_a_get_ats(pointer)
}

/**
 * 卡重新激活
 * @returns {boolean} true/false
 */
nfc.iso14443TypeaReactivate = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.iso14443TypeaReactivate(pointer)
}

/**
 * 
 * @param {number} taskFlg 任务标志：
 *                    0x00->AUTO 告知扫码器该指令可单独执行，无指令间的依赖关系。
 *                    0x01->START 告知扫码器开始对卡操作或对卡操作尚未结束，且指令间可能存在依赖关系。
 *                    0x02->FINISH 告知扫码器本条指令是操作卡的最后一条指令，将卡片操作环境恢复到默态。
 * @param {ArrayBuffer} buffer 	要发送的数据
 * @param {number} bufferLen 	要发送的数据长度
 * @returns buffer
 */
nfc.iso14443Apdu = function (taskFlg, buffer, bufferLen) {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.iso14443Apdu(pointer, taskFlg, buffer, bufferLen);
}

/**
 * PSAM卡断电
 */
nfc.nfcPsamPowerDown = function () {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.nfcPsamPowerDown(pointer);
}

/**
 * NFC 改变状态
 */
nfc.nfcPsamChangeBaud = function () {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.nfcPsamChangeBaud(pointer);
}

/**
 * PSAM卡重置
 */
nfc.nfcPsamCardReset = function (force) {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.nfcPsamCardReset(pointer, force);
}

/**
 * 发送PSAM APDU指令
 */
nfc.nfcPsamCardApdu = function (buffer) {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.nfcPsamCardApdu(pointer, buffer);
}

/**
 * EID 更新云证配置
 * @param {object} eidConfig 云证配置		
 * 		@param {string} eidConfig.appid 平台分配给应用的appid
 * 		@param {number} eidConfig.read_len; // 单次读卡长度，默认0x80
 * 		@param {number} eidConfig.declevel; // 是否读取照片，1为不读取，2为读取
 * 		@param {number} eidConfig.loglevel; //日志级别，支持0，1，2
 * 		@param {number} eidConfig.model; // 是否直接查出信息 0是  1否 （即0是原路返回，返回身份信息，1是转发，返回reqid）
 * 		@param {number} eidConfig.type; // 卡片类型：0 身份证 1电子证照
 * 		@param {number} eidConfig.pic_type; // 照片解码数据类型 0 wlt 1 jpg
 * 		@param {number} eidConfig.envCode; // 环境识别码
 * 		@param {string} eidConfig.sn[128]; // 设备序列号
 * 		@param {string} eidConfig.device_model[128]; // 设备型号
 * 		@param {number} eidConfig.info_type; // 信息返回类型，0 身份信息结构体 ，1原始数据 char   
 */
nfc.eidUpdateConfig = function (eidConfig) {
	if (eidConfig == null) {
		throw new Error("eidUpdateConfig:eidConfig should not be null or empty")
	}
	return nfcObj.eidUpdateConfig(eidConfig);
}

/**
 * 读NTAG版本号
 * 	@param {number} 		hdl               	nfc句柄
 * 	@returns {ArrayBuffer} buffer
 */
nfc.nfcNtagReadVersion = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfcNtagReadVersion(pointer);
}

/**
 * 读NTAG页内容 固定读取4页共16字节
 * 	@param {number} 		hdl               	nfc句柄
 * 	@param {number} 		pageNum           	起始页地址：
 *                             						每次读取四个页
 *                             						如果地址(Addr)是04h，则返回页04h、05h、06h、07h内容
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
 * 读NTAG多页内容 读取数据的buffer,最小为 页数*4；要读取的数据长度 页数*4
 * 	@param {number} 		hdl               	nfc句柄
* 	@param {number} 		start_addr          起始页地址
 * 	@param {number} 		end_addr            结束页地址         	
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
 * 写NTAG页内容
 * 	@param {number} 		hdl               	nfc句柄
 * 	@param {number} 		pageNum           	写入的页号 ：有效Addr参数
 *                              				对于NTAG213，页地址02h至2Ch
 *                              				对于NTAG215，页地址02h至86h
 *                              				对于NTAG216，页地址02h至E6h
 * 	@param {ArrayBuffer} 	pageData         	写入页的内容：四字节
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
 * 判断nfc消息队列是否为空
 * @returns bool
 */
nfc.msgIsEmpty = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.msgIsEmpty(pointer)
}

/**
 * 从nfc消息队列中读取数据
 * @returns json消息对象
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
 * 简化NFC组件的使用，无需轮询去获取网络状态，网络的状态会通过eventcenter发送出去
 * run 只会执行一次，执行之后网络基本配置不能修改
 * 如果需要实时获取刷卡数据，可以订阅 eventCenter的事件，事件的topic是nfc.CARD，事件的内容是类似
 * {id:'卡id',card_type:卡芯片类型,id_len:卡号长度,type：卡类型,timestamp:'刷卡时间戳',monotonic_timestamp:'相对开机的时间'}
 * @param {*} options 
 * 		@param {boolean} options.m1 非必填，普通卡回调开关
 * 		@param {boolean} options.psam 非必填，psam卡回调开关
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
 * 如果nfc单独一个线程，可以直接使用run函数，会自动启动一个线程，
 * 如果想加入到其他已有的线程，可以使用以下封装的函数
 */
nfc.worker = {
	//在while循环前
	beforeLoop: function (options) {
		nfc.init(options.useEid)
		// PSAM和普通卡回调
		if (options.m1) {
			nfc.cbRegister()
		}
		if (options.psam) {
			nfc.psamCbRegister()
		}
	},
	//在while循环里
	loop: function () {
		if (!nfc.msgIsEmpty()) {
			let res = nfc.msgReceive();
			bus.fire(nfc.RECEIVE_MSG, res)
		}
	}
}
export default nfc;
