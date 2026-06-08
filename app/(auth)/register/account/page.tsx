'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HeartPulse, Info } from 'lucide-react'

export default function AccountRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    businessCode: '',
    email: '',
    name: '',
    password: '',
    passwordConfirm: '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<keyof typeof form, string>>({
    businessCode: '',
    email: '',
    name: '',
    password: '',
    passwordConfirm: '',
  })
  const [loading, setLoading] = useState(false)

  const LABELS: Record<keyof typeof form, string> = {
    businessCode: '事業者ID',
    email: 'メールアドレス',
    name: 'ユーザ名',
    password: 'パスワード',
    passwordConfirm: 'パスワード（確認）',
  }

  // 各項目の入力チェック。問題なければ空文字を返す
  const validateField = (key: keyof typeof form, value: string, all = form): string => {
    const v = value.trim()
    if (!v) return `${LABELS[key]}を入力してください`
    if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return '正しいメールアドレスを入力してください'
    }
    if (key === 'password' && value.length < 6) {
      return 'パスワードは6文字以上で入力してください'
    }
    if (key === 'passwordConfirm' && value !== all.password) {
      return 'パスワードと確認用パスワードが一致しません'
    }
    return ''
  }

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const next = { ...form, [key]: value }
    setForm(next)
    // 既にエラー表示中の項目は入力に追従して再検証
    setFieldErrors((prev) => {
      const updated = { ...prev }
      if (prev[key]) updated[key] = validateField(key, value, next)
      // パスワード変更時は確認欄のエラーも追従
      if (key === 'password' && prev.passwordConfirm) {
        updated.passwordConfirm = validateField('passwordConfirm', next.passwordConfirm, next)
      }
      return updated
    })
  }

  const handleBlur = (key: keyof typeof form) => (e: React.FocusEvent<HTMLInputElement>) => {
    setFieldErrors((prev) => ({ ...prev, [key]: validateField(key, e.target.value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const nextErrors = (Object.keys(form) as (keyof typeof form)[]).reduce(
      (acc, key) => ({ ...acc, [key]: validateField(key, form[key]) }),
      {} as Record<keyof typeof form, string>,
    )
    setFieldErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setLoading(true)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)

    if (res.ok) {
      router.push('/login?registered=1')
      return
    }

    const data = await res.json().catch(() => null)
    if (data?.code === 'BUSINESS_NOT_FOUND') {
      setError('事業者IDが見つかりません。事業者登録がお済みかご確認ください。')
    } else if (data?.code === 'EMAIL_CONFLICT') {
      setError('このメールアドレスは既に使用されています')
    } else {
      setError('登録に失敗しました。入力内容をご確認ください。')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-8">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <HeartPulse className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">アカウント新規登録</CardTitle>
          <CardDescription>アカウント情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-md px-3 py-2 text-xs mb-4">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              先に事業者登録を済ませ、発行された事業者IDをご用意ください。事業者の最初の登録者は管理者になります。
            </span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="businessCode">事業者ID</Label>
              <Input
                id="businessCode"
                placeholder="BIZ-XXXXXXXX"
                value={form.businessCode}
                onChange={update('businessCode')}
                onBlur={handleBlur('businessCode')}
                aria-invalid={!!fieldErrors.businessCode}
                required
              />
              {fieldErrors.businessCode && <p className="text-sm text-red-600">{fieldErrors.businessCode}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">ユーザ名</Label>
              <Input
                id="name"
                placeholder="山田 太郎"
                value={form.name}
                onChange={update('name')}
                onBlur={handleBlur('name')}
                aria-invalid={!!fieldErrors.name}
                required
              />
              {fieldErrors.name && <p className="text-sm text-red-600">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.com"
                value={form.email}
                onChange={update('email')}
                onBlur={handleBlur('email')}
                aria-invalid={!!fieldErrors.email}
                autoComplete="email"
                required
              />
              {fieldErrors.email && <p className="text-sm text-red-600">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード（6文字以上）</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={update('password')}
                onBlur={handleBlur('password')}
                aria-invalid={!!fieldErrors.password}
                autoComplete="new-password"
                required
              />
              {fieldErrors.password && <p className="text-sm text-red-600">{fieldErrors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">パスワード（確認）</Label>
              <Input
                id="passwordConfirm"
                type="password"
                value={form.passwordConfirm}
                onChange={update('passwordConfirm')}
                onBlur={handleBlur('passwordConfirm')}
                aria-invalid={!!fieldErrors.passwordConfirm}
                autoComplete="new-password"
                required
              />
              {fieldErrors.passwordConfirm && <p className="text-sm text-red-600">{fieldErrors.passwordConfirm}</p>}
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登録中...' : 'アカウントを登録'}
            </Button>
            <Link href="/login" className="block text-center text-sm text-blue-600 hover:underline">
              ログイン画面へ戻る
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
