//build: 20240301
// Low light QR code coding rules, including 101, 103, etc.
// Dependent components: dxDriver, dxCommon, dxLogger
import common from './dxCommon.js'
import base64 from './dxBase64.js'
import logger from './dxLogger.js'
let sqliteObj

// Compares the first N characters of two strings to see if they are equal
function comparePrefix(str1, str2, N) {
    let substring1 = str1.substring(0, N);
    let substring2 = str2.substring(0, N);
    return substring1 === substring2;
}



// 101 code value decoding
function decode101(str) {
    if (str.length < 5) {
        logger.info("无效二维码")
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
 * 103 code value decoding
 * 1. base64 decoding
 * 2. Analyze the organization number
 * 3. RSA decryption
 * 4. Parse identity type
 * 5. Parse permission identification
 * 6. Analyze code generation time
 * 7. Parse code expiration time
 * 8. Verify whether the passcode has expired
 * @param {*} str 
 * @returns 
 */
function decode103(str) {
    // FIXME This pubKey needs to be queried from configuration/config later.
    let TLV_T_SIZE = 2, TLV_L_SIZE = 2, offset = 0, code, decryptedData, generationCodeTime, expirationTime

    // 1. base64 decoding
    let decodeBuf = base64.toHexString(str)
    decodeBuf= hexStringToArrayBuffer(decodeBuf)
    let view = new Uint8Array(decodeBuf)
    let organizationNumber;
    // 2. Analyze the organization number
    if (view[offset] == 0x01) {
        offset += TLV_T_SIZE
        let orgNumLen = view[offset]
        offset += TLV_L_SIZE
        let orgNumBuf = new Uint8Array(decodeBuf, offset, orgNumLen);
        organizationNumber = String.fromCharCode.apply(null, new Uint8Array(orgNumBuf));
        logger.info("组织编号: " + organizationNumber)
        offset += orgNumLen
    } else {
        throw new Error("code invalid,organization number error")
    }

    // 3. RSA decryption
    if (view[offset] == 0x02) {
        // Organization number data length
        offset += TLV_T_SIZE
        let cipherTextLen = view[offset]
        offset += TLV_L_SIZE
        // RSA decryption of ciphertext
        let encryptedData = decodeBuf.slice(offset, offset + cipherTextLen)


        // The TODO secret key is hard-coded and needs to be exposed later.
        // RSA query key (can also be fixed or written in text), decrypt again according to the key
        // RSA decrypted data
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
    // One device has one key, which means that the public key used for decryption in the device is fixed. You can put the public key in configuration/config. Here, it is hard-coded by default.
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
    // 4. Parse identity type (type:103)
    if (view[offset] == 0x03) {
        // Identity type data length
        offset += TLV_T_SIZE
        let identityTypeLength = view[offset]
        // Identity type data
        offset += TLV_L_SIZE
        let identityTypeBuf = new Uint8Array(decryptedData, offset, identityTypeLength);
        let identityType = String.fromCharCode.apply(null, identityTypeBuf);
        offset += identityTypeLength
        logger.info("身份类型数据: " + identityType)
    }


    // 5. Parse permission identification (code)
    if (view[offset] == 0x04) {
        // Permission identification data length
        offset += TLV_T_SIZE
        let identityCodeLength = view[offset]
        // Permission identification data
        offset += TLV_L_SIZE
        let identityCodeBuf = new Uint8Array(decryptedData, offset, identityCodeLength);
        offset += identityCodeLength
        code = String.fromCharCode.apply(null, identityCodeBuf);
    }


    // 6. Analyze code generation time
    if (view[offset] == 0x05) {
        // Code generation time data length
        offset += TLV_T_SIZE
        let createTimeLength = view[offset]
        // Code generation time data
        offset += TLV_L_SIZE
        let createTimeBuf = new Uint8Array(decryptedData, offset, createTimeLength);
        offset += createTimeLength
        generationCodeTime = parseInt(common.arrayBufferToHexString(createTimeBuf.reverse()), 16)
    }


    // 7. Parse code expiration time
    if (view[offset] == 0x06) {
        // Code expiration time data length
        offset += TLV_T_SIZE
        let expireTimeLength = view[offset]
        // Code expiration time data
        offset += TLV_L_SIZE
        let expireTimeBuf = new Uint8Array(decryptedData, offset, expireTimeLength);
        offset += expireTimeLength
        expirationTime = parseInt(String.fromCharCode.apply(null, expireTimeBuf))
    }

    // 8. Verify whether the passcode has expired
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
        // check/determine code value
        if (comparePrefix(msg, "&llgy", "&llgy".length) || comparePrefix(msg, "&v101", "&v101".length)) {
            // 101 code value
            data.type = 101
            data.code = decode101(msg.substring(5))
        }
        else if (comparePrefix(msg, "vg://v103", "vg://v103".length)) {
            // 103 code value
            data.type = 103
            data.code = decode103(msg.substring(9)) ? decode103(msg.substring(9)) : msg.substring(9)
        } else if (comparePrefix(msg, "___VBAR_CONFIG_V1.1.0___", "___VBAR_CONFIG_V1.1.0___".length) || comparePrefix(msg, "___VBAR_KZB_V1.1.0___", "___VBAR_KZB_V1.1.0___".length)) {
            // Write TODO like this first, then change the flow logic after discussing it
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