#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>

const char* ssid = "";
const char* password = "";


int pinout = 34;     
int pinout2 = 35;       

#define DHTTYPE DHT11
DHT dht(dhtPin, DHTTYPE);

WebServer server(80);


String detectSensor(String name, int pin, bool isAnalog = true) {
  bool connected = false;
  float value = 0;

  if (isAnalog) {
    value = analogRead(pin);
    connected = value > 10;
  } else {
    value = digitalRead(pin);
    connected = true;
  }

  String json = "{";
  json += "\"name\":\"" + name + "\",";
  json += "\"pin\":" + String(pin) + ",";
  json += "\"connected\":" + String(connected ? "true" : "false");
  if (connected) {
    json += ",\"value\":" + String(value);
  }
  json += "}";
  return json;
}

bool isConnected(int pin) {
  int val = analogRead(pin);
  return (val > 10);
}


void handleData() {
  String json = "{";


  json += "\"water\": {";
  if (isConnected(waterPin)) {
    json += "\"connected\": true,";
    json += "\"value\": " + String(analogRead(waterPin));
  } else {
    json += "\"connected\": false";
  }
  json += "},";


  float humidity = dht.readHumidity();
  json += "\"humidity\": {";
  if (!isnan(humidity)) {
    json += "\"connected\": true,";
    json += "\"value\": " + String(humidity);
  } else {
    json += "\"connected\": false";
  }
  json += "}";


  json += ",\"detectedSensors\":[";


  json += detectSensor("water", waterPin);  
  json += ",";
  json += detectSensor("humidity_raw", dhtPin, false);  

  json += "]";

  json += "}";

  server.send(200, "application/json", json);
}


void setup() {
  Serial.begin(115200);
  dht.begin();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(200);

  server.on("/data", handleData);
  server.enableCORS(true);
  server.begin();
  Serial.println(WiFi.localIP());
}

void loop() {
  server.handleClient();
}
