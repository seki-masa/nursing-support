import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  relationship: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const businessId = (session.user as { businessId?: string }).businessId
  const target = await prisma.family.findFirst({
    where: { id: params.id, businessId },
    select: { id: true },
  })
  if (!target) {
    return NextResponse.json({ error: '家族が見つかりません' }, { status: 404 })
  }

  const family = await prisma.family.update({
    where: { id: params.id },
    data: parsed.data,
  })

  return NextResponse.json(family)
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const businessId = (session.user as { businessId?: string }).businessId
  const target = await prisma.family.findFirst({
    where: { id: params.id, businessId },
    select: { id: true },
  })
  if (!target) {
    return NextResponse.json({ error: '家族が見つかりません' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const careRecipientId = searchParams.get('careRecipientId') ?? undefined

  // 現在の対象者以外に紐づいている場合は削除不可（カスケードによる巻き込み防止）
  const otherLinks = await prisma.careRecipientFamily.count({
    where: { familyId: params.id, careRecipientId: { not: careRecipientId } },
  })
  if (otherLinks > 0) {
    return NextResponse.json(
      { code: 'IN_USE', error: `他の${otherLinks}名の介護対象者に紐づいているため削除できません`, count: otherLinks },
      { status: 409 }
    )
  }

  // カスケードで現在の対象者との紐付けも削除される
  await prisma.family.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
