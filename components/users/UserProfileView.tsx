'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { ArrowLeft, Pencil, Trash2, User } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'STAFF'
  createdAt: string
}

interface UserProfileViewProps {
  user: UserProfile
  currentUserId: string
  currentUserRole: string
}

const ROLE_CONFIG = {
  ADMIN: { label: '管理者', className: 'bg-purple-600 text-white px-2.5 py-0.5 rounded-full text-xs font-medium' },
  STAFF: { label: 'スタッフ', className: 'bg-slate-400 text-white px-2.5 py-0.5 rounded-full text-xs font-medium' },
}

export function UserProfileView({ user, currentUserId, currentUserRole }: UserProfileViewProps) {
  const router = useRouter()
  const isOwnProfile = currentUserId === user.id
  const isAdmin = currentUserRole === 'ADMIN'

  const handleDelete = async () => {
    if (!confirm(`${user.name} さんを削除しますか？\nこの操作は元に戻せません。`)) return
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'ユーザを削除しました' })
      router.push('/users')
      router.refresh()
    } else {
      const data = await res.json()
      toast({ title: data.error ?? '削除に失敗しました', variant: 'destructive' })
    }
  }

  const roleConfig = ROLE_CONFIG[user.role]

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(isAdmin ? '/users' : '/dashboard')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <span className={roleConfig.className}>{roleConfig.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/users/${user.id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-1.5" />
            編集
          </Button>
          {!isOwnProfile && isAdmin && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              削除
            </Button>
          )}
        </div>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            ユーザ情報
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="氏名" value={user.name} />
          <InfoRow label="メールアドレス" value={user.email} />
          <InfoRow label="ロール" value={<span className={roleConfig.className}>{roleConfig.label}</span>} />
          <InfoRow
            label="登録日"
            value={new Date(user.createdAt).toLocaleDateString('ja-JP')}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground mb-0.5">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
