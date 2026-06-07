'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HeartPulse, CheckCircle2 } from 'lucide-react'

export default function BusinessRegisterPage() {
  const [form, setForm] = useState({
    companyName: '',
    address: '',
    contactName: '',
    phone: '',
    email: '',
  })
  const [error, setError] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [loading, setLoading] = useState(false)
  const [issuedCode, setIssuedCode] = useState<string | null>(null)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  // 電話番号: 半角数字とハイフンのみ、ハイフンを除いて0始まり10〜11桁
  const validatePhone = (value: string): string => {
    if (!value) return '電話番号を入力してください'
    if (!/^[0-9-]+$/.test(value)) return '半角数字とハイフンのみで入力してください'
    if (!/^0\d{9,10}$/.test(value.replace(/-/g, ''))) {
      return '正しい電話番号を入力してください（市外局番から数字10〜11桁）'
    }
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const phoneMsg = validatePhone(form.phone)
    setPhoneError(phoneMsg)
    if (phoneMsg) return

    setLoading(true)
    setError('')

    const res = await fetch('/api/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setLoading(false)
    if (res.ok) {
      const data = await res.json()
      setIssuedCode(data.code)
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
          <CardTitle className="text-2xl font-bold">事業者登録</CardTitle>
          <CardDescription>事業者情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          {issuedCode ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <p className="text-sm">事業者登録が完了しました。</p>
              <div className="bg-blue-50 border border-blue-200 rounded-md py-4">
                <p className="text-xs text-muted-foreground mb-1">事業者ID</p>
                <p className="text-2xl font-bold tracking-wider text-blue-700">{issuedCode}</p>
              </div>
              <p className="text-sm text-muted-foreground !mb-4">
                この事業者IDをご入力のメールアドレスにも送信しました。<br />
                この事業者IDを使ってアカウント新規登録を行ってください。
              </p>
              <Link href="/register/account">
                <Button className="w-full">アカウント新規登録へ</Button>
              </Link>
              <Link href="/login" className="block text-sm text-blue-600 hover:underline">
                ログイン画面へ戻る
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">会社名</Label>
                <Input id="companyName" value={form.companyName} onChange={update('companyName')} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">会社住所</Label>
                <Input id="address" value={form.address} onChange={update('address')} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactName">担当者名</Label>
                <Input id="contactName" value={form.contactName} onChange={update('contactName')} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  maxLength={13}
                  placeholder="03-1234-5678"
                  value={form.phone}
                  onChange={(e) => {
                    update('phone')(e)
                    if (phoneError) setPhoneError(validatePhone(e.target.value))
                  }}
                  onBlur={(e) => setPhoneError(validatePhone(e.target.value))}
                  aria-invalid={!!phoneError}
                  required
                />
                {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" type="email" value={form.email} onChange={update('email')} required autoComplete="email" />
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登録中...' : '事業者を登録'}
              </Button>
              <Link href="/login" className="block text-center text-sm text-blue-600 hover:underline">
                ログイン画面へ戻る
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
