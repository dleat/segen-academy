import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { useI18n } from '../../lib/i18n'
import { loadMyEditor, loadOpenJobs, money } from '../../lib/jobs'
import { useLoad } from '../../lib/useLoad'

export default function JobsHome() {
  const { t } = useI18n()
  const { session } = useAuth()
  const userId = session?.user.id
  const editor = useLoad(loadMyEditor, [userId])
  const approved = editor.data?.status === 'approved'
  const jobs = useLoad(async () => (approved ? loadOpenJobs() : []), [approved])

  return (
    <>
      <div className="wrap hero jobs-hero">
        <div className="eyebrow">{t('jEyebrow')}</div>
        <h1>
          {t('jH1a')} <em>{t('jH1b')}</em>
        </h1>
        <p className="lede">{t('jLede')}</p>
        <div className="cta">
          <Link className="btn gold" to="/jobs/new">
            {t('jPostCta')}
          </Link>
          {!approved && (
            <Link className="btn ghost" to="/jobs/editor">
              {t('jApplyCta')}
            </Link>
          )}
        </div>
      </div>

      {approved && (
        <section>
          <div className="wrap">
            <h2>{t('jOpenJobs')}</h2>
            {jobs.loading && <p className="muted">{t('loading')}</p>}
            {jobs.error && <p className="error">{jobs.error}</p>}
            {jobs.data?.length === 0 && <p className="card">{t('jNoOpen')}</p>}
            <div className="job-list">
              {jobs.data?.map((j) => (
                <Link className="card job-card" key={j.id} to={`/jobs/${j.id}`}>
                  <h3>{j.title}</h3>
                  <p className="muted">{j.description.length > 160 ? `${j.description.slice(0, 160)}…` : j.description}</p>
                  <div className="facts">
                    {j.budget != null && (
                      <span>
                        {t('jBudgetL')}: {money(j.budget, j.currency)}
                      </span>
                    )}
                    {j.deadline && (
                      <span>
                        {t('jDeadlineL')}: {j.deadline}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="wrap jobs-how">
          <div className="card">
            <h2 className="h3">{t('jClientsT')}</h2>
            <ol>
              <li>{t('jC1')}</li>
              <li>{t('jC2')}</li>
              <li>{t('jC3')}</li>
              <li>{t('jC4')}</li>
              <li>
                <strong className="gold-text">{t('jC5')}</strong>
              </li>
            </ol>
            <Link className="btn gold small" to="/jobs/new">
              {t('jPostCta')}
            </Link>
          </div>
          <div className="card">
            <h2 className="h3">{t('jEditorsT')}</h2>
            <ol>
              <li>{t('jE1')}</li>
              <li>{t('jE2')}</li>
              <li>{t('jE3')}</li>
              <li>{t('jE4')}</li>
            </ol>
            {!approved && (
              <>
                <p className="muted small-print">{t('jEditorsOnly')}</p>
                <Link className="btn ghost small" to="/jobs/editor">
                  {t('jApplyCta')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
