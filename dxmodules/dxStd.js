//build 20240222
//QuickJS standardna biblioteka, pruža funkcije vezane za operativni sistem i standardne I/O funkcije.
import * as os from "os"
import * as std from "std"
import common from "./dxCommon.js"

const dxstd = {}
/**
 * Izlaz iz aplikacije
 * @param {number} n Izlazni kod
 */
dxstd.exit = function (n) {
    return std.exit(n);
}
/**
 * Pokreće tajmer, asinhrono izvršava funkciju sa odgodom.
 * @param {function} func Funkcija koju treba izvršiti
 * @param {number} delay Vrijeme odgode (u milisekundama)
 * @returns Referenca na tajmer
 */
dxstd.setTimeout = function (func, delay) {
    return os.setTimeout(func, delay)
}
/**
 * Briše navedeni tajmer
 * @param {*} handle Referenca na tajmer
 */
dxstd.clearTimeout = function (handle) {
    os.clearTimeout(handle)
}
// Zapisuje ID tajmera, koristi se za brisanje (clear), može se brisati samo unutar iste niti.
let allTimerIdsMap = {}

/**
 * Intervalni tajmer
 * @param {function} callback Funkcija povratnog poziva, obavezno
 * @param {number} interval Vremenski interval, obavezno
 * @param {boolean} once Izvrši jednom odmah nakon kreiranja, nije obavezno
 * @param {number} timerId ID tajmera, nije obavezno
 */
dxstd.setInterval = function (callback, interval, once, timerId) {
    if (timerId === null || timerId === undefined) {
        timerId = new Date().getTime() + "_" + this.genRandomStr(5)
        allTimerIdsMap[timerId] = "ready"
    }
    if (once === true) {
        // Izvrši jednom odmah nakon kreiranja
        os.setTimeout(() => {
            if (allTimerIdsMap[timerId]) {
                callback()
            }
        }, 0);
    }
    if (!allTimerIdsMap[timerId]) {
        return
    }
    allTimerIdsMap[timerId] = os.setTimeout(() => {
        if (allTimerIdsMap[timerId]) {
            callback()
            this.setInterval(callback, interval, false, timerId)
        }
    }, interval);
    return timerId
}

/**
 * Briše intervalni tajmer
 * @param {number} timerId ID tajmera, obavezno
 */
dxstd.clearInterval = function (timerId) {
    const timer = allTimerIdsMap[timerId];
    if (timer) {
        os.clearTimeout(timer);
        delete allTimerIdsMap[timerId];
    }
}
/**
 * Briše sve intervalne tajmere trenutne niti. Napomena: Brišu se samo tajmeri kreirani u trenutnoj niti. Ako postoji više niti, svaka nit mora pozvati brisanje.
 */
dxstd.clearIntervalAll = function () {
    for (let timerId in allTimerIdsMap) {
        if (allTimerIdsMap.hasOwnProperty(timerId)) {
            os.clearTimeout(allTimerIdsMap[timerId]);
            delete allTimerIdsMap[timerId];
        }
    }
}
/**
 * Generiše nasumični string zadane dužine, sastavljen od slova i brojeva.
 * @param {number} length Dužina stringa, nije obavezno, zadano je 6.
 * @returns 
 */
dxstd.genRandomStr = function (length = 6) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length)
        result += charset.charAt(randomIndex)
    }
    return result
}
/**
 * Izvršava string kao JavaScript skriptu.
 * @param {string} str String sa JS skriptom
 * @param {boolean} async Zadano je false. Ako je true, skripta će prihvatiti await i vratiti Promise.
 */
dxstd.eval = function (str, async) {
    return std.evalScript(str, { async: async });
}
/**
 * Učitava sadržaj datoteke i izvršava ga kao JavaScript skriptu.
 * @param {string} filename Naziv datoteke sa sadržajem JS skripte (apsolutna putanja)
 */
dxstd.loadScript = function (filename) {
    return std.loadScript(filename);
}
/**
 * Učitava datoteku, čita sadržaj datoteke (koristeći UTF-8).
 * @param {string} filename Naziv datoteke
 */
dxstd.loadFile = function (filename) {
    return std.loadFile(filename)
}
/**
 * Sprema string u datoteku
 * @param {string} filename 
 * @param {string} content 
 */
dxstd.saveFile = function (filename, content) {
    if (!content || (typeof content) != 'string') {
        throw new Error("The 'content' value should be string and not empty")
    }
    if (!filename) {
        throw new Error("The 'filename' should not be empty")
    }
    if (!this.exist(filename)) {
        this.ensurePathExists(filename)
        let fd = os.open(filename, os.O_RDWR | os.O_CREAT | os.O_TRUNC);
        if (fd < 0) {
            throw new Error("Create file failed:" + filename)
        }
        os.close(fd)
    }
    let fd = std.open(filename, "w");
    fd.puts(content)
    fd.flush();
    fd.close();
    common.systemBrief('sync')
    return true
}
/**
 * Osigurava da svi direktoriji koji odgovaraju datoteci postoje; ako ne postoje, kreira ih.
 * @param {string} filename 
 */
dxstd.ensurePathExists = function (filename) {
    const pathSegments = filename.split('/');
    let currentPath = '';
    for (let i = 0; i < pathSegments.length - 1; i++) {
        currentPath += pathSegments[i] + '/';
        if (!this.exist(currentPath)) {
            this.mkdir(currentPath);
        }
    }
}
/**
 * Provjerava da li datoteka postoji.
 * @param {string} filename  Naziv datoteke
 * @returns true/false
 */
dxstd.exist = function (filename) {
    return (os.stat(filename)[1] === 0)
}
/**
 * Vraća objekat koji sadrži parove ključ-vrijednost okruženjskih varijabli.
 */
dxstd.getenviron = function () {
    return std.getenviron();
}
/**
 * Vraća vrijednost okruženjske varijable sa datim imenom, ili undefined ako nije definirana.
 * @param {string} name Naziv varijable
 */
dxstd.getenv = function (name) {
    return std.getenv(name);
}
/**
 * Postavlja vrijednost okruženjske varijable na datu string vrijednost.
 * @param {string} name Naziv varijable
 * @param {string} value Vrijednost varijable
 */
dxstd.setenv = function (name, value) {
    return std.setenv(name, value);
}
/**
 * Briše okruženjsku varijablu.
 * @param {string} name Naziv varijable
 */
dxstd.unsetenv = function (name) {
    return std.unsetenv(name);
}
/**
 * Koristi nadskup JSON.parse za parsiranje stringa. Može parsirati nestandardne JSON stringove. Prihvata sljedeća proširenja:
 * - Jednolinijski i višelinijski komentari
 * - Atributi bez navodnika (samo JavaScript identifikatori sa ASCII karakterima)
 * - Nizovi i objekti mogu imati zarez na kraju
 * - Stringovi sa jednostrukim navodnicima
 * - \f i \v se prihvataju kao razmaci
 * - Brojevi mogu imati znak plus ispred
 * - Oktalni (prefiks 0o) i heksadecimalni (prefiks 0x) brojevi
 * @param {string} str JSON string
 */
dxstd.parseExtJSON = function (str) {
    return std.parseExtJSON(str);
}
/**
 * Spava `delay_ms` milisekundi.
 */
dxstd.sleep = function (delay_ms) {
    return os.sleep(delay_ms);
}
/**
 * Vraća string koji predstavlja platformu: "linux", "darwin", "win32" ili "js".
 */
dxstd.platform = function () {
    return os.platform;
}
/**
 * Konstruktor za kreiranje nove niti (worker), čiji je API sličan WebWorkers.
 * Za dinamički uvezene module, putanja je relativna u odnosu na trenutnu skriptu ili putanju modula. Niti obično ne dijele nikakve podatke; podaci se mogu dijeliti i prenositi putem dxMap, dxQueue, dxWpc. Ugniježđeni workeri nisu podržani.
 * @param {string} module_filename Specificira naziv datoteke modula koji će se izvršiti u novokreiranoj niti.
 */
dxstd.Worker = function (module_filename) {
    return new os.Worker(module_filename)
}

dxstd.O_RDONLY = os.O_RDONLY
dxstd.O_WRONLY = os.O_WRONLY
dxstd.O_RDWR = os.O_RDWR
dxstd.O_APPEND = os.O_APPEND
dxstd.O_CREAT = os.O_CREAT
dxstd.O_EXCL = os.O_EXCL
dxstd.O_TRUNC = os.O_TRUNC
/**
 * Otvara datoteku. Vraća rukovatelja (handle), ili < 0 ako dođe do greške.
 * @param {string} filename Apsolutna putanja do datoteke
 * @param {number} flags O_RDONLY,O_WRONLY,O_RDWR,O_APPEND,O_CREAT,O_EXCL,O_TRUNC
 * 1. O_RDONLY: Otvara datoteku samo za čitanje.
 * 2. O_WRONLY: Otvara datoteku samo za pisanje.
 * 3. O_RDWR: Otvara datoteku za čitanje i pisanje.
 * Gornja tri su zastavice za dozvole pristupa datoteci. Proslijeđeni `flags` parametar mora sadržavati jednu od ovih zastavica, i to samo jednu. Otvorena datoteka se može koristiti samo u skladu sa tom dozvolom.
   Na primjer, ako se koristi zastavica O_RDONLY, može se samo čitati iz datoteke, ne i pisati.

 * 4. O_APPEND: Kada se datoteka otvori sa `open` funkcijom, svaki put kada se koristi `write()` funkcija za pisanje u datoteku, pomak trenutne pozicije datoteke se automatski pomjera na kraj datoteke,
   i podaci se počinju pisati sa kraja datoteke, što znači da se svaki put podaci pišu na kraj datoteke.
   Zastavica O_APPEND ne utiče na čitanje datoteke. Prilikom čitanja datoteke, zastavica O_APPEND ne utiče na pomak pozicije čitanja.
   Čak i ako se koristi zastavica O_APPEND, pomak pozicije čitanja je i dalje podrazumijevano na početku datoteke.
   Korištenje `lseek` funkcije za promjenu pomaka pozicije pisanja za `write()` neće uspjeti.
   Kada se izvrši `write()` funkcija, ako se detektuje da je `open` funkcija imala zastavicu O_APPEND, unutar `write` funkcije će se automatski pomjeriti pomak pozicije pisanja na kraj datoteke.

 * 5. O_CREAT: Ako datoteka na koju ukazuje `filename` parametar ne postoji, kreira se.
 * 6. O_EXCL: Ova zastavica se obično koristi zajedno sa O_CREAT zastavicom, za eksplicitno kreiranje datoteke.
   Ako se u `flags` parametru istovremeno koriste O_CREAT i O_EXCL zastavice, a datoteka na koju ukazuje `filename` parametar već postoji,
   `open` funkcija vraća grešku. Može se koristiti za testiranje da li datoteka postoji; ako ne postoji, kreira se, a ako postoji, vraća grešku. Ovo čini testiranje i kreiranje atomskom operacijom.
 * 7. O_TRUNC: Kada se datoteka otvori sa `open` funkcijom, sav originalni sadržaj datoteke se odbacuje, a veličina datoteke postaje 0.
 */
dxstd.open = function (filename, flags) {
    return os.open(filename, flags);
}
/**
 * Provjerava da li je data putanja direktorij.
 * @param {string} filename - Putanja za provjeru.
 * @returns {boolean} Vraća true ako je direktorij, inače false. Ako ne postoji, baca izuzetak.
 */
dxstd.isDir = function (filename) {
    let stat = os.stat(filename)
    if (stat[1] != 0) {
        throw new Error("No such file:" + filename)
    }
    return ((stat[0].mode & this.S_IFMT) === this.S_IFDIR);
}
/**
 * Zatvara datoteku.
 * @param {*} fd Rukovatelj datoteke
 */
dxstd.close = function (fd) {
    return os.close(fd)
}
dxstd.SEEK_SET = std.SEEK_SET
dxstd.SEEK_CUR = std.SEEK_CUR
dxstd.SEEK_END = std.SEEK_END
/**
 * Pozicioniranje unutar datoteke. Koristite SEEK_* da biste označili `whence`. `offset` može biti broj ili bigint. Ako je `offset` bigint, vraća se bigint.
 * @param {*} fd Rukovatelj datoteke
 * @param {number} offset Pomak, pozitivan cijeli broj označava pomak naprijed, negativan pomak nazad.
 * @param {*} whence Postavlja odakle u datoteci početi pomak: SEEK_SET: početak datoteke; SEEK_CUR: trenutna pozicija; SEEK_END: kraj datoteke.
 */
dxstd.seek = function (fd, offset, whence) {
    return os.seek(fd, offset, whence)
}
/**
 * Čita `length` bajtova iz rukovatelja datoteke `fd` u ArrayBuffer bafer na poziciji bajta `offset`. Vraća broj pročitanih bajtova, ili < 0 ako dođe do greške.
 * @param {*} fd Rukovatelj datoteke
 * @param {*} buffer ArrayBuffer对象
 * @param {number} offset Pomak
 * @param {number} length Dužina pročitanih bajtova
 */
dxstd.read = function (fd, buffer, offset, length) {
    return os.read(fd, buffer, offset, length);
}
/**
 * Piše `length` bajtova iz ArrayBuffer bafera sa pozicije bajta `offset` u rukovatelja datoteke `fd`. Vraća broj upisanih bajtova, ili < 0 ako dođe do greške.
 * @param {*} fd Rukovatelj datoteke
 * @param {*} buffer ArrayBuffer对象
 * @param {*} offset Pomak
 * @param {*} length Dužina upisanih bajtova
 */
dxstd.write = function (fd, buffer, offset, length) {
    return os.write(fd, buffer, offset, length);
}
/**
 * Briše datoteku. Vraća 0 u slučaju uspjeha, inače -errno.
 * @param {string} filename Apsolutna putanja do datoteke
 */
dxstd.remove = function (filename) {
    return os.remove(filename)
}
/**
 * Mijenja naziv datoteke. Vraća 0 u slučaju uspjeha, inače -errno.
 * @param {string} oldname Stara apsolutna putanja do datoteke
 * @param {string} newname Nova apsolutna putanja do datoteke
 */
dxstd.rename = function (oldname, newname) {
    return os.rename(oldname, newname)
}
/**
 * Vraća [str, err], gdje je `str` trenutni radni direktorij, a `err` je kod greške.
 */
dxstd.getcwd = function () {
    return os.getcwd()
}
/**
 * Mijenja trenutni radni direktorij.
 * @param {string} path Direktorij, podržava apsolutne i relativne putanje.
 */
dxstd.chdir = function (path) {
    return os.chdir(path)
}
/**
 * Kreira direktorij. Vraća 0 u slučaju uspjeha, inače -errno.
 * @param {string} path Apsolutna putanja do direktorija
 */
dxstd.mkdir = function (path) {
    return os.mkdir(path)
}
dxstd.S_IFMT = os.S_IFMT
dxstd.S_IFIFO = os.S_IFIFO
dxstd.S_IFCHR = os.S_IFCHR
dxstd.S_IFDIR = os.S_IFDIR
dxstd.S_IFBLK = os.S_IFBLK
dxstd.S_IFREG = os.S_IFREG
dxstd.S_IFSOCK = os.S_IFSOCK
dxstd.S_IFLNK = os.S_IFLNK
dxstd.S_ISGID = os.S_ISGID
dxstd.S_ISUID = os.S_ISUID
/**
 * 返回 [obj, err]，其中 obj 是一个包含路径path的文件状态信息的对象。
 * err 是错误代码。obj 中定义了以下字段：dev、ino、mode、nlink、uid、gid、rdev、size、blocks、atime、mtime、ctime。
 * 时间以自1970年以来的毫秒为单位指定。
 * 其中mode的值对应以下枚举,例如，检查一个文件是否是目录可以使用 (mode & S_IFMT) == S_IFDIR 的方式:
   S_IFMT：位掩码，用于提取文件类型部分的位。这是一个用于屏蔽文件类型位的常量。
   S_IFIFO：表示FIFO（命名管道）。
   S_IFCHR：表示字符设备。
   S_IFDIR：表示目录。
   S_IFBLK：表示块设备。
   S_IFREG：表示常规文件。
   S_IFSOCK：表示套接字。
   S_IFLNK：表示符号链接。
   S_ISGID：设置组ID位。
   S_ISUID：设置用户ID位。
 * @param {string} path 文件或目录绝对路径 
 */
dxstd.stat = function (path) {
    return os.stat(path)
}
/**
 * lstat() 与 stat() 相同，只是它返回关于链接本身的信息。
 * @param {*} path 文件或目录绝对路径 
 */
dxstd.lstat = function (path) {
    return os.lstat(path)
}
/**
 * 返回 [array, err]，其中 array 是包含目录路径下的文件名的字符串数组。err 是错误代码。
 * @param {string} path 目录绝对路径 
 */
dxstd.readdir = function (path) {
    return os.readdir(path)
}
export default dxstd