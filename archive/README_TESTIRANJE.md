# 🧪 Testiranje DW200 Hotel Access Control Projekta

## 📋 Pregled

Ovaj dokument objašnjava kako testirati različite metode autentifikacije u DW200 hotelskom sustavu kontrole pristupa.

---

## ✅ Status Testiranja

| Funkcionalnost | Status | Napomena |
|----------------|--------|----------|
| **Web Test Server** | ✅ Radi | Port 8080 |
| **Baza podataka** | ✅ Radi | SQLite sa auto-inicijalizacijom |
| **PIN kodovi** | ✅ Radi | Touch screen unos |
| **RFID kartice** | ⚠️ Hardver | Potreban NFC reader (`/dev/ttymxc2`) |
| **QR kodovi** | ⚠️ Hardver | Potreban QR scanner (`/dev/video11`) |

---

## 🖥️ 1. Testiranje preko Web Interfacea

### Pokretanje Test Servera

```bash
npm start
```

Server se pokreće na: `http://localhost:8080`

### Dostupne Funkcije

#### ✅ Upravljanje Pristupnim Pravima

Web interface omogućava **dodavanje novih kredencijala** u bazu podataka:

- **Dodaj QR Kod**: Unesite QR string i dodajte ga u bazu
- **Dodaj RFID Karticu**: Unesite ID kartice i dodajte je
- **Dodaj PIN**: Unesite 4-cifreni PIN kod

#### 📋 Test Podaci

Server automatski inicijalizira test podatke prilikom pokretanja:

**QR Kodovi (Type 100)**:
```
HOTEL-ROOM-101-GUEST-12345
HOTEL-ROOM-102-GUEST-67890
HOTEL123456
TESTQR001
STAFF-KEY-ADMIN
```

**RFID Kartice (Type 200)**:
```
AABBCCDD
11223344
12345678
ABCD1234
CARD0001
```

**PIN Kodovi (Type 300)**:
```
1234
5678
0000
9999
1111
```

---

## 🔢 2. Testiranje PIN Kodova

### ✅ Touch Screen (Fizički Uređaj)

Na DW200 uređaju:

1. Pritisnite dugme **"密码"** (Password/Lozinka) na glavnom ekranu
2. Unesite 4-cifreni PIN kod pomoću touch screen tastature
3. Pritisnite **"确认"** (Confirm/Potvrdi)
4. Sistem provjerava PIN u bazi podataka
5. Prikazuje se **"成功!"** (Uspješno!) ili **"失败!"** (Neuspješno!)

### Test PIN Kodovi

Koristi preddefinirane PIN-ove iz liste iznad (npr. `1234`, `5678`).

**Napomena**: Novi PIN-ovi se mogu dodati samo preko:
- Web interfacea (`http://localhost:8080`)
- Direktno u SQLite bazu (`app/data/db/app.db`)

---

## 📱 3. Testiranje QR Kodova

### ⚠️ Problem: Hardverski QR Scanner Potreban

QR kod scanner radi **samo na Linux platformi** sa priključenim hardverom:

- **Hardver**: USB kamera ili dedicirani QR scanner
- **Device**: `/dev/video11` (Video4Linux device)
- **Modul**: `dxCode` (DejaOS QR code scanner modul)

#### Konfiguracija QR Scannera

U `src/driver.js`:

```javascript
driver.code = {
    options1: { id: 'capturer1', path: '/dev/video11' },
    options2: { id: 'decoder1', name: "decoder v4", width: 800, height: 600 },
    // ...
}
```

### ❌ Zašto NE radi na Windows/Mac:

1. **Nema `/dev/video11`** - To je Linux device file
2. **dxCode modul** zahtijeva Video4Linux driver
3. **Windows ne podržava** native V4L2 interfejs

### ✅ Kako testirati QR kodove:

#### Opcija A: Koristiti fizički DW200 uređaj (Linux)

1. Prikači QR scanner na USB port
2. Verifikuj da postoji `/dev/video11`:
   ```bash
   ls -l /dev/video*
   ```
3. Omogući QR scanning u konfiguraciji:
   ```json
   "sysInfo.codeSwitch": true
   ```
4. Pokaži QR kod ispred scannera
5. Sistem automatski čita i validira kod

#### Opcija B: Simulacija preko Web API-ja (PLANIRANO)

**NAPOMENA**: Ova funkcionalnost trenutno **NIJE implementirana** u test serveru.

Za dodavanje QR simulacije, dodajte endpoint u `test_server_nodejs.js`:

```javascript
case '/api/qr':
    // Simuliraj QR kod scan
    bus.fire('code', { type: 100, code: data.code });
    sendJSON(res, { success: true, message: 'QR kod simuliran' });
    break;
```

**Problem**: Server ne dijeli event bus sa DejaOS aplikacijom jer rade u različitim procesima.

---

## 💳 4. Testiranje RFID Kartica

### ⚠️ Problem: Hardverski NFC Reader Potreban

RFID/NFC kartice rade **samo na Linux platformi** sa priključenim hardverom:

- **Hardver**: RFID/NFC reader modul
- **Device**: `/dev/ttymxc2` (Serial port za NFC reader)
- **Modul**: `dxNfc` (DejaOS NFC modul)

#### Konfiguracija NFC Readera

U `src/driver.js`:

```javascript
driver.nfc = {
    options: { id: 'nfc1', m1: true, psam: false },
    // ...
}
```

### ✅ Kako testirati RFID kartice:

#### Opcija A: Fizički uređaj

1. Prikači NFC reader na serial port
2. Omogući NFC u konfiguraciji:
   ```json
   "sysInfo.nfc": true
   ```
3. Približi RFID karticu readeru
4. Sistem automatski čita ID kartice i validira je

#### Opcija B: Dodaj kartice u bazu preko Web interfacea

1. Otvori `http://localhost:8080`
2. U sekciji "Upravljanje Pristupnim Pravima"
3. Unesi ID kartice (npr. `AABBCCDD`)
4. Klikni "Dodaj Karticu u bazu"
5. Kartica je sada u bazi i može se koristiti fizičkim readerom

---

## 🗄️ 5. Pregled Baze Podataka

### Lokacija Baze

```
C:\ProjektiOtvoreni\dw200_hotel_access\app\data\db\app.db
```

### Pregled sa SQLite Browserom

1. Instaliraj [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Otvori `app.db` fajl
3. Pregledaj tablicu `permissions`:

| Kolona | Tip | Opis |
|--------|-----|------|
| `id` | INTEGER | Primarni ključ |
| `type` | INTEGER | 100=QR, 200=RFID, 300=PIN |
| `code` | TEXT | Kredencijal (QR string, card ID, PIN) |
| `startTime` | INTEGER | Unix timestamp početka valjanosti |
| `endTime` | INTEGER | Unix timestamp kraja valjanosti |
| `passTimes` | INTEGER | Broj korištenja (default 0) |
| `extra` | TEXT | JSON sa dodatnim podacima |

### SQL Query za Pregled

```sql
-- Svi QR kodovi
SELECT * FROM permissions WHERE type = 100;

-- Sve RFID kartice
SELECT * FROM permissions WHERE type = 200;

-- Svi PIN kodovi
SELECT * FROM permissions WHERE type = 300;

-- Provera validnosti
SELECT *, 
       datetime(startTime, 'unixepoch') as start_date,
       datetime(endTime, 'unixepoch') as end_date
FROM permissions;
```

---

## 🔧 6. Troubleshooting

### Problem: "Database connection error: SQLITE_CANTOPEN"

**Uzrok**: Direktorij `app/data/db/` ne postoji.

**Rješenje**: 
```bash
mkdir -p app/data/db
```

ili pokreni `npm start` - server će automatski kreirati direktorij.

### Problem: PIN ne radi

**Mogući uzroci**:

1. **PIN nije u bazi**: Dodaj ga preko web interfacea
2. **Pogrešan format**: Mora biti **tačno 4 cifre**
3. **Istekla valjanost**: Provjeri `startTime` i `endTime`
4. **Touch screen ne radi**: Fizički problem sa hardverom

**Provjera**:

```sql
-- Provjeri da li PIN postoji
SELECT * FROM permissions WHERE type = 300 AND code = '1234';

-- Provjeri valjanost
SELECT code, 
       datetime(startTime, 'unixepoch') as valid_from,
       datetime(endTime, 'unixepoch') as valid_until
FROM permissions WHERE type = 300;
```

### Problem: QR kod ili RFID ne radi

**Uzrok**: 
- Radi se na Windows/Mac sistemu
- Nema fizičkog hardvera (scanner/reader)
- Device `/dev/video11` ili `/dev/ttymxc2` ne postoji

**Rješenje**:

1. **Za pravi test**: Koristi DW200 fizički uređaj sa Linux OS-om
2. **Za development**: Dodaj kredencijale preko web interfacea i testiraj sa PIN-om
3. **Za simulaciju**: Implementiraj bridge između test servera i DejaOS event bus-a (zahtijeva IPC)

### Problem: Web server ne radi

**Provjera**:

```bash
# Port 8080 zauzet?
netstat -ano | findstr :8080

# Node.js proces radi?
tasklist | findstr node
```

**Rješenje**:

- Zatvori drugi program koji koristi port 8080
- Restartuj server: `Ctrl+C` pa ponovo `npm start`
- Promijeni port u `test_server_nodejs.js`:
  ```javascript
  const PORT = 3000; // Umjesto 8080
  ```

---

## 📊 Test Checklist

Prije finalnog testiranja, provjeri:

- [ ] Server pokrenut (`npm start`)
- [ ] Baza podataka postoji i inicijalizirana
- [ ] Test kredencijali učitani (vidi console output)
- [ ] Web interface pristupačan (`http://localhost:8080`)
- [ ] PIN tastatura vidljiva na touch screenu
- [ ] Audio feedback radi (buzzer za success/fail)
- [ ] GPIO relay radi (ako je hardver priključen)

---

## 🎯 Zaključak

### ✅ Šta trenutno radi:

1. **Web test interface** - Potpuno funkcionalan
2. **SQLite baza** - Auto-inicijalizacija sa test podacima
3. **PIN autentifikacija** - Touch screen unos (fizički uređaj)
4. **Dodavanje kredencijala** - Preko web interfacea

### ⚠️ Šta zahtijeva hardver:

1. **QR kod scanning** - Linux + USB kamera/scanner
2. **RFID čitanje** - Linux + NFC reader modul

### 🔮 Preporuke za buduće testiranje:

1. **Mock moduli**: Kreiraj mock verzije `dxCode` i `dxNfc` za testiranje bez hardvera
2. **IPC bridge**: Omogući komunikaciju između Node.js test servera i DejaOS aplikacije
3. **Simulator**: Web-based simulator za QR i RFID koji direktno piše u bazu

---

**Autor**: DW200 Hotel Access Control Project  
**Datum**: 2025-11-22  
**Verzija dokumenta**: 1.0
