#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <RTClib.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ── Pin definitions ──────────────────────────────────────────────────────────
#define SS_PIN  5
#define RST_PIN 4

MFRC522           mfrc522(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);
RTC_DS3231        rtc;

// ── Config — EDIT THESE ──────────────────────────────────────────────────────
const char* WIFI_SSID      = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD  = "YOUR_WIFI_PASSWORD";

// Your Vercel deployment URL — host only, no https:// prefix, no trailing slash
const char* SERVER_HOST    = "bus-pifs4z32p-pranav2007keshava-dels-projects.vercel.app";
const char* ATTEND_PATH    = "/api/attendance";
const char* UNKNOWN_PATH   = "/api/unknown";

// ── State ─────────────────────────────────────────────────────────────────────
bool pranavInside   = false;
bool chiranthInside = false;

// ── WiFi ──────────────────────────────────────────────────────────────────────
void connectWiFi() {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Connecting WiFi");
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 40) {
    delay(500); Serial.print("."); tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi OK: " + WiFi.localIP().toString());
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1); lcd.print(WiFi.localIP());
    delay(2000);
  } else {
    Serial.println("\nWiFi failed");
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("WiFi Failed");
    lcd.setCursor(0, 1); lcd.print("Check creds");
    delay(2000);
  }
}

// ── HTTPS POST helper ─────────────────────────────────────────────────────────
void httpsPost(const char* path, String payload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected — skipping POST");
    return;
  }
  WiFiClientSecure client;
  client.setInsecure(); // Skip cert verification (acceptable for IoT demo)
  HTTPClient https;
  String url = String("https://") + SERVER_HOST + path;
  if (https.begin(client, url)) {
    https.addHeader("Content-Type", "application/json");
    int code = https.POST(payload);
    Serial.printf("POST %s → HTTP %d\n", path, code);
    https.end();
  } else {
    Serial.printf("Failed to connect to %s\n", url.c_str());
  }
}

// ── Send attendance event ─────────────────────────────────────────────────────
void postAttendance(String name, String location, String timeStr, String ampm, String uid) {
  String payload = "{\"name\":\"" + name + "\","
                   "\"location\":\"" + location + "\","
                   "\"time\":\"" + timeStr + "\","
                   "\"ampm\":\"" + ampm + "\","
                   "\"uid\":\"" + uid + "\"}";
  httpsPost(ATTEND_PATH, payload);
}

// ── Send unknown card event ───────────────────────────────────────────────────
void postUnknown(String uid) {
  String payload = "{\"uid\":\"" + uid + "\"}";
  httpsPost(UNKNOWN_PATH, payload);
}

// ── Show attendance on LCD + send to server ───────────────────────────────────
void showAttendance(String name, bool entryStatus, String uid) {
  DateTime now = rtc.now();
  char timeStr[12];
  int hour   = now.hour();
  String ampm = "AM";
  if (hour >= 12) ampm = "PM";
  if (hour > 12)  hour -= 12;
  if (hour == 0)  hour = 12;
  sprintf(timeStr, "%02d:%02d:%02d", hour, now.minute(), now.second());

  String location = entryStatus ? "PESCE" : "Home";

  // Screen 1 — name + location
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(name); lcd.print(" Enterd");
  lcd.setCursor(0, 1); lcd.print(location);
  delay(3000);

  // Screen 2 — time
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Time:");
  lcd.setCursor(0, 1); lcd.print(timeStr); lcd.print(" "); lcd.print(ampm);

  Serial.print(name);
  Serial.print(entryStatus ? " has entered PESCE at " : " has entered Home at ");
  Serial.print(timeStr); Serial.print(" "); Serial.println(ampm);

  // POST to Vercel
  postAttendance(name, location, String(timeStr), ampm, uid);

  delay(4000);
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Scan Card");
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
  Wire.begin(21, 22);
  rtc.begin();
  lcd.init();
  lcd.backlight();

  // Uncomment once to set RTC, then comment again:
  // rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));

  lcd.setCursor(0, 0); lcd.print("RFID Attendance");
  lcd.setCursor(0, 1); lcd.print("System Ready");
  delay(2000);
  lcd.clear();

  connectWiFi();

  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Scan Card");
}

// ── Loop ──────────────────────────────────────────────────────────────────────
void loop() {
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial())   return;

  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  Serial.print("UID: "); Serial.println(uid);

  if (uid == "737DC80D") {
    if (!pranavInside) { pranavInside = true;  showAttendance("Pranav",  true,  uid); }
    else               { pranavInside = false; showAttendance("Pranav",  false, uid); }
  }
  else if (uid == "93EB2E10") {
    if (!chiranthInside) { chiranthInside = true;  showAttendance("Chiranth", true,  uid); }
    else                 { chiranthInside = false; showAttendance("Chiranth", false, uid); }
  }
  else {
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("Unknown Card");
    postUnknown(uid);
    delay(2000);
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("Scan Card");
  }

  mfrc522.PICC_HaltA();
}
