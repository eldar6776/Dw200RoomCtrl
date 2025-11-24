/**
 * HTTP klijent modul
 * Karakteristike:
 * - GET/POST zahtjevi
 * - Upload/download datoteka
 * - HTTPS podrška
 * - Callback za praćenje napretka
 * - Verifikacija certifikata
 * 
 * Upotreba:
 * - Jednostavni zahtjevi: koristite get/post metode
 * - Složeni zahtjevi: koristite request metodu
 * 
 * Doc/Demo : https://github.com/DejaOS/DejaOS
 */
import { httpclientClass } from './libvbar-m-dxhttpclient.so'

let client = null;
const httpclient = {}
/**
 * Inicijalizacija klijenta
 */
httpclient.init = function () {
    if (!client) {
        client = new httpclientClass();
    }
}
/**
 * Slanje GET zahtjeva
 * @param {string} url URL zahtjeva
 * @param {number} timeout Vremensko ograničenje u milisekundama (zadano: 5000)
 * @param {Object} [opts] Dodatne opcije zahtjeva
 * @returns {Object} Rezultat odgovora
 * @returns {number} returns.code - Statusni kod (0: uspjeh, različito od nule: neuspjeh)
 * @returns {string} returns.message - Poruka o grešci (ako postoji)
 * @returns {string} returns.data - Podaci odgovora
 * @throws {Error} Baca grešku tokom validacije
 */
httpclient.get = function (url, timeout = 5000, opts = {}) {
    if (!url) {
        throw new Error("URL is required");
    }
    httpclient.init();
    client.reset();
    client.setOpt("timeout", timeout);
    client.setOpt("url", url);
    client.setOpt("method", "GET");

    for (const [key, value] of Object.entries(opts)) {
        client.setOpt(key, value);
    }

    return client.request();
}

/**
 * Slanje POST JSON zahtjeva
 * @param {string} url URL zahtjeva
 * @param {Object} data Tijelo zahtjeva (JSON objekat)
 * @param {number} timeout Vremensko ograničenje u milisekundama (zadano: 5000)
 * @param {Object} [opts] Dodatne opcije zahtjeva
 * @returns {Object} Rezultat odgovora
 * @returns {number} returns.code - Statusni kod (0: uspjeh, različito od nule: neuspjeh)
 * @returns {string} returns.message - Poruka o grešci (ako postoji)
 * @returns {string} returns.data - Podaci odgovora
 * @throws {Error} Baca grešku tokom validacije
 */
httpclient.post = function (url, data, timeout = 5000, opts = {}) {
    if (!url) {
        throw new Error("URL is required");
    }
    if (!data) {
        throw new Error("Data is required");
    }
    httpclient.init();
    client.reset();
    client.setOpt("timeout", timeout);
    client.setOpt("url", url);
    client.setOpt("method", "POST");
    client.setOpt("header", "Content-Type: application/json");
    client.setOpt("body", data);

    for (const [key, value] of Object.entries(opts)) {
        client.setOpt(key, value);
    }

    return client.request();
}

/**
 * Preuzimanje datoteke
 * @param {string} url URL zahtjeva
 * @param {string} localPath Lokalna putanja za spremanje
 * @param {number} timeout Vremensko ograničenje u milisekundama (zadano: 30000)
 * @param {Object} [opts] Dodatne opcije zahtjeva
 * @returns {Object} Rezultat odgovora
 * @returns {number} returns.code - Statusni kod (0: uspjeh, različito od nule: neuspjeh)
 * @returns {string} returns.message - Poruka o grešci (ako postoji)
 * @throws {Error} Baca grešku tokom validacije
 */
httpclient.download = function (url, localPath, timeout = 30000, opts = {}) {
    if (!url) {
        throw new Error("URL is required");
    }
    if (!localPath) {
        throw new Error("Local path is required");
    }
    httpclient.init();
    client.reset();
    client.setOpt("timeout", timeout);
    client.setOpt("url", url);
    client.setOpt("method", "GET");

    for (const [key, value] of Object.entries(opts)) {
        client.setOpt(key, value);
    }

    return client.downloadToFile(localPath);
}

/**
 * Upload datoteke
 * @param {string} url URL zahtjeva
 * @param {string} localPath Putanja lokalne datoteke
 * @param {number} timeout Vremensko ograničenje u milisekundama (zadano: 30000)
 * @param {Object} [opts] Dodatne opcije zahtjeva
 * @returns {Object} Rezultat odgovora
 * @returns {number} returns.code - Statusni kod (0: uspjeh, različito od nule: neuspjeh)
 * @returns {string} returns.message - Poruka o grešci (ako postoji)
 * @throws {Error} Baca grešku tokom validacije
 */
httpclient.upload = function (url, localPath, timeout = 30000, opts = {}) {
    if (!url) {
        throw new Error("URL is required");
    }
    if (!localPath) {
        throw new Error("Local path is required");
    }
    httpclient.init();
    client.reset();
    client.setOpt("url", url);
    client.setOpt("method", "POST");

    for (const [key, value] of Object.entries(opts)) {
        client.setOpt(key, value);
    }
    
    return client.uploadFile(localPath);
}

/**
 * Postavljanje opcija zahtjeva
 * @param {string} key Naziv opcije
 * @param {string|number|boolean|Function} value Vrijednost opcije
 * @throws {Error} Baca grešku kada je opcija nevažeća
 * 
 * @example
 * // Postavi URL
 * setOpt('url', 'https://example.com');
 * // Postavi metodu zahtjeva
 * setOpt('method', 'POST');
 * // Postavi zaglavlje zahtjeva
 * setOpt('header', 'Content-Type: application/json');
 * // Postavi vremensko ograničenje
 * setOpt('timeout', 5000);
 * // Postavi callback za praćenje napretka
 * setOpt('onProgress', (totaldownload, downloaded, totalupload, uploaded) => log.info(downloaded,totaldownload, uploaded,totalupload));
 * 
 * Podržane opcije:
 * - url: URL zahtjeva
 * - method: Metoda zahtjeva (GET, POST, itd.)
 * - header: Zaglavlje zahtjeva (format: 'ključ: vrijednost')
 * - body: Tijelo zahtjeva
 * - timeout: Vremensko ograničenje u milisekundama
 * - onProgress: Callback funkcija za praćenje napretka
 * - verifyPeer: Verifikacija certifikata (0: onemogući, 1: omogući)
 * - verifyHost: Verifikacija imena hosta (0: onemogući, 2: omogući)
 * - caPath: Putanja do CA certifikata
 */
httpclient.setOpt = function (key, value) {
    if (!key) {
        throw new Error("Key is required");
    }
    if (typeof key !== "string") {
        throw new Error("Key must be a string");
    }
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean" && typeof value !== "function") {
        throw new Error("Value must be a string, number, boolean, or function");
    }
    httpclient.init();
    client.setOpt(key, value);
}

/**
 * Resetovanje zahtjeva, mora se pozvati prije svakog zahtjeva.
 * Briše sve prethodne postavke zahtjeva.
 */
httpclient.reset = function () {
    httpclient.init();
    client.reset();
}

/**
 * Slanje zahtjeva, koristite ovu funkciju za složene zahtjeve
 * @returns {Object} Rezultat odgovora
 * @returns {number} returns.code - Statusni kod (0: uspjeh, različito od nule: neuspjeh)
 * @returns {string} returns.message - Poruka o grešci (ako postoji)
 * @returns {string} returns.data - Podaci odgovora
 * @throws {Error} Baca grešku tokom validacije
 */
httpclient.request = function () {
    httpclient.init();
    return client.request();
}
/**
 * Deinijalizacija klijenta
 */
httpclient.deinit = function () {
    if (client) {
        client = null;
    }
}
/**
 * Dobijanje nativnog objekta klijenta
 * @returns {httpclientClass} Nativni objekat klijenta
 */
httpclient.getNative = function () {
    httpclient.init();
    return client;
}

export default httpclient;