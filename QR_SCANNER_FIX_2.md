# 🐛 QR Scanner Ispravka #2 - Pogrešni Config Parametri

## 📅 Datum: 2025-11-22 18:17

## ❌ **Novi Problem Identifikovan**: Config parametri imaju **pogrešan prefix**!

---

## 🔍 Root Cause Analysis

### Problem:
QR scanner se **NE pokreće** jer `driver.code.init()` čita **pogrešne config parametre**.

### Config ima `scanInfo.*` prefix:
```json
{
  "scanInfo.deType": 65535,
  "scanInfo.sMode": 0,
  "scanInfo.interval": 2000,
  "scanInfo.codeSwitch": 1
}
```

### Ali driver.js traži `sysInfo.*` prefix:
```javascript
driver.code = {
    init: function () {
        if (!config.get('sysInfo.codeSwitch')) {  // ❌ UNDEFINED!
            log.debug("扫码已关闭")
            return  // ← Scanner se ISKLJUČUJE!
        }
        // ...
        dxCode.decoderUpdateConfig({ 
            deType: config.get('sysInfo.de_type')  // ❌ UNDEFINED!
        })
    },
    loop: function () {
        this.loop = () => dxCode.worker.loop(
            config.get('sysInfo.s_mode'),      // ❌ UNDEFINED!
            config.get('sysInfo.interval')     // ❌ UNDEFINED!
        )
    }
}
```

### Rezultat:
```javascript
config.get('sysInfo.codeSwitch')  // Returns: undefined
if (!undefined) {                 // true (undefined is falsy)
    log.debug("扫码已关闭")       // Ispis: "QR skeniranje isključeno"
    return                         // Scanner se NE pokreće! ❌
}
```

---

## ✅ Rješenje

### Promjena parametara u `driver.js`:

```javascript
driver.code = {
    init: function () {
        // ✅ ISPRAVKA: scanInfo.codeSwitch umjesto sysInfo.codeSwitch
        if (!config.get('scanInfo.codeSwitch')) {
            log.debug("扫码已关闭")
            return
        }
        dxCode.worker.beforeLoop(this.options1, this.options2)
        // ✅ ISPRAVKA: scanInfo.deType umjesto sysInfo.de_type
        dxCode.decoderUpdateConfig({ deType: config.get('scanInfo.deType') })
    },
    loop: function () {
        // ✅ ISPRAVKA: scanInfo.codeSwitch umjesto sysInfo.codeSwitch
        if (!config.get('scanInfo.codeSwitch')) {
            log.debug("扫码已关闭")
            this.loop = () => { }
        } else {
            // ✅ ISPRAVKA: scanInfo.sMode i scanInfo.interval
            this.loop = () => dxCode.worker.loop(
                config.get('scanInfo.sMode'),      // ✅ 0
                config.get('scanInfo.interval')    // ✅ 2000
            )
        }
    }
}
```

---

## 📊 Prije vs Poslije

| Parametar | Prije (POGREŠNO) | Poslije (ISPRAVNO) | Vrijednost |
|-----------|------------------|-------------------|------------|
| **Switch** | `sysInfo.codeSwitch` | `scanInfo.codeSwitch` | `1` (ON) |
| **Kod tip** | `sysInfo.de_type` | `scanInfo.deType` | `65535` |
| **Mod** | `sysInfo.s_mode` | `scanInfo.sMode` | `0` (interval) |
| **Interval** | `sysInfo.interval` | `scanInfo.interval` | `2000` ms |

---

## 🧪 Testiranje

### Provjera config parametara:

```javascript
// U DevTools konzoli ili logu:
console.log('codeSwitch:', config.get('scanInfo.codeSwitch'))  // Očekivano: 1
console.log('deType:', config.get('scanInfo.deType'))          // Očekivano: 65535
console.log('sMode:', config.get('scanInfo.sMode'))            // Očekivano: 0
console.log('interval:', config.get('scanInfo.interval'))      // Očekivano: 2000
```

### Očekivani log output nakon ispravke:

```
[driver.code] QR scanner inicijalizovan
[dxCode] Opening camera: /dev/video11
[dxCode] Decoder config: { deType: 65535 }
[dxCode] Scanner mode: interval, interval: 2000ms
[dxCode] Scanner started successfully
```

### Ako scanner i dalje NE radi:

```
[driver.code] 扫码已关闭  ← AKO VIDIŠ OVO, config parametri još nisu ispravni!
```

---

## 🎯 Zašto se ovo desilo?

### Razlog 1: Različite verzije aplikacije

- **dw200_scanner**: Koristi `sysInfo.*` prefix za SVE parametre
- **dw200_access**: Koristi `scanInfo.*` prefix za scanner parametre

### Razlog 2: Copy-paste iz scanner primera

- Kod iz `dw200_scanner/src/driver.js` je bio copy-paste bez prilagođavanja config strukturi

### Razlog 3: Config.json nije bio provjeren

- Nisam prvo pogledao stvarnu strukturu `config.json` fajla

---

## 📝 Sve Ispravke (Kompletan spisak)

### Ispravka #1: Worker Thread (ranije)
- ✅ Kreiran `src/code.js`
- ✅ Dodat `std.Worker('/app/code/src/code.js')` u `main.js`

### Ispravka #2: Config Parametri (sada)
- ✅ `sysInfo.codeSwitch` → `scanInfo.codeSwitch`
- ✅ `sysInfo.de_type` → `scanInfo.deType`
- ✅ `sysInfo.s_mode` → `scanInfo.sMode`
- ✅ `sysInfo.interval` → `scanInfo.interval`

---

## 🚀 QR Scanner bi sada trebao raditi!

### Ako i dalje ne radi, provjeri:

1. **Config fajl**: `cat /app/data/config/config.json | grep scanInfo`
2. **Device postojanje**: `ls -l /dev/video11` (mora postojati)
3. **Logovi**: `tail -f /app/data/log/app.log` (provjeri greške)
4. **Hardver**: USB kamera ili QR scanner priključen?

---

**Datum**: 2025-11-22 18:17  
**Verzija**: dw200_v10_access_v2.0.2.3  
**Ispravka**: Config parametri - `scanInfo.*` prefix
