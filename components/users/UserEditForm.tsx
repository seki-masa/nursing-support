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
  currentUserId?: string
}

function buildSchema(mode: 'create' | 'edit', isOwnProfile: boolean) {
  if (mode === 'create') {
    return z
      .object({
        name: z.string().min(1, '氏名は必須です'),
        email: z.string().email('有効なメールアドレスを入力してください'),
        currentPassword: z.string().optional().or(z.literal('')),
        password: z.string().min(6, 'パスワードは6文字以上です'),
        passwordConfirm: z.string().min(1, '確認用パスワードを入力してください'),
        role: z.enum(['ADMIN', 'STAFF']),
      })
      .superRefine((d, ctx) => {
        if (d.password !== d.passwordConfirm) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['passwordConfirm'], message: 'パスワードが一致しません' })
        }
      })
  }
  return z
    .object({
      name: z.string().min(1, '氏名は必須です'),
      email: z.string().email('有効なメールアドレスを入力してください'),
      currentPassword: z.string().optional().or(z.literal('')),
      password: z.string().optional().or(z.literal('')),
      passwordConfirm: z.string().optional().or(z.literal('')),
      role: z.enum(['ADMIN', 'STAFF']).optional(),
    })
    .superRefine((d, ctx) => {
      if (d.password) {
        if (d.password.length < 6) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'パスワードは6文字以上です' })
        }
        if (d.password !== d.passwordConfirm) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['passwordConfirm'], message: 'パスワードが一致しません' })
        }
        if (isOwnProfile && !d.currentPassword) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['currentPassword'], message: '現在のパスワードを入力してください' })
        }
      }
    })
}

type FormValues = {
  name: string
  email: string
  currentPassword?: string
  password?: string
  passwordConfirm?: string
  role?: 'ADMIN' | 'STAFF'
}

export function UserEditForm({ user, mode, currentUserRole, currentUserId }: UserEditFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const isAdmin = currentUserRole === 'ADMIN'
  const isOwnProfile = !!currentUserId && currentUserId === user?.id
  const schema = buildSchema(mode, isOwnProfile)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      currentPassword: '',
      password: '',
      passwordConfirm: '',
      role: user?.role ?? 'STAFF',
    },
  })

  const onSubmit = async (data: FormValues) => {
    setSaving(true)
    try {
      const body: Record<string, string> = {
        name: data.name,
        email: data.email,
      }
      if (data.password) {
        body.password = data.password
        if (data.currentPassword) body.currentPassword = data.currentPassword
      }
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
      if (res.status === 422) {
        toast({ title: '現在のパスワードが正しくありません', variant: 'destructive' })
        return
      }
      if (!res.ok) throw new Error()

      const saved = await res.json()
      toast({ title: mode === 'create' ? 'ユーザを登録しました' : '更新しました' })
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
          {mode === 'create' ? 'ユーザ新規登録' : 'ユーザ編集'}
        </h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ユーザ情報</CardTitle>
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

      {/* Password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {mode === 'create' ? 'パスワード設定' : 'パスワード変更'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'edit' && isOwnProfile && (
            <div className="space-y-1">
              <Label htmlFor="currentPassword">現在のパスワード</Label>
              <Input id="currentPassword" type="password" {...register('currentPassword')} placeholder="変更する場合は入力" />
              {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message as string}</p>}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="password">
              {mode === 'create' ? '新しいパスワード *' : '新しいパスワード（変更する場合のみ入力）'}
            </Label>
            <Input id="password" type="password" {...register('password')} placeholder="6文字以上" />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message as string}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="passwordConfirm">
              {mode === 'create' ? 'パスワード（確認用） *' : 'パスワード（確認用）'}
            </Label>
            <Input id="passwordConfirm" type="password" {...register('passwordConfirm')} placeholder="同じパスワードを再入力" />
            {errors.passwordConfirm && <p className="text-xs text-destructive">{errors.passwordConfirm.message as string}</p>}
          </div>
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
