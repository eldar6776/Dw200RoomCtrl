# GUI Analiza i Mape za DW200 Room Control

Ovaj dokument detaljno opisuje trenutnu implementaciju korisničkog interfejsa (GUI) i pruža upute za modificiranje istog u svrhu kreiranja "Hotel Room Access Control" sistema.

## 1. Arhitektura Grafičkog Sučelja

Aplikacija koristi **DejaOS UI Framework (`dxUi`)**, koji je omotač oko **LVGL** (Light and Versatile Graphics Library).

### Ključne Datoteke
*   **Kontroler:** `src/screen.js` - "Mozak" operacije. Inicijalizira ekran, upravlja rotacijom, sluša događaje (npr. otvaranje vrata) i poziva odgovarajuće view-ove.
*   **Glavni Prikaz:** `src/view/mainView.js` - Definira izgled glavnog ekrana (pozadina, sat, statusne ikone, dugme). **Ovo je fajl koji ćete najviše mijenjati.**
*   **PIN Prikaz:** `src/view/passwordView.js` - Ekran za unos šifre (tastatura).
*   **Pop-up Prozori:** `src/view/popWin.js` - Definira prozore za poruke (Uspjeh, Greška, Upozorenje).
*   **Konfiguracija:** `src/config.json` (i `dxConfig`) - Mnogi UI elementi (rotacija, tekstovi, pozadinske slike) se učitavaju iz ovog fajla.

---

## 2. Mapa Elemenata: `src/view/mainView.js`

Ovdje se nalaze svi elementi koji su trenutno vidljivi na glavnom ekranu.

| Element | Varijabla u kodu | Linija (cca) | Opis & Svojstva | Kako promijeniti |
| :--- | :--- | :--- | :--- | :--- |
| **Glavni Ekran** | `screen_main` | 10 | Korijenski kontejner. | `screen_main.scroll(false)` - onemogućava skrolanje. |
| **Pozadinska Slika** | `screen_img` | 124 | Slika preko cijelog ekrana. | `screen_img.source("/putanja/do/slike.png")`. Trenutno koristi `bk_90.png` ili iz config-a. |
| **Vrijeme (Sati)** | `screen_label_time` | 146 | Digitalni sat (npr. "12:30"). | `screen_label_time.text("...")`, font definiran u `buildLabel`. |
| **Datum** | `screen_label_data` | 148 | Datum (npr. "Sun 11-27"). | Ažurira se u `mainView.timer` petlji. |
| **Ime Firme/Sobe** | `screen_label_company` | 150 | Tekst dobrodošlice ("Welcome"). | `screen_label_company.text("Room 101")`. Puni se iz `uiConfig.devname`. |
| **Kontejner Datuma** | `date_box` | 138 | Grupiše vrijeme, datum i tekst. | `date_box.align(...)` - mijenja poziciju cijelog bloka (trenutno gornji desni ugao). |
| **Dugme za PIN** | `screen_btn_unlocking` | 163 | Dugme na dnu za otvaranje tastature. | `screen_btn_unlocking.setSize(w, h)`, `bgColor`, `bgOpa` (prozirnost). |
| **Tekst Dugmeta** | `screen_btn_unlocking_label` | 173 | Tekst unutar dugmeta ("OPEN"). | `screen_btn_unlocking_label.text("UNLOCK")`. |
| **Gornja Traka** | `top_cont` | 177 | Crna traka na vrhu (status bar). | `top_cont.hide()` ako želite full-screen dizajn bez traka. |
| **Donja Traka** | `bottom_cont` | 194 | Crna traka na dnu (SN, IP). | `bottom_cont.hide()` za čišći izgled. |
| **Mreža Ikona** | `top_net_enable` | 187 | Ikona za Ethernet status. | `source(...)` mijenja ikonu. Logika prikaza je u `screen.js`. |
| **MQTT Ikona** | `top_mqtt` | 192 | Ikona za Cloud vezu. | `source(...)` mijenja ikonu. |

---

## 3. Upute za Modifikaciju (Hotel Room Interface)

Slijedite ove korake da transformirate postojeći interfejs u kontrolu hotelske sobe.

### Korak 1: Priprema Resursa
1.  Kreirajte nove slike (pozadina, ikone) u `.png` formatu.
2.  Postavite ih u folder: `resource/image/`.
    *   Preporučena rezolucija pozadine: **480x800** (za portret) ili **800x480** (za pejzaž).

### Korak 2: Čišćenje Postojećeg Prikaza (`src/view/mainView.js`)
Ako želite moderni "kiosk" izgled bez crnih traka:
1.  Pronađite `top_cont` i `bottom_cont`.
2.  Promijenite `bgOpa(30)` u `bgOpa(0)` (potpuno prozirno) ili ih uklonite/sakrijte sa `.hide()`.
3.  Premjestite statusne ikone (`top_net_enable`, `top_mqtt`) direktno na `screen_main` umjesto u `top_cont` ako ih želite zadržati "plutajuće".

### Korak 3: Promjena Pozadine
U `src/view/mainView.js`:
```javascript
// Umjesto učitavanja iz config-a, fiksirajte vašu novu sliku
screen_img.source("/app/code/resource/image/hotel_room_bg.png")
```

### Korak 4: Pozicioniranje Elemenata (Broj sobe, Status)
Elementi se pozicioniraju koristeći `align` funkciju:
*   `dxui.Utils.ALIGN.CENTER` (Sredina)
*   `dxui.Utils.ALIGN.TOP_MID` (Gore sredina)
*   `dxui.Utils.ALIGN.BOTTOM_MID` (Dolje sredina)

Primjer promjene pozicije sata:
```javascript
// Stari kod: date_box.align(dxui.Utils.ALIGN.TOP_RIGHT, 0, 30)
// Novi kod (centrirano gore):
date_box.align(dxui.Utils.ALIGN.TOP_MID, 0, 50) 
// 0 je X pomak, 50 je Y pomak od vrha
```

### Korak 5: Promjena Stila Fonta
Fontovi se definiraju u `buildLabel` funkciji ili direktno:
```javascript
// Učitavanje većeg fonta (provjerite dostupne fontove u resource/font)
let font100 = dxui.Font.build('/app/code/resource/font/VašFont.ttf', 100, dxui.Utils.FONT_STYLE.NORMAL)
screen_label_time.textFont(font100)
```

### Korak 6: Status "Do Not Disturb" / "Clean Room" (Napredno)
Ako vaš dizajn uključuje ove statusne tipke:
1.  Morat ćete kreirati nove `dxui.Button` elemente u `mainView.init`.
2.  Dodati `on(dxui.Utils.EVENT.CLICK, ...)` handlere za njih.
3.  Povezati ih sa backend logikom (slanje MQTT poruke).

---

## 4. Dinamička Logika: `src/screen.js`

Ako mijenjate **ponašanje** (ne samo izgled), dirate `screen.js`.

*   **Prikaz rezultata (Otključano/Odbijeno):** Funkcija `screen.displayResults`.
    *   Trenutno koristi `screen.success()` ili `screen.fail()` koji otvaraju popup.
    *   Ako želite da se cijeli ekran promijeni u zeleno umjesto popup-a, ovdje mijenjate logiku.

*   **Ikone Statusa:** Funkcije `screen.netStatusChange` i `screen.mqttConnectedChange`.
    *   Ovdje se definira kada se ikone prikazuju ili skrivaju.

---

## 5. Konfiguracija: `config.json`

Mnoge stvari možete promijeniti bez kodiranja editovanjem `/app/data/config/config.json` (ako je dostupno) ili `src/config.json`:

*   `uiInfo.rotation`: 0 ili 1 (Pejzaž/Portret).
*   `sysInfo.deviceName`: Ime koje se ispisuje na ekranu (npr. "ROOM 202").
*   `uiInfo.show_unlocking`: `true`/`false` - Prikazati ili sakriti PIN dugme.
