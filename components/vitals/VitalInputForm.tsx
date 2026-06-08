'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { VITAL_RANGES } from '@/lib/vitals-utils'
import type { VitalRecord } from '@/types'
import { ArrowLeft, Bluetooth, AlertTriangle } from 'lucide-react'

const END_STATUSES = ['DECEASED', 'DISCHARGED'] as const
const VITAL_REQUIRED_FIELDS = [
  'systolicBp', 'diastolicBp', 'heartRate', 'respiratoryRate',
  'temperature', 'spo2', 'weight', 'bloodSugar',
] as const

const schema = z.object({
  recordedAt: z.string().optional(),
  status: z.enum(['UNSET', 'CRITICAL', 'SEVERE', 'CAUTION', 'OBSERVATION', 'HEALTHY', 'DECEASED', 'DISCHARGED']).optional(),
  systolicBp: z.string().optional(),
  diastolicBp: z.string().optional(),
  heartRate: z.string().optional(),
  respiratoryRate: z.string().optional(),
  temperature: z.string().optional(),
  spo2: z.string().optional(),
  weight: z.string().optional(),
  bloodSugar: z.string().optional(),
  consciousnessLevel: z.string().optional(),
  painScore: z.string().optional(),
  edema: z.enum(['UNSET', 'NONE', 'MILD', 'MODERATE', 'SEVERE']).optional(),
  urineOutput: z.string().optional(),
  notes: z.string().max(1000).optional(),
}).superRefine((data, ctx) => {
  if (END_STATUSES.includes(data.status as typeof END_STATUSES[number])) return
  for (const field of VITAL_REQUIRED_FIELDS) {
    if (!data[field] || data[field]!.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '必須項目です', path: [field] })
    }
  }
})

type FormData = z.infer<typeof schema>

interface VitalInputFormProps {
  careRecipientId: string
  recipientName: string
  mode?: 'create' | 'edit'
  vitalId?: string
  initialVital?: VitalRecord
}

function parseOptionalInt(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null
  const n = parseInt(val)
  return isNaN(n) ? null : n
}

function parseOptionalFloat(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

// API側の許容範囲（サーバ400時に範囲外項目をユーザへ表示するため）
const INPUT_RANGES: Record<string, { label: string; min: number; max: number; unit?: string }> = {
  systolicBp:         { label: '収縮期血圧',   min: 40, max: 300, unit: 'mmHg' },
  diastolicBp:        { label: '拡張期血圧',   min: 20, max: 200, unit: 'mmHg' },
  heartRate:          { label: '心拍数',       min: 20, max: 300, unit: 'bpm' },
  respiratoryRate:    { label: '呼吸数',       min: 0,  max: 60,  unit: '回/分' },
  temperature:        { label: '体温',         min: 30, max: 45,  unit: '℃' },
  spo2:               { label: 'SpO2',         min: 50, max: 100, unit: '%' },
  weight:             { label: '体重',         min: 1,  max: 300, unit: 'kg' },
  bloodSugar:         { label: '血糖値',       min: 20, max: 600, unit: 'mg/dL' },
  consciousnessLevel: { label: '意識レベル',   min: 0,  max: 300 },
  painScore:          { label: '疼痛スコア',   min: 0,  max: 10 },
  urineOutput:        { label: '尿量',         min: 0,  max: 5000, unit: 'mL/日' },
}

// 編集時：既存バイタルをフォーム初期値（文字列ベース）へ変換
function vitalToFormData(v: VitalRecord): FormData {
  const s = (n: number | null | undefined) => (n != null ? String(n) : '')
  return {
    recordedAt: format(new Date(v.recordedAt), "yyyy-MM-dd'T'HH:mm"),
    status: (v.status ?? 'UNSET') as FormData['status'],
    systolicBp: s(v.systolicBp),
    diastolicBp: s(v.diastolicBp),
    heartRate: s(v.heartRate),
    respiratoryRate: s(v.respiratoryRate),
    temperature: s(v.temperature),
    spo2: s(v.spo2),
    weight: s(v.weight),
    bloodSugar: s(v.bloodSugar),
    consciousnessLevel: s(v.consciousnessLevel),
    painScore: s(v.painScore),
    edema: (v.edema ?? 'UNSET') as FormData['edema'],
    urineOutput: s(v.urineOutput),
    notes: v.notes ?? '',
  }
}

export function VitalInputForm({ careRecipientId, recipientName, mode = 'create', vitalId, initialVital }: VitalInputFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const isEdit = mode === 'edit' && !!initialVital

  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm")

  // 死亡・退院確認ダイアログ。編集時は既存の死亡/退院日時を復元
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<'DECEASED' | 'DISCHARGED' | null>(null)
  const [confirmDateTime, setConfirmDateTime] = useState('')
  const [confirmedEventAt, setConfirmedEventAt] = useState<{ DECEASED?: string; DISCHARGED?: string }>(
    isEdit
      ? {
          DECEASED: initialVital!.deceasedAt ? format(new Date(initialVital!.deceasedAt), "yyyy-MM-dd'T'HH:mm") : undefined,
          DISCHARGED: initialVital!.dischargedAt ? format(new Date(initialVital!.dischargedAt), "yyyy-MM-dd'T'HH:mm") : undefined,
        }
      : {}
  )

  const { register, control, handleSubmit, setValue, setError, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? vitalToFormData(initialVital!) : { recordedAt: now, status: 'UNSET', edema: 'UNSET' },
  })

  const watchedStatus = watch('status')

  const handleStatusChange = (newValue: string, fieldOnChange: (v: string) => void) => {
    if (newValue === 'DECEASED' || newValue === 'DISCHARGED') {
      setPendingStatus(newValue)
      setConfirmDateTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
      setShowConfirmDialog(true)
    } else {
      fieldOnChange(newValue)
    }
  }

  const handleConfirm = (fieldOnChange: (v: string) => void) => {
    if (!pendingStatus) return
    fieldOnChange(pendingStatus)
    setConfirmedEventAt((prev) => ({ ...prev, [pendingStatus]: confirmDateTime }))
    setShowConfirmDialog(false)
    setPendingStatus(null)
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const statusValue = data.status === 'UNSET' ? null : (data.status ?? null)
      const body = {
        recordedAt: data.recordedAt ? new Date(data.recordedAt).toISOString() : undefined,
        status: statusValue,
        deceasedAt: statusValue === 'DECEASED' && confirmedEventAt.DECEASED
          ? new Date(confirmedEventAt.DECEASED).toISOString()
          : null,
        dischargedAt: statusValue === 'DISCHARGED' && confirmedEventAt.DISCHARGED
          ? new Date(confirmedEventAt.DISCHARGED).toISOString()
          : null,
        systolicBp: parseOptionalInt(data.systolicBp),
        diastolicBp: parseOptionalInt(data.diastolicBp),
        heartRate: parseOptionalInt(data.heartRate),
        respiratoryRate: parseOptionalInt(data.respiratoryRate),
        temperature: parseOptionalFloat(data.temperature),
        spo2: parseOptionalInt(data.spo2),
        weight: parseOptionalFloat(data.weight),
        bloodSugar: parseOptionalInt(data.bloodSugar),
        consciousnessLevel: parseOptionalInt(data.consciousnessLevel),
        painScore: parseOptionalInt(data.painScore),
        edema: data.edema === 'UNSET' ? null : (data.edema ?? null),
        urineOutput: parseOptionalInt(data.urineOutput),
        notes: data.notes || null,
      }

      const url = isEdit
        ? `/api/care-recipients/${careRecipientId}/vitals/${vitalId}`
        : `/api/care-recipients/${careRecipientId}/vitals`
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 410) {
        toast({ title: 'この介護対象者は既に削除されています', variant: 'destructive' })
        window.dispatchEvent(new CustomEvent('careRecipientsUpdated'))
        router.push('/dashboard')
        return
      }
      if (res.status === 403) {
        toast({ title: '最新のバイタルのみ編集できます', variant: 'destructive' })
        router.push(`/dashboard?id=${careRecipientId}`)
        return
      }
      if (res.status === 400) {
        // サーバの範囲バリデーション失敗。該当項目を各入力欄とトーストに表示
        const errData = await res.json().catch(() => null)
        const fieldErrors: Record<string, string[]> = errData?.error?.fieldErrors ?? {}
        const labels: string[] = []
        for (const field of Object.keys(fieldErrors)) {
          const r = INPUT_RANGES[field]
          if (r) {
            setError(field as keyof FormData, {
              message: `${r.min}〜${r.max}${r.unit ? ` ${r.unit}` : ''} の範囲で入力してください`,
            })
            labels.push(r.label)
          } else {
            labels.push(field)
          }
        }
        toast({
          title: '入力値を確認してください',
          description: labels.length ? `範囲外の項目: ${labels.join('、')}` : '入力内容を確認してください',
          variant: 'destructive',
        })
        return
      }
      if (!res.ok) throw new Error()
      toast({ title: isEdit ? 'バイタルを更新しました' : 'バイタルを記録しました' })
      window.dispatchEvent(new CustomEvent('careRecipientsUpdated'))
      router.push(`/dashboard?id=${careRecipientId}`)
      router.refresh()
    } catch {
      toast({ title: isEdit ? '更新に失敗しました' : '記録に失敗しました', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const rangeHint = (field: string) => {
    const r = VITAL_RANGES[field]
    return r ? `正常: ${r.min}〜${r.max} ${r.unit}` : ''
  }

  const confirmLabel = pendingStatus === 'DECEASED' ? '死亡' : '退院'
  const isEndStatus = watchedStatus === 'DECEASED' || watchedStatus === 'DISCHARGED'
  const RequiredMark = () => isEndStatus ? null : <span className="text-destructive"> *</span>

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{isEdit ? 'バイタル編集' : 'バイタル入力'}</h1>
            <p className="text-sm text-muted-foreground">{recipientName} 様</p>
          </div>
        </div>

        {/* Wearable placeholder */}
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <Bluetooth className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground flex-1">ウェアラブルデバイスから取得（近日実装予定）</span>
          <Button type="button" variant="outline" size="sm" disabled title="近日実装予定">
            デバイスから取得
          </Button>
        </div>

        {/* Record time */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">記録日時</CardTitle>
          </CardHeader>
          <CardContent>
            <Input type="datetime-local" {...register('recordedAt')} />
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ステータス変更</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value ?? 'UNSET'}
                  onValueChange={(v) => handleStatusChange(v, field.onChange)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNSET">変更なし</SelectItem>
                    <SelectItem value="HEALTHY">健康</SelectItem>
                    <SelectItem value="OBSERVATION">経過観察</SelectItem>
                    <SelectItem value="CAUTION">要注意</SelectItem>
                    <SelectItem value="SEVERE">重篤</SelectItem>
                    <SelectItem value="CRITICAL">危篤</SelectItem>
                    <SelectItem value="DECEASED">死亡</SelectItem>
                    <SelectItem value="DISCHARGED">退院</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {/* 死亡・退院日時の確認表示 */}
            {watchedStatus === 'DECEASED' && confirmedEventAt.DECEASED && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                <span className="font-medium whitespace-nowrap shrink-0">死亡日時:</span>
                <Input
                  type="datetime-local"
                  value={confirmedEventAt.DECEASED}
                  onChange={(e) => setConfirmedEventAt((p) => ({ ...p, DECEASED: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            )}
            {watchedStatus === 'DISCHARGED' && confirmedEventAt.DISCHARGED && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                <span className="font-medium whitespace-nowrap shrink-0">退院日時:</span>
                <Input
                  type="datetime-local"
                  value={confirmedEventAt.DISCHARGED}
                  onChange={(e) => setConfirmedEventAt((p) => ({ ...p, DISCHARGED: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">「変更なし」の場合、前回記録のステータスが継続します</p>
          </CardContent>
        </Card>

        {/* Blood pressure + pulse */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">循環器系</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>収縮期血圧（上） <RequiredMark /></Label>
              <Input type="number" {...register('systolicBp')} placeholder="例: 120" />
              {errors.systolicBp
                ? <p className="text-xs text-destructive">{errors.systolicBp.message}</p>
                : <p className="text-xs text-muted-foreground">{rangeHint('systolicBp')}</p>}
            </div>
            <div className="space-y-1">
              <Label>拡張期血圧（下） <RequiredMark /></Label>
              <Input type="number" {...register('diastolicBp')} placeholder="例: 80" />
              {errors.diastolicBp
                ? <p className="text-xs text-destructive">{errors.diastolicBp.message}</p>
                : <p className="text-xs text-muted-foreground">{rangeHint('diastolicBp')}</p>}
            </div>
            <div className="space-y-1">
              <Label>心拍数（脈拍） <RequiredMark /></Label>
              <Input type="number" {...register('heartRate')} placeholder="例: 72" />
              {errors.heartRate
                ? <p className="text-xs text-destructive">{errors.heartRate.message}</p>
                : <p className="text-xs text-muted-foreground">{rangeHint('heartRate')}</p>}
            </div>
            <div className="space-y-1">
              <Label>呼吸数 <RequiredMark /></Label>
              <Input type="number" {...register('respiratoryRate')} placeholder="例: 16" />
              {errors.respiratoryRate
                ? <p className="text-xs text-destructive">{errors.respiratoryRate.message}</p>
                : <p className="text-xs text-muted-foreground">{rangeHint('respiratoryRate')}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Temperature + SpO2 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">体温・酸素飽和度</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>体温 (℃) <RequiredMark /></Label>
              <Input type="number" step="0.1" {...register('temperature')} placeholder="例: 36.5" />
              {errors.temperature
                ? <p className="text-xs text-destructive">{errors.temperature.message}</p>
                : <p className="text-xs text-muted-foreground">{rangeHint('temperature')}</p>}
            </div>
            <div className="space-y-1">
              <Label>SpO2 (%) <RequiredMark /></Label>
              <Input type="number" {...register('spo2')} placeholder="例: 98" />
              {errors.spo2
                ? <p className="text-xs text-destructive">{errors.spo2.message}</p>
                : <p className="text-xs text-muted-foreground">{rangeHint('spo2')}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Weight + Blood sugar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">体重・血糖値</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>体重 (kg) <RequiredMark /></Label>
              <Input type="number" step="0.1" {...register('weight')} placeholder="例: 62.5" />
              {errors.weight && <p className="text-xs text-destructive">{errors.weight.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>血糖値 (mg/dL) <RequiredMark /></Label>
              <Input type="number" {...register('bloodSugar')} placeholder="例: 105" />
              {errors.bloodSugar
                ? <p className="text-xs text-destructive">{errors.bloodSugar.message}</p>
                : <p className="text-xs text-muted-foreground">{rangeHint('bloodSugar')}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Other */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">その他</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>意識レベル (JCS)</Label>
              <Input type="number" {...register('consciousnessLevel')} placeholder="例: 0 (清明)" />
              {errors.consciousnessLevel && <p className="text-xs text-destructive">{errors.consciousnessLevel.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>疼痛スコア (NRS 0-10)</Label>
              <Input type="number" min="0" max="10" {...register('painScore')} placeholder="例: 2" />
              {errors.painScore
                ? <p className="text-xs text-destructive">{errors.painScore.message}</p>
                : <p className="text-xs text-muted-foreground">0〜10（高いほど強い痛み）</p>}
            </div>
            <div className="space-y-1">
              <Label>浮腫</Label>
              <Controller
                control={control}
                name="edema"
                render={({ field }) => (
                  <Select value={field.value ?? 'UNSET'} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="選択..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNSET">未記録</SelectItem>
                      <SelectItem value="NONE">なし</SelectItem>
                      <SelectItem value="MILD">+（軽度）</SelectItem>
                      <SelectItem value="MODERATE">++（中等度）</SelectItem>
                      <SelectItem value="SEVERE">+++（重度）</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>尿量 (mL/日)</Label>
              <Input type="number" {...register('urineOutput')} placeholder="例: 1200" />
              {errors.urineOutput && <p className="text-xs text-destructive">{errors.urineOutput.message}</p>}
            </div>
            <div className="col-span-2 space-y-1">
              <Label>メモ</Label>
              <Textarea {...register('notes')} placeholder="特記事項など..." />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            キャンセル
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? '保存中...' : isEdit ? '更新する' : '記録する'}
          </Button>
        </div>
      </form>

      {/* 死亡・退院確認ダイアログ */}
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <Dialog open={showConfirmDialog} onOpenChange={(open) => {
            if (!open) { setShowConfirmDialog(false); setPendingStatus(null) }
          }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className={`h-5 w-5 ${pendingStatus === 'DECEASED' ? 'text-gray-500' : 'text-blue-500'}`} />
                  {confirmLabel}登録の確認
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{recipientName}</span> 様を
                  <span className={`font-semibold mx-1 ${pendingStatus === 'DECEASED' ? 'text-gray-600' : 'text-blue-600'}`}>
                    {confirmLabel}
                  </span>
                  として登録します。
                </p>
                <div className="space-y-1.5">
                  <Label>{pendingStatus === 'DECEASED' ? '死亡日時' : '退院日時'}</Label>
                  <Input
                    type="datetime-local"
                    value={confirmDateTime}
                    onChange={(e) => setConfirmDateTime(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setShowConfirmDialog(false); setPendingStatus(null)
                }}>
                  キャンセル
                </Button>
                <Button
                  type="button"
                  variant={pendingStatus === 'DECEASED' ? 'secondary' : 'default'}
                  onClick={() => handleConfirm(field.onChange)}
                  disabled={!confirmDateTime}
                >
                  確認して登録
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      />
    </>
  )
}
