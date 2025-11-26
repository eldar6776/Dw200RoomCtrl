//build:20240626
// Use this component to configure/confignetwork and monitor networkstatus/statechange
// Dependent components: dxMap, dxLogger, dxDriver, dxEventBus
import dxMap from './dxMap.js'
import bus from './dxEventBus.js'
import { netClass } from './libvbar-m-dxnet.so'
const netObj = new netClass();
const map = dxMap.get("default")

const net = {}
net.TYPE = {
    "UNKNOWN": 0,
    "ETHERNET": 1,
    "WIFI": 2,
    "4G": 4
}
net.DHCP = {
    STATIC: 1,
    DYNAMIC: 2,
    WIFI_AP: 3 //WiFi AP热点模式
}

/**
 * networkinitialize, wifi or Ethernet, if the network cannot be connected, it will automatically and continuously retry without repeated init. But after init, you need to poll/polling to get/obtainnetworkstatus/state (via msgReceive)
 * You can also use the simplified method dxNet.run directly without polling/polling
 * @param {object} options initializenetwork parameter
 * @param {number} type required network type, refer to net.TYPE enumeration
 * @param {number} dhcp required DHCP, refer to net.DHCP enumeration
 * @param {string} macAddr required mac address, default uses dxCommon.getUuid2mac() method to get/obtainmac address
 * @param {string} ip non-required network ip address
 * @param {string} gateway non-required gateway address
 * @param {string} netmask non-required subnet mask
 * @param {string} dns0 non-required DNS address
 * @param {string} dns1 non-required alternative DNS address
 * @returns 
 */
net.init = function (options) {
    let ret = netObj.init()
    if (!ret) {
        return false
    }
    if (!options) {
        throw new Error("dxNet.init: 'options' parameter should not be null or empty")
    }
    ret = netObj.setMasterCard(options.type)
    if (!ret) {
        return false
    }
    netObj.setMacaddr(options.type, options.macAddr)
    ret = netObj.cardEnable(options.type, true)
    if (!ret) {
        return false
    }
    if (options.dhcp === 1) {
        return netObj.setModeByCard(options.type, 1, {
            ip: options.ip,
            gateway: options.gateway,
            netmask: options.netmask,
            dns0: options.dns0,
            dns1: options.dns1,
        })
    } else if (options.dhcp === 2) {
        return netObj.setModeByCard(options.type, options.dhcp)
    }
    return false
}

/**
 * get/obtainMac address
 * @param {number} type required network type, refer to net.TYPE enumeration
 * @returns Mac address
 */
net.getMacaddr = function (type) {
    return netObj.getMacaddr(type)
}
/**
 * Set Mac address
 * @param {number} type required network type, refer to net.TYPE enumeration
 * @param {string} addr Mac address, required, format is similar to b2:a1:63:3f:99:b6
 * @returns true: success primary network card type, false failed
 */
net.setMacaddr = function (type, addr) {
    if (type === null || type === undefined) {
        throw new Error("dxNet.setMacaddr:'type' paramter should not be null or empty")
    }
    if (addr === null || addr === undefined || addr.length < 1) {
        throw new Error("dxNet.setMacaddr:'addr' paramter should not be null or empty")
    }
    return netObj.setMacaddr(type, addr)
}
/**
 * Enable the network card and add it to the network management module
 * @param {number} type required network type, refer to net.TYPE enumeration
 * @param {boolean} on on/off
 *  @returns   0：success <0 failed
 */
net.cardEnable = function (type, on) {
    if (type === null || type === undefined) {
        throw new Error("dxNet.cardEnable: 'type' parameter should not be null or empty")
    }
    if (on === null) {
        throw new Error("dxNet.cardEnable: 'on' parameter should not be null or empty")
    }
    return netObj.cardEnable(type, on)
}
/**
 *  netnetworkdestroy
 *  @return true：success，false failed
 */
net.exit = function () {
    return netObj.exit()
}
/**
 * Set the mode of the specified network card and the corresponding parameter network parameter
 * @param {number} type required network type, refer to net.TYPE enumeration
 * @param {number} mode required DHCP, refer to net.DHCP enumeration
 *  @param param  networkparameter
 *  @return true：success，false failed
 */
net.setModeByCard = function (type, mode, param) {
    if (type === null || type === undefined) {
        throw new Error("dxNet.setModeByCard: 'type' parameter should not be null or empty")
    }
    if (mode === null) {
        throw new Error("dxNet.setModeByCard:'mode' parameter should not be null or empty")
    }
    return netObj.setModeByCard(type, mode, param)
}
/**
 * get/obtain specifies the mode of the network card and the corresponding parameter network parameter
 * @param {number} type required network type, refer to net.TYPE enumeration
 * @returns If it is static network mode, ip, gateway and other information will be returned.
 */
net.getModeByCard = function (type) {
    if (type === null || type === undefined) {
        throw new Error("dxNet.getModeByCard: 'type' parameter should not be null or empty")
    }

    return netObj.getModeByCard(type)
}
/**
 * Set the primary network card, the application networkstatus/state is determined by the secondary network card
 * @param {number} type required network type, refer to net.TYPE enumeration
 *  @returns    true：success，false failed
 */
net.setMasterCard = function (type) {
    if (type === null || type === undefined) {
        throw new Error("dxNet.setMasterCard: 'type' parameter should not be null or empty")
    }
    return netObj.setMasterCard(type)
}
/**
 * get/obtain primary network card
 * @returns >0: success primary network card type, <0 failed
 */
net.getMasterCard = function () {
    return netObj.getMasterCard()
}
/**
 * get/obtainnetworkstatus/state is similar to {"status":4, "connected":true}, where the status is as follows
 * 0, not initialized
    1,    网卡处于关闭状态
    2,    网卡处于打开状态
    3,    网线已插入或者wifi已连接ssid 但未分配ip
    4,    已成功分配ip
    5     已连接指定服务或者通过测试可以连接到广域网
 *  @returns   networkstatus/state
 */
net.getStatus = function () {
    let status = netObj.getStatus()
    return { "status": status, "connected": status >= 4 }
}
/**
 * Set networkstatus/state
 *  @param {number} status networkstatus/state，required
 *  @returns true：success，false failed
 */
net.setStatus = function (status) {
    if (status === null || status === undefined) {
        throw new Error("dxNet.setStatus: 'status' parameter should not be null or empty")
    }
    return netObj.setStatus(status)
}

/**
 * get/obtainwifi list
 *  @param {*} timeout required
 *  @param {*} interval required
 * @returns wifi list
 */
net.netGetWifiSsidList = function (timeout, interval) {
    if (timeout === null || timeout === undefined) {
        throw new Error("dxNet.netGetWifiSsidList: 'timeout' parameter should not be null or empty")
    }
    if (interval === null) {
        throw new Error("dxNet.netGetWifiSsidList: 'interval' parameter should not be null or empty")
    }
    return netObj.netGetWifiSsidList(timeout, interval)
}
/**
 * connect/connection to wifi
 *  @param {*} ssid required
 *  @param {*} psk required
 *  @param {*} params required
 * @returns 
 */
net.netConnectWifiSsid = function (ssid, psk, params) {
    if (ssid === null) {
        throw new Error("dxNet.netConnectWifiSsid: 'ssid' parameter should not be null or empty")
    }
    if (psk === null) {
        throw new Error("dxNet.netConnectWifiSsid: 'psk' parameter should not be null or empty")
    }
    if (params === null) {
        throw new Error("dxNet.netConnectWifiSsid: 'params' parameter should not be null or empty")
    }
    return netObj.netConnectWifiSsid(ssid, psk, params)
}
/**
 * get/obtain saved hotspot list
 * @returns Saved hotspot list
 */
net.netGetWifiSavedList = function () {
    return netObj.netGetWifiSavedList()
}
/**
 * Disconnect the wifi hotspot of the current connect/connection
 * @returns  
 */
net.netDisconnetWifi = function () {
    return netObj.netDisconnetWifi()
}
/**
 * get/obtain current hotspot information
 *  @param timeout required
 * @returns  
 */
net.netGetCurrentWifiInfo = function (timeout) {
    if (timeout === null) {
        throw new Error("dxNet.netGetCurrentWifiInfo: 'timeout' parameter should not be null or empty")
    }
    return netObj.netGetCurrentWifiInfo(timeout)
}

/**
 * Check if the message queue is empty
 * @returns true is empty false is not empty
 */
net.msgIsEmpty = function () {
    return netObj.msgIsEmpty()
}
/**
 * Get the current status/statedata of the network from the message queue and return a structure similar to {"type":1,"status":4,"connected":true}
 * The type refers to the net.TYPE enumeration
 * The value of status is explained as follows:
 * 0, not initialized
    1,    网卡处于关闭状态
    2,    网卡处于打开状态
    3,    网线已插入或者wifi已连接ssid 但未分配ip
    4,    已成功分配ip
    5     已连接指定服务或者通过测试可以连接到广域网
 * @returns messagedata of string type
 */
net.msgReceive = function () {
    let res = JSON.parse(netObj.msgReceive());
    if (res.status >= 4) {
        res.connected = true
    } else {
        res.connected = false
    }
    return res
}

net.STATUS_CHANGE = '__netstatus__changed'

/**
 * Simplify the use of network components. There is no need to poll/polling to get/obtainnetworkstatus/state. The status/state of the network will be sent out through eventBussend.
 * run will only be executed once, and the basic network configuration/config cannot be modified after execution.
 * If you need to get/obtainnetworkstatus/statechange in real time, you can subscribe to the eventBus event. The topic of the event is net.STATUS_CHANGE, and the content of the event is similar to {"type":1,"status":4,"connected":true}
 * The type refers to the net.TYPE enumeration
 * The value of status is explained as follows:
 * 0, not initialized
    1,    网卡处于关闭状态
    2,    网卡处于打开状态
    3,    网线已插入或者wifi已连接ssid 但未分配ip
    4,    已成功分配ip
    5     已连接指定服务或者通过测试可以连接到广域网
 * @param {object} options refer to the options description of init
 */
net.run = function (options) {
    if (options === undefined || options.length === 0) {
        throw new Error("dxnet.run:'options' parameter should not be null or empty")
    }
    let workerFile = '/app/code/dxmodules/netWorker.js'
    let init = map.get("__net__run_init")
    if (!init) {//确保只初始化一次
        map.put("__net__run_init", options)
        bus.newWorker('__net', workerFile)
    }
}

/**
 * If net has a single thread, you can use runfunction directly, and a thread will be automatically started.
 * If you want to join other existing threads, you can use the following encapsulated function
 */
net.worker = {
    // before the while loop
    beforeLoop: function (options) {
        net.init(options)
    },
    // in while loop
    loop: function () {
        if (!net.msgIsEmpty()) {
            let res = net.msgReceive();
            if (res.status >= 4) {
                res.connected = true
            } else {
                res.connected = false
            }
            bus.fire(net.STATUS_CHANGE, res)
        }
    }
}

export default net;
