'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TagInput } from './TagInput'
import { FamilySection } from './FamilySection'
import { toast } from '@/components/ui/use-toast'
import type { CareRecipientDetail, FamilyItem } from '@/types'
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, '氏名は必須です'),
  nameKana: z.string().min(1, 'ふりがなは必須です'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  birthDate: z.string().min(1, '誕生日は必須です'),
  bloodType: z.enum(['A_PLUS', 'A_MINUS', 'B_PLUS', 'B_MINUS', 'O_PLUS', 'O_MINUS', 'AB_PLUS', 'AB_MINUS', 'UNSET']).optional(),
  room: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface ProfileEditFormProps {
  recipient?: CareRecipientDetail
  mode: 'create' | 'edit'
}

export function ProfileEditForm({ recipient, mode }: ProfileEditFormProps) {
  const router = useRouter()
  const [medicalConditions, setMedicalConditions] = useState<string[]>(
    recipient?.medicalConditions.map((m) => m.name) ?? []
  )
  const [allergies, setAllergies] = useState<string[]>(
    recipient?.allergies.map((a) => a.name) ?? []
  )
  const [families, setFamilies] = useState<FamilyItem[]>(recipient?.families ?? [])
  const [saving, setSaving] = useState(false)
  const updatedAtRef = recipient?.updatedAt ?? ''

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: recipient?.name ?? '',
      nameKana: recipient?.nameKana ?? '',
      gender: recipient?.gender ?? 'MALE',
      birthDate: recipient?.birthDate ? recipient.birthDate.substring(0, 10) : '',
      bloodType: (recipient?.bloodType ?? 'UNSET') as FormData['bloodType'],
      room: recipient?.room ?? '',
      notes: recipient?.notes ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const body = {
        ...data,
        bloodType: data.bloodType === 'UNSET' ? null : (data.bloodType ?? null),
        room: data.room || null,
        notes: data.notes || null,
        medicalConditions,
        allergies,
        ...(mode === 'edit' ? { expectedUpdatedAt: updatedAtRef } : {}),
      }

      const url = mode === 'create'
        ? '/api/care-recipients'
        : `/api/care-recipients/${recipient!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 410) {
        toast({ title: 'この介護対象者は既に削除されています', variant: 'destructive' })
        window.dispatchEvent(new CustomEvent('careRecipientsUpdated'))
        router.push('/dashboard')
        return
      }
      if (res.status === 409) {
        toast({ title: '他のユーザーがこのデータを編集しました。最新のデータを確認してください', variant: 'destructive' })
        return
      }
      if (!res.ok) throw new Error()

      const saved = await res.json()
      toast({ title: mode === 'create' ? '登録しました' : '更新しました' })
      window.dispatchEvent(new CustomEvent('careRecipientsUpdated'))
      router.push(`/care-recipients/${saved.id}`)
      router.refresh()
    } catch {
      toast({ title: '保存に失敗しました', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
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
        <h1 className="text-xl font-bold">
          {mode === 'create' ? '介護対象者 新規登録' : 'プロフィール編集'}
        </h1>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">氏名 *</Label>
            <Input id="name" {...register('name')} placeholder="山田 花子" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="nameKana">ふりがな *</Label>
            <Input id="nameKana" {...register('nameKana')} placeholder="やまだ はなこ" />
            {errors.nameKana && <p className="text-xs text-destructive">{errors.nameKana.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>性別 *</Label>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">男性</SelectItem>
                    <SelectItem value="FEMALE">女性</SelectItem>
                    <SelectItem value="OTHER">その他</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="birthDate">誕生日 *</Label>
            <Input id="birthDate" type="date" {...register('birthDate')} />
            {errors.birthDate && <p className="text-xs text-destructive">{errors.birthDate.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>血液型</Label>
            <Controller
              control={control}
              name="bloodType"
              render={({ field }) => (
                <Select value={field.value ?? 'UNSET'} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="未選択" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNSET">未登録</SelectItem>
                    {['A_PLUS','A_MINUS','B_PLUS','B_MINUS','O_PLUS','O_MINUS','AB_PLUS','AB_MINUS'].map((bt) => (
                      <SelectItem key={bt} value={bt}>
                        {bt.replace('_PLUS', '+').replace('_MINUS', '-')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="room">病室</Label>
            <Input id="room" {...register('room')} placeholder="301号室" />
          </div>
        </CardContent>
      </Card>

      {/* Medical conditions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">持病</CardTitle>
        </CardHeader>
        <CardContent>
          <TagInput
            value={medicalConditions}
            onChange={setMedicalConditions}
            placeholder="例：高血圧症（Enterで追加）"
          />
        </CardContent>
      </Card>

      {/* Allergies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">アレルギー</CardTitle>
        </CardHeader>
        <CardContent>
          <TagInput
            value={allergies}
            onChange={setAllergies}
            placeholder="例：卵（Enterで追加）"
          />
        </CardContent>
      </Card>

      {/* Families */}
      {mode === 'edit' && recipient && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">家族</CardTitle>
          </CardHeader>
          <CardContent>
            <FamilySection
              careRecipientId={recipient.id}
              families={families}
              onChange={setFamilies}
            />
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">備考</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('notes')}
            placeholder="特記事項、注意事項など..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3 pb-6">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? '保存中...' : mode === 'create' ? '登録する' : '保存する'}
        </Button>
      </div>
    </form>
  )
}
