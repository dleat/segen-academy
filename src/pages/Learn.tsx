import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { daysLeft, loadAccess, loadCatalogue, loadLessons, loadVideos } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { useLoad } from '../lib/useLoad'
import NotFound from './NotFound'

export default function Learn() {
  const { courseId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const { t, pick } = useI18n()
  const { profile } = useAuth()
  const isAdmin = profile?.is_admin ?? false

  const data = useLoad(async () => {
    const [catalogue, lessons, access, videos] = await Promise.all([
      loadCatalogue(),
      loadLessons(courseId),
      loadAccess(courseId),
      loadVideos(courseId),
    ])
    return { catalogue, lessons, access, videos }
  }, [courseId])

  if (data.loading) return <div className="wrap page muted">{t('loading')}</div>
  if (data.error || !data.data) return <div className="wrap page error">{data.error}</div>

  const { catalogue, lessons, access, videos } = data.data
  const course = catalogue.courses.find((c) => c.id === courseId)
  if (!course) return <NotFound />

  // Dleat can preview every lesson; students see what the database unlocked.
  const unlocked = isAdmin ? Number.MAX_SAFE_INTEGER : (access?.unlocked_day ?? 0)

  if (!access && !isAdmin) {
    return (
      <div className="wrap page narrow">
        <h1 className="page-title">{pick(course, 'title')}</h1>
        <div className="card">
          <p>{t('noAccess')}</p>
          <div className="cta">
            <Link className="btn gold" to={`/courses/${course.id}`}>
              {t('buy')}
            </Link>
            <Link className="btn ghost" to="/my">
              {t('navMy')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const open = lessons.filter((l) => l.day <= unlocked)
  const todays = open[open.length - 1]
  const chosenDay = Number(params.get('day'))
  const current = open.find((l) => l.day === chosenDay) ?? todays
  const videoId = current ? videos[current.id] : undefined
  const total = Math.max(lessons.length, course.access_days)

  return (
    <div className="wrap page">
      <Link className="back" to="/my">
        ← {t('navMy')}
      </Link>
      <div className="learn-head">
        <h1 className="page-title">{pick(course, 'title')}</h1>
        {access && (
          <span className="muted">
            {t('tlDay')} <span className="tc">{String(Math.min(access.unlocked_day, total)).padStart(2, '0')}</span> / {total} ·{' '}
            <strong className="gold-text">{daysLeft(access.ends_at)}</strong> {t('daysLeftN')}
          </span>
        )}
      </div>

      <div className="learn">
        <div className="player">
          {current ? (
            <>
              <div className="video">
                {videoId ? (
                  <iframe
                    key={videoId}
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
                    title={pick(current, 'title')}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="video-empty">{t('noVideo')}</div>
                )}
              </div>
              <h2 className="h3">
                <span className="day">
                  {t('dayN')} {current.day}
                </span>{' '}
                {pick(current, 'title')}
              </h2>
            </>
          ) : (
            <div className="video">
              <div className="video-empty">{t('lessonsSoon')}</div>
            </div>
          )}
        </div>

        <ol className="lesson-list side">
          {lessons.map((l) => {
            const isOpen = l.day <= unlocked
            const wait = l.day - unlocked
            return (
              <li key={l.id} className={`${isOpen ? 'open' : 'locked'}${current?.id === l.id ? ' current' : ''}`}>
                {isOpen ? (
                  <button type="button" onClick={() => setParams({ day: String(l.day) })}>
                    <span className="day">
                      {t('dayN')} {l.day}
                    </span>
                    <span>{pick(l, 'title')}</span>
                    {l.id === todays?.id && !isAdmin && <span className="pill approved">{t('today')}</span>}
                  </button>
                ) : (
                  <div>
                    <span className="day">
                      {t('dayN')} {l.day}
                    </span>
                    <span>{pick(l, 'title')}</span>
                    <span className="muted small-print">
                      🔒 {wait === 1 ? t('opensTomorrow') : `${t('opensIn')} ${wait} ${t('days')}`}
                    </span>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
