import { cn } from '@/lib/utils'
import { getAbnormalLevel, VITAL_RANGES } from '@/lib/vitals-utils'
import { AlertTriangle, AlertCircle } from 'lucide-react'

interface VitalCardProps {
  field: string
  value: number | null | undefined
  className?: string
}

export function VitalCard({ field, value, className }: VitalCardProps) {
  const range = VITAL_RANGES[field]
  if (!range) return null

  const level = value != null ? getAbnormalLevel(field, value) : 'normal'

  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex flex-col gap-1 transition-colors',
        level === 'danger' && 'bg-red-50 border-red-300',
        level === 'warning' && 'bg-yellow-50 border-yellow-300',
        level === 'normal' && 'bg-white border-border',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{range.label}</span>
        {level === 'danger' && <AlertCircle className="h-4 w-4 text-red-500" />}
        {level === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
      </div>
      <div className={cn(
        'text-2xl font-bold tracking-tight',
        level === 'danger' && 'text-red-600',
        level === 'warning' && 'text-yellow-600',
        level === 'normal' && 'text-foreground',
        value == null && 'text-muted-foreground'
      )}>
        {value != null ? value : '—'}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{range.unit}</span>
        {value != null && (
          <span className={cn(
            'text-xs font-medium',
            level === 'danger' && 'text-red-500',
            level === 'warning' && 'text-yellow-500',
            level === 'normal' && 'text-green-600'
          )}>
            {level === 'normal' ? '正常' : level === 'warning' ? '注意' : '異常'}
          </span>
        )}
      </div>
    </div>
  )
}

export function BloodPressureCard({
  systolic,
  diastolic,
}: {
  systolic: number | null | undefined
  diastolic: number | null | undefined
}) {
  const sysLevel = systolic != null ? getAbnormalLevel('systolicBp', systolic) : 'normal'
  const diaLevel = diastolic != null ? getAbnormalLevel('diastolicBp', diastolic) : 'normal'
  const level = sysLevel === 'danger' || diaLevel === 'danger' ? 'danger'
    : sysLevel === 'warning' || diaLevel === 'warning' ? 'warning' : 'normal'

  return (
    <div className={cn(
      'rounded-xl border p-4 flex flex-col gap-1',
      level === 'danger' && 'bg-red-50 border-red-300',
      level === 'warning' && 'bg-yellow-50 border-yellow-300',
      level === 'normal' && 'bg-white border-border',
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">血圧</span>
        {level === 'danger' && <AlertCircle className="h-4 w-4 text-red-500" />}
        {level === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
      </div>
      <div className={cn(
        'text-2xl font-bold tracking-tight',
        level === 'danger' && 'text-red-600',
        level === 'warning' && 'text-yellow-600',
        (systolic == null && diastolic == null) && 'text-muted-foreground'
      )}>
        {systolic != null || diastolic != null
          ? `${systolic ?? '—'}/${diastolic ?? '—'}`
          : '—'}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">mmHg</span>
        {(systolic != null || diastolic != null) && (
          <span className={cn(
            'text-xs font-medium',
            level === 'danger' && 'text-red-500',
            level === 'warning' && 'text-yellow-500',
            level === 'normal' && 'text-green-600'
          )}>
            {level === 'normal' ? '正常' : level === 'warning' ? '注意' : '異常'}
          </span>
        )}
      </div>
    </div>
  )
}
