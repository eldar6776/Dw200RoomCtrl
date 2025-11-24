/**
 * Servis za testne podatke
 * Populates database with sample access credentials for testing
 */
import log from '../../dxmodules/dxLogger.js';
import sqliteService from './sqliteService.js';

const testDataService = {};

/**
 * Inicijalizacija testnih podataka u bazi podataka
 * Adds sample QR codes, RFID cards, and PINs for testing
 */
testDataService.initTestData = function() {
    try {
        log.info('[TestDataService] Initializing test data...');
        
        const funcs = sqliteService.getFunction();
        const now = Math.floor(Date.now() / 1000);
        const oneYearLater = now + (365 * 24 * 60 * 60); // Valid for 1 year
        
        // Test QR Codes
        const testQRCodes = [
            'HOTEL-ROOM-101-GUEST-12345',
            'HOTEL-ROOM-102-GUEST-67890',
            'HOTEL123456',
            'TESTQR001',
            'STAFF-KEY-ADMIN'
        ];
        
        // Test RFID Cards  
        const testCards = [
            'AABBCCDD',
            '11223344',
            '12345678',
            'ABCD1234',
            'CARD0001',
            'bc18cef4'   // Nova kartica koju ste skenirali
        ];
        
        // Test PINs
        const testPINs = [
            '1234',
            '5678',
            '0000',
            '9999',
            '1111',
            '9876',  // Novi PIN koji ste dodali
            '4321'   // Još jedan novi PIN
        ];
        
        // Add QR codes (type 100)
        testQRCodes.forEach(code => {
            try {
                const permission = {
                    type: 100,
                    code: code,
                    startTime: now,
                    endTime: oneYearLater,
                    passTimes: 0,
                    extra: JSON.stringify({ 
                        source: 'test_data_init',
                        description: 'Test QR Code'
                    })
                };
                funcs.permissionAdd(permission);
                log.info('[TestDataService] Added test QR code:', code);
            } catch (error) {
                // Ignoriši ako već postoji
                log.debug('[TestDataService] QR code may already exist:', code);
            }
        });
        
        // RFID cards with sector data are validated directly - NO DATABASE NEEDED
        log.info('[TestDataService] RFID cards are validated via sector data only - no UID database');
        
        // Add PINs (type 300)
        testPINs.forEach(code => {
            try {
                const permission = {
                    type: 300,
                    code: code,
                    startTime: now,
                    endTime: oneYearLater,
                    passTimes: 0,
                    extra: JSON.stringify({ 
                        source: 'test_data_init',
                        description: 'Test PIN Code'
                    })
                };
                funcs.permissionAdd(permission);
                log.info('[TestDataService] Added test PIN:', code);
            } catch (error) {
                // Ignoriši ako već postoji
                log.debug('[TestDataService] PIN may already exist:', code);
            }
        });
        
        log.info('[TestDataService] Test data initialization complete');
        log.info('╔═══════════════════════════════════════════════════════════╗');
        log.info('║ Test Credentials Available:                              ║');
        log.info('║                                                           ║');
        log.info('║ QR Codes:                                                 ║');
        testQRCodes.forEach(code => {
            log.info('║   • ' + code.padEnd(55) + '║');
        });
        log.info('║                                                           ║');
        log.info('║ RFID Cards:                                               ║');
        testCards.forEach(code => {
            log.info('║   • ' + code.padEnd(55) + '║');
        });
        log.info('║                                                           ║');
        log.info('║ PIN Codes:                                                ║');
        testPINs.forEach(code => {
            log.info('║   • ' + code.padEnd(55) + '║');
        });
        log.info('╚═══════════════════════════════════════════════════════════╝');
        
        return true;
    } catch (error) {
        log.error('[TestDataService] Error initializing test data:', error);
        return false;
    }
};

export default testDataService;
