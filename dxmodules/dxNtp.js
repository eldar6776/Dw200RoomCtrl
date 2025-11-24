//build: 20240523
//Sinhronizacija vremena. Prilikom izvršavanja, ovu komponentu je potrebno učitati u while petlju unutar niti.
//Zadano se sinhronizira svakih 24 sata, a podržava i aktivnu sinhronizaciju pokrenutu događajem eventcenter.fire(ntp.MANUAL_SYNC).
//Zavisne komponente: dxLogger, dxCommon, dxCenter

import common from "./dxCommon.js"
import dxNet from './dxNet.js'
import log from './dxLogger.js'
const ntp = {}
/**
 * Inicijalizacija petlje za sinhronizaciju vremena
 * @param {string} server Adresa servera za sinhronizaciju vremena, zadano je 182.92.12.11
 * @param {number} interval Interval sinhronizacije vremena u minutama, zadano je jednom u 24 sata
 * 
 */
ntp.beforeLoop = function (server = '182.92.12.11', interval = 24 * 60) {
    this.server = server
    this.interval = interval
    this.tempinterval = 1000//第一次隔1秒就开始第一次对时
    this.last = new Date().getTime()
}
/**
 * Ažuriranje vremenske zone GMT, na primjer 8, označava GMT+8 (Pekinško vrijeme).
 * @param {number} gmt  Vrijednost može biti od 0 do 24 i predstavlja vremensku zonu.
 */
ntp.updateGmt = function (gmt) {
    if (gmt != undefined && gmt != null) {
        let cmd = `cp /etc/localtimes/localtime${gmt} /etc/localtime`
        common.systemBrief(cmd)
    }
}
/**
 * Sinhroniziraj odmah
 */
ntp.syncnow = false
/**
 * Sinhronizacija vremena
 */
ntp.loop = function () {
    if (!dxNet.getStatus().connected) {//Nema mreže
        return
    }
    const now = new Date().getTime()
    const minus = now - this.last
    if (ntp.syncnow || (minus > (this.tempinterval))) {
        ntp.syncnow = false
        let cmd = `ntpdate -u -t 1 '${this.server}' > /dev/null && echo 'Y' || echo 'N'`
        let res = common.systemWithRes(cmd, 100).split(/\s/)[0]
        if (res != "Y" ) {
            // Sinhronizacija vremena neuspješna, pokušaj ponovo za 1 minutu
            log.error('ntp sync failed')
            this.tempinterval = 60 * 1000
        } else {
            // Sinhronizacija vremena uspješna
            log.info('ntp sync success')
            this.tempinterval = this.interval * 60 * 1000
            common.systemBrief("hwclock -u -w")
        }
        this.last = new Date().getTime()
    }
}

export default ntp;