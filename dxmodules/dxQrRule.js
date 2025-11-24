//build: 20240301
//Pravila za format QR kodova slabog osvjetljenja, uključujući 101, 103 itd.
//Zavisne komponente: dxDriver, dxCommon, dxLogger
import common from './dxCommon.js'
import base64 from './dxBase64.js'
import logger from './dxLogger.js'
let sqliteObj

// Poredi da li su prvih N karaktera dva stringa jednaki
function comparePrefix(str1, str2, N) {
    let substring1 = str1.substring(0, N);
    let substring2 = str2.substring(0, N);
    return substring1 === substring2;
}



// Dekodiranje vrijednosti koda 101
function decode101(str) {
    if (str.length < 5) {
        logger.info("Nevažeći QR kod")
        throw new Error("code invalid,length too short")
    }
    let decodeBuf = base64.decode(str.slice(0, -4))
    decodeBuf=decodeBuf.substring(4)

    return decodeBuf
}
function hexStringToArrayBuffer (hexString) {
    var byteString = hexString.match(/.{1,2}/g);
    var byteArray = byteString.map(function (byte) {
        return parseInt(byte, 16);
    });
    var buffer = new Uint8Array(byteArray).buffer;
    return buffer;
}

/**
 * Dekodiranje vrijednosti koda 103
 * 1. Base64 dekodiranje
 * 2. Parsiranje broja organizacije
 * 3. RSA dekripcija
 * 4. Parsiranje tipa identiteta
 * 5. Parsiranje identifikatora ovlaštenja
 * 6. Parsiranje vremena generisanja koda
 * 7. Parsiranje vremena isteka koda
 * 8. Provjera da li je pristupni kod istekao
 * @param {*} str 
 * @returns 
 */
function decode103(str) {
    // FIXME 这个pubKey后期需要从配置中查询
    let TLV_T_SIZE = 2, TLV_L_SIZE = 2, offset = 0, code, decryptedData, generationCodeTime, expirationTime

    // 1. Base64 dekodiranje
    let decodeBuf = base64.toHexString(str)
    decodeBuf= hexStringToArrayBuffer(decodeBuf)
    let view = new Uint8Array(decodeBuf)
    let organizationNumber;
    // 2. Parsiranje broja organizacije
    if (view[offset] == 0x01) {
        offset += TLV_T_SIZE
        let orgNumLen = view[offset]
        offset += TLV_L_SIZE
        let orgNumBuf = new Uint8Array(decodeBuf, offset, orgNumLen);
        organizationNumber = String.fromCharCode.apply(null, new Uint8Array(orgNumBuf));
        logger.info("Broj organizacije: " + organizationNumber)
        offset += orgNumLen
    } else {
        throw new Error("code invalid,organization number error")
    }

    // 3. RSA dekripcija
    if (view[offset] == 0x02) {
        // Dužina podataka o broju organizacije
        offset += TLV_T_SIZE
        let cipherTextLen = view[offset]
        offset += TLV_L_SIZE
        // RSA dekripcija šifrovanog teksta
        let encryptedData = decodeBuf.slice(offset, offset + cipherTextLen)


        // TODO: Ključ je hardkodiran, kasnije ga treba izložiti
        // RSA upit za ključ (može biti fiksni ili zapisan u tekstualnoj datoteci), ponovna dekripcija na osnovu ključa
        // Podaci nakon RSA dekripcije
        let arr = sqliteObj.securityFindAllByCodeAndTypeAndTimeAndkey(undefined, undefined, undefined, Math.floor(Date.parse(new Date()) / 1000), organizationNumber)
        if (arr && arr.length > 0) {
            for (let data of arr) {
                decryptedData = common.arrayBufferRsaDecrypt(encryptedData, data.value)
                if (decryptedData != null) {
                    break
                }
            }
        }
        if (!arr && arr.length <= 0 || decryptedData == null) {
            return str
        }
    }
    // Jedan uređaj, jedan ključ. To znači da je javni ključ za dekripciju unutar uređaja fiksni. Može se staviti u konfiguraciju, ovdje je za sada hardkodiran.
    // "MTlBODExMDA2MTkwMzQ4Q0I5QUY3QTc4QzAzOTQzNUU5NzNFODAzMEU4QUU1QzBEMkZFOEYwRjEzRjU4M0M5MTU5QUU5MTdDMDIzRDU0RDgxRUY2NTI0NkUyQ0Y2MUMzMTQzNTNENjA2NDU5N0Y2OTY5RUE4QjA5MUY1RTYyODM=";
    // let buf = common.arrayBufferRsaDecrypt(deData, deData.length)
    // 0 3 0 3 0 31 30 33 4 0 a 0 31 30 35 34 33 32 33 33 32 33 5 0 4 0 af 8c fa 5a 6 0 1 0 35 7 0 0 0
    // 0 
    // 3 0 3 0 31 30 33 
    // 4 0 a 0 31 30 35 34 33 32 33 33 32 33 
    // 5 0 4 0 af 8c fa 5a 
    // 6 0 1 0 35 
    // 7 0 0 0

    offset = 1;
    view = new Uint8Array(decryptedData)
    // 4. Parsiranje tipa identiteta (type:103)
    if (view[offset] == 0x03) {
        // Dužina podataka o tipu identiteta
        offset += TLV_T_SIZE
        let identityTypeLength = view[offset]
        // Podaci o tipu identiteta
        offset += TLV_L_SIZE
        let identityTypeBuf = new Uint8Array(decryptedData, offset, identityTypeLength);
        let identityType = String.fromCharCode.apply(null, identityTypeBuf);
        offset += identityTypeLength
        logger.info("Podaci o tipu identiteta: " + identityType)
    }


    // 5. Parsiranje identifikatora ovlaštenja (code)
    if (view[offset] == 0x04) {
        // Dužina podataka o identifikatoru ovlaštenja
        offset += TLV_T_SIZE
        let identityCodeLength = view[offset]
        // Podaci o identifikatoru ovlaštenja
        offset += TLV_L_SIZE
        let identityCodeBuf = new Uint8Array(decryptedData, offset, identityCodeLength);
        offset += identityCodeLength
        code = String.fromCharCode.apply(null, identityCodeBuf);
    }


    // 6. Parsiranje vremena generisanja koda
    if (view[offset] == 0x05) {
        // Dužina podataka o vremenu generisanja koda
        offset += TLV_T_SIZE
        let createTimeLength = view[offset]
        // Podaci o vremenu generisanja koda
        offset += TLV_L_SIZE
        let createTimeBuf = new Uint8Array(decryptedData, offset, createTimeLength);
        offset += createTimeLength
        generationCodeTime = parseInt(common.arrayBufferToHexString(createTimeBuf.reverse()), 16)
    }


    // 7. Parsiranje vremena isteka koda
    if (view[offset] == 0x06) {
        // Dužina podataka o vremenu isteka koda
        offset += TLV_T_SIZE
        let expireTimeLength = view[offset]
        // Podaci o vremenu isteka koda
        offset += TLV_L_SIZE
        let expireTimeBuf = new Uint8Array(decryptedData, offset, expireTimeLength);
        offset += expireTimeLength
        expirationTime = parseInt(String.fromCharCode.apply(null, expireTimeBuf))
    }

    // 8. Provjera da li je pristupni kod istekao
    let timestamp = Date.now();
    expirationTime = generationCodeTime + expirationTime
    if (expirationTime * 1000 > timestamp) {
        return code
    } else {
        return null
    }

}

const code = {
    formatCode: function (msg, sqlObj) {
        if (!msg) {
            throw new Error("msg should not be null or empty")
        }
        if (!sqlObj) {
            throw new Error("sqlObj should not be null or empty")
        }
        if (!sqliteObj) {
            sqliteObj = sqlObj
        }

        let data = {}
        // Provjera vrijednosti koda
        if (comparePrefix(msg, "&llgy", "&llgy".length) || comparePrefix(msg, "&v101", "&v101".length)) {
            // Vrijednost koda 101
            data.type = 101
            data.code = decode101(msg.substring(5))
        }
        else if (comparePrefix(msg, "vg://v103", "vg://v103".length)) {
            // Vrijednost koda 103
            data.type = 103
            data.code = decode103(msg.substring(9)) ? decode103(msg.substring(9)) : msg.substring(9)
        } else if (comparePrefix(msg, "___VBAR_CONFIG_V1.1.0___", "___VBAR_CONFIG_V1.1.0___".length) || comparePrefix(msg, "___VBAR_KZB_V1.1.0___", "___VBAR_KZB_V1.1.0___".length)) {
            //TODO: Za sada ovako, promijeniti logiku toka nakon dogovora
            data.type = 'config'
            data.code = msg
        } else {
            data.type = 100
            data.code = msg
        }
        if (data.code) {
            return data
        } else {
            console.log("decode fail")
            return
        }
    }
}

export default code;