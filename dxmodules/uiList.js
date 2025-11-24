//build：20240329
//list kontrola
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let list = {}

list.build = function (id, parent) {
    let temp = utils.validateBuild(list.all, id, parent, 'list')
    let my = {type: 'list'}
    my.obj = new utils.GG.NativeList({ uid: id }, temp)
    my.id = id
    /**
     * Dodavanje pojedinačne tekstualne stavke
     * @param {string} text Sadržaj teksta stavke
     * @returns Osnovni objekat same stavke
     */
    my.addText = function (text) {
        let res = {}
        res.obj = this.obj.lvListAddText(text)
        return Object.assign(res, base)
    }
    /**
     * Dodavanje pojedinačne stavke dugmeta
     * @param {string} src Putanja do ikone ispred stavke
     * @param {string} text Sadržaj teksta stavke
     * @returns Osnovni objekat same stavke
     */
    my.addBtn = function (src, text) {
        let res = {}
        res.obj = this.obj.lvListAddBtn(src, text)
        return Object.assign(res, base)
    }
    /**
     * Dobijanje tekstualnog sadržaja stavke dugmeta
     * @param {string} btn Stavka dugmeta
     * @returns Tekstualni sadržaj stavke dugmeta
     */
    my.getBtnText = function (btn) {
        return this.obj.lvListGetBtnText(btn.obj)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default list;