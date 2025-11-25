/**
 * Implement the management of all configuration items (key/value) of the application:
 * 1. Users need to save the initial configuration items in the project's src/config.json. Please keep the key/value format (comments are supported) for the configuration file. The value can only be a string or a number, for example:
 * {
 *      //mqtt related configuration
 *      "mqtt.ip":"192.168.2.3",
 *      "mqtt.port":6199,
 * }
 * 2. Custom configuration files are also supported. The path and identifier of the custom configuration file can be passed during initialization, and this identifier needs to be passed for subsequent read and write data.
 * 3. When a user uses this component for the first time in the application, they need to initialize it first. The initialization will save the data of config.json to the memory, and each subsequent acquisition will be from the memory.
 * 4. Users can read and write configurations anywhere through get and set
 * 5. If you modify the value of a configuration item and need to save it to the configuration file at the same time (to ensure that the new configuration takes effect after restarting), use setAndSave
 * 6. If you need to restore all default configurations, use reset
 */
import * as os from 'os';
import dxMap from './dxMap.js'
import common from './dxCommon.js'
import logger from './dxLogger.js'
import std from './dxStd.js'

const map = dxMap.get("default")

const config = {}
const DEFALUT_OPTIONS = { path: '/app/code/src/config.json', savePath: '/app/code/src/config.json', flag: '___config.' }

/**
 * The initialization will save the data of config.json or a custom configuration file to the memory, and each subsequent acquisition will be from the memory.
 * @param {object} custom Optional, custom configuration file
 *          @param {string} custom.path The full path of the custom configuration file
 *          @param {string} custom.flag The identifier of the custom configuration file. Note that if there are multiple custom configuration files, this identifier should not be repeated.
 */
config.init = function (custom) {
    if (custom) {
        if (!custom.path || !custom.flag) {
            throw new Error('The path and flag for the custom configuration file cannot be empty.')
        }
    }
    let flag = custom ? DEFALUT_OPTIONS.flag + custom.flag + '.' : DEFALUT_OPTIONS.flag;
    const isInited = map.get('___inited' + flag)
    if (isInited) {// Initialize only once
        return
    }
    let path = custom ? custom.path : DEFALUT_OPTIONS.path
    let savePath = custom ? custom.path : DEFALUT_OPTIONS.savePath
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
 * Get all configuration items
 * @param {string} flag The identifier of the custom configuration file can be empty. If it is empty, all the contents of the default config.json will be returned.
 * @returns json object
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
 * Get the configuration, only from the map
 * If the configuration item is empty, return all data;
 * @param {string} key Configuration item 
 * @param {string} flag The identifier of the custom configuration file can be empty. If it is empty, the configuration value in the default config.json will be returned.
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
 * Update the configuration, only modify the map
 * @param {string} key Configuration item 
 * @param {string} value Configuration value
 * @param {string} flag The identifier of the custom configuration file can be empty. If it is empty, it points to the configuration value in the default config.json.
 */
config.set = function (key, value, flag) {
    if (!key || value == null || value == undefined) {
        throw new Error("key or value should not be empty")
    }
    let _flag = _getFlag(flag)
    map.put(_flag + key, value)
}

/**
 * Persist the data in the map to the local
 * @param {string} flag The identifier of the custom configuration file can be empty. If it is empty, it points to the configuration value in the default config.json.
 */
config.save = function (flag) {
    //save
    std.saveFile(_getSavePath(flag), JSON.stringify(this.getAll(flag)))
}

/**
 * Update the configuration, modify the map and persist it locally
 * @param {string} key Configuration item 
 * @param {string} value Configuration value
 * @param {string} flag The identifier of the custom configuration file can be empty. If it is empty, it points to the configuration value in the default config.json.
 */
config.setAndSave = function (key, value, flag) {
    this.set(key, value, flag)
    //save
    std.saveFile(_getSavePath(flag), JSON.stringify(this.getAll(flag)))
}

/**
 * Reset, please restart the device after resetting
 * @param {string} flag The identifier of the custom configuration file can be empty. If it is empty, it points to the configuration value in the default config.json.
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