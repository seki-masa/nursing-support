import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  expectedUpdatedAt: z.string(),
  name: z.string().min(1).optional(),
  nameKana: z.string().min(1).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birthDate: z.string().optional(),
  bloodType: z.enum(['A_PLUS', 'A_MINUS', 'B_PLUS', 'B_MINUS', 'O_PLUS', 'O_MINUS', 'AB_PLUS', 'AB_MINUS']).optional().nullable(),
  room: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  medicalConditions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
})

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const recipient = await prisma.careRecipient.findFirst({
    where: { id: params.id, deletedAt: null },
    include: {
      medicalConditions: { orderBy: { createdAt: 'asc' } },
      allergies: { orderBy: { createdAt: 'asc' } },
      families: { include: { family: true } },
      vitals: {
        where: { status: { not: null } },
        orderBy: { recordedAt: 'desc' },
        take: 1,
        select: { status: true, deceasedAt: true, dischargedAt: true },
      },
    },
  })

  if (!recipient) {
    return NextResponse.json({ error: '対象者が見つかりません' }, { status: 404 })
  }

  const latestStatusVital = recipient.vitals[0] ?? null

  const result = {
    ...recipient,
    birthDate: recipient.birthDate.toISOString(),
    updatedAt: recipient.updatedAt.toISOString(),
    status: latestStatusVital?.status ?? null,
    deceasedAt: latestStatusVital?.deceasedAt?.toISOString() ?? null,
    dischargedAt: latestStatusVital?.dischargedAt?.toISOString() ?? null,
    families: recipient.families.map((f) => f.family),
    vitals: undefined,
  }

  return NextResponse.json(result)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { expectedUpdatedAt, medicalConditions, allergies, birthDate, ...data } = parsed.data

  // 削除・競合チェック
  const current = await prisma.careRecipient.findUnique({
    where: { id: params.id },
    select: { deletedAt: true, updatedAt: true },
  })

  if (!current) {
    return NextResponse.json({ code: 'DELETED', error: 'この介護対象者は既に削除されています' }, { status: 410 })
  }
  if (current.deletedAt !== null) {
    return NextResponse.json({ code: 'DELETED', error: 'この介護対象者は既に削除されています' }, { status: 410 })
  }
  if (current.updatedAt.toISOString() !== expectedUpdatedAt) {
    return NextResponse.json({ code: 'CONFLICT', error: '他のユーザーがこのデータを編集しました。最新のデータを確認してください' }, { status: 409 })
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (medicalConditions !== undefined) {
      await tx.medicalCondition.deleteMany({ where: { careRecipientId: params.id } })
      await tx.medicalCondition.createMany({
        data: medicalConditions.map((name) => ({ careRecipientId: params.id, name })),
      })
    }
    if (allergies !== undefined) {
      await tx.allergy.deleteMany({ where: { careRecipientId: params.id } })
      await tx.allergy.createMany({
        data: allergies.map((name) => ({ careRecipientId: params.id, name })),
      })
    }

    return tx.careRecipient.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
      },
      include: {
        medicalConditions: true,
        allergies: true,
        families: { include: { family: true } },
      },
    })
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  await prisma.careRecipient.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
