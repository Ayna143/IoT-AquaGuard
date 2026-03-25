// hardware/AquaGuard.ino
#include <WiFi.h>
#include <FirebaseESP32.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h" // This links to your second tab

// Initialize Hardware Pins
#define ONE_WIRE_BUS 4
#define PH_PIN 34
#define TDS_PIN 35
#define ALARM_LED 12

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

void setup() {
  Serial.begin(115200);
  pinMode(ALARM_LED, OUTPUT);
  sensors.begin();

  // 1. Start Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Connected!");

  // 2. Setup Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // --- 1. READ CALIBRATED DATA ---
  // pH Smoothing logic (from your calibration test)
  long phSum = 0;
  for(int i=0; i<10; i++) {
    phSum += analogRead(PH_PIN);
    delay(10);
  }
  float avgPH = phSum / 10.0;
  float phValue = 3.5 * (avgPH * (3.3 / 4095.0));

  // TDS Math
  int tdsRaw = analogRead(TDS_PIN);
  float tdsPpm = (tdsRaw * (3.3 / 4095.0)) * 500;

  // Temperature
  sensors.requestTemperatures();
  float temp = sensors.getTempCByIndex(0);

  // --- 2. PUSH TO FIREBASE ---
  // This sends the data to the "aquarium" node in your screenshot
  if (Firebase.setFloat(firebaseData, "/aquarium/ph", phValue)) {
     Serial.println("pH Sent!");
  }
  Firebase.setFloat(firebaseData, "/aquarium/tds", (int)tdsPpm);
  Firebase.setFloat(firebaseData, "/aquarium/temp", temp);

  // --- 3. ALARM LOGIC ---
  if (phValue < 6.5 || phValue > 8.5 || temp > 28.0) {
    digitalWrite(ALARM_LED, HIGH);
    Firebase.setString(firebaseData, "/aquarium/status", "ALARM");
  } else {
    digitalWrite(ALARM_LED, LOW);
    Firebase.setString(firebaseData, "/aquarium/status", "Healthy");
  }

  delay(5000); // Wait 5 seconds before next update
}