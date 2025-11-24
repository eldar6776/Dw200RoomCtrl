//build：20240330
//textarea kontrola
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let textarea = {}

textarea.build = function (id, parent) {
    let temp = utils.validateBuild(textarea.all, id, parent, 'textarea')
    let my = {type: 'textarea'}
    my.obj = new utils.GG.NativeTextarea({ uid: id }, temp)
    my.id = id
    /**
     * Postavljanje jednolinijskog moda, bez preloma reda
     * @param {boolean} en true/false
     */
    my.setOneLine = function (en) {
        this.obj.lvTextareaSetOneLine(en)
    }
    /**
     * Postavljanje moda za lozinku, sadržaj se prikazuje kao tačke
     * @param {boolean} en true/false
     */
    my.setPasswordMode = function (en) {
        this.obj.lvTextareaSetPasswordMode(en)
    }
    /**
     * Postavljanje poravnanja sadržaja, centrirano, lijevo, desno itd.
     * @param {number} align Enumeracija poravnanja
     */
    my.setAlign = function (align) {
        this.obj.lvTextareaSetAlign(align)
    }
    /**
     * Postavljanje maksimalne dužine sadržaja, ograničenje broja znakova
     * @param {number} length Dužina
     */
    my.setMaxLength = function (length) {
        this.obj.lvTextareaSetMaxLength(length)
    }
    /**
     * Postavljanje da li je omogućeno pozicioniranje kursora, da li se prikazuje |
     * @param {boolean} en true/false
     */
    my.setCursorClickPos = function (en) {
        this.obj.lvTextareaSetCursorClickPos(en)
    }
    /**
     * Umetanje teksta na trenutnu poziciju kursora
     * @param {string} txt Sadržaj teksta
     */
    my.lvTextareaAddText = function (txt) {
        this.obj.lvTextareaAddText(txt)
    }
    /**
     * Brisanje znaka lijevo od trenutne pozicije kursora
     */
    my.lvTextareaDelChar = function () {
        this.obj.lvTextareaDelChar()
    }
    /**
     * Dobijanje/postavljanje sadržaja teksta
     * @param {string} text Postavljanje sadržaja teksta
     * @returns Dobijanje sadržaja teksta
     */
    my.text = function (text) {
        if (text == null || text == undefined) {
            return this.obj.lvTextareaGetText()
        } else {
            this.obj.lvTextareaSetText(text)
        }
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default textarea;