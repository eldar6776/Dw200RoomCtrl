//build:20240411
//Koristi MQTT protokol za komunikaciju sa MQTT serverom ili preko MQTT brokera za komunikaciju sa drugim MQTT klijentima.
//Zavisne komponente: dxMap, dxLogger, dxDriver, dxCommon, dxEventBus, dxNet
import { mqttClass } from './libvbar-m-dxmqtt.so'
import * as os from "os"
import std from './dxStd.js'
import dxMap from './dxMap.js'
import dxCommon from './dxCommon.js'
import bus from './dxEventBus.js'
const map = dxMap.get("default")
const mqttObj = new mqttClass();
const mqtt = {}
/**
 * Inicijalizira MQTT relevantne atribute i uspostavlja vezu. Molimo koristite dxMqtt komponentu unutar workera ili koristite pojednostavljenu funkciju dxMqtt.run.
 * @param {string} mqttAddr Adresa MQTT servera, obavezno, počinje sa tcp://, format je tcp://ip:port
 * @param {string} clientId ID klijenta, obavezno, različiti uređaji trebaju koristiti različite ID-ove klijenata
 * @param {string} username Nije obavezno, MQTT korisničko ime
 * @param {string} password Nije obavezno, MQTT lozinka
 * @param {string} prefix Nije obavezno, zadano je prazan string, ovo označava automatsko dodavanje prefiksa ispred teme
 * @param {number} qos 0,1,2 Nije obavezno, zadano je 1. Gdje 0 znači da se poruka šalje najviše jednom, nakon slanja poruka se odbacuje; 1 znači da se poruka šalje najmanje jednom, što može osigurati da primalac primi poruku, ali može doći do primanja duplih poruka; 2 znači da je poruka uspješno poslana i to samo jednom, što zahtijeva više resursa.
 * @param {string} willTopic Nije obavezno, tema oporuke (last will), kada se komunikacija odvija preko brokera, prekid veze uređaja automatski će pokrenuti MQTT poruku oporuke, ovo je tema te poruke.
 * @param {string} willMessage Nije obavezno, sadržaj oporuke, kada se komunikacija odvija preko brokera, prekid veze uređaja automatski će pokrenuti MQTT poruku oporuke, ovo je sadržaj te poruke.
 * @param {string} id ID rukovatelja, nije obavezno (ako se inicijalizira više instanci, potrebno je unijeti jedinstveni ID)
 */
mqtt.init = function (mqttAddr, clientId, username, password, prefix = "", qos = 1, willTopic, willMessage, id) {

    if (mqttAddr === undefined || mqttAddr.length === 0) {
        throw new Error("dxMqtt.init: 'mqttAddr' parameter should not be null or empty")
    }
    if (clientId === undefined || clientId.length === 0) {
        throw new Error("dxMqtt.init: 'clientId' parameter should not be null or empty")
    }
    let pointer = mqttObj.init(mqttAddr, clientId, username, password, prefix, qos, willTopic, willMessage);
    if (pointer === undefined || pointer === null) {
        throw new Error("dxMqtt.init: mqtt init failed")
    }

    dxCommon.handleId("mqtt", id, pointer)
}

/**
 * Ponovno povezivanje. Na primjer, ako se veza iznenada prekine nakon uspješnog povezivanja, nije potrebno ponovo inicijalizirati, već se može direktno ponovo povezati.
 * @param {string} willTopic Nije obavezno, tema oporuke (last will), kada se komunikacija odvija preko brokera, prekid veze uređaja automatski će pokrenuti MQTT poruku oporuke, ovo je tema te poruke.
 * @param {string} willMessage Nije obavezno, sadržaj oporuke, kada se komunikacija odvija preko brokera, prekid veze uređaja automatski će pokrenuti MQTT poruku oporuke, ovo je sadržaj te poruke.
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 */
mqtt.reconnect = function (willTopic, willMessage, id) {
    let pointer = dxCommon.handleId("mqtt", id)
    return mqttObj.recreate(pointer, willTopic, willMessage);
}

/**
 * Pretplata na više tema
 * @param {array} topics Obavezno, niz tema na koje se želite pretplatiti, možete se pretplatiti na više tema istovremeno.
 * @param {number} qos Nije obavezno, zadano je 1. Gdje 0 znači da se poruka šalje najviše jednom, nakon slanja poruka se odbacuje; 1 znači da se poruka šalje najmanje jednom, što može osigurati da primalac primi poruku, ali može doći do primanja duplih poruka; 2 znači da je poruka uspješno poslana i to samo jednom, što zahtijeva više resursa.
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns 
 */
mqtt.subscribes = function (topics, qos, id) {
    if (topics === undefined || topics.length === 0) {
        throw new Error("dxMqtt.subscribes: 'topics' parameter should not be null or empty")
    }

    if (qos === undefined) {
        qos = 1
    }
    let pointer = dxCommon.handleId("mqtt", id)
    return mqttObj.subscribes(pointer, topics, qos);
}

/**
 * Provjerava da li je MQTT povezan. Nakon uspješnog povezivanja, ako se mreža prekine, veza će također biti prekinuta.
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns false失败； true成功
 */
mqtt.isConnected = function (id) {
    let pointer = dxCommon.handleId("mqtt", id)
    return mqttObj.isConnected(pointer);
}

/**
 * Upit za MQTT konfiguraciju
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns MQTT konfiguracija
 */
mqtt.getConfig = function (id) {
    let pointer = dxCommon.handleId("mqtt", id)
    return mqttObj.getConfig(pointer);
}

/**
 * Ažuriranje MQTT konfiguracije
 * @param {object} options Konfiguracijski parametri, većina može koristiti zadane vrijednosti
 *      @param {string} options.mqttAddr Adresa MQTT servera, obavezno, počinje sa tcp://, format je tcp://ip:port
 *      @param {string} options.clientId ID klijenta, obavezno, različiti uređaji trebaju koristiti različite ID-ove klijenata
 *      @param {string} options.userName Nije obavezno, MQTT korisničko ime
 *      @param {string} options.password Nije obavezno, MQTT lozinka
 *      @param {string} options.prefix Nije obavezno, zadano je prazan string, ovo označava automatsko dodavanje prefiksa ispred teme
 *      @param {number} options.qos 0,1,2 Nije obavezno, zadano je 1. Gdje 0 znači da se poruka šalje najviše jednom, nakon slanja poruka se odbacuje; 1 znači da se poruka šalje najmanje jednom, što može osigurati da primalac primi poruku, ali može doći do primanja duplih poruka; 2 znači da je poruka uspješno poslana i to samo jednom, što zahtijeva više resursa.
 *      @param {string} options.ssl Nije obavezno, klasa za SSL konfiguraciju
 */
mqtt.updateConfig = function (options, id) {
    if (!options) {
        throw new Error("dxMqtt.updateConfig: 'options' parameter should not be null or empty")
    }
    if (options.mqttAddr === undefined || options.mqttAddr.length === 0) {
        throw new Error("dxMqtt.updateConfig: 'options.mqttAddr' parameter should not be null or empty")
    }
    if (options.clientId === undefined || options.clientId.length === 0) {
        throw new Error("dxMqtt.updateConfig: 'options.clientId' parameter should not be null or empty")
    }
    if (options.qos === undefined || options.qos == null) {
        throw new Error("dxMqtt.updateConfig: 'options.qos' parameter should not be null or empty")
    }
    let pointer = dxCommon.handleId("mqtt", id)
    let res = mqttObj.setConfig(pointer, options);
    return res;
}

/**
 * Slanje MQTT zahtjeva
 * @param {string} topic Tema, obavezno
 * @param {string} payload Sadržaj tijela poruke, obavezno
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 */
mqtt.send = function (topic, payload, id) {
    if (topic === undefined || topic.length === 0) {
        throw new Error("dxMqtt.send:'topic' parameter should not be null or empty")
    }
    if (payload === undefined || payload.length === 0) {
        throw new Error("dxMqtt.send:'payload' parameter should not be null or empty")
    }
    let pointer = dxCommon.handleId("mqtt", id)
    return mqttObj.sendMsg(pointer, topic, payload);
}

/**
 * Primanje MQTT podataka, potrebno je prozivanje (polling) za dobijanje.
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @return MQTT podaci zahtjeva, struktura je: {topic:'Tema',payload:'Sadržaj'}
 */
mqtt.receive = function (id) {
    let msg = mqttObj.msgReceive(id);
    return JSON.parse(msg);
}

/**
 * Provjerava da li ima novih podataka. Obično se prvo provjeri da li ima podataka, a zatim se poziva 'receive' za dobijanje podataka.
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns false 有数据；true 没有数据
 */
mqtt.msgIsEmpty = function (id) {
    return mqttObj.msgIsEmpty(id);
}

/**
 * Uništavanje MQTT instance
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 */
mqtt.destroy = function (id) {
    let pointer = dxCommon.handleId("mqtt", id)
    mqttObj.deinit(pointer);
}

mqtt.RECEIVE_MSG = '__mqtt__MsgReceive'
mqtt.CONNECTED_CHANGED = '__mqtt__Connect_changed'
mqtt.RECONNECT = '__mqtt__Reconnect'

/**
 * Implementira MQTT klijenta na jednostavan način. Potrebno je samo pozvati ovu funkciju da bi se implementirao MQTT klijent.
 * Primljena poruka će pokrenuti slanje događaja na dxEventBus. Tema događaja je mqtt.RECEIVE_MQTT_MSG, a sadržaj je u formatu {topic:'',payload:''}.
 * Ako trebate poslati poruku, direktno koristite metodu mqtt.send. Format podataka koje MQTT šalje je sličan: { topic: "sendtopic1", payload: JSON.stringify({ a: i, b: "ssss" }) }.
 * Promjena statusa MQTT veze će pokrenuti slanje događaja na dxEventBus. Tema događaja je mqtt.CONNECTED_CHANGED, a sadržaj je 'connected' ili 'disconnect'.
 * MQTT zahtijeva mrežu, stoga je neophodno osigurati da je dxNet komponenta inicijalizirana prije upotrebe.
 * @param {object} options MQTT relevantni parametri, obavezno
 *      @param {string} options.mqttAddr Adresa MQTT servera, obavezno, počinje sa tcp://, format je tcp://ip:port
 *      @param {string} options.clientId ID klijenta, obavezno, različiti uređaji trebaju koristiti različite ID-ove klijenata
 *      @param {string} options.username Nije obavezno, MQTT korisničko ime
 *      @param {string} options.password Nije obavezno, MQTT lozinka
 *      @param {string} options.prefix Nije obavezno, zadano je prazan string, ovo označava automatsko dodavanje prefiksa ispred teme
 *      @param {number} options.qos 0,1,2 Nije obavezno, zadano je 1. Gdje 0 znači da se poruka šalje najviše jednom, nakon slanja poruka se odbacuje; 1 znači da se poruka šalje najmanje jednom, što može osigurati da primalac primi poruku, ali može doći do primanja duplih poruka; 2 znači da je poruka uspješno poslana i to samo jednom, što zahtijeva više resursa.
 *      @param {string} options.willTopic Nije obavezno, tema oporuke (last will), kada se komunikacija odvija preko brokera, prekid veze uređaja automatski će pokrenuti MQTT poruku oporuke, ovo je tema te poruke.
 *      @param {string} options.willMessage Nije obavezno, sadržaj oporuke, kada se komunikacija odvija preko brokera, prekid veze uređaja automatski će pokrenuti MQTT poruku oporuke, ovo je sadržaj te poruke.
 *      @param {array}  options.subs Nije obavezno, grupa tema na koje se želite pretplatiti
 *      @param {string} options.id  ID rukovatelja, nije obavezno (ako se inicijalizira više instanci, potrebno je unijeti jedinstveni ID)
 */
mqtt.run = function (options) {
    if (options === undefined || options.length === 0) {
        throw new Error("dxmqtt.run:'options' parameter should not be null or empty")
    }
    if (options.id === undefined || options.id === null || typeof options.id !== 'string') {
        // ID rukovatelja
        options.id = ""
    }
    let oldfilepre = '/app/code/dxmodules/mqttWorker'
    let content = std.loadFile(oldfilepre + '.js').replace("{{id}}", options.id)
    let newfile = oldfilepre + options.id + '.js'
    std.saveFile(newfile, content)
    let init = map.get("__mqtt__run_init" + options.id)
    if (!init) {//Osigurajte da se inicijalizira samo jednom
        map.put("__mqtt__run_init" + options.id, options)
        bus.newWorker(options.id || "__mqtt", newfile)
    }
}
/**
 * Dobijanje trenutnog statusa MQTT veze
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns 'connected' 或者 'disconnected'
 */
mqtt.getConnected = function (id) {
    if (id == undefined || id == null) {
        id = ""
    }
    return mqtt.isConnected(id) ? "connected" : "disconnected"
}

export default mqtt;
