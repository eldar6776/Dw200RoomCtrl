//build:20240715
//Koristite ovu komponentu za čitanje kartica, uključujući M1 kartice, PSAM kartice i slično.
//Zavisne komponente: dxDriver, dxMap, dxLogger, dxCommon, dxEventBus
import { nfcClass } from './libvbar-p-dxnfc.so'
import dxCommon from './dxCommon.js'
import bus from './dxEventBus.js'
import dxMap from './dxMap.js'
const nfcObj = new nfcClass();
const map = dxMap.get("default")
const nfc = {}

/**
 * NFC inicijalizacija
 * @param {number} useEid Nije obavezno, da li koristiti e-certifikat. 0: ne koristi, 1: koristi.
 * @param {number} type Nije obavezno, tip NFC-a. 0: MCU, 1: Chip.
 */
nfc.init = function (useEid = 0, type = 1) {
	let pointer = nfcObj.init(useEid, type)
	if (pointer === undefined || pointer === null) {
		throw new Error("nfc.init: init failed")
	}
	dxCommon.handleId("nfc", 'nfcid', pointer)
}

/**
 * NFC registracija povratnog poziva za običnu karticu
 */
nfc.cbRegister = function (callback) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.cbRegister(pointer, "nfc_cb", 1, callback)
}

/**
 * NFC registracija povratnog poziva za PSAM karticu
 */
nfc.psamCbRegister = function (callback) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfcPsamCheckVgcardCallback(pointer, callback)
}

/**
 * NFC deinicijalizacija
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
 * NFC kreiranje informacija o kartici
 * @param {number} cardType Tip čipa kartice (definisan od strane proizvođača)
 * @param {ArrayBuffer} cardId Broj kartice
 * @param {number} type Tip kartice (definisan od strane nas)
 * @returns cardInfo (pokazivač)
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
 * NFC uništavanje informacija o kartici
 * @param {pointer} cardInfo Informacije o kartici
 * @returns 
 */
nfc.cardInfoDestory = function (cardInfo) {
	if (!cardInfo) {
		throw new Error("cardInfoDestory:cardInfo should not be null or empty")
	}
	return nfcObj.cardInfoDestory(cardInfo);
}

/**
 * NFC kopiranje informacija o kartici
 * @param {pointer} cardInfo Informacije o kartici
 * @returns cardInfo (pokazivač)
 */
nfc.cardInfoCopy = function (cardInfo) {
	if (cardInfo == null) {
		throw new Error("cardInfoCopy:cardInfo should not be null or empty")
	}
	return nfcObj.cardInfoCopy(cardInfo);
}

/**
 * NFC provjera da li je kartica prisutna
 * @returns bool
 */
nfc.isCardIn = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.isCardIn(pointer);
}

/**
 * NFC čitanje sektora M1 kartice
 * @param {number} taskFlg Zastavica zadatka:
 *                    0x00->AUTO Obavještava skener da se ova naredba može izvršiti samostalno, bez zavisnosti od drugih naredbi.
 *                    0x01->START Obavještava skener da započne operaciju sa karticom ili da operacija sa karticom još nije završena, te da može postojati zavisnost između naredbi.
 *                    0x02->FINISH Obavještava skener da je ova naredba posljednja operacija sa karticom, vraćajući okruženje za rad sa karticom u zadano stanje.
 * @param {number} secNum Broj sektora
 * @param {number} logicBlkNum Broj bloka (logički broj unutar sektora 0~3)
 * @param {number} blkNums Broj blokova
 * @param {array} key Ključ, dužine 6 bajtova
 * @param {number} keyType Tip ključa: A:0x60 B:0x61
 * @returns Array Rezultat čitanja, undefined: neuspjeh
 */
nfc.m1cardReadSector = function (taskFlg, secNum, logicBlkNum, blkNums, key, keyType) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	_validate('m1cardReadSector', taskFlg, secNum, logicBlkNum, blkNums, key, keyType, ' ')
	return nfcObj.m1cardReadSector(pointer, taskFlg, secNum, logicBlkNum, blkNums, key, keyType);
}

/**
 * NFC pisanje u sektor M1 kartice
 * @param {number} taskFlg Zastavica zadatka:
 *                    0x00->AUTO Obavještava skener da se ova naredba može izvršiti samostalno, bez zavisnosti od drugih naredbi.
 *                    0x01->START Obavještava skener da započne operaciju sa karticom ili da operacija sa karticom još nije završena, te da može postojati zavisnost između naredbi.
 *                    0x02->FINISH Obavještava skener da je ova naredba posljednja operacija sa karticom, vraćajući okruženje za rad sa karticom u zadano stanje.
 * @param {number} secNum Broj sektora
 * @param {number} logicBlkNum Broj bloka (logički broj unutar sektora 0~3)
 * @param {number} blkNums Broj blokova
 * @param {array} key Ključ, dužine 6 bajtova
 * @param {number} keyType Tip ključa: A:0x60 B:0x61
 * @param {array} data Podaci za pisanje
 * @returns int Dužina upisanih podataka, -1: greška
 */
nfc.m1cardWriteSector = function (taskFlg, secNum, logicBlkNum, blkNums, key, keyType, data) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	_validate('m1cardWriteSector', taskFlg, secNum, logicBlkNum, blkNums, key, keyType, data)
	return nfcObj.m1cardWriteSector(pointer, taskFlg, secNum, logicBlkNum, blkNums, key, keyType, data);
}

/**
 * Čitanje bloka M1 kartice
 * @param {number} taskFlg Zastavica zadatka:
 *                    0x00->AUTO Obavještava skener da se ova naredba može izvršiti samostalno, bez zavisnosti od drugih naredbi.
 *                    0x01->START Obavještava skener da započne operaciju sa karticom ili da operacija sa karticom još nije završena, te da može postojati zavisnost između naredbi.
 *                    0x02->FINISH Obavještava skener da je ova naredba posljednja operacija sa karticom, vraćajući okruženje za rad sa karticom u zadano stanje.
 * @param {number} blkNum Broj bloka
 * @param {array} key Ključ, dužine 6 bajtova
 * @param {number} keyType Tip ključa: A:0x60 B:0x61
 * @returns Array Rezultat čitanja, undefined: neuspjeh
 */
nfc.m1cardReadBlk = function (taskFlg, blkNum, key, keyType) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	_validate('m1cardReadBlk', taskFlg, 1, 0, blkNum, key, keyType, ' ')
	return nfcObj.m1cardReadBlk(pointer, taskFlg, blkNum, key, keyType);
}

/**
 * Pisanje u blok M1 kartice
 * @param {number} taskFlg Zastavica zadatka:
 *                    0x00->AUTO Obavještava skener da se ova naredba može izvršiti samostalno, bez zavisnosti od drugih naredbi.
 *                    0x01->START Obavještava skener da započne operaciju sa karticom ili da operacija sa karticom još nije završena, te da može postojati zavisnost između naredbi.
 *                    0x02->FINISH Obavještava skener da je ova naredba posljednja operacija sa karticom, vraćajući okruženje za rad sa karticom u zadano stanje.
 * @param {number} blkNum Broj bloka
 * @param {array} key Ključ, dužine 6 bajtova
 * @param {number} keyType Tip ključa: A:0x60 B:0x61
 * @param {array} data Podaci za pisanje
 * @returns int Dužina upisanih podataka, -1: greška
 */
nfc.m1cardWriteBlk = function (taskFlg, blkNum, key, keyType, data) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	_validate('m1cardWriteBlk', taskFlg, 1, 0, blkNum, key, keyType, data)
	return nfcObj.m1cardWriteBlk(pointer, taskFlg, blkNum, key, keyType, data);
}

/**
 * Pisanje vrijednosti u registar NFC modula
 * @param {number} taskFlg Zastavica zadatka:
 *                    0x00->AUTO Obavještava skener da se ova naredba može izvršiti samostalno, bez zavisnosti od drugih naredbi.
 *                    0x01->START Obavještava skener da započne operaciju sa karticom ili da operacija sa karticom još nije završena, te da može postojati zavisnost između naredbi.
 *                    0x02->FINISH Obavještava skener da je ova naredba posljednja operacija sa karticom, vraćajući okruženje za rad sa karticom u zadano stanje.
 * @param {number} regAddr Adresa registra za pisanje (ako je potrebno, pogledajte odgovarajući priručnik)
 * @param {number} val Vrijednost za pisanje
 * @returns true/false
 */
nfc.nfcRegWrite = function (taskFlg, regAddr, val) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfcRegWrite(pointer, taskFlg, regAddr, val);
}

/**
 * Čitanje vrijednosti iz registra NFC modula
 * @param {number} taskFlg Zastavica zadatka:
 *                    0x00->AUTO Obavještava skener da se ova naredba može izvršiti samostalno, bez zavisnosti od drugih naredbi.
 *                    0x01->START Obavještava skener da započne operaciju sa karticom ili da operacija sa karticom još nije završena, te da može postojati zavisnost između naredbi.
 *                    0x02->FINISH Obavještava skener da je ova naredba posljednja operacija sa karticom, vraćajući okruženje za rad sa karticom u zadano stanje.
 * @param {number} regAddr Adresa registra za čitanje (ako je potrebno, pogledajte odgovarajući priručnik)

 * @returns {number} Pročitana vrijednost/null
 */
nfc.nfcRegRead = function (taskFlg, regAddr) {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfcRegRead(pointer, taskFlg, regAddr);
}

/**
 * ATS detekcija
 */
nfc.nfc_iso14443_type_a_get_ats = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfc_iso14443_type_a_get_ats(pointer)
}

/**
 * Ponovna aktivacija kartice
 * @returns {boolean} true/false
 */
nfc.iso14443TypeaReactivate = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.iso14443TypeaReactivate(pointer)
}

/**
 * Slanje ISO14443 APDU komande
 * @param {number} taskFlg Zastavica zadatka:
 *                    0x00->AUTO Obavještava skener da se ova naredba može izvršiti samostalno, bez zavisnosti od drugih naredbi.
 *                    0x01->START Obavještava skener da započne operaciju sa karticom ili da operacija sa karticom još nije završena, te da može postojati zavisnost između naredbi.
 *                    0x02->FINISH Obavještava skener da je ova naredba posljednja operacija sa karticom, vraćajući okruženje za rad sa karticom u zadano stanje.
 * @param {ArrayBuffer} buffer 	Podaci za slanje
 * @param {number} bufferLen 	Dužina podataka za slanje
 * @returns buffer
 */
nfc.iso14443Apdu = function (taskFlg, buffer, bufferLen) {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.iso14443Apdu(pointer, taskFlg, buffer, bufferLen);
}

/**
 * Isključivanje napajanja PSAM kartice
 */
nfc.nfcPsamPowerDown = function () {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.nfcPsamPowerDown(pointer);
}

/**
 * NFC promjena stanja
 */
nfc.nfcPsamChangeBaud = function () {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.nfcPsamChangeBaud(pointer);
}

/**
 * Resetovanje PSAM kartice
 */
nfc.nfcPsamCardReset = function (force) {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.nfcPsamCardReset(pointer, force);
}

/**
 * Slanje PSAM APDU komande
 */
nfc.nfcPsamCardApdu = function (buffer) {
	let pointer = dxCommon.handleId("nfc", "nfcid")
	return nfcObj.nfcPsamCardApdu(pointer, buffer);
}

/**
 * EID ažuriranje konfiguracije e-certifikata
 * @param {object} eidConfig Konfiguracija e-certifikata
 * 		@param {string} eidConfig.appid Appid dodijeljen aplikaciji od strane platforme
 * 		@param {number} eidConfig.read_len; // Dužina čitanja kartice u jednom prolazu, zadano 0x80
 * 		@param {number} eidConfig.declevel; // Da li čitati fotografiju, 1 za ne čitati, 2 za čitati
 * 		@param {number} eidConfig.loglevel; // Nivo logiranja, podržava 0, 1, 2
 * 		@param {number} eidConfig.model; // Da li direktno dohvatiti informacije 0 da, 1 ne (tj. 0 je povratak na originalni put, vraća informacije o identitetu, 1 je prosljeđivanje, vraća reqid)
 * 		@param {number} eidConfig.type; // Tip kartice: 0 lična karta, 1 elektronski certifikat
 * 		@param {number} eidConfig.pic_type; // Tip podataka za dekodiranje fotografije 0 wlt 1 jpg
 * 		@param {number} eidConfig.envCode; // Kod za prepoznavanje okruženja
 * 		@param {string} eidConfig.sn[128]; // Serijski broj uređaja
 * 		@param {string} eidConfig.device_model[128]; // Model uređaja
 * 		@param {number} eidConfig.info_type; // Tip povratnih informacija, 0 struktura informacija o identitetu, 1 sirovi podaci char
 */
nfc.eidUpdateConfig = function (eidConfig) {
	if (eidConfig == null) {
		throw new Error("eidUpdateConfig:eidConfig should not be null or empty")
	}
	return nfcObj.eidUpdateConfig(eidConfig);
}

/**
 * Čitanje verzije NTAG-a
 * 	@param {number} 		hdl               	NFC rukovatelj
 * 	@returns {ArrayBuffer} buffer
 */
nfc.nfcNtagReadVersion = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.nfcNtagReadVersion(pointer);
}

/**
 * Čitanje sadržaja NTAG stranice, fiksno čitanje 4 stranice, ukupno 16 bajtova
 * 	@param {number} 		hdl               	NFC rukovatelj
 * 	@param {number} 		pageNum           	Početna adresa stranice:
 *                             						Svaki put se čitaju četiri stranice
 *                             						Ako je adresa (Addr) 04h, vraća sadržaj stranica 04h, 05h, 06h, 07h
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
 * Čitanje sadržaja više NTAG stranica. Buffer za čitanje podataka, minimalno broj_stranica*4; dužina podataka za čitanje je broj_stranica*4.
 * 	@param {number} 		hdl               	NFC rukovatelj
* 	@param {number} 		start_page          Početna adresa stranice
 * 	@param {number} 		end_page            Završna adresa stranice
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
 * Pisanje sadržaja NTAG stranice
 * 	@param {number} 		hdl               	NFC rukovatelj
 * 	@param {number} 		pageNum           	Broj stranice za pisanje: važeći Addr parametar
 *                              				Za NTAG213, adrese stranica od 02h do 2Ch
 *                              				Za NTAG215, adrese stranica od 02h do 86h
 *                              				Za NTAG216, adrese stranica od 02h do E6h
 * 	@param {ArrayBuffer} 	pageData         	Sadržaj za pisanje na stranicu: četiri bajta
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
 * Provjera da li je red poruka NFC-a prazan
 * @returns bool
 */
nfc.msgIsEmpty = function () {
	let pointer = dxCommon.handleId("nfc", 'nfcid')
	return nfcObj.msgIsEmpty(pointer)
}

/**
 * Čitanje podataka iz reda poruka NFC-a
 * @returns JSON objekat poruke
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
 * Pojednostavljuje upotrebu NFC komponente. Nema potrebe za prozivanjem (polling) radi dobijanja statusa mreže; status mreže će biti poslan putem eventcenter-a.
 * 'run' se izvršava samo jednom, nakon čega se osnovna mrežna konfiguracija ne može mijenjati.
 * Ako trebate dobijati podatke o prevlačenju kartice u realnom vremenu, možete se pretplatiti na događaj eventCenter-a. Topic događaja je nfc.CARD, a sadržaj događaja je sličan
 * {id:'ID kartice', card_type: tip čipa kartice, id_len: dužina broja kartice, type: tip kartice, timestamp: 'vremenski pečat prevlačenja', monotonic_timestamp: 'vrijeme od pokretanja sistema'}
 * @param {*} options 
 * 		@param {boolean} options.m1 Nije obavezno, prekidač za povratni poziv za običnu karticu
 * 		@param {boolean} options.psam Nije obavezno, prekidač za povratni poziv za PSAM karticu
 */
nfc.run = function (options) {
	if (options === undefined || options.length === 0) {
		throw new Error("dxnfc.run:'options' parameter should not be null or empty")
	}
	let init = map.get("__nfc__run_init")
	if (!init) {//Osigurajte da se inicijalizira samo jednom
		map.put("__nfc__run_init", options)
		bus.newWorker("__nfc", '/app/code/dxmodules/nfcWorker.js')
	}
}

/**
 * Ako NFC radi u zasebnoj niti, možete direktno koristiti funkciju 'run', koja će automatski pokrenuti nit.
 * Ako želite da ga dodate u postojeću nit, možete koristiti sljedeće enkapsulirane funkcije.
 */
nfc.worker = {
	//Prije while petlje
	beforeLoop: function (options) {
		nfc.init(options.useEid)
		// PSAM i povratni poziv za običnu karticu
		if (options.m1) {
			nfc.cbRegister()
		}
		if (options.psam) {
			nfc.psamCbRegister()
		}
	},
	//Unutar while petlje
	loop: function () {
		if (!nfc.msgIsEmpty()) {
			let res = nfc.msgReceive();
			bus.fire(nfc.RECEIVE_MSG, res)
		}
	}
}
export default nfc;
