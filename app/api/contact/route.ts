import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendContactEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  subject: z.string().min(1, '件名を入力してください').max(200),
  message: z.string().min(1, 'お問い合わせ内容を入力してください').max(5000),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })

  const user = session.user as { name?: string; email?: string } | undefined
  if (!user?.email) {
    return NextResponse.json({ error: 'ユーザのメールアドレスが取得できません' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await sendContactEmail({
    userName: user.name ?? '不明なユーザ',
    userEmail: user.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  })

  return NextResponse.json({ success: true })
}
