//build: 20240523
// To synchronize time, this component needs to be loaded into a while loop in a thread at runtime.
// Default synchronizes every 24 hours, and also supports event-triggered active synchronization eventcetner.fire(ntp.MANUAL_SYNC)
// Dependent components dxLogger, dxCommon, dxCenter

import common from "./dxCommon.js"
import dxNet from './dxNet.js'
import log from './dxLogger.js'
const ntp = {}
/**
 * Synchronize time loop initialize
 * @param {string} server Synchronization time server address, default is 182.92.12.11
 * @param {number} interval Synchronization time interval, unit is minutes, default is to synchronize once every 24 hours
 * 
 */
ntp.beforeLoop = function (server = '182.92.12.11', interval = 24 * 60) {
    this.server = server
    this.interval = interval
    this.tempinterval = 1000//第一次隔1秒就开始第一次对时
    this.last = new Date().getTime()
}
/**
 * update time zone GMT, such as 8, means GMT8 Beijing time
 * @param {number} gmt The value range is 0,1,2....24 represents the time zone,
 */
ntp.updateGmt = function (gmt) {
    if (gmt != undefined && gmt != null) {
        let cmd = `cp /etc/localtimes/localtime${gmt} /etc/localtime`
        common.systemBrief(cmd)
    }
}
/**
 * Sync now
 */
ntp.syncnow = false
/**
 * sync time
 */
ntp.loop = function () {
    if (!dxNet.getStatus().connected) {//没有网络
        return
    }
    const now = new Date().getTime()
    const minus = now - this.last
    if (ntp.syncnow || (minus > (this.tempinterval))) {
        ntp.syncnow = false
        let cmd = `ntpdate -u -t 1 '${this.server}' > /dev/null && echo 'Y' || echo 'N'`
        let res = common.systemWithRes(cmd, 100).split(/\s/)[0]
        if (res != "Y" ) {
            // Time failed, try again after 1 minute
            log.error('ntp sync failed')
            this.tempinterval = 60 * 1000
        } else {
            // Time synchronization success
            log.info('ntp sync success')
            this.tempinterval = this.interval * 60 * 1000
            common.systemBrief("hwclock -u -w")
        }
        this.last = new Date().getTime()
    }
}

export default ntp;