import sqliteObj from '../../dxmodules/dxSqlite.js'
import common from '../../dxmodules/dxCommon.js'
import std from '../../dxmodules/dxStd.js'
//-------------------------variable-------------------------

const sqliteService = {}
//-------------------------public-------------------------

//Inicijalizacija baze podataka
sqliteService.init = function (path) {
    if (!path) {
        throw ("path should not be null or empty")
    }
    let newPath = getLastSegment(path)
    if (newPath) {
        std.mkdir(newPath)
    }

    sqliteObj.init(path)
    let passRecordSql = `CREATE TABLE IF NOT EXISTS d1_pass_record (
        id VARCHAR(128),
        type VARCHAR(128),
        code VARCHAR(128),
        door VARCHAR(10),
        time bigint,
        result bigint,
        extra TEXT,
        message TEXT )`
    let execPassRecordSql = sqliteObj.exec(passRecordSql)
    if (execPassRecordSql != 0) {
        throw ("d1_pass_Record creation exception:" + execPassRecordSql)
    }
    let permissionSql = `CREATE TABLE IF NOT EXISTS d1_permission (
        id VARCHAR(128) PRIMARY KEY,
        type bigint,
        code VARCHAR(128),
        door VARCHAR(10),
        extra TEXT,
        tiemType bigint,
        beginTime bigint,
        endTime bigint,
        repeatBeginTime bigint,
        repeatEndTime bigint,
        period TEXT ) `
    let execpermissionSql = sqliteObj.exec(permissionSql)
    if (execpermissionSql != 0) {
        throw ("Table permissionSql creation exception" + execpermissionSql)
    }
    //Kreiranje indeksa
    sqliteObj.exec('CREATE INDEX idx_code ON d1_permission (code)')
    let securitySql = `create table if not exists d1_security(
        id VARCHAR(128) PRIMARY KEY,
        type VARCHAR(128),
        key VARCHAR(128),
        value TEXT,
        startTime bigint,
        endTime bigint )`
    let execSecuritySql = sqliteObj.exec(securitySql)
    if (execSecuritySql != 0) {
        throw ("The securitySql table is not created properly" + execSecuritySql)
    }
}
//Dobijanje metode
sqliteService.getFunction = function () {
    return funcs(sqliteObj)
}
function funcs (sqliteObj) {
    const dbFuncs = {}
    //Tabela ovlaštenja: metoda za upit svih ovlaštenja sa paginacijom
    dbFuncs.permissionFindAll = function (page, size, code, type, id, index) {
        return permissionFindAllPage(page, size, code, type, id, index, sqliteObj)
    }
    //Tabela ovlaštenja: uslovni upit
    dbFuncs.permissionFindAllByCodeAndType = function (code, type, id, index) {
        return selectPermission(sqliteObj, code, type, id, index)
    }
    //Tabela ovlaštenja: upit za ukupan broj redova
    dbFuncs.permissionFindAllCount = function () {
        return sqliteObj.select('SELECT COUNT(*) FROM d1_permission')
    }
    //Tabela ovlaštenja: provjera mogućnosti prolaska na osnovu vrijednosti akreditiva i tipa
    dbFuncs.permissionVerifyByCodeAndType = function (code, type, index) {
        let permissions = selectPermission(sqliteObj, code)
        //Umetanje koda i tipa zajedno je sporo, pa se tip provjerava nakon zasebnog upita
        let filteredData = permissions.filter(obj => obj.type == type);
        if (!filteredData && filteredData.length <= 0) {
            //Nema ovlaštenja
            return false
        }
        //Obrada da li je unutar vremenskog perioda ovlaštenja
        //Ovdje će biti slučaj da ovlaštenje nije unutar vremenskog perioda, potrebno je definisati da li treba vratiti odgovarajući tekst
        try {
            return judgmentPermission(filteredData)
        } catch (error) {
            console.log('校验权限时间报错，错误内容为', error.stack);
            return false
        }

    }
    //Tabela ovlaštenja: dodavanje novog ovlaštenja
    dbFuncs.permisisonInsert = function (datas) {
        //Sastavljanje SQL-a za dodavanje novog ovlaštenja
        let sql = insertSql(datas)
        let res = sqliteObj.exec(sql.substring(0, sql.length - 1))
        if (res != 0) {
            //Došlo je do greške pri dodavanju
            //0. Grupni upit na osnovu ID-ova
            let ids = datas.map(obj => obj.id);
            let findAllByIds = sqliteObj.select("select * from d1_permission where id in (" + ids.map(item => `'${item}'`).join(',') + ")")
            if (findAllByIds.length == 0) {
                //Ako nije pronađeno, direktno vrati neuspjeh
                throw ("Parameter error Please check and try again")
            }

            //Brisanje
            let deleteIds = findAllByIds.map(obj => obj.id);
            res = sqliteObj.exec("delete from d1_permission where id in (" + deleteIds.map(item => `'${item}'`).join(',') + ")")
            if (res != 0) {
                throw ("Failed to add - Failed to delete permissions in the first step")
            }
            //Ponovno dodavanje
            res = sqliteObj.exec(sql.substring(0, sql.length - 1))
            if (res != 0) {
                throw ("Failed to add - Failed to add permissions in step 2")
            }
        }
        return res
    }
    
    // Add single permission (simplified version for test data)
    dbFuncs.permissionAdd = function (data) {
        // Generisanje jedinstvenog ID-a
        var id = 'perm_' + Date.now() + '_' + Math.random().toString(36).substring(7);
        var extraStr = data.extra || '{}';
        
        // Build SQL INSERT
        var sql = "INSERT INTO d1_permission (id, type, code, door, extra, tiemType, beginTime, endTime, repeatBeginTime, repeatEndTime, period) " +
                  "VALUES ('" + id + "', " + data.type + ", '" + data.code + "', '', '" + extraStr + "', 0, " + data.startTime + ", " + data.endTime + ", 0, 0, '')";
        
        var res = sqliteObj.exec(sql);
        if (res != 0) {
            throw ("Failed to add permission: " + res);
        }
        return res;
    }
    //Tabela ovlaštenja: brisanje na osnovu ID-a
    dbFuncs.permisisonDeleteByIdIn = function (ids) {
        verifyData({ "ids": ids })
        return sqliteObj.exec("delete from d1_permission where id in (" + ids.map(item => `'${item}'`).join(',') + ")")
    }
    
    //Tabela ovlaštenja: brisanje na osnovu type i code
    dbFuncs.permissionDeleteByTypeAndCode = function (type, code) {
        verifyData({ "type": type, "code": code })
        return sqliteObj.exec(`DELETE FROM d1_permission WHERE type = ${type} AND code = '${code}'`)
    }

    //Tabela ovlaštenja: brisanje svih ovlaštenja
    dbFuncs.permissionClear = function () {
        return sqliteObj.exec('delete FROM d1_permission')
    }
    //Tabela ovlaštenja: upit za ukupan broj redova
    dbFuncs.permissionFindAllCount = function () {
        return sqliteObj.select('SELECT COUNT(*) FROM d1_permission')
    }
    //Tabela zapisa o pristupu: upit za ukupan broj redova
    dbFuncs.passRecordFindAllCount = function () {
        return sqliteObj.select('SELECT COUNT(*) FROM d1_pass_record')
    }
    //Tabela zapisa o pristupu: upit za sve
    dbFuncs.passRecordFindAll = function () {
        return sqliteObj.select('SELECT * FROM d1_pass_record')
    }
    //Tabela zapisa o pristupu: brisanje na osnovu vremena
    dbFuncs.passRecordDeleteByTimeIn = function (times) {
        verifyData({ "times": times })
        return sqliteObj.exec("delete from d1_pass_record where time in (" + times.map(item => `${item}`).join(',') + ")")
    }
    //Tabela zapisa o pristupu: brisanje svih
    dbFuncs.passRecordClear = function () {
        return sqliteObj.exec("delete from d1_pass_record ")
    }
    //Tabela zapisa o pristupu: brisanje zapisa na osnovu ID-a
    dbFuncs.passRecordDeleteById = function (id) {
        verifyData({ "id": id })
        return sqliteObj.exec("delete from d1_pass_record where  id = '" + id + "'")
    }

    //Tabela zapisa o pristupu: brisanje posljednjeg zapisa
    dbFuncs.passRecordDelLast = function () {
        return sqliteObj.exec("DELETE FROM d1_pass_record WHERE time = (SELECT MIN(time) FROM d1_pass_record LIMIT 1);")
    }
    //Tabela zapisa o pristupu: dodavanje novog
    dbFuncs.passRecordInsert = function (data) {
        verifyData(data, ["id", "type", "code", "time", "result", "extra", "message", "index"])
        return sqliteObj.exec("INSERT INTO d1_pass_record values('" + data.id + "','" + data.type + "','" + data.code + "','" + data.index + "'," + data.time + "," + data.result + ",'" + data.extra + "','" + data.message + "' )")

    }
    //Tabela ključeva: uslovni upit
    dbFuncs.securityFindAllByCodeAndTypeAndTimeAndkey = function (code, type, id, time, key, index) {
        return selectSecurity(sqliteObj, code, type, id, time, key, index)
    }
    //Tabela ključeva: upit za sve ključeve sa paginacijom
    dbFuncs.securityFindAll = function (page, size, key, type, id, index) {
        return securityFindAllPage(page, size, key, type, id, index, sqliteObj)
    }
    //Tabela ključeva: dodavanje novog ključa
    dbFuncs.securityInsert = function (datas) {
        let sql = "INSERT INTO d1_security values"
        for (let data of datas) {
            verifyData(data, ["id", "type", "key", "value", "startTime", "endTime"])
            sql += "('" + data.id + "','" + data.type + "','" + data.key + "','" + data.value + "'," + data.startTime + "," + data.endTime + "),"
        }

        let res = sqliteObj.exec(sql.substring(0, sql.length - 1))
        if (res != 0) {
            throw ("入库错误，新增Failed")
        }
        return res
    }
    //Tabela ključeva: brisanje ključa na osnovu ID-a
    dbFuncs.securityDeleteByIdIn = function (ids) {
        verifyData({ "ids": ids })
        return sqliteObj.exec("delete from d1_security where id in (" + ids.map(item => `'${item}'`).join(',') + ")")
    }

    //Tabela ključeva: brisanje svih ključeva
    dbFuncs.securityClear = function () {
        return sqliteObj.exec('delete FROM d1_security')
    }


    return dbFuncs
}

//-------------------------private-------------------------
/**
 * Uslovni upit
 * @param {*} sqliteObj 
 * @param {*} code 
 * @param {*} type 
 * @param {*} id 
 * @returns 
 */
function selectSecurity (sqliteObj, code, type, id, time, key, index) {
    var query = `SELECT * FROM d1_security WHERE 1=1`
    if (code) {
        query += ` AND code = '${code}'`
    }
    if (type) {
        query += ` AND type = '${type}'`
    }
    if (id) {
        query += ` AND id = '${id}'`
    }
    if (index) {
        query += ` AND door = '${index}'`
    }
    if (key) {
        query += ` AND key = '${key}'`
    }
    if (time) {
        query += ` AND endTime >= '${time}'`
    }
    let result = sqliteObj.select(query)
    result = result.map(record => {
        record.startTime = safeBigInt(record.startTime)
        record.endTime = safeBigInt(record.endTime)
        return record
    })
    return result
}
function securityFindAllPage (page, size, key, type, id, index, sqliteObj) {
    // Izgradnja SQL upita
    let query = `SELECT * FROM d1_security WHERE 1=1`
    let where = ''
    if (key) {
        where += ` AND key = '${key}'`
    }
    if (type) {
        where += ` AND type = '${type}'`
    }
    if (id) {
        where += ` AND id = '${id}'`
    }
    // Dobijanje ukupnog broja zapisa
    const totalCountQuery = 'SELECT COUNT(*) AS count FROM d1_security WHERE 1=1 ' + where
    const totalCountResult = sqliteObj.select(totalCountQuery)

    const total = totalCountResult[0].count

    // Izračunavanje ukupnog broja stranica
    const totalPage = Math.ceil(total / size)

    // Izgradnja upita sa paginacijom
    const offset = (page - 1) * size
    query += where
    query += ` LIMIT ${size} OFFSET ${offset}`

    // Izvršavanje upita
    const result = sqliteObj.select(query)
    // Izgradnja povratnog rezultata
    const content = result.map(record => ({
        id: record.id,
        type: record.type,
        key: record.key,
        key: record.key,
        value: record.value,
        startTime: safeBigInt(record.startTime),
        endTime: safeBigInt(record.endTime)
    }))
    return {
        content: content,
        page: page,
        size: size,
        total: parseInt(total),
        totalPage: totalPage,
        count: content.length
    }
}

/**
 * Upit za sva ovlaštenja
 * @param {*} page 
 * @param {*} size 
 * @param {*} code 
 * @param {*} type 
 * @param {*} id 
 * @returns 
 */
function permissionFindAllPage (page, size, code, type, id, index, sqliteObj) {
    // Izgradnja SQL upita
    let query = `SELECT * FROM d1_permission WHERE 1=1`
    let where = ''
    if (code) {
        where += ` AND code = '${code}'`
    }
    if (type) {
        where += ` AND type = ${type}`
    }
    if (id) {
        where += ` AND id = '${id}'`
    }
    if (index) {
        where += ` AND door = '${index}'`
    }
    // Dobijanje ukupnog broja zapisa
    const totalCountQuery = 'SELECT COUNT(*) AS count FROM d1_permission WHERE 1=1' + where

    const totalCountResult = sqliteObj.select(totalCountQuery)


    const total = totalCountResult[0].count || 0

    // Izračunavanje ukupnog broja stranica
    const totalPage = Math.ceil(total / size)

    // Izgradnja upita sa paginacijom
    const offset = page * size
    query += where
    query += ` LIMIT ${size} OFFSET ${offset}`
    // Izvršavanje upita
    let result = sqliteObj.select(query)
    // Izgradnja povratnog rezultata
    let content = result.map(record => ({
        id: record.id,
        type: record.type,
        code: record.code,
        extra: JSON.parse(record.extra),
        time: {
            type: parseInt(record.tiemType),
            beginTime: parseInt(record.timeType) != 2 ? undefined : safeBigInt(record.repeatBeginTime),
            endTime: parseInt(record.timeType) != 2 ? undefined : safeBigInt(record.repeatEndTime),
            range: parseInt(record.tiemType) === 0 ? undefined : { beginTime: safeBigInt(parseInt(record.beginTime)), endTime: safeBigInt(parseInt(record.endTime)) },
            weekPeriodTime: parseInt(record.tiemType) != 3 ? undefined : JSON.parse(record.period)
        }

    }))
    return {
        content: content,
        page: page,
        size: size,
        total: parseInt(total),
        totalPage: totalPage,
        count: content.length
    }
}

/**
 * Uslovni upit
 * @param {*} sqliteObj 
 * @param {*} code 
 * @param {*} type 
 * @param {*} id 
 * @returns 
 */
function selectPermission (sqliteObj, code, type, id, index) {
    var query = `SELECT * FROM d1_permission WHERE 1=1`
    if (code) {
        query += ` AND code = '${code}'`
    }
    if (type) {
        query += ` AND type = '${type}'`
    }
    if (id) {
        query += ` AND id = '${id}'`
    }
    if (index) {
        query += ` AND door = '${index}'`
    }
    let result = sqliteObj.select(query)
    result = result.map(record => {
        record.beginTime = safeBigInt(record.beginTime)
        record.endTime = safeBigInt(record.endTime)
        record.repeatBeginTime = safeBigInt(record.repeatBeginTime)
        record.repeatEndTime = safeBigInt(record.repeatEndTime)
        return record
    })
    return result
}


//Provjera više parametara, ako se drugi parametar ne proslijedi, iterira se kroz sva polja
function verifyData (data, fields) {
    if (!data) {
        throw ("data should not be null or empty")
    }
    if (!fields) {
        fields = Object.keys(data)
    }
    for (let field of fields) {
        if ((typeof data[field]) == 'number') {
            return true
        }
        if (!data[field]) {
            throw (`${field} should not be null or empty`)
        }
    }
}


/**
 * Provjera da li je vrijeme ovlaštenja važeće za prolaz
 * @param {*} permissions 
 * @returns 
 */
function judgmentPermission (permissions) {
    let currentTime = Math.floor(Date.now() / 1000)
    for (let permission of permissions) {
        if (permission.tiemType == '0') {
            //Ako je trajno ovlaštenje, direktno je true
            return true
        }
        if (permission.tiemType == '1') {
            if (checkTimeValidity(permission, currentTime)) {
                //Ovlaštenje unutar vremenskog perioda može proći, inače false
                return true
            }
        }
        if (permission.tiemType == '2') {
            if (checkTimeValidity(permission, currentTime)) {
                //Potvrđeno je da je unutar vremenskog perioda godine, mjeseca i dana, nastavlja se provjera da li je unutar dnevnog ovlaštenja
                let totalSeconds = secondsSinceMidnight()
                if (parseInt(permission.repeatBeginTime) <= totalSeconds && totalSeconds <= parseInt(permission.repeatEndTime)) {
                    //Ovlaštenje unutar vremenskog perioda u sekundama može proći
                    return true
                }
            }
        }
        if (permission.tiemType == '3') {
            if (checkTimeValidity(permission, currentTime)) {
                //Provjera periodičnog ovlaštenja
                let week = (new Date().getDay() + 6) % 7 + 1;
                if (!permission.period) {
                    return false
                }
                let weekPeriodTime = JSON.parse(permission.period)

                if (!weekPeriodTime[week]) {
                    //Nema ovlaštenja za ovaj dan, direktno se vraća
                    return false
                }
                let times = weekPeriodTime[week].split("|");
                for (var i = 0; i < times.length; i++) {
                    if (isCurrentTimeInTimeRange(times[i])) {
                        return true
                    }
                }
            }
        }
    }
    return false
}
function insertSql (permssionss) {
    let sql = "INSERT INTO d1_permission values"
    for (let permssions of permssionss) {
        // Type 203 removed - NFC cards validated via sector data only (not stored in DB)
        if (permssions.type !== 200 && permssions.type !== 400 && permssions.type !== 101 && permssions.type !== 600 && permssions.type !== 103 && permssions.type !== 100 && permssions.type !== 300) {
            throw ("Unsupported certificate type")
        }
        verifyData(permssions, ["id", "type", "code", "extra", "timeType", "beginTime", "endTime", "repeatBeginTime", "repeatEndTime", "period", "index"])
        sql += "('" + permssions.id + "'," + permssions.type + ",'" + permssions.code + "','" + permssions.index + "','" + permssions.extra + "'," + permssions.timeType + "," + permssions.beginTime + "," + permssions.endTime + "," + permssions.repeatBeginTime + "," + permssions.repeatEndTime + ",'" + permssions.period + "'),"
    }
    return sql
}

/**
 * 获取从 0 点到当前时间的秒数
 * @returns 
 */
function secondsSinceMidnight () {
    // 创建一个表示当前时间的 Date 对象
    const now = new Date();
    // 获取当前时间的小时、分钟和秒数
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    // 计算从 0 点到当前时间的总秒数
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    return totalSeconds;
}

/**
 * 校验当前时间是否在时间段内  周期性权限校验
 * @param {*} timeRangeString 
 * @returns 
 */
function isCurrentTimeInTimeRange (timeRangeString) {
    // 分割开始时间和结束时间
    var [startTime, endTime] = timeRangeString.split('-');
    // 获取当前时间
    var currentTime = new Date();
    // 解析开始时间的小时和分钟
    var [startHour, startMinute] = startTime.split(':');
    // 解析结束时间的小时和分钟
    var [endHour, endMinute] = endTime.split(':');
    // 创建开始时间的日期对象
    var startDate = new Date();
    startDate.setHours(parseInt(startHour, 10));
    startDate.setMinutes(parseInt(startMinute, 10));
    // 创建结束时间的日期对象
    var endDate = new Date();
    endDate.setHours(parseInt(endHour, 10));
    endDate.setMinutes(parseInt(endMinute, 10));

    // 检查当前时间是否在时间范围内
    return currentTime >= startDate && currentTime <= endDate;
}
function checkTimeValidity (permission, currentTime) {
    return parseInt(permission.beginTime) <= currentTime && currentTime <= parseInt(permission.endTime)
}
//获取路径文件夹
function getLastSegment (path) {
    let lastIndex = path.lastIndexOf('/');
    if (lastIndex > 0) { // 如果找到了 `/` 并且不是在字符串的第一个位置
        return path.substring(0, lastIndex);
    } else {
        return undefined; // 如果没有找到 `/` 或者 `/` 在第一个位置，直接返回原始字符串
    }
}
// 将数据库中解析出来的负数（因类型溢出）转回无符号整数
function safeBigInt (val) {
    const num = Number(val);
    const fixed = num < 0 ? num >>> 0 : num;
    return fixed; // 返回普通 Number 类型
}
export default sqliteService
