//build：20240329
//switch kontrola
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let _switch = {}

_switch.build = function (id, parent) {
    let temp = utils.validateBuild(_switch.all, id, parent, '_switch')
    let my = {type: 'switch'}
    my.obj = new utils.GG.NativeSwitch({ uid: id }, temp)
    my.id = id

    /**
     * Prekidač
     * @param {boolean} en true/false
     */
    my.on = function (en) {
        if (en) {
            my.obj.addState(utils.STATE.CHECKED)
        } else {
            my.obj.clearState(utils.STATE.CHECKED)
        }
    }
    /**
     * Provjera da li je uključeno
     * @returns 返回true/false
     */
    my.isOn = function () {
        return my.obj.hasState(utils.STATE.CHECKED)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default _switch;