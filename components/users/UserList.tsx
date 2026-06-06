'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, UserRound } from 'lucide-react'

interface UserItem {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'STAFF'
  createdAt: string
}

const ROLE_CONFIG = {
  ADMIN: { label: '管理者', className: 'bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-medium' },
  STAFF: { label: 'スタッフ', className: 'bg-slate-400 text-white px-2 py-0.5 rounded-full text-xs font-medium' },
}

interface UserListProps {
  users: UserItem[]
}

export function UserList({ users }: UserListProps) {
  const router = useRouter()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-xl font-bold">ユーザー管理</h1>
        </div>
        <Button size="sm" onClick={() => router.push('/users/new')}>
          <Plus className="h-4 w-4 mr-1.5" />
          ユーザ追加
        </Button>
      </div>

      {/* User list */}
      <div className="border rounded-xl overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            ユーザーが登録されていません
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">氏名</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">メールアドレス</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ロール</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  className={`border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                  onClick={() => router.push(`/users/${user.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium hover:underline">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={ROLE_CONFIG[user.role].className}>
                      {ROLE_CONFIG[user.role].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
