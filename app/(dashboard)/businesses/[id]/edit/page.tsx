import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BusinessEditForm } from '@/components/business/BusinessEditForm'

interface Props {
  params: { id: string }
}

export default async function EditBusinessPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const me = session.user as { id?: string; role?: string; businessId?: string }
  // 編集は管理者かつ自社のみ
  if (me.role !== 'ADMIN' || params.id !== me.businessId) redirect(`/businesses/${params.id}`)

  const business = await prisma.business.findUnique({ where: { id: params.id } })
  if (!business) notFound()

  return <BusinessEditForm business={business} />
}
