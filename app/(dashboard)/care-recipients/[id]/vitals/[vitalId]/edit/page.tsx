import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { VitalInputForm } from '@/components/vitals/VitalInputForm'

interface Props {
  params: { id: string; vitalId: string }
}

export default async function VitalEditPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const businessId = (session.user as { businessId?: string }).businessId

  const recipient = await prisma.careRecipient.findFirst({
    where: { id: params.id, deletedAt: null, businessId },
    select: { id: true, name: true },
  })
  if (!recipient) notFound()

  const vital = await prisma.vital.findFirst({
    where: { id: params.vitalId, careRecipientId: params.id },
    include: { recorder: { select: { id: true, name: true } } },
  })
  if (!vital) notFound()

  // 最新のバイタルのみ編集可能
  const latest = await prisma.vital.findFirst({
    where: { careRecipientId: params.id },
    orderBy: { recordedAt: 'desc' },
    select: { id: true },
  })
  if (!latest || latest.id !== params.vitalId) notFound()

  const initialVital = {
    ...vital,
    temperature: vital.temperature ? Number(vital.temperature) : null,
    weight: vital.weight ? Number(vital.weight) : null,
    recordedAt: vital.recordedAt.toISOString(),
    deceasedAt: vital.deceasedAt?.toISOString() ?? null,
    dischargedAt: vital.dischargedAt?.toISOString() ?? null,
    createdAt: vital.createdAt.toISOString(),
  }

  return (
    <VitalInputForm
      careRecipientId={recipient.id}
      recipientName={recipient.name}
      mode="edit"
      vitalId={vital.id}
      initialVital={initialVital}
    />
  )
}
