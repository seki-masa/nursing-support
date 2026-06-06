'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, STATUS_ORDER } from '@/types'
import type { CareRecipientListItem, CareStatus } from '@/types'
import { StatusBadge } from './StatusBadge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronDown, ChevronRight, Plus, UserRound, RefreshCw } from 'lucide-react'

export function CareRecipientList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')

  const [recipients, setRecipients] = useState<CareRecipientListItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<CareStatus>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchRecipients = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/care-recipients')
      if (res.ok) setRecipients(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecipients()
    window.addEventListener('careRecipientsUpdated', fetchRecipients)
    return () => window.removeEventListener('careRecipientsUpdated', fetchRecipients)
  }, [])

  const filtered = recipients.filter((r) =>
    r.name.includes(searchQuery) || r.nameKana.includes(searchQuery)
  )

  const grouped = STATUS_ORDER.reduce<Record<CareStatus, CareRecipientListItem[]>>(
    (acc, status) => {
      acc[status] = filtered.filter((r) => r.status === status)
      return acc
    },
    {} as Record<CareStatus, CareRecipientListItem[]>
  )
  const unrecorded = filtered.filter((r) => r.status === null)

  const toggleGroup = (key: CareStatus | 'UNRECORDED') => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key as CareStatus)) next.delete(key as CareStatus)
      else next.add(key as CareStatus)
      return next
    })
  }

  const handleSelect = (id: string) => {
    router.push(`/dashboard?id=${id}`)
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            介護対象者
          </span>
          <button
            onClick={fetchRecipients}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
            title="更新"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="名前で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? '該当者なし' : '登録者なし'}
          </div>
        ) : (
          <>
            {STATUS_ORDER.map((status) => {
              const items = grouped[status]
              if (items.length === 0) return null
              const collapsed = collapsedGroups.has(status)
              const config = STATUS_CONFIG[status]
              return (
                <div key={status}>
                  <button
                    onClick={() => toggleGroup(status)}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold hover:bg-muted/50 transition-colors"
                  >
                    <span className={cn('h-2 w-2 rounded-full flex-shrink-0', config.dotClass)} />
                    <span className={config.textClass}>{config.label}</span>
                    <span className="text-muted-foreground ml-1">({items.length})</span>
                    <span className="ml-auto">
                      {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                  </button>
                  {!collapsed && items.map((recipient) => (
                    <RecipientRow
                      key={recipient.id}
                      recipient={recipient}
                      selected={selectedId === recipient.id}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )
            })}
            {/* 未記録グループ */}
            {unrecorded.length > 0 && (
              <div>
                <button
                  onClick={() => toggleGroup('UNRECORDED')}
                  className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold hover:bg-muted/50 transition-colors"
                >
                  <span className="h-2 w-2 rounded-full flex-shrink-0 bg-slate-300" />
                  <span className="text-slate-400">未記録</span>
                  <span className="text-muted-foreground ml-1">({unrecorded.length})</span>
                  <span className="ml-auto">
                    {collapsedGroups.has('UNRECORDED' as CareStatus)
                      ? <ChevronRight className="h-3 w-3" />
                      : <ChevronDown className="h-3 w-3" />}
                  </span>
                </button>
                {!collapsedGroups.has('UNRECORDED' as CareStatus) && unrecorded.map((recipient) => (
                  <RecipientRow
                    key={recipient.id}
                    recipient={recipient}
                    selected={selectedId === recipient.id}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t">
        <Button
          size="sm"
          className="w-full gap-1.5"
          onClick={() => router.push('/care-recipients/new')}
        >
          <Plus className="h-4 w-4" />
          対象者追加
        </Button>
      </div>
    </div>
  )
}

function RecipientRow({
  recipient,
  selected,
  onSelect,
}: {
  recipient: CareRecipientListItem
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      onClick={() => onSelect(recipient.id)}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/60 transition-colors text-sm',
        selected && 'bg-primary/10 border-r-2 border-primary'
      )}
    >
      <UserRound className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{recipient.name}</div>
        {recipient.room && (
          <div className="text-xs text-muted-foreground">{recipient.room}</div>
        )}
      </div>
    </button>
  )
}
