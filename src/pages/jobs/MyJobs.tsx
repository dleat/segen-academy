import { Link } from 'react-router-dom'
import { useI18n } from '../../lib/i18n'
import { loadMyJobs, money, type Job } from '../../lib/jobs'
import { useLoad } from '../../lib/useLoad'

export default function MyJobs() {
  const { t } = useI18n()
  const data = useLoad(loadMyJobs, [])

  if (data.loading) return <div className="wrap page muted">{t('loading')}</div>
  if (data.error || !data.data) return <div className="wrap page error">{data.error}</div>
  const { posted, editing, offers } = data.data

  const list = (jobs: Job[]) =>
    jobs.length === 0 ? (
      <p className="muted">{t('jNothing')}</p>
    ) : (
      <div className="job-list">
        {jobs.map((j) => (
          <Link className="card job-card" key={j.id} to={`/jobs/${j.id}`}>
            <div className="my-top">
              <h3>{j.title}</h3>
              <span className={`pill job-${j.status}`}>{t(`jStatus_${j.status}`)}</span>
            </div>
            <div className="muted small-print">
              {j.price != null ? money(j.price, j.currency) : j.budget != null ? money(j.budget, j.currency) : ''} · {j.created_at.slice(0, 10)}
            </div>
          </Link>
        ))}
      </div>
    )

  return (
    <div className="wrap page">
      <h1 className="page-title">{t('jMine')}</h1>
      <h2 className="h3">{t('jMyPosted')}</h2>
      {list(posted)}
      {posted.length === 0 && (
        <Link className="btn gold small" to="/jobs/new">
          {t('jPostCta')}
        </Link>
      )}
      {editing.length > 0 && (
        <>
          <h2 className="h3">{t('jMyWork')}</h2>
          {list(editing)}
        </>
      )}
      {offers.length > 0 && (
        <>
          <h2 className="h3">{t('jMyOffers')}</h2>
          <div className="job-list">
            {offers.map((o) => (
              <Link className="card job-card" key={o.id} to={`/jobs/${o.job_id}`}>
                <h3>{o.job?.title}</h3>
                <div className="muted small-print">
                  {o.price} · {o.days} {t('jDaysN')}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
