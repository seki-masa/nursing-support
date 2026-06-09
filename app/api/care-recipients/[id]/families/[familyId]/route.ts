import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: { id: string; familyId: string } }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const businessId = (session.user as { businessId?: string }).businessId
  // 対象者が自事業者のものであることを確認（越境の紐付け解除を防止）
  const recipient = await prisma.careRecipient.findFirst({
    where: { id: params.id, businessId },
    select: { id: true },
  })
  if (!recipient) {
    return NextResponse.json({ error: '対象が見つかりません' }, { status: 404 })
  }

  await prisma.careRecipientFamily.deleteMany({
    where: {
      careRecipientId: params.id,
      familyId: params.familyId,
    },
  })

  return NextResponse.json({ success: true })
}
