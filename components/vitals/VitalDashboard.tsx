'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, differenceInYears } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/sidebar/StatusBadge'
import { VitalCard, BloodPressureCard } from './VitalCard'
import { VitalChart, CHART_CONFIGS } from './VitalChart'
import { EDEMA_LABELS } from '@/lib/vitals-utils'
import type { CareRecipientDetail, VitalRecord } from '@/types'
import {
  User2,
  Activity,
  Plus,
  Clock,
  Bluetooth,
} from 'lucide-react'

interface Props {
  careRecipientId: string
}

export function VitalDashboard({ careRecipientId }: Props) {
  const router = useRouter()
  const [recipient, setRecipient] = useState<CareRecipientDetail | null>(null)
  const [vitals, setVitals] = useState<VitalRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/care-recipients/${careRecipientId}`).then((r) => r.json()),
      fetch(`/api/care-recipients/${careRecipientId}/vitals?days=30`).then((r) => r.json()),
    ]).then(([rec, vits]) => {
      setRecipient(rec)
      setVitals(Array.isArray(vits) ? vits : [])
    }).finally(() => setLoading(false))
  }, [careRecipientId])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>
  }

  if (!recipient) {
    return <div className="p-8 text-center text-muted-foreground">対象者が見つかりません</div>
  }

  const latest = vitals[0] ?? null
  const age = differenceInYears(new Date(), new Date(recipient.birthDate))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{recipient.name} 様</h1>
            {recipient.status
              ? <StatusBadge status={recipient.status} />
              : <span className="text-xs bg-slate-100 text-slate-400 px-2 py-1 rounded-full">未記録</span>
            }
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{age}歳</span>
            {recipient.room && (
              <>
                <span>•</span>
                <span>{recipient.room}</span>
              </>
            )}
            {latest && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  最終記録: {format(new Date(latest.recordedAt), 'M月d日 HH:mm', { locale: ja })}
                </span>
              </>
            )}
            {recipient.status === 'DECEASED' && recipient.deceasedAt && (
              <>
                <span>•</span>
                <span className="whitespace-nowrap">死亡時刻: {format(new Date(recipient.deceasedAt), 'M月d日 HH:mm', { locale: ja })}</span>
              </>
            )}
            {recipient.status === 'DISCHARGED' && recipient.dischargedAt && (
              <>
                <span>•</span>
                <span className="whitespace-nowrap">退院時刻: {format(new Date(recipient.dischargedAt), 'M月d日 HH:mm', { locale: ja })}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/care-recipients/${recipient.id}`)}
          >
            <User2 className="h-4 w-4" />
            プロフィール
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/care-recipients/${recipient.id}/vitals/new`)}
          >
            <Plus className="h-4 w-4" />
            バイタル入力
          </Button>
        </div>
      </div>

      {/* Alerts */}
      
        <div className="flex flex-col gap-2 !mt-2 !mb-2">
          {(recipient.medicalConditions.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {recipient.medicalConditions.slice(0, 3).map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  {c.name}
                </span>
              ))}
            </div>
          )}
          {(recipient.allergies.length > 0) && (
            <div className="flex flex-wrap gap-2">
              {recipient.allergies.slice(0, 3).map((a) => (
                <span key={a.id} className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs">
                  ⚠ {a.name}アレルギー
                </span>
              ))}
            </div>
          )}
        </div>


      <Separator className="!mt-0" />

      {/* Latest vitals */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          最新バイタル
          {latest && (
            <span className="font-normal normal-case">
              — {format(new Date(latest.recordedAt), 'yyyy年M月d日 HH:mm', { locale: ja })}
              　記録者: {latest.recorder.name}
            </span>
          )}
        </h2>

        {!latest ? (
          <div className="text-center py-8 text-muted-foreground border rounded-xl">
            <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">バイタルの記録がありません</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => router.push(`/care-recipients/${recipient.id}/vitals/new`)}
            >
              最初のバイタルを記録する
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <BloodPressureCard systolic={latest.systolicBp} diastolic={latest.diastolicBp} />
            <VitalCard field="heartRate" value={latest.heartRate} />
            <VitalCard field="temperature" value={latest.temperature} />
            <VitalCard field="spo2" value={latest.spo2} />
            <VitalCard field="respiratoryRate" value={latest.respiratoryRate} />
            {latest.weight != null && (
              <div className="rounded-xl border bg-white p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">体重</span>
                <span className="text-2xl font-bold">{latest.weight}</span>
                <span className="text-xs text-muted-foreground">kg</span>
              </div>
            )}
            {latest.bloodSugar != null && (
              <VitalCard field="bloodSugar" value={latest.bloodSugar} />
            )}
            {latest.painScore != null && (
              <VitalCard field="painScore" value={latest.painScore} />
            )}
            {latest.edema != null && latest.edema !== 'NONE' && (
              <div className="rounded-xl border bg-blue-50 border-blue-200 p-4 flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">浮腫</span>
                <span className="text-2xl font-bold text-blue-600">{EDEMA_LABELS[latest.edema]}</span>
              </div>
            )}
            {latest.notes && (
              <div className="col-span-2 rounded-xl border bg-gray-50 p-3 text-sm text-muted-foreground">
                メモ: {latest.notes}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart section */}
      {vitals.length > 1 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            時系列グラフ（過去30日）
          </h2>
          <Card>
            <CardContent className="pt-4">
              <Tabs defaultValue="bp">
                <TabsList className="flex-wrap h-auto gap-1 mb-4">
                  {CHART_CONFIGS.map((c) => (
                    <TabsTrigger key={c.key} value={c.key} className="text-xs">
                      {c.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {CHART_CONFIGS.map((c) => (
                  <TabsContent key={c.key} value={c.key}>
                    <VitalChart vitals={vitals} chartKey={c.key} />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Wearable placeholder */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <Bluetooth className="h-3.5 w-3.5" />
        ウェアラブルデバイス連携は近日実装予定です（Web Bluetooth API）
      </div>
    </div>
  )
}
