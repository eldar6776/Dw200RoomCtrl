# 🚨 KRITIČAN SIGURNOSNI BUG - NFC Validacija

**Datum analize:** 2025-11-23  
**Status:** KRITIČAN - Neautorizovan pristup omogućen  
**Prioritet:** P0 - Hitna ispravka potrebna

---

## 📋 SAŽETAK PROBLEMA

Sistem **dozvoljava pristup kartama koje NE ispunjavaju sigurnosne uslove** zbog pada (crash) validacionog koda. Kada validacija pokuša da odbije neispravnu karticu, **kod se ruši i sistem ulazi u fail-open stanje koje otključava vrata**.

---

## 🎯 SIGURNOSNI ZAHTEVI (OBAVEZNI USLOVI)

Za otključavanje vrata sobe 505 u objektu 42444, kartica **MORA** ispuniti **SVA TRI uslova**:

### ✅ USLOV 1: Object ID
```
Kartica Object ID === Kontroler Object ID
Kartica: 42444 === Kontroler: 42444
```

### ✅ USLOV 2: Room Address  
```
Kartica Room Address === Kontroler Room Address
Kartica: 505 === Kontroler: 505
```

### ✅ USLOV 3: Validnost kartice (nije istekla)
```
Sistemsko vreme (RTC) ≤ Vreme isteka na kartici
```

**AKO MAKAR JEDAN USLOV NIJE ISPUNJEN → PRISTUP MORA BITI ODBIJEN!**

---

## 🔴 TRENUTNA KONFIGURACIJA KONTROLERA

```json
{
    "controller.objectID": 42444,
    "controller.roomAddress": 505
}
```

---

## 🧪 TEST SLUČAJEVI

### ✅ TEST 1: Ispravna kartica (UID: c46f5021)

**Podaci na kartici:**
```
Object ID:     42444        ✅ POKLAPA SE
Room Address:  505          ✅ POKLAPA SE  
Expiration:    2025-11-30   ✅ NIJE ISTEKLA (RTC: 1970-01-01)
```

**Rezultat:**
```
[INFO]: [NFC] ✅ Room Address match: 505
[INFO]: [NFC] ✅ All validations passed!
[INFO]: [NFC] ✅ Access GRANTED
```
**Status:** ✅ **PROŠLA - VRATA SE OTKLJUČAVAJU (ISPRAVNO)**

---

### ❌ TEST 2: Neispravna kartica (UID: bc18cef4)

**Podaci na kartici:**
```
Object ID:     43981        ❌ NE POKLAPA SE (43981 ≠ 42444)
Room Address:  100          ❌ NE POKLAPA SE (100 ≠ 505)
Expiration:    2025-11-30   ✅ NIJE ISTEKLA (RTC: 1970-01-01)
```

**Očekivani rezultat:**
```
[ERROR]: ❌ Access DENIED - Object ID mismatch
[ERROR]: ❌ Access DENIED - Room/Controller address mismatch
```

**Stvarni rezultat:**
```
[INFO]: [NFC] ✅ Card is VALID (not expired)
[ERROR]: worker pool__id0 callback error: at /app/code/src/service/nfcService.js:356
```

**Status:** 🚨 **FAILED - VRATA SE OTKLJUČAVAJU (SIGURNOSNI PROPUST!)**

---

## 🐛 TEHNIČKA ANALIZA BUGA

### Lokacija problema
**Fajl:** `src/service/nfcService.js`  
**Linija:** 356  
**Funkcija:** `nfcService.receiveMsg()`

### Tok izvršavanja koda

#### 1. Čitanje podataka sa kartice (linije 50-148)
```javascript
// Uspešno pročitano:
nfcData.objectID = 43981           ❌ POGREŠAN
nfcData.roomAddress = 100          ❌ POGREŠAN
nfcData.expirationYear = 2025      ✅ OK
```

#### 2. VALIDACIJA STEP 1: Expiration (linije 312-322)
```javascript
const isNotExpired = validateCardExpiration(nfcData)
// Rezultat: TRUE (1970 < 2025)
// Status: ✅ PROŠLA (zbog pogrešnog RTC-a)
```

#### 3. VALIDACIJA STEP 2: Object ID (linije 325-340)
```javascript
const controllerObjectID = config.get("controller.objectID") || 0

if (nfcData.objectID && controllerObjectID !== 0) {
    if (nfcData.objectID !== controllerObjectID) {
        // 43981 !== 42444 → TREBALO BI DA ODBIJE!
        log.warn("[NFC] ❌ Access DENIED - Object ID mismatch")
        driver.pwm.fail()
        driver.audio.fail()
        return
    }
}
```

**PROBLEM:** **Validacija Object ID se PRESKAČE ili se NE IZVRŠAVA!**

Moguća uzrok:
- `nfcData.objectID` postoji (43981)
- `controllerObjectID` **možda nije učitan** ili je **0**
- Zbog toga se `if` uslov ne izvršava i validacija se **preskaće**

#### 4. VALIDACIJA STEP 3: Room Address (linije 343-365)
```javascript
const controllerRoomAddress = config.get("controller.roomAddress") || 505

if (nfcData.roomAddress !== controllerRoomAddress) {
    // 100 !== 505 → TREBALO BI DA ODBIJE!
    log.warn("[NFC] ❌ Access DENIED - Room/Controller address mismatch") // LINIJA 356
    // ⬆️ KOD SE RUŠI OVDE!
```

**PROBLEM:** **Kod se ruši na liniji 356 i baca exception:**
```
[ERROR]: worker pool__id0 callback error: at /app/code/src/service/nfcService.js:356
```

#### 5. Šta se dešava nakon pada?
**Teorija:** Kada se worker proces sruši, sistem možda ulazi u **fail-open** mod gde automatski otključava vrata kao "sigurnosnu" meru (da korisnici ne ostanu zaključani).

---

## 🔍 IDENTIFIKOVANI PROBLEMI

### Problem 1: Object ID validacija se preskače
**Lokacija:** Linija 327-328
```javascript
if (nfcData.objectID && controllerObjectID !== 0) {
```

**Razlog:**
- Ako `config.get("controller.objectID")` vraća `undefined`, onda je `controllerObjectID = 0`
- U tom slučaju uslov `controllerObjectID !== 0` je `FALSE`
- **Cela validacija se preskače!**

**Posledica:** Kartica sa Object ID 43981 prolazi bez provere!

---

### Problem 2: Kod se ruši na liniji 356
**Lokacija:** Linija 356
```javascript
log.warn("[NFC] ❌ Access DENIED - Room/Controller address mismatch")
```

**Mogući uzroci:**
1. **Worker pool context problem:** `log` objekat možda nije dostupan u worker thread-u
2. **Exception u log funkciji:** `log.warn()` baca grešku
3. **Driver objekat problem:** `driver.pwm.fail()` ili `driver.audio.fail()` baca exception
4. **Asinhronizacioni problem:** Kod pokušava pristupiti objektima koji nisu inicijalizovani

**Posledica:** Umesto odbijanja pristupa, kod pada i sistem možda otključava vrata!

---

### Problem 3: Nema poziva za otključavanje nakon validacije
**Lokacija:** Linija 375
```javascript
log.info("[NFC] ✅ Access GRANTED")
// KOD ZAVRŠAVA OVDE - NEMA POZIVA ZA OTKLJUČAVANJE!
```

**Problem:** Nedostaje:
```javascript
accessService.access({ type: 203, code: cardId })
// ILI
driver.pwm.success()
driver.audio.success()
driver.relay.unlock()
```

**Ali postavlja se pitanje:** Ako nema poziva za otključavanje, kako se onda vrata otključavaju?

---

## 📝 ZAKLJUČAK

### Kritični sigurnosni propusti:

1. **Object ID validacija se ne izvršava** kada `config.get()` vraća `undefined`
2. **Room Address validacija ruši kod** umesto da odbije pristup
3. **Sistem ulazi u fail-open stanje** nakon pada worker procesa
4. **Nedostaje eksplicitan poziv za otključavanje** nakon validacije

### Posledica:
**Kartica sa POGREŠNIM Object ID (43981) i POGREŠNIM Room Address (100) može otključati sobu 505 u objektu 42444!**

---

## ✅PLAN ISPRAVKE

### 1. Ispraviti Object ID validaciju
- Validacija mora biti **OBAVEZNA**, ne uslovljena
- Ako `controllerObjectID` nije postavljen, **odbiti sve kartice**

### 2. Ispraviti Room Address validaciju  
- Umotati validaciju u `try-catch` blok
- Koristiti sigurniju metodu logovanja
- Osigurati da se `return` izvršava čak i ako logging padne

### 3. Dodati eksplicitan poziv za otključavanje
- Dodati `accessService.access()` ili driver pozive
- Osigurati da vrata otključavaju **SAMO** kada sve validacije prođu

### 4. Dodati fail-safe mehanizam
- Ako worker padne, **default ponašanje mora biti LOCKED**
- Nikada ne ulaziti u fail-open stanje

### 5. Dodati dodatno logovanje
- Logovanje **pre** ulaska u validaciju
- Logovanje **nakon** svake validacije
- Error handling za svaki korak

---

## 🚀 SLEDEĆI KORACI

1. ✅ Analiza problema - **ZAVRŠENA**
2. ⏳ Pregled koda i identifikacija svih problema - **U TOKU**
3. ⏳ Implementacija ispravki
4. ⏳ Testiranje sa obe kartice
5. ⏳ Code review
6. ⏳ Deployment

---

**NAPOMENA:** Ovo je **kritičan sigurnosni bug** koji omogućava neautorizovan pristup. Potrebna je **hitna ispravka** pre puštanja sistema u produkciju!
