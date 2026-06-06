'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'STAFF'
}

interface UserEditFormProps {
  user?: UserData
  mode: 'create' | 'edit'
  currentUserRole: string
}

const createSchema = z.object({
  name: z.string().min(1, '氏名は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上です'),
  role: z.enum(['ADMIN', 'STAFF']),
})

const editSchema = z.object({
  name: z.string().min(1, '氏名は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上です').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
})

export function UserEditForm({ user, mode, currentUserRole }: UserEditFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const isAdmin = currentUserRole === 'ADMIN'
  const schema = mode === 'create' ? createSchema : editSchema

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      password: '',
      role: user?.role ?? 'STAFF',
    },
  })

  const onSubmit = async (data: z.infer<typeof createSchema> | z.infer<typeof editSchema>) => {
    setSaving(true)
    try {
      const body: Record<string, string> = {
        name: data.name,
        email: data.email,
      }
      if (data.password) body.password = data.password
      if (isAdmin && data.role) body.role = data.role

      const url = mode === 'create' ? '/api/users' : `/api/users/${user!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 409) {
        toast({ title: 'このメールアドレスは既に使用されています', variant: 'destructive' })
        return
      }
      if (!res.ok) throw new Error()

      const saved = await res.json()
      toast({ title: mode === 'create' ? 'ユーザーを登録しました' : '更新しました' })
      router.push(`/users/${saved.id}`)
      router.refresh()
    } catch {
      toast({ title: '保存に失敗しました', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => isAdmin ? router.push('/users') : router.push(`/users/${user?.id}`)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold">
          {mode === 'create' ? 'ユーザー新規登録' : 'ユーザー編集'}
        </h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ユーザー情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">氏名 *</Label>
            <Input id="name" {...register('name')} placeholder="山田 太郎" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">メールアドレス *</Label>
            <Input id="email" type="email" {...register('email')} placeholder="example@mail.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">
              パスワード {mode === 'create' ? '*' : '（変更する場合のみ入力）'}
            </Label>
            <Input id="password" type="password" {...register('password')} placeholder="6文字以上" />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message as string}</p>}
          </div>

          {isAdmin && (
            <div className="space-y-1">
              <Label>ロール</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value ?? 'STAFF'} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">スタッフ</SelectItem>
                      <SelectItem value="ADMIN">管理者</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
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
