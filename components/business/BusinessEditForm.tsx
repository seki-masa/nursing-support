'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Building2 } from 'lucide-react'

interface BusinessData {
  id: string
  code: string
  companyName: string
  address: string
  contactName: string
  phone: string
  email: string
}

type FormKey = 'companyName' | 'address' | 'contactName' | 'phone' | 'email'

const LABELS: Record<FormKey, string> = {
  companyName: '会社名',
  address: '会社住所',
  contactName: '担当者名',
  phone: '電話番号',
  email: 'メールアドレス',
}

export function BusinessEditForm({ business }: { business: BusinessData }) {
  const router = useRouter()
  const [form, setForm] = useState<Record<FormKey, string>>({
    companyName: business.companyName,
    address: business.address,
    contactName: business.contactName,
    phone: business.phone,
    email: business.email,
  })
  const [fieldErrors, setFieldErrors] = useState<Record<FormKey, string>>({
    companyName: '',
    address: '',
    contactName: '',
    phone: '',
    email: '',
  })
  const [saving, setSaving] = useState(false)

  // 各項目の入力チェック。問題なければ空文字を返す
  const validateField = (key: FormKey, value: string): string => {
    const v = value.trim()
    if (!v) return `${LABELS[key]}を入力してください`
    if (key === 'phone') {
      if (!/^[0-9-]+$/.test(v)) return '半角数字とハイフンのみで入力してください'
      if (!/^0\d{9,10}$/.test(v.replace(/-/g, ''))) {
        return '正しい電話番号を入力してください（市外局番から数字10〜11桁）'
      }
    }
    if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return '正しいメールアドレスを入力してください'
    }
    return ''
  }

  const update = (key: FormKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: validateField(key, value) }))
    }
  }

  const handleBlur = (key: FormKey) => (e: React.FocusEvent<HTMLInputElement>) => {
    setFieldErrors((prev) => ({ ...prev, [key]: validateField(key, e.target.value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nextErrors = (Object.keys(form) as FormKey[]).reduce(
      (acc, key) => ({ ...acc, [key]: validateField(key, form[key]) }),
      {} as Record<FormKey, string>,
    )
    setFieldErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setSaving(true)
    try {
      const res = await fetch(`/api/businesses/${business.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast({ title: '事業者情報を更新しました' })
      router.push(`/businesses/${business.id}`)
      router.refresh()
    } catch {
      toast({ title: '保存に失敗しました', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 max-w-2xl mx-auto space-y-6" noValidate>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/businesses/${business.id}`)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold">事業者情報の編集</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            事業者情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>事業者ID</Label>
            <Input value={business.code} disabled />
          </div>

          {(['companyName', 'address', 'contactName'] as FormKey[]).map((key) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key}>{LABELS[key]}</Label>
              <Input
                id={key}
                value={form[key]}
                onChange={update(key)}
                onBlur={handleBlur(key)}
                aria-invalid={!!fieldErrors[key]}
              />
              {fieldErrors[key] && <p className="text-xs text-destructive">{fieldErrors[key]}</p>}
            </div>
          ))}

          <div className="space-y-1">
            <Label htmlFor="phone">{LABELS.phone}</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              maxLength={13}
              placeholder="03-1234-5678"
              value={form.phone}
              onChange={update('phone')}
              onBlur={handleBlur('phone')}
              aria-invalid={!!fieldErrors.phone}
            />
            {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">{LABELS.email}</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@mail.com"
              value={form.email}
              onChange={update('email')}
              onBlur={handleBlur('email')}
              aria-invalid={!!fieldErrors.email}
              autoComplete="email"
            />
            {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          キャンセル
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? '保存中...' : '保存する'}
        </Button>
      </div>
    </form>
  )
}
