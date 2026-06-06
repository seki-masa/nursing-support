import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProfileView } from '@/components/profile/ProfileView'

interface Props {
  params: { id: string }
}

export default async function ProfilePage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const recipient = await prisma.careRecipient.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      medicalConditions: { orderBy: { createdAt: 'asc' } },
      allergies: { orderBy: { createdAt: 'asc' } },
      families: { include: { family: true } },
    },
  })

  if (!recipient) notFound()

  const data = {
    ...recipient,
    birthDate: recipient.birthDate.toISOString(),
    families: recipient.families.map((f) => f.family),
  }

  return <ProfileView recipient={data} />
}
