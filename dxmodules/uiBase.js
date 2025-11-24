//build:20240524
/**
 * Osnovna klasa za UI, druge kontrole će je naslijediti. Podklasama nije dozvoljeno mijenjati ponašanje odgovarajućih funkcija. Ovaj js fajl ne treba direktno referencirati i koristiti.
 */
import utils from "./uiUtils.js"
import logger from './dxLogger.js'
import * as os from "os"
const uibase = {}
/**
* Mijenja ili dobija širinu kontrole
* @param {number} w Nije obavezno, ako se ne unese, dobija se širina, inače se mijenja širina
*/
uibase.width = function (w) {
     if (!utils.validateNumber(w)) {
          return this.obj.getWidth()
     }
     this.obj.lvObjSetWidth(w)
}
/**
* Mijenja ili dobija visinu kontrole
* @param {number} h Nije obavezno, ako se ne unese, dobija se visina, inače se mijenja visina
*/
uibase.height = function (h) {
     if (!utils.validateNumber(h)) {
          return this.obj.getHeight()
     }
     this.obj.lvObjSetHeight(h)
}
/**
 * Dobijanje širine bez okvira i unutrašnjih margina
 * @returns 
 */
uibase.contentWidth = function () {
     return this.obj.lvObjGetContentWidth()
}
/**
 * Dobijanje visine bez okvira i unutrašnjih margina
 * @returns 
 */
uibase.contentHeight = function () {
     return this.obj.lvObjGetContentHeight()
}
/**
 * Dobijanje udaljenosti pomicanja prema gore
 * @returns 
 */
uibase.scrollTop = function () {
     return this.obj.getScrollTop()
}
/**
 * Dobijanje udaljenosti pomicanja prema dolje
 * @returns 
 */
uibase.scrollBottom = function () {
     return this.obj.getScrollBottom()
}
/**
 * Dobijanje udaljenosti pomicanja ulijevo
 * @returns 
 */
uibase.scrollLeft = function () {
     return this.obj.getScrollLeft()
}
/**
 * Dobijanje udaljenosti pomicanja udesno
 * @returns 
 */
uibase.scrollRight = function () {
     return this.obj.getScrollRight()
}
/**
* Mijenja širinu i visinu kontrole
* @param {number} w Obavezno
* @param {number} h Obavezno
*/
uibase.setSize = function (w, h) {
     let err = 'dxui.setSize: width or height should not be empty'
     utils.validateNumber(w, err)
     utils.validateNumber(h, err)
     this.obj.lvObjSetSize(w, h)
}
/**
* Mijenja ili dobija x-koordinatu kontrole u odnosu na roditeljski objekat
* @param {number} x Nije obavezno, ako se ne unese, dobija se x-koordinata, inače se mijenja x-koordinata
*/
uibase.x = function (x) {
     if (!utils.validateNumber(x)) {
          return this.obj.getX()
     }
     this.obj.lvObjSetX(x)
}
/**
* Mijenja ili dobija y-koordinatu kontrole u odnosu na roditeljski objekat
* @param {number} y Nije obavezno, ako se ne unese, dobija se y-koordinata, inače se mijenja y-koordinata
*/
uibase.y = function (y) {
     if (!utils.validateNumber(y)) {
          return this.obj.getY()
     }
     this.obj.lvObjSetY(y)
}
/**
* Mijenja x i y koordinate kontrole u odnosu na roditeljski objekat
* @param {number} x Obavezno
* @param {number} y Obavezno
*/
uibase.setPos = function (x, y) {
     let err = 'dxui.setPos: x or y should not be empty'
     utils.validateNumber(x, err)
     utils.validateNumber(y, err)
     this.obj.lvObjSetPos(x, y)
}
/**
 * Pomjera kontrolu na najviši sloj, što je ekvivalentno posljednjem kreiranom pod-kontrolu roditeljskog objekta, i prekrit će sve ostale pod-kontrole.
 */
uibase.moveForeground = function () {
     this.obj.moveForeground()
}
/**
 * Pomjera kontrolu na najniži sloj, što je ekvivalentno prvom kreiranom pod-kontrolu roditeljskog objekta, i bit će prekriven svim ostalim pod-kontrolama.
 */
uibase.moveBackground = function () {
     this.obj.moveBackground()
}
/**
 * Pretplata na događaj, podržani tipovi događaja se nalaze u utils.EVENT
 * @param {number} type Enumeracija utils.EVENT, npr. klik, dugi pritisak itd.
 * @param {function} cb Callback funkcija koja se poziva pri okidanju događaja (ne može biti anonimna funkcija)
 * @param {object} ud Korisnički podaci
 */
uibase.on = function (type, cb, ud) {
     this.obj.addEventCb(() => {
          if (cb) {
               cb({ target: this, ud: ud })
          }
     }, type)
}
/**
 * Slanje događaja, npr. simulacija klika na dugme, može se poslati CLICK događaj dugmetu
 * @param {number} type Enumeracija utils.EVENT, npr. klik, dugi pritisak itd.
 */
uibase.send = function (type) {
     NativeObject.APP.NativeComponents.NativeEvent.lvEventSend(this.obj, type)
}
/**
 * Sakrivanje UI objekta
 */
uibase.hide = function () {
     if (!this.obj.hasFlag(1)) {
          this.obj.lvObjAddFlag(1);
     }
}
/**
 * Provjera da li je sakriveno
 * @returns 
 */
uibase.isHide = function () {
     return this.obj.hasFlag(1);
}
/**
 * Prikazivanje već sakrivenog UI objekta
 */
uibase.show = function () {
     if (this.obj.hasFlag(1)) {
          this.obj.lvObjClearFlag(1);
     }
}
/**
 * Onemogućavanje/omogućavanje objekta
 * @param {*} en false/true, true je onemogućeno, false je omogućeno
 */
uibase.disable = function (en) {
     if (en) {
          this.obj.addState(utils.STATE.DISABLED)
     } else {
          this.obj.clearState(utils.STATE.DISABLED)
     }
}
/**
 * Da li je objekat klikabilan
 * @param {*} en false/true, true je klikabilno, false nije klikabilno
 */
uibase.clickable = function (en) {
     if (en) {
          this.obj.lvObjAddFlag(utils.OBJ_FLAG.CLICKABLE)
     } else {
          this.obj.lvObjClearFlag(utils.OBJ_FLAG.CLICKABLE)
     }
}
/**
 * Provjera da li je onemogućeno/omogućeno
 * @returns true je onemogućeno, false je omogućeno
 */
uibase.isDisable = function () {
     return this.obj.hasState(utils.STATE.DISABLED)
}
/**
 * Fokusiranje objekta
 * @param {*} en false/true, true je fokusirano, false je defokusirano
 */
uibase.focus = function (en) {
     if (en) {
          this.obj.addState(utils.STATE.FOCUSED)
     } else {
          this.obj.clearState(utils.STATE.FOCUSED)
     }
}
/**
 * Provjera da li je fokusirano
 * @returns true je fokusirano, false nije fokusirano
 */
uibase.isFocus = function () {
     return this.obj.hasState(utils.STATE.FOCUSED)
}

/**
 * Postavljanje stila UI-ja. Stil se može postaviti pojedinačno za svaki element, ili se može prvo definisati objekat stila, a zatim ga povezati sa UI objektom.
 * Povezivanje UI objekta sa objektom stila može se izvršiti za različite dijelove ili različita stanja.
 * @param {object} style Objekat vraćen od strane 'build' funkcije iz style.js
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.addStyle = function (style, type) {
     if (!style || !style.obj) {
          throw new Error('dxui.addStyle: style should not be null')
     }
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjAddStyle(style.obj, type);
}
/**
* Postavlja unutrašnju marginu (padding) sa svih strana na istu vrijednost
* @param {number} pad Vrijednost margine
* @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
*/
uibase.padAll = function (pad, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStylePadAll(pad, type)
}
/**
 * Postavlja/dobija desnu unutrašnju marginu (padding) na istu vrijednost
 * @param {number} pad Vrijednost margine
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.padRight = function (pad, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     if (!utils.validateNumber(pad)) {
          return this.obj.getStylePadRight(type)
     }
     this.obj.setStylePadRight(pad, type)
}
/**
  * Postavlja/dobija lijevu unutrašnju marginu (padding) na istu vrijednost
  * @param {number} pad Vrijednost margine
  * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
  */
uibase.padLeft = function (pad, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     if (!utils.validateNumber(pad)) {
          return this.obj.getStylePadLeft(type)
     }
     this.obj.setStylePadLeft(pad, type)
}
/**
  * Postavlja/dobija gornju unutrašnju marginu (padding) na istu vrijednost
  * @param {number} pad Vrijednost margine
  * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
  */
uibase.padTop = function (pad, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     if (!utils.validateNumber(pad)) {
          return this.obj.getStylePadTop(type)
     }
     this.obj.setStylePadTop(pad, type)
}
/**
  * Postavlja/dobija donju unutrašnju marginu (padding) na istu vrijednost
  * @param {number} pad Vrijednost margine
  * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
  */
uibase.padBottom = function (pad, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     if (!utils.validateNumber(pad)) {
          return this.obj.getStylePadBottom(type)
     }
     this.obj.setStylePadBottom(pad, type)
}
/**
 * Postavljanje/dobijanje širine okvira
 * @param {number} w 
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.borderWidth = function (w, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     if (!utils.validateNumber(w)) {
          return this.obj.lvObjGetStyleBorderWidth(type)
     }
     this.obj.lvObjSetStyleBorderWidth(w, type)
}
/**
 * Postavljanje boje okvira
 * @param {number} color Podržava numerički tip: npr. 0x34ffaa; string tip (počinje sa #), npr. '#34ffaa'
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.setBorderColor = function (color, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.setStyleBorderColor(utils.colorParse(color), type)
}
/**
 * Postavljanje zaobljenih uglova
 * @param {number} r 
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.radius = function (r, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleRadius(r, type)
}
/**
 * Postavljanje prozirnosti pozadine, vrijednost se kreće od 0-100, što je manja vrijednost, to bolje.
 * @param {number} opa Mora biti između 0 i 100
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.bgOpa = function (opa, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleBgOpa(utils.OPA_MAPPING(opa), type)
}
/**
 * Postavljanje boje pozadine
 * @param {any} color Podržava numerički tip: npr. 0x34ffaa; string tip (počinje sa #), npr. '#34ffaa'
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.bgColor = function (color, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleBgColor(utils.colorParse(color), type)
}
/**
 * Postavljanje sjene
 * @param {number} width Širina sjene
 * @param {number} x Horizontalni pomak
 * @param {number} y Vertikalni pomak
 * @param {number} spread Udaljenost širenja
 * @param {number} color Boja
 * @param {number} opa Prozirnost, mora biti između 0 i 100
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.shadow = function (width, x, y, spread, color, opa, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleShadowWidth(width, type)
     this.obj.lvObjSetStyleShadowOfsX(x, type)
     this.obj.lvObjSetStyleShadowOfsY(y, type)
     this.obj.lvObjSetStyleShadowSpread(spread, type)
     this.obj.setStyleShadowColor(color, type)
     this.obj.setStyleShadowOpa(utils.OPA_MAPPING(opa), type)
}
/**
 * Postavljanje boje teksta
 * @param {any} color Podržava numerički tip: npr. 0x34ffaa; string tip (počinje sa #), npr. '#34ffaa'
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.textColor = function (color, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleTextColor(utils.colorParse(color), type)
}
/**
 * Postavljanje poravnanja teksta
 * @param {number} align Pogledajte utils.TEXT_ALIGN
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.textAlign = function (align, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleTextAlign(align, type)
}
/**
 * Postavljanje fonta teksta
 * @param {object} font Objekat vraćen od strane 'build' funkcije iz font.js
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.textFont = function (font, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     if (!font || !font.obj) {
          throw new Error("dxui.textFont: 'font' parameter should not be null")
     }
     this.obj.lvObjSetStyleTextFont(font.obj, type)
}
/**
 * Postavljanje boje objekta linije (line)
 * @param {any} color Podržava numerički tip: npr. 0x34ffaa; string tip (počinje sa #), npr. '#34ffaa'
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.lineColor = function (color, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleLineColor(utils.colorParse(color), type)
}
/**
 * Postavljanje širine objekta linije (line)
 * @param {number} w 
 * @param {number} type Pogledajte utils.STYLE. Nije obavezno, zadano se povezuje sa samim objektom.
 */
uibase.lineWidth = function (w, type) {
     if (!utils.validateNumber(type)) {
          type = 0
     }
     this.obj.lvObjSetStyleLineWidth(w, type)
}
/**
 * Postavljanje zaobljenih uglova objekta linije (line)
 * @param {boolean} enable true/false
 */
uibase.lineRound = function (enable) {
     this.obj.lvObjSetStyleLineRounded(enable)
}
/**
 * Postavljanje načina prikaza trake za pomicanje (scrollbar) UI objekta
 * @param {boolean} state ture/false 
 */
uibase.scrollbarMode = function (state) {
     this.obj.lvObjSetScrollbarMode(state)
}
/**
 * Postavljanje da li UI objekat podržava pomicanje (scroll)
 * @param {boolean} state 
 */
uibase.scroll = function (state) {
     if (state) {
          this.obj.lvObjAddFlag(16)
     } else {
          this.obj.lvObjClearFlag(16)
     }
}
/**
 * Poravnava objekat sa drugim referentnim objektom
 * @param {object} ref Referentni objekat
 * @param {number} type Smjer poravnanja, pogledajte dxui.Utils.ALIGN enumeraciju
 * @param {number} x Pomak po x osi
 * @param {number} y Pomak po y osi
 */
uibase.alignTo = function (ref, type, x, y) {
     if (!ref || !ref.obj) {
          throw new Error("dxui.alignto: 'ref' parameter should not be null")
     }
     this.obj.lvObjAlignTo(ref.obj, type, x, y)
}
/**
 * Poravnava objekat sa roditeljskim objektom
 * @param {number} type Smjer poravnanja, pogledajte dxui.Utils.ALIGN enumeraciju
 * @param {number} x Pomak po x osi
 * @param {number} y Pomak po y osi
 */
uibase.align = function (type, x, y) {
     this.obj.lvObjAlign(type, x, y)
}
/**
 * Flexbox raspored, omogućava fleksibilnije pozicioniranje, raspoređivanje i distribuciju elemenata, olakšavajući kreiranje responzivnih i skalabilnih rasporeda.
 * Zasnovan je na kontejneru i nekim fleksibilnim stavkama unutar njega. Slijede neki koncepti korištenja ovog rasporeda:
 * 1. Kontejner: Kontejner sadrži unutrašnje fleksibilne stavke i može ih rasporediti po pravilima kao što su s lijeva na desno ili s desna na lijevo.
 * 2. Glavna i poprečna osa: Glavna osa je primarni način raspoređivanja stavki u kontejneru, obično horizontalno ili vertikalno, omogućavajući horizontalno ili vertikalno raspoređivanje stavki.
 *    Poprečna osa, osa okomita na glavnu osu, može definisati način raspoređivanja stavki na poprečnoj osi.
 *    Glavna i poprečna osa se postavljaju pomoću flexFlow(), sa glavnim opcijama ROW (horizontalno) i COLUMN (vertikalno). Sufiks WRAP automatski prelama stavke kada pređu granice kontejnera, dok sufiks REVERSE obrće zadani smjer raspoređivanja, tj. s desna na lijevo (ili odozdo prema gore ako je glavna osa vertikalna).
 * 3. Poravnanje po glavnoj osi: START (zadani redoslijed glavne ose), END (obrnuti redoslijed glavne ose), CENTER (centrirano po glavnoj osi), SPACE_EVENLY (ravnomjerno raspoređeno po glavnoj osi, sa jednakim razmakom između svake dvije stavke), SPACE_AROUND (ravnomjerno raspoređeno po glavnoj osi, svaka stavka zauzima jednak dio prostora), SPACE_BETWEEN (prva i zadnja stavka su na krajevima, a ostale su ravnomjerno raspoređene), postavlja se pomoću flexAlign().
 * 4. Poravnanje po poprečnoj osi: Svaki red ili kolona se tretira kao jedna stavka i poravnava se po poprečnoj osi. Načini poravnanja su isti kao za glavnu osu i postavljaju se pomoću flexAlign().
 * 5. Cjelokupno poravnanje: Sve stavke unutar kontejnera se tretiraju kao cjelina i poravnavaju se unutar kontejnera. Načini poravnanja su isti kao za glavnu osu i postavljaju se pomoću flexAlign().
 * @param {number} type Postavke glavne i poprečne ose
 */
uibase.flexFlow = function (type) {
     this.obj.lvObjSetFlexFlow(type)
}
/**
 * 
 * @param {number} main Poravnanje pod-elemenata duž glavne ose
 * @param {number} cross Poravnanje pod-elemenata duž poprečne ose
 * @param {number} track Poravnanje svih pod-elemenata u odnosu na kontejner
 */
uibase.flexAlign = function (main, cross, track) {
     this.obj.lvObjSetFlexAlign(main, cross, track)
}
/**
 * Ažurira dimenzije kontrole. Kada se dobije dimenzija kontrole kao 0, može se prvo pozvati ova funkcija, što je ekvivalentno ažuriranju keša prikaza.
 */
uibase.update = function () {
     this.obj.lvObjUpdateLayout()
}
/**
 * Dodavanje stanja kontroli
 * @param {number} state Enumeracija stanja
 */
uibase.addState = function (state) {
     this.obj.addState(state)
}
/**
 * Uklanjanje stanja kontrole. Ako želite da defokusirate fokusirano polje za unos, možete pozvati ovu metodu da biste uklonili stanje FOCUSED.
 * @param {number} state Enumeracija stanja
 */
uibase.clearState = function (state) {
     this.obj.clearState(state)
}
/**
 * Provjerava da li kontrola ima određeno stanje. Ako želite provjeriti da li je polje za unos fokusirano, možete koristiti ovu metodu i proslijediti FOCUSED parametar.
 * @param {number} state Enumeracija stanja
 * @returns true/false
 */
uibase.hasState = function (state) {
     return this.obj.hasState(state)
}
/**
 * Ponovno iscrtavanje kontrole, prisilno osvježavanje keša kontrole. Može prisilno riješiti problem sa artefaktima na ekranu, ali pozivanje u beskonačnoj petlji će smanjiti performanse.
 */
uibase.invalidate = function () {
     this.obj.invalidate()
}
/**
 * Pomjera određenu pod-kontrolu dok ne postane vidljiva. Ako želite da stavku koja je pomjerena izvan kontejnera i postala nevidljiva pomjerite na vidljivu poziciju, pozovite ovu metodu.
 * @param {boolean} en Da li omogućiti animaciju. Ako je omogućeno, polako će se pomjeriti, ako je onemogućeno, odmah će se pojaviti.
 * @param {boolean} isRecursive Zadano rekurzivno, pogodno za općenito pomicanje i pomicanje ugniježđenih kontrola.
 */
uibase.scrollToView = function (en, isRecursive) {
     if (isRecursive) {
          this.obj.scrollToView(en)
     } else {
          this.obj.scrollToViewRecursive(en)
     }
}
/**
 * Pomicanje kontrole po x-osi
 * @param {number} x Udaljenost pomicanja po x-osi
 * @param {boolean} en Da li omogućiti animaciju
 */
uibase.scrollToX = function (x, en) {
     this.obj.scrollToX(x, en)
}
/**
 * Pomicanje kontrole po y-osi
 * @param {number} y Udaljenost pomicanja po y-osi
 * @param {boolean} en Da li omogućiti animaciju
 */
uibase.scrollToY = function (y, en) {
     this.obj.scrollToY(y, en)
}
/**
 * Snimak elementa (u suštini screenshot). Ako želite sačuvati snimak cijelog ekrana, možete koristiti ovu metodu na objektu ekrana.
 * @param {string} fileName Obavezno, naziv datoteke za spremanje snimka (napomena: ekstenzija treba odgovarati formatu)
 * @param {number} type Nije obavezno, zadano png, format snimka 0:bmp/1:png/2:jpg(jpeg)
 * @param {number} cf Nije obavezno, format za pohranu RGB boja
 */
uibase.snapshot = function (fileName, type = 1, cf = NativeObject.APP.NativeComponents.NativeEnum.LV_IMG_CF_TRUE_COLOR_ALPHA) {
     if (!fileName) {
          return
     }
     // Zadano se sprema na lokaciju /app/data/snapshot
     os.mkdir("/app/data/snapshot/")
     this.obj.lvSnapshotTake(cf, "/app/data/snapshot/" + fileName, type)
}
export default uibase;