//build：20240311
// The button control has no new functions compared to the base class.
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let button = {}

button.build = function (id, parent) {
    let temp = utils.validateBuild(button.all, id, parent, 'button')
    let my = { type: 'button' }
    my.obj = new utils.GG.NativeButton({ uid: id }, temp)
    my.id = id
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default button;