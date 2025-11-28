import log from '../dxmodules/dxLogger.js'
import std from '../dxmodules/dxStd.js'
import common from '../dxmodules/dxCommon.js'
import dxCode from '../dxmodules/dxCode.js'
import dxNet from '../dxmodules/dxNet.js'
import dxNtp from '../dxmodules/dxNtp.js'
import config from '../dxmodules/dxConfig.js'
import nfc from '../modules/nfcExtended.js'




let code = {
    options1: { id: 'capturer1', path: '/dev/video11' },
    options2: { id: 'decoder1', name: "decoder v4", width: 800, height: 600 },
    init: function () {
        dxCode.worker.beforeLoop(this.options1, this.options2)
    },
    loop: function () {
        dxCode.worker.loop()
    }
}
let net={
    init:function(){
        dxNet.worker.beforeLoop({type:dxNet.TYPE.ETHERNET, dhcp:dxNet.DHCP.DYNAMIC,macaddr: common.getUuid2mac(),})
    },
    loop:function(){
        dxNet.worker.loop()
    }
}
/*let nfc ={
    init: function() {
        dxNfc.worker.beforeLoop({ id: 'nfc1', m1: true, psam: false })
    },
    loop: function() {
        dxNfc.worker.loop()
    }
}*/


function run() {
    code.init()
    net.init()
    nfc.init()
    std.setInterval(() => {
        try {
           code.loop()
           net.loop()
           nfc.loop()
        } catch (error) {
            log.error(error)
        }
    }, 5)


    /*std.setTimeout(() => {
        dxNtp.startSync(config.get("ntp.server"), config.get("ntp.interval"), config.get("ntp.retryInterval"))
    }, 1000)*/
}

try {
    run()
} catch (error) {
    log.error(error)
}
