/**
 * ESP32 Energy Monitoring System - Example Code
 * 
 * This Arduino sketch demonstrates how to send energy readings
 * from an ESP32 device to the Energy Monitoring System API.
 * 
 * Hardware Requirements:
 * - ESP32 board (DevKitC or similar)
 * - Piezoelectric sensor connected to GPIO 34 (voltage)
 * - Current sensor connected to GPIO 35 (current)
 * - WiFi connection
 * 
 * Libraries Required:
 * - WiFi.h (built-in)
 * - HTTPClient.h (built-in)
 * - ArduinoJson.h (install from Library Manager)
 * 
 * Setup Instructions:
 * 1. Update WiFi credentials (WIFI_SSID, WIFI_PASSWORD)
 * 2. Update API_URL with your server address
 * 3. Update API_KEY with your sensor's API key (from admin dashboard)
 * 4. Upload to ESP32
 * 5. Open Serial Monitor (115200 baud) to view logs
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ============================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================

// WiFi Configuration
const char* WIFI_SSID = "your-wifi-ssid";
const char* WIFI_PASSWORD = "your-wifi-password";

// API Configuration
const char* API_URL = "http://your-server-ip:3000/api/iot/readings";
const char* API_KEY = "esp32_your_api_key_here"; // Get from admin dashboard

// Sensor Pins
const int VOLTAGE_PIN = 34; // ADC1 Channel 6
const int CURRENT_PIN = 35; // ADC1 Channel 7

// Reading Interval (milliseconds)
const unsigned long READING_INTERVAL = 10000; // 10 seconds

// ============================================================
// GLOBAL VARIABLES
// ============================================================

unsigned long lastReadingTime = 0;
int readingCount = 0;
int successCount = 0;
int errorCount = 0;

// ============================================================
// SETUP
// ============================================================

void setup() {
  // Initialize Serial
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.println("ESP32 Energy Monitoring System");
  Serial.println("========================================\n");
  
  // Configure ADC
  analogReadResolution(12); // 12-bit resolution (0-4095)
  analogSetAttenuation(ADC_11db); // Full range: 0-3.3V
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("Setup complete. Starting measurements...\n");
}

// ============================================================
// MAIN LOOP
// ============================================================

void loop() {
  // Check if it's time for a new reading
  unsigned long currentTime = millis();
  if (currentTime - lastReadingTime >= READING_INTERVAL) {
    lastReadingTime = currentTime;
    
    // Read sensors
    float voltage = readVoltage();
    float current = readCurrent();
    float power = calculatePower(voltage, current);
    
    // Display readings
    displayReadings(voltage, current, power);
    
    // Send to server
    sendReading(voltage, current, power);
    
    // Display statistics
    displayStatistics();
  }
  
  // Small delay to prevent tight loop
  delay(100);
}

// ============================================================
// WiFi FUNCTIONS
// ============================================================

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm\n");
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    Serial.println("Please check credentials and restart.\n");
  }
}

// ============================================================
// SENSOR READING FUNCTIONS
// ============================================================

float readVoltage() {
  // Read analog value (0-4095)
  int rawValue = analogRead(VOLTAGE_PIN);
  
  // Convert to voltage (0-3.3V ADC range → 0-50V sensor range)
  // Adjust multiplier based on your sensor specifications
  float voltage = (rawValue / 4095.0) * 50.0;
  
  // Apply calibration if needed
  // voltage = voltage * VOLTAGE_CALIBRATION_FACTOR;
  
  return voltage;
}

float readCurrent() {
  // Read analog value (0-4095)
  int rawValue = analogRead(CURRENT_PIN);
  
  // Convert to current (0-3.3V ADC range → 0-10A sensor range)
  // Adjust multiplier based on your sensor specifications
  float current = (rawValue / 4095.0) * 10.0;
  
  // Apply calibration if needed
  // current = current * CURRENT_CALIBRATION_FACTOR;
  
  return current;
}

float calculatePower(float voltage, float current) {
  // Power = Voltage × Current (P = V × I)
  return voltage * current;
}

// ============================================================
// API COMMUNICATION FUNCTIONS
// ============================================================

void sendReading(float voltage, float current, float power) {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ WiFi not connected. Reconnecting...");
    connectWiFi();
    return;
  }
  
  readingCount++;
  
  Serial.println("Sending reading to server...");
  
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  http.setTimeout(5000); // 5 second timeout
  
  // Create JSON payload
  StaticJsonDocument<256> doc;
  doc["voltage"] = round(voltage * 100) / 100.0; // Round to 2 decimals
  doc["current"] = round(current * 100) / 100.0;
  doc["power"] = round(power * 100) / 100.0;
  doc["timestamp"] = getISOTimestamp();
  
  String payload;
  serializeJson(doc, payload);
  
  Serial.print("Payload: ");
  Serial.println(payload);
  
  // Send POST request
  int httpCode = http.POST(payload);
  
  // Handle response
  if (httpCode == 201) {
    // Success - reading stored
    successCount++;
    Serial.println("✓ Reading sent successfully (201 Created)");
    
    // Parse response
    String response = http.getString();
    StaticJsonDocument<256> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (!error) {
      const char* readingId = responseDoc["readingId"];
      const char* receivedAt = responseDoc["receivedAt"];
      
      Serial.print("  Reading ID: ");
      Serial.println(readingId);
      Serial.print("  Received At: ");
      Serial.println(receivedAt);
    }
  } else if (httpCode == 401) {
    // Authentication failed
    errorCount++;
    Serial.println("✗ Authentication failed (401 Unauthorized)");
    Serial.println("  Check API_KEY configuration");
    Serial.println(http.getString());
  } else if (httpCode == 400) {
    // Validation failed
    errorCount++;
    Serial.println("✗ Validation failed (400 Bad Request)");
    Serial.println("  Check sensor readings");
    Serial.println(http.getString());
  } else if (httpCode < 0) {
    // Network error
    errorCount++;
    Serial.print("✗ Network error: ");
    Serial.println(http.errorToString(httpCode));
  } else {
    // Other error
    errorCount++;
    Serial.print("✗ HTTP error: ");
    Serial.println(httpCode);
    Serial.println(http.getString());
  }
  
  http.end();
  Serial.println();
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

String getISOTimestamp() {
  // Note: For production, use NTP time synchronization
  // This is a simple implementation using millis()
  
  // For now, return a placeholder
  // In production: use time.h library with NTP sync
  
  unsigned long seconds = millis() / 1000;
  char buffer[30];
  sprintf(buffer, "2026-07-17T%02lu:%02lu:%02luZ", 
          (seconds / 3600) % 24, 
          (seconds / 60) % 60, 
          seconds % 60);
  
  return String(buffer);
  
  // Production implementation with NTP:
  /*
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  time_t now = time(nullptr);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
  */
}

void displayReadings(float voltage, float current, float power) {
  Serial.println("----------------------------------------");
  Serial.print("Reading #");
  Serial.println(readingCount);
  Serial.println("----------------------------------------");
  Serial.print("Voltage: ");
  Serial.print(voltage, 2);
  Serial.println(" V");
  Serial.print("Current: ");
  Serial.print(current, 2);
  Serial.println(" A");
  Serial.print("Power:   ");
  Serial.print(power, 2);
  Serial.println(" W");
  Serial.println();
}

void displayStatistics() {
  float successRate = (readingCount > 0) ? (successCount * 100.0 / readingCount) : 0;
  
  Serial.println("========================================");
  Serial.print("Total Readings: ");
  Serial.println(readingCount);
  Serial.print("Successful: ");
  Serial.print(successCount);
  Serial.print(" (");
  Serial.print(successRate, 1);
  Serial.println("%)");
  Serial.print("Errors: ");
  Serial.println(errorCount);
  Serial.println("========================================\n");
}

// ============================================================
// ADDITIONAL NOTES
// ============================================================

/**
 * Calibration:
 * - Measure known voltage/current with multimeter
 * - Compare with ESP32 readings
 * - Calculate calibration factors
 * - Apply: calibratedValue = rawValue * calibrationFactor
 * 
 * NTP Time Sync:
 * - Add in setup(): configTime(0, 0, "pool.ntp.org");
 * - Wait for sync: while(!time(nullptr)) { delay(100); }
 * - Use in getISOTimestamp() function
 * 
 * Error Handling:
 * - Implement retry logic for network errors
 * - Store readings locally if server unavailable
 * - Batch send when connection restored
 * 
 * Power Management:
 * - Use deep sleep between readings
 * - Wake up, read sensors, send data, sleep
 * - Example: esp_deep_sleep(READING_INTERVAL * 1000);
 * 
 * Security:
 * - Store API_KEY in secure storage (EEPROM/SPIFFS)
 * - Use HTTPS instead of HTTP in production
 * - Implement certificate validation
 */
