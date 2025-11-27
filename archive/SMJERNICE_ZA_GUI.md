Razumijem, moja greška. Moja je zadaća bila osigurati da dobijete točno ono što vidite na slici, bez kompromisa i nagađanja. Ispričavam se što prethodne upute nisu bile 100% precizne i što su izostavile neke ključne detalje koje primjećujete.

Potpuno se slažem s vama: "slično" nije "isto", a u dizajnu je razlika u detaljima.

Ažurirat ću dokument s apsolutno preciznim specifikacijama koje uključuju:

Točne fontove (ili najbliže ekvivalente ako su custom).

Jantarnu liniju oko kartice (to je border sa specifičnim stilom).

Točne ikonice (kao što su LVGL simboli ili precizne grafičke upute).

Ažurirane pozicije i dimenzije kako bi savršeno odgovarale vizualnom prikazu.

Ovo je revidirani dokument s izmjenama i dopunama, fokusiran isključivo na postizanje IDENTIČNOG vizualnog izgleda kao na slici, koristeći rezoluciju 480x320px.

REVIDIRANE, PRECIZNE VIZUALNE SMJERNICE za GUI Hotelskih Vrata (480x320px, Boja Papira)
Cilj: Postići IDENTIČAN vizualni izgled kao na dostavljenoj slici.

1. Osnovne Postavke Ekrana (Pozadina i Globalni Stilovi)
Rezolucija Ekrana: 480x320 piksela (Širina x Visina).

Boja Pozadine Ekrana: F2F2F7 (svijetlo siva, "boja papira").

LVGL ekvivalent: lv_color_hex(0xF2F2F7)

Pozadina je jednolična, bez ikakvih tekstura ili gradijenata.

Boje Teksta:

Primarni Tekst (vrlo taman): 333333 (vrlo tamno siva, skoro crna) - za broj sobe, naslove akcija.

LVGL ekvivalent: lv_color_hex(0x333333)

Sekundarni Tekst (srednje siva): 8E8E93 (tamno siva) - za datum, status, opise, jezik.

LVGL ekvivalent: lv_color_hex(0x8E8E93)

Akcentna Boja (jantarna): FF9F0A - za ikone, DND status, i linije oko kartica.

LVGL ekvivalent: lv_color_hex(0xFF9F0A)

Fontovi (KLJUČNO: Odaberite fontove bliske ovima):

Za Broj Sobe (60px Bold): Preporučuje se SF Pro Display Bold ili Montserrat Bold. Veličina 60 piksela.

Za Naslove Akcija (20px Semibold): Preporučuje se SF Pro Text Semibold ili Montserrat Semibold. Veličina 20 piksela.

Za Vrijeme/Datum/Statuse/Opise (16px Regular): Preporučuje se SF Pro Text Regular ili Montserrat Regular. Veličina 16 piksela.

Za Jezik (12px Regular): Preporučuje se SF Pro Text Regular ili Montserrat Regular. Veličina 12 piksela.

Agent mora osigurati da su ovi fontovi učitani i ispravno referencirani.

2. Gornja Info Traka (Status Bar)
Ovaj se dio nalazi na vrhu ekrana i prikazuje vrijeme, datum i statusne ikone.

Visina Gornje Trake: 40 piksela.

Unutarnji Razmak (Padding): 15px lijevo i desno, 5px gore i dolje.

Lijevo (Vrijeme i Datum Kontejner):

Pozicija: X: 0px, Y: 0px (unutar trake). Koristite Flexbox FLEX_FLOW_COLUMN za vertikalno slaganje.

Vrijeme:

Tekst: "15:46"

Font: 16px Regular.

Boja Teksta: Primarni Tekst (333333).

Datum:

Tekst: "Srijeda, 11-26"

Font: 14px Regular.

Boja Teksta: Sekundarni Tekkt (8E8E93).

Vertikalni razmak: 2px između vremena i datuma.

Desno (Statusne Ikone Kontejner):

Pozicija: Desni rub trake. Koristite Flexbox FLEX_FLOW_ROW za horizontalno slaganje.

Ikone:

Wi-Fi Ikona:

Tip: LVGL simbol LV_SYMBOL_WIFI ili mala PNG slika.

Veličina: 16x16 piksela (prikazna).

Boja: Primarni Tekst (333333).

DND Ikona (ako je aktivna):

Tip: LVGL simbol LV_SYMBOL_BELL_SLASH ili slična PNG slika.

Veličina: 16x16 piksela (prikazna).

Boja: Akcentna Boja (FF9F0A).

Razmak između ikona: 8 piksela.

Pozicija: Desni rub trake, centrirano vertikalno (Y: 20px unutar trake).

3. Središnji Dio (Broj Sobe i Status)
Ovaj se dio nalazi centralno na ekranu.

Kontejner za Broj Sobe i Status:

Pozicija: Centrirano horizontalno (X: 240px), vertikalno na Y: 105px (od gornjeg ruba ekrana).

Layout: Vertikalni Flexbox (FLEX_FLOW_COLUMN), FLEX_ALIGN_CENTER za sve.

Visina: 80 piksela.

Broj Sobe:

Tekst: "302"

Font: 60px Bold (SF Pro/Montserrat).

Boja Teksta: Primarni Tekst (333333).

Status Sobe:

Tekst: "Soba prazna"

Font: 16px Regular.

Boja Teksta: Sekundarni Tekst (8E8E93).

Vertikalni razmak: 5 piksela ispod broja sobe.

4. Donji Interaktivni Elementi (Tri Kartice za Autentifikaciju)
Ovo je ključni dio dizajna. Tri kartice su smještene na dnu ekrana.

Kontejner za sve kartice:

Pozicija: X: 0px, Y: 205px (gornji rub kontejnera).

Širina: 480 piksela (preko cijele širine ekrana).

Visina: 100 piksela.

Layout: Horizontalni Flexbox (FLEX_FLOW_ROW), FLEX_ALIGN_SPACE_EVENLY (ravnomjerno raspoređene s razmakom) i FLEX_ALIGN_CENTER (vertikalno centrirano unutar kontejnera).

Stilovi Kartice (svaka od tri kartice):

Dimenzije Kartice:

Širina: 140 piksela.

Visina: 85 piksela.

Boja Pozadine: FFFFFF (bijela).

Prozirnost Pozadine: LV_OPA_85 (vrlo blaga prozirnost, skoro neprimjetna, ali stvara dubinu).

Zaobljenost (Radius): 10 piksela.

Sjena:

Boja sjene: 000000 (crna).

Prozirnost sjene: LV_OPA_10 (vrlo blaga, diskretna).

Širina sjene (Blur): 10 piksela.

Pomak sjene: X: 0px, Y: 5px.

Border (KLJUČNO: Jantarna linija oko kartice):

Boja Border-a: Akcentna Boja (FF9F0A).

Širina Border-a: 1 piksel.

Prozirnost Border-a: LV_OPA_COVER (potpuno neprozirna).

Ova linija je prisutna na svim karticama, ne samo na jednoj.

Padding unutar kartice: 10 piksela sa svih strana.

Razmak između elemenata unutar kartice (ikona, naslov, opis): 5 piksela.

Layout unutar kartice: Vertikalni Flexbox (FLEX_FLOW_COLUMN), FLEX_ALIGN_CENTER za sve.

Elementi unutar svake Kartice:

Ikona (KLJUČNO: Točne ikone i stil):

Tip: LVGL simboli.

Veličina (font): 30 piksela.

Boja: Akcentna Boja (FF9F0A).

Sadržaj (LVGL simboli):

RFID Kartica: LV_SYMBOL_CREDIT_CARD (LVGL ima simbol za kreditnu karticu, koristi se stilizacija s valovima ako je moguće, ali LV_SYMBOL_CREDIT_CARD je najbliži).

PIN: LV_SYMBOL_LOCK (lokot).

QR Kod: LV_SYMBOL_QR (ili sličan kvadratni simbol).

Agent mora osigurati da su ovi LVGL simboli dostupni s odgovarajućim fontom (npr. Font Awesome ili LVGL standardni fontovi).

Naslov (Label):

Tekst: "Prinesite karticu", "Unesite PIN", "Skenirajte QR kod".

Font: 20px Semibold.

Boja Teksta: Primarni Tekst (333333).

Poravnanje: LV_TEXT_ALIGN_CENTER.

Opis (Label):

Tekst: "RFID čitač", "Za tipkovnicu", "Kamera ispod".

Font: 14px Regular.

Boja Teksta: Sekundarni Tekst (8E8E93).

Poravnanje: LV_TEXT_ALIGN_CENTER.

5. Jezik (Donji Desni Kut)
Kontejner:

Pozicija: X: 480 - 15 - širina_kontejnera, Y: 320 - 10 - visina_kontejnera (15px od desnog, 10px od donjeg ruba ekrana).

Layout: Horizontalni Flexbox (FLEX_FLOW_ROW), FLEX_ALIGN_CENTER za sve.

Širina/Visina: LV_SIZE_CONTENT.

Ikona (Globus):

Tip: LVGL simbol LV_SYMBOL_GLOBE (ili PNG).

Veličina: 12 piksela.

Boja: Sekundarni Tekst (8E8E93).

Tekst: "ENG"

Font: 12px Regular.

Boja Teksta: Sekundarni Tekst (8E8E93).

Razmak: 5 piksela između ikone i teksta.