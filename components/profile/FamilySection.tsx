'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import type { FamilyItem } from '@/types'
import { Plus, X, Search, UserPlus, Pencil, Trash2 } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

type FamilyForm = { name: string; relationship: string; phone: string; email: string; notes: string }
type FamilyErrors = { name?: string; relationship?: string; phone?: string; email?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 電話番号: 半角数字とハイフンのみ、0始まり10〜11桁（ハイフン除く）
function isValidPhone(phone: string): boolean {
  if (!/^[0-9-]+$/.test(phone)) return false
  return /^0\d{9,10}$/.test(phone.replace(/-/g, ''))
}

function validateFamily(f: FamilyForm): FamilyErrors {
  const errors: FamilyErrors = {}
  if (!f.name.trim()) errors.name = '氏名は必須です'
  if (!f.relationship.trim()) errors.relationship = '続柄は必須です'
  if (f.phone.trim() && !isValidPhone(f.phone.trim())) errors.phone = '電話番号の形式が正しくありません'
  if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) errors.email = 'メールアドレスの形式が正しくありません'
  return errors
}

interface FamilySectionProps {
  careRecipientId: string
  families: FamilyItem[]
  onChange: (families: FamilyItem[]) => void
}

export function FamilySection({ careRecipientId, families, onChange }: FamilySectionProps) {
  const [allFamilies, setAllFamilies] = useState<FamilyItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newFamily, setNewFamily] = useState<FamilyForm>({ name: '', relationship: '', phone: '', email: '', notes: '' })
  const [newErrors, setNewErrors] = useState<FamilyErrors>({})
  const [saving, setSaving] = useState(false)
  // 閲覧・編集は同一ダイアログでモード切替（別ダイアログにするとRadixのフォーカス/pointer-events競合で不安定になる）
  const [dialogTarget, setDialogTarget] = useState<FamilyItem | null>(null)
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view')
  const [editFamily, setEditFamily] = useState<FamilyForm>({ name: '', relationship: '', phone: '', email: '', notes: '' })
  const [editErrors, setEditErrors] = useState<FamilyErrors>({})
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    fetch('/api/families').then((r) => r.json()).then(setAllFamilies)
  }, [])

  const linkedIds = new Set(families.map((f) => f.id))
  const searchResults = allFamilies.filter(
    (f) =>
      !linkedIds.has(f.id) &&
      (f.name.includes(searchQuery) || f.relationship.includes(searchQuery))
  )

  const handleLink = async (family: FamilyItem) => {
    const res = await fetch(`/api/care-recipients/${careRecipientId}/families`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familyId: family.id }),
    })
    if (res.ok) {
      onChange([...families, family])
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  const handleUnlink = async (familyId: string) => {
    const res = await fetch(`/api/care-recipients/${careRecipientId}/families/${familyId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      onChange(families.filter((f) => f.id !== familyId))
    }
  }

  const handleCreateAndLink = async () => {
    const errs = validateFamily(newFamily)
    setNewErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      const createRes = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFamily.name,
          relationship: newFamily.relationship,
          phone: newFamily.phone || null,
          email: newFamily.email || null,
          notes: newFamily.notes || null,
        }),
      })
      if (!createRes.ok) throw new Error()
      const created: FamilyItem = await createRes.json()

      const linkRes = await fetch(`/api/care-recipients/${careRecipientId}/families`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId: created.id }),
      })
      if (!linkRes.ok) throw new Error()

      setAllFamilies((prev) => [...prev, created])
      onChange([...families, created])
      setShowNewForm(false)
      setNewFamily({ name: '', relationship: '', phone: '', email: '', notes: '' })
      setNewErrors({})
      toast({ title: '家族を登録しました' })
    } catch {
      toast({ title: '登録に失敗しました', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteFamily = async (family: FamilyItem) => {
    if (!confirm(`${family.name} さんを家族情報から完全に削除しますか？\nこの操作は元に戻せません。`)) return
    try {
      const res = await fetch(`/api/families/${family.id}?careRecipientId=${careRecipientId}`, {
        method: 'DELETE',
      })
      if (res.status === 409) {
        const data = await res.json()
        toast({ title: data.error ?? '他の介護対象者に紐づいているため削除できません', variant: 'destructive' })
        return
      }
      if (!res.ok) throw new Error()

      onChange(families.filter((f) => f.id !== family.id))
      setAllFamilies((prev) => prev.filter((f) => f.id !== family.id))
      toast({ title: '家族を削除しました' })
    } catch {
      toast({ title: '削除に失敗しました', variant: 'destructive' })
    }
  }

  const openView = (family: FamilyItem) => {
    setDialogTarget(family)
    setDialogMode('view')
  }

  const openEdit = (family: FamilyItem) => {
    setDialogTarget(family)
    setDialogMode('edit')
    setEditErrors({})
    setEditFamily({
      name: family.name,
      relationship: family.relationship,
      phone: family.phone ?? '',
      email: family.email ?? '',
      notes: family.notes ?? '',
    })
  }

  const handleUpdate = async () => {
    if (!dialogTarget) return
    const errs = validateFamily(editFamily)
    setEditErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/families/${dialogTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFamily.name,
          relationship: editFamily.relationship,
          phone: editFamily.phone || null,
          email: editFamily.email || null,
          notes: editFamily.notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      const updated: FamilyItem = await res.json()

      onChange(families.map((f) => (f.id === updated.id ? updated : f)))
      setAllFamilies((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      setDialogTarget(null)
      toast({ title: '家族情報を更新しました' })
    } catch {
      toast({ title: '更新に失敗しました', variant: 'destructive' })
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Linked families */}
      {families.length === 0 ? (
        <p className="text-sm text-muted-foreground">家族が登録されていません</p>
      ) : (
        <div className="space-y-2">
          {families.map((family) => (
            <div
              key={family.id}
              onClick={() => openView(family)}
              className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted cursor-pointer"
              title="クリックして家族情報を表示"
            >
              <div className="truncate flex-1 min-w-0">
                <span className="font-medium">{family.name}</span>
                <span className="text-muted-foreground ml-2">（{family.relationship}）</span>
                {family.phone && <span className="text-muted-foreground ml-2">{family.phone}</span>}
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openEdit(family) }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="家族情報を編集"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleUnlink(family.id) }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="紐付けを解除"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteFamily(family) }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="家族を完全に削除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setShowSearch(true)}>
          <Search className="h-3.5 w-3.5 mr-1.5" />
          既存の家族から選択
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { setNewErrors({}); setNewFamily({ name: '', relationship: '', phone: '', email: '', notes: '' }); setShowNewForm(true) }}>
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          新規登録
        </Button>
      </div>

      {/* Search dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>家族を検索して紐付け</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="名前・続柄で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchQuery ? '該当なし' : '検索ワードを入力してください'}
                </p>
              ) : (
                searchResults.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleLink(f)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                  >
                    <span className="font-medium">{f.name}</span>
                    <span className="text-muted-foreground ml-2">（{f.relationship}）</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New family dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>家族を新規登録</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>氏名 *</Label>
                <Input
                  value={newFamily.name}
                  onChange={(e) => { setNewFamily({ ...newFamily, name: e.target.value }); setNewErrors((p) => ({ ...p, name: undefined })) }}
                  placeholder="山田 太郎"
                />
                {newErrors.name && <p className="text-xs text-destructive">{newErrors.name}</p>}
              </div>
              <div className="space-y-1">
                <Label>続柄 *</Label>
                <Input
                  value={newFamily.relationship}
                  onChange={(e) => { setNewFamily({ ...newFamily, relationship: e.target.value }); setNewErrors((p) => ({ ...p, relationship: undefined })) }}
                  placeholder="長男"
                />
                {newErrors.relationship && <p className="text-xs text-destructive">{newErrors.relationship}</p>}
              </div>
              <div className="space-y-1">
                <Label>電話番号</Label>
                <Input
                  value={newFamily.phone}
                  onChange={(e) => { setNewFamily({ ...newFamily, phone: e.target.value }); setNewErrors((p) => ({ ...p, phone: undefined })) }}
                  placeholder="090-0000-0000"
                />
                {newErrors.phone && <p className="text-xs text-destructive">{newErrors.phone}</p>}
              </div>
              <div className="space-y-1">
                <Label>メールアドレス</Label>
                <Input
                  type="email"
                  value={newFamily.email}
                  onChange={(e) => { setNewFamily({ ...newFamily, email: e.target.value }); setNewErrors((p) => ({ ...p, email: undefined })) }}
                  placeholder="example@mail.com"
                />
                {newErrors.email && <p className="text-xs text-destructive">{newErrors.email}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label>備考</Label>
              <Textarea
                value={newFamily.notes}
                onChange={(e) => setNewFamily({ ...newFamily, notes: e.target.value })}
                placeholder="特記事項など..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewForm(false)}>キャンセル</Button>
            <Button onClick={handleCreateAndLink} disabled={saving}>
              {saving ? '登録中...' : '登録して紐付け'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / Edit family dialog (単一ダイアログでモード切替) */}
      <Dialog open={dialogTarget !== null} onOpenChange={(open) => !open && setDialogTarget(null)}>
        <DialogContent className="max-w-md">
          {dialogMode === 'view' ? (
            <>
              <DialogHeader>
                <DialogTitle>家族情報</DialogTitle>
              </DialogHeader>
              {dialogTarget && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">氏名</dt>
                    <dd className="font-medium">{dialogTarget.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">続柄</dt>
                    <dd className="font-medium">{dialogTarget.relationship}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">電話番号</dt>
                    <dd className="font-medium">{dialogTarget.phone || '未登録'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground mb-0.5">メールアドレス</dt>
                    <dd className="font-medium break-all">{dialogTarget.email || '未登録'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground mb-0.5">備考</dt>
                    <dd className="font-medium whitespace-pre-wrap">{dialogTarget.notes || '未登録'}</dd>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => dialogTarget && openEdit(dialogTarget)}>編集</Button>
                <Button onClick={() => setDialogTarget(null)}>閉じる</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>家族情報を編集</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>氏名 *</Label>
                    <Input
                      value={editFamily.name}
                      onChange={(e) => { setEditFamily({ ...editFamily, name: e.target.value }); setEditErrors((p) => ({ ...p, name: undefined })) }}
                      placeholder="山田 太郎"
                    />
                    {editErrors.name && <p className="text-xs text-destructive">{editErrors.name}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>続柄 *</Label>
                    <Input
                      value={editFamily.relationship}
                      onChange={(e) => { setEditFamily({ ...editFamily, relationship: e.target.value }); setEditErrors((p) => ({ ...p, relationship: undefined })) }}
                      placeholder="長男"
                    />
                    {editErrors.relationship && <p className="text-xs text-destructive">{editErrors.relationship}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>電話番号</Label>
                    <Input
                      value={editFamily.phone}
                      onChange={(e) => { setEditFamily({ ...editFamily, phone: e.target.value }); setEditErrors((p) => ({ ...p, phone: undefined })) }}
                      placeholder="090-0000-0000"
                    />
                    {editErrors.phone && <p className="text-xs text-destructive">{editErrors.phone}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label>メールアドレス</Label>
                    <Input
                      type="email"
                      value={editFamily.email}
                      onChange={(e) => { setEditFamily({ ...editFamily, email: e.target.value }); setEditErrors((p) => ({ ...p, email: undefined })) }}
                      placeholder="example@mail.com"
                    />
                    {editErrors.email && <p className="text-xs text-destructive">{editErrors.email}</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>備考</Label>
                  <Textarea
                    value={editFamily.notes}
                    onChange={(e) => setEditFamily({ ...editFamily, notes: e.target.value })}
                    placeholder="特記事項など..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogTarget(null)}>キャンセル</Button>
                <Button onClick={handleUpdate} disabled={savingEdit}>
                  {savingEdit ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
