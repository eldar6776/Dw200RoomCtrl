//build：20240329
// dropdown control
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let dropdown = {}

dropdown.build = function (id, parent) {
    let temp = utils.validateBuild(dropdown.all, id, parent, 'dropdown')
    let my = {type: 'dropdown'}
    my.obj = new utils.GG.NativeDropdown({ uid: id }, temp)
    my.id = id
    /**
     * Set drop-down option content
     * @param {array} arr option content, which is a string array, each item is an option
     */
    my.setOptions = function (arr) {
        this.obj.setOptions(arr.join('\n'))
    }
    /**
     * get/obtain drop-down option list
     * @returns returns a list object, which is a base class object and its font can be set individually
     */
    my.getList = function () {
        let res = {}
        res.obj = this.obj.getList()
        return Object.assign(res, base)
    }
    /**
     * Set the selected item, this will be selected by default
     * @param {number} index selected item index
     */
    my.setSelected = function (index) {
        this.obj.setSelected(index)
    }
    /**
     * get/obtain selected item index
     * @returns returns the currently selected index
     */
    my.getSelected = function () {
        return this.obj.getSelected()
    }
    /**
     * Set the icon attached to the drop-down box. The default is a downward arrow.
     * @param {string} icon icon address
     */
    my.setSymbol = function (icon) {
        this.obj.setSymbol(icon)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default dropdown;