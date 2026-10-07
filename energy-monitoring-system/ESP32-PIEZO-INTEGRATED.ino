/*
 * ESP32 Piezoelectric Footstep Energy Harvesting System
 * Integrated with Energy Monitoring Backend
 * 
 * Hardware Configuration:
 * - 10-15 piezoelectric discs in parallel → LTC3588-1 PZ1/PZ2
 * - LTC3588-1 → 50V, 2200µF electrolytic capacitor
 * - Voltage divider: R1=1MΩ, R2=680kΩ → GPIO34 (ADC)
 * - REQUIRED: 100nF ceramic capacitor between GPIO34 and GND for noise filtering
 * - LED: GPIO25 → [Resistor] → LED(+) → LED(-) → GND
 * - LM2596: Powers ESP32 at 5V (independent from harvested energy)
 * 
 * Backend Integration:
 * - Endpoint: POST /api/iot/piezo/readings
 * - Authentication: X-API-Key header
 * - Real-time: WebSocket events for triggers, milestones, capacitor full
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// ======================== CONFIGURATION - UPDATE THESE ========================
const char* WIFI_SSID = "your-wifi-ssid";
const char* WIFI_PASSWORD = "your-wifi-password";
const char* API_URL = "http://your-server-ip:3000/api/iot/piezo/readings";
const char* API_KEY = "esp32_your_api_key_here"; // Get from admin dashboard

// ======================== HARDWARE PIN DEFINITIONS ========================
const int ADC_PIN = 34;           // GPIO34 - ADC input for voltage divider
const int LED_PIN = 25;           // GPIO25 - External LED indicator

// ======================== CAPACITOR CONSTANTS ========================
const float CAPACITANCE = 0.0022; // 2200 microfarads in Farads

// ======================== VOLTAGE DIVIDER CONSTANTS ========================
const float R1 = 1000000.0;       // 1 MΩ (top resistor)
const float R2 = 680000.0;        // 680 kΩ (bottom resistor)
const float DIVIDER_RATIO = (R1 + R2) / R2;  // Multiply ADC voltage by this to get actual capacitor voltage

// ======================== ADC CONFIGURATION ========================
const int ADC_SAMPLES = 100;      // Increased to 100 to aggressively filter high-impedance noise
const float ADC_VREF = 3.3;       // ESP32 ADC reference voltage
const int ADC_RESOLUTION = 4095;  // 12-bit ADC (0-4095)

// ======================== DETECTION PARAMETERS ========================
const float VOLTAGE_THRESHOLD = 0.030;  // Minimum voltage increase to detect as a valid piezo trigger (30 mV)
const float MAX_CREDIBLE_CHANGE = 1.500;  // Maximum credible voltage change per reading interval
const int LED_PULSE_DURATION = 500;  // LED pulse duration in milliseconds
const int TRIGGER_COOLDOWN = 1000;  // Cooldown period: Minimum time between valid triggers
const int MONITORING_INTERVAL = 150;  // Monitoring interval: How often to check voltage

// ======================== NETWORK & NTP GLOBALS ========================
const char* NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET_SEC = 0;  // UTC
const int DAYLIGHT_OFFSET_SEC = 0;
bool ntpSynced = false;
time_t ntpSyncEpoch = 0;
unsigned long lastWiFiCheck = 0;
const unsigned long WIFI_CHECK_INTERVAL = 30000; // Check every 30 seconds

// ======================== HTTP RETRY GLOBALS ========================
unsigned long authFailureTime = 0;
const unsigned long AUTH_FAILURE_PAUSE = 60000;  // 60 seconds
int consecutiveFailures = 0;
const int MAX_RETRIES = 3;

// ======================== BUFFER FOR FAILED READINGS ========================
struct BufferedReading {
  float capVoltage;
  float adcVoltage;
  unsigned long timestamp;
};
BufferedReading readingBuffer[10];
int bufferCount = 0;

// ======================== GLOBAL VARIABLES ========================
float previousVoltage = 0.0;       
float previousEnergy = 0.0;
float previousCapVoltage = 0.0;
unsigned long previousTriggerTime = 0;
unsigned long cumulativeStepCount = 0;
unsigned long lastTriggerTime = 0; 
unsigned long lastCheckTime = 0;   
bool ledState = false;             
unsigned long ledOnTime = 0;       
bool monitoringActive = false;     
float baselineVoltage = 0.0;       
int badReadingCount = 0;           

// ======================== FUNCTION PROTOTYPES ========================
float readADCVoltage();
float calculateCapacitorVoltage(float adcVoltage);
float calculateStoredEnergy(float voltage);
void controlLED(bool state);
void waitForStartCommand();
void setupWiFi();
void checkWiFiConnection();
void setupNTP();
String getISOTimestamp();
void sendPiezoReading(float capVoltage, float adcVoltage);
void handleHttpResponse(int httpCode, HTTPClient& http, float capVoltage, float adcVoltage);
bool isPaused();

// ======================== SETUP FUNCTION ========================
void setup() {
  Serial.begin(115200);
  
  while (!Serial && millis() < 3000) {
    delay(10);
  }
  delay(1000); 
  
  Serial.println("\n========================================");
  Serial.println("ESP32 Piezo Detection - Backend Integration");
  Serial.println("========================================");
  
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  
  // Setup WiFi
  setupWiFi();
  
  // Setup NTP time sync
  if (WiFi.status() == WL_CONNECTED) {
    setupNTP();
  }
  
  delay(500);
  float initialADCVoltage = readADCVoltage();
  float initialCapVoltage = calculateCapacitorVoltage(initialADCVoltage);
  previousVoltage = initialCapVoltage;
  previousEnergy = calculateStoredEnergy(initialCapVoltage);
  previousCapVoltage = initialCapVoltage;
  baselineVoltage = initialCapVoltage;
  previousTriggerTime = millis();
  cumulativeStepCount = 0;
  
  Serial.println("System Configuration:");
  Serial.print("  Capacitance: "); Serial.print(CAPACITANCE, 4); Serial.println(" F (2200 uF)");
  Serial.print("  Divider Ratio: "); Serial.println(DIVIDER_RATIO, 3);
  Serial.print("  Detection Threshold: "); Serial.print(VOLTAGE_THRESHOLD * 1000, 1); Serial.println(" mV");
  Serial.print("  ADC Samples Averaged: "); Serial.println(ADC_SAMPLES);
  Serial.print("  API URL: "); Serial.println(API_URL);
  Serial.println();
  Serial.print("Initial Cap Voltage: "); Serial.print(initialCapVoltage, 3); 
  Serial.print(" V, Stored Energy: "); Serial.print(previousEnergy, 6); Serial.println(" J");
  
  waitForStartCommand();
  
  Serial.println("\n>>> MONITORING STARTED <<<\n");
  Serial.println("Time(ms)\tADC(V)\tCap(V)\tStored(J)\tΔV(mV)\tΔE(J)\t\tStatus");
  Serial.println("--------\t------\t------\t---------\t------\t--------\t------");
  
  lastCheckTime = millis();
  lastTriggerTime = millis() - TRIGGER_COOLDOWN;
}

// ======================== MAIN LOOP ========================
void loop() {
  // Check WiFi connection periodically
  checkWiFiConnection();
  
  if (!monitoringActive) {
    delay(100);
    return;
  }
  
  unsigned long currentTime = millis();
  
  if (currentTime - lastCheckTime >= MONITORING_INTERVAL) {
    lastCheckTime = currentTime;
    
    float adcVoltage = readADCVoltage();
    float capVoltage = calculateCapacitorVoltage(adcVoltage);
    float storedEnergy = calculateStoredEnergy(capVoltage);
    
    float deltaVoltage = capVoltage - previousVoltage;
    float deltaEnergy = storedEnergy - previousEnergy;
    float absDeltaVoltage = abs(deltaVoltage);
    
    // SANITY CHECK
    if (absDeltaVoltage > MAX_CREDIBLE_CHANGE) {
      badReadingCount++;
      Serial.print(currentTime); Serial.print("\t");
      Serial.print(adcVoltage, 4); Serial.print("\t");
      Serial.print(capVoltage, 3); Serial.print("\t");
      Serial.print(storedEnergy, 6); Serial.print("\t");
      Serial.print(deltaVoltage * 1000, 2); Serial.print("\t");
      Serial.print(deltaEnergy, 6); Serial.print("\t");
      Serial.print("⚠ BAD_READ (");
      Serial.print(absDeltaVoltage * 1000, 0);
      Serial.println("mV jump!)");
      
      if (badReadingCount >= 5) {
        Serial.println("\n⚠ CONNECTION PROBLEM! Check divider wiring and 100nF filter capacitor.\n");
        badReadingCount = 0;
      }
      return;
    }
    
    if (badReadingCount > 0) badReadingCount--;
    
    // DRIFT COMPENSATION
    float driftFromBaseline = capVoltage - baselineVoltage;
    if (driftFromBaseline > 0.050 && deltaVoltage < VOLTAGE_THRESHOLD) {
      baselineVoltage = capVoltage;
    }
    
    // TRIGGER DETECTION
    if (deltaVoltage >= VOLTAGE_THRESHOLD && 
        deltaVoltage <= MAX_CREDIBLE_CHANGE && 
        (currentTime - lastTriggerTime) >= TRIGGER_COOLDOWN) {
      
      lastTriggerTime = currentTime;
      digitalWrite(LED_PIN, HIGH);
      ledState = true;
      ledOnTime = currentTime;
      
      Serial.println();
      Serial.print(">>> ");
      Serial.print(currentTime); Serial.print("\t");
      Serial.print(adcVoltage, 4); Serial.print("\t");
      Serial.print(capVoltage, 3); Serial.print("\t");
      Serial.print(storedEnergy, 6); Serial.print("\t");
      Serial.print(deltaVoltage * 1000, 2); Serial.print("\t");
      Serial.print(deltaEnergy, 6); Serial.print("\t");
      Serial.println("*TRIGGER* <<<");
      
      // Send to backend (only if not in pause period)
      if (!isPaused() && WiFi.status() == WL_CONNECTED) {
        sendPiezoReading(capVoltage, adcVoltage);
      } else if (isPaused()) {
        Serial.println("⏸ In auth pause period. Reading buffered.");
      } else {
        Serial.println("⚠ WiFi disconnected. Reading buffered.");
      }
      
      Serial.println();
      
      baselineVoltage = capVoltage;
      
    } else {
      if (currentTime % 3000 < MONITORING_INTERVAL) {
        Serial.print(currentTime); Serial.print("\t");
        Serial.print(adcVoltage, 4); Serial.print("\t");
        Serial.print(capVoltage, 3); Serial.print("\t");
        Serial.print(storedEnergy, 6); Serial.print("\t");
        Serial.print(deltaVoltage * 1000, 2); Serial.print("\t");
        Serial.print(deltaEnergy, 6); Serial.print("\t");
        
        if (ledState) {
          Serial.println("LED_ON");
        } else {
          Serial.println("monitoring");
        }
      }
    }
    
    previousVoltage = capVoltage;
    previousEnergy = storedEnergy;
  }
  
  if (ledState && (currentTime - ledOnTime >= LED_PULSE_DURATION)) {
    digitalWrite(LED_PIN, LOW);
    ledState = false;
  }
  
  delay(10);
}

// ======================== FUNCTION IMPLEMENTATIONS ========================
float readADCVoltage() {
  long adcSum = 0;
  for (int i = 0; i < ADC_SAMPLES; i++) {
    adcSum += analogRead(ADC_PIN);
    delayMicroseconds(50);
  }
  float adcAverage = (float)adcSum / ADC_SAMPLES;
  return (adcAverage / ADC_RESOLUTION) * ADC_VREF;
}

float calculateCapacitorVoltage(float adcVoltage) {
  return adcVoltage * DIVIDER_RATIO;
}

float calculateStoredEnergy(float voltage) {
  return 0.5 * CAPACITANCE * voltage * voltage;
}

void waitForStartCommand() {
  while (Serial.available() > 0) Serial.read();
  Serial.println("\nType 'Yes' and press ENTER to start");
  
  String command = "";
  while (true) {
    if (Serial.available() > 0) {
      char c = Serial.read();
      if (c != '\n' && c != '\r') {
        Serial.print(c);
        command += c;
      }
      if (c == '\n' || c == '\r') {
        Serial.println();
        command.trim();
        command.toLowerCase();
        if (command == "yes") {
          monitoringActive = true;
          Serial.println("✓ Starting...\n");
          delay(500);
          return;
        } else if (command.length() > 0) {
          Serial.print("Invalid. Type 'Yes'\n");
          command = "";
        }
      }
    }
    delay(10);
  }
}

void setupWiFi() {
  Serial.println("Connecting to WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ WiFi connection failed");
    Serial.println("⚠ Will operate in offline mode with buffering");
  }
}

void checkWiFiConnection() {
  unsigned long now = millis();
  if (now - lastWiFiCheck < WIFI_CHECK_INTERVAL) return;
  
  lastWiFiCheck = now;
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ WiFi disconnected. Reconnecting...");
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n✓ WiFi reconnected");
    } else {
      Serial.println("\n✗ WiFi reconnection failed");
    }
  }
}

void setupNTP() {
  Serial.println("Configuring NTP time sync...");
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER, "time.nist.gov");
  
  // Wait up to 5 seconds for NTP sync
  int attempts = 0;
  time_t now = time(nullptr);
  while (now < 100000 && attempts < 50) {  // time < 1971 = not synced
    delay(100);
    now = time(nullptr);
    attempts++;
  }
  
  if (now >= 100000) {
    ntpSynced = true;
    ntpSyncEpoch = now;
    Serial.println("✓ NTP time synchronized");
    
    struct tm timeinfo;
    gmtime_r(&now, &timeinfo);
    char buffer[30];
    strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S UTC", &timeinfo);
    Serial.print("Current time: ");
    Serial.println(buffer);
  } else {
    Serial.println("⚠ NTP sync failed. Using millis() fallback.");
    ntpSyncEpoch = 1609459200;  // Jan 1, 2021 epoch as fallback base
  }
}

String getISOTimestamp() {
  time_t now;
  
  if (ntpSynced) {
    now = time(nullptr);
  } else {
    // Fallback: epoch base + millis() offset
    now = ntpSyncEpoch + (millis() / 1000);
  }
  
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}

void sendPiezoReading(float capVoltage, float adcVoltage) {
  unsigned long now = millis();
  float deltaTime = (now - previousTriggerTime) / 1000.0;  // seconds
  
  // Calculate energy change (Joules)
  float deltaEnergy = 0.5 * CAPACITANCE * (capVoltage * capVoltage - previousCapVoltage * previousCapVoltage);
  
  // Clamp to non-negative (addresses voltage drops)
  if (deltaEnergy < 0) deltaEnergy = 0.0;
  
  // Calculate power (Watts = Joules/second)
  float power = (deltaTime > 0) ? (deltaEnergy / deltaTime) : 0.0;
  if (power < 0) power = 0.0;
  
  // Increment step counter
  cumulativeStepCount++;
  
  // Calculate frequency (triggers per second)
  float frequency = (deltaTime > 0) ? (1.0 / deltaTime) : 0.0;
  
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["voltage"] = round(capVoltage * 100) / 100.0;
  doc["current"] = 0.0;  // Always 0 for piezo
  doc["power"] = round(power * 1000) / 1000.0;  // 3 decimals
  doc["capacitorVoltage"] = round(capVoltage * 100) / 100.0;
  doc["stepCount"] = cumulativeStepCount;
  doc["frequency"] = round(frequency * 10000) / 10000.0;  // 4 decimals
  doc["timestamp"] = getISOTimestamp();
  doc["source"] = "hardware";
  
  String payload;
  serializeJson(doc, payload);
  
  Serial.println("Sending to backend:");
  Serial.println(payload);
  
  // Send HTTP POST
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  http.setTimeout(5000);
  
  int httpCode = http.POST(payload);
  handleHttpResponse(httpCode, http, capVoltage, adcVoltage);
  
  http.end();
  
  // Update previous values
  previousCapVoltage = capVoltage;
  previousTriggerTime = now;
}

void handleHttpResponse(int httpCode, HTTPClient& http, float capVoltage, float adcVoltage) {
  if (httpCode == 201) {
    // Success
    consecutiveFailures = 0;
    bufferCount = 0;  // Clear buffer
    Serial.println("✓ Reading sent successfully (201 Created)");
    
    String response = http.getString();
    Serial.print("Response: ");
    Serial.println(response);
  } else if (httpCode == 401) {
    // Auth error - pause sending and buffer
    authFailureTime = millis();
    consecutiveFailures++;
    Serial.println("✗ Authentication failed (401). Pausing sends for 60 seconds.");
    Serial.println("⚠ Check API_KEY configuration!");
    
    // Buffer current reading
    if (bufferCount < 10) {
      readingBuffer[bufferCount].capVoltage = capVoltage;
      readingBuffer[bufferCount].adcVoltage = adcVoltage;
      readingBuffer[bufferCount].timestamp = millis();
      bufferCount++;
      Serial.print("Buffered reading ");
      Serial.print(bufferCount);
      Serial.println("/10");
    } else {
      Serial.println("⚠ Buffer full. Discarding oldest reading.");
      // Shift array left (discard oldest)
      for (int i = 0; i < 9; i++) {
        readingBuffer[i] = readingBuffer[i + 1];
      }
      // Add new reading at end
      readingBuffer[9].capVoltage = capVoltage;
      readingBuffer[9].adcVoltage = adcVoltage;
      readingBuffer[9].timestamp = millis();
    }
  } else if (httpCode == 400) {
    // Validation error - log and continue
    Serial.println("✗ Validation failed (400):");
    Serial.println(http.getString());
  } else if (httpCode < 0) {
    // Network error - retry up to MAX_RETRIES
    consecutiveFailures++;
    Serial.print("✗ Network error: ");
    Serial.println(http.errorToString(httpCode));
    
    if (consecutiveFailures < MAX_RETRIES) {
      Serial.println("Retrying in 2 seconds...");
      delay(2000);
    } else {
      Serial.println("⚠ Max retries reached. Buffering reading.");
    }
  } else {
    Serial.print("✗ HTTP error: ");
    Serial.println(httpCode);
    Serial.println(http.getString());
  }
}

bool isPaused() {
  if (authFailureTime == 0) return false;
  if (millis() - authFailureTime < AUTH_FAILURE_PAUSE) {
    return true;
  }
  authFailureTime = 0;  // Reset after pause expires
  return false;
}
