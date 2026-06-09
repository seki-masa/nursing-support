import type { Metadata } from 'next'

// トークン付きでアクセスする画面のため検索インデックスから除外する
export const metadata: Metadata = {
  title: 'パスワード再設定の確定',
  robots: { index: false, follow: false },
}

export default function ResetPasswordConfirmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
