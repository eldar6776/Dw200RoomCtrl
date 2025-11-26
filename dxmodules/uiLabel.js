//build：20240311
// label control
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let label = {}

label.build = function (id, parent) {
    let temp = utils.validateBuild(label.all, id, parent, 'label')
    let my = {type: 'label'}
    my.obj = new utils.GG.NativeLabel({ uid: id }, temp)
    my.id = id
    /**
     * Set label text or get/obtain text content
     * @param {string} t is not required. If it is not filled in or is not of string type, it is get/obtain text.
     */
    my.text = function (t) {
        if (utils.validateString(t)) {
            this.obj.lvLabelSetText(t)
        } else {
            return this.obj.lvLabelGetText()
        }
    }
    /**
     * Set the display mode after the text is too long, such as scrolling display or truncation or...etc.
     * @param {number} mode enumeration reference utils.LABEL_LONG_MODE
     */
    my.longMode = function (mode) {
        this.obj.lvLabelSetLongMode(mode)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default label;