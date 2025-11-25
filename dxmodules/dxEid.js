import { eidClass } from './libvbar-m-dxeid.so'
const eidObj = new eidClass();

const eid = {
    /**
     * @brief  Cloud certificate activation
     * @param {string} sn       device sn
     * @param {string} version  Business custom version number
     * @param {string} mac      device mac address
     * @param {string} codeMsg  Cloud certificate activation code data
     * @returns 
     */
    active: function(sn, version, mac, codeMsg){
        
        if(!sn){
            throw("sn should not be null or empty")
        }
        if(!version){
            throw("version should not be null or empty")
        }
        if(!mac){
            throw("mac should not be null or empty")
        }
        if(!codeMsg){
            throw("codeMsg should not be null or empty")
        }
        return eidObj.active(sn, version, mac, codeMsg);
    },
    /**
     * @brief   Get information
     */
    getInfo: function(){
        if(data == null || data.length < 1){
            throw("data should not be null or empty")
        }
        return eidObj.getInfo(data)
    },
    /**
     * @brief   Get version number
     */
    getVersion: function(){
        return eidObj.getVersion()
    },
}

export default eid;