//build：20240329
// slider control
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let slider = {}

slider.build = function (id, parent) {
    let temp = utils.validateBuild(slider.all, id, parent, 'slider')
    let my = {type: 'slider'}
    my.obj = new utils.GG.NativeSlider({ uid: id }, temp)
    my.id = id

    /**
     * get/obtain/set value
     * @param {number} v set value
     * @param {boolean} en Whether to turn on the animation when setting the value, that is, the easing effect
     * @returns get/obtain value
     */
    my.value = function (v, en) {
        if (v == null || v == undefined) {
            return this.obj.lvSliderGetValue()
        } else {
            if (!utils.validateNumber(en)) {
                en = false
            }
            this.obj.lvSliderSetValue(v, en)
        }
    }
    /**
     * Set range
     * @param {number} min minimum value
     * @param {number} max maximum value
     */
    my.range = function (min, max) {
        this.obj.lvSliderSetRange(min, max)
    }

    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default slider;