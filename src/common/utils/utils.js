import common from '../../../dxmodules/dxCommon.js'
import config from '../../../dxmodules/dxConfig.js'
import std from '../../../dxmodules/dxStd.js'
import driver from '../../driver.js'
const utils = {}

// Generiše nasumični string zadane dužine, sastavljen od slova i brojeva.
utils.genRandomStr = function (length) {
    let serialNo = config.get("sysInfo.serialNo") || 0
    if (serialNo == 100) {
        serialNo = 0
    }
    let result = "serialNo" + serialNo
    config.set("sysInfo.serialNo", serialNo + 1)
    // const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    // let result = '';

    // for (let i = 0; i < length; i++) {
    //     const randomIndex = Math.floor(Math.random() * charset.length);
    //     result += charset.charAt(randomIndex);
    // }

    return result;
}

// Dobijanje veličine datoteke za preuzimanje sa URL-a (u bajtovima)
utils.getUrlFileSize = function (url) {
    let actualSize = common.systemWithRes(`wget --spider -S ${url} 2>&1 | grep 'Length' | awk '{print $2}'`, 100).match(/\d+/g)
    return actualSize ? parseInt(actualSize) : 0
}

// Provjerava da li je ""/null/undefined
utils.isEmpty = function (str) {
    return (str === "" || str === null || str === undefined)
}

/**
 * Parsira string u JSON, imajte na umu da vrijednost (value) ne smije sadržavati navodnike (").
 * @param {*} inputString 
 * @returns 
 */
utils.parseString = function (inputString) {
    // Dobijanje sadržaja unutar {}
    inputString = inputString.slice(inputString.indexOf("{"), inputString.lastIndexOf("}") + 1)
    // Regularni izraz za key=value, gdje je key \w+ (slova, brojevi, donja crta), razmaci su dozvoljeni oko =, a value je \w+ ili sadržaj unutar navodnika.
    const keyValueRegex = /(\w+)\s*=\s*("[^"]*"|\w+)/g; // NOSONAR
    let jsonObject = {};
    let match;
    while ((match = keyValueRegex.exec(inputString)) !== null) {
        let key = match[1];
        let value = match[2]

        if (/^\d+$/.test(value)) {
            // Brojčana vrijednost
            value = parseInt(value)
        } else if (/^\d+\.\d+$/.test(value)) {
            // Decimalna vrijednost
            value = parseFloat(value)
        } else if (value == 'true') {
            value = true
        } else if (value == 'false') {
            value = false
        } else {
            // Tekstualna vrijednost
            value = value.replace(/"/g, '').trim()
        }
        jsonObject[key] = value;
    }
    return jsonObject;
}

/**
 * Čeka rezultat preuzimanja, imajte na umu da vremensko ograničenje ne smije premašiti vrijeme "hranjenja psa" (watchdog), inače će se uređaj ponovo pokrenuti ako je preuzimanje sporo.
 * @param {*} update_addr Adresa za preuzimanje
 * @param {*} downloadPath Putanja za spremanje
 * @param {*} timeout Vremensko ograničenje
 * @param {*} update_md5 MD5 provjera
 * @param {*} fileSize Veličina datoteke
 * @returns Rezultat preuzimanja
 */
utils.waitDownload = function (update_addr, downloadPath, timeout, update_md5, fileSize) {
    // Brisanje originalne datoteke
    common.systemBrief(`rm -rf "${downloadPath}"`)
    if (fileSize == 0) {
        return false
    }
    // Asinhrono preuzimanje
    common.systemBrief(`wget -c "${update_addr}" -O "${downloadPath}" &`)
    let startTime = new Date().getTime()
    while (true) {
        // Izračunavanje veličine preuzete datoteke
        let size = parseInt(common.systemWithRes(`file="${downloadPath}"; [ -e "$file" ] && wc -c "$file" | awk '{print $1}' || echo "0"`, 100).split(/\s/g)[0])
        // Ako je jednako, preuzimanje je uspješno
        if (size == fileSize) {
            let ret = common.md5HashFile(downloadPath)
            if (ret) {
                let md5 = ret.map(v => v.toString(16).padStart(2, '0')).join('')
                if (md5 == update_md5) {
                    // md5 provjera uspješna, vraća true
                    return true
                }
            }
            common.systemBrief(`rm -rf "${downloadPath}"`)
            // md5 provjera neuspješna, vraća false
            return false
        }
        // Ako preuzimanje istekne, obrišite preuzetu datoteku i ponovo pokrenite, zaustavite asinhrono preuzimanje
        if (new Date().getTime() - startTime > timeout) {
            driver.pwm.fail()
            common.systemBrief(`rm -rf "${downloadPath}"`)
            common.asyncReboot(3)
            return false
        }
        std.sleep(100)
    }
}

const daysOfWeekEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const daysOfWeekBs = ["Ned", "Pon", "Uto", "Sri", "Čet", "Pet", "Sub"];
const monthsOfYearEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const monthsOfYearBs = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"]
// Dobijanje formatiranog vremena
utils.getDateTime = function () {
    let t = new Date();
    let addZero = (v) => {
        // Dopunjavanje nulom na dvije cifre
        return v.toString(10).padStart(2, '0')
    }
    return {
        year: t.getFullYear(),//godina, npr. 2024
        month: addZero(t.getMonth() + 1), // Mjesec počinje od 0, pa treba dodati 1
        monthTextBs: monthsOfYearBs[t.getMonth()],
        monthTextEn: monthsOfYearEn[t.getMonth()],
        day: addZero(t.getDate()), // Dobijanje datuma
        hours: addZero(t.getHours()),// Dobijanje sati
        minutes: addZero(t.getMinutes()),// Dobijanje minuta
        seconds: addZero(t.getSeconds()),// Dobijanje sekundi
        dayTextBs: daysOfWeekBs[t.getDay()],//dan u sedmici (bosanski)
        dayTextEn: daysOfWeekEn[t.getDay()],//dan u sedmici (engleski)
    }
}

export default utils
