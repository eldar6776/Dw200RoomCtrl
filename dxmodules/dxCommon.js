//build: 20240617
// Neke osnovne sistemske operacije i često korištene pomoćne funkcije. U osnovi, svaki projekat treba da zavisi od ove komponente, a dxLogger takođe zavisi od nje.
// Zavisne komponente: dxDriver, dxMap
import { commonClass } from './libvbar-m-dxcommon.so'
import dxMap from './dxMap.js'
import * as std from 'std';
import * as os from "os"

const commonObj = new commonClass();

const common = {}
/**
 * Dobijanje vremena rada sistema od pokretanja (u sekundama)
 * @returns 
 */
common.getUptime = function () {
    return commonObj.getUptime();
}

/**
 * Dobijanje ukupne memorije sistema (u bajtovima)
 * @returns 
 */
common.getTotalmem = function () {
    return commonObj.getTotalmem();
}

/**
 * Dobijanje preostale memorije sistema (u bajtovima)
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
     * @param {int} timeout waitting timeout(microsecond)，default is 200 ms
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
 * Dobijanje ukupnog dostupnog prostora na disku sistema (u bajtovima)
 * @param {string} path Naziv različitih particija diska (ne naziv direktorija), nije obavezno, zadano je '/'
 */
common.getTotaldisk = function (path) {
    return commonObj.getTotaldisk(!path ? "/" : path);
}

/**
 * Dobijanje preostalog dostupnog prostora na disku sistema (u bajtovima)
 * @param {string} path Naziv različitih particija diska (ne naziv direktorija), nije obavezno, zadano je '/'
 * @returns 
 */
common.getFreedisk = function (path) {
    return commonObj.getFreedisk(!path ? "/" : path);
}

/**
 * Dobijanje CPU ID-a
 * @param {number} len Nije obavezno, zadana dužina je 33 znaka
 * @returns 
 */
common.getCpuid = function () {
    return commonObj.getCpuid(33);
}

/**
 * Dobijanje UUID-a uređaja (string)
 * @returns 
 */
common.getUuid = function () {
    return commonObj.getUuid(19);
}

/**
 * Dobijanje jedinstvenog identifikatora uređaja
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
 * Dobijanje MAC adrese izračunate iz UUID-a, koja se može koristiti pri inicijalizaciji mrežne kartice
 * @returns Format sličan: b2:a1:63:3f:99:b6
 */
common.getUuid2mac = function () {
    return commonObj.getUuid2mac(19);
}

/**
 * Dobijanje procenta zauzeća CPU-a (broj ne veći od 100)
 * @returns 
 */
common.getFreecpu = function () {
    return commonObj.getFreecpu();
}


/**
 * RSA dekripcija (enkripcija privatnim ključem, dekripcija javnim ključem)
 * Na primjer, javni ključ je
 * @param {ArrayBuffer} data Podaci za dekripciju, obavezno
 * @param {string} publicKey Javni ključ, obavezno
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
 * @brief   String AES enkripcija
 */
common.aes128EcbEncrypt = function (input, key) {
    return commonObj.aes128EcbEncrypt(input, key)
}
/**
 * @brief   String AES dekripcija
 */
common.aes128EcbDecrypt = function (input, key) {
    return commonObj.aes128EcbDecrypt(input, key)
}

/**
 * ArrayBuffer ECB 128-bit Pkcs5Padding AES enkripcija
 * @param {ArrayBuffer} input Čisti tekst
 * @param {ArrayBuffer} key Ključ
 * @returns ArrayBuffer Šifrirani tekst
 */
common.aes128EcbPkcs5PaddingEncode = function (input, key) {
    return commonObj.aes128Pkcs7PaddingEncode(input, key)
}

/**
 * ArrayBuffer ECB 128-bit Pkcs5Padding AES dekripcija
 * 
 * @param {ArrayBuffer} input Šifrirani tekst
 * @param {ArrayBuffer} key Ključ
 * @returns ArrayBuffer Čisti tekst
 */
common.aesEcb128Pkcs5PaddingDecode = function (input, key) {
    return commonObj.aes128Pkcs7PaddingDecode(input, key)
}

/**
 * AES ECB Pkcs5Padding 128 enkripcija
 * Primjer: common.aes128EcbPkcs5PaddingEncrypt("stamp=202008文&tic", "1234567890123456")
 * Rezultat: ef7c3cff9df57b3bcb0951938c574f969e13ffdcc1eadad298ddbd1fb1a4d2f7
 * Referenca: https://www.devglan.com/online-tools/aes-encryption-decryption
 * @param {string} input  Podaci u čistom tekstu
 * @param {string} key     Ključ, string od 16 bajtova
 * @return Šifrirani tekst kao heksadecimalni string
 */
common.aes128EcbPkcs5PaddingEncrypt = function (input, key) {
    let data = common.hexStringToArrayBuffer(common.strToUtf8Hex(input))
    key = common.hexStringToArrayBuffer(common.strToUtf8Hex(key))
    // 加密
    let hex = common.arrayBufferToHexString(common.aes128EcbPkcs5PaddingEncode(data, key))
    return hex
}
/**
   * AES ECB Pkcs5Padding 128 dekripcija
   * @param {string} input Šifrirani tekst kao heksadecimalni string
   * @param {string} key   Ključ, string od 16 bajtova
   * @return Čisti tekst
   */
common.aes128EcbPkcs5PaddingDecrypt = function (input, key) {
    key = common.hexStringToArrayBuffer(common.strToUtf8Hex(key))
    let res = common.aesEcb128Pkcs5PaddingDecode(common.hexStringToArrayBuffer(input), key)
    return common.utf8HexToStr(common.arrayBufferToHexString(res))
}

/**
 * @brief   String AES GCM enkripcija
 * @param {string} plainText Čisti tekst
 * @param {string} key Ključ
 * @returns {object} {cipherData: ArrayBuffer, key: String, iv: ArrayBuffer, tag: ArrayBuffer}
 */
common.aes128GcmEncrypt = function (plainText, key) {
    return commonObj.aes128GcmEncrypt(plainText, key)
}

/**
 * @brief   String AES GCM dekripcija
 * @param {ArrayBuffer} cipherData Šifrirani tekst
 * @param {string} key Ključ
 * @param {ArrayBuffer} iv  iv
 * @param {ArrayBuffer} tag tag
 */
common.aes128GcmDecrypt = function (chiperData, key, iv, tag) {
    return commonObj.aes128GcmDecrypt(chiperData, key, iv, tag)
}

/**
 * Izvršavanje komande operativnog sistema
 * @param {*} cmd Komanda
 * @returns 
 */
common.system = function (cmd) {
    return commonObj.system(cmd)
}

/**
 * Izvršavanje komande operativnog sistema
 * @param {*} cmd Komanda. Uobičajene komande operativnog sistema (većina Linux komandi je podržana), obavezno.
 * @returns 
 */
common.systemBrief = function (cmd) {
    return commonObj.systemBrief(cmd)
}

/**
 * Izvršavanje komande operativnog sistema i vraćanje rezultata
 * @param {*} cmd Komanda. Uobičajene komande operativnog sistema (većina Linux komandi je podržana), obavezno.
 * @param {*} resLen Dužina primljenih podataka. Ponekad su vraćeni podaci veoma veliki, pa se ova vrijednost može koristiti za vraćanje podataka fiksne dužine, obavezno.
 * @returns 
 */
common.systemWithRes = function (cmd, resLen) {
    return commonObj.systemWithRes(cmd, resLen)
}

/**
 * Izvršavanje komande operativnog sistema sa blokiranjem
 * @param {*} cmd Komanda. Uobičajene komande operativnog sistema (većina Linux komandi je podržana), obavezno.
 * @returns 
 */
common.systemBlocked = function (cmd) {
    return commonObj.systemBlocked(cmd)
}

/**
 * Asinhrono odgođeno ponovno pokretanje
 * @param {*} delay_s Vrijeme odgode
 * @returns 
 */
common.asyncReboot = function (delay_s) {
    return commonObj.asyncReboot(delay_s)
}

/**
 * BCC provjera
 * @param {array} data npr. za [49,50,51,52,53,54] odgovarajuća vrijednost je 7
 * @returns Rezultat izračuna provjere
 */
common.calculateBcc = function (data) {
    return commonObj.calculateBcc(data)
}

/**
 * crc校验 比如字符串'123456'校验计算的结果是数字 158520161
 * @param {string} content String podaci za provjeru,
 * @returns 
 */
common.crc32 = function (content) {
    if (content === undefined || content === null || typeof (content) != "string" || content.length < 1) {
        throw new Error("dxCommon.crc32:'content' paramter should not be empty")
    }
    return commonObj.crc32(content)
}

/**
 * Izračunavanje MD5 heša. Na primjer, za string '123456', odgovarajući niz brojeva je [49,50,51,52,53,54], a odgovarajući MD5 je 'e10adc3949ba59abbe56e057f20f883e'.
 * Međutim, ne vraća se heksadecimalni string, već niz brojeva. Može se koristiti funkcija arrToHex za konverziju.
 * @param {array} arr Niz brojeva
 * @returns Niz brojeva
 */
common.md5Hash = function (arr) {
    return commonObj.md5Hash(arr)
}

/**
 * Izračunavanje MD5 heša datoteke. Na primjer, ako je sadržaj datoteke '123456', odgovarajući MD5 je 'e10adc3949ba59abbe56e057f20f883e'.
 * Međutim, ne vraća se heksadecimalni string, već niz brojeva. Može se koristiti funkcija arrToHex za konverziju.
 * @param {string} filePath Putanja do datoteke, apsolutna putanja, obavezno, obično počinje sa /app/code
 * @returns Niz brojeva
 */
common.md5HashFile = function (filePath) {
    if (filePath === undefined || filePath === null || typeof (filePath) != "string") {
        return null
    }
    return commonObj.md5HashFile(filePath)
}

/**
 * Izračunavanje HMAC MD5 enkripcije. Na primjer, za podatke '123456' i ključ '654321', odgovarajući rezultat je '357cbe6d81a8ec770799879dc8629a53'.
 * Međutim, i parametri i povratna vrijednost su ArrayBuffer.
 * @param {ArrayBuffer} data Sadržaj za enkripciju, obavezno
 * @param {ArrayBuffer} key Ključ, obavezno
 * @returns ArrayBuffer
 */
common.hmacMd5Hash = function (data, key) {
    return commonObj.hmacMd5Hash(data, key)
}

/**
 * Izračunavanje HMAC MD5 enkripcije. Na primjer, za podatke '123456' i ključ '654321', odgovarajući rezultat je '357cbe6d81a8ec770799879dc8629a53'.
 * @param {string} data Sadržaj za enkripciju, obavezno
 * @param {string} key Ključ, obavezno
 * @returns ArrayBuffer
 */
common.hmac = function (data, key) {
    return commonObj.hmac(data, key)
}

/**
 * Izračunavanje HMAC MD5 enkripcije za datoteku. Na primjer, ako je sadržaj datoteke '123456' i ključ '654321', odgovarajući rezultat je '357cbe6d81a8ec770799879dc8629a53'.
 * @param {string} filePath Putanja do datoteke koja sadrži sadržaj za enkripciju, apsolutna putanja, obavezno, obično počinje sa /app/code
 * @param {array} key Ključ, niz brojeva, obavezno
 * @returns Niz brojeva
 */
common.hmacMd5HashFile = function (filePath, key) {
    return commonObj.hmacMd5HashFile(filePath, key)
}


/**
 * Pretvaranje base64 u binarnu datoteku
 * @param {string} file_path Putanja do datoteke, obavezno
 * @param {string} base64Data Base64 podaci, obavezno
 * @returns 
 */
common.base64_2binfile = function (file_path, base64Data) {
    return commonObj.base64_2binfile(file_path, base64Data);
}

/**
 * Pretvaranje binarne datoteke u base64
 * @param {string} file_path Putanja do datoteke, obavezno
 * @returns base64Data Base64 podaci, obavezno
 */
common.binfile_2base64 = function (file_path) {
    return commonObj.binfile_2base64(file_path);
}

/**
 * Promjena načina rada uređaja
 * @description Nakon promjene načina rada, uređaj će se ponovo pokrenuti i ući u navedeni način rada. Prilikom korištenja ove metode, potrebno je u potpunosti održavati logiku međusobnog prebacivanja. Nakon prebacivanja u poslovni način rada, IDE funkcije se ne mogu koristiti.
 * @param {number|string} mode Napomena: Stare verzije koriste (1, 2, 3) za promjenu načina rada, nove verzije koriste (dev, test, prod, safe).
 * @returns true false
 */
common.setMode = function (mode) {
    // Napomena: Stare verzije koriste (1, 2, 3) za promjenu načina rada
    if (mode == 1) {
        //Proizvodni način rada
        commonObj.systemWithRes(`echo 'app' > /etc/.mode`, 2)
        // Verzija 1.0 briše tvorničku provjeru nakon prebacivanja u druge načine rada (može se promijeniti u budućim verzijama)
        commonObj.systemWithRes(`rm -rf /test`, 2)
    } else if (mode == 2) {
        //Način za otklanjanje grešaka
        commonObj.systemWithRes(`echo 'debug' > /etc/.mode`, 2)
        // Verzija 1.0 briše tvorničku provjeru nakon prebacivanja u druge načine rada (može se promijeniti u budućim verzijama)
        commonObj.systemWithRes(`rm -rf /test`, 2)
    } else if (mode == 3) {
        //Probni proizvodni način rada
        commonObj.systemWithRes(`echo 'pp' > /etc/.mode`, 2)
    } 
    
    // Napomena: Nove verzije koriste (dev, test, prod, safe) za promjenu načina rada
    else if (mode == "dev") {
        //Razvojni način rada
        commonObj.systemWithRes(`echo 'dev' > /etc/.mode_v1`, 2)
    } else if (mode == "test") {
        //Testni način rada (probni proizvodni način rada)
        commonObj.systemWithRes(`echo 'test' > /etc/.mode_v1`, 2)
    } else if (mode == "prod") {
        //Proizvodni način rada
        commonObj.systemWithRes(`echo 'prod' > /etc/.mode_v1`, 2)
    } else if (mode == "safe") {
        //Sigurni način rada
        commonObj.systemWithRes(`echo 'safe' > /etc/.mode_v1`, 2)
    } else {
        return false
    }
    commonObj.systemWithRes(`sync`, 2)
    commonObj.asyncReboot(2)
    return true
}

/**
 * Upit o načinu rada uređaja
 * @description Dobijanje trenutnog načina rada uređaja
 * @returns Poslovni način rada: 1, Razvojni način rada: 2, Tvornički način rada: 28, Abnormalni način rada: -1
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
 * Pretvaranje heksadecimalnog stringa u niz bajtova, npr. 313233616263 -> [49,50,51,97,98,99]
 * @param {string} str Heksadecimalni string, mala slova i bez razmaka
 * @returns Niz brojeva
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
 * Pretvaranje niza bajtova u heksadecimalni string, npr. [49,50,51,97,98,99] -> 313233616263
 * @param {array} numbers Niz brojeva
 * @returns str Heksadecimalni string, mala slova i bez razmaka
 */
common.arrToHex = function (numbers) {
    const hexArray = numbers.map(num => num.toString(16).padStart(2, '0').toLowerCase());
    const hexString = hexArray.join('');
    return hexString;
}
/**
 * Pretvaranje heksadecimalnog stringa u string, npr. 313233616263 -> 123abc
 * Napomena: Ako je heksadecimalni string dobijen konverzijom kineskih znakova, pri ponovnoj konverziji u string može doći do neispravnih znakova, jer se konverzija vrši bajt po bajt.
 * @param {string} str Heksadecimalni string za konverziju
 * @returns 
 */
common.hexToString = function (str) {
    let regex = /.{2}/g;
    let arr = str.match(regex);
    arr = arr.map(item => String.fromCharCode(parseInt(item, 16)));
    return arr.join("");
}
// Pretvaranje stringa u heksadecimalni string sa UTF-8 kodiranjem
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
            // Obrada Unicode kodiranja
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
 * Pretvaranje proslijeđenog UTF-8 heksadecimalnog stringa u string
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
                // 0xxxxxxx (ASCII)
                out += String.fromCharCode(c);
                break;
            case 12: case 13:
                // 110x xxxx   10xx xxxx (2-byte UTF-8)
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14:
                // 1110 xxxx  10xx xxxx  10xx xxxx (3-byte UTF-8)
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
 * Pretvaranje stringa u heksadecimalni string, npr. 123abc -> 313233616263
 * @param {string} str String za konverziju
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
 * Pretvaranje little-endian heksadecimalnog stringa u decimalni broj, npr. 001001 -> 69632
 * @param {string} hexString Heksadecimalni string, mala slova i bez razmaka
 * @returns Broj
 */
common.littleEndianToDecimal = function (hexString) {
    // Obrtanje heksadecimalnog stringa u little-endian formatu
    let reversedHexString = hexString
        .match(/.{2}/g)  // Podjela na svaka dva znaka
        .reverse()  // Obrtanje niza
        .join("");  // Spajanje u string

    // Pretvaranje obrnutog heksadecimalnog stringa u decimalni broj
    let decimal = parseInt(reversedHexString, 16);
    return decimal;
}


/**
 * Pretvaranje decimalnog broja u heksadecimalni string u little-endian formatu
 * npr. 300 -> 2c01
 * npr. 230 -> e600
 * @param {number} decimalNumber Decimalni broj, obavezno
 * @param {number} byteSize Broj bajtova za generisanje. Ako premaši stvarni broj bajtova, dopunit će se nulama s desne strane; ako je manji, bit će odsječen. Nije obavezno, zadano je 2.
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
        decimalNumber >>= 8;//Ekvivalentno dijeljenju sa 256
    }
    const littleEndianHex = littleEndianBytes
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    return littleEndianHex;
}

/**
 * Pretvaranje heksadecimalnog stringa u ArrayBuffer
 * @param {string} hexString Heksadecimalni string za konverziju
 * @returns 
 */
common.hexStringToArrayBuffer = function (hexString) {
    return this.hexStringToUint8Array(hexString).buffer;
}

/**
 * Pretvaranje heksadecimalnog stringa u Uint8Array
 * @param {string} hexString Heksadecimalni string za konverziju, mala slova i bez razmaka
 * @returns Uint8Array对象
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
 * Pretvaranje ArrayBuffer-a u format heksadecimalnog stringa
 * @param {ArrayBuffer} buffer 
 * @returns Heksadecimalni string, mala slova i bez razmaka
 */
common.arrayBufferToHexString = function (buffer) {
    return this.uint8ArrayToHexString(new Uint8Array(buffer))
}
/**
 * Pretvaranje Uint8Array u format heksadecimalnog stringa
 * @param {Uint8Array} array 
 * @returns Heksadecimalni string, mala slova i bez razmaka
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
 * Univerzalna metoda za postavljanje/dobijanje ID-a rukovatelja komponente
 * @param {string} name Naziv komponente, obavezno
 * @param {string} id ID rukovatelja, nije obavezno
 * @param {number} pointer Brojčani pokazivač rukovatelja, nije obavezno
 * @returns 
 */
common.handleId = function (name, id, pointer) {
    // Naziv komponente ne smije biti prazan
    if (name === undefined || name === null || name === "" || typeof name !== 'string') {
        return
    }
    let map = dxMap.get('handleIds')
    // ID rukovatelja
    if (id === undefined || id === null || id === "" || typeof id !== 'string') {
        id = "__" + name + "_default"
    }
    if (pointer === undefined || pointer === null || typeof pointer !== 'number') {
        // Ako je pointer prazan, radi se o dobijanju
        return map.get(id)
    } else {
        // Ako pointer nije prazan, radi se o postavljanju
        let isExist = map.get(id)
        if (isExist) {
            // Rukovatelj već postoji
            return
        }
        map.put(id, pointer)
    }
}


export default common