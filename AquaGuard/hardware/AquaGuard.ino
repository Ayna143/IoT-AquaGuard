// hardware/AquaGuard_Final.ino
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h" 

// --- PIN DEFINITIONS ---
#define ONE_WIRE_BUS 4
#define TDS_PIN 34 // Input-Only Pin (ADC1)
#define PH_PIN 32  // General Purpose Analog Pin (ADC1)

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;
FirebaseJson json;

float lastGoodTemp = 25.0; 
unsigned long lastFirebaseUpdate = 0; 

void setup() {
  Serial.begin(115200);
  sensors.begin();

  // --- EXPLICIT ESP32 CONFIGURATION ---
  // Forces the ESP32 to use its full 12-bit resolution (0-4095)
  analogReadResolution(12); 
  
  WiFi.begin(WIFI_HOTSPOT, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(3000);
    return; 
  }

  const int numReadings = 15; 

  // --- 1. pH SENSOR CALCULATION (Calibrated for 2.3V) ---
  int phArray[numReadings];
  for(int i = 0; i < numReadings; i++) {
    phArray[i] = analogRead(PH_PIN);
    delay(20); 
  }
  int medianRawPH = getMedian(phArray, numReadings);
  
  // ESP32 Voltage Conversion (3.3V limit / 4095 Resolution)
  float voltagePH = medianRawPH * (3.3 / 4095.0);
  
  // Baseline is set to 2.3V based on your hardware test
  float phValue = 7.0 + ((2.3 - voltagePH) / 0.1841);
  phValue = constrain(phValue, 0.0, 14.0);

  // --- 2. TDS SENSOR CALCULATION ---
  int tdsArray[numReadings];
  for(int i = 0; i < numReadings; i++) {
    tdsArray[i] = analogRead(TDS_PIN);
    delay(20);
  }
  int medianRawTDS = getMedian(tdsArray, numReadings);
  
  // ESP32 Voltage Conversion
  float voltageTDS = medianRawTDS * (3.3 / 4095.0);
  
  // Temp compensated TDS formula
  float tdsPpm = (voltageTDS / (1.0 + 0.02 * (lastGoodTemp - 25.0))) * 500;

  // --- 3. TEMPERATURE SENSOR ---
  sensors.requestTemperatures();
  float temp = sensors.getTempCByIndex(0);

  if (temp == DEVICE_DISCONNECTED_C || temp <= -100 || temp == 85.0) {
    temp = lastGoodTemp; 
  } else {
    lastGoodTemp = temp; 
  }

  // --- CALCULATE HEALTH PERCENTAGE ---
  int tdsHealthScore = getTdsHealthPercent(tdsPpm);

  // --- 4. DEBUG LOGGING ---
  Serial.print("pH Volts: "); Serial.print(voltagePH, 2);
  Serial.print("V | pH: "); Serial.print(phValue, 2);
  Serial.print("  ||  TDS: "); Serial.print((int)tdsPpm);
  Serial.print("ppm (Health: "); Serial.print(tdsHealthScore); // Added health score to monitor
  Serial.print("%) | Temp: "); Serial.println(temp);

  // --- 5. PUSH TO FIREBASE (Every 5 Seconds) ---
  if (millis() - lastFirebaseUpdate >= 5000) {
    lastFirebaseUpdate = millis(); 

    json.clear(); 
    json.set("ph", phValue);
    json.set("tds", (int)tdsPpm);
    json.set("tds_health_percent", tdsHealthScore); // <-- Pushing new UI Variable
    json.set("temp", temp);
    json.set("timestamp", millis()); 

    if (Firebase.updateNode(firebaseData, "/aquarium", json)) {
      Serial.println("---> Firebase Sync Successful");
    } else {
      Serial.println("---> Firebase Error: " + firebaseData.errorReason());
    }
  }
}

// --- TDS TO PERCENTAGE TRANSLATOR ---
int getTdsHealthPercent(float ppm) {
  if (ppm >= 150 && ppm <= 300) {
    return 100; // Perfect zone
  } 
  else if (ppm >= 100 && ppm < 150) {
    return map(ppm, 100, 149, 50, 99); // Low but acceptable
  } 
  else if (ppm > 300 && ppm <= 500) {
    return map(ppm, 301, 500, 99, 50); // High but acceptable
  } 
  else if (ppm < 100) {
    return map(ppm, 0, 99, 0, 49); // Too low
  } 
  else { 
    // ppm > 500 (Too high)
    int percent = map(ppm, 501, 600, 49, 0);
    return constrain(percent, 0, 49); // Prevent negative numbers
  }
}

// --- MEDIAN FILTER LOGIC ---
int getMedian(int bArray[], int iFilterLen) {
  int bTab[iFilterLen];
  for (byte i = 0; i < iFilterLen; i++) {
    bTab[i] = bArray[i];
  }
  int i, j, bTemp;
  for (j = 0; j < iFilterLen - 1; j++) {
    for (i = 0; i < iFilterLen - j - 1; i++) {
      if (bTab[i] > bTab[i + 1]) {
        bTemp = bTab[i];
        bTab[i] = bTab[i + 1];
        bTab[i + 1] = bTemp;
      }
    }
  }
  return (iFilterLen & 1) ? bTab[iFilterLen / 2] : (bTab[iFilterLen / 2] + bTab[iFilterLen / 2 - 1]) / 2;
}