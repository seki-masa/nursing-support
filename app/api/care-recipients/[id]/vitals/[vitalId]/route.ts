import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
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

type Params = { params: { id: string; vitalId: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const businessId = (session.user as { businessId?: string }).businessId

  // 対象バイタルが存在し、同一事業者の対象者のものか確認
  const target = await prisma.vital.findFirst({
    where: { id: params.vitalId, careRecipientId: params.id, careRecipient: { businessId } },
    select: { id: true },
  })
  if (!target) {
    return NextResponse.json({ error: 'バイタルが見つかりません' }, { status: 404 })
  }

  // 最新のバイタルのみ編集可能
  const latest = await prisma.vital.findFirst({
    where: { careRecipientId: params.id },
    orderBy: { recordedAt: 'desc' },
    select: { id: true },
  })
  if (!latest || latest.id !== params.vitalId) {
    return NextResponse.json(
      { code: 'NOT_LATEST', error: '最新のバイタルのみ編集できます' },
      { status: 403 }
    )
  }

  const { recordedAt, deceasedAt, dischargedAt, ...data } = parsed.data

  const vital = await prisma.vital.update({
    where: { id: params.vitalId },
    data: {
      ...data,
      ...(recordedAt ? { recordedAt: new Date(recordedAt) } : {}),
      deceasedAt: deceasedAt ? new Date(deceasedAt) : null,
      dischargedAt: dischargedAt ? new Date(dischargedAt) : null,
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
  })
}
