'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HeartPulse } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [reset, setReset] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('registered') === '1') setRegistered(true)
    if (params.get('reset') === '1') setReset(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)
    if (result?.error) {
      setError('メールアドレスまたはパスワードが正しくありません')
    } else {
      router.push('/dashboard')
    }
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
          <CardTitle className="text-2xl font-bold">介護支援バイタル管理</CardTitle>
          <CardDescription>アカウント情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          {registered && (
            <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md mb-4">
              アカウント登録が完了しました。ログインしてください。
            </p>
          )}
          {reset && (
            <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md mb-4">
              パスワードを再設定しました。新しいパスワードでログインしてください。
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/reset-password" className="text-blue-600 hover:underline">
              パスワードをお忘れの方
            </Link>
          </div>
          <div className="mt-4 pt-4 border-t space-y-2 text-center text-sm">
            <p className="text-muted-foreground">アカウントをお持ちでない方</p>
            <div className="flex flex-col gap-1.5">
              <Link href="/register/account" className="text-blue-600 hover:underline">
                アカウント新規登録
              </Link>
              <Link href="/register/business" className="text-blue-600 hover:underline">
                事業者登録
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
