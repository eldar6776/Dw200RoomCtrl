import dxCommon from '../dxmodules/dxCommon.js';
import logger from '../dxmodules/dxLogger.js'
import * as os from "os"

// 获取设备唯一标识
let uuid = dxCommon.getUuid()

function main() {
    for (let index = 0; index < 999999999999; index++) {
        let time = Math.floor(Date.parse(new Date()))
        logger.info(`hello: ${uuid} , ${time}`)
        os.sleep(1000)
    }
}

main()

