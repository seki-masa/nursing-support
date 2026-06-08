import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const confirmSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = confirmSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { token, password } = parsed.data
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.json(
      { code: 'INVALID_TOKEN', error: 'リンクが無効か、有効期限が切れています。再度お試しください。' },
      { status: 400 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 10)

  // パスワード更新とトークンの使用済み化を同時に実行
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ])

  return NextResponse.json({ success: true })
}
