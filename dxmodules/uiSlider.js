//build：20240329
//slider kontrola
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let slider = {}

slider.build = function (id, parent) {
    let temp = utils.validateBuild(slider.all, id, parent, 'slider')
    let my = {type: 'slider'}
    my.obj = new utils.GG.NativeSlider({ uid: id }, temp)
    my.id = id

    /**
     * Dobijanje/postavljanje vrijednosti
     * @param {number} v Postavljanje vrijednosti
     * @param {boolean} en Da li omogućiti animaciju prilikom postavljanja vrijednosti, tj. efekat ublažavanja
     * @returns Dobijanje vrijednosti
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
     * Postavljanje opsega
     * @param {number} min Minimalna vrijednost
     * @param {number} max Maksimalna vrijednost
     */
    my.range = function (min, max) {
        this.obj.lvSliderSetRange(min, max)
    }

    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default slider;