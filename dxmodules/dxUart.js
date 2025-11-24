//build: 20240715
//Kanal za komunikaciju podataka, uključujući serijski port (Serial port), USB (Universal Serial Bus) i Wiegand
//Zavisne komponente: dxDriver, dxStd, dxLogger, dxMap, dxEventBus, dxCommon
import { channelClass } from './libvbar-m-dxchannel.so'
import std from './dxStd.js'
import dxMap from './dxMap.js'
import dxCommon from './dxCommon.js'
import bus from './dxEventBus.js'
const uartObj = new channelClass();
const map = dxMap.get('default')
const uart = {}
uart.TYPE = {
	USBKBW: 1,//USB Keyboard Wedge povezuje tastaturu preko USB interfejsa i prenosi podatke u Wiegand protokolu
	USBHID: 2,//Tip kanala USB Human Interface Device
	UART: 3,//Predstavlja tip UART kanala, tj. serijski port kanal
	WIEGAND: 4//Tip Wiegand kanala
}
/**
 * Otvaranje kanala
 * @param {number} type Tip kanala, pogledajte enumeraciju TYPE, obavezno
 * @param {string} path Putanja se razlikuje za različite uređaje ili različite tipove kanala na istom uređaju, npr. za DW200 485 odgovarajuća vrijednost je "/dev/ttyS2", obavezno
 * @param {string} id ID rukovatelja, nije obavezno (ako otvarate više instanci, potrebno je unijeti jedinstveni ID)
 */
uart.open = function (type, path, id) {
	if (type === undefined || type === null) {
		throw new Error("uart.open:'type' should not be null or empty")
	}
	if (path === undefined || path === null) {
		throw new Error("uart.open:'path' should not be null or empty")
	}

	let pointer = uartObj.open(type, path);

	if (pointer === undefined || pointer === null) {
		throw new Error("uart.open: open failed")
	}

	dxCommon.handleId("uart", id, pointer)
}

/**
 * Slanje podataka kanalom
 * @param {ArrayBuffer} buffer Podaci za slanje, obavezno
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
uart.send = function (buffer, id) {
	if (buffer === undefined || buffer === null) {
		throw new Error("uart.send: 'buffer' should not be null or empty")
	}
	let pointer = dxCommon.handleId("uart", id)

	return uartObj.send(pointer, buffer);
}

/**
 * Slanje podataka kanalom, koristeći format protokola za komunikaciju pri slabom osvjetljenju
 * @param {string/object} data Podaci za slanje, obavezno
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
uart.sendVg = function (data, id) {
	if (!data) {
        return
    }
    if (typeof data === 'string') {
        uart.send(dxCommon.hexStringToArrayBuffer(data), id)
        return
    }
    let pack = '55aa' + data.cmd
    if (data.hasOwnProperty('result')) {
        pack += data.result
    }
    pack += (data.length % 256).toString(16).padStart(2, '0')
    pack += (Math.floor(data.length / 256)).toString(16).padStart(2, '0')
    pack += data.data
    let all = dxCommon.hexToArr(pack)
    let bcc = dxCommon.calculateBcc(all)
    all.push(bcc)
    uart.send(new Uint8Array(all).buffer, id)
}

/**
 * Primanje podataka, potrebno je prozivanje (polling) u niti za dobijanje, vraća tip Uint8Array
 * Ako primljeni podaci ne dostignu dužinu 'size', nastavit će čekati dok se ne primi dužina 'size', ali ako je 'timeout' kratak, moguće je da se operacija završi prije nego što se sve primi.
 * @param {number} size Broj bajtova podataka za primanje, obavezno
 * @param {number} timeout Vremensko ograničenje (u milisekundama). Ova funkcija će blokirati i čekati najviše ovo vrijeme. Ako se 'size' podataka primi ranije, također će se završiti. Nije obavezno, zadano je 10ms.
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns Uint8Array,返回值的byteLength表示接收到的长度，如果为0表示没有接收到任何数据
 */
uart.receive = function (size, timeout, id) {
	if (size === undefined || size === null) {
		throw new Error("uart.receive:'size' should not be null or empty")
	}

	if (timeout === undefined || timeout === null) {
		timeout = 10
	}

	let pointer = dxCommon.handleId("uart", id)

	let res = uartObj.receive(pointer, size, timeout)
	if (res === null) {
		return null
	}
	return new Uint8Array(res)
}

/**
 * Pozivanje specijalnog IO interfejsa kanala
 * @param {*} request 
 * @param {*} arg 
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
uart.ioctl = function (request, arg, id) {
	let pointer = dxCommon.handleId("uart", id)

	return uartObj.ioctl(pointer, request, arg)
}

/**
 * Zatvaranje kanala
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
uart.close = function (id) {
	let pointer = dxCommon.handleId("uart", id)

	return uartObj.close(pointer)
}


/**
 * Osvježavanje kanala
 * @param {number} queue_selector Obavezno
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns true/false
 */
uart.flush = function (queue_selector, id) {
	if (queue_selector == null) {
		throw new Error("queue_selector should not be null or empty")
	}
	let pointer = dxCommon.handleId("uart", id)

	return uartObj.flush(pointer, queue_selector);
}


uart.VG = {
	RECEIVE_MSG: '__uartvg__MsgReceive',
}

/**
 * Pojednostavljenje upotrebe protokola za komunikaciju pri slabom osvjetljenju,
 * 1. Primanje podataka: Nakon primanja binarnih TLV podataka, oni se parsiraju u objekat i šalju kao događaj eventbus-a (uart.VG.RECEIVE_MSG+options.id)
 * Format vraćenog objekta: {cmd:"2a",result:"01",length:7,data:"0a1acc320fee32",bcc:true}
 * cmd: Komandna riječ od 1 bajta, heksadecimalni string
 * result: Identifikaciona riječ od 1 bajta, koja označava rezultat obrade podataka, uspjeh, neuspjeh ili drugi status. Samo povratni podaci imaju identifikacionu riječ, heksadecimalni string
 * length: Dužina podataka, definisana sa 2 bajta u TLV-u, ovdje direktno pretvorena u decimalni broj
 * data: Polje podataka od više bajtova, heksadecimalni string
 * bcc: Uspjeh ili neuspjeh BCC provjere
 * 2. Slanje podataka: Objekat se pretvara u binarne podatke TLV formata i šalje. Može se poslati putem uart.sendVg('podaci za slanje', id), format podataka je sljedeći:
 * Postoje dva formata za slanje podataka: 1. Format objekta: {cmd:"2a",result:"01",length:7,data:"0a1acc320fee32"} 2. Kompletan heksadecimalni string '55AA09000000F6'
 * 3. Sa istim ID-om, višestruki pozivi runvg će se izvršiti samo jednom
 * 
 * @param {object} options Parametri za pokretanje
 *			@param {number} options.type Tip kanala, pogledajte enumeraciju TYPE, obavezno (kompatibilno sa USBHID blok prenosom, zadano 1024 po bloku)
 *			@param {string} options.path Putanja se razlikuje za različite uređaje ili različite tipove kanala na istom uređaju, npr. za DW200 485 odgovarajuća vrijednost je "/dev/ttyS2", obavezno
 *			@param {number} options.result 0 i 1 (zadano je 0), označava da li primljeni ili poslani podaci sadrže identifikacioni bajt. 0 znači da primljeni podaci ne uključuju identifikacioni bajt, a poslani podaci ga uključuju, 1 je obrnuto.
 *			@param {boolean} options.passThrough Ako je passThrough true, primljeni podaci koriste prolazni mod, nije obavezno
 *          @param {string} options.id  ID rukovatelja, nije obavezno (ako inicijalizirate više instanci, potrebno je unijeti jedinstveni ID)
 */
uart.runvg = function (options) {
	if (options === undefined || options.length === 0) {
		throw new Error("dxuart.runvg:'options' parameter should not be null or empty")
	}
	if (options.id === undefined || options.id === null || typeof options.id !== 'string') {
        // ID rukovatelja
        options.id = ""
    }
	if (options.type === undefined || options.type === null) {
		throw new Error("dxuart.runvg:'type' should not be null or empty")
	}
	if (options.path === undefined || options.path === null) {
		throw new Error("dxuart.runvg:'path' should not be null or empty")
	}
	let oldfilepre = '/app/code/dxmodules/vgUartWorker'
	let content = std.loadFile(oldfilepre + '.js').replace("{{id}}", options.id)
	let newfile = oldfilepre + options.id + '.js'
	std.saveFile(newfile, content)
	let init = map.get("__vguart__run_init" + options.id)
	if (!init) {//Osigurajte da se inicijalizira samo jednom
		map.put("__vguart__run_init" + options.id, options)
		bus.newWorker(options.id || "__uart",newfile)
	}
}
export default uart;