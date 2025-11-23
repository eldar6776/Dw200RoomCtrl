# DW200 Combined Access Control - Demo Project

## Pregled Projekta

Ovo je demo projekt za kontrolu pristupa hotelskim sobama koji koristi DW200 uređaj. Projekt omogućuje testiranje tri metode autentifikacije:
1. **QR Kod skeniranje**
2. **RFID kartica (NFC)**
3. **PIN kod (4 cifre)**

Projekt uključuje **web sučelje za testiranje** koje omogućuje simulaciju svih tipova pristupa bez potrebe za fizičkim hardverom.

---

## Značajke

### Metode Autentifikacije

- ✅ **QR Kod (Tip 100)**: Skeniranje QR kodova za pristup sobama
- ✅ **RFID Kartica (Tip 200)**: NFC kartice za goste i osoblje
- ✅ **PIN Kod (Tip 300)**: 4-cifreni PIN za brzi pristup

### Hardverska Integracija

- **Kontrola brave**: GPIO pin 105 aktivira bravu vrata
- **Vrijeme otključavanja**: Konfigurabilno (default: 2 sekunde)
- **Vizualni feedback**: 
  - Zeleni popup s "成功!" (Uspjeh/OK) na displeju
  - Crveni popup s "失败!" (Neuspjeh/INVALID) na displeju
- **Zvučni feedback**: 
  - Uspješna autentifikacija: 2 kratka zvuka
  - Neuspješna autentifikacija: 1 duži zvuk
  - Pritisak tipke: Kratak zvuk

### Test Web Sučelje

- 🌐 **HTTP Server na portu 8080**
- 📱 **Responzivno web sučelje** s jednostavnim unosom
- 🗄️ **Upravljanje bazom** - dodavanje/brisanje pristupnih prava
- 🔧 **Simulacija hardvera** bez fizičkih uređaja

---

## Instalacija i Pokretanje

### Preduvjeti

- DW200 v10 uređaj ili emulator
- DejaOS razvojno okruženje

### Pokretanje Aplikacije

1. **Konfiguracija**
   
   Uredi `src/config.json` ako je potrebno prilagoditi postavke:
   ```json
   {
     "doorInfo.openTime": 2000,      // Vrijeme otključavanja (ms)
     "doorInfo.openTimeout": 10,      // Timeout za alarm (s)
     "sysInfo.volume": 60,            // Glasnoća zvučnika (0-60)
     "sysInfo.language": "CN"         // Jezik: "CN" ili "EN"
   }
   ```

2. **Pokretanje aplikacije**
   
   Aplikacija se automatski pokreće s test serverom na portu 8080.

3. **Pristup Web Sučelju**
   
   Otvori browser i posjeti:
   ```
   http://localhost:8080
   ```
   
   ili s IP adresom uređaja:
   ```
   http://[IP_ADRESA_UREDAJA]:8080
   ```

---

## Test Podaci

Aplikacija automatski inicijalizira testne podatke pri prvom pokretanju:

### QR Kodovi (Tip 100)
- `HOTEL-ROOM-101-GUEST-12345`
- `HOTEL-ROOM-102-GUEST-67890`
- `HOTEL123456`
- `TESTQR001`
- `STAFF-KEY-ADMIN`

### RFID Kartice (Tip 200)
- `AABBCCDD`
- `11223344`
- `12345678`
- `ABCD1234`
- `CARD0001`

### PIN Kodovi (Tip 300)
- `1234`
- `5678`
- `0000`
- `9999`
- `1111`

**Svi testni podaci vrijede 1 godinu od prvog pokretanja.**

---

## Kako Koristiti Web Sučelje

### 1. Simulacija QR Koda

```
1. Unesi QR kod string (npr. "HOTEL-ROOM-101-GUEST-12345")
2. Klikni "Skeniraj QR Kod"
3. Sustav će provjeriti kod u bazi i otvoriti/odbiti pristup
```

### 2. Simulacija RFID Kartice

```
1. Unesi broj kartice (hex format, npr. "AABBCCDD")
2. Klikni "Skeniraj Karticu"
3. Sustav će provjeriti karticu i odgovoriti
```

### 3. Simulacija PIN Koda

```
1. Unesi 4 cifre u PIN polja
2. Klikni "Unesi PIN"
3. Sustav će verificirati PIN
```

### 4. Dodavanje Novih Pristupnih Prava

```
1. Idi na "Upravljanje Pristupnim Pravima"
2. Unesi novi QR kod / karticu / PIN
3. Klikni "Dodaj u bazu"
4. Novo pravo pristupa vrijedi 1 godinu
```

---

## API Endpointi

Web server izlaže sljedeće REST API endpointe:

| Endpoint | Method | Opis | Payload |
|----------|--------|------|---------|
| `/api/qr` | POST | Simulira QR kod skeniranje | `{"code": "QR_STRING"}` |
| `/api/card` | POST | Simulira RFID karticu | `{"code": "CARD_ID"}` |
| `/api/pin` | POST | Simulira PIN unos | `{"code": "1234"}` |
| `/api/db/add-qr` | POST | Dodaje QR kod u bazu | `{"code": "NEW_QR"}` |
| `/api/db/add-card` | POST | Dodaje karticu u bazu | `{"code": "NEW_CARD"}` |
| `/api/db/add-pin` | POST | Dodaje PIN u bazu | `{"code": "1234"}` |

### Primjer cURL zahtjeva

```bash
# Simulacija QR koda
curl -X POST http://localhost:8080/api/qr \
  -H "Content-Type: application/json" \
  -d '{"code":"HOTEL123456"}'

# Simulacija RFID kartice
curl -X POST http://localhost:8080/api/card \
  -H "Content-Type: application/json" \
  -d '{"code":"AABBCCDD"}'

# Simulacija PIN-a
curl -X POST http://localhost:8080/api/pin \
  -H "Content-Type: application/json" \
  -d '{"code":"1234"}'
```

---

## Arhitektura Sustava

### Komponente

```
dw200_combined_access/
├── src/
│   ├── main.js                 # Glavni ulazak aplikacije
│   ├── driver.js               # Hardverski driveri (GPIO, PWM, NFC, Scanner)
│   ├── controller.js           # Glavni kontroler s event loopom
│   ├── screen.js               # UI upravljanje
│   ├── services.js             # Event handler orchestration
│   ├── service/
│   │   ├── accessService.js    # Logika autentifikacije
│   │   ├── sqliteService.js    # Baza podataka
│   │   ├── mqttService.js      # MQTT komunikacija
│   │   ├── nfcService.js       # NFC handler
│   │   ├── codeService.js      # QR kod handler
│   │   └── testDataService.js  # Inicijalizacija test podataka
│   ├── view/
│   │   ├── mainView.js         # Glavni prikaz
│   │   ├── passwordView.js     # PIN unos prikaz
│   │   └── popWin.js           # Popup prozori
│   └── config.json             # Konfiguracija
├── test_server.js              # Web test server
└── README_DEMO.md              # Ova datoteka
```

### Tok Autentifikacije

```
1. Unos podataka (QR/RFID/PIN)
   ↓
2. Event Bus fire() poziv
   ↓
3. Service handler (nfcService/codeService)
   ↓
4. accessService.access() - provjera u SQLite bazi
   ↓
5. Ako OK:
   - driver.gpio.open() → Otključavanje brave
   - driver.audio.success() → Zvučni signal
   - driver.screen.accessSuccess() → Zeleni popup "成功!"
   
   Ako FAIL:
   - driver.audio.fail() → Zvučni signal greške
   - driver.screen.accessFail() → Crveni popup "失败!"
   ↓
6. Automatsko zaključavanje nakon N sekundi (config)
```

---

## Prilagodba i Razvoj

### Dodavanje Nove Metode Autentifikacije

1. **Definiraj novi tip** (npr. 500 za otisak prsta)
2. **Dodaj handler u services.js**:
   ```javascript
   case 'fingerprint':
       accessService.access({ type: 500, code: fingerprintId })
       break;
   ```
3. **Dodaj u SQLite bazu** s odgovarajućim tipom

### Izmjena Vremena Otključavanja

Uredi `src/config.json`:
```json
{
  "doorInfo.openTime": 5000  // 5 sekundi
}
```

### Integracija s MQTT Brokerom

Projekt već podržava MQTT za daljinsko upravljanje. Konfiguracija:
```json
{
  "mqttInfo.mqttAddr": "192.168.1.100:1883",
  "mqttInfo.mqttName": "admin",
  "mqttInfo.password": "password"
}
```

---

## Troubleshooting

### Web sučelje ne radi

1. Provjeri da li je aplikacija pokrenuta
2. Provjeri da port 8080 nije zauzet
3. Provjeri logove: `/app/data/log/`

### Autentifikacija uvijek failuje

1. Provjeri da li su test podaci učitani u bazu
2. Provjeri format koda (QR/PIN/RFID)
3. Provjeri vrijeme valjanosti (startTime/endTime)

### GPIO ne aktivira bravu

1. Provjeri GPIO pin konfiguraciju u `config.json`
2. Provjeri hardversku vezu
3. Provjeri da `doorInfo.openMode` nije postavljen na 2 (konstantno zaključano)

---

## Dodatne Informacije

### Dokumentacija Modula

- **dxmodules/**: DejaOS sistemski moduli
  - `dxHttpServer.js`: HTTP server modul
  - `dxGpio.js`: GPIO kontrola
  - `dxNfc.js`: NFC čitač
  - `dxCode.js`: QR kod skener
  - `dxPwm.js`: PWM za zvučnike
  - `dxMqtt.js`: MQTT klijent

### Logovi

Logovi se spremaju u:
```
/app/data/log/app.log
```

Za real-time praćenje logova, koristi postojeći weblogcat projekt ili:
```bash
tail -f /app/data/log/app.log
```

---

## Licenca

Ovaj projekt je dio DejaOS ekosustava i koristi DejaOS licence.

## Autor

Razvijeno za DW200 v10 uređaj kao demonstracijski projekt za kontrolu pristupa.

---

## Verzija

**v2.0.2.3** - Demo verzija s web test sučeljem

---

**Enjoy testing! 🚀**
