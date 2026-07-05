// ウェアラブル(ESP32 + MAX30102)から Web Bluetooth 経由で HR/SpO2 を1回取得する。
//
// navigator.bluetooth はブラウザ標準API(Chrome/Edge)だが TS 標準 lib に型が無いため、
// 使用する範囲だけ最小の型をここで定義する(@types/web-bluetooth への依存を避ける)。
// ファームウェア側(MAX30102_LCD/MAX30102_LCD.ino)と UUID を一致させること。

export const SERVICE_UUID = '4b2de81d-c9d1-4e5a-9b7f-2a6c3d8e1f00'
export const CHARACTERISTIC_UUID = '4b2de81d-c9d1-4e5a-9b7f-2a6c3d8e1f01'

interface GattCharacteristic extends EventTarget {
  value?: DataView
  startNotifications(): Promise<GattCharacteristic>
  stopNotifications(): Promise<GattCharacteristic>
}
interface GattService {
  getCharacteristic(uuid: string): Promise<GattCharacteristic>
}
interface GattServer {
  connected: boolean
  connect(): Promise<GattServer>
  disconnect(): void
  getPrimaryService(uuid: string): Promise<GattService>
}
interface BluetoothDeviceLike {
  gatt?: GattServer
}
interface BluetoothLike {
  requestDevice(options: { filters: { services: string[] }[] }): Promise<BluetoothDeviceLike>
}

function getBluetooth(): BluetoothLike | undefined {
  if (typeof navigator === 'undefined') return undefined
  return (navigator as unknown as { bluetooth?: BluetoothLike }).bluetooth
}

export function isWebBluetoothSupported(): boolean {
  return !!getBluetooth()
}

// ユーザがデバイス選択ダイアログをキャンセルしたことを表す。
export class BluetoothCancelledError extends Error {
  constructor() {
    super('デバイス選択がキャンセルされました')
    this.name = 'BluetoothCancelledError'
  }
}

export interface VitalReading {
  heartRate?: number
  spo2?: number
}

// デバイスを1台選んで接続し、有効な HR/SpO2 を取得したら自動切断して返す。
// hr と spo2 の両方が揃った時点、または timeoutMs 経過時点で解決する。
// 取得できなかった項目はキーごと省略される(呼び出し側でフォーム更新を制御できる)。
export async function readVitalsOnce(opts?: { timeoutMs?: number }): Promise<VitalReading> {
  const bluetooth = getBluetooth()
  if (!bluetooth) throw new Error('このブラウザは Web Bluetooth に対応していません')
  const timeoutMs = opts?.timeoutMs ?? 15000

  let device: BluetoothDeviceLike
  try {
    device = await bluetooth.requestDevice({ filters: [{ services: [SERVICE_UUID] }] })
  } catch (e) {
    // 選択ダイアログでキャンセル/未選択の場合は NotFoundError
    if (e instanceof DOMException && e.name === 'NotFoundError') throw new BluetoothCancelledError()
    throw e
  }

  if (!device.gatt) throw new Error('GATT に接続できません')
  const server = await device.gatt.connect()
  const service = await server.getPrimaryService(SERVICE_UUID)
  const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID)

  const result: VitalReading = {}

  try {
    await new Promise<void>((resolve) => {
      let done = false

      const onValue = () => {
        const dv = characteristic.value
        if (!dv) return
        try {
          const json = JSON.parse(new TextDecoder().decode(dv)) as { hr?: number; spo2?: number }
          if (typeof json.hr === 'number') result.heartRate = json.hr
          if (typeof json.spo2 === 'number') result.spo2 = json.spo2
        } catch {
          // 破損フレームは無視して次の通知を待つ
        }
        // 両方揃ったら完了(片方しか来ない場合はタイムアウトで解決)
        if (result.heartRate != null && result.spo2 != null) finish()
      }

      const timer = setTimeout(finish, timeoutMs)

      function finish() {
        if (done) return
        done = true
        clearTimeout(timer)
        characteristic.removeEventListener('characteristicvaluechanged', onValue)
        resolve()
      }

      characteristic.addEventListener('characteristicvaluechanged', onValue)
      characteristic.startNotifications().catch(() => finish())
    })
  } finally {
    // 1回取得の方針: 成否によらず必ず自動切断する
    try {
      await characteristic.stopNotifications()
    } catch {
      // noop
    }
    try {
      if (server.connected) server.disconnect()
    } catch {
      // noop
    }
  }

  return result
}
