//build：20240329
//keyboard kontrola
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let keyboard = {}

keyboard.build = function (id, parent) {
    let temp = utils.validateBuild(keyboard.all, id, parent, 'keyboard')
    let my = {type: 'keyboard'}
    my.obj = new utils.GG.NativeKeyboard({ uid: id }, temp)

    // Pinyin metoda unosa će dobiti novi objekat, vezan za trenutnu tastaturu, kako bi se poboljšale funkcije tastature, kao što je 9-tasterski unos, itd. Korisnik ne mora da brine o tome, samo treba da manipuliše originalno kreiranim objektom tastature.
    let pinyin = {}
    pinyin.obj = my.obj.lvImePinyinCreate()
    my.obj.lvImePinyinSetKeyboard(pinyin.obj)
    my["__obj"] = Object.assign(pinyin, base)
    my.__mode = "K26"

    my.id = id
    /**
     * Postavljanje povezanog tekstualnog polja, sadržaj unesen preko tastature će se prikazati ovdje
     * @param {object} textarea Objekat kontrole tekstualnog polja
     */
    my.setTextarea = function (textarea) {
        this.obj.lvKeyboardSetTextarea(textarea.obj)
        my.textarea = textarea
    }
    /**
     * Postavljanje/dobijanje moda, čisto numerička tastatura ili drugi modovi
     * @param {any} mode Mod, pogledajte enumeraciju
     * @returns Vraća trenutni mod
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
     * Postavljanje Pinyin fonta. Za razliku od tastature, ovdje se postavlja font za kandidate riječi.
     * @param {object} font Objekat vraćen od strane 'build' funkcije iz font.js
     * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
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
     * Prikazuje naslov dugmeta u iskačućem prozoru pri pritisku, tj. gornji okvir za pomoćni prikaz.
     * @param {boolean} en true/false
     */
    my.setPopovers = function (en) {
        this.obj.lvKeyboardSetPopovers(en)
    }
    /**
     * Postavljanje rječnika
     * @param {object} dict Rječnik, format kao: {"a": "啊", "ai": "爱",...,"zu":"组"}, mora sadržavati svih 26 slova. Ako nema kandidata, napišite "".
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
    // Prepisivanje metode
    // Zadržavanje originalne metode
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