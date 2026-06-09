import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const linkSchema = z.object({ familyId: z.string() })

type Params = { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await req.json()
  const parsed = linkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const businessId = (session.user as { businessId?: string }).businessId
  // 対象者・家族とも自事業者のものであることを確認（越境紐付け防止）
  const [recipient, family] = await Promise.all([
    prisma.careRecipient.findFirst({ where: { id: params.id, businessId }, select: { id: true } }),
    prisma.family.findFirst({ where: { id: parsed.data.familyId, businessId }, select: { id: true } }),
  ])
  if (!recipient || !family) {
    return NextResponse.json({ error: '対象が見つかりません' }, { status: 404 })
  }

  await prisma.careRecipientFamily.upsert({
    where: {
      careRecipientId_familyId: {
        careRecipientId: params.id,
        familyId: parsed.data.familyId,
      },
    },
    update: {},
    create: {
      careRecipientId: params.id,
      familyId: parsed.data.familyId,
    },
  })

  return NextResponse.json({ success: true })
}
