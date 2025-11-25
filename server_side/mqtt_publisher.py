# mqtt_publisher.py
#
# Opis:
#   Ova skripta šalje jednu MQTT poruku na određenu temu (topic) i izlazi.
#   Koristi se za slanje komandi na Dw200RoomCtrl uređaj sa računara.
#
# Primjeri korištenja iz komandne linije:
#
# 1. Otvaranje vrata:
#    python mqtt_publisher.py --topic "access_device/v1/cmd/D200-12345678/control" --payload "{\"command\": 1}"
#
# 2. Dodavanje QR koda:
#    python mqtt_publisher.py --topic "access_device/v1/cmd/D200-12345678/insertPermission" --payload "{\"data\":[{\"type\":\"qr\",\"code\":\"PROBA123\",\"startTime\":1672531200,\"endTime\":1704067199}]}"
#
# 3. Mijenjanje konfiguracije:
#    python mqtt_publisher.py --topic "access_device/v1/cmd/D200-12345678/setConfig" --payload "{\"data\":{\"doorInfo\":{\"openTimeout\":10}}}"

import argparse
import paho.mqtt.client as mqtt
import time
import sys

# --- Argumenti komandne linije ---
parser = argparse.ArgumentParser(description="Python MQTT Publisher")
parser.add_argument('--broker', type=str, default="localhost", help="Adresa MQTT brokera (default: localhost)")
parser.add_argument('--port', type=int, default=1883, help="Port MQTT brokera (default: 1883)")
parser.add_argument('--topic', type=str, required=True, help="MQTT tema na koju se šalje poruka")
parser.add_argument('--payload', type=str, required=True, help="Sadržaj poruke (payload) u obliku stringa")
parser.add_argument('--username', type=str, default=None, help="Korisničko ime za MQTT brokera")
parser.add_argument('--password', type=str, default=None, help="Lozinka za MQTT brokera")
args = parser.parse_args()

# --- MQTT Callback funkcije ---
def on_connect(client, userdata, flags, rc):
    """Callback koji se poziva prilikom spajanja na broker."""
    if rc == 0:
        print(f"Uspješno spojen na MQTT Broker: {args.broker}:{args.port}")
    else:
        print(f"Neuspješno spajanje, kod greške: {rc}\nProvjerite da li je Mosquitto pokrenut ('mosquitto -v') i da li je adresa brokera tačna.")
        sys.exit(1) # Prekini izvršavanje ako konekcija nije uspjela

def on_publish(client, userdata, mid):
    """Callback koji se poziva nakon slanja poruke."""
    print(f"Poruka poslana na temu: {args.topic}")
    print(f"Sadržaj: {args.payload}")

# --- Glavna logika ---
def main():
    """Glavna funkcija za spajanje, slanje i odspajanje."""
    client = mqtt.Client(client_id="server_side_tester_py")

    # Postavljanje callback funkcija
    client.on_connect = on_connect
    client.on_publish = on_publish

    # Postavljanje korisničkog imena i lozinke ako su prosljeđeni
    if args.username and args.password:
        client.username_pw_set(args.username, args.password)

    try:
        # Pokušaj spajanja
        client.connect(args.broker, args.port, 60)
    except Exception as e:
        print(f"Greška prilikom spajanja na MQTT broker: {e}")
        print("Provjerite da li je Mosquitto pokrenut i da li je adresa tačna.")
        sys.exit(1)

    # Dajemo vremena da se konekcija uspostavi i poruka pošalje
    client.loop_start()

    # Slanje poruke
    result = client.publish(args.topic, args.payload)
    
    # Čekamo da se poruka objavi
    status = result.wait_for_publish()
    if not status:
        print("Greška: Poruka nije uspješno poslana.")

    # Dajemo mali delay da se on_publish callback izvrši
    time.sleep(1)

    # Prekidamo petlju i odspajamo se
    client.loop_stop()
    client.disconnect()
    print("Diskonektovan sa MQTT Brokera.")

if __name__ == '__main__':
    main()
