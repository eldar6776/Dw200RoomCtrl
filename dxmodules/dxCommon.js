//build: 20240617
// Provides basic system operations and common utility functions. This component is a dependency for most projects and is also used by dxLogger.
// Dependent components: dxDriver, dxMap
import { commonClass } from './libvbar-m-dxcommon.so'
import dxMap from './dxMap.js'
import * as std from 'std';
import * as os from "os"

const commonObj = new commonClass();

const common = {}
/**
 * Get the running time of the system since it was started (in seconds)
 * @returns 
 */
common.getUptime = function () {
    return commonObj.getUptime();
}

/**
 * Get the total memory of the system (in bytes)
 * @returns 
 */
common.getTotalmem = function () {
    return commonObj.getTotalmem();
}

/**
 * Get the remaining memory of the system (in bytes)
 * @returns 
 */
common.getFreemem = function () {
    return commonObj.getFreemem();
}

/**
 * Deprcated, Please use `common.logMemory` instead.
 */
common.logMem = function (logger, interval = 10) {
    if (logger) {
        logger.debug("Deprcated, Please use `common.logMemory` instead.")
    }
}
/**
 * Logs the current memory usage at regular intervals for debugging and monitoring purposes.
 * @param {object} logger The dxLogger module object.
 * @param {number} interval The logging interval in seconds, defaulting to 10 seconds.
 */
common.logMemory = function (logger, interval = 10) {
    if (!logger) return;

    let first = new Date().getTime();
    let min = common.getFreemem() / 1024;
    let max = min;
    const _logmemory = () => {
        try {
            const now = new Date().getTime();
            const pass = (now - first) / 1000;
            const free = common.getFreemem() / 1024;

            min = Math.min(min, free);
            max = Math.max(max, free);

            // Format time
            let passStr;
            if (pass > 1700000000) {
                first = now;
                passStr = 'time synced, 0s';
            } else if (pass >= 3600) {
                const hours = Math.floor(pass / 3600);
                const minutes = Math.floor((pass % 3600) / 60);
                const seconds = Math.floor(pass % 60);
                passStr = `${hours}h ${minutes}m ${seconds}s`;
            } else if (pass >= 60) {
                const minutes = Math.floor(pass / 60);
                const seconds = Math.floor(pass % 60);
                passStr = `${minutes}m ${seconds}s`;
            } else {
                passStr = `${Math.floor(pass)}s`;
            }
            const log = `------ ${passStr} passed, free memory (k): ${free}, min free memory (k): ${min}, max free memory (k): ${max} ------`;
            logger.info(log);
        } catch (err) {
            logger.error('Error in logMemory:', err);
        } finally {
            os.setTimeout(_logmemory, interval * 1000);
        }
    };

    os.setTimeout(_logmemory, interval * 1000);
};

/**
 * The principle of converting asynchronous to synchronous is as follows: 
 * the `request` function periodically checks a designated variable in memory for a value. 
 * If the value is found within the timeout period, the result is returned; otherwise, 
 * it is considered a timeout. The `response` function is responsible for storing the result
 *  in the designated variable once the asynchronous request is completed.
 */
common.sync = {
    /**
     * Block and wait for data
     * Usage:
        common.sync.request(topic, 200)
        .then((data) => {
            log.info("Received data:", data);
        })
        .catch((err) => {
            log.error("Request failed:", err.message);
        });
     * @param {string} topic The unique identifier for each request
     * @param {int} timeout waiting timeout(microsecond)，default is 200 ms
     * @returns 
     */
    request: function (topic, timeout = 200) {
        return new Promise((resolve, reject) => {
            let map = dxMap.get("SYNC");
            let startTime = Date.now();

            const checkData = () => {
                let data = map.get(topic);
                if (data) {
                    map.del(topic); //del data in map
                    resolve(data); //return data
                } else if (Date.now() - startTime >= timeout) {
                    map.del(topic); // del data in map with timeout
                    reject(new Error(`Timeout exceeded for topic: ${topic}`)); 
                } else {
                    os.setTimeout(checkData, 10); //every 10 ms to check
                }
            };

            os.setTimeout(checkData, 10); // first check
        });
    },

    /**
     * notify data to requester
     * @param {string} topic The unique identifier for each request
     * @param {*} data 
     * @returns 
     */
    response: function (topic, data) {
        let map = dxMap.get("SYNC");
        map.put(topic, data); // save data in map
    }
};

/**
 * Get the total available disk space of the system (in bytes)
 * @param {string} path Different disk partition names (not directory names), optional, default is '/'
 */
common.getTotaldisk = function (path) {
    return commonObj.getTotaldisk(!path ? "/" : path);
}

/**
 * Get the remaining available disk space of the system (in bytes)
 * @param {string} path Different disk partition names (not directory names), optional, default is '/'
 * @returns 
 */
common.getFreedisk = function (path) {
    return commonObj.getFreedisk(!path ? "/" : path);
}

/**
 * Get CPU ID
 * @param {number} len Optional, the default length is 33 bits
 * @returns 
 */
common.getCpuid = function () {
    return commonObj.getCpuid(33);
}

/**
 * Get device uuid (string)
 * @returns 
 */
common.getUuid = function () {
    return commonObj.getUuid(19);
}

/**
 * Get the unique identifier of the device
 * @returns 
 */
common.getSn = function () {
    let sn = std.loadFile('/etc/.sn')
    if (sn) {
        return sn
    } else {
        return commonObj.getUuid(19);
    }
}

/**
 * Get the mac address calculated by uuid, which can be used to initialize the network card
 * @returns The format is similar to: b2:a1:63:3f:99:b6
 */
common.getUuid2mac = function () {
    return commonObj.getUuid2mac(19);
}

/**
 * Get cpu usage (a number not greater than 100)
 * @returns 
 */
common.getFreecpu = function () {
    return commonObj.getFreecpu();
}


/**
 * RSA decryption (private key encryption, public key decryption)
 * For example, the public key is
 * @param {ArrayBuffer} data Data to be decrypted, required
 * @param {string} publicKey Public key, required
 * @returns 
 */
common.arrayBufferRsaDecrypt = function (data, publicKey) {
    if (data === undefined || data === null) {
        throw new Error("dxCommon.arrayBufferRsaDecrypt:'data' parameter should not be null or empty")
    }
    if (publicKey === undefined || publicKey === null || publicKey.length < 1) {
        throw new Error("dxCommon.arrayBufferRsaDecrypt:'publicKey' parameter should not be null or empty")
    }
    return commonObj.arrayBufferRsaDecrypt(data, publicKey)
}

/**
 * @brief   String aes encryption
 */
common.aes128EcbEncrypt = function (input, key) {
    return commonObj.aes128EcbEncrypt(input, key)
}
/**
 * @brief   String aes decryption
 */
common.aes128EcbDecrypt = function (input, key) {
    return commonObj.aes128EcbDecrypt(input, key)
}

/**
 * arraybuffer ecb 128bit Pkcs5Padding aes encryption
 * @param {ArrayBuffer} input Plaintext
 * @param {ArrayBuffer} key Key
 * @returns ArrayBuffer Ciphertext
 */
common.aes128EcbPkcs5PaddingEncode = function (input, key) {
    return commonObj.aes128Pkcs7PaddingEncode(input, key)
}

/**
 * arraybuffer ecb 128bit Pkcs5Padding aes decryption
 * 
 * @param {ArrayBuffer} input Ciphertext
 * @param {ArrayBuffer} key Key
 * @returns ArrayBuffer Plaintext
 */
common.aesEcb128Pkcs5PaddingDecode = function (input, key) {
    return commonObj.aes128Pkcs7PaddingDecode(input, key)
}

/**
 * aes ECB Pkcs5Padding 128 encryption
 * Example: common.aes128EcbPkcs5PaddingEncrypt("stamp=202008文&tic", "1234567890123456")
 * Result：ef7c3cff9df57b3bcb0951938c574f969e13ffdcc1eadad298ddbd1fb1a4d2f7
 * Reference https://www.devglan.com/online-tools/aes-encryption-decryption
 * @param {string} input  Plaintext data
 * @param {string} key     Key 16-byte string
 * @return Ciphertext 16-byte string
 */
common.aes128EcbPkcs5PaddingEncrypt = function (input, key) {
    let data = common.hexStringToArrayBuffer(common.strToUtf8Hex(input))
    key = common.hexStringToArrayBuffer(common.strToUtf8Hex(key))
    // Encrypt
    let hex = common.arrayBufferToHexString(common.aes128EcbPkcs5PaddingEncode(data, key))
    return hex
}
/**
   * aes ECB Pkcs5Padding 128 decryption
   * @param {string} input Ciphertext hexadecimal string
   * @param {string} key   Key 16-byte string
   * @return Plaintext
   */
common.aes128EcbPkcs5PaddingDecrypt = function (input, key) {
    key = common.hexStringToArrayBuffer(common.strToUtf8Hex(key))
    let res = common.aesEcb128Pkcs5PaddingDecode(common.hexStringToArrayBuffer(input), key)
    return common.utf8HexToStr(common.arrayBufferToHexString(res))
}

/**
 * @brief   String aes gcm encryption
 * @param {string} plainText Plaintext
 * @param {string} key Key
 * @returns {object} {cipherData: ArrayBuffer, key: String, iv: ArrayBuffer, tag: ArrayBuffer}
 */
common.aes128GcmEncrypt = function (plainText, key) {
    return commonObj.aes128GcmEncrypt(plainText, key)
}

/**
 * @brief   String aes gcm decryption
 * @param {ArrayBuffer} cipherData Ciphertext
 * @param {string} key Key
 * @param {ArrayBuffer} iv  iv
 * @param {ArrayBuffer} tag tag
 */
common.aes128GcmDecrypt = function (chiperData, key, iv, tag) {
    return commonObj.aes128GcmDecrypt(chiperData, key, iv, tag)
}

/**
 * Execute operating system commands
 * @param {*} cmd Command
 * @returns 
 */
common.system = function (cmd) {
    return commonObj.system(cmd);
}

/**
 * Execute operating system commands 
 * @param {*} cmd Command: Common operating system commands (most Linux commands are supported), required
 * @returns 
 */
common.systemBrief = function (cmd) {
    return commonObj.systemBrief(cmd)
}

/**
 * Execute the operating system command and return the result
 * @param {*} cmd Command: Common operating system commands (most Linux commands are supported), required
 * @param {*} resLen Receive data length. Sometimes the returned data is very large. You can use this value to return a fixed length of data, which is required.
 * @returns 
 */
common.systemWithRes = function (cmd, resLen) {
    return commonObj.systemWithRes(cmd, resLen)
}

/**
 * Execute operating system command blocking execution
 * @param {*} cmd Command: Common operating system commands (most Linux commands are supported), required
 * @returns 
 */
common.systemBlocked = function (cmd) {
    return commonObj.systemBlocked(cmd)
}

/**
 * Asynchronous delayed restart
 * @param {*} delay_s Delay time
 * @returns 
 */
common.asyncReboot = function (delay_s) {
    return commonObj.asyncReboot(delay_s)
}

/**
 * bcc check
 * @param {array} data eg: [49,50,51,52,53,54] the corresponding value is 7
 * @returns Check calculation results
 */
common.calculateBcc = function (data) {
    return commonObj.calculateBcc(data)
}

/**
 * crc check, for example, the result of checking the string '123456' is the number 158520161
 * @param {string} content The string data to be verified,
 * @returns 
 */
common.crc32 = function (content) {
    if (content === undefined || content === null || typeof (content) != "string" || content.length < 1) {
        throw new Error("dxCommon.crc32:'content' paramter should not be empty")
    }
    return commonObj.crc32(content)
}

/**
 * Calculate MD5 hash, for example, the number array corresponding to '123456' is [49,50,51,52,53,54] and the corresponding md5 is 'e10adc3949ba59abbe56e057f20f883e',
 * But the return is not a hexadecimal string, but a number array, you can use the arrToHex function to convert
 * @param {array} arr number array 
 * @returns number array
 */
common.md5Hash = function (arr) {
    return commonObj.md5Hash(arr)
}

/**
 * File calculation MD5 hash, for example, the content in the file is '123456', and the corresponding md5 is 'e10adc3949ba59abbe56e057f20f883e'
 * But the return is not a hexadecimal string, but a number array, you can use the arrToHex function to convert
 * @param {string} File path, absolute path, required, usually starts with /app/code
 * @returns number array
 */
common.md5HashFile = function (filePath) {
    if (filePath === undefined || filePath === null || typeof (filePath) != "string") {
        return null
    }
    return commonObj.md5HashFile(filePath)
}

/**
 * Calculate HMAC MD5 encryption, for example, the encrypted data is '123456', the key is '654321', and the corresponding result is '357cbe6d81a8ec770799879dc8629a53'
 * But the parameters and return values are both ArrayBuffer
 * @param {ArrayBuffer} data Content to be encrypted, required
 * @param {ArrayBuffer} key Key, required
 * @returns ArrayBuffer
 */
common.hmacMd5Hash = function (data, key) {
    return commonObj.hmacMd5Hash(data, key)
}

/**
 * Calculate HMAC MD5 encryption, for example, the encrypted data is '123456', the key is '654321', and the corresponding result is '357cbe6d81a8ec770799879dc8629a53'
 * @param {string} data Content to be encrypted, required
 * @param {string} key Key, required
 * @returns ArrayBuffer
 */
common.hmac = function (data, key) {
    return commonObj.hmac(data, key)
}

/**
 * File calculation HMAC MD5 encryption, for example, the content in the file is '123456', the key is '654321', and the corresponding result is '357cbe6d81a8ec770799879dc8629a53'
 * @param {string} filePath The file path where the content to be encrypted is stored, the absolute path, required, usually starts with /app/code
 * @param {array} key Key, number array, required
 * @returns number array
 */
common.hmacMd5HashFile = function (filePath, key) {
    return commonObj.hmacMd5HashFile(filePath, key)
}


/**
 * base64 to bin file
 * @param {string} file_path file path, required
 * @param {string} base64Data base64 data, required
 * @returns 
 */
common.base64_2binfile = function (file_path, base64Data) {
    return commonObj.base64_2binfile(file_path, base64Data);
}

/**
 * bin file to base64
 * @param {string} file_path file path, required
 * @returns base64Data base64 data, required
 */
common.binfile_2base64 = function (file_path) {
    return commonObj.binfile_2base64(file_path);
}

/**
 * Switch device mode
 * @description After the mode is switched, the device will be restarted to enter the specified mode. When using the method, the logic of switching between each other needs to be completely maintained. After switching to the business mode, the IDE function cannot be used.
 * @param {number} mode Note: The old version of mode switching uses (1, 2, 3), and the new version of mode switching uses (dev, test, prod, safe)
 * @returns true false
 */
common.setMode = function (mode) {
    // Note: The old version of mode switching uses (1, 2, 3)
    if (mode == 1) {
        // Production mode
        commonObj.systemWithRes(`echo 'app' > /etc/.mode`, 2)
        // After version 1.0 is switched to other modes, the factory test is deleted (may be adjusted in subsequent versions)
        commonObj.systemWithRes(`rm -rf /test`, 2)
    } else if (mode == 2) {
        // Debug mode
        commonObj.systemWithRes(`echo 'debug' > /etc/.mode`, 2)
        // After version 1.0 is switched to other modes, the factory test is deleted (may be adjusted in subsequent versions)
        commonObj.systemWithRes(`rm -rf /test`, 2)
    } else if (mode == 3) {
        // Trial production mode
        commonObj.systemWithRes(`echo 'pp' > /etc/.mode`, 2)
    } 
    
    // Note: The new version of mode switching uses (dev, test, prod, safe)
    else if (mode == "dev") {
        // Development mode
        commonObj.systemWithRes(`echo 'dev' > /etc/.mode_v1`, 2)
    } else if (mode == "test") {
        // Test mode (trial production mode)
        commonObj.systemWithRes(`echo 'test' > /etc/.mode_v1`, 2)
    } else if (mode == "prod") {
        // Production mode
        commonObj.systemWithRes(`echo 'prod' > /etc/.mode_v1`, 2)
    } else if (mode == "safe") {
        // Safe mode
        commonObj.systemWithRes(`echo 'safe' > /etc/.mode_v1`, 2)
    } else {
        return false
    }
    commonObj.systemWithRes(`sync`, 2)
    commonObj.asyncReboot(2)
    return true
}

/**
 * Query device mode
 * @description Get the current mode of the device
 * @returns Business mode: 1, development mode: 2, factory mode: 28, abnormal mode: -1
 */
common.getMode = function () {
    let ret = commonObj.systemWithRes(`test -e "/etc/.mode" && echo "OK" || echo "NO"`, 2)
    if (ret.includes('NO')) {
        return 28
    }
    let mode = commonObj.systemWithRes(`cat "/etc/.mode"`, 10)
    if (mode.includes('app')) {
        return 1
    } else if (mode.includes('debug')) {
        return 2
    } else {
        return -1
    }
}
/**
 * Hexadecimal to byte array eg:313233616263->[49,50,51,97,98,99]
 * @param {string} str Hexadecimal string, lowercase and without spaces in the middle
 * @returns number array
 */
common.hexToArr = function (str) {
    if (str === undefined || str === null || (typeof str) != 'string' || str.length < 1) {
        throw new Error("dxCommon.hexToArr:'str' parameter should not be empty")
    }
    let regex = /.{2}/g;
    let arr = str.match(regex);
    return arr.map(item => parseInt(item, 16));
}
/**
 * Byte array to hexadecimal eg:[49,50,51,97,98,99]->313233616263
 * @param {array}numbers number array
 * @returns str Hexadecimal string, lowercase and without spaces in the middle
 */
common.arrToHex = function (numbers) {
    const hexArray = numbers.map(num => num.toString(16).padStart(2, '0').toLowerCase());
    const hexString = hexArray.join('');
    return hexString;
}
/**
 * Hexadecimal to string eg:313233616263->123abc
 * Note that if the hexadecimal string is converted from Chinese, there will be garbled characters when converting back to a Chinese string, because it is a byte-by-byte conversion.
 * @param {string} str The hexadecimal string to be converted
 * @returns 
 */
common.hexToString = function (str) {
    let regex = /.{2}/g;
    let arr = str.match(regex);
    arr = arr.map(item => String.fromCharCode(parseInt(item, 16)));
    return arr.join("");
}
// Convert the string to a UTF-8 encoded hexadecimal string
common.strToUtf8Hex = function (str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        let code = str.charCodeAt(i);
        if (code < 0x80) {
            bytes.push(code);
        } else if (code < 0x800) {
            bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
        } else if (code < 0xd800 || code >= 0xe000) {
            bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
        } else {
            // Process Unicode encoding
            i++;
            code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
            bytes.push(
                0xf0 | (code >> 18),
                0x80 | ((code >> 12) & 0x3f),
                0x80 | ((code >> 6) & 0x3f),
                0x80 | (code & 0x3f)
            );
        }
    }
    return this.arrToHex(bytes);
}
/**
 * Convert the passed utf-8 hexadecimal string to a string
 * @param {string} hex 
 * @returns 
 */
common.utf8HexToStr = function (hex) {
    let array = this.hexToArr(hex)
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while (i < len) {
        c = array[i++];
        switch (c >> 4) {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
            case 12: case 13:
                // 110x xxxx   10xx xxxx
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
        }
    }

    return out;
}
/**
 * String to hexadecimal eg:123abc->313233616263
 * @param {string} str The string to be converted
 * @returns 
 */
common.stringToHex = function (str) {
    if (str === undefined || str === null || typeof (str) != "string") {
        return null
    }
    let val = "";
    for (let i = 0; i < str.length; i++) {
        val += str.charCodeAt(i).toString(16)
    }
    return val
}

/**
 * Little-endian format to decimal number eg:001001->69632
 * @param {string} hexString Hexadecimal string, lowercase and without spaces in the middle
 * @returns number
 */
common.littleEndianToDecimal = function (hexString) {
    // Reverse the hexadecimal string in little-endian format
    let reversedHexString = hexString
        .match(/.{2}/g)  // Separated by every two characters
        .reverse()  // reverse array
        .join("");  // merge into a string

    // Convert the reversed hexadecimal string to a decimal number
    let decimal = parseInt(reversedHexString, 16);
    return decimal;
}


/**
 * Convert decimal number to hexadecimal little-endian format string
 * eg:300->2c01
 * eg:230->e600
 * @param {number} decimalNumber Decimal number, required
 * @param {number} byteSize Generate the number of digits, the number of bytes, if it exceeds the actual number of bytes, it will be padded with 0 on the right, if it is lower, it will be truncated, optional, the default is 2
 * @returns 
 */
common.decimalToLittleEndianHex = function (decimalNumber, byteSize) {
    if (decimalNumber === undefined || decimalNumber === null || (typeof decimalNumber) != 'number') {
        throw new Error("dxCommon.decimalToLittleEndianHex:'decimalNumber' parameter should be number")
    }
    if (byteSize === undefined || byteSize === null || (typeof byteSize) != 'number' || byteSize <= 0) {
        byteSize = 2
    }
    const littleEndianBytes = [];
    for (let i = 0; i < byteSize; i++) {
        littleEndianBytes.push(decimalNumber & 0xFF);
        decimalNumber >>= 8;// equivalent to dividing by 256
    }
    const littleEndianHex = littleEndianBytes
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    return littleEndianHex;
}

/**
 * Convert hexadecimal string to ArrayBuffer
 * @param {*} hexString The hexadecimal string to be converted
 * @returns 
 */
common.hexStringToArrayBuffer = function (hexString) {
    return this.hexStringToUint8Array(hexString).buffer;
}

/**
 * Convert hexadecimal string to Uint8Array
 * @param {string} hexString The hexadecimal string to be converted, lowercase and without spaces in the middle
 * @returns Uint8Array object
 */
common.hexStringToUint8Array = function (hexString) {
    if (hexString === undefined || hexString === null || (typeof hexString) != 'string' || hexString.length <= 0) {
        throw new Error("dxCommon.hexStringToUint8Array:'hexString' parameter should not be empty")
    }
    let byteString = hexString.match(/.{1,2}/g);
    let byteArray = byteString.map(function (byte) {
        return parseInt(byte, 16);
    });
    let buffer = new Uint8Array(byteArray);
    return buffer;
}

/**
 * Convert ArrayBuffer to hexadecimal string format
 * @param {ArrayBuffer} buffer 
 * @returns Lowercase hexadecimal string with no spaces in between
 */
common.arrayBufferToHexString = function (buffer) {
    return this.uint8ArrayToHexString(new Uint8Array(buffer))
}
/**
 * Convert Uint8Array to hexadecimal string format
 * @param {Uint8Array} array 
 * @returns Lowercase hexadecimal string with no spaces in between
 */
common.uint8ArrayToHexString = function (array) {
    let hexString = '';
    for (let i = 0; i < array.length; i++) {
        const byte = array[i].toString(16).padStart(2, '0');
        hexString += byte;
    }
    return hexString
}
/**
 * Set/get component handle id common method
 * @param {string} name Component name, required
 * @param {string} id Handle id, optional
 * @param {number} pointer Handle pointer number, optional
 * @returns 
 */
common.handleId = function (name, id, pointer) {
    // Component name cannot be empty
    if (name === undefined || name === null || name === "" || typeof name !== 'string') {
        return
    }
    let map = dxMap.get('handleIds')
    // handle id
    if (id === undefined || id === null || id === "" || typeof id !== 'string') {
        id = "__" + name + "_default"
    }
    if (pointer === undefined || pointer === null || typeof pointer !== 'number') {
        // If pointer is empty, it is to get
        return map.get(id)
    } else {
        // If pointer is not empty, it is to set
        let isExist = map.get(id)
        if (isExist) {
            // Handle already exists
            return
        }
        map.put(id, pointer)
    }
}


export default common