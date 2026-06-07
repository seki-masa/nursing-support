import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const registerSchema = z
  .object({
    businessCode: z.string().min(1),
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(6),
    passwordConfirm: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['passwordConfirm'],
        message: 'パスワードが一致しません',
      })
    }
  })

// アカウント新規登録（認証不要）
export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { businessCode, email, name, password } = parsed.data

  const business = await prisma.business.findUnique({ where: { code: businessCode } })
  if (!business) {
    return NextResponse.json({ code: 'BUSINESS_NOT_FOUND', error: '事業者IDが見つかりません' }, { status: 404 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ code: 'EMAIL_CONFLICT', error: 'このメールアドレスは既に使用されています' }, { status: 409 })
  }

  // その事業者の最初の登録者は管理者、以降はスタッフ
  const userCount = await prisma.user.count({ where: { businessId: business.id } })
  const role = userCount === 0 ? 'ADMIN' : 'STAFF'

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role, businessId: business.id },
    select: { id: true, name: true, email: true, role: true },
  })

  return NextResponse.json(user, { status: 201 })
}
