//build:20240626
//Koristite ovu komponentu za konfiguraciju mreže i praćenje promjena statusa mreže.
//Zavisne komponente: dxMap, dxLogger, dxDriver, dxEventBus
import dxMap from './dxMap.js'
import bus from './dxEventBus.js'
import { netClass } from './libvbar-m-dxnet.so'
const netObj = new netClass();
const map = dxMap.get("default")

const net = {}
net.TYPE = {
    "UNKNOWN": 0,
    "ETHERNET": 1,
    "WIFI": 2,
    "4G": 4
}
net.DHCP = {
    STATIC: 1,
    DYNAMIC: 2,
    WIFI_AP: 3 //WiFi AP hotspot mod
}

/**
 * Inicijalizacija mreže, WiFi ili Ethernet. Ako se ne može povezati na mrežu, automatski će se neprestano pokušavati ponovo, nema potrebe za ponovnim init-om. Međutim, nakon init-a potrebno je prozivati (polling) da bi se dobio status mreže (preko msgReceive).
 * Može se direktno koristiti i pojednostavljena metoda dxNet.run, bez potrebe za prozivanjem.
 * @param {object} options Parametri za inicijalizaciju mreže
 *       @param {number} type Obavezno, tip mreže, pogledajte enumeraciju net.TYPE
 *       @param {number} dhcp Obavezno, DHCP, pogledajte enumeraciju net.DHCP
 *       @param {string} macAddr Obavezno, MAC adresa, zadano se koristi metoda dxCommon.getUuid2mac() za dobijanje MAC adrese
 *       @param {string} ip Nije obavezno, IP adresa mreže
 *       @param {string} gateway Nije obavezno, adresa mrežnog prolaza (gateway)
 *       @param {string} netmask Nije obavezno, mrežna maska (subnet mask)
 *       @param {string} dns0 Nije obavezno, DNS adresa
 *       @param {string} dns1 Nije obavezno, alternativna DNS adresa
 * @returns 
 */
net.init = function (options) {
    let ret = netObj.init()
    if (!ret) {
        return false
    }
    if (!options) {
        throw new Error("dxNet.init: 'options' parameter should not be null or empty")
    }
    ret = netObj.setMasterCard(options.type)
    if (!ret) {
        return false
    }
    netObj.setMacaddr(options.type, options.macAddr)
    ret = netObj.cardEnable(options.type, true)
    if (!ret) {
        return false
    }
    if (options.dhcp === 1) {
        return netObj.setModeByCard(options.type, 1, {
            ip: options.ip,
            gateway: options.gateway,
            netmask: options.netmask,
            dns0: options.dns0,
            dns1: options.dns1,
        })
    } else if (options.dhcp === 2) {
        return netObj.setModeByCard(options.type, options.dhcp)
    }
    return false
}

/**
 * Dobijanje MAC adrese
 * @param {number} type  Obavezno, tip mreže, pogledajte enumeraciju net.TYPE
 * @returns   MAC adresa
 */
net.getMacaddr = function (type) {
    return netObj.getMacaddr(type)
}
/**
 * Postavljanje MAC adrese
 * @param {number} type  Obavezno, tip mreže, pogledajte enumeraciju net.TYPE
 * @param {string} addr  MAC adresa, obavezno, format sličan b2:a1:63:3f:99:b6
 * @returns   true: uspjeh, false: neuspjeh
 */
net.setMacaddr = function (type, addr) {
    if (type === null || type === undefined) {
        throw new Error("dxNet.setMacaddr:'type' paramter should not be null or empty")
    }
    if (addr === null || addr === undefined || addr.length < 1) {
        throw new Error("dxNet.setMacaddr:'addr' paramter should not be null or empty")
    }
    return netObj.setMacaddr(type, addr)
}
/**
 * Omogućavanje mrežne kartice i dodavanje u modul za upravljanje mrežom
 * @param {number} type  Obavezno, tip mreže, pogledajte enumeraciju net.TYPE
 * @param {boolean} on  Uključeno/Isključeno
 * @returns   0: uspjeh, <0: neuspjeh
 */
net.cardEnable = function (type, on) {
    if (type === null || type === undefined) {
        throw new Error("dxNet.cardEnable: 'type' parameter should not be null or empty")
    }
    if (on === null) {
        throw new Error("dxNet.cardEnable: 'on' parameter should not be null or empty")
    }
    return netObj.cardEnable(type, on)
}
/**
 * Uništavanje net mreže
 * @return true: uspjeh, false: neuspjeh
 */
net.exit = function () {
    return netObj.exit()
}
/**
 * Postavljanje načina rada i odgovarajućih mrežnih parametara za određenu mrežnu karticu
 * @param {number} type   Obavezno, tip mreže, pogledajte enumeraciju net.TYPE
 * @param {number} mode   Obavezno, DHCP, pogledajte enumeraciju net.DHCP
 * @param {object} param  Mrežni parametri
 * @return true: uspjeh, false: neuspjeh
 */
net.setModeByCard = function (type, mode, param) {
    if (type === null || type === undefined) {
        throw new Error("dxNet.setModeByCard: 'type' parameter should not be null or empty")
    }
    if (mode === null) {
        throw new Error("dxNet.setModeByCard:'mode' parameter should not be null or empty")
    }
    return netObj.setModeByCard(type, mode, param)
}
/**
 * Dobijanje načina rada i odgovarajućih mrežnih parametara za određenu mrežnu karticu
 * @param {number} type  Obavezno, tip mreže, pogledajte enumeraciju net.TYPE
 * @returns   Ako je statički mrežni način rada, vratit će informacije kao što su IP, gateway, itd.
 */
net.getModeByCard = function (type) {
    if (type === null || type === undefined) {
        throw new Error("dxNet.getModeByCard: 'type' parameter should not be null or empty")
    }

    return netObj.getModeByCard(type)
}
/**
 * Postavljanje glavne mrežne kartice. Status mreže aplikacije određuje se prema ovoj mrežnoj kartici.
 * @param {number} type  Obavezno, tip mreže, pogledajte enumeraciju net.TYPE
 * @returns    true: uspjeh, false: neuspjeh
 */
net.setMasterCard = function (type) {
    if (type === null || type === undefined) {
        throw new Error("dxNet.setMasterCard: 'type' parameter should not be null or empty")
    }
    return netObj.setMasterCard(type)
}
/**
 * Dobijanje glavne mrežne kartice
 * @returns   >0: uspjeh (tip glavne mrežne kartice), <0: neuspjeh
 */
net.getMasterCard = function () {
    return netObj.getMasterCard()
}
/**
 * Dobijanje statusa mreže, slično {"status":4, "connected":true}. Gdje 'status' znači sljedeće:
 *  0,    Neinicijalizirano stanje
    1,    Mrežna kartica je isključena
    2,    Mrežna kartica je uključena
    3,    Mrežni kabl je priključen ili je WiFi povezan na SSID, ali IP adresa nije dodijeljena
    4,    IP adresa je uspješno dodijeljena
    5,    Povezan na određenu uslugu ili se može povezati na WAN putem testa
 * @returns   Status mreže
 */
net.getStatus = function () {
    let status = netObj.getStatus()
    return { "status": status, "connected": status >= 4 }
}
/**
 * Postavljanje statusa mreže
 * @param {number} status Status mreže, obavezno
 * @returns true: uspjeh, false: neuspjeh
 */
net.setStatus = function (status) {
    if (status === null || status === undefined) {
        throw new Error("dxNet.setStatus: 'status' parameter should not be null or empty")
    }
    return netObj.setStatus(status)
}

/**
 * Dobijanje liste WiFi mreža
 * @param {number} timeout Obavezno
 * @param {number} interval Obavezno
 * @returns Lista WiFi mreža
 */
net.netGetWifiSsidList = function (timeout, interval) {
    if (timeout === null || timeout === undefined) {
        throw new Error("dxNet.netGetWifiSsidList: 'timeout' parameter should not be null or empty")
    }
    if (interval === null) {
        throw new Error("dxNet.netGetWifiSsidList: 'interval' parameter should not be null or empty")
    }
    return netObj.netGetWifiSsidList(timeout, interval)
}
/**
 * Povezivanje na WiFi
 * @param {string} ssid Obavezno
 * @param {string} psk Obavezno
 * @param {object} params Obavezno
 * @returns 
 */
net.netConnectWifiSsid = function (ssid, psk, params) {
    if (ssid === null) {
        throw new Error("dxNet.netConnectWifiSsid: 'ssid' parameter should not be null or empty")
    }
    if (psk === null) {
        throw new Error("dxNet.netConnectWifiSsid: 'psk' parameter should not be null or empty")
    }
    if (params === null) {
        throw new Error("dxNet.netConnectWifiSsid: 'params' parameter should not be null or empty")
    }
    return netObj.netConnectWifiSsid(ssid, psk, params)
}
/**
 * Dobijanje liste sačuvanih hotspotova
 * @returns  Lista sačuvanih hotspotova
 */
net.netGetWifiSavedList = function () {
    return netObj.netGetWifiSavedList()
}
/**
 * Prekidanje veze sa trenutno povezanim WiFi hotspotom
 * @returns  
 */
net.netDisconnetWifi = function () {
    return netObj.netDisconnetWifi()
}
/**
 * Dobijanje informacija o trenutnom hotspotu
 * @param {number} timeout Obavezno
 * @returns  
 */
net.netGetCurrentWifiInfo = function (timeout) {
    if (timeout === null) {
        throw new Error("dxNet.netGetCurrentWifiInfo: 'timeout' parameter should not be null or empty")
    }
    return netObj.netGetCurrentWifiInfo(timeout)
}

/**
 * Provjera da li je red poruka prazan
 * @returns true ako je prazan, false ako nije
 */
net.msgIsEmpty = function () {
    return netObj.msgIsEmpty()
}
/**
 * Uzimanje podataka o trenutnom statusu mreže iz reda poruka. Vraća strukturu sličnu {"type":1, "status":4, "connected":true}.
 * Gdje 'type' odgovara enumeraciji net.TYPE.
 * Značenje vrijednosti 'status' je sljedeće:
 *  0,    Neinicijalizirano stanje
    1,    Mrežna kartica je isključena
    2,    Mrežna kartica je uključena
    3,    Mrežni kabl je priključen ili je WiFi povezan na SSID, ali IP adresa nije dodijeljena
    4,    IP adresa je uspješno dodijeljena
    5,    Povezan na određenu uslugu ili se može povezati na WAN putem testa
 * @returns   Podaci poruke u obliku stringa
 */
net.msgReceive = function () {
    let res = JSON.parse(netObj.msgReceive());
    if (res.status >= 4) {
        res.connected = true
    } else {
        res.connected = false
    }
    return res
}

net.STATUS_CHANGE = '__netstatus__changed'

/**
 * Pojednostavljuje upotrebu mrežne komponente. Nema potrebe za prozivanjem (polling) radi dobijanja statusa mreže; status mreže će biti poslan putem eventBus-a.
 * 'run' se izvršava samo jednom, nakon čega se osnovna mrežna konfiguracija ne može mijenjati.
 * Ako trebate dobijati promjene statusa mreže u realnom vremenu, možete se pretplatiti na događaj eventBus-a. Topic događaja je net.STATUS_CHANGE, a sadržaj događaja je sličan {"type":1, "status":4, "connected":true}.
 * Gdje 'type' odgovara enumeraciji net.TYPE.
 * Značenje vrijednosti 'status' je sljedeće:
 *  0,    Neinicijalizirano stanje
    1,    Mrežna kartica je isključena
    2,    Mrežna kartica je uključena
    3,    Mrežni kabl je priključen ili je WiFi povezan na SSID, ali IP adresa nije dodijeljena
    4,    IP adresa je uspješno dodijeljena
    5,    Povezan na određenu uslugu ili se može povezati na WAN putem testa
 * @param {object} options Pogledajte opis opcija u init funkciji
 */
net.run = function (options) {
    if (options === undefined || options.length === 0) {
        throw new Error("dxnet.run:'options' parameter should not be null or empty")
    }
    let workerFile = '/app/code/dxmodules/netWorker.js'
    let init = map.get("__net__run_init")
    if (!init) {//Osigurajte da se inicijalizira samo jednom
        map.put("__net__run_init", options)
        bus.newWorker('__net', workerFile)
    }
}

/**
 * Ako 'net' radi u zasebnoj niti, možete direktno koristiti funkciju 'run', koja će automatski pokrenuti nit.
 * Ako želite da ga dodate u postojeću nit, možete koristiti sljedeće enkapsulirane funkcije.
 */
net.worker = {
    //Prije while petlje
    beforeLoop: function (options) {
        net.init(options)
    },
    //Unutar while petlje
    loop: function () {
        if (!net.msgIsEmpty()) {
            let res = net.msgReceive();
            if (res.status >= 4) {
                res.connected = true
            } else {
                res.connected = false
            }
            bus.fire(net.STATUS_CHANGE, res)
        }
    }
}

export default net;
