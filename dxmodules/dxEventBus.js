//build:20240628
//Event Bus, koristi komunikaciju podataka između workera u QuickJS-u za slanje obavijesti o događajima između niti.
//Workeri ne mogu direktno komunicirati jedni s drugima, već se moraju preusmjeravati preko roditeljske (glavne) niti, stoga je potrebno implementirati 5 mogućih scenarija obavijesti o događajima:
//1. worker1 ---> parent ---> worker2
//2. worker3 ---> parent
//3. parent ---> worker4
//4. parent <--> parent
//5. worker5 <--> worker5, također se preusmjerava preko parenta
//Zavisnosti komponente: dxLogger, dxCommon
import std from './dxStd.js'
import logger from './dxLogger.js'
import * as os from "os";
//-------------------------variable--------------------
const bus = {}
const all = {}
const subs = {}
const isMain = (os.Worker.parent === undefined)
bus.id = isMain ? '__main' : null
/**
 * Pokreće workera na busu i dodjeljuje mu jedinstveni ID.
 * Budući da se workeri mogu kreirati samo iz glavne niti, funkcija newWorker se također može izvršiti samo u glavnoj niti.
 * Napomena: Datoteka koja odgovara workeru ne smije sadržavati beskonačne petlje poput while(true), inače neće primati poruke. Možete koristiti setInterval za implementaciju petlje.
 * @param {string} id Jedinstveni identifikator workera, ne smije biti prazan.
 * @param {string} file Naziv datoteke koja odgovara workeru, apsolutna putanja, obično počinje sa '/app/code/src'.
 */
bus.newWorker = function (id, file) {
    if (!id) {
        throw new Error("eventbus newWorker:'id' should not be empty")
    } if (!file) {
        throw new Error("eventbus newWorker:'file' should not be empty")
    }
    if (!isMain) {
        throw new Error("evnetbus newWorker should be invoke in main thread")
    }
    if (!std.exist(file)) {
        throw new Error("eventbus newWorker: file not found:" + file)
    }
    let content = std.loadFile(file) + `
import __bus from '/app/code/dxmodules/dxEventBus.js'
__bus.id='${id}'
Object.keys(__bus.handlers).forEach(key => {
    __bus.os.Worker.parent.postMessage({ __sub: key, id: __bus.id })
})
__bus.os.Worker.parent.onmessage = function (e) {
    if(!e.data){
        return
    }
    e = e.data
    if (!e || !e.topic) {
        return
    }
    let fun = __bus.handlers[e.topic]
    if (fun) {
        fun(e.data)
    }
}
    `
    let newfile = file + '_' + id + '.js'
    std.saveFile(newfile, content)
    let worker = new os.Worker(newfile)
    all[id] = worker
    worker.onmessage = function (data) {
        if (data.data) {
            if (data.data.__sub) {
                sub(data.data.__sub, data.data.id)
                return
            }
            //Podaci poslani od strane workera ponovo pozivaju 'fire' glavne niti, ili ih glavna nit sama troši, ili ih prosljeđuje drugim workerima.
            bus.fire(data.data.topic, data.data.data)
        }
    }
}
/**
 * Briše odgovarajućeg workera prema ID-u, tako da se nit workera može normalno završiti.
 * @param {string} id 
 */
bus.delWorker = function (id) {
    delete all[id]
}
/**
 * Pokreće događaj. Ovaj događaj će se odmah poslati. Ako je obrada primljene poruke dugotrajna, to neće utjecati na redoslijed slanja događaja niti će doći do gubitka događaja.
 * Isti događaj može imati više pretplatnika i može istovremeno obavijestiti više pretplatnika. U jedinici vremena, za isti topic se obrađuje samo jedan događaj.
 * Tek nakon što svi pretplatnici obrade trenutni topic, dozvoljeno je obrađivati sljedeći događaj istog topica.
 * 
 * @param {string} topic Identifikator/tema događaja
 * @param {*} data Podaci priloženi uz događaj
 */
bus.fire = function (topic, data) {
    if (!topic || (typeof topic) != 'string') {
        throw new Error("eventbus :'topic' should not be null");
    }
    if (isMain) {
        if (subs[topic] && subs[topic].length > 0) {
            for (let i = 0; i < subs[topic].length; i++) {
                const id = subs[topic][i]
                if (id === '__main' && bus.handlers[topic]) {
                    bus.handlers[topic](data)
                } else {
                    const worker = all[id]
                    if (worker) {
                        worker.postMessage({ topic: topic, data: data })
                    }
                }
            }
        }
    } else {
        os.Worker.parent.postMessage({ topic: topic, data: data })
    }
}


bus.handlers = {}
/**
 * Pretplata na događaj
 * @param {string} topic Identifikator/tema događaja, obavezno.
 * @param {function} callback Funkcija povratnog poziva za obradu događaja, obavezno.
 */
bus.on = function (topic, callback) {
    if (!topic || (typeof topic) != 'string') {
        throw new Error("The 'topic' should not be null");
    }
    if (!callback || (typeof callback) != 'function') {
        throw new Error("The 'callback' should be a function");
    }
    sub(topic, bus.id)
    this.handlers[topic] = callback
}
function sub(topic, id) {
    if (isMain) {
        if (!subs[topic]) {
            subs[topic] = []
        }
        if (!subs[topic].includes(id)) {
            subs[topic].push(id)
        }
    } else {
        if (id != null) {
            os.Worker.parent.postMessage({ __sub: topic, id: id })
        }
    }
}
bus.os = os
export default bus
