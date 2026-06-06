import { cn } from '@/lib/utils'
import { STATUS_CONFIG } from '@/types'
import type { CareStatus } from '@/types'

interface StatusBadgeProps {
  status: CareStatus
  size?: 'sm' | 'default'
  className?: string
}

export function StatusBadge({ status, size = 'default', className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        config.badgeClass,
        className
      )}
    >
      {config.label}
    </span>
  )
}
