/**
 * @file code.js
 * @description QR/Barcode Scanner Worker Service
 * @module QRScannerWorker
 * 
 * Based on working example: DejaOS/dw200_update_new2/src/codeservice.js
 * This runs in a separate worker thread and continuously scans for QR codes
 */

import log from '../dxmodules/dxLogger.js'
import std from '../dxmodules/dxStd.js'
import dxCode from '../dxmodules/dxCode.js'

log.info("═══════════════════════════════════════════════════════════")
log.info("  🚀 QR SCANNER WORKER STARTED")
log.info("═══════════════════════════════════════════════════════════")

/**
 * QR Scanner configuration
 */
let code = {
    options1: { id: 'capturer1', path: '/dev/video11' },
    options2: { id: 'decoder1', name: "decoder v4", width: 800, height: 600 },
    
    init: function () {
        log.info("[QR Worker] Initializing camera and decoder...")
        log.info("[QR Worker] Camera: " + this.options1.path)
        log.info("[QR Worker] Resolution: " + this.options2.width + "x" + this.options2.height)
        dxCode.worker.beforeLoop(this.options1, this.options2)
        log.info("✅ [QR Worker] Initialization complete")
    },
    
    loop: function () {
        dxCode.worker.loop()
    }
}

/**
 * Start QR scanner service
 */
function run() {
    try {
        // Initialize camera and decoder
        code.init()
        
        log.info("[QR Worker] Starting continuous scan loop (5ms interval)...")
        
        // Continuous scanning loop
        std.setInterval(() => {
            try {
                code.loop()
            } catch (error) {
                log.error("[QR Worker Loop] Error:", error)
            }
        }, 5)
        
        log.info("✅ [QR Worker] Scanner running - waiting for QR codes...")
        log.info("═══════════════════════════════════════════════════════════")
        
    } catch (error) {
        log.error("❌ [QR Worker] Failed to start:", error)
        log.error("[QR Worker] Stack:", error.stack)
    }
}

// Start the worker
try {
    run()
} catch (error) {
    log.error("[QR Worker] Fatal error:", error)
}





