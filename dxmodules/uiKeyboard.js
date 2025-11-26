//build：20240329
// keyboard control
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let keyboard = {}

keyboard.build = function (id, parent) {
    let temp = utils.validateBuild(keyboard.all, id, parent, 'keyboard')
    let my = {type: 'keyboard'}
    my.obj = new utils.GG.NativeKeyboard({ uid: id }, temp)

    // The Pinyin input method will obtain a new object and bind it to the current keyboard to enhance keyboard functions, such as 9-key, etc. Users do not need to care when using it, as long as they operate the originally created keyboard object.
    let pinyin = {}
    pinyin.obj = my.obj.lvImePinyinCreate()
    my.obj.lvImePinyinSetKeyboard(pinyin.obj)
    my["__obj"] = Object.assign(pinyin, base)
    my.__mode = "K26"

    my.id = id
    /**
     * Set the associated text box, and the content output by the keyboard will be displayed here.
     * @param {object} textarea text box control object
     */
    my.setTextarea = function (textarea) {
        this.obj.lvKeyboardSetTextarea(textarea.obj)
        my.textarea = textarea
    }
    /**
     * Set /get/obtain mode, pure numeric keyboard or other modes
     * @param {any} mode mode, refer to enumeration
     * @returns returns the current mode
     */
    my.mode = function (mode) {
        if (!mode) {
            return my.__mode
        }
        if (mode == "K26" || mode == "K9") {
            this.obj.lvImePinyinSetMode(my["__obj"].obj, mode == "K26" ? 0 : 1)
        } else {
            if (mode == utils.KEYBOARD.NUMBER) {
                this.obj.lvImePinyinSetMode(my["__obj"].obj, 2)
            }
            this.obj.lvKeyboardSetMode(mode)
        }
        my.__mode = mode
    }
    /**
     * Set the pinyin font. Different from the keyboard, the font of the candidate characters is set here.
     * @param {object} font The object returned by build in font.js
     * @param {number} type refers to utils.STYLE. It is not required. The default is bound to the object itself.
     */
    my.chFont = function (font, type) {
        if (!utils.validateNumber(type)) {
            type = 0
        }
        if (!font || !font.obj) {
            throw new Error("dxui.textFont: 'font' parameter should not be null")
        }
        my.obj.lvImePinyinGetCandPanel(my["__obj"].obj).lvObjSetStyleTextFont(font.obj, type)
    }
    /**
     * Display the button title in the pop-up window when pressed, which is the upper frame of the auxiliary display.
     * @param {boolean} en true/false
     */
    my.setPopovers = function (en) {
        this.obj.lvKeyboardSetPopovers(en)
    }
    /**
     * Set up thesaurus
     * @param {object} dict dictionary, format such as: {"a": "ah", "ai": "love",..., "zu": "group"}, all 26 letters must be present, if there is no candidate word, just write ""
     * @returns 
     */
    my.dict = function (dict) {
        if (!dict) {
            return my.obj.lvImePinyinGetDict(my["__obj"].obj)
        } else {
            my.obj.lvImePinyinSetDict(my["__obj"].obj, dict)
        }
    }
    let comp = Object.assign(my, base);
    // overridden method
    // Keep the original method
    const super_hide = my.hide;
    const super_show = my.show;
    my.hide = function () {
        super_hide.call(this)
        my.obj.lvImePinyinGetCandPanel(my["__obj"].obj).lvObjAddFlag(1);
        if (my.textarea.text() && my.textarea.text().length > 0) {
            my.obj.lvImePinyinClearData(my["__obj"].obj)
        }
    }
    my.show = function () {
        super_show.call(this)
        if (my.obj.lvImePinyinGetCandNum(my["__obj"].obj) > 0) {
            my.obj.lvImePinyinGetCandPanel(my["__obj"].obj).lvObjClearFlag(1);
        }
        my.obj.lvImePinyinGetCandPanel(my["__obj"].obj).lvObjAlignTo(my.obj, utils.ALIGN.OUT_TOP_MID, 0, 0)
    }
    utils.setParent(this.all, comp, parent)
    return comp;
}
export default keyboard;