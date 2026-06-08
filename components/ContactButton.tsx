'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export function ContactButton() {
  return (
    <Link
      href="/contact"
      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      title="システム管理者へお問い合わせ"
    >
      <MessageCircle className="h-3.5 w-3.5" />
    </Link>
  )
}
