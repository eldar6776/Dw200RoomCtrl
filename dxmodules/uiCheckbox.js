//build：20240329
// checkbox control
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let checkbox = {}

checkbox.build = function (id, parent) {
    let temp = utils.validateBuild(checkbox.all, id, parent, 'checkbox')
    let my = { type: 'checkbox' }
    my.obj = new utils.GG.NativeCheckbox({ uid: id }, temp)
    my.id = id
    /**
     * get/obtain/set text
     * @param {string} text set text
     * @returns get/obtain text
     */
    my.text = function (text) {
        if (text == null || text == undefined) {
            return this.obj.getText()
        } else {
            this.obj.setText(text)
        }
    }
    /**
     * Check or uncheck
     * @param {boolean} en true/false
     */
    my.select = function (en) {
        if (en) {
            if (!my.obj.hasState(utils.STATE.CHECKED)) {
                my.obj.addState(utils.STATE.CHECKED)
            }
        } else {
            my.obj.clearState(utils.STATE.CHECKED)
        }
    }
    /**
     * check/determine whether to select
     * @returns returns true/false
     */
    my.isSelect = function () {
        return my.obj.hasState(utils.STATE.CHECKED)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default checkbox;