#include <WiFi.h>
#include <FirebaseESP32.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"

// Hardware Pin Definitions
#define ONE_WIRE_BUS 4  // DS18B20 Temp sensor on GPIO 4
#define PH_PIN 34       // Analog pH sensor
#define TDS_PIN 35      // Analog TDS sensor
#define ALARM_LED 12    // Physical Alarm LED

// Initialize objects
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

void setup() {
  Serial.begin(115200);
  pinMode(ALARM_LED, OUTPUT);
  sensors.begin();

  // Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Connected!");

  // Firebase Setup
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // 1. Read Temperature
  sensors.requestTemperatures();
  float temp = sensors.getTempCByIndex(0);

  // 2. Read pH (Formula based on your calibration later)
  int phRaw = analogRead(PH_PIN);
  float phVoltage = phRaw * (3.3 / 4095.0);
  float phValue = 3.5 * phVoltage; // This is a skeleton multiplier

  // 3. Read TDS
  int tdsRaw = analogRead(TDS_PIN);
  float tdsValue = tdsRaw * 0.5; // Skeleton math

  // 4. Send Data to Firebase Node "aquarium"
  Firebase.setFloat(firebaseData, "/aquarium/temp", temp);
  Firebase.setFloat(firebaseData, "/aquarium/ph", phValue);
  Firebase.setFloat(firebaseData, "/aquarium/tds", tdsValue);

  // 5. Intelligent Alarm Logic
  if (phValue < 6.5 || phValue > 8.5 || temp > 28.0) {
    digitalWrite(ALARM_LED, HIGH);
  } else {
    digitalWrite(ALARM_LED, LOW);
  }

  delay(5000); // Update every 5 seconds
}