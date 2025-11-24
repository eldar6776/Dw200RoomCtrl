//build：20240311
//label kontrola
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let label = {}

label.build = function (id, parent) {
    let temp = utils.validateBuild(label.all, id, parent, 'label')
    let my = {type: 'label'}
    my.obj = new utils.GG.NativeLabel({ uid: id }, temp)
    my.id = id
    /**
     * Postavlja tekst labele ili dobija sadržaj teksta
     * @param {string} t Nije obavezno. Ako nije popunjeno ili nije tipa string, dobija se tekst.
     */
    my.text = function (t) {
        if (utils.validateString(t)) {
            this.obj.lvLabelSetText(t)
        } else {
            return this.obj.lvLabelGetText()
        }
    }
    /**
     * Postavlja mod prikaza kada je tekst predugačak, npr. pomicanje, skraćivanje, itd.
     * @param {number} mode Enumeracija, pogledajte utils.LABEL_LONG_MODE
     */
    my.longMode = function (mode) {
        this.obj.lvLabelSetLongMode(mode)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default label;