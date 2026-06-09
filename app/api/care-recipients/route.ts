import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  nameKana: z.string().min(1),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  birthDate: z.string(),
  bloodType: z.enum(['A_PLUS', 'A_MINUS', 'B_PLUS', 'B_MINUS', 'O_PLUS', 'O_MINUS', 'AB_PLUS', 'AB_MINUS']).optional().nullable(),
  room: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactRelationship: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  medicalConditions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const businessId = (session.user as { businessId?: string }).businessId

  const recipients = await prisma.careRecipient.findMany({
    where: { deletedAt: null, businessId },
    select: {
      id: true,
      name: true,
      nameKana: true,
      room: true,
      // 最新バイタルのステータスを取得
      vitals: {
        where: { status: { not: null } },
        orderBy: { recordedAt: 'desc' },
        take: 1,
        select: { status: true },
      },
    },
    orderBy: { nameKana: 'asc' },
  })

  return NextResponse.json(
    recipients.map((r) => ({
      id: r.id,
      name: r.name,
      nameKana: r.nameKana,
      room: r.room,
      status: r.vitals[0]?.status ?? null,
    }))
  )
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const businessId = (session.user as { businessId?: string }).businessId
  if (!businessId) return NextResponse.json({ error: '事業者が特定できません' }, { status: 400 })

  const { medicalConditions, allergies, ...data } = parsed.data
  const recipient = await prisma.careRecipient.create({
    data: {
      ...data,
      businessId,
      birthDate: new Date(data.birthDate),
      medicalConditions: { create: medicalConditions.map((name) => ({ name })) },
      allergies: { create: allergies.map((name) => ({ name })) },
    },
    include: {
      medicalConditions: true,
      allergies: true,
      families: { include: { family: true } },
    },
  })

  return NextResponse.json(recipient, { status: 201 })
}
