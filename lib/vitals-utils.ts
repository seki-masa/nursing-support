export interface VitalRange {
  min: number
  max: number
  unit: string
  label: string
}

export const VITAL_RANGES: Record<string, VitalRange> = {
  systolicBp:        { min: 90,   max: 139,  unit: 'mmHg', label: '収縮期血圧' },
  diastolicBp:       { min: 60,   max: 89,   unit: 'mmHg', label: '拡張期血圧' },
  heartRate:         { min: 60,   max: 100,  unit: 'bpm',  label: '心拍数' },
  respiratoryRate:   { min: 12,   max: 20,   unit: '回/分', label: '呼吸数' },
  temperature:       { min: 36.0, max: 37.4, unit: '℃',    label: '体温' },
  spo2:              { min: 96,   max: 100,  unit: '%',    label: 'SpO2' },
  bloodSugar:        { min: 70,   max: 140,  unit: 'mg/dL', label: '血糖値' },
  painScore:         { min: 0,    max: 10,   unit: '',     label: '疼痛スコア' },
}

export type AbnormalLevel = 'normal' | 'warning' | 'danger'

export function getAbnormalLevel(field: string, value: number): AbnormalLevel {
  const range = VITAL_RANGES[field]
  if (!range) return 'normal'
  if (value < range.min || value > range.max) {
    const deviation = Math.max(
      range.min > 0 ? (range.min - value) / range.min : 0,
      range.max > 0 ? (value - range.max) / range.max : 0,
    )
    return deviation > 0.15 ? 'danger' : 'warning'
  }
  return 'normal'
}

export function isAbnormal(field: string, value: number): boolean {
  return getAbnormalLevel(field, value) !== 'normal'
}

export const EDEMA_LABELS: Record<string, string> = {
  NONE: 'なし',
  MILD: '+',
  MODERATE: '++',
  SEVERE: '+++',
}

// 浮腫の重症度レベル（0=なし 〜 3=高度）。グラフ表示用
export const EDEMA_LEVEL: Record<string, number> = {
  NONE: 0,
  MILD: 1,
  MODERATE: 2,
  SEVERE: 3,
}

export const JCS_LABELS: Record<number, string> = {
  0: '清明',
  1: '呼びかけると開眼',
  2: '大声で呼ぶと開眼',
  3: '痛み刺激で開眼',
  10: '見当識障害あり',
  20: '自分の名前がわからない',
  30: '場所・日時がわからない',
  100: '痛み刺激で払いのけ',
  200: '痛み刺激で手足を動かす',
  300: '痛み刺激にも反応しない',
}
