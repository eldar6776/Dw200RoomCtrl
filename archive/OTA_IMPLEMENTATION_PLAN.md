#Izvještaj o analizi OTA (Over-The-Air) nadogradnje

## Sažetak
Detaljnom analizom projekta `Dw200RoomCtrl` i referentnog primjera `dw200_mqtt_upgrade` utvrđeno je da je funkcionalnost OTA nadogradnje putem MQTT-a **već implementirana** u vašem postojećem projektu.

Nije potrebno pisanje novog koda za podršku OTA funkcionalnosti, već samo razumijevanje postojećeg protokola i pravilno konfigurisanje serverske strane za slanje komandi.

---


## 1. Analiza postojećeg stanja (`Dw200RoomCtrl`)

U projektu `Dw200RoomCtrl`, OTA logika je smještena u sljedećim fajlovima:

1.  **`src/service/mqttService.js`**:
    *   Sadrži funkciju `upgradeFirmware` (linije 277-305).
    *   Ova funkcija se automatski poziva kada stigne MQTT poruka na odgovarajući topic.
    *   Podržava dva tipa nadogradnje:
        *   `type: 0` -> HTTP nadogradnja sistemskog softvera (koristi `dxOta.updateHttp`).
        *   `type: 1` -> BLE (Bluetooth) firmware nadogradnja.

2.  **`src/services.js`**:
    *   Rutira MQTT poruke. Kada stigne poruka `dxMqtt.RECEIVE_MSG`, prosljeđuje je `mqttService.receiveMsg`.

3.  **`dxmodules/dxOta.js`**:
    *   Implementira stvarnu logiku skidanja fajla (`updateHttp`), provjere MD5 sume i zamjene fajlova.

### Protokol komunikacije
Uređaj se automatski pretplaćuje na topic:
`access_device/v1/cmd/{SERIAL_NUMBER}/upgradeFirmware`

Očekivani format JSON payload-a za sistemsku nadogradnju je:

```json
{
  "serialNo": "RANDOM_STRING",
  "data": {
    "type": 0,
    "url": "http://vas-server.com/update.zip",
    "md5": "32_KARAKTERA_MD5_HASH"
  }
}
```

*Napomena: `type: 0` je ključan parametar koji razlikuje sistemsku nadogradnju od BLE nadogradnje.*

---


## 2. Analiza serverske strane (`server_side`)

Folder `server_side` sadrži primjer Node.js servera i Python skripte za testiranje.

### `mqtt_publisher.py`
Ova skripta je idealna za testiranje jer omogućava slanje proizvoljnog payload-a.

### `server.js`
Ovaj server ima ugrađenu logiku za slanje OTA komande, ali **format payload-a se blago razlikuje** od onoga što vaš uređaj očekuje.
*   Server šalje: `{"data": {"url": "...", "md5": "..."}}`
*   Uređaj očekuje: `{"data": {"type": 0, "url": "...", "md5": "..."}}`

---


## 3. Plan testiranja i integracije

Budući da je kod već napisan, fokus je na testiranju. Slijedite ove korake:

### Korak 1: Priprema paketa za nadogradnju
1.  Kreirajte `.zip` fajl sa novom verzijom aplikacije (sadržaj `app/code` foldera).
2.  Izračunajte MD5 checksum tog fajla.
    *   Windows (PowerShell): `Get-FileHash update.zip -Algorithm MD5`
    *   Linux/Mac: `md5sum update.zip`

### Korak 2: Pokretanje testnog servera
U folderu `server_side`:
1.  Instalirajte zavisnosti: `npm install`
2.  Pokrenite server: `node server.js`
3.  Postavite `update.zip` u `server_side/uploads/` folder (ili koristite upload API).

### Korak 3: Slanje komande za nadogradnju
Koristite `mqtt_publisher.py` za slanje ispravne komande. Zamijenite `VAŠ_SN` sa serijskim brojem uređaja (može se naći u logovima pri startu ili u `config.json`).

Komanda (iz `server_side` foldera):

```bash
python mqtt_publisher.py \
  --topic "access_device/v1/cmd/VAŠ_SN/upgradeFirmware" \
  --payload '{"serialNo":"test1","data":{"type":0,"url":"http://IP_VAŠEG_RAČUNARA:3000/ota/update.zip","md5":"VAŠ_MD5_HASH"}}'
```

**Važne napomene:**
*   **IP Adresa:** U URL-u nemojte koristiti `localhost`. Morate koristiti stvarnu IP adresu vašeg računara (npr. `192.168.1.15`) jer uređaj "ne vidi" localhost vašeg računara.
*   **Firewall:** Provjerite da firewall na vašem računaru dopušta dolazne konekcije na port 3000.

### Korak 4: Verifikacija na uređaju
Pratite logove uređaja. Trebali biste vidjeti:
1.  `[mqttService] upgradeFirmware` - Prijem komande.
2.  `Start Upgrading` - Poruka na ekranu/PWM zvuk.
3.  Skidanje fajla...
4.  `Upgrade Success` - Uspješna verifikacija.
5.  Automatski reboot.

---


## 4. Zaključak

Vaš projekat je **spreman za OTA**. Nisu potrebne izmjene u kodu uređaja (`Dw200RoomCtrl`). Potrebno je samo osigurati da vaša serverska aplikacija šalje JSON payload u formatu koji `mqttService.js` očekuje (sa parametrom `type: 0`).

---

## 5. Detalji strukture paketa za nadogradnju

**Analiza:** Termin "sadržaj `app/code` foldera" odnosi se na sadržaj vašeg projektnog "roota" koji se kopira na uređaj.

### Šta treba biti u ZIP fajlu?
Paket za nadogradnju mora sadržavati fajlove koji čine izvršni kod aplikacije. Kada otpakujete `update.zip`, struktura mora izgledati ovako (direktno u root-u zip-a, ne unutar podfoldera `code` ili `app`):

```text
update.zip
├── src/                <-- Vaš izvorni kod
├── dxmodules/          <-- Sistemski moduli i biblioteke
├── resource/           <-- Slike, fontovi, zvukovi
├── app.dxproj          <-- Konfiguracija projekta
└── package.json        <-- Verzije i zavisnosti
```

### Šta NE treba pakovati:
*   📂 `archive/`
*   📂 `examples/`
*   📂 `.git/`
*   📂 `.temp/`
*   📂 `node_modules/` (osim ako su eksplicitno potrebni, ali `dxmodules` obično pokriva sve)
*   📂 `server_side/`