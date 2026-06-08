import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserList } from '@/components/users/UserList'

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if ((session.user as { role?: string }).role !== 'ADMIN') redirect('/dashboard')

  const businessId = (session.user as { businessId?: string }).businessId

  const users = await prisma.user.findMany({
    where: { businessId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <UserList
      users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
    />
  )
}
