import clsx from 'clsx'
import { ChevronLeft, ChevronRight, Inbox, Loader2, X } from 'lucide-react'
import { humanize, STATUT_TONES } from '../lib/format'

const TONES = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  green: 'bg-primary-50 text-primary-700 ring-primary-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
}

export function Spinner({ className }) {
  return <Loader2 className={clsx('h-5 w-5 animate-spin text-primary-600', className)} />
}

export function LoadingScreen({ label = 'Chargement…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function Button({
  variant = 'primary',
  size,
  loading = false,
  className,
  children,
  disabled,
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }
  return (
    <button
      className={clsx(variants[variant], size === 'sm' && 'btn-sm', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

export function Card({ className, children, ...props }) {
  return (
    <div className={clsx('card', className)} {...props}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, eyebrow, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'green', className }) {
  const iconTones = {
    green: 'bg-primary-50 text-primary-700',
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    violet: 'bg-violet-50 text-violet-700',
    cyan: 'bg-cyan-50 text-cyan-700',
    slate: 'bg-slate-100 text-slate-700',
  }
  return (
    <Card className={clsx('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate font-display text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        {Icon && (
          <span className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-xl', iconTones[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </Card>
  )
}

export function Badge({ value, label, tone, className }) {
  const resolved = tone || STATUT_TONES[value] || 'slate'
  return (
    <span className={clsx('badge', TONES[resolved] || TONES.slate, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label || humanize(value)}
    </span>
  )
}

export function Field({ label, hint, error, required, children, className }) {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}

export function Input({ className, ...props }) {
  return <input className={clsx('input', className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={clsx('input', className)} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className, rows = 3, ...props }) {
  return <textarea rows={rows} className={clsx('input', className)} {...props} />
}

export function EmptyState({ title = 'Aucun élément', description, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon className="h-7 w-7" />
      </span>
      <div>
        <p className="font-display text-base font-semibold text-slate-800">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={clsx(
          'animate-fade-up max-h-[92vh] w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl',
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[64vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Pagination({ page = 0, totalPages = 1, totalElements, onChange }) {
  if (totalPages <= 1 && !totalElements) return null
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <p className="text-xs text-slate-500">
        {totalElements != null ? `${totalElements} résultat${totalElements > 1 ? 's' : ''}` : ''} · page {page + 1} sur{' '}
        {Math.max(totalPages, 1)}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 0} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Précédent
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onChange(page + 1)}
        >
          Suivant <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ProgressBar({ value = 0, tone = 'bg-primary-600', className }) {
  return (
    <div className={clsx('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={clsx('h-full rounded-full transition-all', tone)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={clsx(
            'rounded-lg px-3.5 py-2 text-sm font-medium transition',
            active === tab.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {tab.label}
          {tab.count != null && <span className="ml-1.5 text-xs text-slate-400">{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Skeleton({ className }) {
  return <div className={clsx('animate-pulse rounded-xl bg-slate-200/70', className)} />
}
