#include <Arduino.h>
#include <Wire.h>

namespace {

constexpr uint8_t kAddress = 0x57;
constexpr uint8_t kExpectedPartId = 0x15;
constexpr uint32_t kUsbBaud = 115200;
constexpr uint32_t kI2cFrequency = 400000;
constexpr uint16_t kSampleRate = 100;
constexpr uint8_t kBatchSize = 5;

// Source module: the module nearest the XIAO in the reference photo.
constexpr int kSourceSdaPin = D4;  // GPIO5
constexpr int kSourceSclPin = D5;  // GPIO6

// Detector module: the module farther from the XIAO.
// A second hardware I2C controller is required because both chips use 0x57.
constexpr int kDetectorSdaPin = D2;  // GPIO3
constexpr int kDetectorSclPin = D3;  // GPIO4

constexpr uint8_t kDefaultSourceLedCurrent = 0xDC;  // about 44 mA peak
constexpr uint8_t kMaxSourceLedCurrent = 0xDC;      // board-stable prototype cap
constexpr uint8_t kSourceSpo2Config = 0x67;         // 16384 nA, 100 SPS, 411 us
constexpr uint8_t kDetectorSpo2Config = 0x27;       // 4096 nA, 100 SPS, 411 us
constexpr int16_t kDefaultStartOffsetUs = 0;

constexpr uint8_t REG_INT_STATUS_1 = 0x00;
constexpr uint8_t REG_INT_STATUS_2 = 0x01;
constexpr uint8_t REG_INT_ENABLE_1 = 0x02;
constexpr uint8_t REG_INT_ENABLE_2 = 0x03;
constexpr uint8_t REG_FIFO_WR_PTR = 0x04;
constexpr uint8_t REG_OVF_COUNTER = 0x05;
constexpr uint8_t REG_FIFO_RD_PTR = 0x06;
constexpr uint8_t REG_FIFO_DATA = 0x07;
constexpr uint8_t REG_FIFO_CONFIG = 0x08;
constexpr uint8_t REG_MODE_CONFIG = 0x09;
constexpr uint8_t REG_SPO2_CONFIG = 0x0A;
constexpr uint8_t REG_LED1_PA = 0x0C;
constexpr uint8_t REG_LED2_PA = 0x0D;
constexpr uint8_t REG_TEMP_INTEGER = 0x1F;
constexpr uint8_t REG_TEMP_FRACTION = 0x20;
constexpr uint8_t REG_TEMP_CONFIG = 0x21;
constexpr uint8_t REG_REVISION_ID = 0xFE;
constexpr uint8_t REG_PART_ID = 0xFF;

struct OpticalSample {
  uint32_t red = 0;
  uint32_t ir = 0;
};

struct NirsSample {
  OpticalSample source;
  OpticalSample detector;
};

class Max30102 {
 public:
  explicit Max30102(TwoWire &bus) : bus_(bus) {}

  bool probe() {
    uint8_t partId = 0;
    return readRegister(REG_PART_ID, partId) && partId == kExpectedPartId;
  }

  bool resetAndPrepare(uint8_t redCurrent, uint8_t irCurrent,
                       uint8_t spo2Config) {
    uint8_t partId = 0;
    if (!readRegister(REG_PART_ID, partId) || partId != kExpectedPartId) {
      return false;
    }
    partId_ = partId;
    readRegister(REG_REVISION_ID, revisionId_);

    if (!writeRegister(REG_MODE_CONFIG, 0x40)) {
      return false;
    }
    const uint32_t deadline = millis() + 150;
    uint8_t mode = 0x40;
    while ((mode & 0x40) != 0 &&
           static_cast<int32_t>(deadline - millis()) > 0) {
      delay(2);
      if (!readRegister(REG_MODE_CONFIG, mode)) {
        return false;
      }
    }
    if ((mode & 0x40) != 0) {
      return false;
    }

    redCurrent_ = redCurrent;
    irCurrent_ = irCurrent;

    // One sample per FIFO frame, rollover enabled. Both channels remain
    // scheduled even when LED current is zero on the detector module.
    if (!writeRegister(REG_INT_ENABLE_1, 0x00) ||
        !writeRegister(REG_INT_ENABLE_2, 0x00) ||
        !writeRegister(REG_FIFO_CONFIG, 0x1F) ||
        !clearFifo() ||
        !writeRegister(REG_SPO2_CONFIG, spo2Config) ||
        !writeRegister(REG_LED1_PA, redCurrent_) ||
        !writeRegister(REG_LED2_PA, irCurrent_) ||
        !writeRegister(REG_MODE_CONFIG, 0x83)) {
      return false;
    }

    uint8_t ignored = 0;
    readRegister(REG_INT_STATUS_1, ignored);
    readRegister(REG_INT_STATUS_2, ignored);
    communicationOk_ = true;
    return true;
  }

  bool clearFifo() {
    return writeRegister(REG_FIFO_WR_PTR, 0x00) &&
           writeRegister(REG_OVF_COUNTER, 0x00) &&
           writeRegister(REG_FIFO_RD_PTR, 0x00);
  }

  bool setShutdown(bool shutdown) {
    return writeRegister(REG_MODE_CONFIG, shutdown ? 0x83 : 0x03);
  }

  bool setLedCurrent(uint8_t current) {
    if (!writeRegister(REG_LED1_PA, current) ||
        !writeRegister(REG_LED2_PA, current)) {
      communicationOk_ = false;
      return false;
    }
    redCurrent_ = current;
    irCurrent_ = current;
    communicationOk_ = true;
    return true;
  }

  uint8_t availableSamples() {
    uint8_t writePointer = 0;
    uint8_t readPointer = 0;
    if (!readRegister(REG_FIFO_WR_PTR, writePointer) ||
        !readRegister(REG_FIFO_RD_PTR, readPointer)) {
      communicationOk_ = false;
      return 0;
    }
    communicationOk_ = true;
    return static_cast<uint8_t>((writePointer - readPointer) & 0x1F);
  }

  bool readSample(OpticalSample &sample) {
    uint8_t bytes[6] = {};
    if (!readBytes(REG_FIFO_DATA, bytes, sizeof(bytes))) {
      communicationOk_ = false;
      return false;
    }
    sample.red = (((static_cast<uint32_t>(bytes[0]) << 16) |
                   (static_cast<uint32_t>(bytes[1]) << 8) | bytes[2]) &
                  0x03FFFF);
    sample.ir = (((static_cast<uint32_t>(bytes[3]) << 16) |
                  (static_cast<uint32_t>(bytes[4]) << 8) | bytes[5]) &
                 0x03FFFF);
    communicationOk_ = true;
    return true;
  }

  void serviceTemperature() {
    const uint32_t now = millis();
    if (!temperaturePending_ &&
        static_cast<int32_t>(now - nextTemperatureRequestMs_) >= 0) {
      if (writeRegister(REG_TEMP_CONFIG, 0x01)) {
        temperaturePending_ = true;
        temperatureRequestedMs_ = now;
      }
      nextTemperatureRequestMs_ = now + 2000;
      return;
    }

    if (!temperaturePending_ || now - temperatureRequestedMs_ < 35) {
      return;
    }
    uint8_t status = 0;
    if (!readRegister(REG_INT_STATUS_2, status)) {
      temperaturePending_ = false;
      return;
    }
    if ((status & 0x02) == 0) {
      if (now - temperatureRequestedMs_ > 220) {
        temperaturePending_ = false;
      }
      return;
    }

    uint8_t integerPart = 0;
    uint8_t fractionPart = 0;
    if (readRegister(REG_TEMP_INTEGER, integerPart) &&
        readRegister(REG_TEMP_FRACTION, fractionPart)) {
      temperatureC_ = static_cast<int8_t>(integerPart) +
                      (fractionPart & 0x0F) * 0.0625f;
      hasTemperature_ = true;
    }
    temperaturePending_ = false;
  }

  uint8_t partId() const { return partId_; }
  uint8_t revisionId() const { return revisionId_; }
  uint8_t ledCurrent() const { return redCurrent_; }
  bool communicationOk() const { return communicationOk_; }
  bool hasTemperature() const { return hasTemperature_; }
  float temperatureC() const { return temperatureC_; }

 private:
  bool writeRegister(uint8_t reg, uint8_t value) {
    bus_.beginTransmission(kAddress);
    bus_.write(reg);
    bus_.write(value);
    return bus_.endTransmission(true) == 0;
  }

  bool readRegister(uint8_t reg, uint8_t &value) {
    return readBytes(reg, &value, 1);
  }

  bool readBytes(uint8_t reg, uint8_t *destination, size_t length) {
    bus_.beginTransmission(kAddress);
    bus_.write(reg);
    if (bus_.endTransmission(false) != 0) {
      return false;
    }
    const size_t received = bus_.requestFrom(
        static_cast<uint8_t>(kAddress), static_cast<uint8_t>(length),
        static_cast<uint8_t>(true));
    if (received != length) {
      while (bus_.available()) {
        bus_.read();
      }
      return false;
    }
    for (size_t index = 0; index < length; ++index) {
      destination[index] = static_cast<uint8_t>(bus_.read());
    }
    return true;
  }

  TwoWire &bus_;
  uint8_t partId_ = 0;
  uint8_t revisionId_ = 0;
  uint8_t redCurrent_ = 0;
  uint8_t irCurrent_ = 0;
  bool communicationOk_ = false;
  bool temperaturePending_ = false;
  bool hasTemperature_ = false;
  uint32_t temperatureRequestedMs_ = 0;
  uint32_t nextTemperatureRequestMs_ = 250;
  float temperatureC_ = 0.0f;
};

TwoWire detectorWire(1);
Max30102 source(Wire);
Max30102 detector(detectorWire);

bool sourceReady = false;
bool detectorReady = false;
uint8_t sourceLedCurrent = kDefaultSourceLedCurrent;
bool sourceLightEnabled = true;
uint32_t sourceLightDisabledMs = 0;
int16_t startOffsetUs = kDefaultStartOffsetUs;
uint32_t lastSyncMs = 0;
uint32_t sampleSequence = 0;
uint32_t batchSequence = 0;
uint32_t nextStatusMs = 0;
uint32_t nextProbeMs = 0;
uint32_t nextFifoPollMs = 0;
NirsSample batch[kBatchSize];
uint8_t batchCount = 0;
String commandBuffer;

void printHexByte(uint8_t value) {
  if (value < 0x10) {
    Serial.print('0');
  }
  Serial.print(value, HEX);
}

bool synchronizeSensors() {
  if (!sourceReady || !detectorReady) {
    return false;
  }
  batchCount = 0;
  if (!source.setShutdown(true) || !detector.setShutdown(true)) {
    return false;
  }
  delay(3);
  if (!source.clearFifo() || !detector.clearFifo()) {
    return false;
  }

  bool ok = false;
  if (startOffsetUs >= 0) {
    ok = detector.setShutdown(false);
    if (startOffsetUs > 0) {
      delayMicroseconds(static_cast<uint16_t>(startOffsetUs));
    }
    ok = source.setShutdown(false) && ok;
  } else {
    ok = source.setShutdown(false);
    delayMicroseconds(static_cast<uint16_t>(-startOffsetUs));
    ok = detector.setShutdown(false) && ok;
  }
  if (ok) {
    lastSyncMs = millis();
  }
  return ok;
}

bool initializeSensors() {
  const uint8_t activeCurrent = sourceLightEnabled ? sourceLedCurrent : 0x00;
  // The source photodiode sits next to two maximum-power LEDs, so give it the
  // widest ADC range. Keep the remote detector at the most sensitive range.
  sourceReady = source.resetAndPrepare(activeCurrent, activeCurrent,
                                       kSourceSpo2Config);
  detectorReady = detector.resetAndPrepare(0x00, 0x00,
                                           kDetectorSpo2Config);
  if (sourceReady && detectorReady) {
    return synchronizeSensors();
  }
  return false;
}

void printHello() {
  Serial.print(F("{\"type\":\"hello\",\"device\":\"xiao-esp32s3\","));
  Serial.print(F("\"sensor\":\"dual-max30102-nirs\",\"protocol\":2,"));
  Serial.print(F("\"sampleRate\":"));
  Serial.print(kSampleRate);
  Serial.print(F(",\"sourceReady\":"));
  Serial.print(sourceReady ? F("true") : F("false"));
  Serial.print(F(",\"detectorReady\":"));
  Serial.print(detectorReady ? F("true") : F("false"));
  Serial.print(F(",\"sourceBus\":\"D4/D5\",\"detectorBus\":\"D2/D3\""));
  if (sourceReady) {
    Serial.print(F(",\"partId\":\"0x"));
    printHexByte(source.partId());
    Serial.print('"');
  }
  Serial.println('}');
}

void printStatus(const __FlashStringHelper *reason) {
  const uint8_t sourceAvailable = sourceReady ? source.availableSamples() : 0;
  const uint8_t detectorAvailable = detectorReady ? detector.availableSamples() : 0;
  Serial.print(F("{\"type\":\"status\",\"reason\":\""));
  Serial.print(reason);
  Serial.print(F("\",\"sourceReady\":"));
  Serial.print(sourceReady ? F("true") : F("false"));
  Serial.print(F(",\"detectorReady\":"));
  Serial.print(detectorReady ? F("true") : F("false"));
  Serial.print(F(",\"sourceLedCurrent\":"));
  Serial.print(sourceLedCurrent);
  Serial.print(F(",\"sourceLightEnabled\":"));
  Serial.print(sourceLightEnabled ? F("true") : F("false"));
  Serial.print(F(",\"startOffsetUs\":"));
  Serial.print(startOffsetUs);
  Serial.print(F(",\"syncAgeMs\":"));
  Serial.print(millis() - lastSyncMs);
  Serial.print(F(",\"fifoSkew\":"));
  Serial.print(static_cast<int>(sourceAvailable) -
               static_cast<int>(detectorAvailable));
  Serial.print(F(",\"tempC\":"));
  if (source.hasTemperature()) {
    Serial.print(source.temperatureC(), 2);
  } else {
    Serial.print(F("null"));
  }
  Serial.println('}');
}

void printError(const __FlashStringHelper *code,
                const __FlashStringHelper *message) {
  Serial.print(F("{\"type\":\"error\",\"code\":\""));
  Serial.print(code);
  Serial.print(F("\",\"message\":\""));
  Serial.print(message);
  Serial.println(F("\"}"));
}

void sendBatch() {
  if (batchCount == 0) {
    return;
  }
  Serial.print(F("{\"type\":\"samples\",\"seq\":"));
  Serial.print(batchSequence++);
  Serial.print(F(",\"sampleSeq\":"));
  Serial.print(sampleSequence - batchCount);
  Serial.print(F(",\"ms\":"));
  Serial.print(millis());
  Serial.print(F(",\"rate\":"));
  Serial.print(kSampleRate);

  const char *keys[] = {"sourceRed", "sourceIr", "detectorRed", "detectorIr"};
  for (uint8_t channel = 0; channel < 4; ++channel) {
    Serial.print(F(",\""));
    Serial.print(keys[channel]);
    Serial.print(F("\":["));
    for (uint8_t index = 0; index < batchCount; ++index) {
      if (index != 0) {
        Serial.print(',');
      }
      uint32_t value = 0;
      if (channel == 0) value = batch[index].source.red;
      if (channel == 1) value = batch[index].source.ir;
      if (channel == 2) value = batch[index].detector.red;
      if (channel == 3) value = batch[index].detector.ir;
      Serial.print(value);
    }
    Serial.print(']');
  }

  Serial.print(F(",\"tempC\":"));
  if (source.hasTemperature()) {
    Serial.print(source.temperatureC(), 2);
  } else {
    Serial.print(F("null"));
  }
  Serial.println('}');
  batchCount = 0;
}

void handleCommand(String command) {
  command.trim();
  command.toUpperCase();
  if (command == "PING") {
    Serial.println(F("{\"type\":\"pong\"}"));
    return;
  }
  if (command == "STATUS") {
    printStatus(F("command"));
    return;
  }
  if (command == "SYNC") {
    if (synchronizeSensors()) {
      printStatus(F("synchronized"));
    } else {
      printError(F("sync_failed"), F("Both MAX30102 modules must be online"));
    }
    return;
  }
  if (command == "RESET") {
    if (initializeSensors()) {
      printHello();
    } else {
      printError(F("sensor_not_found"),
                 F("Check both isolated I2C buses and power"));
    }
    return;
  }
  if (command.startsWith("LED:")) {
    const long requested = command.substring(4).toInt();
    if (requested < 1 || requested > kMaxSourceLedCurrent) {
      printError(F("bad_led_value"), F("Use LED:1..220 for this prototype"));
      return;
    }
    if (!sourceReady) {
      printError(F("i2c_write_failed"), F("Could not update source LEDs"));
      return;
    }
    sourceLedCurrent = static_cast<uint8_t>(requested);
    if (sourceLightEnabled && !source.setLedCurrent(sourceLedCurrent)) {
      printError(F("i2c_write_failed"), F("Could not update source LEDs"));
      return;
    }
    printStatus(F("led_updated"));
    return;
  }
  if (command == "LIGHT:0" || command == "LIGHT:OFF") {
    if (!sourceReady || !source.setLedCurrent(0x00)) {
      printError(F("i2c_write_failed"), F("Could not disable source LEDs"));
      return;
    }
    sourceLightEnabled = false;
    sourceLightDisabledMs = millis();
    printStatus(F("light_disabled"));
    return;
  }
  if (command == "LIGHT:1" || command == "LIGHT:ON") {
    if (!sourceReady || !source.setLedCurrent(sourceLedCurrent)) {
      printError(F("i2c_write_failed"), F("Could not enable source LEDs"));
      return;
    }
    sourceLightEnabled = true;
    printStatus(F("light_enabled"));
    return;
  }
  if (command.startsWith("OFFSET:")) {
    const long requested = command.substring(7).toInt();
    if (requested < -5000 || requested > 5000) {
      printError(F("bad_offset"), F("Use OFFSET:-5000..5000 microseconds"));
      return;
    }
    startOffsetUs = static_cast<int16_t>(requested);
    if (!synchronizeSensors()) {
      printError(F("sync_failed"), F("Could not apply timing offset"));
      return;
    }
    printStatus(F("offset_updated"));
    return;
  }
  printError(F("unknown_command"),
             F("Use PING, STATUS, SYNC, RESET, LIGHT:0/1, LED:n, or OFFSET:us"));
}

void serviceSerialCommands() {
  while (Serial.available()) {
    const char incoming = static_cast<char>(Serial.read());
    if (incoming == '\n' || incoming == '\r') {
      if (!commandBuffer.isEmpty()) {
        handleCommand(commandBuffer);
        commandBuffer = "";
      }
    } else if (commandBuffer.length() < 48) {
      commandBuffer += incoming;
    } else {
      commandBuffer = "";
      printError(F("command_too_long"), F("Command exceeds 48 characters"));
    }
  }
}

void serviceSensors() {
  const uint32_t now = millis();
  if (!sourceReady || !detectorReady) {
    if (static_cast<int32_t>(now - nextProbeMs) >= 0) {
      nextProbeMs = now + 1500;
      if (initializeSensors()) {
        printHello();
      }
    }
    return;
  }

  source.serviceTemperature();
  // A disconnected browser must not leave the prototype in a confusing dark
  // state. Dark-field diagnostics are expected to finish well within 15 s.
  if (!sourceLightEnabled && now - sourceLightDisabledMs > 15000) {
    if (source.setLedCurrent(sourceLedCurrent)) {
      sourceLightEnabled = true;
      printStatus(F("light_timeout_restored"));
    }
  }
  if (static_cast<int32_t>(now - nextFifoPollMs) < 0) {
    return;
  }
  nextFifoPollMs = now + 3;

  uint8_t sourceAvailable = source.availableSamples();
  uint8_t detectorAvailable = detector.availableSamples();
  if (!source.communicationOk() || !detector.communicationOk()) {
    sourceReady = source.probe();
    detectorReady = detector.probe();
    batchCount = 0;
    printError(F("i2c_lost"), F("One MAX30102 stopped responding"));
    return;
  }

  const int fifoSkew = static_cast<int>(sourceAvailable) -
                       static_cast<int>(detectorAvailable);
  if (fifoSkew < -4 || fifoSkew > 4) {
    if (synchronizeSensors()) {
      printStatus(F("auto_resynchronized"));
    } else {
      printError(F("auto_sync_failed"), F("Could not correct FIFO drift"));
    }
    return;
  }

  uint8_t paired = min<uint8_t>(sourceAvailable, detectorAvailable);
  paired = min<uint8_t>(paired, 12);
  while (paired-- > 0) {
    NirsSample &sample = batch[batchCount];
    if (!source.readSample(sample.source) ||
        !detector.readSample(sample.detector)) {
      sourceReady = false;
      detectorReady = false;
      batchCount = 0;
      printError(F("fifo_read_failed"), F("Could not read paired FIFO data"));
      return;
    }
    ++batchCount;
    ++sampleSequence;
    if (batchCount == kBatchSize) {
      sendBatch();
    }
  }

  if (static_cast<int32_t>(now - nextStatusMs) >= 0) {
    nextStatusMs = now + 2000;
    printStatus(F("periodic"));
  }
}

}  // namespace

void setup() {
  Serial.begin(kUsbBaud);
  const uint32_t serialDeadline = millis() + 1800;
  while (!Serial && static_cast<int32_t>(serialDeadline - millis()) > 0) {
    delay(10);
  }

  Wire.begin(kSourceSdaPin, kSourceSclPin);
  Wire.setClock(kI2cFrequency);
  Wire.setTimeOut(25);
  detectorWire.begin(kDetectorSdaPin, kDetectorSclPin);
  detectorWire.setClock(kI2cFrequency);
  detectorWire.setTimeOut(25);

  initializeSensors();
  printHello();
  if (!sourceReady || !detectorReady) {
    printError(F("sensor_not_found"),
               F("Source=D4/D5, detector=D2/D3; both use address 0x57"));
  }
}

void loop() {
  serviceSerialCommands();
  serviceSensors();
  delay(1);
}
