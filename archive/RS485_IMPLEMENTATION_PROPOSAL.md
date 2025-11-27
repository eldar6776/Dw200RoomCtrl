# Prijedlog Implementacije RS485 Protokola za Hotel Room Control (Dw200)

## 1. Uvod i Cilj
Cilj ovog dokumenta je definisanje komunikacijskog protokola preko RS485 sabirnice između centralne jedinice (Dw200RoomCtrl) i perifernih uređaja u sobi (Smart Display, Card Holder, Aktuatori/Releji).
S obzirom na to da su periferni uređaji bazirani na ESP32 mikrokontrolerima, imamo fleksibilnost u odabiru protokola.

Analizom `dxmodules/dxUart.js` i `dxmodules/vgUartWorker.js`, utvrđeno je da Dw200 posjeduje ugrađenu, optimizovanu podršku za specifičan binarni protokol (u daljem tekstu "VG Protokol").

## 2. Analiza `dxUart` Modula
Modul `dxUart.js` nudi dva načina rada:
1.  **Raw/PassThrough:** Čitanje sirovih bajtova. Zahtijeva ručno parsiranje, detekciju početka/kraja paketa i upravljanje bufferima u glavnoj niti ili custom workeru.
2.  **VG Mode (`runvg`):** Koristi pozadinski `worker` proces koji automatski parsira pakete definisane specifičnim headerom (`0x55 0xAA`). Ovo je **preporučeni način** jer rasterećuje glavnu aplikaciju od procesiranja svakog bajta.

## 3. Kandidat A: Native VG Binarni Protokol (Preporučeno)

Ovaj protokol koristi native drajvere uređaja za maksimalnu pouzdanost i brzinu.

### 3.1 Struktura Paketa
Paket se sastoji od zaglavlja, komande, dužine, podataka i checksum-a.
Endianness: Little Endian za dužinu (Low byte first).

| Bajt Index | Opis | Vrijednost / Tip |
|:---:|:---|:---|
| 0 | Header 1 | `0x55` |
| 1 | Header 2 | `0xAA` |
| 2 | Command | `1 Byte` (Definisano od strane korisnika) |
| 3 | Length Low | `Low Byte` of Data Length |
| 4 | Length High | `High Byte` of Data Length |
| 5...N | Data | Payload (0 - 65535 bajtova) |
| N+1 | BCC | Block Check Character (XOR svih bajtova od indexa 0 do N) |

**Napomena:** Postoji opcija za "Result" bajt nakon komande, ali predlažemo da se ona isključi (`options.result = false`) radi jednostavnosti, osim ako nije striktno potrebno.

### 3.2 Implementacija na Masteru (Dw200 / JS)
Nije potrebno pisati parser. Koristi se ugrađeni `runvg`.

```javascript
import uart from './dxmodules/dxUart.js';
import bus from './dxmodules/dxEventBus.js';

const RS485_ID = 'room_bus';
const RS485_PATH = '/dev/ttyS2'; // Provjeriti tačan path za Dw200

// 1. Inicijalizacija
function initBus() {
    uart.runvg({
        type: uart.TYPE.UART,
        path: RS485_PATH,
        id: RS485_ID,
        result: 0,      // Ne koristimo 'result' bajt
        passThrough: false 
    });

    // 2. Slušanje odgovora
    bus.on(uart.VG.RECEIVE_MSG + RS485_ID, (msg) => {
        // msg format: { cmd: "01", length: 5, data: "AABB...", bcc: true }
        if (msg.bcc) {
            handleMessage(msg);
        } else {
            console.error("RS485 Checksum Error");
        }
    });
}

// 3. Slanje komande (npr. upali svjetlo)
function turnOnLight(relayId) {
    // sendVg automatski dodaje 55 AA, Length i BCC
    uart.sendVg({
        cmd: '10',          // CMD: 0x10 (npr. SET_OUTPUT)
        data: '0101'        // Relej 1, Stanje 1 (ON) - Hex string
    }, RS485_ID);
}
```

### 3.3 Implementacija na Slaveu (ESP32 / C++)
ESP32 mora implementirati mašinu stanja (State Machine) koja čeka `0x55`, pa `0xAA`, pa kupi ostale podatke.

**Pseudokod algoritma za ESP32:**
```cpp
// Primjer logike parsiranja
uint8_t state = 0;
// ... bufferi i varijable ...

void loop() {
    while (Serial2.available()) {
        uint8_t b = Serial2.read();
        switch (state) {
            case 0: if (b == 0x55) state = 1; break;
            case 1: if (b == 0xAA) state = 2; else state = 0; break;
            case 2: cmd = b; state = 3; break;
            case 3: len = b; state = 4; break; // Low byte
            case 4: len |= (b << 8); state = 5; dataIdx = 0; break; // High byte
            case 5: 
                if (dataIdx < len) { buffer[dataIdx++] = b; }
                if (dataIdx == len) state = 6; 
                break;
            case 6: // Check BCC
                if (calcBCC() == b) processPacket();
                state = 0;
                break;
        }
    }
}
```

---

## 4. Kandidat B: ASCII Pass-Through Protokol (Alternativa)

Ako se želi izbjeći binarno pakovanje i omogućiti lakši debug (čitanje paketa u terminalu), može se koristiti tekstualni protokol sa delimiterom (npr. `\n`).

### 4.1 Struktura Paketa
Format: `TargetID:Command:Payload\n`
Primjer: `DIMMER:SET:50\n`

### 4.2 Implementacija na Masteru (Dw200)
Koristi se `passThrough: true`.

```javascript
uart.runvg({
    type: uart.TYPE.UART,
    path: RS485_PATH,
    id: RS485_ID,
    passThrough: true // Važno!
});

bus.on(uart.VG.RECEIVE_MSG + RS485_ID, (rawDataArray) => {
    // rawDataArray je niz bajtova (Array od int-ova)
    // Moramo ih pretvoriti u string i sami tražiti '\n'
    const str = String.fromCharCode(...rawDataArray);
    console.log("Primljeno:", str);
    // Ovdje je potreban dodatni kod za bufferovanje ako poruka stigne iz dva dijela
});
```

### 4.3 Mane Kandidata B
- **Performanse:** `vgUartWorker` u pass-through modu koristi `sleep(10)` i čeka da se buffer isprazni da bi poslao event. To može dovesti do "cjepkanja" poruka ili kašnjenja.
- **Parsing:** Master mora raditi string manipulaciju u JavaScriptu što je sporije od native parsinga u Kandidatu A.

---

## 5. Zaključak i Preporuka

**Snažno se preporučuje implementacija Kandidata A (Native VG Protokol).**

Razlozi:
1.  **Stabilnost:** Checksum (BCC) je ugrađen u protokol, osiguravajući integritet podataka u bučnom RS485 okruženju.
2.  **Jednostavnost Mastera:** Dw200 već ima driver koji radi sav "težak posao" (framing, validacija). Naš JS kod samo prima gotove objekte događaja.
3.  **Efikasnost:** Binarni podaci su kompaktniji od ASCII teksta.

### Prijedlog Komandi (Draft)
Za potrebe hotela, predlažemo sljedeći set komandi (CMD bajt):

| CMD (Hex) | Značenje | Payload |
|---|---|---|
| `0x01` | PING / Heartbeat | Empty |
| `0x10` | SET_RELAY | `[RelayID, State]` |
| `0x11` | SET_DIMMER | `[DimmerID, Value]` |
| `0x20` | ROOM_STATUS | `[DND_State, MUR_State, ...]` |
| `0x30` | CARD_EVENT | `[CardID...]` (Samo Slave -> Master) |
| `0x40` | DISPLAY_MSG | `[StringBytes...]` |

Ovaj dokument služi kao osnova za razvoj firmware-a za ESP32 uređaje i integraciju u `Dw200RoomCtrl`.