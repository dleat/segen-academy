import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { isConnected } from '../lib/supabase'

export const CONTACT_PHONE = '+251979298765'

export function formatPhone(p: string) {
  const m = p.replace(/\s/g, '').match(/^\+251(\d{3})(\d{3})(\d{3})$/)
  return m ? `+251 ${m[1]} ${m[2]} ${m[3]}` : p
}

export default function Layout() {
  const { t, lang, setLang } = useI18n()
  const { session, profile, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      {!isConnected && <div className="note">{t('notConnected')}</div>}
      <header>
        <div className="wrap bar">
          <Link className="brand" to="/" aria-label="Segen Editing Academy home">
            <img src="/logo-mark.jpg" alt="" width={70} height={36} />
            <span>
              <b>SEGEN</b>
              <small>EDITING ACADEMY</small>
            </span>
          </Link>
          <nav aria-label="Main">
            <NavLink to="/courses">{t('navCourses')}</NavLink>
            {session && <NavLink to="/my">{t('navMy')}</NavLink>}
            {profile?.is_admin && <NavLink to="/admin">{t('navAdmin')}</NavLink>}
          </nav>
          <div className="lang" role="group" aria-label="Language">
            <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
              EN
            </button>
            <button type="button" className="ti" aria-pressed={lang === 'ti'} onClick={() => setLang('ti')}>
              ትግ
            </button>
          </div>
          {session ? (
            <button
              className="btn ghost small"
              type="button"
              onClick={async () => {
                await signOut()
                navigate('/')
              }}
            >
              {t('logout')}
            </button>
          ) : (
            <Link className="btn ghost small" to="/login">
              {t('login')}
            </Link>
          )}
        </div>
        <nav className="mobile-nav wrap" aria-label="Main">
          <NavLink to="/courses">{t('navCourses')}</NavLink>
          {session && <NavLink to="/my">{t('navMy')}</NavLink>}
          {profile?.is_admin && <NavLink to="/admin">{t('navAdmin')}</NavLink>}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        <div className="wrap">
          <span>© {new Date().getFullYear()} {t('footerRights')}</span>
          <span>
            {t('contact')}: <a href={`tel:${CONTACT_PHONE}`}>{formatPhone(CONTACT_PHONE)}</a> ·{' '}
            <a href={`https://wa.me/${CONTACT_PHONE.replace('+', '')}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </span>
        </div>
      </footer>
    </>
  )
}
