//build：20240329
//checkbox kontrola
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let checkbox = {}

checkbox.build = function (id, parent) {
    let temp = utils.validateBuild(checkbox.all, id, parent, 'checkbox')
    let my = { type: 'checkbox' }
    my.obj = new utils.GG.NativeCheckbox({ uid: id }, temp)
    my.id = id
    /**
     * Dobijanje/postavljanje teksta
     * @param {string} text Postavljanje teksta
     * @returns Dobijanje teksta
     */
    my.text = function (text) {
        if (text == null || text == undefined) {
            return this.obj.getText()
        } else {
            this.obj.setText(text)
        }
    }
    /**
     * Označavanje ili neoznačavanje
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
     * Provjera da li je označeno
     * @returns Vraća true/false
     */
    my.isSelect = function () {
        return my.obj.hasState(utils.STATE.CHECKED)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default checkbox;