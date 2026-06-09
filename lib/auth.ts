import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { assertProductionAuthEnv } from './env'
import { limiters, rateLimitOk } from './ratelimit'

// 本番で NEXTAUTH_SECRET / NEXTAUTH_URL 未設定・プレースホルダなら起動時に失敗させる
assertProductionAuthEnv()

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        // IP+メール単位でログイン試行を制限（総当たり抑止。超過時は認証失敗扱い）
        const xff = (req?.headers?.['x-forwarded-for'] as string | undefined) ?? ''
        const ip = xff.split(',')[0]?.trim() || 'unknown'
        if (!(await rateLimitOk(limiters.login, `${ip}:${credentials.email.toLowerCase()}`))) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null
        return { id: user.id, name: user.name, email: user.email, role: user.role, businessId: user.businessId }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { id: string; role: string }).role
        token.businessId = (user as unknown as { businessId?: string }).businessId
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        const u = session.user as { id?: string; role?: string; businessId?: string }
        u.id = token.id as string
        u.role = token.role as string
        u.businessId = token.businessId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
}
