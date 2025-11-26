//build：20240329
// list control
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let list = {}

list.build = function (id, parent) {
    let temp = utils.validateBuild(list.all, id, parent, 'list')
    let my = {type: 'list'}
    my.obj = new utils.GG.NativeList({ uid: id }, temp)
    my.id = id
    /**
     * Add a single text item
     * @param {string} text The text content of the item
     * @returns the base object of the item itself
     */
    my.addText = function (text) {
        let res = {}
        res.obj = this.obj.lvListAddText(text)
        return Object.assign(res, base)
    }
    /**
     * Add a single button item
     * @param {string} The icon path in front of the src item
     * @param {string} text The text content of the item
     * @returns the base object of the item itself
     */
    my.addBtn = function (src, text) {
        let res = {}
        res.obj = this.obj.lvListAddBtn(src, text)
        return Object.assign(res, base)
    }
    /**
     * get/obtain button item text content
     * @param {string} btn button item
     * @returns the text content of the button item
     */
    my.getBtnText = function (btn) {
        return this.obj.lvListGetBtnText(btn.obj)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default list;