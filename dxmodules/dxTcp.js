import { channelClass } from '/usr/lib/libvbar-m-dxchannel.so'

const tcpObj = new channelClass();

const tcp = {
    /**
     * Kreiranje klijentske veze
     * @param {*} ip 
     * @param {*} port 
     * @param {*} timeout 
     * @param {*} heartEn Otkucaj srca (1 za uključeno, 0 za isključeno)
     * @param {*} heartTime Interval otkucaja srca u sekundama
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
            throw("tcp inicijalizacija nije uspjela")
        }
        return {
            /**
             * Primanje podataka
             * @param {*} len Dužina podataka
             */
            receive: function (len) {
                if (!len) {
                    throw ("len should not be null or empty")
                }
                return tcpObj.tcpClientRecv(handle, len)
            },

            /**
             * Slanje podataka
             * @param {*} data Sadržaj za slanje (string)
             */
            send: function (data) {
                if (!data) {
                    throw ("data should not be null or empty")
                }
                return tcpObj.tcpClientSend(handle, data)
            },

            /**
             * Provjera da li je TCP povezan
             */
            isConnect: function () {
                return tcpObj.tcpClientIsConnect(handle)
            },

            /**
             * Osvježavanje kanala
             */
            flush: function () {
                return tcpObj.tcpClientFlush(handle)
            },

            /**
             * Uništi
             */
            destory: function () {
                return tcpObj.tcpClientDestory(handle)
            }
        }
    }
}

export default tcp;