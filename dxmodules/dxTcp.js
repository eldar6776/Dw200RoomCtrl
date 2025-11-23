import { channelClass } from '/usr/lib/libvbar-m-dxchannel.so'

const tcpObj = new channelClass();

const tcp = {
    /**
     * 创建客户端连接
     * @param {*} ip 
     * @param {*} port 
     * @param {*} timeout 
     * @param {*} heartEn 心跳（1开启，0关闭）
     * @param {*} heartTime 心跳间隔/s
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
             * 接收数据
             * @param {*} len 数据长度
             */
            receive: function (len) {
                if (!len) {
                    throw ("len should not be null or empty")
                }
                return tcpObj.tcpClientRecv(handle, len)
            },

            /**
             * 发送数据
             * @param {*} data 发送内容（字符串）
             */
            send: function (data) {
                if (!data) {
                    throw ("data should not be null or empty")
                }
                return tcpObj.tcpClientSend(handle, data)
            },

            /**
             * 判断tcp是否连接
             */
            isConnect: function () {
                return tcpObj.tcpClientIsConnect(handle)
            },

            /**
             * 刷新信道
             */
            flush: function () {
                return tcpObj.tcpClientFlush(handle)
            },

            /**
             * 销毁
             */
            destory: function () {
                return tcpObj.tcpClientDestory(handle)
            }
        }
    }
}

export default tcp;