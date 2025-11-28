# Analiza Projekta: `dw200_project_template`

Ovaj projekt je upravo ono što mu ime govori: **kostur ili predložak (template)** za izradu nove DejaOS aplikacije. Njegova svrha je da developeru pruži ispravnu strukturu mapa i datoteka, s osnovnom, ali funkcionalnom inicijalizacijom ključnih servisa. Ovo vam omogućuje da odmah počnete s razvojem vlastite logike bez potrebe da svaki put iznova postavljate temeljnu arhitekturu.

## Kako Koristiti Ovaj Predložak za Novi Projekt

Postupak za početak novog projekta s ovim predloškom je vrlo jednostavan:

1.  **Kopirajte Cijelu Mapu:** Uzmite cijelu mapu `dw200_project_template` i kopirajte je na lokaciju vašeg novog projekta.
2.  **Preimenujte Mapu:** Dajte joj smisleno ime koje odgovara vašem projektu, npr. `hotel_sobni_panel`.
3.  **Otvorite u IDE-u:** Otvorite novu, preimenovanu mapu u vašem razvojnom okruženju (npr. VS Code).
4.  **Počnite s Razvojem:** Nakon otvaranja, vaš glavni posao odvijat će se u `src` mapi. Fokusirajte se na sljedeće datoteke i mape:
    *   **`src/view/`**: Ovdje kreirate nove `.js` datoteke koje definiraju vaše korisničko sučelje (ekrane, gumbe, labele, liste, itd.).
    *   **`src/service/`**: Ovdje kreirate `.js` datoteke koje će sadržavati "mozak" vaše aplikacije. Na primjer, `mojNfcServis.js` bi sadržavao logiku koja se izvršava kada se skenira NFC kartica.
    *   **`src/screen.js`**: Ovu datoteku prilagođavate kako bi inicijalizirala i prikazivala vaše ekrane iz `view` mape.
    *   **`src/driver.js`**: Ovdje prilagođavate ili dodajete nove drajvere (definicije hardvera) koji odgovaraju specifičnom hardveru vašeg uređaja (npr. koji GPIO pinovi se koriste, koja je brzina UART-a, itd.).
    *   **`src/services.js`**: U ovoj datoteci povezujete hardverske događaje (`topic`-e) s vašim servisnim funkcijama koje ste definirali u `service` mapi.

## Analiza Strukture i Inicijalizacije

Predložak slijedi odličnu, modularnu, događajima-vođenu arhitekturu koju smo detaljno analizirali u `dw200_access` projektu. To je preporučeni način izrade DejaOS aplikacija.

### Je li Sve Ispravno Inicijalizirano?

**Da, apsolutno.** Sve što je potrebno za pokretanje osnovne, funkcionalne aplikacije je ispravno postavljeno i inicijalizirano.

*   **`main.js` - Glavna Nit:**
    *   **Ispravno:** Pokreće `screen.init()` za inicijalizaciju korisničkog sučelja.
    *   **Ispravno:** Pokreće `controller.js` kao zasebnu radničku nit (`bus.newWorker`), odvajajući hardverske operacije od glavne niti.
    *   **Ispravno:** Pokreće `services.js` u bazenu radničkih niti (`pool.init`) i prosljeđuje mu listu `topics` (događaja) na koje treba reagirati.
    *   **Zaključak:** Glavna petlja je savršeno postavljena. U većini slučajeva, ovu datoteku ne morate mijenjati.

*   **`controller.js` - Hardverska Nit:**
    *   **Ispravno:** Pokreće se u svojoj beskonačnoj petlji (`setInterval`) i u `initController` funkciji inicijalizira osnovne drajvere: `gpio`, `alsa` (zvuk), `nfc`, `code` (QR skener) i `net` (mreža).
    *   **Ispravno:** U `loop` funkciji periodički poziva `loop()` metode za drajvere koji to zahtijevaju (NFC, mreža, QR), osiguravajući da oni kontinuirano rade u pozadini.
    *   **Zaključak:** Hardverska nit je spremna. Vaš zadatak je da u `driver.js` prilagodite pinove i opcije za hardver koji stvarno koristite.

*   **`services.js` - Logička Nit (Event Hub):**
    *   **Ispravno:** Postavljena je `pool.callback` funkcija koja služi kao centralno mjesto za primanje svih hardverskih događaja (npr. `dxNfc.RECEIVE_MSG`).
    *   **Ispravno:** `switch` statement je na mjestu i služi za usmjeravanje (rutiranje) događaja na odgovarajuće servisne module (npr. događaj skeniranja NFC-a se prosljeđuje `nfcService`-u).
    *   **Zaključak:** "Event Hub" je potpuno funkcionalan. Vaš posao je da u mapu `service/` dodate datoteke (npr. `nfcService.js`) i u njima implementirate stvarnu logiku aplikacije.

*   **`driver.js` - Definicije Drajvera:**
    *   **Ispravno:** Sadrži jasne primjere kako definirati objekte za svaki hardverski modul, enkapsulirajući hardverski-specifične detalje.
    *   **Sadržaj:** Predložak dolazi s primjerima inicijalizacije za:
        *   `gpio`: Jedan relej na pinu 105.
        *   `alsa`: Osnovne funkcije za reprodukciju zvuka.
        *   `nfc`: Osnovna inicijalizacija za čitanje M1 kartica.
        *   `code`: Inicijalizacija kamere i dekodera za QR kodove.
        *   `uart485`: Primjer inicijalizacije RS485 serijske komunikacije.
        *   `net`: Primjer inicijalizacije žičane (Ethernet) mreže.
    *   **Zaključak:** Ovo je vaša "centrala za hardver". Ovdje mijenjate pinove, portove (`/dev/ttyS3`), brzine i druge opcije da odgovaraju hardveru vašeg konačnog uređaja.

*   **`screen.js` i `view/mainView.js` - Primjer UI-a:**
    *   **Ispravno i Vrlo Korisno:** `screen.js` ne samo da inicijalizira UI, već pruža i **funkcionalan primjer**. On se pretplaćuje (`bus.on`) na 'code' i 'nfc' događaje.
    *   **Kompletan Tok Podataka:** Predložak demonstrira cijeli proces:
        1. Hardver u `controller.js` detektira skeniranje (npr. NFC).
        2. Hardverski drajver objavljuje "sirovi" događaj (`dxNfc.RECEIVE_MSG`).
        3. `services.js` prima događaj i prosljeđuje ga (u ovom slučaju praznom) `nfcService`-u.
        4. (Ovdje vi dodajete logiku) `nfcService` bi obradio podatke i objavio novi, čisti događaj, npr. `bus.emit('nfc', { id: '123' })`.
        5. `screen.js` sluša `bus.on('nfc', ...)` i kada primi događaj, ažurira `Label` na ekranu (`mainView.cardLabel.text(...)`).
    *   **Zaključak:** Ovo je fantastičan "živi" primjer koji vam pokazuje kompletan, ispravan tok podataka kroz cijelu aplikaciju.

## Zaključak i "Esencija" Projekta

`dw200_project_template` nije samo prazna struktura mapa; to je **minimalna, ali potpuno funkcionalna "Hello World" aplikacija za DejaOS koja slijedi najbolju praksu modularne i događajima-vođene arhitekture.**

**"Esencija" ovog predloška je u tome što vam daje:**

1.  **Ispravnu Arhitekturu:** Odvaja glavnu nit (UI), hardversku logiku i poslovnu logiku u zasebne radničke niti, osiguravajući da aplikacija bude responzivna i da se ne blokira.
2.  **Spreman Sustav za Događaje (Event System):** `EventBus` i `WorkerPool` su već konfigurirani. Samo trebate dodavati svoje događaje i logiku koja na njih reagira.
3.  **Primjere Inicijalizacije Drajvera:** U `driver.js` imate gotove i jasne primjere za najčešće korišteni hardver.
4.  **Kompletan Primjer Toka Podataka:** Demonstrira cijeli put od skeniranja hardvera (QR/NFC) do prikaza tog podatka na ekranu, što je najčešći zadatak u razvoju ugrađenih sustava.

Ukratko, ovo je izvrstan i robustan temelj za početak bilo kojeg novog DejaOS projekta. Štedi vam vrijeme i usmjerava vas na pravilan način razmišljanja i strukturiranja koda.
