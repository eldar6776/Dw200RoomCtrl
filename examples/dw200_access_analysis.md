# Analiza Projekta: `dw200_access`

Ovaj projekt je cjelovita aplikacija za kontrolu pristupa koja koristi NFC kartice, QR kodove, PIN-ove i daljinske komande putem MQTT-a za otvaranje vrata. Arhitektura je modularna i vođena događajima (event-driven), što je čini dobrim temeljem za složenije sustave.

## Arhitektura i Ključni Koncepti

Aplikacija se temelji na "MVC-like" uzorku i koristi radničke niti (worker threads) za odvajanje zadataka:

1.  **Glavna Nit (`main.js`):**
    *   **Uloga:** Inicijalizacija sustava.
    *   **Zadaci:** Pokreće osnovne servise (MQTT, Bluetooth, Baza Podataka), inicijalizira korisničko sučelje (`screen.js`) i pokreće dvije pozadinske radničke niti.
    *   **Esencija:** Prikazuje kako strukturirati start-up aplikacije, inicijalizirati ključne komponente i delegirati posao pozadinskim procesima.

2.  **Kontroler Nit (`controller.js`):**
    *   **Uloga:** Upravljanje hardverom.
    *   **Zadaci:** Inicijalizira i periodički očitava stanje svih hardverskih komponenti kao što su NFC čitač, QR skener, GPIO tipke i mrežno sučelje.
    *   **Esencija:** Dobar primjer kako u petlji (polling) upravljati hardverom u zasebnoj niti kako se ne bi blokiralo korisničko sučelje i glavna logika.

3.  **Servisna Nit (`services.js`):**
    *   **Uloga:** Centralno čvorište za obradu događaja (Event Hub).
    *   **Zadaci:** Sluša događaje koje objavljuju hardverski drajveri (npr. `dxNfc.RECEIVE_MSG`). Kada stigne događaj (npr. skenirana kartica), prosljeđuje ga odgovarajućem servisnom modulu (npr. `nfcService`).
    *   **Esencija:** Ovo je srce event-driven arhitekture. Prikazuje kako na jednom mjestu primati sve važne događaje i usmjeravati ih na daljnju obradu. Ovo čini sustav izuzetno fleksibilnim.

## Logika Kontrole Pristupa (`/service/` folder)

Ovo je "mozak" aplikacije.

1.  **`nfcService.js`, `codeService.js`, itd.:**
    *   **Uloga:** Preprocesiranje podataka.
    *   **Zadaci:** Ovi servisi primaju "sirove" podatke od drajvera (npr. NFC data), parsiraju ih kako bi izdvojili koristan podatak (npr. broj kartice) i prosljeđuju ga centralnom `accessService`-u.
    *   **Esencija:** Prikazuju kako odvojiti logiku parsiranja od logike autorizacije. Svaki ulazni mehanizam ima svoj mali servis.

2.  **`accessService.js`:**
    *   **Uloga:** Glavna autorizacijska logika.
    *   **Zadaci:**
        *   Prima zahtjev za pristup (npr. `{type: 200, code: '12345678'}`).
        *   **Lokalna Provjera:** Provjerava u lokalnoj SQLite bazi podataka (`sqliteFuncs.permissionVerifyByCodeAndType`) da li prosljeđeni kod (kartica, QR, PIN) ima dozvolu za pristup.
        *   **Online Provjera (Opcionalno):** Ako lokalna provjera ne uspije i ako je uređaj online (`driver.mqtt.getStatus()`), može poslati zahtjev za autorizaciju na centralni server putem MQTT-a i čekati odgovor.
        *   **Akcija:** Na temelju rezultata provjere, izvršava akciju:
            *   **Uspjeh:** Otvara vrata (`driver.gpio.open()`), pušta zvuk uspjeha (`driver.audio.success()`) i prikazuje poruku na ekranu (`driver.screen.accessSuccess`).
            *   **Neuspjeh:** Pušta zvuk greške i prikazuje poruku o neuspjehu.
        *   **Zapisivanje:** Bilježi svaki pokušaj pristupa u lokalnu bazu i šalje zapis na centralni server putem MQTT-a (`accessReport`).
    *   **Esencija:** Ovo je najvažniji dio za ponovno korištenje. Sadrži kompletan proces autorizacije: **lokalna provjera -> online provjera (fallback) -> izvršavanje akcije -> izvještavanje**.

## Što Možete Iskoristiti (Esencija)

*   **Modularna Arhitektura:** Jasna podjela na `main`, `controller` i `services` olakšava dodavanje novih funkcionalnosti bez mijenjanja postojećeg koda. Želite li dodati otisak prsta? Samo trebate kreirati `fingerprintDriver` i `fingerprintService`.
*   **Event-Driven Komunikacija:** Korištenje `dxEventBus`-a za komunikaciju između komponenti. Ovo je odličan uzorak koji smanjuje direktnu ovisnost između modula.
*   **Centralizirana Autorizacija (`accessService.js`):** Logika za provjeru dozvola je na jednom mjestu. Lako ju je prilagoditi za različite vrste provjera (npr. provjera po vremenu, po danu u tjednu, itd.).
*   **Offline-First s Online Fallback-om:** Aplikacija primarno radi s lokalnom bazom podataka, što osigurava funkcionalnost i kada uređaj nije spojen na internet. Ako je online, može koristiti centralni server za dodatnu provjeru. Ovo je ključno za pouzdane sustave kontrole pristupa.
*   **Upravljanje Hardverom (`driver.js` i `controller.js`):** Primjeri kako inicijalizirati i upravljati raznim hardverskim komponentama (GPIO, NFC, Zvuk, Ekran).
*   **Lokalna Baza Podataka (`sqliteService.js`):** Primjer korištenja SQLite baze za spremanje korisničkih dozvola i zapisa o pristupima.

Ukratko, `dw200_access` je odličan kostur za bilo koji uređaj koji zahtijeva neku vrstu autorizacije. Možete lako zamijeniti ili dodati ulazne mehanizme (NFC, QR,...) i prilagoditi logiku u `accessService`-u svojim potrebama, dok temeljna arhitektura ostaje ista.
