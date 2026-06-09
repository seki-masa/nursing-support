import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ログイン',
  description:
    '介護支援バイタル管理システムのログインページです。登録済みのアカウントでサインインしてください。',
  alternates: { canonical: '/login' },
  robots: { index: true, follow: true },
  openGraph: { title: 'ログイン', url: '/login' },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
