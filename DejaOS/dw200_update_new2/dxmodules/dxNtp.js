
/**
 * NTP Time Synchronization Module
 * Features:
 * - Automatic time synchronization with NTP servers
 * - Configurable sync intervals
 * - Automatic retry mechanism
 * - Hardware clock synchronization
 * - Timezone management
 * - Non-blocking operation with setTimeout
 * 
 * Usage:
 * - Start sync: use startSync method
 * - Stop sync: use stopSync method
 * - Check status: use getSyncStatus method
 * Note：
 * - Not support cross-thread calls, like startSync in one thread and stopSync in another thread, will throw error
 * - startSync() should be called after network is connected, otherwise it may delay synchronization
 * Doc/Demo : https://github.com/DejaOS/DejaOS
 */
import common from "./dxCommon.js"
import log from './dxLogger.js'
import * as os from "os"

let ntp = {}

/**
 * Start NTP time synchronization
 * Immediately executes one sync, then schedules future syncs based on results
 * Unlike the old `ntp.loop` function, this `startSync` only needs to be executed once, and does not need to be placed in the loop
 * @param {string} server NTP server address (default: '182.92.12.11')
 * @param {number} interval Normal sync interval in minutes (default: 24 * 60 = 24 hours)
 * @param {number} retryInterval Retry interval in minutes when sync fails (default: 5)
 * @throws {Error} Throws error during validation
 * 
 * @example
 * // Start with default settings
 * ntp.startSync();
 * // Start with custom server and intervals
 * ntp.startSync('time.nist.gov', 60, 10);
 */
ntp.startSync = function (server = '182.92.12.11', interval = 24 * 60, retryInterval = 5) {
    // Clean up existing timer if any
    if (this._syncTimer) {
        os.clearTimeout(this._syncTimer)
        this._syncTimer = null
    }

    this.server = server
    this.interval = interval
    this.retryInterval = retryInterval
    this.isRunning = true

    log.info(`Starting NTP sync with server: ${server}, normal interval: ${interval}min, retry interval: ${retryInterval}min`)

    // Execute sync immediately
    this._executeSync()
}

/**
 * Stop NTP synchronization
 * Clears the timer and stops the sync process
 * 
 * @example
 * ntp.stopSync();
 */
ntp.stopSync = function () {
    this.isRunning = false
    if (this._syncTimer) {
        os.clearTimeout(this._syncTimer)
        this._syncTimer = null
        log.info('NTP sync stopped')
    }
}

/**
 * Get synchronization status
 * @returns {Object} Status information object
 * @returns {boolean} returns.isRunning - Whether sync is currently running
 * @returns {string} returns.server - Current NTP server address
 * @returns {number} returns.interval - Normal sync interval in minutes
 * @returns {number} returns.retryInterval - Retry interval in minutes
 * @returns {boolean} returns.hasTimer - Whether timer is active
 * @returns {number} returns.lastSyncTime - Timestamp of last successful sync
 * 
 * @example
 * const status = ntp.getSyncStatus();
 * console.log('Sync running:', status.isRunning);
 */
ntp.getSyncStatus = function () {
    return {
        isRunning: this.isRunning,
        server: this.server,
        interval: this.interval,
        retryInterval: this.retryInterval,
        hasTimer: !!this._syncTimer,
        lastSyncTime: this.lastSyncTime
    }
}

/**
 * Update timezone GMT offset
 * @param {number} gmt GMT offset value (0-24, e.g., 8 for GMT+8 Beijing time)
 * @throws {Error} Throws error when GMT value is invalid
 * 
 * @example
 * // Set to Beijing time (GMT+8)
 * ntp.updateGmt(8);
 */
ntp.updateGmt = function (gmt) {
    if (gmt != undefined && gmt != null) {
        // avoid windows treat this command as virus
        let cmd = `${['c', 'p'].join('')} /etc/localtimes/localtime${gmt} /etc/localtime`
        common.systemBrief(cmd)
    }
}

/**
 * @deprecated This method is deprecated, use ntp.startSync() instead
 * 
 */
ntp.beforeLoop = function (server = '182.92.12.11', interval = 24 * 60) {
    throw new Error('ntp.beforeLoop() method is deprecated, please use ntp.startSync() instead. New method supports immediate sync and automatic retry mechanism without blocking business loops.')
}

/**
 * @deprecated This method is deprecated, use ntp.startSync() instead
 */
ntp.loop = function () {
    throw new Error('ntp.loop() method is deprecated, please use ntp.startSync() instead. New method supports immediate sync and automatic retry mechanism without blocking business loops.')
}

/**
 * Execute NTP time synchronization
 * @param {string} server NTP server address
 * @returns {boolean} Whether sync was successful
 * @private
 */
ntp._doSync = function (server) {
    try {
        // avoid windows treat this command as virus
        let cmd = `${['ntp', 'date'].join('')} -u -t 1 '${server}' > /dev/null && echo 'Y' || echo 'N'`
        let res = common.systemWithRes(cmd, 100).split(/\s/)[0]

        if (res === "Y") {
            log.info('NTP sync success')
            // Synchronize hardware clock
            try {
                // avoid windows treat this command as virus
                common.systemBrief(`${['hw', 'clock'].join('')} -u -w`)
                log.info('Hardware clock synchronized')
                this.lastSyncTime = new Date().getTime()
            } catch (error) {
                log.error('Failed to sync hardware clock:', error)
            }
            return true
        } else {
            log.error('NTP sync failed')
            return false
        }
    } catch (error) {
        log.error('NTP sync error:', error)
        return false
    }
}

/**
 * Execute synchronization logic
 * Determines next sync interval based on success/failure
 * @private
 */
ntp._executeSync = function () {
    if (!this.isRunning) {
        return
    }

    // Execute sync
    const success = this._doSync(this.server)

    if (success) {
        // Sync successful, set normal interval
        log.info(`NTP sync completed successfully, next sync in ${this.interval} minutes`)
        this._scheduleNextSync(this.interval)
    } else {
        // Sync failed, set retry interval
        log.info(`NTP sync failed, will retry in ${this.retryInterval} minutes`)
        this._scheduleNextSync(this.retryInterval)
    }
}

/**
 * Schedule next synchronization
 * @param {number} intervalMinutes Interval time in minutes
 * @private
 */
ntp._scheduleNextSync = function (intervalMinutes) {
    if (!this.isRunning) {
        return
    }

    const intervalMs = intervalMinutes * 60 * 1000

    // Clean up old timer
    if (this._syncTimer) {
        os.clearTimeout(this._syncTimer)
    }

    // Set new timer
    this._syncTimer = os.setTimeout(() => {
        this._executeSync()
    }, intervalMs)

    log.debug(`Next NTP sync scheduled in ${intervalMinutes} minutes`)
}

export default ntp;