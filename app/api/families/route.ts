import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  relationship: z.string().min(1).max(50),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const businessId = (session.user as { businessId?: string }).businessId

  const families = await prisma.family.findMany({
    where: { businessId },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(families)
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

  const family = await prisma.family.create({ data: { ...parsed.data, businessId } })
  return NextResponse.json(family, { status: 201 })
}
