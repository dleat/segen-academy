import { Link } from 'react-router-dom'
import { daysLeft, loadCatalogue, loadMyPurchases } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { useLoad } from '../lib/useLoad'

export default function MyCourses() {
  const { t, pick, lang } = useI18n()
  const data = useLoad(async () => {
    const [catalogue, purchases] = await Promise.all([loadCatalogue(), loadMyPurchases()])
    return { catalogue, purchases }
  }, [])

  if (data.loading) return <div className="wrap page muted">{t('loading')}</div>
  if (data.error || !data.data) return <div className="wrap page error">{data.error}</div>
  const { catalogue, purchases } = data.data
  const date = (s: string) => new Date(s).toLocaleDateString(lang === 'ti' ? 'ti-ER' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="wrap page">
      <h1 className="page-title">{t('myTitle')}</h1>
      {purchases.length === 0 && (
        <div className="card">
          <p>{t('myEmpty')}</p>
          <Link className="btn gold" to="/courses">
            {t('browse')}
          </Link>
        </div>
      )}
      <div className="my-list">
        {purchases.map((p) => {
          const offer = catalogue.offers.find((o) => o.id === p.offer_id)
          const courses = catalogue.courses.filter((c) => offer?.course_ids.includes(c.id))
          const active = p.status === 'approved' && p.ends_at && new Date(p.ends_at) > new Date()
          const left = p.ends_at ? daysLeft(p.ends_at) : 0
          return (
            <article className="card my-item" key={p.id}>
              <div className="my-top">
                <h2 className="h3">{offer ? pick(offer, 'title') : p.offer_id}</h2>
                <span className={`pill ${p.status}${p.status === 'approved' && !active ? ' ended' : ''}`}>
                  {p.status === 'approved' && !active ? t('ended') : t(`status_${p.status}`)}
                </span>
              </div>
              <div className="muted small-print">
                {t('sentOn')} {date(p.created_at)}
              </div>

              {p.status === 'rejected' && (
                <>
                  <p className="error">
                    {t('rejectedReason')}: {p.reject_reason}
                  </p>
                  <Link className="btn gold small" to={`/buy/${p.offer_id}`}>
                    {t('tryAgain')}
                  </Link>
                </>
              )}

              {active && (
                <>
                  <p>
                    <strong className="gold-text">{left}</strong> {t('daysLeftN')}
                  </p>
                  <div className="cta">
                    {courses.map((c) => (
                      <Link className="btn gold small" key={c.id} to={`/learn/${c.id}`}>
                        {courses.length > 1 ? pick(c, 'title') : t('todayLesson')}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
