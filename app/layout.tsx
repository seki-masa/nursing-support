import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | 介護施設向けバイタル管理クラウド`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    '介護',
    '介護施設',
    'バイタル管理',
    'バイタルサイン',
    '介護記録',
    '見守り',
    '高齢者ケア',
    'クラウド',
  ],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 介護施設向けバイタル管理クラウド`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | 介護施設向けバイタル管理クラウド`,
    description: SITE_DESCRIPTION,
  },
  // 既定はインデックス拒否（医療・個人情報を扱う認証配下を保護）。
  // 公開ページは各ルートの layout.tsx で index:true に上書きする。
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
