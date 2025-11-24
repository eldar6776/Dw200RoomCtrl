//build:20240717
//Skup niti (thread pool), učitava više radnika (worker-a). Skup niti prima zadatke ili transakcije i zatim ih dodjeljuje slobodnim radnicima u skupu za izvršavanje, što se koristi za rješavanje uskih grla u obradi više transakcija.
//Resursi uređaja su ograničeni, broj niti ne bi trebao biti prevelik. Također, ne razmatra se situacija sa više skupova niti, globalno postoji samo jedan.
//Zavisnosti komponente: dxLogger, dxCommon, dxStd
import std from './dxStd.js'
import logger from './dxLogger.js'
import * as os from "os";
//-------------------------varijable--------------------
const pool = {}
const isMain = (os.Worker.parent === undefined)
let queueSize = 100
const queue = []
const all = {}
pool.os = os
/**
 * Inicijalizacija skupa niti, postavljanje broja radnika (worker-a) i veličine reda čekanja. Moguće je da nijedan radnik nije slobodan, pa red čekanja može keširati transakcije koje se ne mogu odmah obraditi.
 * Budući da se radnici mogu kreirati samo iz glavne niti, 'init' funkcija se također može izvršavati samo u glavnoj niti.
 * Napomena: Datoteka koja odgovara radniku ne smije sadržavati beskonačne petlje poput while(true); možete koristiti setInterval za implementaciju petlje.
 * @param {string} file Naziv datoteke koja odgovara radniku, obavezno, apsolutna putanja, obično počinje sa '/app/code/src'.
 * @param {Object} bus EventBus objekat, obavezno.
 * @param {Array} topics Grupa tema za pretplatu, obavezno.
 * @param {number} count Broj niti, nije obavezno, ne može biti manji od 1, zadano 2.
 * @param {number} maxsize Veličina keša za transakcije, nije obavezno, zadano 100. Ako premaši 100, najstarija transakcija se odbacuje.
 */
pool.init = function (file, bus, topics, count = 2, maxsize = 100) {
    if (!file) {
        throw new Error("pool init:'file' should not be empty")
    }
    if (!bus) {
        throw new Error("pool init:'bus' should not be empty")
    }
    if (!topics) {
        throw new Error("pool init:'topics' should not be empty")
    }
    if (!isMain) {
        throw new Error("pool init should be invoked in main thread")
    }
    if (!std.exist(file)) {
        throw new Error("pool init: file not found:" + file)
    }
    queueSize = maxsize
    if (count <= 1) {
        count = 1
    }
    for (let i = 0; i < count; i++) {
        const id = 'pool__id' + i
        let content = std.loadFile(file) + `
import __pool from '/app/code/dxmodules/dxWorkerPool.js'
__pool.id = '${id}'
const __parent = __pool.os.Worker.parent
__parent.onmessage = function (e) {
    if (!e.data) {
        return
    }
    let fun = __pool.callbackFunc
    if (fun) {
        try {
            fun(e.data);
            __parent.postMessage({ id: __pool.id });//Obavijesti da je obrada završena, stanje je 'idle'
        } catch (err) {
            __parent.postMessage({ id: __pool.id, error: err.stack });//Obavijesti da je obrada završena, stanje je 'idle', ali je došlo do greške
        }
    }
}
            `
        let newfile = file + '_' + id + '.js'
        std.saveFile(newfile, content)
        let worker = new os.Worker(newfile)
        all[id] = { isIdle: true, worker: worker }
        worker.onmessage = function (data) {
            if (!data.data) {
                return
            }
            const id = data.data.id
            if (id) {//Poruka o završetku obrade
                all[id].isIdle = true
                if (data.data.error) {
                    logger.error(`worker ${id} callback error:${data.data.error}`)
                }
            } else {
                const topic = data.data.topic
                if (topic) {//Poruka iz bus.fire
                    bus.fire(topic, data.data.data)
                }
            }
        }
    }
    for (let topic of topics) {
        bus.on(topic, function (d) {
            push({ topic: topic, data: d })
        })
    }

    std.setInterval(function () {
        Object.keys(all).forEach(key => {
            const obj = all[key]
            if (obj.isIdle) {
                let event = take()
                if (event) {
                    obj.isIdle = false
                    obj.worker.postMessage(event)
                }
            }
        });
    }, 5)
}
/**
 * Vraća jedinstveni identifikator (ID) niti.
 * @returns Jedinstveni identifikator radnika (worker-a).
 */
pool.getWorkerId = function () {
    if (isMain) {
        return 'main'
    } else {
        return pool.id
    }
}
/**
 * Pretplata na teme transakcija na EventBus-u. Moguće je pretplatiti se na više tema. Ova funkcija se može izvršavati samo u glavnoj niti.
 * @param {Object} bus EventBus对象
 * @param {Array} topics Grupa tema za pretplatu
 */
pool.on = function (bus, topics) {
    if (!bus) {
        throw new Error("pool onEventBus:'bus' should not be empty")
    }
    if (!topics) {
        throw new Error("pool onEventBus:'topics' should not be empty")
    }
    if (!isMain) {
        throw new Error("pool onEventBus should be invoked in main thread")
    }

}

pool.callbackFunc = null
/**
 * Nit radnika (worker thread) se pretplaćuje na događaje skupa niti (thread pool). Nije potrebno birati određene teme; svi događaji na koje je skup niti pretplaćen će biti obrađeni.
 * Ova funkcija se mora izvršavati u niti radnika, ne u glavnoj niti.
 * @param {function} cb Funkcija povratnog poziva za obradu događaja, obavezno.
 */
pool.callback = function (cb) {
    if (!cb || (typeof cb) != 'function') {
        throw new Error("pool on :The 'callback' should be a function");
    }
    if (isMain) {
        throw new Error("pool on should not be invoked in main thread")
    }
    pool.callbackFunc = cb
}

function push(item) {
    if (queue.length >= queueSize) {
        const first = JSON.stringify(queue[0])
        logger.error(`pool queue is full,removing oldest element: ${first}`)
        queue.shift(); // Ukloni najstariji element
    }
    queue.push(item);
}

function take() {
    if (queue.length === 0) {
        return null; // Vraća null kada je red prazan
    }
    return queue.shift(); // Uklanja i vraća najranije dodani element
}
export default pool
