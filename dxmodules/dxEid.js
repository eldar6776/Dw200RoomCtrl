import { eidClass } from './libvbar-m-dxeid.so'
const eidObj = new eidClass();

const eid = {
    /**
     * @brief  Aktivacija e-certifikata
     * @param {string} sn       SN uređaja
     * @param {string} version  Prilagođeni broj verzije poslovanja
     * @param {string} mac      MAC adresa uređaja
     * @param {string} codeMsg  Podaci aktivacijskog koda e-certifikata
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
     * @brief   Dobijanje informacija
     */
    getInfo: function(){
        if(data == null || data.length < 1){
            throw("data should not be null or empty")
        }
        return eidObj.getInfo(data)
    },
    /**
     * @brief   Dobijanje broja verzije
     */
    getVersion: function(){
        return eidObj.getVersion()
    },
}

export default eid;