'use client'

import { useRouter } from 'next/navigation'
import { format, differenceInYears } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/sidebar/StatusBadge'
import {
  GENDER_LABELS,
  BLOOD_TYPE_LABELS,
  STATUS_CONFIG,
} from '@/types'
import type { CareRecipientDetail } from '@/types'
import {
  User,
  Calendar,
  Droplets,
  MapPin,
  AlertTriangle,
  Heart,
  Users,
  FileText,
  ArrowLeft,
  Pencil,
  Trash2,
} from 'lucide-react'

interface ProfileViewProps {
  recipient: CareRecipientDetail
  currentUserRole?: string
  onDelete?: () => void
}

export function ProfileView({ recipient, currentUserRole, onDelete }: ProfileViewProps) {
  const router = useRouter()
  const age = differenceInYears(new Date(), new Date(recipient.birthDate))
  const isAdmin = currentUserRole === 'ADMIN'

  const handleDelete = async () => {
    if (!confirm(`${recipient.name} さんのデータを削除しますか？\nこの操作は元に戻せません。`)) return
    const res = await fetch(`/api/care-recipients/${recipient.id}`, { method: 'DELETE' })
    if (res.ok) {
      window.dispatchEvent(new CustomEvent('careRecipientsUpdated'))
      router.push('/dashboard')
      router.refresh()
      onDelete?.()
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard?id=${recipient.id}`)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{recipient.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground">{recipient.nameKana}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/care-recipients/${recipient.id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            編集
          </Button>
          {isAdmin && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              削除
            </Button>
          )}
        </div>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            基本情報
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="性別" value={GENDER_LABELS[recipient.gender]} />
          <InfoRow
            label="誕生日"
            value={`${format(new Date(recipient.birthDate), 'yyyy年M月d日', { locale: ja })}（${age}歳）`}
          />
          <InfoRow
            label="血液型"
            value={recipient.bloodType ? BLOOD_TYPE_LABELS[recipient.bloodType] : '未登録'}
          />
          <InfoRow label="病室" value={recipient.room ?? '未登録'} />
        </CardContent>
      </Card>

      {/* Medical / Allergies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              持病
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recipient.medicalConditions.length === 0 ? (
              <p className="text-sm text-muted-foreground">登録なし</p>
            ) : (
              <ul className="space-y-1">
                {recipient.medicalConditions.map((c) => (
                  <li key={c.id} className="text-sm flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              アレルギー
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recipient.allergies.length === 0 ? (
              <p className="text-sm text-muted-foreground">登録なし</p>
            ) : (
              <ul className="space-y-1">
                {recipient.allergies.map((a) => (
                  <li key={a.id} className="text-sm flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {a.name}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Families */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            家族 ({recipient.families.length}名)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recipient.families.length === 0 ? (
            <p className="text-sm text-muted-foreground">登録なし</p>
          ) : (
            <div className="space-y-3">
              {recipient.families.map((family, i) => (
                <div key={family.id}>
                  {i > 0 && <Separator className="my-3" />}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <InfoRow label="氏名" value={family.name} />
                    <InfoRow label="続柄" value={family.relationship} />
                    {family.phone && <InfoRow label="電話" value={family.phone} />}
                    {family.email && <InfoRow label="メール" value={family.email} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {recipient.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              備考
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{recipient.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground mb-0.5">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
