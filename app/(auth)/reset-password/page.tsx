'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HeartPulse } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordRequestPage() {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const validate = (value: string): string => {
    const v = value.trim()
    if (!v) return 'メールアドレスを入力してください'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return '正しいメールアドレスを入力してください'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate(email)
    setFieldError(err)
    if (err) return

    setLoading(true)
    await fetch('/api/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    })
    setLoading(false)
    setDone(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <HeartPulse className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">パスワード再設定</CardTitle>
          <CardDescription>登録済みのメールアドレスを入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
                入力されたメールアドレスが登録されている場合、パスワード再設定用のメールを送信しています。メールに記載のURLから再設定してください。
              </p>
              <Link href="/login" className="block text-center text-sm text-blue-600 hover:underline">
                ログイン画面へ戻る
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (fieldError) setFieldError(validate(e.target.value))
                    }}
                    onBlur={(e) => setFieldError(validate(e.target.value))}
                    aria-invalid={!!fieldError}
                  />
                  {fieldError && <p className="text-sm text-red-600">{fieldError}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '送信中...' : '再設定用メールを送信'}
                </Button>
              </form>
              <div className="mt-6 pt-4 border-t text-center text-sm">
                <Link href="/login" className="text-blue-600 hover:underline">
                  ログイン画面へ戻る
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
