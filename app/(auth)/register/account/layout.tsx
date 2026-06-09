import type { Metadata } from 'next'

const title = 'アカウント新規登録'
const description =
  '発行済みの事業者IDを使って、介護支援バイタル管理システムの利用アカウントを新規作成します。'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/register/account' },
  robots: { index: true, follow: true },
  openGraph: { title, description, url: '/register/account' },
}

export default function RegisterAccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
