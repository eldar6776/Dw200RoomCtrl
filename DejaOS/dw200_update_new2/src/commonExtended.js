import common from '../dxmodules/dxCommon.js'




const commonExtended = {}


commonExtended.common = common



commonExtended.uint8ToString = function(array){
    let string = ''
    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        string += String.fromCharCode(element)
    }

    return string
}







export default commonExtended
