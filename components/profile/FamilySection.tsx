'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import type { FamilyItem } from '@/types'
import { Plus, X, Search, UserPlus, Pencil } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

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
  const [newFamily, setNewFamily] = useState({ name: '', relationship: '', phone: '', email: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [editTarget, setEditTarget] = useState<FamilyItem | null>(null)
  const [editFamily, setEditFamily] = useState({ name: '', relationship: '', phone: '', email: '', notes: '' })
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
    if (!newFamily.name.trim() || !newFamily.relationship.trim()) return
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
      toast({ title: '家族を登録しました' })
    } catch {
      toast({ title: '登録に失敗しました', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (family: FamilyItem) => {
    setEditTarget(family)
    setEditFamily({
      name: family.name,
      relationship: family.relationship,
      phone: family.phone ?? '',
      email: family.email ?? '',
      notes: family.notes ?? '',
    })
  }

  const handleUpdate = async () => {
    if (!editTarget || !editFamily.name.trim() || !editFamily.relationship.trim()) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/families/${editTarget.id}`, {
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
      setEditTarget(null)
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
              className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm"
            >
              <button
                type="button"
                onClick={() => openEdit(family)}
                className="flex items-center gap-2 text-left flex-1 min-w-0"
                title="クリックして編集"
              >
                <span className="truncate">
                  <span className="font-medium">{family.name}</span>
                  <span className="text-muted-foreground ml-2">（{family.relationship}）</span>
                  {family.phone && <span className="text-muted-foreground ml-2">{family.phone}</span>}
                </span>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => handleUnlink(family.id)}
                className="text-muted-foreground hover:text-destructive transition-colors ml-2 flex-shrink-0"
                title="紐付けを解除"
              >
                <X className="h-4 w-4" />
              </button>
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
        <Button type="button" variant="outline" size="sm" onClick={() => setShowNewForm(true)}>
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
                  onChange={(e) => setNewFamily({ ...newFamily, name: e.target.value })}
                  placeholder="山田 太郎"
                />
              </div>
              <div className="space-y-1">
                <Label>続柄 *</Label>
                <Input
                  value={newFamily.relationship}
                  onChange={(e) => setNewFamily({ ...newFamily, relationship: e.target.value })}
                  placeholder="長男"
                />
              </div>
              <div className="space-y-1">
                <Label>電話番号</Label>
                <Input
                  value={newFamily.phone}
                  onChange={(e) => setNewFamily({ ...newFamily, phone: e.target.value })}
                  placeholder="090-0000-0000"
                />
              </div>
              <div className="space-y-1">
                <Label>メールアドレス</Label>
                <Input
                  type="email"
                  value={newFamily.email}
                  onChange={(e) => setNewFamily({ ...newFamily, email: e.target.value })}
                  placeholder="example@mail.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewForm(false)}>キャンセル</Button>
            <Button onClick={handleCreateAndLink} disabled={saving || !newFamily.name || !newFamily.relationship}>
              {saving ? '登録中...' : '登録して紐付け'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit family dialog */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>家族情報を編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>氏名 *</Label>
                <Input
                  value={editFamily.name}
                  onChange={(e) => setEditFamily({ ...editFamily, name: e.target.value })}
                  placeholder="山田 太郎"
                />
              </div>
              <div className="space-y-1">
                <Label>続柄 *</Label>
                <Input
                  value={editFamily.relationship}
                  onChange={(e) => setEditFamily({ ...editFamily, relationship: e.target.value })}
                  placeholder="長男"
                />
              </div>
              <div className="space-y-1">
                <Label>電話番号</Label>
                <Input
                  value={editFamily.phone}
                  onChange={(e) => setEditFamily({ ...editFamily, phone: e.target.value })}
                  placeholder="090-0000-0000"
                />
              </div>
              <div className="space-y-1">
                <Label>メールアドレス</Label>
                <Input
                  type="email"
                  value={editFamily.email}
                  onChange={(e) => setEditFamily({ ...editFamily, email: e.target.value })}
                  placeholder="example@mail.com"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>キャンセル</Button>
            <Button onClick={handleUpdate} disabled={savingEdit || !editFamily.name || !editFamily.relationship}>
              {savingEdit ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
