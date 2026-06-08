import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserEditForm } from '@/components/users/UserEditForm'

export default async function NewUserPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if ((session.user as { role?: string }).role !== 'ADMIN') redirect('/dashboard')

  return <UserEditForm mode="create" currentUserRole="ADMIN" />
}
