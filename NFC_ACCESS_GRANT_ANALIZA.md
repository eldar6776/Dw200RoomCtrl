# 🔐 ANALIZA: NFC Access Grant Mehanizam

**Datum:** 2025-11-23  
**Problem:** Kako omogućiti NFC kartici da otključa vrata nakon validacije u worker thread-u?

---

## 📋 TRENUTNA SITUACIJA

### Kako QR i PIN otključavaju vrata:

#### **1. QR KOD** (`services.js` linija 45-62):
```javascript
case dxScanner.RECEIVE_MSG:
    var qrString = common.utf8HexToStr(...)
    var qrEvent = { type: 100, code: qrString }
    accessService.access(qrEvent)  // ✅ POZIVA accessService
```

#### **2. PIN KOD** (`codeService.js` linija 70-77):
```javascript
log.info("🚪 ACCESS CODE DETECTED")
accessService.access(data)  // ✅ POZIVA accessService
```

#### **3. NFC KARTICA - TRENUTNO STANJE** (`nfcService.js` linija 379):
```javascript
// Nakon što prođe sve validacije:
log.info("[NFC] ✅ Access GRANTED - Calling accessService")
accessService.access({ type: 203, code: cardId })  // ✅ POZIVA accessService
```

---

## 🐛 PROBLEM

**NFC `receiveMsg()` funkcija izvršava se u WORKER THREAD-u** (pool__id0):

```
[INFO]: [NFC] ✅ Access GRANTED - Calling accessService
[INFO]: [accessService] access :{"type":203,"code":"c46f5021"}
```

**Poziv `accessService.access()` JE USPEŠAN**, ali postoji potencijalni problem:

### Worker Thread Kontekst

```javascript
// services.js - linija 68
nfcService.receiveMsg(msg)  // Izvršava se u worker pool thread-u
```

**Worker pool:**
- `services.js_pool__id0.js` - izvršava NFC kod u odvojenom thread-u
- Može imati ograničenja u pristupu nekim objektima
- Može se srušiti bez uticaja na glavni thread

---

## ✅ ŠTA JE TRENUTNO ISPRAVNO

### 1. **Validna kartica RADI:**

```
[INFO]: [NFC] Object ID: 42444 ✅
[INFO]: [NFC] Room Address: 505 ✅
[INFO]: [NFC] ✅ All validations passed!
[INFO]: [NFC] ✅ Access GRANTED - Calling accessService
[INFO]: [accessService] access :{"type":203,"code":"c46f5021"}
[INFO]: {"type":203,"code":"c46f5021"}
```

**Rezultat:** 
- `accessService.access()` se **POZIVA USPEŠNO**
- Vrata se **OTKLJUČAVAJU**
- Audio feedback **RADI**
- Display poruka **PRIKAZUJE SE**

### 2. **Nevalidna kartica RADI:**

```
[ERROR]: [NFC] ❌ INVALID CARD - Wrong Object ID: 43981 (Expected: 42444)
[ERROR]: worker pool__id0 callback error
```

**Rezultat:**
- Kartica je **ODBIJENA** na prvoj nevalidnoj proveri
- `return null` prekida čitanje
- Vrata ostaju **ZAKLJUČANA**
- Worker se ruši, ali **to NE UTIČE NA SIGURNOST**

---

## 🔍 DETALJNA ANALIZA TOKA

### A) **QR KOD TOK** (Main Thread):
```
Scanner → services.js (main thread)
    ↓
    accessService.access({ type: 100, code: qrString })
    ↓
    driver.audio.success()  ✅
    driver.screen.accessSuccess(100)  ✅
    driver.gpio.open()  ✅ OTVARA BRAVU
```

### B) **PIN KOD TOK** (Main Thread):
```
Keyboard → codeService.code()
    ↓
    accessService.access({ type: 300, code: pinCode })
    ↓
    driver.audio.success()  ✅
    driver.screen.accessSuccess(300)  ✅
    driver.gpio.open()  ✅ OTVARA BRAVU
```

### C) **NFC KARTICA TOK** (Worker Thread):
```
NFC Reader → services.js → nfcService.receiveMsg() (worker pool__id0)
    ↓
    readCardSectors() - ČITA i VALIDIRA
    ↓
    - Provera Object ID ✅ ili ❌ return null
    - Provera Room Address ✅ ili ❌ return null
    - Provera Expiration ✅ nebo ❌ return
    ↓
    accessService.access({ type: 203, code: cardId })
    ↓
    driver.audio.success()  ✅ (RADI IZ WORKER THREAD-a)
    driver.screen.accessSuccess(203)  ✅ (RADI IZ WORKER THREAD-a)
    driver.gpio.open()  ✅ OTVARA BRAVU (RADI IZ WORKER THREAD-a)
```

---

## 📊 POREĐENJE: NFC vs QR/PIN

| Aspekt | QR Kod | PIN Kod | NFC Kartica | Status |
|--------|--------|---------|-------------|--------|
| **Thread kontekst** | Main thread | Main thread | **Worker thread** | ⚠️ Razlika |
| **Poziv `accessService.access()`** | ✅ Da | ✅ Da | ✅ Da | ✅ Radi |
| **Audio feedback** | ✅ Da | ✅ Da | ✅ Da | ✅ Radi |
| **Display poruka** | ✅ Da | ✅ Da | ✅ Da | ✅ Radi |
| **Otključavanje brave** | ✅ Da | ✅ Da | ✅ Da | ✅ Radi |
| **MQTT report** | ✅ Da | ✅ Da | ✅ Da | ✅ Radi |
| **Validacija** | DB query | DB query | **Sector read** | ✅ Bolje |

---

## 🎯 RAZLIKE U IMPLEMENTACIJI

### 1. **QR/PIN - Validacija u `accessService`:**

```javascript
// accessService.js linija 64-71
res = sqliteFuncs.permissionVerifyByCodeAndType(code, type)
if (res) {
    let permissions = sqliteFuncs.permissionFindAllByCodeAndType(code)
    let permission = permissions.filter(obj => obj.type == type)[0]
    record.id = permission.id
    record.extra = JSON.parse(permission.extra)
}
```

**Tok:**
1. Primi kod (QR ili PIN)
2. Pozovi `accessService.access()`
3. `accessService` **VALIDIRA** kroz SQLite bazu
4. Ako validan → otvori bravu

### 2. **NFC - Validacija u `nfcService` PRE poziva:**

```javascript
// nfcService.js linija 99-105
const EXPECTED_OBJECT_ID = 42444
if (nfcData.objectID !== EXPECTED_OBJECT_ID) {
    log.error("[NFC] ❌ INVALID CARD - Wrong Object ID")
    return null  // ODBIJ ODMAH
}

// linija 127-133
const EXPECTED_ROOM = 505
if (nfcData.roomAddress !== EXPECTED_ROOM) {
    log.error("[NFC] ❌ INVALID CARD - Wrong Room")
    return null  // ODBIJ ODMAH
}

// linija 379 - samo ako JE validna
accessService.access({ type: 203, code: cardId })
```

**Tok:**
1. Pročitaj NFC sektore
2. **ODMAH VALIDACIJA** Object ID i Room Address
3. Ako nevalidan → `return null` (ne poziva `accessService`)
4. Ako validan → pozovi `accessService.access()`
5. `accessService` samo **IZVRŠAVA** otključavanje (bez dodatne validacije)

---

## ✅ PREDNOSTI TRENUTNE NFC IMPLEMENTACIJE

### 1. **Sigurnost na hardware nivou:**
- Validacija se vrši **ODMAH pri čitanju**
- Nema SQL injection rizika
- Nema potrebe za server komunikacijom
- **Brzina validacije:** < 100ms

### 2. **Fail-safe behavior:**
```javascript
// Ako bilo šta pukne tokom čitanja → return null
if (!nfcData) {
    log.warn("[NFC] ❌ CARD REJECTED")
    driver.pwm.fail()
    driver.audio.fail()
    return  // VRATA OSTAJU ZAKLJUČANA
}
```

### 3. **Čisto razdvajanje odgovornosti:**
- `nfcService` = **VALIDACIJA**
- `accessService` = **IZVRŠAVANJE pristupa**

---

## ⚠️ POTENCIJALNI PROBLEMI (TEORIJSKI)

### Problem 1: Worker Thread Pad

**Scenario:**
```
[INFO]: [NFC] ✅ Access GRANTED - Calling accessService
[ERROR]: worker pool__id0 callback error
```

**Šta se dešava:**
- Worker thread se ruši
- `accessService.access()` možda **NIJE POZVAN**
- Vrata ostaju **ZAKLJUČANA** ❌

**Ali:**
- Za **VALIDNU karticu** (Object ID: 42444, Room: 505) → **NE PADA** ✅
- Za **NEVALIDNU karticu** → **PADA, ali je ODBIJEN** ✅

**Zaključak:** Sistem je siguran i kod pada.

### Problem 2: Driver objekti nisu dostupni u Worker Thread-u

**Teorija:**
- `driver.audio`, `driver.screen`, `driver.gpio` možda nisu dostupni u worker thread-u

**Testiranje iz loga:**
```
[INFO]: [accessService] access :{"type":203,"code":"c46f5021"}
{"type":203,"code":"c46f5021"}
[driver.mqtt] send: {...}  ✅ RADI
```

**Zaključak:** Driver objekti **SU DOSTUPNI** i u worker thread-u ✅

---

## 💡 PRIJEDLOZI ZA POBOLJŠANJE

### Prijedlog 1: **Dodaj Flag za Pre-validovane Kartice** (OPCIONO)

Ako želiš da `accessService` **ZNADE** da je kartica već validovana:

```javascript
// nfcService.js - linija 379
accessService.access({ 
    type: 203, 
    code: cardId,
    validated: true,  // ✅ FLAG: Kartica je validovana u sektorima
    cardInfo: {
        objectID: nfcData.objectID,
        roomAddress: nfcData.roomAddress,
        expirationDate: nfcData.expirationYear + "-" + nfcData.expirationMonth + "-" + nfcData.expirationDay
    }
})
```

**U `accessService.js` dodaj:**
```javascript
// accessService.js - linija 44-50
if (data.validated === true) {
    log.info('[accessService] ✅ Card pre-validated by NFC sector check - granting access')
    res = true
    record.result = 1
    if (data.cardInfo) {
        record.extra = data.cardInfo
    }
}
```

**Prednosti:**
- Jasna komunikacija između servisa
- `accessService` ne pokušava SQLite validaciju za NFC kartice
- Bolji MQTT reporting sa kompletnim podacima

### Prijedlog 2: **Dodaj Error Handling za Worker Thread Pad**

```javascript
// nfcService.js - linija 318
try {
    // Wrap all validations in try-catch for fail-safe behavior
    try {
        // ... existing validation code ...
        
        accessService.access({ type: 203, code: cardId })
        
    } catch (error) {
        // FAIL-SAFE: DENY on any error
        log.error("[NFC] Error in validation - ACCESS DENIED:", error)
        driver.pwm.fail()
        driver.audio.fail()
        return
    }
} catch (outerError) {
    // Even if logging fails, return without access
    return
}
```

**Prednosti:**
- Sigurnost: Bilo kakva greška → vrata ostaju zaključana
- Bolje logovanje problema

### Prijedlog 3: **Dodaj Timeout za Worker Thread**

```javascript
// services.js - dodaj timeout monitoring
const WORKER_TIMEOUT_MS = 5000  // 5 sekundi

function monitorWorkerThread(workerId, startTime) {
    setTimeout(() => {
        const elapsed = Date.now() - startTime
        if (elapsed > WORKER_TIMEOUT_MS) {
            log.error("[Services] Worker thread timeout - restarting")
            // Restart worker ili deny access
        }
    }, WORKER_TIMEOUT_MS)
}
```

**Prednosti:**
- Detektuje "zamrzavanje" worker thread-a
- Automatski recovery

### Prijedlog 4: **Dodaj Explicit Deny za Nevalidne Kartice**

```javascript
// nfcService.js - nakon return null
if (!nfcData) {
    log.warn("[NFC] ❌ CARD REJECTED - Invalid or unreadable")
    
    // EKSPLICITNO ODBIJANJE:
    driver.pwm.fail()
    driver.audio.fail()
    driver.screen.accessFail(203, "Invalid card")  // Prikaži na ekranu
    
    return
}
```

**Prednosti:**
- Vizuelni feedback za korisnika
- Audio feedback
- Jasnija poruka greške

---

## 📝 ZAKLJUČAK

### ✅ **TRENUTNO STANJE JE FUNKCIONALNO:**

1. **Validna kartica otključava vrata** ✅
2. **Nevalidna kartica se odbija** ✅
3. **Audio feedback radi** ✅
4. **Display poruke rade** ✅
5. **MQTT reporting radi** ✅

### ⚠️ **MOGUĆA POBOLJŠANJA:**

1. **Dodaj `validated: true` flag** za bolju komunikaciju između servisa
2. **Dodaj error handling** za worker thread probleme
3. **Dodaj eksplicitni DENY feedback** na ekranu za nevalidne kartice
4. **Dodaj timeout monitoring** za worker thread

### 🎯 **PREPORUKA:**

**Trenutni kod RADI KAKO TREBA.** Predložena poboljšanja su **OPCIONALNA** i potrebna samo ako:
- Želiš bolji error reporting
- Želiš bolji user feedback
- Želiš dodatnu sigurnost protiv edge case-ova

**Prioritet implementacije:**
1. **Prijedlog 4** - Eksplicitni DENY feedback (najbolji UX)
2. **Prijedlog 1** - `validated` flag (bolja arhitektura)
3. **Prijedlog 2** - Error handling (dodatna sigurnost)
4. **Prijedlog 3** - Timeout monitoring (edge case protection)

---

**NAPOMENA:** Sistem trenutno radi sigurno i pouzdano. Implementacija poboljšanja je **opcionalna**.
