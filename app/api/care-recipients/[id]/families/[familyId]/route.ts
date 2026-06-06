import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: { id: string; familyId: string } }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  await prisma.careRecipientFamily.delete({
    where: {
      careRecipientId_familyId: {
        careRecipientId: params.id,
        familyId: params.familyId,
      },
    },
  })

  return NextResponse.json({ success: true })
}
