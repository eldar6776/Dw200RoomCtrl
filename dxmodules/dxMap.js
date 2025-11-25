import { mapClass } from './libvbar-m-dxmap.so'
/**
 * build:20240407
 * map component, can read and write key/value in memory
 */
const mapObj = new mapClass();

const map = {
    get: function (name) {
        if (!name || name.length == 0) {
            throw new Error("dxMap.get:name should not be null or empty")
        }
        //The first put will automatically create an instance
        return {
            /**
             * @brief   Get all the keys in the Map and return an array
             */
            keys: function () {
                let all = mapObj.keys(name)
                return all == null ? [] : all
            },
            /**
             * @brief   Get value by key
             */
            get: function (key) {
                if (!key || key.length < 1) {
                    throw new Error("The 'key' parameter cannot be null or empty")
                }
                // put empty string, get will be null
                let value = mapObj.get(name, key)
                if (value === undefined || value === null) {
                    value = ""
                }
                return _parseString(value)
            },
            /**
             * @brief   Insert key-value pairs into the Map
             */
            put: function (key, value) {
                if (!key || key.length < 1) {
                    throw new Error("The 'key' parameter cannot be null or empty")
                }
                if (value == null || value == undefined) {
                    throw new Error("The 'value' parameter cannot be null or empty")
                }
                return mapObj.insert(name, key, _stringifyValue(value))
            },
            /**
             * @brief   Delete key-value pairs by Key
             */
            del: function (key) {
                if (!key || key.length < 1) {
                    throw new Error("The 'key' parameter cannot be null or empty")
                }
                return mapObj.delete(name, key)
            },
            /**
             * If it is no longer used, destroy it
             */
            destroy: function () {
                return mapObj.destroy(name)
            },
        }
    }

}
function _stringifyValue(value) {
    const type = typeof value
    if (type === 'string') {
        return value
    }
    if (type === 'number') {
        return '#n#' + value
    }
    if (type === 'boolean') {
        return '#b#' + value
    }
    if (type === 'object') {
        // If it is an object, further determine whether it is an array
        if (Array.isArray(value)) {
            return '#a#' + JSON.stringify(value);
        }// else if (value === null) { The case of null has been avoided before
        return '#o#' + JSON.stringify(value)
    }
    if (type === 'function') {
        throw new Error("The 'value' parameter should not be function")
    }
}
function _parseString(str) {
    if (str.startsWith('#n#')) {
        // parse number
        const numberStr = str.substring(3);
        return numberStr.includes('.') ? parseFloat(numberStr) : parseInt(numberStr, 10);
    } else if (str.startsWith('#b#')) {
        // parse boolean
        return str.substring(3) === 'true';
    } else if (str.startsWith('#a#')) {
        // parse array
        return JSON.parse(str.substring(3));
    } else if (str.startsWith('#o#')) {
        // parse object
        return JSON.parse(str.substring(3));
    } else {
        // By default, return the string
        return str;
    }
}
export default map;

