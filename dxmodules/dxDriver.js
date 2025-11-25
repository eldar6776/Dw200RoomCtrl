const dxDriver = {}

/*************************************Device Resource Enumeration*************************************/

/**
 * GPIO device pins
 */
dxDriver.GPIO = {

    // Relay
    RELAY:          105,
}

/**
 * Channel communication
 */
dxDriver.CHANNEL = {

    // 485       
    UART_PATH:      "/dev/ttyS3",

    // USBHID
	USBHID_PATH:    "/dev/hidg1",
}

/**
 * Camera related parameters
 */
dxDriver.CAPTURER = {
    // Camera image width
	WIDTH:  800,
    // Camera image height
	HEIGHT:	600,
    // Camera device files
    PATH:  "/dev/video11"
}

/**
 * PWM channel
 */
dxDriver.PWM = {
    // Buzzer
    BEEP_CHANNEL:       4,
    BEEP_GPIO:          130,
    BEEP_PERIOD_NS:     366166,
    BEEP_DUTY:          366166 * 50 / 255,
}

/**
 * GPIO pin function enumeration
 */
dxDriver.GPIO_FUNC = {
	GPIO_FUNC_3:    0x03,  //0011, GPIO as function 3 / device 3
	GPIO_OUTPUT0:   0x04,  //0100, GPIO output low  level
	GPIO_OUTPUT1:   0x05  //0101, GPIO output high level
};

/**
 * Door magnetic status
 */
dxDriver.GPIO_KEY_SEN = 30

/**
 * Open door switch
 */
dxDriver.GPIO_KEY_EXIT = 48


export default dxDriver