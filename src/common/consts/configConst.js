
const configConst = {}
configConst.setConfig = {
    // mqtt ip+port
    mqttaddr: "mqttInfo.mqttAddr",
    // mqtt nalog
    mqttusername: "mqttInfo.mqttName",
    //mqtt lozinka
    mqttpassword: "mqttInfo.password",
    //mqtt prefiks
    mqttprefix: "mqttInfo.prefix",
    //qosmqtt
    mqttqos: "mqttInfo.qos",
    // ID klijenta
    mqttclientid: "mqttInfo.clientId",
    //ntp adresa servera za sinhronizaciju vremena
    ntpAddr: "netInfo.ntpAddr",
    //net_type 
    net_type: "netInfo.type",
    //DHCP 
    ip_mode: "netInfo.dhcp",
    //ip
    ip: "netInfo.ip",
    //gateway
    gateway: "netInfo.gateway",
    //dns
    dns: "netInfo.dns",
    //macaddr
    macaddr: "netInfo.netMac",
    // fixed_macaddr_enable 0:zadani mac 2:prilagođeni mac
    fixed_macaddr_enable: "netInfo.fixed_macaddr_enable",
    //subnet maska
    mask: "netInfo.subnetMask",
    //broj uređaja
    devnum: "sysInfo.deviceNum",
    //naziv kompanije
    devname: "sysInfo.deviceName",
    //jačina zvučnika
    volume: "sysInfo.volume",
    //Jačina zvuka pritiska na dugme
    volume2: "sysInfo.volume2",
    //jačina zujalice
    volume3: "sysInfo.volume3",
    //Heartbeat prekidač
    heart_en: "sysInfo.heart_en",
    //Heartbeat interval
    heart_time: "sysInfo.heart_time",
    //Heartbeat sadržaj
    heart_data: "sysInfo.heart_data",
    //status uređaja
    dev_sta: "sysInfo.status",
    //Prekidač za cloud certifikat 3: dobijanje cloud certifikata 1: fizički broj kartice
    nfc_identity_card_enable: "sysInfo.nfc_identity_card_enable",
    //da li je sn skriven 1 prikazuje 0 skriva
    sn_show: "uiInfo.sn_show",
    //da li je ip skriven 1 prikazuje 0 skriva
    ip_show: "uiInfo.ip_show",
    //da li je verzija skrivena 1 prikazuje 0 skriva
    version_show: "sysInfo.version_show",
    //lozinka za konfiguraciju uređaja
    com_passwd: "sysInfo.com_passwd",
    //jezik
    language: "sysInfo.language",
    //način otvaranja vrata
    openMode: "doorInfo.openMode",
    //trajanje otvaranja vrata
    openTime: "doorInfo.openTime",
    //vremensko ograničenje otvaranja vrata
    openTimeout: "doorInfo.openTimeout",
    //prekidač za online verifikaciju 1 uključeno 0 isključeno
    onlinecheck: "doorInfo.onlinecheck",
    //vremensko ograničenje online verifikacije
    onlineTimeout: "doorInfo.timeout",
    // buttonText: "uiInfo.buttonText",
    show_date: "uiInfo.show_date",
    show_devname: "uiInfo.show_devname",
    // Prikaži dugme za otključavanje 1 Prikaži 0 Sakrij
    show_unlocking: "uiInfo.show_unlocking",
    // Rotacija ekrana
    rotation: "uiInfo.rotation",
    //1 otvori 0 zatvori
    nfc: "sysInfo.nfc",
    // Vremenska zona
    ntpLocaltime: "netInfo.ntpLocaltime",
    // Sistem kodiranja
    de_type: "scanInfo.deType",
    //režim skeniranja 0 je intervalni 1 je jednokratni
    s_mode: "scanInfo.sMode",
    //interval stupa na snagu, vrijeme intervala
    interval: "scanInfo.interval",
    //Poruka o grešci pri online verifikaciji Prekidač 0 Isključeno 1 Uključeno
    onlinecheckErrorMsg: "sysInfo.onlinecheckErrorMsg",
    //-1 Isključi automatsko ponovno pokretanje 0-23 Ponovno pokretanje u određeni sat
    autoRestart: "sysInfo.autoRestart",
    setSn: "sysInfo.setSn",
}
//Dobijanje vrijednosti iz setConfig-a na osnovu ključa
configConst.getValueByKey = function (key) {
    return this.setConfig[key] || undefined;
}

export default configConst