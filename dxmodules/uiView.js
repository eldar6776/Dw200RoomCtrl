//build：20240314
//Osnovni pravougaoni objekat, sličan div-u, može učitati bilo koju drugu kontrolu
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let view = {}
/**
 * Kreira 'view' i učitava ga na roditeljsku kontrolu
 * @param {string} id ID kontrole, obavezno
 * @param {object} parent Roditeljski objekat
 * @returns Kreirani 'view' objekat
 */
view.build = function (id, parent) {
    let temp = utils.validateBuild(view.all, id, parent, 'view')
    let my = {type: 'view'}
    if (temp === 0 || temp === 1 || temp === 2) {
        my.obj = new utils.GG.NativeBasicComponent({ uid: id }, null, temp)
    }
    else {
        my.obj = new utils.GG.NativeBasicComponent({ uid: id }, temp)
    }
    my.id = id
    let comp = Object.assign(my, base);
    utils.setParent(this.all,comp,parent)
    return comp;
}

export default view;