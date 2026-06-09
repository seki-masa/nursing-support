import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateBusinessCode } from '@/lib/business-code'
import { sendBusinessIdEmail } from '@/lib/email'
import { limiters, clientIp, rateLimitOk, tooManyRequests } from '@/lib/ratelimit'

const createSchema = z.object({
  companyName: z.string().min(1),
  address: z.string().min(1),
  contactName: z.string().min(1),
  phone: z
    .string()
    .min(1, '電話番号を入力してください')
    .regex(/^[0-9-]+$/, '電話番号は半角数字とハイフンのみで入力してください')
    .refine((v) => /^0\d{9,10}$/.test(v.replace(/-/g, '')), {
      message: '正しい電話番号を入力してください（市外局番から数字10〜11桁）',
    }),
  email: z.string().email(),
})

// 事業者登録（認証不要）
export async function POST(req: NextRequest) {
  if (!(await rateLimitOk(limiters.businessRegister, clientIp(req)))) return tooManyRequests()

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // ユニークな事業者IDを生成（衝突時は再試行）
  let code = generateBusinessCode()
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.business.findUnique({ where: { code } })
    if (!existing) break
    code = generateBusinessCode()
  }

  const business = await prisma.business.create({
    data: { ...parsed.data, code },
  })

  await sendBusinessIdEmail({
    to: business.email,
    code: business.code,
    companyName: business.companyName,
  })

  return NextResponse.json({ code: business.code, companyName: business.companyName }, { status: 201 })
}
