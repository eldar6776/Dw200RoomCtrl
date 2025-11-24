/**
 * Implementira upravljanje svim konfiguracijskim stavkama (ključ/vrijednost) aplikacije:
 * 1. Korisnik treba sačuvati početne konfiguracijske stavke u src/config.json projekta. Format konfiguracijske datoteke treba zadržati format ključ/vrijednost (podržava komentare), a vrijednosti mogu biti samo stringovi i brojevi, na primjer:
 * {
 *      //mqtt relevantna konfiguracija
 *      "mqtt.ip":"192.168.2.3",
 *      "mqtt.port":6199,
 * }
 * 2. Također podržava prilagođene konfiguracijske datoteke. Pri inicijalizaciji se može proslijediti putanja i identifikator prilagođene konfiguracijske datoteke, a taj identifikator je potreban za kasnije čitanje i pisanje podataka.
 * 3. Kada korisnik prvi put koristi ovu komponentu u aplikaciji, potrebno je prvo izvršiti inicijalizaciju (init). Inicijalizacija će sačuvati podatke iz config.json u memoriju, a svako kasnije dohvaćanje će biti iz memorije.
 * 4. Korisnik može čitati i pisati konfiguraciju bilo gdje pomoću get i set.
 * 5. Ako je potrebno izmijeniti vrijednost konfiguracijske stavke i istovremeno je sačuvati u konfiguracijsku datoteku (kako bi nova konfiguracija bila aktivna nakon ponovnog pokretanja), koristite setAndSave.
 * 6. Ako je potrebno vratiti sve zadane konfiguracije, koristite reset.
 */
import * as os from 'os';
import dxMap from './dxMap.js'
import common from './dxCommon.js'
import logger from './dxLogger.js'
import std from './dxStd.js'

const map = dxMap.get("default")

const config = {}
const DEFALUT_OPTIONS = { path: '/app/code/src/config.json', savePath: '/app/data/config/config.json', flag: '___config.' }

/**
 * Inicijalizacija će sačuvati podatke iz config.json ili prilagođene konfiguracijske datoteke u memoriju, a svako kasnije dohvaćanje će biti iz memorije.
 * @param {object} custom Nije obavezno, prilagođena konfiguracijska datoteka
 *          @param {string} custom.path Puna putanja do prilagođene konfiguracijske datoteke
 *          @param {string} custom.flag Identifikator prilagođene konfiguracijske datoteke. Napomena: ako postoji više prilagođenih konfiguracijskih datoteka, ovaj identifikator se ne smije ponavljati.
 */
config.init = function (custom) {
    if (custom) {
        if (!custom.path || !custom.flag) {
            throw new Error('The path and flag for the custom configuration file cannot be empty.')
        }
    }
    let flag = custom ? DEFALUT_OPTIONS.flag + custom.flag + '.' : DEFALUT_OPTIONS.flag;
    const isInited = map.get('___inited' + flag)
    if (isInited) {//Inicijalizira se samo jednom
        return
    }
    let path = custom ? custom.path : DEFALUT_OPTIONS.path
    let savePath = custom ? '/app/data/config/config' + custom.flag + '.json' : DEFALUT_OPTIONS.savePath
    if (!std.exist(path)) {
        throw new Error('The config file not existed:' + path)
    }
    let existed = std.exist(savePath)
    let content = existed ? std.parseExtJSON(std.loadFile(savePath)) : std.parseExtJSON(std.loadFile(path))
    if (!existed) {
        std.saveFile(savePath, JSON.stringify(content))
    }
    for (let [key, value] of Object.entries(content)) {
        map.put(flag + key, value)
    }
    map.put('___inited' + flag, 'ok')
}
/**
 * Dohvati sve konfiguracijske stavke
 * @param {string} flag Identifikator prilagođene konfiguracijske datoteke, može biti prazan. Ako je prazan, vraća sav sadržaj iz zadanog config.json.
 * @returns json对象
 */
config.getAll = function (flag) {
    let _flag = _getFlag(flag)
    let configInfo = {}
    let keys = map.keys().filter(k => k.startsWith(_flag))
    keys.forEach(k => {
        let key = k.substring(_flag.length)
        let val = map.get(k)
        configInfo[key] = val
    })
    return configInfo
}
/**
 * Dohvati konfiguraciju, samo iz mape
 * Ako je konfiguracijska stavka prazna, vraća sve podatke;
 * @param {string} key Konfiguracijska stavka
 * @param {string} flag Identifikator prilagođene konfiguracijske datoteke, može biti prazan. Ako je prazan, vraća vrijednost konfiguracije iz zadanog config.json.
 * @returns 
 */
config.get = function (key, flag) {
    if (!key) {
        return this.getAll(flag);
    }
    let _flag = _getFlag(flag)
    return map.get(_flag + key)
}

/**
 * Ažuriraj konfiguraciju, mijenja samo mapu
 * @param {string} key Konfiguracijska stavka
 * @param {string} value Vrijednost konfiguracije
 * @param {string} flag Identifikator prilagođene konfiguracijske datoteke, može biti prazan, u tom slučaju se odnosi na konfiguraciju u zadanom config.json.
 */
config.set = function (key, value, flag) {
    if (!key || value == null || value == undefined) {
        throw new Error("key or value should not be empty")
    }
    let _flag = _getFlag(flag)
    map.put(_flag + key, value)
}

/**
 * Sprema podatke iz mape na lokalni disk
 * @param {string} flag Identifikator prilagođene konfiguracijske datoteke, može biti prazan, u tom slučaju se odnosi na konfiguraciju u zadanom config.json.
 */
config.save = function (flag) {
    //Spremi
    std.saveFile(_getSavePath(flag), JSON.stringify(this.getAll(flag)))
}

/**
 * Ažuriraj konfiguraciju, mijenja mapu i sprema na lokalni disk
 * @param {string} key Konfiguracijska stavka
 * @param {string} value Vrijednost konfiguracije
 * @param {string} flag Identifikator prilagođene konfiguracijske datoteke, može biti prazan, u tom slučaju se odnosi na konfiguraciju u zadanom config.json.
 */
config.setAndSave = function (key, value, flag) {
    this.set(key, value, flag)
    //Spremi
    std.saveFile(_getSavePath(flag), JSON.stringify(this.getAll(flag)))
}

/**
 * Resetiraj, nakon resetiranja ponovo pokrenite uređaj
 * @param {string} flag Identifikator prilagođene konfiguracijske datoteke, može biti prazan, u tom slučaju se odnosi na konfiguraciju u zadanom config.json.
 */
config.reset = function (flag) {
    common.systemBrief('rm -rf ' + _getSavePath(flag))
}

//-------------------private-------------------------------

function _getFlag(flag) {
    return flag ? DEFALUT_OPTIONS.flag + flag + '.' : DEFALUT_OPTIONS.flag
}
function _getSavePath(flag) {
    return flag ? '/app/data/config/config' + flag + '.json' : DEFALUT_OPTIONS.savePath
}
export default config;