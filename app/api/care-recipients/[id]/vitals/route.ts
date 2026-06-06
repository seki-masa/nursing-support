import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  recordedAt: z.string().optional(),
  status: z.enum(['CRITICAL', 'SEVERE', 'CAUTION', 'OBSERVATION', 'HEALTHY', 'DECEASED', 'DISCHARGED']).optional().nullable(),
  deceasedAt: z.string().optional().nullable(),
  dischargedAt: z.string().optional().nullable(),
  systolicBp: z.number().int().min(40).max(300).optional().nullable(),
  diastolicBp: z.number().int().min(20).max(200).optional().nullable(),
  heartRate: z.number().int().min(20).max(300).optional().nullable(),
  respiratoryRate: z.number().int().min(0).max(60).optional().nullable(),
  temperature: z.number().min(30).max(45).optional().nullable(),
  spo2: z.number().int().min(50).max(100).optional().nullable(),
  weight: z.number().min(1).max(300).optional().nullable(),
  bloodSugar: z.number().int().min(20).max(600).optional().nullable(),
  consciousnessLevel: z.number().int().min(0).max(300).optional().nullable(),
  painScore: z.number().int().min(0).max(10).optional().nullable(),
  edema: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE']).optional().nullable(),
  urineOutput: z.number().int().min(0).max(5000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

type Params = { params: { id: string } }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') ?? '30')
  const since = new Date()
  since.setDate(since.getDate() - days)

  const vitals = await prisma.vital.findMany({
    where: {
      careRecipientId: params.id,
      recordedAt: { gte: since },
    },
    include: {
      recorder: { select: { id: true, name: true } },
    },
    orderBy: { recordedAt: 'desc' },
    take: 100,
  })

  return NextResponse.json(
    vitals.map((v) => ({
      ...v,
      temperature: v.temperature ? Number(v.temperature) : null,
      weight: v.weight ? Number(v.weight) : null,
      recordedAt: v.recordedAt.toISOString(),
      deceasedAt: v.deceasedAt?.toISOString() ?? null,
      dischargedAt: v.dischargedAt?.toISOString() ?? null,
      createdAt: v.createdAt.toISOString(),
    }))
  )
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // 削除チェック
  const recipient = await prisma.careRecipient.findUnique({
    where: { id: params.id },
    select: { deletedAt: true },
  })
  if (!recipient || recipient.deletedAt !== null) {
    return NextResponse.json({ code: 'DELETED', error: 'この介護対象者は既に削除されています' }, { status: 410 })
  }

  const userId = (session.user as { id: string }).id
  const { recordedAt, deceasedAt, dischargedAt, ...data } = parsed.data

  const vital = await prisma.vital.create({
    data: {
      ...data,
      careRecipientId: params.id,
      recordedBy: userId,
      ...(recordedAt ? { recordedAt: new Date(recordedAt) } : {}),
      ...(deceasedAt ? { deceasedAt: new Date(deceasedAt) } : {}),
      ...(dischargedAt ? { dischargedAt: new Date(dischargedAt) } : {}),
    },
    include: {
      recorder: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({
    ...vital,
    temperature: vital.temperature ? Number(vital.temperature) : null,
    weight: vital.weight ? Number(vital.weight) : null,
    recordedAt: vital.recordedAt.toISOString(),
    deceasedAt: vital.deceasedAt?.toISOString() ?? null,
    dischargedAt: vital.dischargedAt?.toISOString() ?? null,
    createdAt: vital.createdAt.toISOString(),
  }, { status: 201 })
}
