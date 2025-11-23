/**
 * @file nfcService.js
 * @description NFC/RFID Card Reader Service with Sector Reading
 * @module nfcService
 * 
 * Handles NFC card detection and processing
 * Supports:
 * 1. Simple RFID cards (UID only)
 * 2. Mifare Classic M1 cards with sector data (name, expiration, etc.)
 * 
 * Card Structure (Mifare Classic M1):
 * - Sector 0, Block 1: First Name (16 bytes)
 * - Sector 0, Block 2: Last Name (16 bytes)
 * - Sector 1, Block 0: Group (guest, staff, admin)
 * - Sector 1, Block 1: Room/Object ID (number)
 * - Sector 2, Block 0: Expiration Date
 *   [0] = Day (hex)
 *   [1] = Month (hex)
 *   [2] = Year (hex, 2-digit)
 *   [3] = Hour (hex)
 *   [4] = Minute (hex)
 *   [7] = Controller ID
 */

import log from '../../dxmodules/dxLogger.js'
import accessService from '../service/accessService.js'
import config from '../../dxmodules/dxConfig.js'
import driver from '../driver.js'
import dxNfc from '../../dxmodules/dxNfc.js'
import common from '../../dxmodules/dxCommon.js'
import std from '../../dxmodules/dxStd.js'

/**
 * Default Mifare Classic key (factory default)
 */
const DEFAULT_KEY = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]
const KEY_TYPE_A = 0x60

const nfcService = {}

/**
 * Read NFC card sectors and extract user data (with retry logic)
 * @param {string} cardId - Card UID
 * @param {number} retryCount - Number of retries (default 3)
 * @returns {Object|null} Parsed card data or null if reading fails
 */
function readCardSectors(cardId, retryCount = 3) {
    log.info("[NFC] Attempting to read card sectors (retry: " + retryCount + ")...")
    
    try {
        const nfcData = {
            cardId: cardId
        }
        
        let successCount = 0
        
        // Read Sector 0, Block 1 - First Name
        try {
            const block1 = dxNfc.m1cardReadSector(0, 0, 1, 1, DEFAULT_KEY, KEY_TYPE_A)
            if (block1 && block1.length > 0) {
                const filtered1 = block1.filter(x => (x !== 0) && (x !== 255))
                if (filtered1.length > 0) {
                    nfcData.firstName = common.utf8HexToStr(common.uint8ArrayToHexString(filtered1))
                    log.info("[NFC] First Name: " + nfcData.firstName)
                    successCount++
                }
            }
        } catch (e) {
            log.debug("[NFC] Could not read first name:", e.message)
        }
        
        std.sleep(50) // Small delay between reads
        
        // Read Sector 0, Block 2 - Last Name
        try {
            const block2 = dxNfc.m1cardReadSector(0, 0, 2, 1, DEFAULT_KEY, KEY_TYPE_A)
            if (block2 && block2.length > 0) {
                const filtered2 = block2.filter(x => (x !== 0) && (x !== 255))
                if (filtered2.length > 0) {
                    nfcData.lastName = common.utf8HexToStr(common.uint8ArrayToHexString(filtered2))
                    log.info("[NFC] Last Name: " + nfcData.lastName)
                    successCount++
                }
            }
        } catch (e) {
            log.debug("[NFC] Could not read last name:", e.message)
        }
        
        std.sleep(50)
        
        // Read Sector 1, Block 1 - Object ID (ASCII string like "42444")
        try {
            const block3 = dxNfc.m1cardReadSector(0, 1, 1, 1, DEFAULT_KEY, KEY_TYPE_A)
            if (block3 && block3.length > 0) {
                const filtered3 = block3.filter(x => (x !== 0) && (x !== 255))
                if (filtered3.length > 0) {
                    const objectIDStr = String.fromCharCode(...filtered3)
                    nfcData.objectID = Number(objectIDStr)
                    log.info("[NFC] Object ID: " + nfcData.objectID + " (from ASCII: " + objectIDStr + ")")
                    successCount++
                }
            }
        } catch (e) {
            log.debug("[NFC] Could not read object ID:", e.message)
        }
        
        std.sleep(50)
        
        // Read Sector 2, Block 0 - Expiration Date + Controller ID + Room Address
        try {
            const sec2Data = dxNfc.m1cardReadSector(0, 2, 0, 4, DEFAULT_KEY, KEY_TYPE_A)
            
            if (sec2Data && sec2Data.length > 0) {
                nfcData.expirationDay = parseInt(sec2Data[0].toString(16), 10)
                nfcData.expirationMonth = parseInt(sec2Data[1].toString(16), 10)
                nfcData.expirationYear = parseInt(sec2Data[2].toString(16), 10) + 2000 // 25 -> 2025
                nfcData.expirationHour = parseInt(sec2Data[3].toString(16), 10)
                nfcData.expirationMinute = parseInt(sec2Data[4].toString(16), 10)
                
                // Room/Controller Address: bytes 6-7 (16-bit BIG-ENDIAN)
                // Example: 00 01 f9 -> byte[6]=0x01, byte[7]=0xF9 -> (0x01 << 8) | 0xF9 = 505
                nfcData.roomAddress = (sec2Data[6] << 8) | sec2Data[7]
                
                // Controller ID: byte 5
                nfcData.controllerID = sec2Data[5]
                
                log.info("[NFC] Expiration: " + nfcData.expirationYear + "-" + 
                         nfcData.expirationMonth + "-" + nfcData.expirationDay + " " +
                         nfcData.expirationHour + ":" + nfcData.expirationMinute)
                log.info("[NFC] Room Address: " + nfcData.roomAddress)
                log.info("[NFC] Controller ID: " + nfcData.controllerID)
                successCount++
            }
            
        } catch (e) {
            log.debug("[NFC] Could not read expiration date:", e.message)
        }
        
        // If we read at least one field successfully, return data
        if (successCount > 0) {
            log.info("[NFC] Successfully read " + successCount + " fields from card")
            return nfcData
        }
        
        // If no fields were read and retries remain, try again
        if (retryCount > 1) {
            log.info("[NFC] No data read, retrying...")
            std.sleep(100)
            return readCardSectors(cardId, retryCount - 1)
        }
        
        log.info("[NFC] Could not read sector data after all retries")
        return null
        
    } catch (error) {
        log.error("[NFC] Error reading card sectors:", error)
        return null
    }
}

/**
 * Validate card expiration date
 * @param {Object} nfcData - Card data with expiration info
 * @returns {boolean} True if card is valid, false if expired
 */
function validateCardExpiration(nfcData) {
    if (!nfcData.expirationYear || !nfcData.expirationMonth || !nfcData.expirationDay) {
        log.info("[NFC] No expiration data - card is valid by default")
        return true
    }
    
    try {
        // Get current date/time
        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1 // 0-indexed
        const currentDay = now.getDate()
        const currentHour = now.getHours()
        const currentMinute = now.getMinutes()
        
        log.info("[NFC] Current time: " + currentYear + "-" + currentMonth + "-" + currentDay + 
                 " " + currentHour + ":" + currentMinute)
        
        // Compare dates
        if (nfcData.expirationYear < currentYear) {
            log.warn("[NFC] ❌ Card EXPIRED (year)")
            return false
        }
        
        if (nfcData.expirationYear === currentYear && nfcData.expirationMonth < currentMonth) {
            log.warn("[NFC] ❌ Card EXPIRED (month)")
            return false
        }
        
        if (nfcData.expirationYear === currentYear && 
            nfcData.expirationMonth === currentMonth && 
            nfcData.expirationDay < currentDay) {
            log.warn("[NFC] ❌ Card EXPIRED (day)")
            return false
        }
        
        if (nfcData.expirationYear === currentYear && 
            nfcData.expirationMonth === currentMonth && 
            nfcData.expirationDay === currentDay &&
            nfcData.expirationHour < currentHour) {
            log.warn("[NFC] ❌ Card EXPIRED (hour)")
            return false
        }
        
        if (nfcData.expirationYear === currentYear && 
            nfcData.expirationMonth === currentMonth && 
            nfcData.expirationDay === currentDay &&
            nfcData.expirationHour === currentHour &&
            nfcData.expirationMinute < currentMinute) {
            log.warn("[NFC] ❌ Card EXPIRED (minute)")
            return false
        }
        
        log.info("[NFC] ✅ Card is VALID (not expired)")
        return true
        
    } catch (error) {
        log.error("[NFC] Error validating expiration:", error)
        return true // Default to valid if error
    }
}

/**
 * Display welcome message on screen
 * @param {Object} nfcData - Card data with name
 */
function showWelcomeMessage(nfcData) {
    try {
        let title = "Welcome"
        let name = ""
        
        if (nfcData.firstName && nfcData.lastName) {
            name = "Mr./Ms. " + nfcData.firstName + " " + nfcData.lastName
        } else if (nfcData.firstName) {
            name = nfcData.firstName
        } else if (nfcData.lastName) {
            name = nfcData.lastName
        }
        
        if (nfcData.roomAddress) {
            title = "Welcome - Room " + nfcData.roomAddress
        }
        
        log.info("═══════════════════════════════════════════════════════════")
        log.info("  " + title)
        if (name) {
            log.info("  " + name)
        }
        log.info("═══════════════════════════════════════════════════════════")
        
        // TODO: Display on physical screen
        // screen.showMessage(title, name)
        
    } catch (error) {
        log.error("[NFC] Error showing welcome message:", error)
    }
}

/**
 * NFC card receive message handler
 * @param {Object} data - NFC card data from hardware
 */
nfcService.receiveMsg = function (data) {
    log.info('[nfcService] receiveMsg: ' + JSON.stringify(data))
    
    // Check if it's an ID card (cloud certificate)
    if (data.name && data.sex && data.idCardNo) {
        log.info("[NFC] ID Card detected: " + data.idCardNo)
        accessService.access({ type: 203, code: data.idCardNo })
        return
    }
    
    // Regular RFID card with UID
    if (data.card_type && data.id) {
        const cardId = data.id
        log.info("[NFC] Card UID: " + cardId)
        
        // Try to read sectors (Mifare Classic M1)
        const nfcData = readCardSectors(cardId)
        
        if (nfcData && (nfcData.firstName || nfcData.expirationYear || nfcData.objectID)) {
            log.info("═══════════════════════════════════════════════════════════")
            log.info("  📇 MIFARE CLASSIC CARD WITH SECTOR DATA")
            log.info("═══════════════════════════════════════════════════════════")
            
            // === VALIDATION STEP 1: Check Expiration Date ===
            const isNotExpired = validateCardExpiration(nfcData)
            
            if (!isNotExpired) {
                log.warn("[NFC] ❌ Access DENIED - Card EXPIRED")
                log.error("═══════════════════════════════════════════════════════════")
                log.error("  ⏰ CARD EXPIRED")
                log.error("═══════════════════════════════════════════════════════════")
                driver.pwm.fail()
                driver.audio.fail()
                return
            }
            
            // === VALIDATION STEP 2: Check Object ID ===
            const controllerObjectID = config.get("controller.objectID") || 0
            
            if (nfcData.objectID && controllerObjectID !== 0) {
                if (nfcData.objectID !== controllerObjectID) {
                    log.warn("[NFC] ❌ Access DENIED - Object ID mismatch")
                    log.warn("[NFC] Card Object ID: " + nfcData.objectID)
                    log.warn("[NFC] Controller Object ID: " + controllerObjectID)
                    log.error("═══════════════════════════════════════════════════════════")
                    log.error("  🚫 INVALID CARD FOR THIS LOCATION")
                    log.error("═══════════════════════════════════════════════════════════")
                    driver.pwm.fail()
                    driver.audio.fail()
                    return
                }
                log.info("[NFC] ✅ Object ID match: " + nfcData.objectID)
            }
            
            // === VALIDATION STEP 3: Check Room/Controller Address ===
            const controllerRoomAddress = config.get("controller.roomAddress") || 0
            
            if (nfcData.roomAddress && controllerRoomAddress !== 0) {
                if (nfcData.roomAddress !== controllerRoomAddress) {
                    log.warn("[NFC] ❌ Access DENIED - Room/Controller address mismatch")
                    log.warn("[NFC] Card Room Address: " + nfcData.roomAddress)
                    log.warn("[NFC] Controller Room Address: " + controllerRoomAddress)
                    log.error("═══════════════════════════════════════════════════════════")
                    log.error("  🚪 WRONG ROOM/CONTROLLER")
                    log.error("═══════════════════════════════════════════════════════════")
                    driver.pwm.fail()
                    driver.audio.fail()
                    return
                }
                log.info("[NFC] ✅ Room Address match: " + nfcData.roomAddress)
            }
            
            // === ALL VALIDATIONS PASSED ===
            log.info("[NFC] ✅ All validations passed!")
            
            // Show welcome message
            showWelcomeMessage(nfcData)
            
            // Grant access
            log.info("[NFC] ✅ Access GRANTED")
            
        } else {
            // Simple card - no sector data - NOT ALLOWED
            log.warn("[NFC] ❌ Simple RFID card (UID only) - NOT ALLOWED")
            log.warn("[NFC] Only MIFARE Classic cards with sector data are accepted")
            driver.pwm.fail()
            driver.audio.fail()
            return
        }
        
    } else {
        // Unknown format - ignore
        log.warn("[NFC] Unknown card format - ignored")
        return
    }
}

export default nfcService
