const dxDriver = {}

/*************************************Enumeracija resursa uređaja*************************************/

/**
 * GPIO pinovi uređaja
 */
dxDriver.GPIO = {

    // Relej
    RELAY:          105,
}

/**
 * Channel communication
 */
dxDriver.CHANNEL = {

    // 485
    UART_PATH:      "/dev/ttyS3",

    // USBHID (USB Human Interface Device)
	USBHID_PATH:    "/dev/hidg1",
}

/**
 * Parametri vezani za kameru
 */
dxDriver.CAPTURER = {
    // Širina slike kamere
	WIDTH:  800,
    // Visina slike kamere
	HEIGHT:	600,
    // Datoteke uređaja kamere
    PATH:  "/dev/video11"
}

/**
 * PWM channel
 */
dxDriver.PWM = {
    // Zujalica
    BEEP_CHANNEL:       4,
    BEEP_GPIO:          130,
    BEEP_PERIOD_NS:     366166,
    BEEP_DUTY:          366166 * 50 / 255,
}

/**
 * Enumeracija funkcija GPIO pinova
 */
dxDriver.GPIO_FUNC = {
	GPIO_FUNC_3:    0x03,  //0011, GPIO kao funkcija 3 / uređaj 3
	GPIO_OUTPUT0:   0x04,  //0100, GPIO izlaz niskog nivoa
	GPIO_OUTPUT1:   0x05  //0101, GPIO izlaz visokog nivoa
};

/**
 * Status magnetnog senzora vrata
 */
dxDriver.GPIO_KEY_SEN = 30

/**
 * Prekidač za otvaranje vrata
 */
dxDriver.GPIO_KEY_EXIT = 48


export default dxDriver