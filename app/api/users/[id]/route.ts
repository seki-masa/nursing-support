import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
})

type Params = { params: { id: string } }

function getSessionUser(session: Awaited<ReturnType<typeof getServerSession>>) {
  return session?.user as { id?: string; role?: string } | undefined
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const me = getSessionUser(session)
  if (me?.id !== params.id && me?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  })

  if (!user) return NextResponse.json({ error: 'ユーザが見つかりません' }, { status: 404 })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const me = getSessionUser(session)
  if (me?.id !== params.id && me?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { password, role, email, ...rest } = parsed.data

  if (email) {
    const existing = await prisma.user.findFirst({ where: { email, NOT: { id: params.id } } })
    if (existing) {
      return NextResponse.json({ code: 'EMAIL_CONFLICT', error: 'このメールアドレスは既に使用されています' }, { status: 409 })
    }
  }

  const updateData: Record<string, unknown> = { ...rest }
  if (email) updateData.email = email
  if (password) updateData.passwordHash = await bcrypt.hash(password, 10)
  // ロール変更は管理者のみ
  if (role && me?.role === 'ADMIN') updateData.role = role

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  })

  return NextResponse.json(user)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const me = getSessionUser(session)
  if (me?.role !== 'ADMIN') {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }
  if (me?.id === params.id) {
    return NextResponse.json({ error: '自分自身は削除できません' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
