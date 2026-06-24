import { cn } from '@/lib/utils'

const priorityStyles: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const priorityLabels: Record<string, string> = {
  low: 'Niski',
  medium: 'Średni',
  high: 'Wysoki',
  urgent: 'Pilny',
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', priorityStyles[priority] ?? priorityStyles.medium)}>
      {priorityLabels[priority] ?? priority}
    </span>
  )
}

export function Avatar({ name, image, size = 'sm' }: { name?: string | null; image?: string | null; size?: 'sm' | 'md' }) {
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'
  const sz = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
  if (image) return <img src={image} alt={name ?? ''} className={cn('rounded-full object-cover', sz)} />
  return (
    <div className={cn('rounded-full bg-indigo-500 text-white flex items-center justify-center font-medium', sz)}>
      {initials}
    </div>
  )
}
