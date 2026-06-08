'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HeartPulse } from 'lucide-react'
import Link from 'next/link'

function ConfirmForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ password: '', passwordConfirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setToken(searchParams.get('token') ?? '')
  }, [searchParams])

  const validate = (pw: string, pwc: string) => ({
    password: !pw ? 'パスワードを入力してください' : pw.length < 6 ? 'パスワードは6文字以上で入力してください' : '',
    passwordConfirm: !pwc ? '確認用パスワードを入力してください' : pwc !== pw ? 'パスワードと確認用パスワードが一致しません' : '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const errs = validate(password, passwordConfirm)
    setFieldErrors(errs)
    if (errs.password || errs.passwordConfirm) return

    if (!token) {
      setError('リンクが無効です。再度パスワード再設定をやり直してください。')
      return
    }

    setLoading(true)
    const res = await fetch('/api/password-reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    setLoading(false)

    if (res.ok) {
      router.push('/login?reset=1')
    } else {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'パスワードの再設定に失敗しました。')
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-600 rounded-full">
            <HeartPulse className="h-8 w-8 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">新しいパスワードの設定</CardTitle>
        <CardDescription>新しいパスワードを入力してください</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">新しいパスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="6文字以上"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password || fieldErrors.passwordConfirm) {
                  setFieldErrors(validate(e.target.value, passwordConfirm))
                }
              }}
              onBlur={() => setFieldErrors(validate(password, passwordConfirm))}
              aria-invalid={!!fieldErrors.password}
              autoComplete="new-password"
            />
            {fieldErrors.password && <p className="text-sm text-red-600">{fieldErrors.password}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">新しいパスワード（確認用）</Label>
            <Input
              id="passwordConfirm"
              type="password"
              placeholder="同じパスワードを再入力"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value)
                if (fieldErrors.passwordConfirm) {
                  setFieldErrors(validate(password, e.target.value))
                }
              }}
              onBlur={() => setFieldErrors(validate(password, passwordConfirm))}
              aria-invalid={!!fieldErrors.passwordConfirm}
              autoComplete="new-password"
            />
            {fieldErrors.passwordConfirm && <p className="text-sm text-red-600">{fieldErrors.passwordConfirm}</p>}
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '設定中...' : 'パスワードを再設定'}
          </Button>
        </form>
        <div className="mt-6 pt-4 border-t text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            ログイン画面へ戻る
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ResetPasswordConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <Suspense fallback={<div className="text-sm text-muted-foreground">読み込み中...</div>}>
        <ConfirmForm />
      </Suspense>
    </div>
  )
}
