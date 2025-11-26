//build 20240222
// The quickjs standard library provides operating system-related functions and standard IO-related functions.
import * as os from "os"
import * as std from "std"
import common from "./dxCommon.js"

const dxstd = {}
/**
 * Exit application
 * @param {number} n exit code
 */
dxstd.exit = function (n) {
    return std.exit(n);
}
/**
 * Start the timer and delay the asynchronous execution of the function
 * @param {function} func The function to be executed
 * @param {number} delay delay time (milliseconds)
 * @returns timer reference
 */
dxstd.setTimeout = function (func, delay) {
    return os.setTimeout(func, delay)
}
/**
 * Clear the specified timer
 * @param {*} handle timer reference
 */
dxstd.clearTimeout = function (handle) {
    os.clearTimeout(handle)
}
// Record timer id, used for clear, can only be cleared in the same thread
let allTimerIdsMap = {}

/**
 * interval timer
 * @param {function} callback callback function, required
 * @param {number} interval interval time, required
 * @param {boolean} once is executed immediately after creation, not required
 * @param {number} timerId timer id, not required
 */
dxstd.setInterval = function (callback, interval, once, timerId) {
    if (timerId === null || timerId === undefined) {
        timerId = new Date().getTime() + "_" + this.genRandomStr(5)
        allTimerIdsMap[timerId] = "ready"
    }
    if (once === true) {
        // Execute once immediately after creation
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
 * Clear interval timer
 * @param {number} timerId timer id, required
 */
dxstd.clearInterval = function (timerId) {
    const timer = allTimerIdsMap[timerId];
    if (timer) {
        os.clearTimeout(timer);
        delete allTimerIdsMap[timerId];
    }
}
/**
 * Delete all interval timers of the current thread. Note: only the timers created by the current thread are deleted. If there are multiple threads, each thread needs to call delete.
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
 * Generates a random string of letters and numbers of a specified length
 * @param {number} length string length, not required, default is 6
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
 * Execute a string as a javascript script
 * @param {string} str js script string
 * @param {boolean} async defaults to false, if true, the script will accept await and return a Promise
 */
dxstd.eval = function (str, async) {
    return std.evalScript(str, { async: async });
}
/**
 * Load a file content and execute it as a javascript script
 * @param {string} filename The file name of the js script content (absolute path)
 */
dxstd.loadScript = function (filename) {
    return std.loadScript(filename);
}
/**
 * Load the file and read the content in the file (using utf)
 * @param {string} filename file name
 */
dxstd.loadFile = function (filename) {
    return std.loadFile(filename)
}
/**
 * Save string to file
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
 * Make sure that the directories corresponding to the files exist. If they do not exist, they will be created.
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
 * check/determine whether the file exists
 * @param {string} filename file name
 * @returns true/false
 */
dxstd.exist = function (filename) {
    return (os.stat(filename)[1] === 0)
}
/**
 * Returns an object containing key-value pairs of environment variables.
 */
dxstd.getenviron = function () {
    return std.getenviron();
}
/**
 * Returns the value of the environment variable name, or undefined if it is not defined
 * @param {string} name variable name
 */
dxstd.getenv = function (name) {
    return std.getenv(name);
}
/**
 * Set the value of an environment variable name to a string value
 * @param {string} name variable name
 * @param {string} value variable value
 */
dxstd.setenv = function (name, value) {
    return std.setenv(name, value);
}
/**
 * Delete environment variables
 * @param {string} name variable name
 */
dxstd.unsetenv = function (name) {
    return std.unsetenv(name);
}
/**
 * Use a superset of JSON.parse to parse strings. Can parse non-standard JSON strings. The following extensions are accepted:
 * - Single and multi-line comments
 * - Unquoted attributes (JavaScript identifiers with ASCII characters only)
 * - You can add a comma at the end of arrays and objects
 * - single quoted string
 * - \f and \v are accepted as space characters
 * - Numbers can have a plus sign in front of them
 * - Octal (0oprefix) and hexadecimal (0xprefix) numbers
 * @param {string} str json string
 */
dxstd.parseExtJSON = function (str) {
    return std.parseExtJSON(str);
}
/**
 * Sleep delay_ms milliseconds
 */
dxstd.sleep = function (delay_ms) {
    return os.sleep(delay_ms);
}
/**
 * Returns a string representing the platform: "linux", "darwin", "win32", or "js".
 */
dxstd.platform = function () {
    return os.platform;
}
/**
 * Constructor function to create a new thread (worker), its API is close to WebWorkers.
 * For dynamically imported modules, it is relative to the current script or module path. Threads usually do not share any data and can share and transfer data through dxMap, dxQueue, and dxWpc. Nested workers are not supported.
 * @param {string} module_filename specifies the module file name to be executed in the newly created thread
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
 * Open a file. Returns a handle, or < 0 if an error occurs.
 * @param {string} filename file absolute path
 * @param {number} flags O_RDONLY,O_WRONLY,O_RDWR,O_APPEND,O_CREAT,O_EXCL,O_TRUNC
 * 1. O_RDONLY: Open the file in a read-only method/way
 * 2. O_WRONLY: Open the file in write-only method/way
 * 3. O_RDWR: Open the file in a readable and writable method/way
 * The above three are file access permission flags. The incoming flags parameter must contain one of these flags, and can only contain one. The opened file can only be operated according to this permission.
   譬如使用了 O_RDONLY 标志，就只能对文件进行读取操作，不能写操作。

 * 4. O_APPEND: Call the open function to open the file. Every time you use the write() function to write to the file, the current position offset of the file will be automatically moved to the end of the file.
   从文件末尾开始写入数据，也就是意味着每次写入数据都是从文件末尾开始。
   O_APPEND标志并不会影响读文件，当读取文件时， O_APPEND 标志并不会影响读位置偏移量， 
   即使使用了 O_APPEND标志，读文件位置偏移量默认情况下依然是文件头，
   使用 lseek 函数来改变 write()时的写位置偏移量也不会成功，
   当执行 write()函数时，检测到 open 函数携带了 O_APPEND 标志，所以在 write 函数内部会自动将写位置偏移量移动到文件末尾

 * 5. O_CREAT: If the file pointed to by the filename parameter does not exist, create this file
 * 6. O_EXCL: This flag is generally used in conjunction with the O_CREAT flag to specifically create files.
   在 flags 参数同时使用到了 O_CREAT 和O_EXCL 标志的情况下，如果 filename 参数指向的文件已经存在，
   则 open 函数返回错误。可以用于测试一个文件是否存在，如果不存在则创建此文件，如果存在则返回错误，这使得测试和创建两者成为一个原子操作。
 * 7. O_TRUNC: When calling the open function to open a file, all the original content of the file will be discarded and the file size will become 0;
 */
dxstd.open = function (filename, flags) {
    return os.open(filename, flags);
}
/**
 * Check/determine whether the given path is a folder.
 * @param {string} filename - The path to check.
 * @returns {boolean} Returns true if it is a folder, otherwise returns false. If it does not exist, an exception is thrown.
 */
dxstd.isDir = function (filename) {
    let stat = os.stat(filename)
    if (stat[1] != 0) {
        throw new Error("No such file:" + filename)
    }
    return ((stat[0].mode & this.S_IFMT) === this.S_IFDIR);
}
/**
 * close file
 * @param {*} fd file handle
 */
dxstd.close = function (fd) {
    return os.close(fd)
}
dxstd.SEEK_SET = std.SEEK_SET
dxstd.SEEK_CUR = std.SEEK_CUR
dxstd.SEEK_END = std.SEEK_END
/**
 * Locate in the file. Use SEEK_* to represent whence. offset can be a number or bigint. If offset is a bigint, a bigint is returned.
 * @param {*} fd file handle
 * @param {number} offset is the offset, an integer represents a positive offset, a negative number represents a negative offset
 * @param {*} whence sets the offset from the file: SEEK_SET: beginning of file; SEEK_CUR: current position; SEEK_END: ​​end of file
 */
dxstd.seek = function (fd, offset, whence) {
    return os.seek(fd, offset, whence)
}
/**
 * Read length bytes from file handlefd into the ArrayBuffer buffer at byte position offset. Returns the number of bytes read, or < 0 if an error occurs.
 * @param {*} fd file handle
 * @param {*} buffer ArrayBuffer object
 * @param {number} offset offset
 * @param {number} length The length of bytes read
 */
dxstd.read = function (fd, buffer, offset, length) {
    return os.read(fd, buffer, offset, length);
}
/**
 * Write length bytes from the byte position offset of the ArrayBuffer buffer to the file handlefd. Returns the number of bytes written, or < 0 if an error occurs.
 * @param {*} fd file handle
 * @param {*} buffer ArrayBuffer object
 * @param {*} offset offset
 * @param {*} length length in bytes written
 */
dxstd.write = function (fd, buffer, offset, length) {
    return os.write(fd, buffer, offset, length);
}
/**
 * Delete the file, success returns 0 otherwise -errno
 * @param {string} filename file absolute path
 */
dxstd.remove = function (filename) {
    return os.remove(filename)
}
/**
 * Modify the file name, success returns 0 otherwise -errno
 * @param {string} oldname absolute path of the old file
 * @param {string} newname absolute path of new file
 */
dxstd.rename = function (oldname, newname) {
    return os.rename(oldname, newname)
}
/**
 * Returns [str, err], where str is the current working directory and err is the error code
 */
dxstd.getcwd = function () {
    return os.getcwd()
}
/**
 * Change current working directory
 * @param {string} path directory, supports absolute and relative paths
 */
dxstd.chdir = function (path) {
    return os.chdir(path)
}
/**
 * Create a directory, success returns 0 otherwise -errno
 * @param {string} path directory absolute path
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
 * Returns [obj, err], where obj is an object containing the file status/state information of the path path.
 * err is the error code. The following fields are defined in obj: dev, ino, mode, nlink, uid, gid, rdev, size, blocks, atime, mtime, ctime.
 * Time is specified in milliseconds since 1970.
 * The value of mode corresponds to the following enumeration. For example, to check whether a file is a directory, you can use the method/way of (mode & S_IFMT) == S_IFDIR:
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
 * @param {string} path file or directory absolute path
 */
dxstd.stat = function (path) {
    return os.stat(path)
}
/**
 * lstat() is the same as stat() except that it returns information about the link itself.
 * @param {*} path file or directory absolute path
 */
dxstd.lstat = function (path) {
    return os.lstat(path)
}
/**
 * Returns [array, err], where array is an array of strings containing the file names at the directory path. err is the error code.
 * @param {string} path directory absolute path
 */
dxstd.readdir = function (path) {
    return os.readdir(path)
}
export default dxstd