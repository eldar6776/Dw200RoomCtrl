/**
 * OTA Modul
 * Karakteristike:
 * - Online nadogradnje putem HTTP-a i nadogradnje iz lokalnih datoteka
 * - Automatska provjera integriteta putem MD5
 * - Validacija prostora na disku prije nadogradnje
 
 * Upotreba:
  1. Izgradite kod u aplikacijski paket. Kliknite na `Package` u VSCode DejaOS dodatku da biste generisali .dpk datoteku u .temp folderu.
  2. Otpremite .dpk datoteku (zip format) na web server i dobijte URL za preuzimanje.
  3. Pošaljite URL za preuzimanje i MD5 kontrolni zbroj aplikaciji na uređaju.
   - Kodirajte URL i MD5 kao QR kod za skeniranje na uređaju,
   - Ili koristite druge metode (Bluetooth, MQTT, RS485, itd.).
  4. Uređaj preuzima i provjerava integritet paketa koristeći MD5.
  5. Raspakujte paket u stabilan direktorij i ponovo pokrenite uređaj.
  6. Nakon ponovnog pokretanja, DejaOS raspakuje paket i prepisuje postojeći kod.
 * Doc/Demo: https://github.com/DejaOS/DejaOS
 */
import log from './dxLogger.js'
import com from './dxCommon.js'
import http from './dxHttpClient.js'
import * as os from 'os';

const ota = {}
ota.UPGRADE_TARGET = '/upgrades.zip'
ota.UPGRADE_TEMP = '/upgrades.temp'
ota.DF_CMD = `df -k / | awk 'NR==2 {print $4}'`
/**
 * Preuzimanje paketa za nadogradnju putem HTTP-a
 * @param {string} url Obavezno. HTTP URL za preuzimanje paketa za nadogradnju.
 * @param {string} md5 Obavezno. MD5 heš za provjeru integriteta (32-znakovni heksadecimalni string malim slovima).
 * @param {number} timeout Opciono. Vremensko ograničenje preuzimanja u sekundama (zadano: 60).
 * @param {number} size Opciono. Veličina paketa u KB za validaciju prostora na disku.
 * @param {Object} [httpOpts] Dodatne opcije zahtjeva.
 */
ota.updateHttp = function (url, md5, timeout = 60, size, httpOpts) {
    if (!url || !md5) {
        throw new Error("'url' and 'md5' parameters are required")
    }
    if (size && (typeof size != 'number')) {
        throw new Error("'size' parameter must be a number")
    }
    // 1. Provjerite dostupan prostor na disku
    checkDiskSpace(size)
    // 2. Preuzmite datoteku u privremeni direktorij
    com.systemBrief(`rm -rf ${ota.UPGRADE_TARGET} && rm -rf ${ota.UPGRADE_TEMP} `) // Očistite postojeće datoteke
    log.info("download url:" + url)
    let downloadRet = http.download(url, ota.UPGRADE_TEMP, timeout * 1000, httpOpts)
    log.info("download result:" + JSON.stringify(downloadRet))

    let fileExist = (os.stat(ota.UPGRADE_TEMP)[1] === 0)
    if (!fileExist) {
        com.systemBrief(`rm -rf ${ota.UPGRADE_TARGET} && rm -rf ${ota.UPGRADE_TEMP} `)
        throw new Error('Download failed. Please check the URL: ' + url)
    }
    // 3. Provjerite MD5 kontrolni zbroj
    if (!verifyMD5(ota.UPGRADE_TEMP, md5)) {
        com.systemBrief(`rm -rf ${ota.UPGRADE_TARGET} && rm -rf ${ota.UPGRADE_TEMP} `)
        throw new Error('MD5 verification failed')
    }
    // 4. Premjestite provjereni paket u direktorij za nadogradnju
    com.systemBrief(`mv ${ota.UPGRADE_TEMP} ${ota.UPGRADE_TARGET} `)
    com.systemBrief(`sync`)
}


/**
 * Nadogradnja iz lokalne datoteke
 * Koristite ovo kada ste već preuzeli paket putem prilagođenih metoda.
 * @param {string} path Obavezno. Putanja do paketa za nadogradnju.
 * @param {string} md5 Obavezno. MD5 heš za provjeru integriteta (32-znakovni heksadecimalni string malim slovima).
 * @param {number} size Opciono. Veličina paketa u KB za validaciju prostora na disku.
 */
ota.updateFile = function (path, md5, size) {
    if (!path || !md5) {
        throw new Error("'path' and 'md5' parameters are required")
    }
    if (size && (typeof size != 'number')) {
        throw new Error("'size' parameter must be a number")
    }
    let fileExist = (os.stat(path)[1] === 0)
    if (!fileExist) {
        throw new Error('File not found: ' + path)
    }
    // 1. Provjerite dostupan prostor na disku
    checkDiskSpace(size)

    // 2. Provjerite MD5 kontrolni zbroj
    if (!verifyMD5(path, md5)) {
        throw new Error('MD5 verification failed')
    }

    // 3. Premjestite paket u direktorij za nadogradnju
    com.systemBrief(`mv ${path} ${ota.UPGRADE_TARGET} `)
    com.systemBrief(`sync`)
}

function checkDiskSpace(requiredKb) {
    if (requiredKb) {
        const df = parseInt(com.systemWithRes(ota.DF_CMD, 1000))
        if (df < 3 * requiredKb) {
            throw new Error('Insufficient disk space for upgrade')
        }
    }
}

function verifyMD5(filePath, expectedMD5) {
    const hash = com.md5HashFile(filePath)
    const actualMD5 = hash.map(v => v.toString(16).padStart(2, '0')).join('')
    return actualMD5 === expectedMD5
}
/**
 * Pokretanje ponovnog pokretanja uređaja
 * Pozovite ovo nakon uspješne nadogradnje da biste primijenili promjene.
 */
ota.reboot = function () {
    com.asyncReboot(2)
}
//-------------------------ZASTARJELO-------------------
ota.OTA_ROOT = '/ota'
ota.OTA_RUN = ota.OTA_ROOT + '/run.sh'

/**
 * @deprecated Koristite updateHttp() umjesto ovoga.
 * Zastarjela metoda nadogradnje sa podrškom za prilagođene skripte.
 * Preuzima, raspakuje i izvršava prilagođene skripte za nadogradnju.
 * @param {string} url Obavezno. HTTP URL za preuzimanje paketa za nadogradnju.
 * @param {string} md5 Obavezno. MD5 heš za provjeru integriteta (32-znakovni heksadecimalni string malim slovima).
 * @param {number} size Opciono. Veličina paketa u KB za validaciju prostora na disku.
 * @param {string} shell Opciono. Sadržaj prilagođene skripte za nadogradnju.
 * @param {number} timeout Opciono. Vremensko ograničenje konekcije u sekundama (zadano: 3).
 */
ota.update = function (url, md5, size, shell, timeout = 3) {
    if (!url || !md5) {
        throw new Error("'url' and 'md5' parameters are required")
    }
    if (size && (typeof size != 'number')) {
        throw new Error("'size' parameter must be a number")
    }
    // 1. Provjerite dostupan prostor na disku
    let df = parseInt(com.systemWithRes(ota.DF_CMD, 1000))
    if (size) {
        if (df < (3 * size)) { // Zahtijeva 3x veličine paketa za raspakivanje
            throw new Error('Insufficient disk space for upgrade')
        }
    }
    // 2. Preuzmite u određeni direktorij
    const firmware = ota.OTA_ROOT + '/download.zip'
    const temp = ota.OTA_ROOT + '/temp'
    com.systemBrief(`rm -rf ${ota.OTA_ROOT} && mkdir ${ota.OTA_ROOT} `) // Očistite i kreirajte direktorij
    let download = `wget --no-check-certificate --timeout=${timeout} -c "${url}" -O ${firmware} 2>&1`
    com.systemBrief(download, 1000)
    let fileExist = (os.stat(firmware)[1] === 0)
    let downloadRet
    if (!fileExist) {
        downloadRet = http.download(url, firmware, timeout * 1000)
    }
    fileExist = (os.stat(firmware)[1] === 0)
    if (!fileExist) {
        log.error("download result" + downloadRet)
        throw new Error('Download failed. Please check the URL: ' + url)
    }
    // 3. Provjerite MD5 kontrolni zbroj
    let md5Hash = com.md5HashFile(firmware)
    md5Hash = md5Hash.map(v => v.toString(16).padStart(2, 0)).join('')
    if (md5Hash != md5) {
        log.error("download result" + downloadRet)
        throw new Error('MD5 verification failed')
    }
    // 4. Raspakujte paket
    com.systemBrief(`mkdir ${temp} && unzip -o ${firmware} -d ${temp}`)
    // 5. Izvršite prilagođenu skriptu za nadogradnju ako postoji
    const custom_update = temp + '/custom_update.sh'
    if (os.stat(custom_update)[1] === 0) {
        com.systemBrief(`chmod +x ${custom_update}`)
        com.systemWithRes(`${custom_update}`)
    }
    // 6. Kreirajte skriptu za nadogradnju
    if (!shell) {
        // Zadano: kopirajte datoteke i očistite
        shell = `cp -r ${temp}/* /app/code \n rm -rf ${ota.OTA_ROOT}`
    }

    com.systemBrief(`echo "${shell}" > ${ota.OTA_RUN} && chmod +x ${ota.OTA_RUN}`)
    fileExist = (os.stat(ota.OTA_RUN)[1] === 0)
    if (!fileExist) {
        throw new Error('Failed to create upgrade script')
    }
    com.systemWithRes(`${ota.OTA_RUN}`)
}

/**
 * @deprecated Koristite updateHttp() umjesto ovoga.
 * Zastarjela nadogradnja resursa za tar.xz pakete.
 * Specijalizovano samo za nadogradnju datoteka resursa.
 * @param {string} url Obavezno. HTTP URL za preuzimanje paketa za nadogradnju.
 * @param {string} md5 Obavezno. MD5 heš za provjeru integriteta (32-znakovni heksadecimalni string malim slovima).
 * @param {number} size Opciono. Veličina paketa u KB za validaciju prostora na disku.
 * @param {string} shell Opciono. Sadržaj prilagođene skripte za nadogradnju.
 * @param {number} timeout Opciono. Vremensko ograničenje konekcije u sekundama (zadano: 3).
 */
ota.updateResource = function (url, md5, size, shell, timeout = 3) {
    if (!url || !md5) {
        throw new Error("'url' and 'md5' parameters are required")
    }
    if (size && (typeof size != 'number')) {
        throw new Error("'size' parameter must be a number")
    }
    // 1. Provjerite dostupan prostor na disku
    let df = parseInt(com.systemWithRes(ota.DF_CMD, 1000))
    if (size) {
        if (df < (3 * size)) { // Zahtijeva 3x veličine paketa za raspakivanje
            throw new Error('Insufficient disk space for upgrade')
        }
    }
    // 2. Preuzmite u određeni direktorij
    const firmware = ota.OTA_ROOT + '/download.tar.xz'
    const temp = ota.OTA_ROOT + '/temp'
    com.systemBrief(`rm -rf ${ota.OTA_ROOT} && mkdir ${ota.OTA_ROOT} `) // Očistite i kreirajte direktorij
    let download = `wget --no-check-certificate --timeout=${timeout} -c "${url}" -O ${firmware} 2>&1`
    com.systemBrief(download, 1000)
    let fileExist = (os.stat(firmware)[1] === 0)
    if (!fileExist) {
        http.download(url, firmware, timeout * 1000)
    }
    fileExist = (os.stat(firmware)[1] === 0)
    if (!fileExist) {
        throw new Error('Download failed. Please check the URL: ' + url)
    }

    // 3. Provjerite MD5 kontrolni zbroj
    let md5Hash = com.md5HashFile(firmware)
    md5Hash = md5Hash.map(v => v.toString(16).padStart(2, 0)).join('')
    if (md5Hash != md5) {
        throw new Error('MD5 verification failed')
    }
    // 4. Raspakujte tar.xz paket
    com.systemBrief(`mkdir ${temp} && tar -xJvf ${firmware} -C ${temp}`)
    // 5. Kreirajte skriptu za nadogradnju resursa
    if (!shell) {
        shell = `
        source=${temp}/vgapp/res/image/bk.png
        target=/app/code/resource/image/bg.png
        if test -e "\\$source"; then
            cp "\\$source" "\\$target"
        fi
        source=${temp}/vgapp/res/image/bk_90.png
        target=/app/code/resource/image/bg_90.png
        if test -e "\\$source"; then
            cp "\\$source" "\\$target"
        fi
        source=${temp}/vgapp/res/font/AlibabaPuHuiTi-2-65-Medium.ttf
        target=/app/code/resource/font.ttf
        if test -e "\\$source"; then
            cp "\\$source" "\\$target"
        fi
        source=${temp}/vgapp/wav/*.wav
        target=/app/code/resource/wav/
        cp "\\$source" "\\$target"
        rm -rf ${ota.OTA_ROOT}
        `
    }

    com.systemBrief(`echo "${shell}" > ${ota.OTA_RUN} && chmod +x ${ota.OTA_RUN}`)
    fileExist = (os.stat(ota.OTA_RUN)[1] === 0)
    if (!fileExist) {
        throw new Error('Failed to create upgrade script')
    }
    com.systemWithRes(`${ota.OTA_RUN}`)
}

export default ota