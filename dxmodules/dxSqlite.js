//build: 20240525
//Zavisne komponente: dxCommon
import { sqliteClass } from './libvbar-m-dxsqlite.so'
import dxCommon from './dxCommon.js'
const sqliteObj = new sqliteClass();
const sqlite = {}

/**
 * Inicijalizacija baze podataka
 * @param {string} path Puna putanja do .db datoteke, obavezno
 * @param {string} id ID rukovatelja, nije obavezno (ako se inicijalizira više instanci, potrebno je unijeti jedinstveni ID)
 */
sqlite.init = function (path, id) {
    if (path == undefined || path.length == 0) {
        throw new Error("dxsqliteObj.initDb:path should not be null or empty")
    }
    let pointer = sqliteObj.open(path);
    dxCommon.handleId("sqlite", id, pointer)
}

/**
 * Izvršavanje naredbe
 * @param {string} sql SQL naredba, obavezno
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns 0:成功，非0失败
 */
sqlite.exec = function (sql, id) {
    let pointer = dxCommon.handleId("sqlite", id)
    return sqliteObj.sql_exec(pointer, sql)
}


/**
 * Izvršavanje upita
 * @param {string} sql SQL upit, obavezno
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns Rezultat upita, u obliku: [{"id":"1","type":200,"code":"aad7485a","door":"Glavna vrata","extra":"","tiemType":0,"beginTime":1716613766,"endTime":1716613766,"repeatBeginTime":1716613766,"repeatEndTime":1716613766,"period":"extra"}]
 */
sqlite.select = function (sql, id) {
    let pointer = dxCommon.handleId("sqlite", id)
    return sqliteObj.select(pointer, sql);
}

/**
 * Zatvaranje veze sa bazom podataka
 * @param {string} id ID rukovatelja, nije obavezno (mora biti isti kao ID u init funkciji)
 * @returns 0:成功，非0失败
 */
sqlite.close = function (id) {
    let pointer = dxCommon.handleId("sqlite", id)
    return sqliteObj.close(pointer)
}

export default sqlite;