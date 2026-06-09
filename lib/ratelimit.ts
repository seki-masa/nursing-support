import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

// Upstash の環境変数が無ければレート制限は無効（開発・未設定環境を壊さない）。
const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN
const redis = url && token ? new Redis({ url, token }) : null

type Duration = `${number} s` | `${number} m` | `${number} h`

function makeLimiter(limit: number, window: Duration, prefix: string): Ratelimit | null {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix,
    analytics: false,
  })
}

// 用途別リミッター（公開エンドポイント・ログインの濫用対策）
export const limiters = {
  businessRegister: makeLimiter(5, '1 h', 'rl:biz'),
  accountRegister: makeLimiter(10, '1 h', 'rl:reg'),
  passwordResetIp: makeLimiter(5, '1 h', 'rl:pwreset:ip'),
  passwordResetEmail: makeLimiter(3, '1 h', 'rl:pwreset:mail'),
  login: makeLimiter(10, '5 m', 'rl:login'),
}

// リクエスト元IP（VercelのエッジがX-Forwarded-Forを付与）
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  return xff?.split(',')[0]?.trim() || 'unknown'
}

// 制限内なら true。未設定（limiter=null）は常に許可。
export async function rateLimitOk(limiter: Ratelimit | null, key: string): Promise<boolean> {
  if (!limiter) return true
  const { success } = await limiter.limit(key)
  return success
}

export function tooManyRequests(): NextResponse {
  return NextResponse.json(
    { code: 'RATE_LIMITED', error: 'リクエストが多すぎます。しばらく時間をおいて再度お試しください。' },
    { status: 429 }
  )
}
