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
  const [loading, setLoading] = useState(false)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.passwordConfirm) {
      setError('パスワードと確認用パスワードが一致しません')
      return
    }

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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessCode">事業者ID</Label>
              <Input id="businessCode" placeholder="BIZ-XXXXXXXX" value={form.businessCode} onChange={update('businessCode')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">ユーザ名</Label>
              <Input id="name" value={form.name} onChange={update('name')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" value={form.email} onChange={update('email')} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード（6文字以上）</Label>
              <Input id="password" type="password" value={form.password} onChange={update('password')} required autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">パスワード（確認）</Label>
              <Input id="passwordConfirm" type="password" value={form.passwordConfirm} onChange={update('passwordConfirm')} required autoComplete="new-password" />
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
