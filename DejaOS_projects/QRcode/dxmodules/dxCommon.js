import { commonClass } from './libvbar-m-dxcommon.so'

const commonObj = new commonClass();

const common = {
    /**
     * 获取系统启动的运行时间
     * @returns 
     */
    getUptime: function () {
        return commonObj.getUptime();
    },

    /**
     * 获取系统的总内存
     * @returns 
     */
    getTotalmem: function () {
        return commonObj.getTotalmem();
    },

    /**
     * 获取系统剩余内存
     * @returns 
     */
    getFreemem: function () {
        return commonObj.getFreemem();
    },

    /**
     * 获取系统可用磁盘总量
     * @param {*} path
     */
    getTotaldisk: function (path) {
        return commonObj.getTotaldisk(!path ? "/" : path);
    },

    /**
     * 获取系统磁盘剩余可用量
     * @param {*} path
     * @returns 
     */
    getFreedisk: function (path) {
        return commonObj.getFreedisk(!path ? "/" : path);
    },

    /**
     * 获取CPU ID
     * @param {*} len 
     * @returns 
     */
    getCpuid: function () {
        return commonObj.getCpuid(33);
    },

    /**
     * 获取设备uuid（字符串）
     * @returns 
     */
    getUuid: function () {
        return commonObj.getUuid(19);
    },

    /**
     * 获取设备唯一标识
     * @returns 
     */
    getSn: function () {
        let sn = std.loadFile('/etc/.sn')
        if (sn) {
            return sn
        } else {
            return commonObj.getUuid(19);
        }
    },

    /**
     * 获取通过uuid计算的mac地址
     * @returns 
     */
    getUuid2mac: function () {
        return commonObj.getUuid2mac(19);
    },

    /**
     * 获取cpu占用率
     * @returns 
     */
    getFreecpu: function () {
        return commonObj.getFreecpu();
    },

    /**
     * base64加密
     * @param {*} code 
     */
    base64Encode: function (code) {
        return commonObj.base64Encode(code, code.length);
    },

    /**
     * @brief  base64字符串解密
     * @param {*} code      待解码的数据
     * @returns 
     */
    base64Decode: function (code) {

        if (code == null || code.length < 1) {
            // throw ("code should not be null or empty")
        }

        return commonObj.base64Decode(code, code.length);
    },
    /**
     * @brief   Stirng RSA 解密
     */
    stringRsaDecrypt: function (data, publicKey) {
        if (data == null || data.length < 1) {
            throw ("data should not be null or empty")
        }
        if (publicKey == null || publicKey.length < 1) {
            throw ("publicKey should not be null or empty")
        }
        return commonObj.stringRsaDecrypt(data, publicKey)
    },

    /**
     * @brief   ArrayBuffer RSA 解密
     */
    arrayBufferRsaDecrypt: function (data, publicKey) {
        if (data == null || data.length < 1) {
            throw ("data should not be null or empty")
        }
        if (publicKey == null || publicKey.length < 1) {
            throw ("publicKey should not be null or empty")
        }
        return commonObj.arrayBufferRsaDecrypt(data, publicKey)
    },

    /**
     * @brief   Stirng aes 加密
     */
    aes128EcbEncrypt: function (input, key) {
        return commonObj.aes128EcbEncrypt(input, key)
    },
    /**
     * @brief   Stirng aes 解密
     */
    aes128EcbDecrypt: function (input, key) {
        return commonObj.aes128EcbDecrypt(input, key)
    },

    /**
     * 执行命令
     * @param {*} cmd 命令
     * @returns 
     */
    system: function (cmd) {
        return commonObj.system(cmd)
    },

    /**
     * 执行命令
     * @param {*} cmd 命令
     * @returns 
     */
    systemBrief: function (cmd) {
        return commonObj.systemBrief(cmd)
    },

    /**
     * 执行命令并返回结果
     * @param {*} cmd 命令
     * @param {*} resLen 接收数据长度
     * @returns 
     */
    systemWithRes: function (cmd, resLen) {
        return commonObj.systemWithRes(cmd, resLen)
    },

    /**
     * 阻塞执行
     * @param {*} cmd 命令
     * @returns 
     */
    systemBlocked: function (cmd) {
        return commonObj.systemBlocked(cmd)
    },

    /**
     * 异步延迟重启
     * @param {*} delay_s 延迟时间
     * @returns 
     */
    asyncReboot: function (delay_s) {
        return commonObj.asyncReboot(delay_s)
    },

    /**
     * bcc校验
     * @param {*} data eg:[0x55,0xAA,0xC2,0x07,0x00,0x03,0x91,0xF1,0x5C,0xD1,0x19,0xC4]
     * @returns eg:9
     */
    calculateBcc: function (data) {
        return commonObj.calculateBcc(data)
    },

    /**
     * aes cbc解密
     * @param {*}
     * @returns 
     */
    aes128CbcDecrypt: function (val1, val2, val3) {
        return commonObj.aes128CbcDecrypt(val1, val2, val3)
    },

    /**
     * aes cbc加密
     * @param {*}
     * @returns 
     */
    aes128CbcEncrypt: function (val1, val2, val3) {
        return commonObj.aes128CbcEncrypt(val1, val2, val3)
    },

    /**
     * crc校验
     * @param {*} delay_s 计算得到的crc校验位
     * @returns 
     */
    crc32: function (content) {
        return commonObj.crc32(content)
    },

    /**
     * 计算MD5哈希
     * @param {*} 
     * @returns 
     */
    md5Hash: function (value) {
        return commonObj.md5Hash(value)
    },

    /**
     * 文件计算MD5哈希
     * @param {*} 文件路径
     * @returns 
     */
    md5HashFile: function (filePath) {
        return commonObj.md5HashFile(filePath)
    },

    /**
     * 计算HMAC MD5哈希
     * @param {*} 
     * @returns 
     */
    hmacMd5Hash: function (val1, val2) {
        return commonObj.hmacMd5Hash(val1, val2)
    },

    /**
     * 文件计算HMAC MD5哈希
     * @param {*} 
     * @returns 
     */
    hmacMd5HashFile: function (filePath, value) {
        return commonObj.hmacMd5HashFile(filePath, value)
    },

    /**
     * 切换设备模式
     * @description 模式切换后会重启设备，进入指定模式，使用方法时需完整维护相互切换的逻辑，切换为业务模式后不能使用IDE功能
     * @param {*} mode 业务模式：1 开发模式：2
     * @returns true false
     */
    setMode: function (mode) {
        if (mode == 1) {
            //业务模式
            commonObj.systemWithRes(`echo 'app' > /etc/.mode`, 2)
            // 1.0版本切换为其他模式后删除工厂检测（后续版本可能会调整）
            commonObj.systemWithRes(`rm -rf /test`, 2)
        }else if (mode == 2) {
            //开发模式
            commonObj.systemWithRes(`echo 'debug' > /etc/.mode`, 2)
            // 1.0版本切换为其他模式后删除工厂检测（后续版本可能会调整）
            commonObj.systemWithRes(`rm -rf /test`, 2)
        }else{
            return false
        }
        commonObj.systemWithRes(`sync`, 2)
        commonObj.asyncReboot(2)
        return true
    },

    /**
     * 查询设备模式
     * @description 获取设备当前模式
     * @returns 业务模式：1，开发模式：2，工厂模式：28， 异常模式：-1
     */
    getMode: function () {
        let ret = commonObj.systemWithRes(`test -e "/etc/.mode" && echo "OK" || echo "NO"`, 2)
        if (ret.includes('NO')) {
            return 28
        }
        let mode = commonObj.systemWithRes(`cat "/etc/.mode"`, 10)
        if(mode.includes('app')){
            return 1
        }else if(mode.includes('debug')){
            return 2
        }else{
            return -1
        }
    }
}

export default common;