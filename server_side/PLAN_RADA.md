# PLAN RADA - Serverska Strana za Dw200RoomCtrl

Ovaj dokument opisuje korake za postavljanje, konfiguraciju i testiranje serverske strane za `Dw200RoomCtrl` uređaj. Sva komunikacija se odvija putem MQTT protokola.

## 1. Preduslovi

Prije početka, potrebno je instalirati sljedeći softver na vašem računaru:

1.  **Mosquitto MQTT Broker**: Besplatni i open-source MQTT broker. Možete ga preuzeti [ovdje](https://mosquitto.org/download/).
2.  **Python**: Za pokretanje testnih skripti. Preuzmite ga [ovdje](https://www.python.org/downloads/). Prilikom instalacije, označite opciju "Add Python to PATH".
3.  **Paho-MQTT Python biblioteka**: Nakon instalacije Pythona, otvorite Command Prompt (cmd) ili PowerShell i ukucajte:
    ```bash
    pip install paho-mqtt
    ```

## 2. Konfiguracija Uređaja (VAŽNO)

Da bi se uređaj povezao na vaš lokalni Mosquitto broker, **morate** izmijeniti datoteku `src/config.json` unutar projekta.

**JA NE SMIJEM MIJENJATI OVU DATOTEKU. OVO JE VAŠ ZADATAK.**

Pronađite sekciju `mqttInfo` i podesite `mqttAddr` na IP adresu vašeg računara. Port `1883` je standardni za MQTT.

**Primjer:**
Ako je IP adresa vašeg računara `192.168.1.10`, izmijenite `src/config.json` da izgleda ovako:

```json
{
  "devInfo": {
    "sn": "D200-12345678",
    "mac": "AA:BB:CC:DD:EE:FF"
  },
  "mqttInfo": {
    "mqttAddr": "tcp://192.168.1.10:1883",
    "mqttName": "user",
    "password": "password",
    "clientId": "D200-12345678",
    "topics": []
  },
  // ... ostatak konfiguracije
}
```

-   `sn` vrijednost ("D200-12345678" u ovom primjeru) je ključna, jer se koristi za formiranje MQTT tema (topics). Zapišite je.

## 3. Pokretanje MQTT Brokera

1.  Instalirajte i pokrenite Mosquitto broker.
2.  Otvorite Command Prompt i pokrenite Mosquitto sa `-v` (verbose) opcijom da vidite konekcije i poruke u realnom vremenu. Ovo je korisno za praćenje da li se uređaj uspješno povezao.
    ```bash
    mosquitto -v
    ```
    Ako vidite ispis o konekciji sa klijent ID-om vašeg uređaja, sve radi ispravno.

## 4. Testiranje Pomoću Python Skripti

U ovom direktoriju (`server_side`) kreirat ću Python skriptu `mqtt_publisher.py` koja omogućava slanje komandi na uređaj.

**Struktura MQTT tema (topics):**
Uređaj sluša na teme u formatu: `access_device/v1/cmd/{sn}/{command}`
-   `{sn}`: Serijski broj uređaja iz `src/config.json`.
-   `{command}`: Naziv komande koju želite izvršiti.

### Primjeri Korištenja Skripte

Sve komande se šalju iz `server_side` direktorija.

**A. Slanje Komande za Daljinsko Otvaranje Vrata**

-   **Komanda:** `control`
-   **Payload:** `{"command": 1}`

```bash
python mqtt_publisher.py --topic "access_device/v1/cmd/D200-12345678/control" --payload "{\"command\": 1}"
```

**B. Dodavanje Novog Korisnika (QR kod ili PIN)**

-   **Komanda:** `insertPermission`
-   **Payload:** JSON objekat sa listom korisnika.
    -   `type`: "qr" za QR kod, "card" za PIN.
    -   `code`: Vrijednost QR koda ili PIN-a.
    -   `startTime` / `endTime`: Vrijeme važenja (Unix timestamp).

```bash
python mqtt_publisher.py --topic "access_device/v1/cmd/D200-12345678/insertPermission" --payload "{\"data\":[{\"type\":\"qr\",\"code\":\"OVOJEPROBNIQRKOD123\",\"startTime\":1672531200,\"endTime\":1704067199}]}"
```

**C. Promjena Konfiguracije (npr. vrijeme otključavanja vrata)**

-   **Komanda:** `setConfig`
-   **Payload:** JSON objekat sa dijelom konfiguracije koji mijenjate.

```bash
python mqtt_publisher.py --topic "access_device/v1/cmd/D200-12345678/setConfig" --payload "{\"data\":{\"doorInfo\":{\"openTimeout\":15}}}"
```

**D. Slanje Komande za Ažuriranje Aplikacije (OTA Update)**

1.  Postavite `update.zip` datoteku na lokalni HTTP server (npr. koristeći Python: `python -m http.server 8000`).
2.  Izračunajte MD5 hash za `update.zip` datoteku.
3.  Pošaljite komandu.

-   **Komanda:** `upgradeFirmware`
-   **Payload:** JSON sa URL-om i MD5 hashom.

```bash
python mqtt_publisher.py --topic "access_device/v1/cmd/D200-12345678/upgradeFirmware" --payload "{\"data\":{\"url\":\"http://192.168.1.10:8000/update.zip\",\"md5\":\"a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6\"}}"
```
---
