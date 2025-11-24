//build：20240311
//Objekat fonta (za podršku kineskog jezika, potrebno je koristiti ttf datoteku fonta koja podržava kineski)
import utils from "./uiUtils.js"
let font = {}
/**
 * Izgradnja fonta
 * @param {string} ttf Puna putanja do ttf datoteke fonta
 * @param {number} size Veličina fonta
 * @param {number} style Stil fonta, pogledajte utils.FONT_STYLE
 * @returns 
 */
font.build = function (ttf, size, style) {
    let comp = {}
    comp.obj = utils.GG.NativeFont.lvFontInit(ttf, size, style)
    return comp;
}

export default font;