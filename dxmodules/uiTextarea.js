//build：20240330
// textarea control
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let textarea = {}

textarea.build = function (id, parent) {
    let temp = utils.validateBuild(textarea.all, id, parent, 'textarea')
    let my = {type: 'textarea'}
    my.obj = new utils.GG.NativeTextarea({ uid: id }, temp)
    my.id = id
    /**
     * Set single line mode, no line breaks
     * @param {boolean} en true/false
     */
    my.setOneLine = function (en) {
        this.obj.lvTextareaSetOneLine(en)
    }
    /**
     * Set the password mode, and the content is displayed as ·
     * @param {boolean} en true/false
     */
    my.setPasswordMode = function (en) {
        this.obj.lvTextareaSetPasswordMode(en)
    }
    /**
     * Set the content alignment method/way, center to left, right, etc.
     * @param {number} align align method/way enumeration
     */
    my.setAlign = function (align) {
        this.obj.lvTextareaSetAlign(align)
    }
    /**
     * Set the maximum content length and character limit
     * @param {number} length length
     */
    my.setMaxLength = function (length) {
        this.obj.lvTextareaSetMaxLength(length)
    }
    /**
     * Set whether to enable cursor positioning and whether to display |
     * @param {boolean} en true/false
     */
    my.setCursorClickPos = function (en) {
        this.obj.lvTextareaSetCursorClickPos(en)
    }
    /**
     * Insert text at the current cursor position
     * @param {string} txt text content
     */
    my.lvTextareaAddText = function (txt) {
        this.obj.lvTextareaAddText(txt)
    }
    /**
     * Delete the character to the left of the current cursor position
     */
    my.lvTextareaDelChar = function () {
        this.obj.lvTextareaDelChar()
    }
    /**
     * get/obtain/set text content
     * @param {string} text Set text content
     * @returns get/obtain text content
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