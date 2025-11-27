//build:20240411
//Use mqtt protocol to communicate with mqtt server or communicate with other mqtt clients through mqtt broker
//Dependent components dxMap,dxLogger,dxDriver,dxCommon,dxEventBus,dxNet
import { mqttClass } from './libvbar-m-dxmqtt.so'
import * as os from "os"
import std from './dxStd.js'
import dxMap from './dxMap.js'
import dxCommon from './dxCommon.js'
import bus from './dxEventBus.js'
const map = dxMap.get("default")
const mqttObj = new mqttClass();
const mqtt = {}
/**
 * initializemqtt related properties and create connect/connection, please use the dxMqtt component in the worker or use the simplified function dxMqtt.run
 * @param {string} mqttAddr mqttserver address, required, starts with tcp://, format is tcp://ip:port
 * @param {string} clientId clientid, required, please use different clientid for different devices
 * @param {string} username not required, mqtttusername
 * @param {string} password not required, mqttpassword
 * @param {string} prefix is ​​not required, and the default is an empty string. This means that a prefix is ​​automatically added before the topic.
 * @param {number} qos 0,1,2 is not required, and the default is 1. 0 means that the message is sent at most once, and the message is discarded after being sent; 1 means that the message is sent at least once, which can ensure that the message is received by the receiver, but there may be situations where the receiver receives duplicate messages; 2 means that messages are sent successfully and only sent once, high resource overhead
 * @param {string} willTopic is not required, last willtopic. When communicating through the broker, devicedisconnect will automatically trigger an mqttlast willmessage. This is the topic of the last willmessage.
 * @param {string} willMessage is not required, last willcontent, devicedisconnect will automatically trigger a mqttlast willmessage when communicating through the broker, this is the content of the last willmessage
 * @param {string} id handleid, not required (if you initialize multiple instances, you need to pass in a unique id)
 */
mqtt.init = function (mqttAddr, clientId, username, password, prefix = "", qos = 1, willTopic, willMessage, id) {

    if (mqttAddr === undefined || mqttAddr.length === 0) {
        throw new Error("dxMqtt.init: 'mqttAddr' parameter should not be null or empty")
    }
    if (clientId === undefined || clientId.length === 0) {
        throw new Error("dxMqtt.init: 'clientId' parameter should not be null or empty")
    }
    let pointer = mqttObj.init(mqttAddr, clientId, username, password, prefix, qos, willTopic, willMessage);
    if (pointer === undefined || pointer === null) {
        throw new Error("dxMqtt.init: mqtt init failed")
    }

    dxCommon.handleId("mqtt", id, pointer)
}

/**
 * Reconnect/connection, such as sudden network disconnect after connect/connectionsuccess, no need to re-init, just reconnect directly
 * @param {string} willTopic is not required, last willtopic. When communicating through the broker, devicedisconnect will automatically trigger an mqttlast willmessage. This is the topic of the last willmessage.
 * @param {string} willMessage is not required, last willcontent, devicedisconnect will automatically trigger a mqttlast willmessage when communicating through the broker, this is the content of the last willmessage
 * @param {string} id handleid, not required (must match the id in init)
 */
mqtt.reconnect = function (willTopic, willMessage, id) {
    let pointer = dxCommon.handleId("mqtt", id)
    return mqttObj.recreate(pointer, willTopic, willMessage);
}

/**
 * subscribe to multiple topics
 * @param {array} topics required, array of topics to subscribe to, you can subscribe to multiple ones at the same time
 * @param {number} qos is not required, and the default is 1. 0 means that the message is sent at most once, and the message is discarded after sending; 1 means that the message is sent at least once, which can ensure that the message is received by the receiver, but there may be situations where the receiver receives repeated messages; 2 means that messages are sent successfully and only sent once, high resource overhead
 * @param {string} id handleid, not required (must match the id in init)
 * @returns 
 */
mqtt.subscribes = function (topics, qos, id) {
    if (topics === undefined || topics.length === 0) {
        throw new Error("dxMqtt.subscribes: 'topics' parameter should not be null or empty")
    }

    if (qos === undefined) {
        qos = 1
    }
    let pointer = dxCommon.handleId("mqtt", id)
    return mqttObj.subscribes(pointer, topics, qos);
}

/**
 * Check/determinemqtt whether connect/connection, if the network is disconnected after connect/connectionsuccess, connect/connection will also be disconnected
 * @param {string} id handleid, not required (must match the id in init)
 *  @returns falsefailed； truesuccess
 */
mqtt.isConnected = function (id) {
    let pointer = dxCommon.handleId("mqtt", id)
    return mqttObj.isConnected(pointer);
}

/**
 *  querymqttconfiguration/config
 * @param {string} id handleid, not required (must match the id in init)
 *  @returns mqttconfiguration/config
 */
mqtt.getConfig = function (id) {
    let pointer = dxCommon.handleId("mqtt", id)
    return mqttObj.getConfig(pointer);
}

/**
 *  mqttconfiguration/configupdate
 * @param {object} options configuration/configparameter，most can use default values
 * @param {string} options.mqttAddr mqttserver address, required, starts with tcp://, format is tcp://ip:port
 * @param {string} options.clientId clientid, required, please use different clientid for different devices
 * @param {string} options.userName not required, mqtttusername
 * @param {string} options.password not required, mqttpassword
 * @param {string} options.prefix is ​​not required, and the default is an empty string. This means that a prefix is ​​automatically added before the topic.
 * @param {number} options.qos 0,1,2 are not required, and the default is 1. 0 means that the message is sent at most once, and the message is discarded after being sent; 1 means that the message is sent at least once, which can ensure that the message is received by the receiver, but there may be situations where the receiver receives duplicate messages; 2 means that messages are sent successfully and only sent once, high resource overhead
 * @param {string} options.ssl not required, sslconfiguration/config class
 */
mqtt.updateConfig = function (options, id) {
    if (!options) {
        throw new Error("dxMqtt.updateConfig: 'options' parameter should not be null or empty")
    }
    if (options.mqttAddr === undefined || options.mqttAddr.length === 0) {
        throw new Error("dxMqtt.updateConfig: 'options.mqttAddr' parameter should not be null or empty")
    }
    if (options.clientId === undefined || options.clientId.length === 0) {
        throw new Error("dxMqtt.updateConfig: 'options.clientId' parameter should not be null or empty")
    }
    if (options.qos === undefined || options.qos == null) {
        throw new Error("dxMqtt.updateConfig: 'options.qos' parameter should not be null or empty")
    }
    let pointer = dxCommon.handleId("mqtt", id)
    let res = mqttObj.setConfig(pointer, options);
    return res;
}

/**
 *  sendmqttrequest
 *  @param {string} topic topic，required
 * @param {string} payload message body content, required
 * @param {string} id handleid, not required (must match the id in init)
 */
mqtt.send = function (topic, payload, id) {
    if (topic === undefined || topic.length === 0) {
        throw new Error("dxMqtt.send:'topic' parameter should not be null or empty")
    }
    if (payload === undefined || payload.length === 0) {
        throw new Error("dxMqtt.send:'payload' parameter should not be null or empty")
    }
    let pointer = dxCommon.handleId("mqtt", id)
    return mqttObj.sendMsg(pointer, topic, payload);
}

/**
 * receivemqttdata, need poll/polling to get/obtain
 * @param {string} id handleid, not required (must match the id in init)
 * @return mqttrequestdata, structure is: {topic:'topic',payload:'content'}
 */
mqtt.receive = function (id) {
    let msg = mqttObj.msgReceive(id);
    return JSON.parse(msg);
}

/**
 * Check/determine whether there is new data. Generally, check/determine there is data first and then call receive to get/obtaindata.
 * @param {string} id handleid, not required (must match the id in init)
 * @returns false has data; true has no data
 */
mqtt.msgIsEmpty = function (id) {
    return mqttObj.msgIsEmpty(id);
}

/**
 *  destroymqttinstance
 * @param {string} id handleid, not required (must match the id in init)
 */
mqtt.destroy = function (id) {
    let pointer = dxCommon.handleId("mqtt", id)
    mqttObj.deinit(pointer);
}

mqtt.RECEIVE_MSG = '__mqtt__MsgReceive'
mqtt.CONNECTED_CHANGED = '__mqtt__Connect_changed'
mqtt.RECONNECT = '__mqtt__Reconnect'

/**
 * Use simple method/way to implement mqttclient. You only need to call this function to implement mqttclient.
 * Receiving the message will trigger an event to dxEventBussend. The topic of the event is mqtt.RECEIVE_MQTT_MSG, and the content is {topic:'',payload:''}format.
 * If you need sendmessage, directly use the mqtt.send method. The dataformat of mqttsend is similar: { topic: "sendtopic1", payload: JSON.stringify({ a: i, b: "ssss" }) }
 * A change in mqtt's connect/connectionstatus/state will trigger an event to dxEventBussend. The topic of the event is mqtt.CONNECTED_CHANGED, and the content is 'connected' or 'disconnect'
 * mqtt requires a network, so you must ensure that the dxNet component is initialized before use.
 * @param {object} options mqtt related parameters, required
 * @param {string} options.mqttAddr mqttserver address, required, starts with tcp://, format is tcp://ip:port
 * @param {string} options.clientId clientid, required, please use different clientid for different devices
 * @param {string} options.username not required, mqtttusername
 * @param {string} options.password not required, mqttpassword
 * @param {string} options.prefix is ​​not required, and the default is an empty string. This means that a prefix is ​​automatically added before the topic.
 * @param {number} options.qos 0,1,2 are not required, and the default is 1. 0 means that the message is sent at most once, and the message is discarded after being sent; 1 means that the message is sent at least once, which can ensure that the message is received by the receiver, but there may be situations where the receiver receives duplicate messages; 2 means that messages are sent successfully and only sent once, high resource overhead
 * @param {string} options.willTopic non-required, last willtopic. When communicating through the broker, devicedisconnect will automatically trigger an mqttlast willmessage. This is the topic of the last willmessage.
 * @param {string} options.willMessage Not required, last willcontent, devicedisconnect will automatically trigger an mqttlast willmessage when communicating through the broker, this is the content of the last willmessage
 * @param {array} options.subs Not required, topic group to subscribe to
 * @param {string} options.id handleid, not required (if you initialize multiple instances, you need to pass in a unique id)
 */
mqtt.run = function (options) {
    if (options === undefined || options.length === 0) {
        throw new Error("dxmqtt.run:'options' parameter should not be null or empty")
    }
    if (options.id === undefined || options.id === null || typeof options.id !== 'string') {
        //  handleid
        options.id = ""
    }
    let oldfilepre = '/app/code/dxmodules/mqttWorker'
    let content = std.loadFile(oldfilepre + '.js').replace("{{id}}", options.id)
    let newfile = oldfilepre + options.id + '.js'
    std.saveFile(newfile, content)
    let init = map.get("__mqtt__run_init" + options.id)
    if (!init) {//确保只初始化一次
        map.put("__mqtt__run_init" + options.id, options)
        bus.newWorker(options.id || "__mqtt", newfile)
    }
}
/**
 * get/obtain the status/state of the current mqttconnect/connection
 * @param {string} id handleid, not required (must match the id in init)
 * @returns 'connected' or 'disconnected'
 */
mqtt.getConnected = function (id) {
    if (id == undefined || id == null) {
        id = ""
    }
    return mqtt.isConnected(id) ? "connected" : "disconnected"
}

export default mqtt;
