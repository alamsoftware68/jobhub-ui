export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(iso).toLocaleDateString()
}

/** Tailwind classes for the match score badge. */
export function scoreClasses(score: number): string {
  if (score >= 75) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
  if (score >= 50) return 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
}

const SOURCE_COLORS: Record<string, string> = {
  ARBEITSAGENTUR: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300',
  ARBEITNOW: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300',
  ADZUNA: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300',
  JOOBLE: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-300',
}

export function sourceClasses(source: string): string {
  return SOURCE_COLORS[source] ?? 'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300'
}

/** "Today", "Yesterday", "Monday, 27 October" for a "YYYY-MM-DD" day */
export function dayLabel(day: string | null | undefined): string {
  if (!day) return 'Date unknown'
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86_400_000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  const sameYear = date.getFullYear() === today.getFullYear()
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}
