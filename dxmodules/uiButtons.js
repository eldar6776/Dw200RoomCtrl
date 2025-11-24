//build：20240314
//Kontrola grupe dugmadi
import utils from "./uiUtils.js"
import base from "./uiBase.js"
let buttons = {}

buttons.build = function (id, parent) {
    let temp = utils.validateBuild(buttons.all, id, parent, 'buttons')
    let my = {type: 'buttons'}
    my.obj = new utils.GG.NativeBtnmatrix({ uid: id }, temp)
    my.id = id
    /**
     * Postavlja podatke koji odgovaraju grupi dugmadi, moraju biti u formatu niza. Primjer ispod prikazuje tri reda dugmadi, ukupno 12 dugmadi:
     * ["1", "2", "3", "0", "\n",
     * "4", "5", "6", "Otkaži", "\n",
     *  "7", "8", "9", "Potvrdi", ""]
     * @param {array} d Nije obavezno. Ako nije popunjeno ili nije tipa objekat, dobijaju se podaci.
     */
    my.data = function (d) {
        if (utils.validateObject(d)) {
            this.obj.lvBtnmatrixSetMap(d)
        } else {
            return this.obj.lvBtnmatrixGetMap()
        }
    }
    /**
     * Klikom na bilo koje dugme u grupi dugmadi, poziva se selectedData da bi se dobio ID i tekst kliknutog dugmeta.
     * Primjer povratne vrijednosti: {id:11, text:'Otkaži'}
     */
    my.clickedButton = function () {
        let id = this.obj.lvBtnmatrixGetSelectedBtn();
        if (id == 0xFFFF) {
            // Klikom na granicu grupe dugmadi pojavit će se nevažeća vrijednost 0xFFFF, vraća se prazno
            return { id: null, text: null }
        }
        let txt = this.obj.lvBtnmatrixGetBtnText(id);
        return { id: id, text: txt }
    }
    /**
     * Postavlja stanje određenog dugmeta u grupi dugmadi, može se promijeniti u odabrano, nedostupno i slično.
     * @param {number} id Indeks dugmeta, počevši od 0, s lijeva na desno, odozgo prema dolje. To je također ID koji vraća clickedButton.
     * @param {number} state Pogledajte dxui.Utils.BUTTONS_STATE
     */
    my.setState = function (id, state) {
        this.obj.lvBtnmatrixSetBtnCtrl(id, state)
    }
    /**
     * Uklanja već postavljeno stanje određenog dugmeta u grupi dugmadi.
     * @param {number} id Indeks dugmeta, počevši od 0, s lijeva na desno, odozgo prema dolje. To je također ID koji vraća clickedButton.
     * @param {number} state Pogledajte dxui.Utils.BUTTONS_STATE
     */
    my.clearState = function (id, state) {
        this.obj.lvBtnmatrixClearBtnCtrl(id, state)
    }
    /**
     * Postavlja stanje svih dugmadi u grupi dugmadi, može se promijeniti u odabrano, nedostupno i slično.
     * @param {number} state Pogledajte dxui.Utils.BUTTONS_STATE
     */
    my.setAllState = function (state) {
        this.obj.lvBtnmatrixSetBtnCtrlAll(state)
    }
    /**
     * Uklanja već postavljeno stanje svih dugmadi u grupi dugmadi.
     * @param {number} state Pogledajte dxui.Utils.BUTTONS_STATE
     */
    my.clearAllState = function (state) {
        this.obj.lvBtnmatrixClearBtnCtrlAll(state)
    }
    /**
     * Postavlja širinu dugmeta sa određenim ID-om da zauzima određeni broj polja.
     * @param {number} id Broj dugmeta, numerisanje počinje od 0.
     * @param {number} width Broj polja koje širina zauzima.
     */
    my.setBtnWidth = function (id, width) {
        this.obj.lvBtnmatrixSetBtnWidth(id, width)
    }
    /**
     * Postavlja ikonu dugmeta za određeni ID.
     * @param {number} id Broj dugmeta, numerisanje počinje od 0.
     * @param {string} src Putanja do datoteke ikone.
     */
    my.setBtnIcon = function (id, src) {
        this.obj.addEventCb((e) => {
            // Dobijanje objekta za crtanje kontrole
            let dsc = e.lvEventGetDrawPartDsc()
            // Ako se crta dugme sa ID-om 'id'
            if (dsc.type == utils.ENUM.LV_BTNMATRIX_DRAW_PART_BTN && dsc.id == id) {
                // Dobijanje informacija o slici
                let header = utils.GG.NativeDraw.lvImgDecoderGetInfo(src)
                // Definisanje područja, centrirano prikazivanje. Napomena: pri pretvaranju dimenzija u područje potrebno je oduzeti 1, a pri pretvaranju područja u dimenzije dodati 1.
                let x1 = dsc.draw_area.x1 + (dsc.draw_area.x2 - dsc.draw_area.x1 + 1 - header.w) / 2;
                let y1 = dsc.draw_area.y1 + (dsc.draw_area.y2 - dsc.draw_area.y1 + 1 - header.h) / 2;
                let x2 = x1 + header.w - 1;
                let y2 = y1 + header.h - 1;
                let area = utils.GG.NativeArea.lvAreaSet(x1, y1, x2, y2)
                // Crtanje informacija o slici
                let img_draw_dsc = utils.GG.NativeDraw.lvDrawImgDscInit()
                // Crtanje slike
                utils.GG.NativeDraw.lvDrawImg(dsc.dsc, img_draw_dsc, area, src)
            }
        }, utils.ENUM.LV_EVENT_DRAW_PART_END)
    }
    let comp = Object.assign(my, base);
    utils.setParent(this.all,comp,parent)
    return comp;
}
export default buttons;