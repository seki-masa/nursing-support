// ESP32 + GY-MAX30102 + LCD1602(パラレル接続)
// 心拍数(HR)と血中酸素飽和度(SpO2)をLCDに表示し、BLEで送信する
//
// 【配線】
//   MAX30102: VIN->3.3V, GND->GND, SDA->GPIO21, SCL->GPIO22
//   LCD     : RS->GPIO32, E->GPIO33, D4->GPIO25, D5->GPIO26, D6->GPIO27, D7->GPIO14
//             VDD->5V(VIN), VSS->GND, R/W->GND, VO->可変抵抗中央, A->5V(220Ω), K->GND
//
// 【必要ライブラリ】(ライブラリマネージャからインストール)
//   - SparkFun MAX3010x Pulse and Proximity Sensor Library
//   ※LiquidCrystal / BLE(ESP32) は標準搭載なのでインストール不要
//
// 【BLE】Web Bluetooth 対応のWebアプリ(バイタル入力フォーム)へ HR/SpO2 を通知する。
//   - デバイス名: NursingVitals-<DEVICE_NO>   (複数台使う場合は DEVICE_NO を機器ごとに変える)
//   - 有効な値だけを JSON で notify する:  {"hr":72,"spo2":98} / {"hr":72} / {}
//     → 取得できなかった項目はキー自体を出さない = Web側でフォームを更新しない
//
// ※学習用の電子工作です。医療目的には使えません。

#include <Wire.h>               // I2C通信(MAX30102用)
#include "MAX30105.h"           // センサードライバ(MAX30102も共通)
#include "spo2_algorithm.h"     // HR/SpO2計算アルゴリズム(上記ライブラリに同梱)
#include <LiquidCrystal.h>      // LCDパラレル制御(標準ライブラリ)

#include <BLEDevice.h>          // BLE(ESP32標準)
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// 複数台運用時はこの番号を機器ごとに変える (例: "01", "02", ...)
#define DEVICE_NO "01"

// GATT サービス/特性 UUID (Web側 lib/bluetooth-vitals.ts と一致させること・全機共通)
#define SERVICE_UUID        "4b2de81d-c9d1-4e5a-9b7f-2a6c3d8e1f00"
#define CHARACTERISTIC_UUID "4b2de81d-c9d1-4e5a-9b7f-2a6c3d8e1f01"

// LCDのピン設定: lcd(RS, E, D4, D5, D6, D7)
LiquidCrystal lcd(32, 33, 25, 26, 27, 14);

MAX30105 particleSensor;        // センサーを扱うオブジェクト

// 測定データを溜めるバッファ(100サンプル = 約4秒分)
uint32_t irBuffer[100];         // 赤外線LEDの反射光
uint32_t redBuffer[100];        // 赤色LEDの反射光
const int32_t bufferLength = 100;

int32_t spo2;                   // 計算されたSpO2 [%]
int8_t  validSPO2;              // SpO2が信頼できるか(1=有効)
int32_t heartRate;              // 計算された心拍数 [bpm]
int8_t  validHeartRate;         // 心拍数が信頼できるか(1=有効)

// 指が乗っているかを判定するIR値のしきい値
const uint32_t FINGER_THRESHOLD = 50000;

// BLE
BLECharacteristic *pCharacteristic = nullptr;
bool deviceConnected = false;

// 接続状態を追う。切断されたら再びアドバタイズする。
class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) override { deviceConnected = true; }
  void onDisconnect(BLEServer *pServer) override {
    deviceConnected = false;
    pServer->getAdvertising()->start();   // 次の接続に備えて再アドバタイズ
  }
};

// 有効な値だけを JSON にして notify する。
void notifyVitals()
{
  if (!deviceConnected || pCharacteristic == nullptr) return;

  bool hrValid   = validHeartRate && heartRate > 30 && heartRate < 220;
  bool spo2Valid = validSPO2 && spo2 > 70 && spo2 <= 100;

  char json[40];
  if (hrValid && spo2Valid) {
    snprintf(json, sizeof(json), "{\"hr\":%ld,\"spo2\":%ld}", (long)heartRate, (long)spo2);
  } else if (hrValid) {
    snprintf(json, sizeof(json), "{\"hr\":%ld}", (long)heartRate);
  } else if (spo2Valid) {
    snprintf(json, sizeof(json), "{\"spo2\":%ld}", (long)spo2);
  } else {
    snprintf(json, sizeof(json), "{}");
  }

  pCharacteristic->setValue((uint8_t *)json, strlen(json));
  pCharacteristic->notify();
}

void setup()
{
  Serial.begin(115200);         // ESP32では115200が一般的
  Wire.begin(21, 22);           // I2C開始: SDA=21, SCL=22

  lcd.begin(16, 2);             // 16文字x2行
  lcd.print("Initializing...");

  // ---- BLE 初期化 ----
  BLEDevice::init("NursingVitals-" DEVICE_NO);
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());
  BLEService *pService = pServer->createService(SERVICE_UUID);
  pCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  pCharacteristic->addDescriptor(new BLE2902());   // notify購読を可能にする
  pService->start();
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);      // サービスUUIDで絞り込めるよう広告
  pAdvertising->setScanResponse(true);
  BLEDevice::startAdvertising();

  // センサーの接続確認(見つからなければエラー表示して停止)
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    lcd.clear();
    lcd.print("MAX30102 not");
    lcd.setCursor(0, 1);
    lcd.print("found! Check I2C");
    Serial.println("MAX30102 was not found. Check wiring.");
    while (1);                  // ここで止まる
  }

  // センサーの測定設定
  // setup(LEDの明るさ, サンプル平均, モード, サンプルレート, パルス幅, ADCレンジ)
  //   明るさ60(0-255) / 4回平均 / モード2=Red+IR / 100Hz / 411us / 4096
  particleSensor.setup(60, 4, 2, 100, 411, 4096);

  lcd.clear();
  lcd.print("Place finger");
  lcd.setCursor(0, 1);
  lcd.print("on sensor...");
}

void loop()
{
  // ---- (1) 指が乗るまで待つ ----
  if (particleSensor.getIR() < FINGER_THRESHOLD) {
    lcd.clear();
    lcd.print("Place finger");
    lcd.setCursor(0, 1);
    lcd.print("on sensor...");
    delay(500);
    return;                     // loop()の先頭からやり直し
  }

  lcd.clear();
  lcd.print("Measuring...");
  lcd.setCursor(0, 1);
  lcd.print("Hold still 5s");

  // ---- (2) 最初の100サンプル(約4秒)を読み込む ----
  for (int i = 0; i < bufferLength; i++) {
    while (!particleSensor.available()) {
      particleSensor.check();   // 新しいデータが来るまで待つ
    }
    redBuffer[i] = particleSensor.getRed();
    irBuffer[i]  = particleSensor.getIR();
    particleSensor.nextSample();
  }

  // 100サンプルからHRとSpO2を計算
  maxim_heart_rate_and_oxygen_saturation(
      irBuffer, bufferLength, redBuffer,
      &spo2, &validSPO2, &heartRate, &validHeartRate);

  // ---- (3) 以降は25サンプルずつ入れ替えながら更新し続ける ----
  while (particleSensor.getIR() >= FINGER_THRESHOLD) {

    // 古い25サンプルを捨て、残り75サンプルを前に詰める
    for (int i = 25; i < 100; i++) {
      redBuffer[i - 25] = redBuffer[i];
      irBuffer[i - 25]  = irBuffer[i];
    }

    // 新しい25サンプル(約1秒分)を後ろに追加
    for (int i = 75; i < 100; i++) {
      while (!particleSensor.available()) {
        particleSensor.check();
      }
      redBuffer[i] = particleSensor.getRed();
      irBuffer[i]  = particleSensor.getIR();
      particleSensor.nextSample();
    }

    // 最新の100サンプルで再計算
    maxim_heart_rate_and_oxygen_saturation(
        irBuffer, bufferLength, redBuffer,
        &spo2, &validSPO2, &heartRate, &validHeartRate);

    // ---- (4) LCDに表示 ----
    lcd.clear();

    lcd.setCursor(0, 0);        // 1行目: 心拍数
    lcd.print("HR  : ");
    if (validHeartRate && heartRate > 30 && heartRate < 220) {
      lcd.print(heartRate);
      lcd.print(" bpm");
    } else {
      lcd.print("---");
    }

    lcd.setCursor(0, 1);        // 2行目: SpO2
    lcd.print("SpO2: ");
    if (validSPO2 && spo2 > 70 && spo2 <= 100) {
      lcd.print(spo2);
      lcd.print(" %");
    } else {
      lcd.print("---");
    }

    // ---- (5) BLEで通知(有効な値だけ) ----
    notifyVitals();

    // シリアルモニタにも出力(デバッグ用)
    Serial.print("HR=");
    Serial.print(heartRate);
    Serial.print(" (valid=");
    Serial.print(validHeartRate);
    Serial.print(")  SpO2=");
    Serial.print(spo2);
    Serial.print(" (valid=");
    Serial.print(validSPO2);
    Serial.println(")");
  }
  // 指が離れたら while を抜けて loop() の先頭に戻り、
  // 再び「Place finger」の待機状態になる
}
