import type { Metadata } from 'next'

const title = '事業者登録（無料）'
const description =
  '介護施設向けバイタル管理クラウドの事業者登録ページ。会社情報を入力すると事業者IDが発行され、すぐにアカウントを作成して利用を開始できます。'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/register/business' },
  robots: { index: true, follow: true },
  openGraph: { title, description, url: '/register/business' },
  twitter: { title, description },
}

export default function RegisterBusinessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
