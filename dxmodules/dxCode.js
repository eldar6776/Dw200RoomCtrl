//build: 20240715
//Zavisne komponente: dxDriver, dxMap, dxEventBus, dxLogger, dxCommon, dxQueue
//Koristi se za prepoznavanje i parsiranje slika QR kodova
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
 * Inicijalizacija modula za snimanje slike
 * @param {object} options Konfiguracijski parametri, većina može koristiti zadane vrijednosti
 *      @param {string} options.path                 Obavezno, putanja uređaja za snimanje slike, razlikuje se za svaki uređaj, npr. za DW200 vrijednost je '/dev/video11', za M500 je '/dev/video0'
 *      @param {number} options.width                Nije obavezno, širina slike, zadano je 0
 *      @param {number} options.height               Nije obavezno, visina slike, zadano je 0
 *      @param {number} options.widthbytes           Nije obavezno, broj bajtova po pikselu. GREY: 1, YUV: 2. Zadano za DW200 je 1, za VF203 je 2.
 *      @param {number} options.pixel_format         Nije obavezno, format piksela, zadano je 1497715271 što predstavlja V4L2_PIX_FMT_GREY
 *      @param {number} options.max_channels         Nije obavezno, maksimalan broj podržanih kanala za simultani izlaz, zadano je 3
 *      @param {number} options.rotation             Nije obavezno, ugao rotacije, zadano je 90
 *      @param {number} options.frame_num            Nije obavezno, broj okvira, zadano je 3
 *      @param {string} options.capturerDogId        Nije obavezno, ID rukovatelja watchdog-a kamere
 */
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
 * Inicijalizacija modula za dekodiranje slike
 * @param {object} options Konfiguracijski parametri, većina može koristiti zadane vrijednosti
 *      @param {string} options.name         Obavezno, prilagođeno ime dekodera, može biti bilo šta
 *      @param {number} options.width        Obavezno, širina slike, različita za različite uređaje, npr. za DW200 je 800
 *      @param {number} options.height       Obavezno, visina slike, različita za različite uređaje, npr. za DW200 je 600
 *      @param {number} options.widthbytes   Nije obavezno, broj bajtova po pikselu. GREY: 1, YUV: 2. Zadano je 1.
 *      @param {object} options.config       Nije obavezno, stavke konfiguracije, zadano je {}
 *      @param {number} options.max_channels Nije obavezno, maksimalan broj podržanih kanala za simultani izlaz, zadano je 10
 */
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
 * Ažuriranje konfiguracije modula za dekodiranje slike
 * @param {object} options Konfiguracijski parametri, većina može koristiti zadane vrijednosti
 *      @param {string} options.decoder         Nije obavezno, tip dekoderskog mehanizma
 *      @param {number} options.deType          Nije obavezno, tip kodnog sistema
 *      @param {number} options.sMode           Nije obavezno, strategija filtriranja na osnovu sadržaja koda
                                                │         Zadano s_mode = 0
                                                │         0 : Intervalni mod za isti kod
                                                │         1 : Jednokratni mod
                                                │         2 : Intervalni mod za različite kodove
 *      @param {number} options.interval        Nije obavezno, vrijeme intervala u intervalnom modu
 *      @param {object} options.searchTimeout   Nije obavezno, vremensko ograničenje za pretragu koda
 *      @param {object} options.decoderTimeout  Nije obavezno, vremensko ograničenje za dekodiranje
 *      @param {number} options.searchMode      Nije obavezno, strategija koja odgovara dekoderskom mehanizmu
 *      @param {object} options.decoderMode     Nije obavezno, konfiguracija karakteristika dekoderskog mehanizma
 *      @param {number} options.qrMode          Nije obavezno, konfiguracija parametara za QR kod, zadano nije javno dostupno
                                                │         Zadano qr_mode = 15
                                                │         bit0 : Podržava QR kodove sa manjim udjelom u slici
                                                │         bit1 : Podržava QR kodove čiji lokatori nisu kvadratni, zadano se može isključiti
                                                │         bit2 : Poboljšanje prepoznavanja QR koda, za medicinske, abnormalne, i scenarije sa prugama, može se isključiti u normalnim scenarijima
                                                │         bit3 : Poboljšanje tačkastih QR kodova (operacija koja zahtijeva vrijeme), može se isključiti u normalnim scenarijima
                                                │         bit4 : Podržava QR kodove bez tihe zone (operacija koja zahtijeva vrijeme), zadano isključeno
 *      @param {object} options.decoderDelay    Nije obavezno, kašnjenje između dva dekodiranja
 */
code.decoderUpdateConfig = function (options) {
    if (options === null) {
        throw new Error("dxCode.decoderUpdateConfig: 'options' parameter should not be null or empty")
    }
    let pointer = dxCommon.handleId("code", "decoderid")
    codeObj.decoderUpdateConfig(pointer, options)
    return pointer
}

/**
 * Registracija povratnog poziva za specijalni kod dekodera
 */
code.decodeSpecialCBRegister = function () {
    let pointer = dxCommon.handleId("code", "decoderid")
    let cbType = typeof codeObj.decodeSpecialCBRegister;
    // 这个方法是后加的，判断库中没有该方法(没有该方法的说明不需要调用，在库中已经做了相关操作)
    if (cbType === "function") {
        return codeObj.decodeSpecialCBRegister(pointer)
    }
}

/**
 * @param {object} options Konfiguracijski parametri, većina može koristiti zadane vrijednosti
 * @param {number} options.method Nije obavezno, glavna funkcija ISP-a
 * @param {number} options.sub_method Nije obavezno, pod-funkcija ISP-a
 * @param {number} options.target_luminance Nije obavezno, ciljna vrijednost svjetline slike
 * @param {number} options.target_percentile Nije obavezno, postotak ciljne svjetline
 * @param {number} options.sample_gap Nije obavezno, interval uzorkovanja pri izračunavanju
 * @param {number} options.min_exp Nije obavezno, minimalna vrijednost ekspozicije
 * @param {number} options.max_exp Nije obavezno, maksimalna vrijednost ekspozicije
 * @param {number} options.min_gain Nije obavezno, minimalna vrijednost pojačanja
 * @param {number} options.max_gain Nije obavezno, maksimalna vrijednost pojačanja
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
 * Pokretanje niti za slušanje snimanja slike
 * @param {string} id1 Obavezno, ID serijskog porta
 * @param {number} timeout Nije obavezno, vremensko ograničenje u milisekundama, ako se u zadanom vremenu ne primi naredba za snimanje slike, snimanje će se automatski zaustaviti
 * @returns undefined
 */
code.startGetImageListen = function (id1, timeout = 1000) {
    if (id1 === null || id1 === undefined) {
        throw new Error("dxCode.startGetImageListen: 'id1' parameter should not be null or empty")
    }
    return codeObj.startGetImageListen(dxCommon.handleId("uart", id1), dxCommon.handleId("code", "capturerid"), timeout)
}

/**
 * Zaustavljanje niti za slušanje snimanja slike, sluša samo naredbe 5c/5d protokola slabog svjetla, slanje bilo koje druge naredbe u međuvremenu će zaustaviti nit za snimanje slike
 * @returns undefined
 */
code.stopGetImageListen = function () {
    return codeObj.stopGetImageListen()
}

/**
 * Dobijanje statusa snimanja slike
 * @returns true/false
 */
code.getImageListenStatus = function () {
    return codeObj.getImageListenStatus()
}

/**
 * Provjera da li je red poruka dekodera prazan
 */
code.msgIsEmpty = function () {
    let pointer = dxCommon.handleId("code", "decoderid")
    return codeObj.msgIsEmpty(pointer)
}
/**
 * Čitanje podataka iz reda poruka dekodera
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
 * Provjera da li su vrijednosti dva ArrayBuffer-a iste
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
 * Koristi se za pojednostavljenje upotrebe 'code' komponente. 'code' je enkapsuliran u ovom workeru, a korisnik treba samo da se pretplati na događaj eventbus-a kako bi slušao.
 * @param {object} options 
 *      @param {object} options.capturer  Parametri komponente 'capturer', pogledajte capturerInit, obavezno
 *      @param {object} options.decoder  Parametri komponente 'decoder', pogledajte decoderInit, obavezno
 *      @param {number} options.mode  Zadano je intervalni mod, što znači da će se ponovljeni QR kodovi ponovo prijavljivati u intervalima definiranim sa 'interval'. Ako je 1, to je jednokratni mod, i ponovljeni QR kodovi će se prijaviti samo jednom.
 *      @param {number} options.interval  Interval skeniranja, ima smisla samo kada je 'mode' 0, zadano je 0.6 sekundi
 */

code.run = function (options) {
    if (!options || !options.capturer || !options.decoder) {
        throw new Error("dxcode.run:'options.capturer' and 'options.decoder' parameter should not be null or empty")
    }
    let init = map.get("__code__run_init")
    if (!init) {//Osigurajte da se inicijalizira samo jednom
        map.put("__code__run_init", options)
        bus.newWorker("__code", '/app/code/dxmodules/codeWorker.js')
    }
}

/**
 * Ako 'capturer' radi u zasebnoj niti, možete direktno koristiti funkciju 'run', koja će automatski pokrenuti nit.
 * Ako želite da ga dodate u postojeću nit, možete koristiti sljedeće enkapsulirane funkcije.
 */
code.worker = {
    //Prije while petlje
    beforeLoop: function (capturer, decoder) {
        code.capturerInit(capturer)
        code.worker.pointer = code.decoderInit(decoder)
        code.decodeSpecialCBRegister()
    },
    //Unutar while petlje
    loop: function (mode = 0, interval = 600) {
        let pointer = code.worker.pointer
        if (!pointer) {
            pointer = dxCommon.handleId("code", "decoderid")
        }
        if (!codeObj.msgIsEmpty(pointer)) {
            let res = codeObj.msgReceive(pointer)
            if (res != undefined && res != null && res.byteLength > 0) {
                const now = new Date().getTime()
                if (mode == 1) {//Jednokratni mod
                    if (!bufferIsEqual(res, code.worker.singleOldContent)) {
                        bus.fire(code.RECEIVE_MSG, res)
                        code.worker.lastTimestamp = now
                        code.worker.singleOldContent = res
                    }
                } else {//Intervalni mod
                    let _interval = Math.max(300, interval)//Minimalno 300 milisekundi
                    if ((now - code.worker.lastTimestamp) > _interval || !bufferIsEqual(res, code.worker.intervalOldContent)) {//Ne šalji ponovljene podatke unutar 1 sekunde
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