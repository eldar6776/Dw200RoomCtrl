//build：20240315
//Stil kontrole. Svaka kontrola može biti povezana sa objektom stila, omogućavajući postavljanje više stilova.
import utils from "./uiUtils.js"

let style = {}
style.build = function () {
    let comp = {}
    comp.obj = new utils.GG.NativeStyle()
    comp.obj.lvStyleInit()
    /**
     * Postavlja unutrašnju marginu (padding) sa svih strana na istu vrijednost
     * @param {number} pad Vrijednost margine
     */
    comp.padAll = function (pad) {
        this.obj.lvStyleSetPadAll(pad)
    }
    /**
     * Postavlja desnu unutrašnju marginu (padding) na istu vrijednost
     * @param {number} pad Vrijednost margine
     */
    comp.padRight = function (pad) {
        this.obj.lvStyleSetPadRight(pad)
    }
    /**
     * Postavlja lijevu unutrašnju marginu (padding) na istu vrijednost
     * @param {number} pad Vrijednost margine
     */
    comp.padLeft = function (pad) {
        this.obj.lvStyleSetPadLeft(pad)
    }
    /**
     * Postavlja gornju unutrašnju marginu (padding) na istu vrijednost
     * @param {number} pad Vrijednost margine
     */
    comp.padTop = function (pad) {
        this.obj.lvStyleSetPadTop(pad)
    }
    /**
     * Postavlja donju unutrašnju marginu (padding) na istu vrijednost
     * @param {number} pad Vrijednost margine
     */
    comp.padBottom = function (pad) {
        this.obj.lvStyleSetPadBottom(pad)
    }
    /**
     * Postavlja marginu između kolona na istu vrijednost
     * @param {number} pad Vrijednost margine
     */
    comp.padColumn = function (pad) {
        this.obj.lvStyleSetPadColumn(pad)
    }
    /**
     * Postavlja marginu između redova na istu vrijednost
     * @param {number} pad Vrijednost margine
     */
    comp.padRow = function (pad) {
        this.obj.lvStyleSetPadRow(pad)
    }
    /**
     * Postavljanje širine okvira
     * @param {number} w 
     */
    comp.borderWidth = function (w) {
        this.obj.lvStyleSetBorderWidth(w)
    }
    /**
     * Postavljanje zaobljenih uglova
     * @param {number} r 
     */
    comp.radius = function (r) {
        this.obj.lvStyleSetRadius(r)
    }
    /**
     * Postavljanje prozirnosti pozadine, vrijednost se kreće od 0-100, što je manja vrijednost, to bolje.
     * @param {number} opa Mora biti između 0 i 100
     */
    comp.bgOpa = function (opa) {
        this.obj.lvStyleSetBgOpa(utils.OPA_MAPPING(opa))
    }
    /**
     * Postavljanje vlastite prozirnosti, vrijednost se kreće od 0-100, što je manja vrijednost, to bolje.
     * @param {number} opa Mora biti između 0 i 100
     */
    comp.opa = function (opa) {
        this.obj.lvStyleSetOpa(utils.OPA_MAPPING(opa))
    }
    /**
     * Postavljanje boje pozadine
     * @param {any} color Podržava numerički tip: npr. 0x34ffaa; string tip (počinje sa #), npr. '#34ffaa'
     */
    comp.bgColor = function (color) {
        this.obj.lvStyleSetBgColor(utils.colorParse(color))
    }
    /**
     * Postavljanje boje teksta
     * @param {any} color  Podržava numerički tip: npr. 0x34ffaa; string tip (počinje sa #), npr. '#34ffaa'
     */
    comp.textColor = function (color) {
        this.obj.lvStyleSetTextColor(utils.colorParse(color))
    }
    /**
     * Postavljanje poravnanja teksta
     * @param {number} type  Pogledajte utils.TEXT_ALIGN
     */
    comp.textAlign = function (type) {
        this.obj.lvStyleSetTextAlign(type)
    }
    /**
     * Postavljanje fonta teksta
     * @param {object} font Objekat vraćen od strane 'build' funkcije iz font.js
     */
    comp.textFont = function (font) {
        if (!font || !font.obj) {
            throw new Error("style.textFont: 'font' parameter should not be null")
        }
        this.obj.lvStyleSetTextFont(font.obj)
    }
    /**
     * Postavljanje gradijentne boje
     * @param {number} color Gradijentna boja, na primjer: 0xffffff
     */
    comp.bgGradColor = function (color) {
        this.obj.lvStyleSetBgGradColor(color)
    }
    /**
     * Postavljanje smjera gradijentne boje
     * @param {number} dir Smjer, trenutno podržava samo horizontalni i vertikalni
     */
    comp.bgGradDir = function (dir) {
        this.obj.lvStyleSetBgGradDir(dir)
    }
    /**
     * Krajnja pozicija boje pozadine (0-255)
     * @param {number} value Udaljenost, izračunata od lijevog kraja
     */
    comp.bgMainStop = function (value) {
        this.obj.lvStyleSetBgMainStop(value)
    }
    /**
     * Udaljenost gradijentne boje (0-255)
     * @param {number} value Udaljenost, izračunata od krajnje pozicije boje pozadine
     */
    comp.bgGradStop = function (value) {
        this.obj.lvStyleSetBgGradStop(value)
    }
    return comp;
}

export default style;