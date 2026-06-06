import { Suspense } from 'react'
import { VitalDashboard } from '@/components/vitals/VitalDashboard'
import { HeartPulse } from 'lucide-react'

interface Props {
  searchParams: { id?: string }
}

export default function DashboardPage({ searchParams }: Props) {
  const selectedId = searchParams.id

  if (!selectedId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
        <HeartPulse className="h-16 w-16 mb-4 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold mb-2">介護対象者を選択してください</h2>
        <p className="text-sm">左のサイドバーから介護対象者をクリックするとバイタルを表示します</p>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">読み込み中...</div>}>
      <VitalDashboard careRecipientId={selectedId} />
    </Suspense>
  )
}
