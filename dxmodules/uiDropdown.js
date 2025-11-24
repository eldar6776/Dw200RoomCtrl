//build：20240329
//dropdown kontrola
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let dropdown = {}

dropdown.build = function (id, parent) {
    let temp = utils.validateBuild(dropdown.all, id, parent, 'dropdown')
    let my = {type: 'dropdown'}
    my.obj = new utils.GG.NativeDropdown({ uid: id }, temp)
    my.id = id
    /**
     * Postavljanje sadržaja padajućih opcija
     * @param {array} arr Sadržaj opcija, niz stringova, svaka stavka je jedna opcija
     */
    my.setOptions = function (arr) {
        this.obj.setOptions(arr.join('\n'))
    }
    /**
     * Dobijanje liste padajućih opcija
     * @returns Vraća objekat liste, koji je objekat osnovne klase, i može mu se zasebno postaviti font
     */
    my.getList = function () {
        let res = {}
        res.obj = this.obj.getList()
        return Object.assign(res, base)
    }
    /**
     * Postavljanje odabrane stavke, ovo će biti zadano odabrano
     * @param {number} index Indeks odabrane stavke
     */
    my.setSelected = function (index) {
        this.obj.setSelected(index)
    }
    /**
     * Dobijanje indeksa odabrane stavke
     * @returns Vraća trenutno odabrani indeks
     */
    my.getSelected = function () {
        return this.obj.getSelected()
    }
    /**
     * Postavljanje ikone za padajući meni, zadano je strelica prema dolje
     * @param {string} icon Adresa ikone
     */
    my.setSymbol = function (icon) {
        this.obj.setSymbol(icon)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default dropdown;