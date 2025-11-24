//build 20240524
//Prihvata GPIO ulaz
//Zavisne komponente: dxLogger, dxDriver, dxEventBus
import { gpioKeyClass } from './libvbar-m-dxkey.so'
import bus from './dxEventBus.js'
import * as os from "os";
const gpioKeyObj = new gpioKeyClass();
const gpioKey = {}

/**
 * gpioKey inicijalizacija
 * @returns true:成功,false:失败
 */
gpioKey.init = function () {
	const res = gpioKeyObj.init()
	if (res) {
		gpioKeyObj.registerCb("gpioKeyCb")
	}
	return res
}

/**
 * gpioKey deinicijalizacija
 * @returns true:成功,false:失败
 */
gpioKey.deinit = function () {
	gpioKeyObj.unRegisterCb("gpioKeyCb")
	return gpioKeyObj.deinit()
}

/**
 * Provjera da li je red poruka gpioKey-a prazan
 * @returns true:成功,false:失败
 */
gpioKey.msgIsEmpty = function () {
	return gpioKeyObj.msgIsEmpty()
}

/**
 * Čitanje podataka iz reda poruka gpioKey-a
 * @returns JSON objekat poruke, format: {"code":30,"type":1,"value":1}
 */
gpioKey.msgReceive = function () {
	let msg = gpioKeyObj.msgReceive()
	return JSON.parse(msg);
}

gpioKey.RECEIVE_MSG = '__gpioKey__MsgReceive'

/**
 * Pojednostavljuje upotrebu gpiokey komponente, nema potrebe za prozivanjem (polling) radi dobijanja podataka, podaci će biti poslani putem eventbus-a.
 * 'run' se izvršava samo jednom.
 * Ako trebate dobijati podatke u realnom vremenu, možete se pretplatiti na događaj eventbus-a. Topic događaja je GPIO_KEY, a sadržaj događaja je sličan {"code":30,"type":1,"value":1}.
 * Gdje je 'code' identifikator GPIO-a, koji označava koji GPIO ima ulaz. Vrijednost 'value' može biti samo 0 ili 1, obično predstavljajući niski i visoki nivo.
 * 'type' je tip događaja, koji slijedi standardne Linux ulazne specifikacije. Slijedi nekoliko uobičajenih:
	(0x01): Događaj tastera, uključujući sve događaje tastature i dugmadi. Na primjer, kada se pritisne ili otpusti taster na tastaturi, prijavit će se ovakav događaj.
	(0x05): Događaj prekidača, na primjer, prekidač poklopca laptopa može prijaviti stanje otvorenosti/zatvorenosti.
	(0x11): LED događaj, koristi se za kontrolu LED indikatora na uređaju.
	(0x12): Zvučni događaj, koristi se za kontrolu zvučnog izlaza na uređaju.
	(0x16): Događaj napajanja, može se koristiti za prijavu događaja dugmeta za napajanje ili niske baterije.
 * 
 */
gpioKey.run = function () {
	bus.newWorker("__gpiokey", '/app/code/dxmodules/gpioKeyWorker.js')
}

/**
 * Ako gpioKey radi u zasebnoj niti, možete direktno koristiti funkciju 'run', koja će automatski pokrenuti nit.
 * Ako želite da ga dodate u postojeću nit, možete koristiti sljedeće enkapsulirane funkcije.
 */
gpioKey.worker = {
	//Prije while petlje
	beforeLoop: function () {
		gpioKey.init()
	},
	//Unutar while petlje
	loop: function () {
		if (!gpioKey.msgIsEmpty()) {
			let res = gpioKey.msgReceive();
			bus.fire(gpioKey.RECEIVE_MSG, res)
		}
	}
}
export default gpioKey;
