//build：20240315
//Zajedničke funkcije, konstante, enumeracije itd.
import { uiClass } from '../dxmodules/libvbar-m-dxui.so'
import logger from './dxLogger.js'
const ui = new uiClass();
// Inicijalizacija UI komponente
ui.init()

let utils = {}
utils.GG = NativeObject.APP.NativeComponents
utils.ENUM = utils.GG.NativeEnum
utils.LAYER = {
    "MAIN": 0,
    "SYS": 1,
    "TOP": 2
}
utils.EVENT = {
    "CLICK": 7,
    "LONG_PRESSED": 5,
    "SHORT_PRESSED": 4,
    "PRESSING": utils.ENUM.LV_EVENT_PRESSING,
    "FOCUSED": utils.ENUM.LV_EVENT_FOCUSED,
    "DEFOCUSED": utils.ENUM.LV_EVENT_DEFOCUSED,
    "VALUE_CHANGED": utils.ENUM.LV_EVENT_VALUE_CHANGED,
    "INSERT": utils.ENUM.LV_EVENT_INSERT,
    "REFRESH": utils.ENUM.LV_EVENT_REFRESH,
    "READY": utils.ENUM.LV_EVENT_READY,
    "CANCEL": utils.ENUM.LV_EVENT_CANCEL,
}
utils.TEXT_ALIGN = {
    "AUTO": 0,
    "LEFT": 1,
    "CENTER": 2,
    "RIGHT": 3
}
utils.STATE = {
    "DEFAULT": utils.ENUM.LV_STATE_DEFAULT,
    "CHECKED": utils.ENUM.LV_STATE_CHECKED,
    "FOCUSED": utils.ENUM.LV_STATE_FOCUSED,
    "FOCUS_KEY": utils.ENUM.LV_STATE_FOCUS_KEY,
    "EDITED": utils.ENUM.LV_STATE_EDITED,
    "HOVERED": utils.ENUM.LV_STATE_HOVERED,
    "PRESSED": utils.ENUM.LV_STATE_PRESSED,
    "SCROLLED": utils.ENUM.LV_STATE_SCROLLED,
    "DISABLED": utils.ENUM.LV_STATE_DISABLED,
}
utils.OBJ_FLAG = {
    "CLICKABLE": utils.ENUM.LV_OBJ_FLAG_CLICKABLE,
}
utils.ALIGN = {//Položaj u odnosu na referentni objekat, sa OUT izvan granica referentnog objekta
    "OUT_TOP_LEFT": utils.ENUM.LV_ALIGN_OUT_TOP_LEFT,
    "OUT_TOP_MID": utils.ENUM.LV_ALIGN_OUT_TOP_MID,
    "OUT_TOP_RIGHT": utils.ENUM.LV_ALIGN_OUT_TOP_RIGHT,
    "OUT_BOTTOM_LEFT": utils.ENUM.LV_ALIGN_OUT_BOTTOM_LEFT,
    "OUT_BOTTOM_MID": utils.ENUM.LV_ALIGN_OUT_BOTTOM_MID,
    "OUT_BOTTOM_RIGHT": utils.ENUM.LV_ALIGN_OUT_BOTTOM_RIGHT,
    "OUT_LEFT_TOP": utils.ENUM.LV_ALIGN_OUT_LEFT_TOP,
    "OUT_LEFT_MID": utils.ENUM.LV_ALIGN_OUT_LEFT_MID,
    "OUT_LEFT_BOTTOM": utils.ENUM.LV_ALIGN_OUT_LEFT_BOTTOM,
    "OUT_RIGHT_TOP": utils.ENUM.LV_ALIGN_OUT_RIGHT_TOP,
    "OUT_RIGHT_MID": utils.ENUM.LV_ALIGN_OUT_RIGHT_MID,
    "OUT_RIGHT_BOTTOM": utils.ENUM.LV_ALIGN_OUT_RIGHT_BOTTOM,
    "TOP_LEFT": utils.ENUM.LV_ALIGN_TOP_LEFT,
    "TOP_MID": utils.ENUM.LV_ALIGN_TOP_MID,
    "TOP_RIGHT": utils.ENUM.LV_ALIGN_TOP_RIGHT,
    "BOTTOM_LEFT": utils.ENUM.LV_ALIGN_BOTTOM_LEFT,
    "BOTTOM_MID": utils.ENUM.LV_ALIGN_BOTTOM_MID,
    "BOTTOM_RIGHT": utils.ENUM.LV_ALIGN_BOTTOM_RIGHT,
    "LEFT_MID": utils.ENUM.LV_ALIGN_LEFT_MID,
    "RIGHT_MID": utils.ENUM.LV_ALIGN_RIGHT_MID,
    "CENTER": utils.ENUM.LV_ALIGN_CENTER,
    "DEFAULT": utils.ENUM.LV_ALIGN_DEFAULT
}
utils.FLEX_ALIGN = {//flex raspored, poravnanje
    "START": utils.ENUM.LV_FLEX_ALIGN_START,
    "END": utils.ENUM.LV_FLEX_ALIGN_END,
    "CENTER": utils.ENUM.LV_FLEX_ALIGN_CENTER,
    "SPACE_EVENLY": utils.ENUM.LV_FLEX_ALIGN_SPACE_EVENLY,
    "SPACE_AROUND": utils.ENUM.LV_FLEX_ALIGN_SPACE_AROUND,
    "SPACE_BETWEEN": utils.ENUM.LV_FLEX_ALIGN_SPACE_BETWEEN,
}
utils.FLEX_FLOW = {//flex raspored, glavna i poprečna osa
    "ROW": utils.ENUM.LV_FLEX_FLOW_ROW,
    "COLUMN": utils.ENUM.LV_FLEX_FLOW_COLUMN,
    "ROW_WRAP": utils.ENUM.LV_FLEX_FLOW_ROW_WRAP,
    "ROW_REVERSE": utils.ENUM.LV_FLEX_FLOW_ROW_REVERSE,
    "ROW_WRAP_REVERSE": utils.ENUM.LV_FLEX_FLOW_ROW_WRAP_REVERSE,
    "COLUMN_WRAP": utils.ENUM.LV_FLEX_FLOW_COLUMN_WRAP,
    "COLUMN_REVERSE": utils.ENUM.LV_FLEX_FLOW_COLUMN_REVERSE,
    "COLUMN_WRAP_REVERSE": utils.ENUM.LV_FLEX_FLOW_COLUMN_WRAP_REVERSE,
}
utils.GRAD = {//smjer gradijenta boje
    "NONE": utils.ENUM.LV_GRAD_DIR_NONE,
    "VER": utils.ENUM.LV_GRAD_DIR_VER,
    "HOR": utils.ENUM.LV_GRAD_DIR_HOR,
}
utils.KEYBOARD = {//mod tastature
    "TEXT_LOWER": utils.ENUM.LV_KEYBOARD_MODE_TEXT_LOWER,
    "TEXT_UPPER": utils.ENUM.LV_KEYBOARD_MODE_TEXT_UPPER,
    "SPECIAL": utils.ENUM.LV_KEYBOARD_MODE_SPECIAL,
    "NUMBER": utils.ENUM.LV_KEYBOARD_MODE_NUMBER,
    "K26": "K26",
    "K9": "K9",
}
utils.FONT_STYLE = {
    "NORMAL": utils.ENUM.FT_FONT_STYLE_NORMAL,
    "ITALIC": utils.ENUM.FT_FONT_STYLE_ITALIC,
    "BOLD": utils.ENUM.FT_FONT_STYLE_BOLD,
}
utils.BUTTONS_STATE = {
    "HIDDEN": utils.ENUM.LV_BTNMATRIX_CTRL_HIDDEN,//Da li je dugme u matrici dugmadi skriveno
    "NO_REPEAT": utils.ENUM.LV_BTNMATRIX_CTRL_NO_REPEAT,//Da li se dugme u matrici dugmadi može ponovo pritisnuti, neće ponovo pokrenuti događaj pritiska na taster
    "DISABLED": utils.ENUM.LV_BTNMATRIX_CTRL_DISABLED,//Da li je dugme u matrici dugmadi onemogućeno
    "CHECKABLE": utils.ENUM.LV_BTNMATRIX_CTRL_CHECKABLE,//Da li se dugme u matrici dugmadi može odabrati
    "CHECKED": utils.ENUM.LV_BTNMATRIX_CTRL_CHECKED,//Da li je dugme u matrici dugmadi već odabrano, prikazuje se kao odabrano na interfejsu
    "CLICK_TRIG": utils.ENUM.LV_BTNMATRIX_CTRL_CLICK_TRIG,//Da li se dugme u matrici dugmadi može pokrenuti klikom
    "POPOVER": utils.ENUM.LV_BTNMATRIX_CTRL_POPOVER,//Da li se dugme u matrici pojavljuje, nakon klika prikazuje više opcija ili sadržaja
    "RECOLOR": utils.ENUM.LV_BTNMATRIX_CTRL_RECOLOR//Da li se dugme u matrici može ponovo obojiti
}
//Dio gdje stil djeluje
utils.STYLE_PART = {
    "MAIN": 0, //Trenutni stil objekta je aktivan
    "ITEMS": 327680//Unutrašnje pod-stavke objekta su aktivne, npr. grupa dugmadi u buttonMatrix
}
//Mod prikaza kada tekst premašuje kontrolu
utils.LABEL_LONG_MODE = {
    "WRAP": utils.ENUM.LV_LABEL_LONG_WRAP,//Prelom reda kada je tekst dugačak
    "DOT": utils.ENUM.LV_LABEL_LONG_DOT,//Zamjena sa ... kada je tekst dugačak
    "SCROLL": utils.ENUM.LV_LABEL_LONG_SCROLL,//Automatsko pomicanje kada je tekst dugačak
    "SCROLL_CIRCULAR": utils.ENUM.LV_LABEL_LONG_SCROLL_CIRCULAR,//Ciklično pomicanje kada je tekst dugačak
    "CLIP": utils.ENUM.LV_LABEL_LONG_CLIP,//Automatsko skraćivanje kada je tekst dugačak
}
// Implementira mapiranje od 0-100 na 0-255
utils.OPA_MAPPING = function (value) {
    return Math.round((value / 100) * 255);
}
/**
* Provjerava da li je broj prazan, da li je tipa 'number'
* @param {number} n Obavezno
* @param {err} Poruka o grešci, nije obavezno, ako se unese, baca se Error
*/
utils.validateNumber = function (n, err) {
    return _valid(n, 'number', err)
}
/**
* Provjerava da li je objekat prazan, da li je tipa 'object'
* @param {object} o Obavezno
* @param {err} Poruka o grešci, nije obavezno, ako se unese, baca se Error
*/
utils.validateObject = function (o, err) {
    return _valid(o, 'object', err)
}
/**
 * Provjerava parametre izgradnje UI objekta
 * @param {array} all Obavezno, sve reference na objekte
 * @param {string} id Ne smije biti prazno, obavezno
 * @param {object} parent Nije obavezno, zadano je 0
 */
utils.validateBuild = function (all, id, parent, type) {
    this.validateId(all, id)
    if (parent === 0 || parent === 1 || parent === 2) {
        return parent
    }
    if (!parent || !parent.obj) {
        throw new Error(type + ".build: 'parent' paramter should not be null")
    }
    return parent.obj
}
/**
 * Provjerava ID-ove svih UI kontrola, ne smiju se ponavljati
 * @param {array} all
 * @param {string} id 
 */
utils.validateId = function (all, id) {
    this.validateString(id, "The 'id' parameter should not be null.")
    if (all[id]) {
        throw new Error("The id(" + id + ") already exists. Please set a different id value.")
    }
}
/**
* Provjerava da li je string prazan
* @param {string} s Obavezno
* @param {err} Poruka o grešci, nije obavezno, ako se unese, baca se Error
*/
utils.validateString = function (s, err) {
    let res = _valid(s, 'string', err)
    if (!res) {
        return false
    }
    if (s.length <= 0) {
        if (err) {
            throw new Error(err)
        }
        return false
    }
    return true
}
/**
 * Parsiranje različitih tipova vrijednosti boja
 * @param {any} value Podržava numerički tip: 0x34ffaa, string tip: '0x34ffaa', string tip: '#34ffaa'
 * @returns 
 */
utils.colorParse = function (value) {
    if (typeof value == 'string') {
        value = value.replace('#', '0x')
        value = parseInt(value, 16)
    }
    return value
}
/**
 * Dobijanje koordinata tačke dodira
 * @returns {x: horizontalna koordinata, y: vertikalna koordinata}
 */
utils.getTouchPoint = function () {
    let point = NativeObject.APP.NativeComponents.NativeIndev.lvIndevGetPoint()
    return point
}
/**
 * 提供动画
 * @param {object} obj Objekat za animaciju, može biti bilo koji objekat, dobija se kao parametar povratnog poziva
 * @param {number} start Početna vrijednost intervala, obično se koristi sa 'end', dobija se kao parametar povratnog poziva, 'start' se mijenja u 'end' tokom animacije
 * @param {number} end Krajnja vrijednost intervala
 * @param {function} cb Povratna funkcija (obj, v)=>{}, 'obj' je objekat za animaciju, intervalna vrijednost (start-end)
 * @param {number} duration Trajanje animacije u milisekundama
 * @param {number} backDuration Opciono, vrijeme reprodukcije animacije unazad u milisekundama, zadano se ne reprodukuje unazad
 * @param {number} repeat Opciono, broj ponavljanja animacije, zadano 1 put
 * @param {string} mode Kriva brzine, opciono, zadano 'linear', ugrađene funkcije: linear, ease_in, ease_out, ease_in_out, overshoot, bounce, step
 *  linear - linearna animacija
    step - promjena u posljednjem koraku
    ease_in - sporo na početku
    ease_out - sporo na kraju
    ease_in_out - sporo na početku i na kraju
    overshoot - prelazi krajnju vrijednost
    bounce - malo se odbija od krajnje vrijednosti (npr. udarac u zid)
 * @returns Instanca animacije, mora se sačuvati globalno
 */
utils.anime = function (obj, start, end, cb, duration, backDuration, repeat, mode) {
    // 1. Inicijalizacija animacije
    let anim = NativeObject.APP.NativeComponents.NativeAnim.lvAnimInit()
    // 2. Postavljanje objekta animacije
    anim.lvAnimSetVar(obj)
    // 3. Postavljanje početne i krajnje vrijednosti
    anim.lvAnimSetValues(start, end)
    // 4. Postavljanje povratne funkcije animacije
    anim.lvAnimSetExecCb(cb)
    // 5. Postavljanje vremena animacije
    anim.lvAnimSetTime(duration)
    // Opciono, postavljanje vremena reprodukcije animacije unazad, ako se ne postavi, nema reprodukcije unazad
    if (backDuration) {
        anim.lvAnimSetPlaybackTime(backDuration)
    }
    // Opciono, postavljanje broja ponavljanja animacije
    if (repeat) {
        anim.lvAnimSetRepeatCount(repeat)
    }
    // Opciono, postavljanje krive brzine animacije
    if (mode) {
        anim.lvAnimSetPathCb(mode)
    }
    // 6. Pokretanje animacije
    anim.lvAnimStart()
    return anim
}
//Svakom objektu postaviti roditelja i djecu
utils.setParent = function (all, child, parent) {
    if (!all || parent == null || parent == undefined || !child) {
        return
    }
    if((typeof parent)=='number'){

    }
    const parentId = ((typeof parent)=='number')?'' + parent:parent.id//Pretvara 0, 1, 2 u string
    if (!all[parentId]) {
        all[parentId] = { id: parentId }//Korijenski čvorovi 0, 1, 2
    }
    if (!all[parentId].children) {
        all[parentId].children = []
    }
    all[parentId].children.push(child.id)
    child.parent = parentId
    all[child.id] = child
}
function _valid(n, type, err) {
    if (n === undefined || n === null || (typeof n) != type) {
        if (err) {
            throw new Error(err)
        }
        return false
    }
    return true
}
export default utils