//build:20240524
// It is used to simplify the use of the low-light communication protocol of the mqtt component. The mqtt is encapsulated in this worker. The user only needs to subscribe to the event of the event center to monitor the mqtt.
import log from './dxLogger.js'
import net from './dxNet.js'
import mqtt from './dxMqtt.js'
import dxMap from './dxMap.js'
import std from './dxStd.js'
import * as os from "os";
const map = dxMap.get('default')
const id = "{{id}}"
const options = map.get("__mqtt__run_init" + id)
let connected = false
function run() {
    mqtt.init(options.mqttAddr, options.clientId, options.username, options.password, options.prefix, options.qos, options.willTopic, options.willMessage, options.id)
    log.info('mqtt start......,id =', id)
    os.sleep(2000)//等待2秒

    __bus.on(mqtt.RECONNECT, (options) => {
        mqtt.destroy(options.id)
        mqtt.init(options.mqttAddr, options.clientId, options.username, options.password, options.prefix, options.qos, options.willTopic, options.willMessage, options.id)
    })

    std.setInterval(() => {
        try {
            if (mqtt.isConnected(options.id) && net.getStatus().connected) {
                if (!connected) {
                    _fireChange(true)
                    if (options.subs) {
                        mqtt.subscribes(options.subs, options.qos, options.id)
                    }
                }
            } else {
                if (connected) {
                    _fireChange(false)
                }
                // Reconnect
                mqtt.reconnect(options.willTopic, options.willMessage, options.id)
                os.sleep(2000)//重连后等待2秒
            }
        } catch (error) {
            log.error(error)
        }
    }, 3000)
    std.setInterval(() => {
        // Enter message monitoring after connect/connectionsuccess
        if (connected) {
            if (!mqtt.msgIsEmpty(options.id)) {
                let msg = mqtt.receive(options.id)
                __bus.fire(mqtt.RECEIVE_MSG + options.id, msg)//bus.newworker的时候会import eventbus as __bus
            }
        }
    }, 10);
}

try {
    run()
} catch (error) {
    log.error(error)
}

function _fireChange(status) {
    __bus.fire(mqtt.CONNECTED_CHANGED + options.id, status ? 'connected' : 'disconnected')//bus.newworker的时候会import eventbus as __bus
    connected = status
}
