//build:20240724
/**
 * Osnovna UI komponenta, potrebno je prvo razumjeti neke koncepte
 * 1. Slojevi: Uređaj ima 2 osnovna sloja, glavni sloj (main) i gornji sloj (top)
      TOP sloj je uvijek iznad glavnog sloja, prebacivanje stranica na glavnom sloju neće prekriti TOP sloj, TOP sloj je pogodan za prikazivanje statusnih traka.
      Glavni sloj može unaprijed konstruisati više stranica u memoriji, a zatim učitavati i prebacivati različite stranice putem loadMain. TOP sloj se ne može prebacivati, UI objekti na njemu se mogu samo sakriti ili obrisati.

 * 2. UI objekat: Postoji mnogo vrsta UI objekata, od kojih je najosnovniji 'view' objekat. Korijenski UI objekat glavnog i gornjeg sloja mora biti 'view' objekat, a svi ostali UI objekti su pod-UI objekti nekog UI objekta.
      UI objekti uključuju uobičajene 'button', 'label', 'image' itd. Svi objekti imaju neke zajedničke atribute, kao i neke jedinstvene atribute.
      Svi UI objekti imaju globalno jedinstveni id, koji se ne smije ponavljati. Zajednički atributi također uključuju:
      - type: dobija tip UI objekta, string
      - parent: dobija roditeljski čvor UI objekta, string
      - children: dobija ID-ove svih pod-objekata UI objekta, niz stringova

 * 3. dxui datoteka: Datoteka sa ekstenzijom .dxui je UI stablo generisano pomoću alata za vizuelno prevlačenje i ispuštanje. Alat automatski generiše odgovarajuću js datoteku, koja se može importovati za manipulaciju.

 */

import logger from './dxLogger.js'
import utils from './uiUtils.js'
import button from './uiButton.js'
import font from './uiFont.js'
import image from './uiImage.js'
import label from './uiLabel.js'
import line from './uiLine.js'
import list from './uiList.js'
import dropdown from './uiDropdown.js'
import checkbox from './uiCheckbox.js'
import slider from './uiSlider.js'
import _switch from './uiSwitch.js'
import textarea from './uiTextarea.js'
import keyboard from './uiKeyboard.js'
import style from './uiStyle.js'
import view from './uiView.js'
import buttons from './uiButtons.js'

const dxui = {}
dxui.Button = button
dxui.Font = font
dxui.Image = image
dxui.Label = label
dxui.Line = line
dxui.List = list
dxui.Dropdown = dropdown
dxui.Checkbox = checkbox
dxui.Slider = slider
dxui.Switch = _switch
dxui.Textarea = textarea
dxui.Keyboard = keyboard
dxui.Style = style
dxui.View = view
dxui.Utils = utils
dxui.Buttons = buttons
let orientation = 1 //Zadano horizontalno
/**
 * Inicijalizacija, mora se pozvati na samom početku koda
 * @param {object} options Inicijalizacijski parametri
 *        @param {number} options.orientation Orijentacija ekrana može biti 0, 1, 2, 3, što redom predstavlja portret, ekran lijevo; pejzaž, ekran gore; portret, ekran desno; pejzaž, ekran dolje
 * @param {object} context Kontekst, svaka aplikacija ima jedinstvenu kontekstualnu varijablu, različiti js fajlovi mogu referencirati dxUi.js, ali kontekst mora biti isti
*/
dxui.init = function (options, context = {}) {
     this.initContext(context)
     if (options && options.orientation != undefined && options.orientation != null && [0, 1, 2, 3].includes(options.orientation)) {
          orientation = options.orientation
     }
     utils.GG.NativeDisp.lvDispSetRotation(orientation)
}
/**
 * Inicijalizacija konteksta, svaka aplikacija ima jedinstvenu kontekstualnu varijablu, različiti js fajlovi mogu referencirati dxUi.js, ali kontekst mora biti isti
 * Potrebno je inicijalizirati prije izgradnje UI-ja
 * @param {object} context Inicijalno prazan objekat {}
 */
dxui.initContext = function (context) {
     utils.validateObject(context)
     dxui.all = context
     dxui.Button.all = dxui.all
     dxui.Image.all = dxui.all
     dxui.Label.all = dxui.all
     dxui.Line.all = dxui.all
     dxui.List.all = dxui.all
     dxui.Dropdown.all = dxui.all
     dxui.Checkbox.all = dxui.all
     dxui.Slider.all = dxui.all
     dxui.Switch.all = dxui.all
     dxui.Textarea.all = dxui.all
     dxui.Keyboard.all = dxui.all
     dxui.View.all = dxui.all
     dxui.Buttons.all = dxui.all
}
/**
 * Dobijanje već izgrađenog UI objekta po ID-u
 * @param {string} id 
 * @returns 
 */
dxui.getUi = function (id) {
     return dxui.all[id]
}
/**
 * Vanjska petlja treba pozvati ovu metodu
 */
dxui.handler = function () {
     return utils.GG.NativeTimer.lvTimerHandler()
}
/**
 * Dobijanje orijentacije ekrana, različite orijentacije ekrana mogu zahtijevati učitavanje različitih UI-ja ili različite logike obrade
 * @returns Može biti 0, 1, 2, 3, što redom predstavlja portret, ekran lijevo; pejzaž, ekran gore; portret, ekran desno; pejzaž, ekran dolje
 */
dxui.getOrientation = function () {
     return orientation;
}
/**
 * Kreira tajmer koji izvršava callback funkciju svakih 'ms' milisekundi, uglavnom se koristi za periodično osvježavanje vrijednosti nekog UI objekta
 * Moguće je obrisati tajmer unutar callback funkcije (clearInterval) kako bi se postigao efekat setTimeout-a
 * @param {string} id Jedinstveni identifikator tajmera, obavezno
 * @param {function} callback Callback funkcija (može biti anonimna funkcija)
 * @param {number} ms Broj milisekundi
 * @param {object} user_data Korisnički podaci, proslijeđeni kao parametar callback-u
 * @returns Ručka tajmera
 */
dxui.setInterval = function (id, callback, ms, user_data) {
     if (utils.validateId(dxui.all, id))
          if (!callback || (typeof callback != 'function') || !callback.name || callback.name === '') {
               throw new Error('The callback should not be null and should be named function')
          }
     if (!ms || (typeof ms != 'number')) {
          throw new Error('The interval should not be empty, and should be number')
     }
     if (!this.all.__interval) {
          this.all.__interval = {}
     }
     this.all.__interval[id] = utils.GG.NativeTimer.lvTimerCreate(callback, ms, user_data)
}
/**
 * Kada tajmer više nije potreban, može se obrisati
 * @param {string} id ID tajmera
 */
dxui.clearInterval = function (id) {
     if (!dxui.all[id]) {
          return
     }
     utils.GG.NativeTimer.lvTimerDel(dxui.all[id])
     delete dxui.all.__interval[id]
}
/**
 * Dobijanje roditeljskog objekta UI objekta
 * @param {Object} ui 
 */
dxui.getParent = function (ui) {
     if (ui.parent) {
          return dxui.getUi(ui.parent)
     }
     return null
}
/**
 * Brisanje trenutnog UI objekta
 */
dxui.del = function (ui) {
     function recursiveDelete(ui) {
          // Ako objekat ne postoji, direktno se vraća
          if (!dxui.all[ui.id]) {
               return;
          }

          // Prvo rekurzivno obriši sve pod-objekte
          if (ui.children && Array.isArray(ui.children)) {
               // Iteracija kroz pod-čvorove obrnutim redoslijedom
               for (let i = ui.children.length - 1; i >= 0; i--) {
                    const childId = ui.children[i];
                    if (dxui.all[childId]) {
                         recursiveDelete(dxui.all[childId]);
                    }
               }
          }
          // Uklanjanje trenutnog objekta iz roditeljskog objekta
          if (ui.parent && dxui.all[ui.parent] && Array.isArray(dxui.all[ui.parent].children)) {
               const children = dxui.all[ui.parent].children
               let index = children.indexOf(ui.id);
               if (index !== -1) {
                    children.splice(index, 1);
               }
          }

          // Brisanje trenutnog objekta
          ui.obj.lvObjDel();
          delete dxui.all[ui.id];
     }

     // Početak rekurzivnog brisanja
     recursiveDelete(ui);
}
/**
 * Učitavanje (prebacivanje) već izgrađenog UI objekta na glavni sloj
 * @param {object} ui UI objekat izgrađen pomoću 'build' funkcije
 */
dxui.loadMain = function (ui) {
     if (!ui || !ui.obj) {
          throw new Error("dxui.loadMain:'ui' paramter should not be null")
     }
     // Učitavanje glavnog ekrana
     utils.GG.NativeDisp.lvScrLoad(ui.obj)
}
/**
 * Vrijeme proteklo od posljednje korisničke aktivnosti (npr. klika)
 * @returns Vraća proteklo vrijeme od posljednje aktivnosti (u milisekundama)
 */
dxui.getIdleDuration = function () {
     return utils.GG.NativeDisp.lvDispGetInactiveTime()
}
/**
 * Resetuje vrijeme proteklo od posljednje korisničke aktivnosti (npr. klika)
 */
dxui.trigActivity = function () {
     utils.GG.NativeDisp.lvDispTrigActivity()
}

export default dxui;