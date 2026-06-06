import type {
  CareStatus,
  Gender,
  BloodType,
  Edema,
  InputMethod,
  Role,
} from '@prisma/client'

export type { CareStatus, Gender, BloodType, Edema, InputMethod, Role }

export interface CareRecipientListItem {
  id: string
  name: string
  nameKana: string
  status: CareStatus | null  // 最新バイタルのステータス。バイタル未記録はnull
  room: string | null
}

export interface FamilyItem {
  id: string
  name: string
  relationship: string
  phone: string | null
  email: string | null
  notes: string | null
}

export interface CareRecipientDetail {
  id: string
  name: string
  nameKana: string
  gender: Gender
  birthDate: string
  bloodType: BloodType | null
  room: string | null
  status: CareStatus | null  // 最新バイタルから導出
  deceasedAt: string | null  // 最新の死亡ステータスバイタルから導出
  dischargedAt: string | null
  notes: string | null
  medicalConditions: { id: string; name: string }[]
  allergies: { id: string; name: string }[]
  families: FamilyItem[]
}

export interface VitalRecord {
  id: string
  recordedAt: string
  recorder: { id: string; name: string }
  status: CareStatus | null
  deceasedAt: string | null
  dischargedAt: string | null
  systolicBp: number | null
  diastolicBp: number | null
  heartRate: number | null
  respiratoryRate: number | null
  temperature: number | null
  spo2: number | null
  weight: number | null
  bloodSugar: number | null
  consciousnessLevel: number | null
  painScore: number | null
  edema: Edema | null
  urineOutput: number | null
  inputMethod: InputMethod
  notes: string | null
}

export const STATUS_ORDER: CareStatus[] = [
  'CRITICAL',
  'SEVERE',
  'CAUTION',
  'OBSERVATION',
  'HEALTHY',
  'DECEASED',
  'DISCHARGED',
]

export const STATUS_CONFIG: Record<
  CareStatus,
  { label: string; badgeClass: string; textClass: string; dotClass: string }
> = {
  CRITICAL:    { label: '危篤',     badgeClass: 'bg-red-600 text-white',     textClass: 'text-red-600',    dotClass: 'bg-red-600' },
  SEVERE:      { label: '重篤',     badgeClass: 'bg-orange-600 text-white',  textClass: 'text-orange-600', dotClass: 'bg-orange-600' },
  CAUTION:     { label: '要注意',   badgeClass: 'bg-yellow-500 text-white',  textClass: 'text-yellow-600', dotClass: 'bg-yellow-500' },
  OBSERVATION: { label: '経過観察', badgeClass: 'bg-blue-600 text-white',    textClass: 'text-blue-600',   dotClass: 'bg-blue-600' },
  HEALTHY:     { label: '健康',     badgeClass: 'bg-green-600 text-white',   textClass: 'text-green-600',  dotClass: 'bg-green-600' },
  DECEASED:    { label: '死亡',     badgeClass: 'bg-gray-500 text-white',    textClass: 'text-gray-500',   dotClass: 'bg-gray-500' },
  DISCHARGED:  { label: '退院',     badgeClass: 'bg-gray-400 text-white',    textClass: 'text-gray-400',   dotClass: 'bg-gray-400' },
}

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: '男性',
  FEMALE: '女性',
  OTHER: 'その他',
}

export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  A_PLUS: 'A+',
  A_MINUS: 'A-',
  B_PLUS: 'B+',
  B_MINUS: 'B-',
  O_PLUS: 'O+',
  O_MINUS: 'O-',
  AB_PLUS: 'AB+',
  AB_MINUS: 'AB-',
}
