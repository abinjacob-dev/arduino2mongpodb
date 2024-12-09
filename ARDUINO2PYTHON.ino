#include <PZEM004Tv30.h>
#include <SoftwareSerial.h>

#if defined(ESP32)
    #error "Software Serial is not supported on the ESP32"
#endif

/* Use software serial for the PZEM
 * Pin 12 Rx (Connects to the Tx pin on the PZEM)
 * Pin 13 Tx (Connects to the Rx pin on the PZEM)
*/
#if !defined(PZEM_RX_PIN) && !defined(PZEM_TX_PIN)
#define PZEM_RX_PIN 12
#define PZEM_TX_PIN 13
#endif

SoftwareSerial pzemSWSerial(PZEM_RX_PIN, PZEM_TX_PIN);
PZEM004Tv30 pzem(pzemSWSerial);

void setup() {
    /* Debugging serial */
    Serial.begin(115200);
}

void loop() {
    // Read the data from the sensor
    float voltage = pzem.voltage();
    float current = pzem.current();
    float power = pzem.power();
    float energy = pzem.energy();
    float frequency = pzem.frequency();
    float pf = pzem.pf();

    // Check if the data is valid and send to serial
    if(isnan(voltage) || isnan(current) || isnan(power) || isnan(energy) || isnan(frequency) || isnan(pf)) {
        Serial.println("Invalid data");
    } else {
        // Send data to serial in a structured format
        Serial.print(voltage);      
        Serial.print(",");
        Serial.print(current);      
        Serial.print(",");
        Serial.print(power);        
        Serial.print(",");
        Serial.print(energy, 3); 
        Serial.print(",");
        Serial.print(frequency, 1); 
        Serial.print(",");
        Serial.println(pf);
    }

    delay(1000);
}
