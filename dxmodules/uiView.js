//build：20240314
// Basic rectangle object, similar to a div, can load any other controls
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let view = {}
/**
 * Create a view and load it on the parent control object
 * @param {string} id Control id, required
 * @param {object} parent Parent object
 * @returns The created view object */
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