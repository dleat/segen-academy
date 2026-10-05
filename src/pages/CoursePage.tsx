import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { loadAccess, loadCatalogue, loadLessons, loadMyPurchases } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { useLoad } from '../lib/useLoad'
import NotFound from './NotFound'

export default function CoursePage() {
  const { courseId = '' } = useParams()
  const { t, pick } = useI18n()
  const { session } = useAuth()
  const userId = session?.user.id

  const catalogue = useLoad(loadCatalogue, [])
  const lessons = useLoad(() => loadLessons(courseId), [courseId])
  const mine = useLoad(
    async () => {
      if (!userId) return { access: null, waiting: false }
      const [access, purchases, cat] = await Promise.all([loadAccess(courseId), loadMyPurchases(), loadCatalogue()])
      const offersWithCourse = new Set(cat.offers.filter((o) => o.course_ids.includes(courseId)).map((o) => o.id))
      return {
        access,
        waiting: purchases.some((p) => p.status === 'waiting' && offersWithCourse.has(p.offer_id)),
      }
    },
    [courseId, userId],
  )

  if (catalogue.loading) return <div className="wrap page muted">{t('loading')}</div>
  if (catalogue.error) return <div className="wrap page error">{catalogue.error}</div>
  const course = catalogue.data?.courses.find((c) => c.id === courseId)
  if (!course) return <NotFound />

  const offers = catalogue.data!.offers.filter((o) => o.course_ids.includes(course.id))

  return (
    <div className="wrap page">
      <Link className="back" to="/courses">
        ← {t('allCourses')}
      </Link>
      <div className="course-head">
        <div className="app big" aria-hidden="true">
          {course.badge}
        </div>
        <div>
          <h1 className="page-title">{pick(course, 'title')}</h1>
          <div className="facts">
            <span>{t('month')}</span>
            <span>{t('daily')}</span>
            <span>EN · ትግ</span>
          </div>
        </div>
      </div>

      <div className="course-layout">
        <div>
          <p className="lede">{pick(course, 'description')}</p>

          <h2 className="h3">{t('lessonsTitle')}</h2>
          {lessons.data && lessons.data.length > 0 ? (
            <ol className="lesson-list">
              {lessons.data.map((l) => (
                <li key={l.id}>
                  <span className="day">
                    {t('dayN')} {l.day}
                  </span>
                  <span>{pick(l, 'title')}</span>
                </li>
              ))}
            </ol>
          ) : (
            !lessons.loading && <p className="muted">{t('lessonsSoon')}</p>
          )}
        </div>

        <aside className="buy-box">
          {mine.data?.access ? (
            <>
              <h3>{t('youOwn')}</h3>
              <Link className="btn gold" to={`/learn/${course.id}`}>
                {t('goToLessons')}
              </Link>
            </>
          ) : (
            <>
              {mine.data?.waiting && <p className="notice">{t('waitingApproval')}</p>}
              <h3>{t('includedIn')}</h3>
              {offers.map((o) => (
                <div className="offer-row" key={o.id}>
                  <div>
                    <div>{pick(o, 'title')}</div>
                    <span className="amount">${o.price_usd}</span>
                  </div>
                  <Link className="btn gold small" to={`/buy/${o.id}`}>
                    {o.course_ids.length > 1 ? t('bBuy') : t('buy')}
                  </Link>
                </div>
              ))}
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
