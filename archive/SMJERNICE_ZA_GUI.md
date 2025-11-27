Precizne Vizualne Smjernice za GUI Hotelskih Vrata (480x320px, Boja Papira)
Cilj: Replicirati zadnji dizajn, ali na 480x320px i sa svijetlom pozadinom.

1. Osnovne Postavke Ekrana (Pozadina i Globalni Stilovi)
Rezolucija Ekrana: 480x320 piksela (Širina x Visina).

Boja Pozadine Ekrana: F2F2F7 (svijetlo siva, "boja papira").

LVGL ekvivalent: lv_color_hex(0xF2F2F7)

Boje Teksta:

Primarni Tekst: 000000 (crna) - za broj sobe, naslove akcija.

Sekundarni Tekst: 8E8E93 (tamno siva) - za datum, status, opise.

Akcentna Boja: FF9F0A (jantarna/narančasta) - za ikone i aktivne statuse.

Fontovi (Preporuke - prilagodite dostupnima):

Vrlo Veliki Bold: Veličina 48-60 (za broj sobe).

Srednji Semibold: Veličina 20-24 (za naslove akcija: "Prinesite karticu").

Mali Regular: Veličina 14-16 (za vrijeme, datum, opise, status sobe).

Vrlo Mali Regular: Veličina 12 (za jezik).

2. Gornja Info Traka (Status Bar)
Ovaj se dio nalazi na vrhu ekrana i prikazuje vrijeme, datum i statusne ikone.

Visina Gornje Trake: 40 piksela.

Unutarnji Razmak (Padding): 15px lijevo i desno, 5px gore i dolje.

Lijevo (Vrijeme i Datum):

Vrijeme:

Tekst: "15:46"

Font: Mali Regular (npr. 16px).

Boja Teksta: Primarni Tekst (000000).

Pozicija: X: 15px, Y: 5px (unutar trake).

Datum:

Tekst: "Srijeda, 11-26"

Font: Mali Regular (npr. 14px).

Boja Teksta: Sekundarni Tekst (8E8E93).

Pozicija: X: 15px, Y: 23px (ispod vremena, unutar trake).

Desno (Statusne Ikone):

Ikone: (Wi-Fi, DND - koristite simbole ili male slike).

Veličina ikone: Oko 16x16 piksela.

Razmak između ikona: 8-10 piksela.

Boja ikona: 000000 za standardne (Wi-Fi), FF9F0A za aktivne (DND).

Pozicija: Desni rub trake, centrirano vertikalno na visini Y: 20px.

Npr. prva ikona (Wi-Fi): X: 480 - 15 - (broj_ikona * velicina_ikone + razmak_izmedju). Ako imate 2 ikone, Wi-Fi bi bio npr. X: 480 - 15 - 16 - 10 - 16 = 423px.

3. Središnji Dio (Broj Sobe i Status)
Ovaj se dio nalazi centralno na ekranu.

Broj Sobe:

Tekst: "302"

Font: Vrlo Veliki Bold (npr. 48-60px).

Boja Teksta: Primarni Tekst (000000).

Pozicija: Centrirano horizontalno (X: 240px). Vertikalno centrirano unutar preostalog prostora između gornje trake i interaktivnih kartica (oko Y: 120-130px). Preciznije, računajte ga kao 40px (top_bar_height) + (ukupni_prostor_izmedju_traka - visina_broja_sobe - visina_statusa_sobe) / 2.

Status Sobe:

Tekst: "Soba prazna" (ili "Gost je unutra").

Font: Mali Regular (npr. 16px).

Boja Teksta: Sekundarni Tekst (8E8E93).

Pozicija: Centrirano horizontalno (X: 240px). 5-10 piksela ispod broja sobe.

4. Donji Interaktivni Elementi (Tri Kartice za Autentifikaciju)
Ovo je ključni dio dizajna. Tri kartice su smještene na dnu ekrana.

Ukupna Visina Kontejnera za Kartice: Oko 120 piksela.

Razmak od dna ekrana: 15 piksela.

Horizontalni Raspored: Tri kartice su ravnomjerno raspoređene horizontalno unutar 480px širine, s razmakom između njih i od rubova.

Stilovi Kartice (svaka od tri kartice):

Dimenzije Kartice:

Širina: 130 piksela.

Visina: 90 piksela.

Boja Pozadine: FFFFFF (bijela).

Prozirnost Pozadine: 200 (od 255) ili LV_OPA_78 (ako LVGL koristi LV_OPA_ enum). Ovo je ključ za "Frosted Glass" efekt.

Zaobljenost (Radius): 15 piksela.

Sjena:

Boja sjene: 000000 (crna).

Prozirnost sjene: LV_OPA_15 (blaga, diskretna).

Širina sjene (Blur): 15 piksela.

Pomak sjene: X: 0px, Y: 8px.

Padding unutar kartice: 15px sa svih strana.

Razmak između elemenata unutar kartice (ikona, naslov, opis): 5 piksela.

Pozicioniranje Kartica:

Vertikalna pozicija (sve tri): Gornji rub kartica je na Y: 320 - 15 - 90 = 215px.

Horizontalno pozicioniranje (Primjer rasporeda):

Kartica 1 (RFID): X: 25px (od lijevog ruba).

Kartica 2 (PIN): X: 175px (centrirana).

Kartica 3 (QR Kod): X: 325px (od desnog ruba).

(Ovo osigurava razmak od 20px od ruba i 20px između kartica).

Elementi unutar svake Kartice (vertikalno centrirani unutar kartice):

Ikona (Image ili LVGL Simbol):

Dimenzije: 30x30 piksela (prikazna veličina).

Boja: Akcentna Boja (FF9F0A).

Pozicija: Centrirano unutar kartice, Y: gornji_rub_kartice + 15px.

Sadržaj: "💳" (RFID), "🔒" (PIN), "📷" (QR kod).

Naslov (Label):

Tekst: "Prinesite karticu", "Unesite PIN", "Skenirajte QR kod".

Font: Srednji Semibold (npr. 20px).

Boja Teksta: Primarni Tekst (000000).

Pozicija: Centrirano unutar kartice, Y: ikona_y + visina_ikone + 5px.

Opis (Label):

Tekst: "RFID čitač", "Za tipkovnicu", "Kamera ispod".

Font: Mali Regular (npr. 14px).

Boja Teksta: Sekundarni Tekst (8E8E93).

Pozicija: Centrirano unutar kartice, Y: naslov_y + visina_naslova + 5px.

5. Jezik (Donji Desni Kut)
Tekst/Ikona: "🌐 ENG" (ili "HR" / ikona zastave).

Font: Vrlo Mali Regular (npr. 12px).

Boja Teksta: Sekundarni Tekst (8E8E93).

Pozicija: X: 480 - 15 - širina_teksta, Y: 320 - 10 - visina_teksta (15px od desnog, 10px od donjeg ruba).