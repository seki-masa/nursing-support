import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserEditForm } from '@/components/users/UserEditForm'

interface Props {
  params: { id: string }
}

export default async function EditUserPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const me = session.user as { id?: string; role?: string }
  if (me.id !== params.id && me.role !== 'ADMIN') redirect('/dashboard')

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, role: true },
  })

  if (!user) notFound()

  return (
    <UserEditForm
      user={user}
      mode="edit"
      currentUserRole={me.role ?? 'STAFF'}
      currentUserId={me.id}
    />
  )
}
