//build: 20240525
// Dependent components:dxCommon
import { sqliteClass } from './libvbar-m-dxsqlite.so'
import dxCommon from './dxCommon.js'
const sqliteObj = new sqliteClass();
const sqlite = {}

/**
 * initializeddata library
 * @param {string} path db file full path, required
 * @param {string} id handleid, not required (if you initialize multiple instances, you need to pass in a unique id)
 */
sqlite.init = function (path, id) {
    if (path == undefined || path.length == 0) {
        throw new Error("dxsqliteObj.initDb:path should not be null or empty")
    }
    let pointer = sqliteObj.open(path);
    dxCommon.handleId("sqlite", id, pointer)
}

/**
 * Execute statement
 * @param {string} sql script statement, required
 * @param {string} id handleid, not required (must match the id in init)
 * @returns 0:success, not 0failed
 */
sqlite.exec = function (sql, id) {
    let pointer = dxCommon.handleId("sqlite", id)
    return sqliteObj.sql_exec(pointer, sql)
}


/**
 * Execute query statement
 * @param {string} sql script statement, required
 * @param {string} id handleid, not required (must match the id in init)
 * @@returns The query result is in the form: [{"id":"1","type":200,"code":"aad7485a","door":"door","extra":"","tiemType":0,"beginTime":171 6613766,"endTime":1716613766,"repeatBeginTime":1716613766,"repeatEndTime":1716613766,"period":"extra"}]
 */
sqlite.select = function (sql, id) {
    let pointer = dxCommon.handleId("sqlite", id)
    return sqliteObj.select(pointer, sql);
}

/**
 * Close data library connect/connection
 * @param {string} id handleid, not required (must match the id in init)
 * @returns 0:success, not 0failed
 */
sqlite.close = function (id) {
    let pointer = dxCommon.handleId("sqlite", id)
    return sqliteObj.close(pointer)
}

export default sqlite;