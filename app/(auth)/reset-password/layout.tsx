import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'パスワード再設定',
  description:
    '介護支援バイタル管理システムのパスワード再設定申請ページです。登録メールアドレスへ再設定用のリンクを送信します。',
  alternates: { canonical: '/reset-password' },
  robots: { index: true, follow: true },
  openGraph: { title: 'パスワード再設定', url: '/reset-password' },
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
