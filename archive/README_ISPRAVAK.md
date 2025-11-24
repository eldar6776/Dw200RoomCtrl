# Ispravak - dxHttpServer Ne Postoji

## Problem

Prilikom razvoja projekta je pogrešno pretpostavljeno da DejaOS platforma ima `dxHttpServer` modul. **Taj modul ne postoji** u dostupnim DejaOS modulima.

Dostupni moduli uključuju:
- `dxHttpClient` - HTTP klijent za slanje zahtjeva
- Ali **NEMA** HTTP servera

## Rješenje

Kreiran je **odvojeni Node.js server** koji radi izvan DejaOS aplikacije:

### Nova Datotečna Struktura

```
dw200_combined_access/
├── test_server.js                    # STARI - NE RADI (brisati)
├── test_server_nodejs.js             # NOVI - Node.js server
├── src/
│   ├── main.js                       # Ažurirano - više ne importa test_server
│   ├── service/
│   │   └── testDataService.js        # Test data inicijalizacija
│   └── ...
```

## Kako Koristiti

### 1. Pokreni DejaOS Aplikaciju

Aplikacija se pokreće normalno i inicijalizira test podatke u SQLite bazu.

```bash
# Na DW200 uređaju
/app/code/src/main.js
```

### 2. Pokreni Node.js Test Server (Odvojeno)

**Preduvjeti**:
- Node.js instaliran
- `sqlite3` npm paket

**Instalacija**:
```bash
cd dw200_combined_access
npm install sqlite3
```

**Pokretanje**:
```bash
node test_server_nodejs.js
```

Server će se pokrenuti na **portu 8080** i omogućiti:
- Web sučelje za dodavanje pristupnih prava u bazu
- Pregled test podataka
- REST API za upravljanje bazom

### 3. Otvori Web Browser

```
http://localhost:8080
```

## Što Radi Node.js Server

1. **Direktno piše u SQLite bazu** (`/app/data/db/app.db`)
2. **Dodaje pristupna prava** (QR, RFID, PIN)
3. **Prikazuje test podatke** koji su dostupni
4. **NE simulira** pristup direktno - koristi fizičke uređaje

## Testiranje Pristupa

### Metode Testiranja:

1. **Fizički QR Scanner**
   - Skeniraj QR kod s ekrana ili papira
   - DejaOS aplikacija procesuira kroz `dxCode` modul

2. **Fizički RFID Reader**
   - Približi RFID karticu čitaču
   - DejaOS aplikacija procesuira kroz `dxNfc` modul

3. **Touchscreen PIN Unos**
   - Dodirni ekran i unesi 4-cifreni PIN
   - DejaOS aplikacija procesuira kroz `passwordView`

## Test Podaci

Node.js server omogućuje dodavanje novih pristupnih prava.

**Automatski inicijalizirani test podaci** (u `testDataService.js`):

### QR Kodovi (Tip 100)
- HOTEL-ROOM-101-GUEST-12345
- HOTEL-ROOM-102-GUEST-67890
- HOTEL123456
- TESTQR001
- STAFF-KEY-ADMIN

### RFID Kartice (Tip 200)
- AABBCCDD
- 11223344
- 12345678
- ABCD1234
- CARD0001

### PIN Kodovi (Tip 300)
- 1234
- 5678
- 0000
- 9999
- 1111

Svi podaci vrijede **1 godinu** od inicijalizacije.

## API Endpointi (Node.js Server)

| Endpoint | Method | Opis | Body |
|----------|--------|------|------|
| `/` | GET | HTML web sučelje | - |
| `/api/db/add-qr` | POST | Dodaj QR u bazu | `{"code": "QR_STRING"}` |
| `/api/db/add-card` | POST | Dodaj karticu u bazu | `{"code": "CARD_ID"}` |
| `/api/db/add-pin` | POST | Dodaj PIN u bazu | `{"code": "1234"}` |

### Primjer cURL zahtjeva:

```bash
# Dodaj novi QR kod
curl -X POST http://localhost:8080/api/db/add-qr \
  -H "Content-Type: application/json" \
  -d '{"code":"NEWHOTEL999"}'

# Dodaj novu karticu
curl -X POST http://localhost:8080/api/db/add-card \
  -H "Content-Type: application/json" \
  -d '{"code":"EEAABBCC"}'

# Dodaj novi PIN
curl -X POST http://localhost:8080/api/db/add-pin \
  -H "Content-Type: application/json" \
  -d '{"code":"4321"}'
```

## Arhitektura Sustava

```
┌─────────────────────┐
│   Node.js Server    │
│   (port 8080)       │
│   - Web UI          │
│   - REST API        │
└──────────┬──────────┘
           │
           │ SQLite Write
           ▼
┌─────────────────────┐
│   SQLite Database   │
│   /app/data/db/     │
│   app.db            │
└──────────┬──────────┘
           │
           │ Read/Write
           ▼
┌─────────────────────┐
│  DejaOS Application │
│  - QR Scanner       │
│  - RFID Reader      │
│  - PIN Input        │
│  - Access Control   │
└─────────────────────┘
```

## Što Je Izmijenjeno

### 1. `src/main.js`
**Prije**:
```javascript
import testServer from '../test_server.js'
// ...
testServer.startTestServer()
```

**Nakon**:
```javascript
// Removed import and call
// NOTE: Web test server is now a separate Node.js application
// Run it with: node test_server_nodejs.js
```

### 2. Nove Datoteke
- ✅ `test_server_nodejs.js` - Node.js HTTP server
- ✅ `README_ISPRAVAK.md` - Ova dokumentacija

### 3. Za Brisanje
- ❌ `test_server.js` - Stari ne-funkcionalni server

## Prednosti Novog Pristupa

1. ✅ **Radi** - Koristi Node.js koji ima HTTP server
2. ✅ **Jednostavno** - Ne ovisi o DejaOS modulima
3. ✅ **Fleksibilno** - Može se pokrenuti na bilo kojem računalu
4. ✅ **Transparentno** - Direktno piše u SQLite bazu
5. ✅ **Testabilno** - Fizički uređaji testiraju pristup

## Zaključak

**Prethodni pristup nije bio moguć** jer DejaOS ne pruža HTTP server modul.

**Novi pristup koristi**:
- Node.js za web sučelje
- SQLite za dijeljenje podataka
- Fizičke uređaje (QR scanner, RFID reader, touchscreen) za testiranje

**Status**: ✅ Problem riješen - projekt radi kako je planirano

---

**Datum**: 2025-11-22  
**Verzija**: dw200_v10_access_v2.0.2.3 (Fixed)
