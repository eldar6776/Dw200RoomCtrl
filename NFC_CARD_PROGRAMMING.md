# 🎴 NFC Card Programming Guide

## Overview

This guide explains how to program Mifare Classic M1 cards with user data for the DW200 Hotel Access Control System.

---

## 📋 Card Structure (FINAL)

| Sector | Block | Data | Format | Size | Example |
|--------|-------|------|--------|------|---------|
| **0** | **1** | **First Name (Optional)** | UTF-8 String | 16 bytes | `Ibro` |
| **0** | **2** | **Last Name (Optional)** | UTF-8 String | 16 bytes | `Hadzic` |
| **1** | **0** | **Object ID** | 32-bit Integer (Big Endian) | 4 bytes | `42444` (0x0000A5DC) |
| **1** | **1** | **Room/Controller Address** | 16-bit Integer (Big Endian) | 2 bytes | `505` (0x01F9) |
| **2** | **0** | **Expiration Date** | BCD Date/Time + Controller | 16 bytes | See below |

---

## 📅 Expiration Date Format (Sector 2, Block 0)

| Byte | Field | Format | Example | Decimal |
|------|-------|--------|---------|---------|
| **[0]** | Day | BCD | `0x31` | 31 |
| **[1]** | Month | BCD | `0x12` | 12 (December) |
| **[2]** | Year | BCD (2-digit) | `0x25` | 25 (2025) |
| **[3]** | Hour | BCD | `0x23` | 23 |
| **[4]** | Minute | BCD | `0x59` | 59 |
| **[5-6]** | Reserved | - | `0x00` | - |
| **[7]** | Controller ID | Hex | `0x01` | 1 |
| **[8-15]** | Padding | - | `0x00` | - |

### BCD Encoding Example:
```
Decimal 31 → BCD 0x31
Decimal 12 → BCD 0x12
Decimal 25 → BCD 0x25
```

---

## 🔐 Validation Logic

### Controller reads card and performs 3 checks:

#### **1. ⏰ Expiration Date Check:**
```
IF card.expirationDate < currentTime:
    ❌ DENY + Message: "Card expired" + Audio: "f_eng"
```

#### **2. 🏢 Object ID Check:**
```
IF card.objectID != controller.objectID (from config.json):
    ❌ DENY + Message: "Invalid card for this location" + Audio: "f_eng"
```

#### **3. 🚪 Room/Controller Address Check:**
```
IF card.roomAddress != controller.roomAddress (from config.json):
    ❌ DENY + Message: "Wrong room/controller" + Audio: "f_eng"
```

#### **4. ✅ All Checks Pass:**
```
IF firstName && lastName exist:
    ✅ GRANT + Message: "Welcome - Room 505, Mr./Ms. Ibro Hadzic" + Audio: "s_eng"
ELSE:
    ✅ GRANT + Message: "Access Granted" + Audio: "s_eng"
```

---

## 🛠️ Programming Example

### **Example Card:**
- **Name:** Ibro Hadzic
- **Object ID:** 42444
- **Room Address:** 505
- **Valid Until:** December 31, 2025, 23:59

### **Data Layout:**

#### **Sector 0, Block 1 (First Name):**
```
Bytes: 49 62 72 6F 00 00 00 00 00 00 00 00 00 00 00 00
Text:  I  b  r  o  (null padding)
```

#### **Sector 0, Block 2 (Last Name):**
```
Bytes: 48 61 64 7A 69 63 00 00 00 00 00 00 00 00 00 00
Text:  H  a  d  z  i  c  (null padding)
```

#### **Sector 1, Block 0 (Object ID = 42444):**
```
Bytes: 00 00 A5 DC 00 00 00 00 00 00 00 00 00 00 00 00
Hex:   0x0000A5DC = 42444 decimal (Big Endian)
```

#### **Sector 1, Block 1 (Room Address = 505):**
```
Bytes: 01 F9 00 00 00 00 00 00 00 00 00 00 00 00 00 00
Hex:   0x01F9 = 505 decimal (Big Endian)
```

#### **Sector 2, Block 0 (Expiration: 31.12.2025 23:59, Controller #1):**
```
Bytes: 31 12 25 23 59 00 00 01 00 00 00 00 00 00 00 00
BCD:   31 12 25 23 59 -- -- 01 (padding...)
```

---

## ⚙️ Controller Configuration

Set in `src/config.json`:

```json
{
    "controller.objectID": 42444,
    "controller.roomAddress": 505
}
```

**Only cards with matching Object ID AND Room Address will be accepted!**

---

## 🔑 Default Key

**Mifare Classic Default Key (Key A):**
```
0xFF 0xFF 0xFF 0xFF 0xFF 0xFF
```

---

**Last Updated:** 2025-11-23
