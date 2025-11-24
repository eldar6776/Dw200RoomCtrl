import { mapClass } from './libvbar-m-dxmap.so'
/**
 * build:20240407
 * map 组件，可以在内存里读写key/value
 * map komponenta, omogućava čitanje i pisanje ključ/vrijednost parova u memoriji
 */
const mapObj = new mapClass();

const map = {
    get: function (name) {
        if (!name || name.length == 0) {
            throw new Error("dxMap.get:name should not be null or empty")
        }
        //Prvi 'put' će automatski kreirati instancu
        return {
            /**
             * @brief   Dobija sve ključeve iz Mape, vraća niz.
             */
            keys: function () {
                let all = mapObj.keys(name)
                return all == null ? [] : all
            },
            /**
             * @brief   Dobija vrijednost na osnovu ključa.
             */
            get: function (key) {
                if (!key || key.length < 1) {
                    throw new Error("The 'key' parameter cannot be null or empty")
                }
                // ako se stavi prazan string, get će vratiti null
                let value = mapObj.get(name, key)
                if (value === undefined || value === null) {
                    value = ""
                }
                return _parseString(value)
            },
            /**
             * @brief   Ubacuje par ključ-vrijednost u Mapu.
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
             * @brief   Briše par ključ-vrijednost na osnovu ključa.
             */
            del: function (key) {
                if (!key || key.length < 1) {
                    throw new Error("The 'key' parameter cannot be null or empty")
                }
                return mapObj.delete(name, key)
            },
            /**
             * Ako se više ne koristi, uništi.
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
        // Ako je objekat, dalje provjeri da li je niz
        if (Array.isArray(value)) {
            return '#a#' + JSON.stringify(value);
        }// else if (value === null) { 前面已经规避了null的情况
        return '#o#' + JSON.stringify(value)
    }
    if (type === 'function') {
        throw new Error("The 'value' parameter should not be function")
    }
}
function _parseString(str) {
    if (str.startsWith('#n#')) {
        // Parsiranje broja
        const numberStr = str.substring(3);
        return numberStr.includes('.') ? parseFloat(numberStr) : parseInt(numberStr, 10);
    } else if (str.startsWith('#b#')) {
        // Parsiranje boolean vrijednosti
        return str.substring(3) === 'true';
    } else if (str.startsWith('#a#')) {
        // Parsiranje niza
        return JSON.parse(str.substring(3));
    } else if (str.startsWith('#o#')) {
        // Parsiranje objekta
        return JSON.parse(str.substring(3));
    } else {
        // U zadanom slučaju, vrati string
        return str;
    }
}
export default map;
