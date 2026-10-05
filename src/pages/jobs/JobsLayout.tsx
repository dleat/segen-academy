import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { useI18n } from '../../lib/i18n'

// Segen Jobs has its own strip under the academy header, so it reads as a
// separate site that shares the same login.
export default function JobsLayout() {
  const { t } = useI18n()
  const { session } = useAuth()
  return (
    <div className="jobs">
      <div className="jobs-bar">
        <div className="wrap">
          <NavLink to="/jobs" end className="jobs-brand">
            {t('jBrand')}
          </NavLink>
          <nav aria-label="Segen Jobs">
            <NavLink to="/jobs" end>
              {t('jFind')}
            </NavLink>
            <NavLink to="/jobs/new">{t('jPost')}</NavLink>
            {session && <NavLink to="/jobs/mine">{t('jMine')}</NavLink>}
            <NavLink to="/jobs/editor">{t('jEditor')}</NavLink>
          </nav>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
