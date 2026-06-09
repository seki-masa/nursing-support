import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail } from '@/lib/email'
import { APP_URL } from '@/lib/site'
import { z } from 'zod'
import crypto from 'crypto'

const requestSchema = z.object({
  email: z.string().email(),
})

const TOKEN_TTL_MS = 60 * 60 * 1000 // 1時間

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { email } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })

  // ユーザが存在する場合のみトークン発行・送信。
  // メールアドレス探索を防ぐため、存在の有無に関わらず常に成功を返す。
  if (user) {
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    })

    const url = `${APP_URL}/reset-password/confirm?token=${token}`
    await sendPasswordResetEmail({ to: user.email, name: user.name, url })
  }

  return NextResponse.json({ success: true })
}
