import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VitalInputForm } from '@/components/vitals/VitalInputForm'

interface Props {
  params: { id: string }
}

export default async function VitalInputPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const businessId = (session.user as { businessId?: string }).businessId

  const recipient = await prisma.careRecipient.findFirst({
    where: { id: params.id, deletedAt: null, businessId },
    select: { id: true, name: true },
  })

  if (!recipient) notFound()

  return <VitalInputForm careRecipientId={recipient.id} recipientName={recipient.name} />
}
