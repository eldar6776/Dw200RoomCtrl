# Prijedlog za implementaciju RS485 komunikacije

## Uvod

Ovaj dokument opisuje prijedlog za dodavanje podrške za RS485 komunikaciju u projekat. Prijedlog se temelji na analizi postojećih `dxmodules` i demo projekata unutar `DejaOS` okruženja. Fokus je na slanju i primanju jednostavnog paketa od 15 bajtova.

## Korištenje `dxUart` modula

Za RS485 komunikaciju koristit će se postojeći `dxUart` modul. Ovaj modul pruža sve potrebne funkcije za otvaranje serijskog porta, slanje i primanje podataka.

## Inicijalizacija

RS485 komunikacija će se inicijalizirati pozivom funkcije `uart.runvg`. Ova funkcija pokreće pozadinski proces (worker) koji automatski obrađuje dolazne podatke prema "微光" (VG) protokolu.

**Primjer inicijalizacije:**

```javascript
import uart from './dxmodules/dxUart.js';
import bus from './dxmodules/dxEventBus.js';

// ID za našu RS485 instancu
const RS485_ID = 'rs485_1';

// Inicijalizacija RS485 komunikacije
uart.runvg({
    type: uart.TYPE.UART,
    path: '/dev/ttyS2', // Standardna putanja za RS485 na DW200 uređajima
    id: RS485_ID
});
```

## Slanje podataka

Za slanje podataka koristit će se funkcija `uart.sendVg`. Potrebno je formirati paket kao JavaScript objekat sa `cmd`, `length` i `data` poljima. Za slanje 15-bajtnog paketa, `length` će biti 15, a `data` će biti heksadecimalni string koji predstavlja tih 15 bajtova.

**Primjer slanja 15-bajtnog paketa:**

```javascript
/**
 * Šalje 15-bajtni paket preko RS485.
 * @param {string} command - Komanda (1 bajt, npr. '01').
 * @param {string} hexData - Podaci u heksadecimalnom formatu (14 bajtova).
 */
function sendRs485Packet(command, hexData) {
    if (hexData.length !== 28) { // 14 bajtova = 28 heksadecimalnih karaktera
        console.log("Greška: Podaci moraju imati 14 bajtova.");
        return;
    }

    const packet = {
        cmd: command,
        length: 15, // 1 bajt komanda + 14 bajtova podataka
        data: hexData
    };

    uart.sendVg(packet, RS485_ID);
}

// Primjer poziva funkcije
// Šaljemo komandu '01' i 14 bajtova podataka (0x00, 0x01, ..., 0x0D)
sendRs485Packet('01', '000102030405060708090A0B0C0D');
```

## Primanje podataka

Dolazni podaci se primaju pretplatom na događaj `uart.VG.RECEIVE_MSG`. Događaj će biti emitovan svaki put kada se primi ispravan paket.

**Primjer primanja podataka:**

```javascript
// Pretplata na događaj za primanje podataka
bus.on(uart.VG.RECEIVE_MSG + RS485_ID, (data) => {
    console.log("Primljen RS485 paket:", JSON.stringify(data));

    // Ovdje se dodaje logika za obradu primljenog paketa.
    // Na primjer, provjera da li je `data.bcc` true,
    // i obrada `data.cmd` i `data.data`.
    if (data.bcc) {
        // Paket je ispravan
        console.log("Komanda:", data.cmd);
        console.log("Podaci:", data.data);
    } else {
        console.log("Greška u checksum-u paketa.");
    }
});
```

## Kompletan primjer koda

Ovaj primjer objedinjuje sve prethodne korake i može se integrirati u `main.js` ili drugi odgovarajući fajl unutar `src` foldera.

```javascript
// Potrebno je importovati module na početku fajla
import uart from './dxmodules/dxUart.js';
import bus from './dxmodules/dxEventBus.js';
import std from './dxmodules/dxStd.js';


// ===== Početak prijedloga za RS485 komunikaciju =====

const RS485_ID = 'rs485_1';

/**
 * Inicijalizira RS485 komunikaciju.
 */
function initializeRs485() {
    console.log("Inicijalizacija RS485...");
    uart.runvg({
        type: uart.TYPE.UART,
        path: '/dev/ttyS2',
        id: RS485_ID
    });

    bus.on(uart.VG.RECEIVE_MSG + RS485_ID, (data) => {
        console.log("Primljen RS485 paket:", JSON.stringify(data));
        if (data.bcc) {
            console.log("Primljena komanda:", data.cmd);
            console.log("Primljeni podaci:", data.data);
            // TODO: Dodati logiku za obradu primljenih podataka
        } else {
            console.log("Greška u checksum-u primljenog paketa.");
        }
    });
}

/**
 * Šalje 15-bajtni paket preko RS485.
 * @param {string} command - Komanda (1 bajt, npr. '01').
 * @param {string} hexData - Podaci u heksadecimalnom formatu (14 bajtova).
 */
function sendRs485Packet(command, hexData) {
    if (hexData.length !== 28) {
        console.log("Greška: Podaci za slanje moraju imati 14 bajtova.");
        return;
    }

    const packet = {
        cmd: command,
        length: 15,
        data: hexData
    };
    
    console.log("Slanje RS485 paketa:", JSON.stringify(packet));
    uart.sendVg(packet, RS485_ID);
}


// Poziv inicijalizacije na početku aplikacije
// Ovo se može staviti na početak main.js
initializeRs485();

// Primjer periodičnog slanja paketa (npr. svake 3 sekunde)
std.setInterval(() => {
    // Šaljemo komandu 'AA' i 14 bajtova podataka
    sendRs485Packet('AA', '000102030405060708090A0B0C0D');
}, 3000);


// ===== Kraj prijedloga za RS485 komunikaciju =====
```

## Zaključak

Predloženi pristup omogućava jednostavnu integraciju RS485 komunikacije korištenjem postojećih modula. Korištenjem `uart.runvg` funkcije i sistema događaja, obrada dolaznih i odlaznih podataka je značajno pojednostavljena.
