//build：20240311
// Font object (to support Chinese, you need to use a font ttf file that supports Chinese)
import utils from "./uiUtils.js"
let font = {}
/**
 * Build fonts
 * @param {string} ttf The full path of the font ttf file
 * @param {number} size font size
 * @param {number} style font style, refer to utils.FONT_STYLE
 * @returns 
 */
font.build = function (ttf, size, style) {
    let comp = {}
    comp.obj = utils.GG.NativeFont.lvFontInit(ttf, size, style)
    return comp;
}

export default font;