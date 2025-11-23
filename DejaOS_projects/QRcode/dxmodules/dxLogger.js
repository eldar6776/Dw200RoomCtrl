//build:20240131
import dxCommon from './dxCommon.js'

const logger = {}
//-----------------------------------public----------------------
logger.info = function (data) {
    log(data, "INFO ")
}
logger.error = function (data) {
    log(data, "ERROR ")
}
logger.debug = function (data) {
    log(data, "DEBUG ")
}
//-----------------------------------private----------------------
function log(message, level) {
    if (message === undefined) {
        message = 'undefined'
    } else if (message === null) {
        message = 'null'
    }
    if ((typeof message) == 'object') {
        message = JSON.stringify(message)
    }

    let content = `[${level}${getTime()}]: ${message}`
    dxCommon.systemBrief(`echo '${content}'`)
}

function getTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const day = ('0' + now.getDate()).slice(-2);
    const hours = ('0' + now.getHours()).slice(-2);
    const minutes = ('0' + now.getMinutes()).slice(-2);
    const seconds = ('0' + now.getSeconds()).slice(-2);
    const milliseconds = ('0' + now.getMilliseconds()).slice(-3);
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
}
export default logger