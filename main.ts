/*
 qtruck package
*/
 //% weight=10 icon="\uf013" color=#2896ff
namespace qtruck {

    export enum qtruck_Colors {
        //% block="Red"
        Red = 0x01,
        //% block="Green"
        Green = 0x02,
        //% block="Blue"
        Blue = 0x03,
	    //% block="Black"
        Black = 0x04,
        //% block="White"
        White = 0x05
    }

    export enum qtruck_lineFollower {
        //% blockId="S1_OUT_S2_OUT" block="Sensor1 and sensor2 are out black line"
        S1_OUT_S2_OUT = 0x00,
        //% blockId="S1_OUT_S2_IN" block="Sensor2 in black line but sensor1 not"
        S1_OUT_S2_IN = 0x01,
        //% blockId="S1_IN_S2_OUT" block="Sensor1 in black line but sensor2 not"
        S1_IN_S2_OUT = 0x02,
        //% blockId="S1_IN_S2_IN" block="Sensor1 and sensor2 are in black line "
        S1_IN_S2_IN = 0x03
     }

    export enum qtruck_colorSensorPort {
        //% block="Port 4"
        port4 = 0x04
    }

    export enum qtruck_Servos {
        //% block="servo 1"
        Servo1 = 0x01,
        //% block="servo 2"
        Servo2 = 0x02   
    }

    export enum qtruck_ultrasonicPort {
        //% block="Port 1"
        port1 = 0x01,
        //% block="Port 2"
        port2 = 0x02
    }

    export enum qtruck_touchKeyPort {
        //% block="Port 1"
        port1 = 0x01,
        //% block="Port 2"
        port2 = 0x02,
        //% block="Port 3"
        port3 = 0x03
    }

    export enum qtruck_lineFollowPort {
        //% block="Port 1"
        port1 = 0x01
    }

    
    export enum qtruck_PinIOStatus {
        //% block="Low"
        Low = 0x00,
        //% block="High"
        Hight = 0x01
    }

    export enum qtruck_LineFollowerSensor {
        //% block="Sensor 1"
        LFSensor_1 = 0x00,
        //% block="Sensor 2"
        LFSensor_2 = 0x01        
    }

    export enum qtruck_busServoPort {
        //% block="Port 6"
        port6 = 0x06
    }

    export enum qtruck_knobPort {
        //% block="Port 1"
        port1 = 0x01  
    }

    export enum qtruck_CmdType {
        //% block="Invalid command"
        NO_COMMAND = 0,
        //% block="car run"
        CAR_RUN = 1,
        //% block="Servo"
        SERVO = 2,
        //% block="Ultrasonic distance"
        ULTRASONIC = 3,
        //% block="Temperature"
        TEMPERATURE = 4,
        //% block="Sound"
        SOUND = 5,
        //% block="Light"
        LIGHT = 6,
        //% block="Voltage"
        BAT = 7,
        //% block="Rgb light"
        RGB_LIGHT = 8,
        //% block="Honk horn"
        DIDI = 9,
        //% block="Read firmware version"
        VERSION = 10,
        //% block="Read angle"
        READ_ANGLE = 11,
        //% block="Light belt"        
        RGB_BELT = 12,
        //% block="WIFI mode"
        WIFI_MODE = 13,
        //% block="Get mac"
        GET_MAC = 14
    }

    export enum qtruck_CarRunCmdType {
        //% block="Stop"
        STOP = 0,
        //% block="Go ahead"
        GO_AHEAD,
        //% block="Back"
        GO_BACK,
        //% block="Turn left"
        TURN_LEFT,
        //% block="Turn right"
        TURN_RIGHT,
        //% block="Go ahead slowly"
        GO_AHEAD_SLOW,
        //% block="Turn left slowly"
        TURN_LEFT_SLOW,
        //% block="Turn right slowly"
        TURN_RIGHT_SLOW,
        //% block="Invalid command"
        COMMAND_ERRO
    }

  /**
   * Qtruck initialization, please execute at boot time
  */
    //% weight=100 blockId=qtruck_Init block="Initialize Qtruck"
    export function qtruck_Init() {
        qtruck_initRGBLight();
        serial.redirect(
            SerialPin.P12,
            SerialPin.P8,
            BaudRate.BaudRate115200);
         
        basic.forever(() => {
            getHandleCmd();
        });
        basic.pause(2000);
    }


    let handleCmd: string = "";
    let currentVoltage: number = 0;
    let volume: number = 0;
    let lhRGBLight: QtruckRGBLight.LHqtruckRGBLight;
    let lhRGBLightBelt: QtruckRGBLight.LHqtruckRGBLight;

    let P14_ad = 0;


    let MESSAGE_MAC = 0xff;
    let MESSAGE_ANGLE = 0x100;

    let i2cPortValid: boolean = true;
    let connectStatus: boolean = false;

    let servo1Angle: number = 0xfff;
    let servo2Angle: number = 0xfff;

    let macStr: string = "";
    /**
    * Get the handle command.
    */
    function getHandleCmd() {
        let charStr: string = serial.readString();
        handleCmd = handleCmd.concat(charStr);
        let cnt: number = countChar(handleCmd, "$");
        if (cnt == 0)
            return;
        let index = findIndexof(handleCmd, "$", 0);
        if (index != -1) {
            let cmd: string = handleCmd.substr(0, index);
            if (cmd.charAt(0).compare("A") == 0 && cmd.length == 7)
            {
                let arg1Int: number = strToNumber(cmd.substr(1, 2));
                let arg2Int: number = strToNumber(cmd.substr(3, 2));
                let arg3Int: number = strToNumber(cmd.substr(5, 2));

                P14_ad = arg1Int;

                if (arg3Int != -1)
                {
                    currentVoltage = arg3Int*10353/200;
                }  

                if (arg2Int != -1)
                {
                    volume = arg2Int;
                }   
            }  
            if (cmd.charAt(0).compare("C") == 0 && cmd.length == 11)
            {
                if (lhRGBLightBelt != null)
                {
                    for (let i = 0; i < 10; i++)
                    {
                        let color = converOneChar(cmd.charAt(i + 1));
                        if(color != -1)
                             lhRGBLightBelt.setBeltPixelColor(i,color);
                    }
                    lhRGBLightBelt.show();
                }
            }
            if (cmd.charAt(0).compare("M") == 0 && cmd.length == 18)
            {
                macStr = cmd.substr(1,17);
                control.raiseEvent(MESSAGE_MAC, 1);
            }
            if (cmd.compare("WIFI_S_CONNECT") == 0)
            {
                connectStatus = true;    
            }
            if (cmd.compare("WIFI_S_DISCONNECT") == 0)
            {
                connectStatus = false;    
            }
            if (cmd.charAt(0).compare("S") == 0 && cmd.length == 5)
            {
                let arg1Int: number = strToNumber(cmd.substr(1, 1));
                let arg2Str = cmd.substr(2, 3);
                if (arg2Str.compare("XXX") == 0)
                {
                    return;
                }
                let arg2Int: number = 0;
                if (arg2Str.charAt(0).compare("F") != 0)
                {
                    arg2Int = strToNumber(arg2Str);
                }
                if (arg2Int > 1000)
                    arg2Int = 1000;
                if (arg1Int == 1)
                {
                    servo1Angle = mapRGB(arg2Int, 0, 1000, 0, 240);
                    servo1Angle -= 120;
                    control.raiseEvent(MESSAGE_ANGLE, 1);
                }
                else if (arg1Int == 2)
                {
                    servo2Angle = mapRGB(arg2Int, 0, 1000, 0, 240);
                    servo2Angle -= 120;
                    control.raiseEvent(MESSAGE_ANGLE, 2);
                }  
            }
        }
        handleCmd = "";
    }

    function checkADPortValue(value: number): number {
        if (value == -1)
            return 2;
        if (value <= 0x2E)
            return 0;
        else if (value >= 0xAA)
            return 1;
        else
            return 2;//未识别电平状态
    }

     function findIndexof(src: string,strFind: string,startIndex: number): number
     {
         for (let i = startIndex; i < src.length; i++)
         {
             if (src.charAt(i).compare(strFind) == 0)
             {
                 return i;
             }    
         }  
         return -1;
     }
 
     function countChar(src: string, strFind: string): number {
         let cnt: number = 0;
         for (let i = 0; i < src.length; i++)
         {
             if (src.charAt(i).compare(strFind) == 0)
             {
                 cnt++;
             }
         }
         return cnt;
    }
    
    function strToNumber(str: string): number {
        let num: number = 0;
        for (let i = 0; i < str.length; i++)
        {
            let tmp: number = converOneChar(str.charAt(i));
            if (tmp == -1)
                return -1;    
            if (i > 0)
                num *= 16;    
            num += tmp;
        }    
        return num;
    }

    function decStrToNumber(str: string): number {
        let num: number = 0;
        for (let i = 0; i < str.length; i++)
        {
            let tmp: number = converOneChar(str.charAt(i));
            if (tmp == -1)
                return -1;    
            if (i > 0)
                num *= 10;    
            num += tmp;
        }    
        return num;
    }

    function converOneChar(str: string): number {
        if (str.compare("0") >= 0 && str.compare("9") <= 0) {
            return parseInt(str);
        }
        else if (str.compare("A") >= 0 && str.compare("F") <= 0) {
            if (str.compare("A") == 0) {
                return 10;
            }
            else if (str.compare("B") == 0) {
                return 11;
            }
            else if (str.compare("C") == 0) {
                return 12;
            }
            else if (str.compare("D") == 0) {
                return 13;
            }
            else if (str.compare("E") == 0) {
                return 14;
            }
            else if (str.compare("F") == 0) {
                return 15;
            }
            return -1;  
        }
        else
            return -1; 
    }

/**
* Set the angle of servo 1 to 8, range of 0~180 degree
*/
//% weight=99 blockId=setServo block="Set pwm servo|index %index|angle(0~180) %angle|duration %duration"
//% angle.min=0 angle.max=180
export function setServo(index: number, angle: number, duration: number) {
    if (angle > 180 || angle < 0)
    {
        return; 
    }    
    let position = mapRGB(angle, 0, 180, 500, 2500);
   
   let buf = pins.createBuffer(10);
   buf[0] = 0x55;
   buf[1] = 0x55;
   buf[2] = 0x08;
   buf[3] = 0x03;//cmd type
   buf[4] = 0x01;
   buf[5] = duration & 0xff;
   buf[6] = (duration >> 8) & 0xff;
   buf[7] = index;
   buf[8] = position & 0xff;
   buf[9] = (position >> 8) & 0xff;
   serial.writeBuffer(buf);
}

/**
* Set the angle of bus servo 1 to 8, range of -120~120 degree
*/
//% weight=98 blockId=qtruck_setBusServo block="Set bus servo|port %port|index %index|angle(-120~1200) %angle|duration %duration"
//% angle.min=-120 angle.max=120
export function qtruck_setBusServo(port: qtruck_busServoPort,index: number, angle: number, duration: number) {
    if (angle > 120 || angle < -120)
    {
        return; 
    }    
    
    angle += 120;

    let position = mapRGB(angle, 0, 240, 0, 1000);
   
   let buf = pins.createBuffer(10);
   buf[0] = 0x55;
   buf[1] = 0x55;
   buf[2] = 0x08;
   buf[3] = 0x03;//cmd type
   buf[4] = 0x01;
   buf[5] = duration & 0xff;
   buf[6] = (duration >> 8) & 0xff;
   buf[7] = index;
   buf[8] = position & 0xff;
   buf[9] = (position >> 8) & 0xff;
   serial.writeBuffer(buf);
}

/**
* Set the servo controller to run a actiongroup
*/
//% weight=98 blockId=qtruck_runActionGroup block="Run ActionGroup|index %index|times %times"
export function qtruck_runActionGroup(index: number, times: number) {

   let buf = pins.createBuffer(7);
   buf[0] = 0x55;
   buf[1] = 0x55;
   buf[2] = 0x05;
   buf[3] = 0x06;//cmd type CMD_ACTION_GROUP_RUN
   buf[4] = index & 0xff;
   buf[5] = times & 0xff;
   buf[6] = (times >> 8) & 0xff;

   serial.writeBuffer(buf);
}

/**
 * Send read qtruck servos angle command
 */
//% weight=97 blockId=qtruck_readAngle block="Send read|%servo|angle command "
export function qtruck_readAngle(servo: qtruck_Servos)
{
    let buf = pins.createBuffer(6);
    buf[0] = 0x55;
    buf[1] = 0x55;
    buf[2] = 0x04;
    buf[3] = 0x3E;//cmd type
    buf[4] = 0x05;
    buf[5] = servo;
    serial.writeBuffer(buf);
}
   

/**
 * Do someting when Qtruck receive angle
 * @param body code to run when event is raised
 */
 //% weight=96 blockId=onQtruck_getAngle block="On Qtruck|%servo|get angle"
export function onQtruck_getAngle(servo: qtruck_Servos,body: Action) {
    control.onEvent(MESSAGE_ANGLE, servo, body);
}


 /**
  *  Get servos angle
  */
 //% weight=95 blockId=getServosAngle block="Get|%servo|angle(-120~120)"
    export function getServosAngle(servo: qtruck_Servos): number {
        if (servo == qtruck_Servos.Servo1) {
            return servo1Angle;
        }
        else if (servo == qtruck_Servos.Servo2) {
            return servo2Angle;
        }
        else
            return 0xFFF;
 }   
    
/**
*	Set the speed of the number 1 motor and number 2 motor, range of -100~100, that can control the tank to go advance or turn of.
*/
//% weight=94 blockId=qtruck_setMotorSpeed blockGap=50 block="Set motor1 speed(-100~100)|%speed1|and motor2|speed %speed2"
//% speed1.min=-100 speed1.max=100
//% speed2.min=-100 speed2.max=100
    export function qtruck_setMotorSpeed(speed1: number, speed2: number) {
        if (speed1 > 100 || speed1 < -100 || speed2 > 100 || speed2 < -100) {
            return;
        }
        speed1 = speed1 * -1;
        speed2 = speed2 * -1;
   let buf = pins.createBuffer(6);
   buf[0] = 0x55;
   buf[1] = 0x55;
   buf[2] = 0x04;
   buf[3] = 0x32;//cmd type
   buf[4] = speed1;
   buf[5] = speed2;
   serial.writeBuffer(buf);
}

  
/**
* Get the volume level detected by the sound sensor, range 0 to 255
*/
//% weight=88 blockId=qtruck_getSoundVolume block="Sound volume"
	export function qtruck_getSoundVolume(): number {	
  	    return volume;
    }	

/**
 *  Get qtruck current voltage,the unit is mV
*/
    //% weight=87 blockGap=50 blockId=qtruck_getBatVoltage block="Get qtruck current voltage (mV)"
    export function qtruck_getBatVoltage(): number {
        return currentVoltage;
    }

    const APDS9960_I2C_ADDR = 0x39;
    const APDS9960_ID_1 = 0xA8;
    const APDS9960_ID_2 = 0x9C;
    /* APDS-9960 register addresses */
    const APDS9960_ENABLE = 0x80;
    const APDS9960_ATIME  = 0x81;
    const APDS9960_WTIME  = 0x83;
    const APDS9960_AILTL  = 0x84;
    const APDS9960_AILTH  = 0x85;
    const APDS9960_AIHTL  = 0x86;
    const APDS9960_AIHTH  = 0x87;
    const APDS9960_PERS = 0x8C;
    const APDS9960_CONFIG1 = 0x8D;
    const APDS9960_PPULSE  = 0x8E;
    const APDS9960_CONTROL = 0x8F;
    const APDS9960_CONFIG2 = 0x90;
    const APDS9960_ID = 0x92;
    const APDS9960_CDATAL  = 0x94;
    const APDS9960_CDATAH  = 0x95;
    const APDS9960_RDATAL  = 0x96;
    const APDS9960_RDATAH  = 0x97;
    const APDS9960_GDATAL  = 0x98;
    const APDS9960_GDATAH  = 0x99;
    const APDS9960_BDATAL  = 0x9A;
    const APDS9960_BDATAH  = 0x9B;
    const APDS9960_POFFSET_UR = 0x9D;
    const APDS9960_POFFSET_DL = 0x9E;
    const APDS9960_CONFIG3 = 0x9F;


    /* LED Drive values */
    const LED_DRIVE_100MA = 0;

    /* ALS Gain (AGAIN) values */
    const AGAIN_4X = 1;
    
    /* Default values */
    const DEFAULT_ATIME = 219;    // 103ms
    const DEFAULT_WTIME = 246;    // 27ms
    const DEFAULT_PROX_PPULSE = 0x87;    // 16us, 8 pulses
    const DEFAULT_POFFSET_UR = 0;       // 0 offset
    const DEFAULT_POFFSET_DL = 0;       // 0 offset      
    const DEFAULT_CONFIG1 = 0x60;    // No 12x wait (WTIME) factor
    const DEFAULT_AILT = 0xFFFF;  // Force interrupt for calibration
    const DEFAULT_AIHT = 0;
    const DEFAULT_PERS = 0x11;    // 2 consecutive prox or ALS for int.
    const DEFAULT_CONFIG2 = 0x01;    // No saturation interrupts or LED boost  
    const DEFAULT_CONFIG3 = 0;       // Enable all photodiodes, no SAI
    const DEFAULT_LDRIVE = LED_DRIVE_100MA;
    const DEFAULT_AGAIN = AGAIN_4X;
    
    const OFF = 0;
    const POWER = 0;
    const AMBIENT_LIGHT = 1;
    const ALL = 7;


    function i2cwrite(reg: number, value: number) {
       let buf = pins.createBuffer(2);
       buf[0] = reg;
       buf[1] = value;
       pins.i2cWriteBuffer(APDS9960_I2C_ADDR, buf);
    }

     function i2cread(reg: number): number {
		pins.i2cWriteNumber(APDS9960_I2C_ADDR, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(APDS9960_I2C_ADDR, NumberFormat.UInt8BE);
        return val;
    }

     function InitColor(): boolean {
         let id = i2cread(APDS9960_ID);
        //  serial.writeLine("id:")
        //  serial.writeNumber(id); 
        if (!(id == APDS9960_ID_1 || id == APDS9960_ID_2)) {
            return false;
         }
        //  serial.writeLine("set mode:")
        setMode(ALL, OFF);
        i2cwrite(APDS9960_ATIME, DEFAULT_ATIME);
        i2cwrite(APDS9960_WTIME, DEFAULT_WTIME);
        i2cwrite(APDS9960_PPULSE, DEFAULT_PROX_PPULSE);
        i2cwrite(APDS9960_POFFSET_UR, DEFAULT_POFFSET_UR);
        i2cwrite(APDS9960_POFFSET_DL, DEFAULT_POFFSET_DL);
         i2cwrite(APDS9960_CONFIG1, DEFAULT_CONFIG1);
        setLEDDrive(DEFAULT_LDRIVE);
        setAmbientLightGain(DEFAULT_AGAIN);
        setLightIntLowThreshold(DEFAULT_AILT);
        setLightIntHighThreshold(DEFAULT_AIHT);
        i2cwrite(APDS9960_PERS, DEFAULT_PERS);
        i2cwrite(APDS9960_CONFIG2, DEFAULT_CONFIG2);
        i2cwrite(APDS9960_CONFIG3, DEFAULT_CONFIG3);
        return true;  
    }
        
     function setMode(mode: number, enable: number) {
         let reg_val = getMode();
         serial.writeLine("mode:");
         serial.writeNumber(reg_val);
            /* Change bit(s) in ENABLE register */
        enable = enable & 0x01;
         if (mode >= 0 && mode <= 6)
         {
             if (enable > 0)
             {
                reg_val |= (1 << mode);
             }
             else
             {
                //reg_val &= ~(1 << mode);
                 reg_val &= (0xff-(1 << mode)); 
             }
        }
         else if(mode == ALL)
         {
             if (enable > 0)
             {
                reg_val = 0x7F;
             }
             else
             {
                reg_val = 0x00;
             }
        }
        i2cwrite(APDS9960_ENABLE,reg_val);
    }
    
     function getMode(): number {
            let enable_value = i2cread(APDS9960_ENABLE);
            return enable_value;
        }

     function setLEDDrive(drive: number) {
        let val = i2cread(APDS9960_CONTROL);
            /* Set bits in register to given value */
         drive &= 0b00000011;
         drive = drive << 6;
         val &= 0b00111111;
         val |= drive;
         i2cwrite(APDS9960_CONTROL,val);
    }
    
     function setLightIntLowThreshold(threshold: number) {
        let val_low = threshold & 0x00FF;
        let val_high = (threshold & 0xFF00) >> 8;
        i2cwrite(APDS9960_AILTL, val_low);
        i2cwrite(APDS9960_AILTH,val_high);
    }

     function setLightIntHighThreshold(threshold: number) {
        let val_low = threshold & 0x00FF;
        let val_high = (threshold & 0xFF00) >> 8;
        i2cwrite(APDS9960_AIHTL, val_low);
        i2cwrite(APDS9960_AIHTH, val_high);
    }

     function enableLightSensor(interrupts: boolean) {
        setAmbientLightGain(DEFAULT_AGAIN);
        if (interrupts)
        {
            setAmbientLightIntEnable(1);
        }   
        else
        {
            setAmbientLightIntEnable(0);
        }
        enablePower();
        setMode(AMBIENT_LIGHT,1);
    }

     function setAmbientLightGain(drive: number) {
        let val = i2cread(APDS9960_CONTROL);
            /* Set bits in register to given value */
        drive &= 0b00000011;
        val &= 0b11111100;
        val |= drive;
        i2cwrite(APDS9960_CONTROL,val);
    }

     function getAmbientLightGain(): number {
        let val = i2cread(APDS9960_CONTROL);
        val &= 0b00000011;
        return val;
    }

     function enablePower() {
        setMode(POWER,1);
    }

     function setAmbientLightIntEnable(enable: number) {
        let val = i2cread(APDS9960_ENABLE);
            /* Set bits in register to given value */
        enable &= 0b00000001;
        enable = enable << 4;
        val &= 0b11101111;
        val |= enable;
        i2cwrite(APDS9960_ENABLE, val);
    }

     function readAmbientLight(): number {
        let val_byte = i2cread(APDS9960_CDATAL);
        let val = val_byte;
        val_byte = i2cread(APDS9960_CDATAH);
        val = val + val_byte << 8;
        return val;
    }
    
     function readRedLight(): number {
     
        let val_byte = i2cread(APDS9960_RDATAL);
        let val = val_byte;
        val_byte = i2cread(APDS9960_RDATAH);
        val = val + val_byte << 8;
        return val;
    }

     function readGreenLight(): number {
        
           let val_byte = i2cread(APDS9960_GDATAL);
           let val = val_byte;
           val_byte = i2cread(APDS9960_GDATAH);
           val = val + val_byte << 8;
           return val;
    }
    
     function readBlueLight(): number {
        
           let val_byte = i2cread(APDS9960_BDATAL);
           let val = val_byte;
           val_byte = i2cread(APDS9960_BDATAH);
           val = val + val_byte << 8;
           return val;
       }

/**
 * Initialize the color sensor,please execute at boot time
 */
    //% weight=86 blockId=qtruck_init_colorSensor block="Initialize color sensor port at %port"
    export function qtruck_init_colorSensor(port: qtruck_colorSensorPort) {
        if (i2cPortValid)
        {
            InitColor();
            enableLightSensor(false);
            control.waitMicros(100);
        }
        i2cPortValid = false;
    }

    /**
	 *  Color sensor return the color.
	 */
	//% weight=85 blockId=qtruck_checkCurrentColor block="Current color %color"
    export function qtruck_checkCurrentColor(color: qtruck_Colors): boolean {
		let r = readRedLight();
		let g = readGreenLight();
		let b = readBlueLight();
        let t = qtruck_Colors.Red;
    
		if (r > g)
		{
			t = qtruck_Colors.Red;
		}	
		else
		{
			t = qtruck_Colors.Green;
		}	

		if (t == qtruck_Colors.Green && g < b)
		{
			t = qtruck_Colors.Blue;
		}	
		if (t == qtruck_Colors.Red && r < b)
		{
			t = qtruck_Colors.Blue;
         }
         serial.writeNumber(r); 
         serial.writeLine("->red");
         serial.writeNumber(g); 
         serial.writeLine("->green"); 
         serial.writeNumber(b); 
         serial.writeLine("->blue"); 
        if(r < 260 && g < 260 && b < 530)
		{
            t = qtruck_Colors.Black;
            return (color == t);
        }
        else if (r > 3200 && g > 5000 && b > 7000)
        {
            t = qtruck_Colors.White;
            return (color == t);
        }
		if (t == qtruck_Colors.Blue && b > 2000) {
           // serial.writeLine("blue");
            
		}
		else if (t == qtruck_Colors.Green && g > 1200) {
           // serial.writeLine("green");
		}
		else if (t == qtruck_Colors.Red && r > 1200) {
			//serial.writeLine("red");
		}
		else
        {
            //serial.writeLine("none");
            return false;
        }		
        return (color == t);
	}

/**
* Get the obstacle avoidance sensor status,1 detect obstacle,0 no detect obstacle
*/   
   //% weight=84 blockId=qtruck_avoidSensor block="Obstacle avoidance sensor|port %port|detect obstacle"
    export function qtruck_avoidSensor(port: qtruck_touchKeyPort): boolean {
        let status = 0;
        let flag: boolean = false;
        switch (port)
        {
            case qtruck_touchKeyPort.port1:
                pins.setPull(DigitalPin.P1, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P1);
                break;
            case qtruck_touchKeyPort.port2:
                pins.setPull(DigitalPin.P13, PinPullMode.PullUp);
                status = pins.digitalReadPin(DigitalPin.P13);
                break;
            case qtruck_touchKeyPort.port3:
                if(P14_ad > 0xA)
                    status = 1
                else
                    status = 0;
                break;
        }   
        if (status == 1)
            flag = false;
        else
            flag = true;
        return flag;
    }


/**
* Get the condition of the line follower sensor
*/
    //% weight=82 blockId=qtruck_readLineFollowerStatus block="Line follower status|port %port|%status"
    export function qtruck_readLineFollowerStatus(port: qtruck_lineFollowPort, status: qtruck_lineFollower): boolean {
        let s1 = 0;
        let s2 = 0;
        switch (port)
        {
            case qtruck_lineFollowPort.port1:
                s1 = pins.analogReadPin(AnalogPin.P1);
                s2 = pins.analogReadPin(AnalogPin.P2);
                s1 = s1 * 255 / 1023;
                s2 = s2 * 255 / 1023;
                if (s1 < 100)
                    s1 = 0;
                else
                    s1 = 1;
                if (s2 < 100)
                    s2 = 0;
                else
                    s2 = 1;     
                break;
        }
        let s = ((1 & s1) << 1) | s2;
        if (s == status)
        {
            return true;
        }    
        else
        {
            return false;
        }     
    }

    /**
     * Get the line follower sensor port ad value
     */
    //% weight=81 blockId=qtruck_lineSensorValue block="Get line follower sensor|port %port|%sensor|ad value"
    export function qtruck_lineSensorValue(port: qtruck_lineFollowPort, sensor: qtruck_LineFollowerSensor): number {
        let s1 = 0;
        let s2 = 0;
        switch (port)
        {
            case qtruck_lineFollowPort.port1:
                s1 = pins.analogReadPin(AnalogPin.P1);
                s2 = pins.analogReadPin(AnalogPin.P2);
                s1 = s1 * 255 / 1023;
                s2 = s2 * 255 / 1023;
                break;
        }
        if (sensor == qtruck_LineFollowerSensor.LFSensor_1)
        {
            return 255 - s1;
        }
        else
        {
            return 255 - s2;    
        }

    }
/**
* Get the condition of the touch button,press return 1,or return 0
*/
    //% weight=80 blockId=qtruck_touchButton block="Touch button|port %port|is pressed"    
    export function qtruck_touchButton(port: qtruck_touchKeyPort): boolean {
        let status: boolean = false;
        switch (port)
        {
            case qtruck_touchKeyPort.port1:
                pins.setPull(DigitalPin.P1, PinPullMode.PullUp);
                status = !pins.digitalReadPin(DigitalPin.P1);
                break;
            case qtruck_touchKeyPort.port2:
                pins.setPull(DigitalPin.P13, PinPullMode.PullUp);
                status = !pins.digitalReadPin(DigitalPin.P13);
                break;
            case qtruck_touchKeyPort.port3:
                if(P14_ad > 0xA)
                    status = false;
                else
                    status = true;
                break;
        }
        return status;
    } 

    let distanceBak = 0;
  /**
   * Get the distance of ultrasonic detection to the obstacle 
   */  
//% weight=79 blockId=qtruck_ultrasonic  block="Ultrasonic|port %port|distance(cm)"
    export function qtruck_ultrasonic(port: qtruck_ultrasonicPort): number {
        let echoPin:DigitalPin;
        let trigPin:DigitalPin;
        switch (port)
        {
            case qtruck_ultrasonicPort.port1:
                echoPin = DigitalPin.P2;
                trigPin = DigitalPin.P1;
                break;
            case qtruck_ultrasonicPort.port2:
                echoPin = DigitalPin.P14;
                trigPin = DigitalPin.P13;
                break;
        }
        pins.setPull(echoPin, PinPullMode.PullNone);
        pins.setPull(trigPin, PinPullMode.PullNone);

        pins.digitalWritePin(trigPin, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trigPin, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trigPin, 0);
        control.waitMicros(5);
        let d = pins.pulseIn(echoPin, PulseValue.High, 25000);
        let distance = d;
        // filter timeout spikes
        if (distance == 0 && distanceBak!= 0){
            distance = distanceBak;
        }
        distanceBak = d;
        return Math.round(distance * 10 /6 /58);
  }
  
/**
* Get the ad value of the knob moudule
*/
    //% weight=78 blockId=qtruck_getKnobValue blockGap=50 block="Get knob|port %port|value(0~255)"
    export function qtruck_getKnobValue(port: qtruck_knobPort): number {
        let adValue = pins.analogReadPin(AnalogPin.P1);
        adValue = adValue * 255 / 1023;
        return adValue;
    }     
    
    /**
	 * Initialize RGB
	 */
	function qtruck_initRGBLight() {
		if (!lhRGBLight) {
			lhRGBLight = QtruckRGBLight.create(DigitalPin.P15, 6, QtruckRGBPixelMode.RGB);
        }
        qtruck_clearLight();
    }

    /**
         * Set the brightness of the strip. This flag only applies to future operation.
         * @param brightness a measure of LED brightness in 0-255. eg: 255
    */
    //% blockId="qtruck_setBrightness" block="set brightness %brightness"
    //% weight=77
    export function qtruck_setBrightness(brightness: number): void {
        lhRGBLight.setBrightness(brightness);
    }
    
    /**
     * Set the color of the colored lights, after finished the setting please perform  the display of colored lights.
     */
    //% weight=76 blockId=qtruck_setPixelRGB block="Set|%lightoffset|color to %rgb"
    export function qtruck_setPixelRGB(lightoffset: QtruckLights, rgb: QtruckRGBColors)
    { 
        lhRGBLight.setPixelColor(lightoffset, rgb);
     }
    

    /**
     * Set RGB Color argument
     */
    //% weight=75 blockId=qtruck_setPixelRGBArgs block="Set|%lightoffset|color to %rgb"
    export function qtruck_setPixelRGBArgs(lightoffset: QtruckLights, rgb: number)
    {
        lhRGBLight.setPixelColor(lightoffset, rgb);
    }


    /**
     * Display the colored lights, and set the color of the colored lights to match the use. After setting the color of the colored lights, the color of the lights must be displayed.
     */
    //% weight=74 blockId=qtruck_showLight block="Show light"
    export function qtruck_showLight() {
        lhRGBLight.show();
    }

    /**
     * Clear the color of the colored lights and turn off the lights.
     */
    //% weight=73 blockGap=50 blockId=qtruck_clearLight block="Clear light"
    export function qtruck_clearLight() {
        lhRGBLight.clear();
    }

    /**
	 * Initialize Light belt
	 */
    //% weight=72 blockId=qtruck_belt_initRGBLight block="Initialize light belt at port %port"
    export function qtruck_belt_initRGBLight(port: qtruck_ultrasonicPort) {
        switch (port)
        {
            case qtruck_ultrasonicPort.port1:
                if (!lhRGBLightBelt) {
                    lhRGBLightBelt = QtruckRGBLight.create(DigitalPin.P1, 30, QtruckRGBPixelMode.RGB);
                }
                break;
            case qtruck_ultrasonicPort.port2:
                if (!lhRGBLightBelt) {
                    lhRGBLightBelt = QtruckRGBLight.create(DigitalPin.P13, 30, QtruckRGBPixelMode.RGB);
                }
                break;
        }

        qtruck_clearLight();
    }

    /**
     * Set the color of the colored lights, after finished the setting please perform  the display of colored lights.
     */
    //% weight=71 blockId=qtruck_belt_setPixelRGB block="Set light belt|%lightoffset|color to %rgb"
    export function qtruck_belt_setPixelRGB(lightoffset: QtruckLightsBelt, rgb: QtruckRGBColors)
    { 
        lhRGBLightBelt.setBeltPixelColor(lightoffset, rgb);
     }
    
    /**
     * Display the colored lights, and set the color of the colored lights to match the use. After setting the color of the colored lights, the color of the lights must be displayed.
     */
    //% weight=70 blockId=qtruck_belt_showLight block="Show light belt"
    export function qtruck_belt_showLight() {
        lhRGBLightBelt.show();
    }

    /**
     * Clear the color of the colored lights and turn off the lights.
     */
    //% weight=69 blockGap=50 blockId=qtruck_belt_clearLight block="Clear light belt"
    export function qtruck_belt_clearLight() {
        lhRGBLightBelt.clear();
    }

	function mapRGB(x: number, in_min: number, in_max: number, out_min: number, out_max: number): number {
		return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }
    
     /**
     * Resolve the Bluetooth that phone APP send command type, the total of nine types of commands: tank display command, servo debug command, obtaining the distance of ultrasonic command, obtaining temperature command, obtain sound size rank orders, to obtain the light level command, set the color lights command, honking command, firmware version information command.
     */
    //% weight=68 blockId=qtruck_analyzeBluetoothCmd block="Get bluetooth command type %str"
    export function qtruck_analyzeBluetoothCmd(str: string): number {
        if (str.length > 6) {
            let cmdHead = str.substr(0, 3);
            
            if (cmdHead == "CMD") {
                let cmdTypeStr: string = str.substr(4, 2);
                let cmdType = strToNumber(cmdTypeStr);
                if (cmdType > qtruck_CmdType.GET_MAC || cmdType < 0) {
                    return qtruck_CmdType.NO_COMMAND;
                }
                else {
                    return cmdType;
                }
            }
            else {
                return qtruck_CmdType.NO_COMMAND;
            }
        }
        else {
            return qtruck_CmdType.NO_COMMAND;
        }
    }
    /**
     * Resolve the parameters that the phone APP send the command,there are 3 parameters of servo debug command,the other command has just one parameter.
     */
    //% weight=66  blockId=qtruck_cgetArgs block="Get bluetooth command|%str|argument at %index"
    //% index.min=1 index.max=3
    export function qtruck_getArgs(str: string, index: number): number {
        let cmdType = qtruck_analyzeBluetoothCmd(str);
        if (cmdType == qtruck_CmdType.NO_COMMAND)
        {
            return qtruck_CarRunCmdType.COMMAND_ERRO;
        }
        else {
            let dataIndex = 7;
            let subLegth = 2;
            if (index == 2)
            {
                dataIndex = 10;
                subLegth = 2;
            }
            else if (index == 3)
            {
                dataIndex = 13;
                subLegth = 4;
            } 
            if (cmdType == qtruck_CmdType.SERVO)
            {
                if (str.length < 17)
                {
                    return qtruck_CmdType.NO_COMMAND;
                }    
            }
            if ((index == 1 && str.length < 10)||(index == 2 && str.length < 13)||(index == 3 && str.length < 17))
            {
                return 0;
            }    
            let strArgs = str.substr(dataIndex, subLegth);  
            let arg = strToNumber(strArgs);
            if (arg == -1)
                return 0;
            return arg;
        }
    }

    /**
     * Returns the enumeration of the command type, which can be compared with this module after obtaining the bluetooth command type sent by the mobile phone APP.
     */
    //% weight=64 blockId=qtruck_getBluetoothCmdtype block="Bluetooth command type %type"
    export function qtruck_getBluetoothCmdtype(type: qtruck_CmdType): number {
        return type;
    }

    /**
     * The command type of the tank is stop, go ahead, back, turn left, turn right, slow down, turn left slowly, turn right slowly.
     */
    //% weight=62 blockId=qtruck_getRunCarType block="Car run type %type"
    export function qtruck_getRunCarType(type: qtruck_CarRunCmdType): number {
        return type;
    }

    /**
     * The distance from the ultrasonic obstacle is the standard command, which is sent to the mobile phone. The APP will indicate the distance of the ultrasonic obstacle.
     */
    //% weight=61 blockId=qtruck_convertUltrasonic block="Convert ultrasonic distance %data"
    export function qtruck_convertUltrasonic(data: number): string {
        let cmdStr: string = "CMD|03|";
        cmdStr += data.toString();
        cmdStr += "|$";
        return cmdStr;
    }
    
    /**
     * The conversion temperature value to standard command, sent to the mobile phone, and the APP displays the current temperature.
     */
    //% weight=60 blockId=qtruck_convertTemperature block="Convert temperature %data"
    export function qtruck_convertTemperature(data: number): string {
        let cmdStr: string = "CMD|04|";
        cmdStr += data.toString();
        cmdStr += "|$";
        return cmdStr;
    }

    /**
     * Convert the light value to the standard command and send it to the mobile phone. The APP displays the current light level (0~255).
     */
    //% weight=58 blockId=qtruck_convertLight block="Convert light %data"
    export function qtruck_convertLight(data: number): string {
        let cmdStr: string = "CMD|06|";
        cmdStr += data.toString();
        cmdStr += "|$";
        return cmdStr;
    }
    
    /**
     * Convert the battery value to the standard command and send it to the mobile phone. The APP displays the current voltage.
     */
    //% weight=56 blockId=qtruck_convertBattery blockGap=50 block="Convert battery %data"
    export function qtruck_convertBattery(data: number): string {
        let cmdStr: string = "CMD|07|";
        cmdStr += data.toString();
        cmdStr += "|$";
        return cmdStr;
    }

    /**
     * Connect to the wifi
     */
    //% weight=55 blockId=qtruck_connectWifi block="Connect to the Wifi,name|%ssid|and password %passwrd"
    export function qtruck_connectWifi(ssid: string, passwrd: string)
    {
        let buf = pins.createBuffer(ssid.length + passwrd.length + 10);
        buf[0] = 0x55;
        buf[1] = 0x55;
        buf[2] = (ssid.length + passwrd.length + 8) & 0xff;
        buf[3] = 0x3E;//cmd type
        buf[4] = 0x6;
        buf[5] = 0x22;
        for (let i = 0; i < ssid.length; i++)
        {
            buf[6 + i] = ssid.charCodeAt(i);
        }   
        buf[ssid.length + 6] = 0x22;
        buf[ssid.length + 7] = 0x2C;
        buf[ssid.length + 8] = 0x22;
        for (let i = 0; i < passwrd.length; i++)
        {
            buf[ssid.length + 9 + i] = passwrd.charCodeAt(i);
        }   
        buf[ssid.length + passwrd.length + 9] = 0x22;
        serial.writeBuffer(buf);
    }

    /**
     * Detect the device connect status
     */
    //% weight=54 blockId=qtruck_isConnectedServer block="Device is connected to server?"
    export function qtruck_isConnectedServer(): boolean
    {
        return connectStatus;
    }

    /**
     * Send get mac address command
     */
    //% weight=53 blockId=qtruck_send_getMac block="Send pair command"
    export function qtruck_send_getMac()
    {
        let buf = pins.createBuffer(5);
        buf[0] = 0x55;
        buf[1] = 0x55;
        buf[2] = 0x03;
        buf[3] = 0x3E;//cmd type
        buf[4] = 0x08;
        serial.writeBuffer(buf);
    }

    /**
     * Do someting when Qtruck receive mac adress
     * @param body code to run when event is raised
     */
    //% weight=52 blockId=onQtruck_getMac block="On qtruck get device id"
    export function onQtruck_getMac(body: Action) {
        control.onEvent(MESSAGE_MAC,1,body);
    }

    /**
     * Get device mac address
     */
    //% weight=51 blockId=qtruck_getMacAddress block="Get device id"
    export function qtruck_getMacAddress(): string
    {
        return macStr + "$";
    }
}
