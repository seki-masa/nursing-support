// 集客SEO・OGP・robots/sitemap で共有するサイト情報
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXTAUTH_URL ??
  'http://localhost:3000'
).replace(/\/$/, '')

// 認証・メールリンク用の自サイト絶対URL。NEXTAUTH_URL を最優先（誤ると再設定リンク等が壊れるため）
export const APP_URL = (
  process.env.NEXTAUTH_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  'http://localhost:3000'
).replace(/\/$/, '')

export const SITE_NAME = '介護支援バイタル管理システム'

export const SITE_DESCRIPTION =
  '介護施設向けのバイタルサイン管理クラウド。血圧・体温・SpO2などのバイタルを一元管理し、ステータス別の対象者一覧や時系列グラフで日々のケアを支援します。'
