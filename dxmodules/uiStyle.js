//build：20240315
// Control style Each control can bind style objects and set multiple styles.
import utils from "./uiUtils.js"

let style = {}
style.build = function () {
    let comp = {}
    comp.obj = new utils.GG.NativeStyle()
    comp.obj.lvStyleInit()
    /**
     * Set the left, right, top and bottom padding to a value
     * @param {number} pad margin value
     */
    comp.padAll = function (pad) {
        this.obj.lvStyleSetPadAll(pad)
    }
    /**
     * Set the right padding to a value
     * @param {number} pad margin value
     */
    comp.padRight = function (pad) {
        this.obj.lvStyleSetPadRight(pad)
    }
    /**
     * Set the left padding to a value
     * @param {number} pad margin value
     */
    comp.padLeft = function (pad) {
        this.obj.lvStyleSetPadLeft(pad)
    }
    /**
     * Set the top padding to a value
     * @param {number} pad margin value
     */
    comp.padTop = function (pad) {
        this.obj.lvStyleSetPadTop(pad)
    }
    /**
     * Set the bottom padding to a value
     * @param {number} pad margin value
     */
    comp.padBottom = function (pad) {
        this.obj.lvStyleSetPadBottom(pad)
    }
    /**
     * Set the margins between columns to a value
     * @param {number} pad margin value
     */
    comp.padColumn = function (pad) {
        this.obj.lvStyleSetPadColumn(pad)
    }
    /**
     * Set the margins between rows to a value
     * @param {number} pad margin value
     */
    comp.padRow = function (pad) {
        this.obj.lvStyleSetPadRow(pad)
    }
    /**
     * Set border width
     * @param {number} w 
     */
    comp.borderWidth = function (w) {
        this.obj.lvStyleSetBorderWidth(w)
    }
    /**
     * Set edge rounding
     * @param {number} r 
     */
    comp.radius = function (r) {
        this.obj.lvStyleSetRadius(r)
    }
    /**
     * Set the background transparency, the value range is 0-100, the smaller the value, the better
     * @param {number} opa must be 0-100
     */
    comp.bgOpa = function (opa) {
        this.obj.lvStyleSetBgOpa(utils.OPA_MAPPING(opa))
    }
    /**
     * Set its own transparency, the value range is 0-100, the smaller the value, the better
     * @param {number} opa must be 0-100
     */
    comp.opa = function (opa) {
        this.obj.lvStyleSetOpa(utils.OPA_MAPPING(opa))
    }
    /**
     * Set background color
     * @param {any} color supports numeric types: such as 0x34ffaa; string types (starting with #), such as: '#34ffaa'
     */
    comp.bgColor = function (color) {
        this.obj.lvStyleSetBgColor(utils.colorParse(color))
    }
    /**
     * Set text color
     * @param {any} color supports numeric types: such as 0x34ffaa; string types (starting with #), such as: '#34ffaa'
     */
    comp.textColor = function (color) {
        this.obj.lvStyleSetTextColor(utils.colorParse(color))
    }
    /**
     * Set text alignment method/way
     * @param {number} type refer to utils.TEXT_ALIGN
     */
    comp.textAlign = function (type) {
        this.obj.lvStyleSetTextAlign(type)
    }
    /**
     * Set text font
     * @param {object} font The object returned by build in font.js
     */
    comp.textFont = function (font) {
        if (!font || !font.obj) {
            throw new Error("style.textFont: 'font' parameter should not be null")
        }
        this.obj.lvStyleSetTextFont(font.obj)
    }
    /**
     * Set gradient color
     * @param {number} color gradient color, for example: 0xffffff
     */
    comp.bgGradColor = function (color) {
        this.obj.lvStyleSetBgGradColor(color)
    }
    /**
     * Set gradient color direction
     * @param {number} dir direction, currently only supports horizontal and vertical
     */
    comp.bgGradDir = function (dir) {
        this.obj.lvStyleSetBgGradDir(dir)
    }
    /**
     * The end position of the background color (0-255)
     * @param {number} value distance, calculated from the left end
     */
    comp.bgMainStop = function (value) {
        this.obj.lvStyleSetBgMainStop(value)
    }
    /**
     * Gradient color distance (0-255)
     * @param {number} value distance, calculated from the end position of the background color
     */
    comp.bgGradStop = function (value) {
        this.obj.lvStyleSetBgGradStop(value)
    }
    return comp;
}

export default style;