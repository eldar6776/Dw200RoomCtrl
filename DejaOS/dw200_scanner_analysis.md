# Detaljna Analiza Projekta: `dw200_scanner`

Ovaj projekt je najkompleksniji i najbogatiji funkcionalnostima od svih koje smo dosad analizirali. Predstavlja univerzalni "skener" ili "gateway" uređaj, čija je glavna svrha da prikuplja podatke s različitih ulaznih izvora (NFC, QR kod, Bluetooth, lozinka) i prosljeđuje ih na jedan ili više izlaznih kanala (RS485, TCP, HTTP, USB) koristeći različite protokole.

Arhitektura je identična onoj u `dw200_access` i `dw200_project_template`, koristeći modularni, događajima-vođeni pristup s odvojenim nitima za UI, hardver i logiku. "Esencija" ovog projekta leži u **izuzetno detaljnom `driver.js`-u i pametnom sustavu za rutiranje podataka nazvanom `driver.passage`.**

---

## Komunikacijski Protokoli: Srce Aplikacije

Ovaj projekt je pravi "švicarski nož" komunikacije. `driver.js` definira i upravlja sljedećim kanalima, a ključna ideja je da su svi **konfigurabilni** putem `config.json` datoteke, što omogućuje ogromnu fleksibilnost.

### 1. RS485 (preko UART-a) - Detaljno Objašnjenje

Korisnika je posebno zanimala RS485 komunikacija, i ovaj projekt pruža savršen primjer kako je ispravno koristiti u DejaOS okruženju.

*   **Definicija u `driver.js`:**
    ```javascript
    driver.uart485 = {
        id: 'uart485',
        init: function () {
            // ... inicijalizacija UART porta /dev/ttyS3 ...
            dxUart.runvg(...) // Pokreće worker za ovaj port
            std.setTimeout(() => {
                // Postavlja parametre (brzina, paritet...) iz konfiguracije
                dxUart.ioctl(1, config.get("sysInfo.p_uart1"), this.id)
            }, 1000)
        },
        sendVg: function (data) {
            log.debug("[485 send]:", JSON.stringify(data))
            dxUart.sendVg(data, this.id)
        },
        // ... sadrži i logiku za periodično slanje "heartbeat" poruka
    }
    ```

*   **Kako Koristiti (Objašnjenje):**
    1.  **Inicijalizacija (`init`):** U `init` funkciji, `dxUart.runvg` pokreće pozadinski worker za UART port `/dev/ttyS3` (što je tipično za RS485 na ovom hardveru). Nakon kratke pauze, `dxUart.ioctl` se koristi za postavljanje parametara porta (npr. "115200-8-N-1"). Ovi parametri se čitaju iz konfiguracije (`config.get("sysInfo.p_uart1")`), što znači da se mogu mijenjati bez izmjene koda.
    2.  **Slanje Podataka (`sendVg`):** Funkcija `sendVg` je apstrakcija za slanje. Ona je pametna: prima ili **JSON objekt** (za slanje u strukturiranom "VGuang" protokolu) ili **običan string** (za "transparentno" ili "raw" slanje). Funkcija `dxUart.sendVg` unutar DejaOS-a automatski zna kako formatirati poruku ovisno o tipu podatka koji primi.
    3.  **Primanje Podataka:** Primanje je riješeno asinkrono, putem događaja. `main.js` registrira globalni `topic` `dxUart.VG.RECEIVE_MSG`. Kada podatak stigne na RS485 port, `dxUart` modul objavljuje događaj na ovaj topic.
    4.  **Obrada Podataka:** U `services.js`, `switch` statement hvata taj događaj (`case dxUart.VG.RECEIVE_MSG:`) i prosljeđuje primljene podatke `uart485Service`-u na daljnju obradu. Ovdje bi se implementirala logika za parsiranje primljenih poruka.

*   **Ispravan Način Korištenja (Ključna Poanta):**
    *   **Ne zovete direktno `dxUart` iz logike aplikacije.** Umjesto toga, koristite apstrakciju definiranu u `driver.js`, tj. pozivate `driver.uart485.sendVg(mojPodatak)`. Ovo čini vaš kod čišćim i neovisnim o specifičnom portu.
    *   Za primanje, ne pišete kod koji aktivno čeka ili "sluša" na portu. Umjesto toga, u vašem `service` modulu napišete funkciju koja obrađuje podatke i registrirate je u `services.js` da se aktivira na `dxUart.VG.RECEIVE_MSG` događaj. **Ovo je ključ ispravne, ne-blokirajuće arhitekture u DejaOS-u.**

### 2. TCP/IP (Klijent Mod)

*   **Definicija:** `driver.tcp` definira TCP klijenta. U `init` funkciji, `dxTcp.runvg` se spaja na server čija je adresa (`sysInfo.taddr`) i port (`sysInfo.port`) definirana u konfiguraciji.
*   **Kako radi:** Slično kao UART, ima `sendVg` funkciju za slanje podataka. Podržava i "običan" (transparentni) i "protokol" mod (`sendNetPro`), gdje formatira poruke na specifičan način prije slanja. Primljeni podaci se također obrađuju preko događaja.

### 3. HTTP (Klijent Mod)

*   **Definicija:** `driver.http` definira HTTP klijenta za slanje podataka na web server.
*   **Kako radi:** Funkcija `sendVg` formatira podatak i šalje ga kao **HTTP POST zahtjev** na adresu definiranu u konfiguraciji (`sysInfo.haddr`). Zanimljivo je da `http.post` funkcija ovdje radi **sinkrono** (čeka odgovor od servera), što može pojednostaviti kod, ali u produkciji može blokirati nit ako server ne odgovara brzo.

### 4. Bluetooth (preko UART-a)

*   **Definicija:** `driver.uartBle` je vrlo sličan `uart485`, ali koristi drugi UART port (`/dev/ttyS5`) i veću brzinu (921600) za komunikaciju s Bluetooth modulom.
*   **Kako radi:** Aplikacija može slati komande Bluetooth modulu (npr. za promjenu imena ili MAC adrese) i primati podatke od spojenih Bluetooth uređaja. Čak sadrži i pomoćnu funkciju `genCrc` za formiranje specifičnog CRC (checksum) bajta koji je potreban za komunikaciju s tim modulom.

---

## Ostale Ključne Funkcionalnosti

### `driver.passage` - Univerzalni Ruter Podataka

Ovo je vjerojatno **najnapredniji i najmoćniji koncept** u cijelom projektu. `driver.passage` je softverski "ruter" koji na temelju konfiguracije odlučuje **KAMO** poslati podatak i u **KOJEM FORMATU**.

*   **Kako radi:**
    1.  Nakon što se podatak očita (npr. skenira QR kod), logika aplikacije ne zove direktno `driver.uart485.send...`, već poziva `driver.passage.beforeReport({ source: 'code', data: '12345' })`.
    2.  `beforeReport` prvo provjerava konfiguraciju (`sysInfo.report_mode`) da vidi kako formatirati poruku. Na primjer, može zapakirati QR kod '12345' u "0x30" (općeniti podatak) ili "0x33" (podatak s izvorom) komandu VGuang protokola.
    3.  Zatim poziva `driver.passage.report(...)` s tako formatiranim podatkom.
    4.  `report` funkcija provjerava konfiguraciju izlaznih kanala (npr. `sysInfo.ochannel`) i prosljeđuje podatak na **sve aktivne kanale**. Ako je u konfiguraciji odabrano da se QR kodovi šalju na RS485 i TCP, `report` će pozvati i `driver.uart485.sendVg(...)` i `driver.tcp.sendVg(...)`.

*   **Esencija:** Ovo je izuzetno moćno. Vaša glavna logika ne mora znati ništa o izlaznim kanalima. Ona samo kaže "imam ovaj QR kod", a `passage` se brine o tome da ga ispravno formatira i pošalje na sva mjesta gdje treba ići, sve na temelju postavki iz `config.json`. **Ovo omogućuje potpunu fleksibilnost i rekonfiguraciju uređaja bez ijedne linije izmjene koda.**

### `driver.sync` - Sinkronizacija Asinkronih Operacija

*   **Problem:** Neke operacije, poput dobivanja konfiguracije od Bluetooth modula, su asinkrone (pošalješ zahtjev i čekaš odgovor). Kako u kodu jednostavno dobiti taj odgovor bez kompliciranih "callback" funkcija?
*   **Rješenje:** `driver.sync` nudi jednostavno rješenje.
    *   `driver.sync.request("neka_tema", 2000)` u petlji čeka (s pauzama od 100ms) da se u globalnoj mapi pojavi podatak pod ključem "neka_tema", s maksimalnim čekanjem od 2 sekunde.
    *   Kada stigne asinkroni odgovor (npr. od Bluetooth-a), `services.js` uhvati događaj i pozove `driver.sync.response("neka_tema", dobiveni_podaci)`, čime "oslobađa" `request` funkciju i vraća podatak.
*   **Esencija:** Ovo je jednostavan, ali efektivan mehanizam za pretvaranje asinkronih događaja u sinkrone pozive funkcija, što može znatno pojednostaviti kod u nekim specifičnim situacijama.

---

## Zaključak

`dw200_scanner` je vrhunski primjer "gateway" ili "protokol konverter" uređaja. Njegova glavna snaga i "esencija" leži u:

1.  **Apstrakciji Komunikacijskih Kanala:** Sva komunikacija je jasno definirana i apstrahirana u `driver.js`, čineći ostatak aplikacije neovisnim o fizičkom sloju.
2.  **`driver.passage` Ruteru:** Genijalan i moćan mehanizam koji omogućuje dinamičko rutiranje podataka na različite izlazne kanale i u različitim formatima, sve upravljano iz konfiguracije.
3.  **Čistoj Događajima-Vođenoj Arhitekturi:** Slijedi najbolju praksu odvajanja hardvera, logike i korisničkog sučelja za responzivnu i skalabilnu aplikaciju.
4.  **Bogatstvu Primjera:** Sadrži detaljne i ispravne primjere za korištenje RS485, TCP, HTTP, Bluetooth, NFC, i QR skenera, s mnogim naprednim opcijama i konfiguracijama.

Ovaj projekt je zlatni rudnik za svakoga tko želi razumjeti kako izgraditi kompleksan uređaj za prikupljanje i prosljeđivanje podataka na DejaOS platformi. On pokazuje kako pisati kod koji nije samo funkcionalan, već i **izuzetno fleksibilan i konfigurabilan**.
