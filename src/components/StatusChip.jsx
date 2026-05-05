import { Icon } from './Icon'

/**
 * Chip de status para leilões. Tom é mapeado para classes Tailwind
 * com contraste AA. `pulse` adiciona animação âmbar para "Hoje"
 * (respeita prefers-reduced-motion via CSS global).
 */
const TONE_CLASSES = {
  info:    'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  neutral: 'bg-fg-subtle/15 text-fg-muted',
  muted:   'bg-fg-subtle/10 text-fg-subtle',
}

export function StatusChip({ chip, className = '' }) {
  if (!chip) return null
  const { label, tone, icon, pulse } = chip
  const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.neutral
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${toneClass} ${pulse ? 'chip-pulse' : ''} ${className}`}
    >
      {icon && <Icon name={icon} className="w-3 h-3" />}
      {label}
    </span>
  )
}
