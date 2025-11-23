# DW200 Hotel Access Control - Brzi Start

## ⚠️ VAŽNO - Ispravak

**Prethodna verzija dokumentacije je sadržavala grešku!**

DejaOS **NEMA** `dxHttpServer` modul. Web server je sada **odvojeni Node.js server**.

---

## Što je ovaj projekt?

Ovo je **demo aplikacija za kontrolu pristupa hotelskim sobama** koja radi na DW200 uređaju. 

Projekt omogućuje:
- ✅ Skeniranje **QR kodova** za otvaranje vrata
- ✅ Korištenje **RFID kartica** (NFC)
- ✅ Unos **4-cifrenog PIN koda**
- 🌐 **Web sučelje** za upravljanje pristupnim pravima (Node.js)

---

## Kako pokrenuti?

### 1. Pokreni DejaOS aplikaciju

Na DW200 uređaju, aplikacija automatski:
- Inicijalizira SQLite bazu
- Dodaje 15 test podataka (QR/RFID/PIN)
- Sluša fizičke uređaje (scanner, RFID reader, touchscreen)

### 2. Pokreni Node.js Test Server (opciono)

**Što je potrebno**:
- Node.js (verzija 14+)
- npm

**Instalacija**:
```bash
cd dw200_combined_access
npm install
```

**Pokretanje**:
```bash
npm start
```

Server startuje na **portu 8080**.

### 3. Otvori web sučelje

U browseru idi na:
```
http://localhost:8080
```

---

## Kako testirati pristup?

### Opcija A: Fizički Uređaji (Preporučeno)

#### 📱 QR Scanner
1. Ispiši QR kod s jednim od test podataka
2. Skeniraj QR kod fizičkim scannerom na uređaju
3. Vrata se otvaraju ako je kod valjan! ✅

Test kodovi:
- `HOTEL-ROOM-101-GUEST-12345`
- `HOTEL123456`
- `TESTQR001`

#### 💳 RFID Čitač
1. Programiraj RFID karticu s test brojem
2. Približi karticu čitaču
3. Pristup odobren ako je kartica u bazi! ✅

Test kartice:
- `AABBCCDD`
- `12345678`
- `CARD0001`

#### 🔢 PIN Touchscreen
1. Dodirni ekran uređaja
2. Unesi 4-cifreni PIN
3. Uspjeh ako je PIN valjan! ✅

Test PIN-ovi:
- `1234`
- `5678`
- `0000`

### Opcija B: Web Sučelje (Upravljanje Bazom)

Web sučelje omogućuje **dodavanje novih pristupnih prava** u bazu:
- Dodaj novi QR kod
- Dodaj novu RFID karticu
- Dodaj novi PIN

**Napomena**: Web sučelje **NE simulira** fizičke uređaje, već samo upravlja bazom podataka.

---

## Što se događa na uređaju?

### ✅ Pri uspješnoj autentifikaciji:
1. **Display** prikazuje zeleni popup **"成功!"** (OK) - 5 sekundi
2. **Zvučnik** pušta 2 kratka zvuka 🔊
3. **GPIO pin 105** aktivira bravu vrata (2 sekunde)
4. **Brava** se automatski zaključava nakon otključavanja

### ❌ Pri neuspješnoj autentifikaciji:
1. **Display** prikazuje crveni popup **"失败!"** (INVALID) - 5 sekundi
2. **Zvučnik** pušta jedan duži zvuk za grešku 🔊
3. **Brava** ostaje zaključana

---

## Dodavanje novih pristupnih prava

Web sučelje ima sekciju **"Upravljanje Pristupnim Pravima"**.

Možeš dodati:
- Nove QR kodove
- Nove RFID kartice
- Nove PIN-ove

**Novo dodana prava vrijede 1 godinu.**

---

## Testni podaci (već u bazi)

Pri prvom pokretanju, aplikacija automatski dodaje testne podatke:

| Tip | Primjeri |
|-----|----------|
| **QR Kodovi** | HOTEL-ROOM-101-GUEST-12345, HOTEL123456, TESTQR001 |
| **RFID Kartice** | AABBCCDD, 11223344, 12345678 |
| **PIN Kodovi** | 1234, 5678, 0000, 9999 |

---

## API Pozivi (za Node.js server)

Node.js test server omogućuje dodavanje pristupnih prava preko REST API-ja:

### Dodaj QR kod
```bash
curl -X POST http://localhost:8080/api/db/add-qr \
  -H "Content-Type: application/json" \
  -d '{"code":"NEWHOTEL999"}'
```

### Dodaj RFID karticu
```bash
curl -X POST http://localhost:8080/api/db/add-card \
  -H "Content-Type: application/json" \
  -d '{"code":"EEAABBCC"}'
```

### Dodaj PIN
```bash
curl -X POST http://localhost:8080/api/db/add-pin \
  -H "Content-Type: application/json" \
  -d '{"code":"4321"}'
```

---

## Konfiguracija

Sve postavke se nalaze u `src/config.json`:

```json
{
  "doorInfo.openTime": 2000,      // Vrijeme otključavanja (ms)
  "doorInfo.openTimeout": 10,      // Timeout za alarm vrata (s)
  "sysInfo.volume": 60,            // Glasnoća (0-60)
  "sysInfo.language": "CN"         // Jezik: CN ili EN
}
```

---

## Struktura Projekta

```
dw200_combined_access/
├── src/
│   ├── main.js                   # Glavna aplikacija
│   ├── service/
│   │   ├── accessService.js      # Logika autentifikacije
│   │   ├── testDataService.js    # Test podaci
│   │   └── ...
│   └── config.json               # Konfiguracija
├── test_server.js                # Web test server
└── README_DEMO.md                # Dokumentacija
```

---

## Problema?

### Web sučelje ne radi
- Provjeri jel aplikacija pokrenuta
- Provjeri jel port 8080 slobodan

### Pristup uvijek faila
- Provjeri format koda (točan string/broj)
- Provjeri jel u bazi (pogledaj logove)

### GPIO ne otvara bravu
- Provjeri hardver
- Provjeri GPIO pin u config.json (pin 105)

---

## Logovi

Aplikacija sprema logove u:
```
/app/data/log/app.log
```

Za real-time praćenje:
```bash
tail -f /app/data/log/app.log
```

---

## Za Produkciju

Za pravu hotelsku upotrebu:
1. Povežki se na **MQTT broker** za centralizirano upravljanje
2. Integriraj s **recepcijskim sustavom**
3. Dodaj **vremenski ograničen pristup** (check-in/check-out)
4. Implementiraj **alarmni sustav** za neovlašteno otvaranje

Vidi `plan_razvoja_recepcije.md` za detalje.

---

**Sretan test! 🎉**

Verzija: **v2.0.2.3**
