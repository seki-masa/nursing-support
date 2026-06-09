import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  companyName: z.string().min(1).max(255),
  address: z.string().min(1).max(255),
  contactName: z.string().min(1).max(100),
  phone: z
    .string()
    .min(1, '電話番号を入力してください')
    .max(20)
    .regex(/^[0-9-]+$/, '電話番号は半角数字とハイフンのみで入力してください')
    .refine((v) => /^0\d{9,10}$/.test(v.replace(/-/g, '')), {
      message: '正しい電話番号を入力してください（市外局番から数字10〜11桁）',
    }),
  email: z.string().email().max(255),
})

type Params = { params: { id: string } }

function getSessionUser(session: unknown) {
  return (session as { user?: { id?: string; role?: string; businessId?: string } } | null)?.user
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const me = getSessionUser(session)
  // 自社の情報のみ取得可能
  if (params.id !== me?.businessId) {
    return NextResponse.json({ error: '事業者が見つかりません' }, { status: 404 })
  }

  const business = await prisma.business.findUnique({ where: { id: params.id } })
  if (!business) return NextResponse.json({ error: '事業者が見つかりません' }, { status: 404 })

  return NextResponse.json(business)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const me = getSessionUser(session)
  if (me?.role !== 'ADMIN') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }
  // 自社の情報のみ編集可能
  if (params.id !== me?.businessId) {
    return NextResponse.json({ error: '事業者が見つかりません' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const business = await prisma.business.update({
    where: { id: params.id },
    data: parsed.data,
  })

  return NextResponse.json(business)
}
