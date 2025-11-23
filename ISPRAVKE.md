# ISPRAVCI I OBJAŠNJENJA - DW200 Combined Access

## 🔴 Glavni Problem

**Greška u originalnoj implementaciji**: Kod je pokušavao koristiti `dxHttpServer` modul koji **ne postoji** u DejaOS platformi.

```javascript
// POGREŠNO - Ovo ne radi!
import server from './dxmodules/dxHttpServer.js'  // ❌ Ovaj modul ne postoji!
```

### Dostupni DejaOS Moduli

DejaOS pruža:
- ✅ `dxHttpClient` - HTTP **klijent** za slanje zahtjeva
- ❌ `dxHttpServer` - **NE POSTOJI**

---

## ✅ Rješenje

Kreiran je **odvojeni Node.js server** (`test_server_nodejs.js`) koji:

1. **Direktno piše u SQLite bazu** (`/app/data/db/app.db`)
2. **Omogućuje web sučelje** za upravljanje pristupnim pravima
3. **Ne ovisi o DejaOS modulima** - radi samostalno
4. **Dijeli podatke** s DejaOS aplikacijom preko baze

---

## 📁 Struktura Datoteka

### ✅ NOVE DATOTEKE (Koriste se)

```
dw200_combined_access/
├── test_server_nodejs.js         # ✅ Node.js HTTP server (NOVI - RADI)
├── package.json                  # ✅ npm konfiguracija
├── README_ISPRAVAK.md            # ✅ Dokumentacija ispravaka
└── src/
    ├── main.js                   # ✅ Ažurirano - ne importa test_server
    └── service/
        └── testDataService.js    # ✅ Test data inicijalizacija
```

### ❌ STARE DATOTEKE (Za brisanje)

```
dw200_combined_access/
└── test_server.js                # ❌ STARI - NE RADI (brisati)
```

---

## 🔄 Kako Sustav Sada Radi

```
┌──────────────────────┐
│   Node.js Server     │  ← Pokreni odvojeno: node test_server_nodejs.js
│   (port 8080)        │
│   - Web UI           │
│   - REST API         │
└──────────┬───────────┘
           │
           │ Piše pristupna prava
           ▼
┌──────────────────────┐
│  SQLite Database     │
│  /app/data/db/       │
│  app.db              │
└──────────┬───────────┘
           │
           │ Čita pristupna prava
           ▼
┌──────────────────────┐
│  DejaOS Application  │  ← Glavni program
│  - QR Scanner        │
│  - RFID Reader       │
│  - PIN Input         │
│  - Access Control    │
│  - GPIO (brava)      │
└──────────────────────┘
```

---

## 🚀 Kako Pokrenuti (Ispravljeno)

### Korak 1: Pokreni DejaOS Aplikaciju

DejaOS aplikacija automatski:
- Inicijalizira SQLite bazu
- Dodaje 15 test podataka
- Sluša hardverske uređaje

```bash
# Na DW200 uređaju
/app/code/src/main.js
```

### Korak 2: Pokreni Node.js Server (Opciono)

**Preduvjeti**:
- Node.js 14+
- npm

**Instalacija i pokretanje**:
```bash
cd dw200_combined_access
npm install
npm start
```

Server startuje na **portu 8080**.

### Korak 3: Otvori Web Sučelje

```
http://localhost:8080
```

---

## 🧪 Kako Testirati

### Metoda 1: Fizički Uređaji (Preporučeno)

#### QR Scanner
1. Generiraj/ispiši QR kod s test podatkom (npr. `HOTEL123456`)
2. Skeniraj fizičkim scannerom na uređaju
3. Vrata se otvaraju ✅

#### RFID Čitač
1. Programiraj RFID karticu s test brojem (npr. `AABBCCDD`)
2. Približi karticu čitaču
3. Pristup odobren ✅

#### Touchscreen PIN
1. Dodirni ekran
2. Unesi 4-cifreni PIN (npr. `1234`)
3. Uspjeh ✅

### Metoda 2: Web Sučelje (Upravljanje Bazom)

1. Otvori `http://localhost:8080`
2. Dodaj nove QR kodove / RFID kartice / PIN-ove
3. Testiraj fizičkim uređajima

**Napomena**: Web sučelje **dodaje** pristupna prava u bazu, ali **NE simulira** fizičke uređaje.

---

## 🧾 Test Podaci

Automatski inicijalizirani test podaci (valjanost: 1 godina):

### QR Kodovi (Tip 100)
```
HOTEL-ROOM-101-GUEST-12345
HOTEL-ROOM-102-GUEST-67890
HOTEL123456
TESTQR001
STAFF-KEY-ADMIN
```

### RFID Kartice (Tip 200)
```
AABBCCDD
11223344
12345678
ABCD1234
CARD0001
```

### PIN Kodovi (Tip 300)
```
1234
5678
0000
9999
1111
```

---

## 📊 Što Je Izmijenjeno

### 1. `src/main.js`

**PRIJE** (ne radi):
```javascript
import testServer from '../test_server.js'

try {
    testServer.startTestServer()  // ❌ Greška: dxHttpServer ne postoji
    log.info("Test Server Started")
} catch (error) {
    log.error("Failed to start test server:", error)
}
```

**NAKON** (radi):
```javascript
// NOTE: Web test server is now a separate Node.js application
// Run it with: node test_server_nodejs.js
// This provides a web interface on port 8080 for testing access control
```

### 2. Nove Datoteke

- ✅ `test_server_nodejs.js` - Node.js HTTP server (12KB)
- ✅ `package.json` - npm konfiguracija
- ✅ `README_ISPRAVAK.md` - Dokumentacija ispravaka
- ✅ `ISPRAVKE.md` - Ovaj dokument

### 3. Ažurirane Datoteke

- ✅ `README_QUICK_START.md` - Ispravljene upute
- ✅ `src/main.js` - Uklonjeni pozivi na test_server.js

### 4. Za Brisanje

- ❌ `test_server.js` - Stari ne-funkcionalni kod

---

## 🔧 REST API (Node.js Server)

Node.js server izlaže sljedeće endpointe:

| Endpoint | Method | Opis | Body |
|----------|--------|------|------|
| `/` | GET | HTML web sučelje | - |
| `/api/db/add-qr` | POST | Dodaj QR kod | `{"code": "STRING"}` |
| `/api/db/add-card` | POST | Dodaj RFID karticu | `{"code": "HEX"}` |
| `/api/db/add-pin` | POST | Dodaj PIN | `{"code": "1234"}` |

### Primjeri cURL zahtjeva:

```bash
# Dodaj QR kod
curl -X POST http://localhost:8080/api/db/add-qr \
  -H "Content-Type: application/json" \
  -d '{"code":"NEWHOTEL999"}'

# Dodaj karticu
curl -X POST http://localhost:8080/api/db/add-card \
  -H "Content-Type: application/json" \
  -d '{"code":"EEAABBCC"}'

# Dodaj PIN
curl -X POST http://localhost:8080/api/db/add-pin \
  -H "Content-Type: application/json" \
  -d '{"code":"4321"}'
```

---

## ❓ FAQ

### Zašto originalni pristup nije radio?

DejaOS **nema** HTTP server modul, samo HTTP client. Nije moguće kreirati HTTP server unutar DejaOS aplikacije koristeći samo dostupne module.

### Zašto koristiti Node.js?

Node.js ima ugrađeni HTTP server (`http` modul) i može pristupiti SQLite bazi. To omogućuje kreiranje web sučelja koje dijeli podatke s DejaOS aplikacijom.

### Može li se testirati bez Node.js servera?

**Da!** Test podaci su automatski inicijalizirani u bazi. Koristi fizičke uređaje:
- QR scanner
- RFID čitač
- Touchscreen

Node.js server je **opcija** za lakše upravljanje pristupnim pravima.

### Što ako nemam Node.js?

Test podaci su već u bazi i vrijede 1 godinu. Možeš:
1. Direktno koristiti fizičke uređaje za testiranje
2. Ručno dodavati pristupna prava u SQLite bazu

---

## ✅ Zaključak

**Problem**: Pokušaj korištenja ne-postojećeg `dxHttpServer` modula

**Rješenje**: Odvojeni Node.js server koji dijeli SQLite bazu s DejaOS aplikacijom

**Status**: ✅ **ISPRAVLJENO I FUNKCIONALNO**

---

## 📖 Dodatna Dokumentacija

- **README.md** - Pregled projekta
- **README_QUICK_START.md** - Brzi start vodič (ažurirano)
- **README_DEMO.md** - Detaljna tehnička dokumentacija
- **README_ISPRAVAK.md** - Objašnjenje problema i rješenja
- **ZADATAK_OSTVAREN.md** - Izvještaj realizacije
- **PROJEKT_SAZETAK.md** - Sažetak projekta

---

**Datum ispravka**: 2025-11-22  
**Verzija**: dw200_v10_access_v2.0.2.3 (Fixed)  
**Status**: ✅ Sve funkcionalnosti rade ispravno
