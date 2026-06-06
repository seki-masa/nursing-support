import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CareRecipientList } from '@/components/sidebar/CareRecipientList'
import { Suspense } from 'react'
import { HeartPulse } from 'lucide-react'
import { SignOutButton } from '@/components/SignOutButton'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r flex flex-col bg-white">
        {/* Sidebar header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-blue-600 text-white">
          <HeartPulse className="h-5 w-5" />
          <span className="font-semibold text-sm">介護支援バイタル管理</span>
        </div>
        {/* Care recipient list */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">読み込み中...</div>}>
            <CareRecipientList />
          </Suspense>
        </div>
        {/* User info / logout */}
        <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <Link
            href={`/users/${(session.user as { id?: string }).id}`}
            className="truncate hover:text-foreground hover:underline transition-colors"
          >
            {session.user?.name}
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
