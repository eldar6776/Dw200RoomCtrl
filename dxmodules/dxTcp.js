import { channelClass } from '/usr/lib/libvbar-m-dxchannel.so'

const tcpObj = new channelClass();

const tcp = {
    /**
     * Create clientconnect/connection
     * @param {*} ip 
     * @param {*} port 
     * @param {*} timeout 
     * @param {*} heartEn heartbeat (1 is on, 0 is off)
     * @param {*} heartTime heartbeat interval/s
     */
    create: function (ip, port, timeout, heartEn, heartTime) {
        if (!ip) {
            throw ("ip should not be null or empty")
        }
        if (!port) {
            throw ("port should not be null or empty")
        }
        timeout = timeout ? timeout : 5000
        heartEn = heartEn ? heartEn : 1
        heartTime = heartTime ? heartTime : 60
        let handle = tcpObj.tcpClientCreate(1, ip, port, timeout, heartEn, heartTime)
        if(!handle){
            throw("tcp初始化失败")
        }
        return {
            /**
             *  receivedata
             * @param {*} len data length
             */
            receive: function (len) {
                if (!len) {
                    throw ("len should not be null or empty")
                }
                return tcpObj.tcpClientRecv(handle, len)
            },

            /**
             *  senddata
             * @param {*} data sendcontent (string)
             */
            send: function (data) {
                if (!data) {
                    throw ("data should not be null or empty")
                }
                return tcpObj.tcpClientSend(handle, data)
            },

            /**
             * check/determinetcp whether connect/connection
             */
            isConnect: function () {
                return tcpObj.tcpClientIsConnect(handle)
            },

            /**
             * refresh channel
             */
            flush: function () {
                return tcpObj.tcpClientFlush(handle)
            },

            /**
             *  destroy
             */
            destory: function () {
                return tcpObj.tcpClientDestory(handle)
            }
        }
    }
}

export default tcp;