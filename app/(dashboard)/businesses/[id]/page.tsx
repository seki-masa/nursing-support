import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Building2, Pencil } from 'lucide-react'

interface Props {
  params: { id: string }
}

export default async function BusinessDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const me = session.user as { id?: string; role?: string; businessId?: string }
  // 自社の情報のみ閲覧可能
  if (params.id !== me.businessId) notFound()

  const business = await prisma.business.findUnique({ where: { id: params.id } })
  if (!business) notFound()

  const isAdmin = me.role === 'ADMIN'

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{business.companyName}</h1>
          </div>
        </div>
        {isAdmin && (
          <Link href={`/businesses/${business.id}/edit`} className="flex-shrink-0">
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1.5" />
              編集
            </Button>
          </Link>
        )}
      </div>

      {/* Detail card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            事業者情報
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="事業者ID" value={business.code} />
          <InfoRow label="会社名" value={business.companyName} />
          <InfoRow label="会社住所" value={business.address} />
          <InfoRow label="担当者名" value={business.contactName} />
          <InfoRow label="電話番号" value={business.phone} />
          <InfoRow label="メールアドレス" value={business.email} />
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground mb-0.5">{label}</dt>
      <dd className="font-medium break-words">{value}</dd>
    </div>
  )
}
