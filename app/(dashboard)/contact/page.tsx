'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({ subject: '', message: '' })
  const [fieldErrors, setFieldErrors] = useState({ subject: '', message: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const LABELS = { subject: '件名', message: 'お問い合わせ内容' } as const

  const validate = (f: typeof form) => ({
    subject: f.subject.trim() ? '' : `${LABELS.subject}を入力してください`,
    message: f.message.trim() ? '' : `${LABELS.message}を入力してください`,
  })

  const update = (key: keyof typeof form, value: string) => {
    const next = { ...form, [key]: value }
    setForm(next)
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: validate(next)[key] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const errs = validate(form)
    setFieldErrors(errs)
    if (errs.subject || errs.message) return

    setLoading(true)
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: form.subject.trim(), message: form.message.trim() }),
    })
    setLoading(false)

    if (res.ok) {
      toast({ title: '送信しました', description: 'お問い合わせ内容を管理者とご自身のメールアドレスに送信しました。' })
      setForm({ subject: '', message: '' })
      router.push('/dashboard')
    } else {
      setError('送信に失敗しました。時間をおいて再度お試しください。')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        戻る
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            システム管理者へのお問い合わせ
          </CardTitle>
          <CardDescription>
            送信内容はシステム管理者と、ご自身のメールアドレス宛に送信されます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">件名</Label>
              <Input
                id="subject"
                placeholder="お問い合わせの件名"
                value={form.subject}
                onChange={(e) => update('subject', e.target.value)}
                onBlur={() => setFieldErrors((prev) => ({ ...prev, subject: validate(form).subject }))}
                aria-invalid={!!fieldErrors.subject}
              />
              {fieldErrors.subject && <p className="text-sm text-red-600">{fieldErrors.subject}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">お問い合わせ内容</Label>
              <Textarea
                id="message"
                placeholder="お問い合わせ内容をご記入ください"
                rows={8}
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                onBlur={() => setFieldErrors((prev) => ({ ...prev, message: validate(form).message }))}
                aria-invalid={!!fieldErrors.message}
              />
              {fieldErrors.message && <p className="text-sm text-red-600">{fieldErrors.message}</p>}
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '送信中...' : '送信'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
