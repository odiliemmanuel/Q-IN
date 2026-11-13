import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Button } from '../components/ui'
import { IconArrowLeft, IconQueue } from '../components/icons'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <Logo />
      <p className="mt-10 font-display text-[72px] font-bold leading-none tracking-tight text-slate-900 dark:text-white">
        404
      </p>
      <div className="mt-4 flex items-center gap-2 text-brand-600 dark:text-brand-400">
        <IconQueue className="h-5 w-5" />
        <p className="font-display text-lg font-semibold">This line does not exist</p>
      </div>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        The page you were looking for may have moved, or the link might be out of date.
      </p>
      <Link to="/app/dashboard" className="mt-7">
        <Button leftIcon={<IconArrowLeft className="h-4 w-4" />}>Back to dashboard</Button>
      </Link>
    </div>
  )
}
