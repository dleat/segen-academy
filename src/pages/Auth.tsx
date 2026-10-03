import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { supabase } from '../lib/supabase'

// Where to go after logging in: the page that sent the student here.
function useNext() {
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/my'
  return next.startsWith('/') && !next.startsWith('//') ? next : '/my'
}

// Wraps pages that need a logged-in student (or Dleat, with adminOnly).
export function RequireAuth({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { ready, session, profile } = useAuth()
  const location = useLocation()
  const { t } = useI18n()
  if (!ready) return <div className="wrap page muted">{t('loading')}</div>
  if (!session) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }
  if (adminOnly) {
    if (!profile) return <div className="wrap page muted">{t('loading')}</div>
    if (!profile.is_admin) return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="wrap page narrow">
      <h1 className="page-title">{title}</h1>
      <div className="card">{children}</div>
    </div>
  )
}

export function Login() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const next = useNext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) setError(error.message)
    else navigate(next, { replace: true })
  }

  return (
    <Card title={t('loginTitle')}>
      {next !== '/my' && <p className="muted">{t('loginNeeded')}</p>}
      <form className="form" onSubmit={submit}>
        <label>
          {t('email')}
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          {t('password')}
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn gold" type="submit" disabled={busy || !supabase}>
          {t('login')}
        </button>
      </form>
      <p className="muted small-print">
        <Link to="/forgot-password">{t('forgot')}</Link>
      </p>
      <p className="muted small-print">
        {t('noAccount')} <Link to={`/signup?next=${encodeURIComponent(next)}`}>{t('signup')}</Link>
      </p>
    </Card>
  )
}

export function Signup() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const next = useNext()
  const [form, setForm] = useState({ full_name: '', phone: '', country: 'Ethiopia', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: { full_name: form.full_name.trim(), phone: form.phone.trim(), country: form.country.trim(), language: lang },
        emailRedirectTo: `${window.location.origin}${next}`,
      },
    })
    setBusy(false)
    if (error) setError(error.message)
    else if (data.session) navigate(next, { replace: true })
    else setDone(true)
  }

  if (done) {
    return (
      <Card title={t('signupTitle')}>
        <p>{t('checkEmail')}</p>
        <Link className="btn gold" to={`/login?next=${encodeURIComponent(next)}`}>
          {t('login')}
        </Link>
      </Card>
    )
  }

  return (
    <Card title={t('signupTitle')}>
      <form className="form" onSubmit={submit}>
        <label>
          {t('fullName')}
          <input required autoComplete="name" value={form.full_name} onChange={set('full_name')} />
        </label>
        <label>
          {t('phone')}
          <input type="tel" required autoComplete="tel" placeholder="+251 9..." value={form.phone} onChange={set('phone')} />
        </label>
        <label>
          {t('country')}
          <input required autoComplete="country-name" value={form.country} onChange={set('country')} />
        </label>
        <label>
          {t('email')}
          <input type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
        </label>
        <label>
          {t('password')}
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn gold" type="submit" disabled={busy || !supabase}>
          {t('createAccount')}
        </button>
      </form>
      <p className="muted small-print">
        {t('haveAccount')} <Link to={`/login?next=${encodeURIComponent(next)}`}>{t('login')}</Link>
      </p>
    </Card>
  )
}

export function ForgotPassword() {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <Card title={t('resetTitle')}>
      {sent ? (
        <p>{t('resetSent')}</p>
      ) : (
        <form className="form" onSubmit={submit}>
          <label>
            {t('email')}
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn gold" type="submit" disabled={!supabase}>
            {t('sendReset')}
          </button>
        </form>
      )}
    </Card>
  )
}

// The reset email link logs the student in and lands here.
export function ResetPassword() {
  const { t } = useI18n()
  const { session, ready } = useAuth()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else setMessage(t('passwordSaved'))
  }

  if (ready && !session) return <Navigate to="/forgot-password" replace />

  return (
    <Card title={t('resetTitle')}>
      {message ? (
        <>
          <p>{message}</p>
          <Link className="btn gold" to="/my">
            {t('navMy')}
          </Link>
        </>
      ) : (
        <form className="form" onSubmit={submit}>
          <label>
            {t('newPassword')}
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn gold" type="submit">
            {t('savePassword')}
          </button>
        </form>
      )}
    </Card>
  )
}
