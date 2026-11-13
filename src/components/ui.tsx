import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useEffect, useRef } from 'react'
import { avatarColor, cn, initials } from '../lib/utils'
import { useUiStore, type ToastTone } from '../stores/ui'
import {
  IconAlert,
  IconCheckCircle,
  IconClose,
  IconInfo,
  type IconProps,
} from './icons'

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm shadow-brand-600/25 hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300 disabled:shadow-none dark:disabled:bg-brand-900',
  secondary:
    'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200',
  outline:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3 text-[13px]',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-5 text-[15px]',
  icon: 'h-10 w-10 justify-center',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-xl font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        'disabled:cursor-not-allowed',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('h-4 w-4 animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]',
        'dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)}>
      <div className="min-w-0">
        <h3 className="font-display text-[15px] font-semibold text-slate-900 dark:text-white">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'violet'

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral:
    'bg-slate-100 text-slate-600 ring-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  brand:
    'bg-brand-50 text-brand-700 ring-brand-200/70 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25',
  success:
    'bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25',
  warning:
    'bg-amber-50 text-amber-700 ring-amber-200/70 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25',
  danger:
    'bg-rose-50 text-rose-700 ring-rose-200/70 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/25',
  violet:
    'bg-violet-50 text-violet-700 ring-violet-200/70 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/25',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  dot = false,
}: {
  tone?: BadgeTone
  className?: string
  children: ReactNode
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        BADGE_TONES[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

const FIELD_BASE =
  'w-full rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 transition-colors ' +
  'focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none ' +
  'dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
  trailing?: ReactNode
}

export function Input({ label, error, hint, icon, trailing, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name
  return (
    <label htmlFor={inputId} className="block">
      {label ? (
        <span className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      ) : null}
      <span className="relative block">
        {icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          className={cn(
            FIELD_BASE,
            'h-11',
            icon ? 'pl-10' : 'pl-3.5',
            trailing ? 'pr-11' : 'pr-3.5',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/10',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {trailing ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </span>
      {error ? (
        <span className="mt-1.5 flex items-center gap-1 text-[12px] font-medium text-rose-600 dark:text-rose-400">
          <IconAlert className="h-3.5 w-3.5" />
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] text-slate-500 dark:text-slate-400">{hint}</span>
      ) : null}
    </label>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
}

export function Select({ label, hint, className, children, id, ...props }: SelectProps) {
  const selectId = id ?? props.name
  return (
    <label htmlFor={selectId} className="block">
      {label ? (
        <span className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      ) : null}
      <select id={selectId} className={cn(FIELD_BASE, 'h-11 px-3.5', className)} {...props}>
        {children}
      </select>
      {hint ? (
        <span className="mt-1.5 block text-[12px] text-slate-500 dark:text-slate-400">{hint}</span>
      ) : null}
    </label>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
}

export function Textarea({ label, hint, className, id, ...props }: TextareaProps) {
  const areaId = id ?? props.name
  return (
    <label htmlFor={areaId} className="block">
      {label ? (
        <span className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      ) : null}
      <textarea id={areaId} className={cn(FIELD_BASE, 'min-h-[92px] px-3.5 py-2.5', className)} {...props} />
      {hint ? (
        <span className="mt-1.5 block text-[12px] text-slate-500 dark:text-slate-400">{hint}</span>
      ) : null}
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    xs: 'h-7 w-7 text-[10px]',
    sm: 'h-9 w-9 text-[11px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-14 w-14 text-base',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase',
        avatarColor(name),
        sizes[size],
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export function Progress({
  value,
  max = 100,
  tone = 'brand',
  className,
}: {
  value: number
  max?: number
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'white'
  className?: string
}) {
  const percent = Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100))
  const tones = {
    brand: 'bg-brand-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    white: 'bg-white',
  }
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70', className)}
      role="progressbar"
      aria-valuenow={Math.min(max, Math.max(0, value))}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn('h-full rounded-full transition-all duration-500', tones[tone])}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-lg animate-scale-in rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close dialog"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
        {footer ? <div className="mt-6 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Toggle                                                              */
/* ------------------------------------------------------------------ */

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
        style={{ height: 18, width: 18 }}
      />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        {icon}
      </div>
      <p className="mt-4 font-display text-[15px] font-semibold text-slate-900 dark:text-white">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Stat tile                                                           */
/* ------------------------------------------------------------------ */

export function StatTile({
  label,
  value,
  icon,
  hint,
  tone = 'brand',
}: {
  label: string
  value: ReactNode
  icon: (props: IconProps) => ReactNode
  hint?: ReactNode
  tone?: 'brand' | 'success' | 'warning' | 'violet'
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    warning: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  }
  const Icon = icon
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {hint ? <div className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">{hint}</div> : null}
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/* Toaster                                                             */
/* ------------------------------------------------------------------ */

const TOAST_STYLES: Record<ToastTone, { wrapper: string; icon: ReactNode }> = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    icon: <IconCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
  },
  error: {
    wrapper: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200',
    icon: <IconAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
  },
  info: {
    wrapper: 'border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-200',
    icon: <IconInfo className="h-5 w-5 text-brand-600 dark:text-brand-400" />,
  },
}

export function Toaster() {
  const toast = useUiStore((state) => state.toast)
  const dismiss = useUiStore((state) => state.dismissToast)

  if (!toast) return null
  const styles = TOAST_STYLES[toast.tone]

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:justify-end">
      <div
        className={cn(
          'pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-xl border p-3.5 shadow-lg',
          styles.wrapper,
        )}
        role="status"
      >
        {styles.icon}
        <p className="flex-1 text-[13px] font-medium leading-snug">{toast.message}</p>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Dismiss notification"
        >
          <IconClose className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
