import { Link } from 'react-router-dom'
import type { Catalogue } from '../lib/data'
import { useI18n } from '../lib/i18n'

// The three course cards plus the bundle banner, as on the homepage preview.
export default function CourseCards({ catalogue }: { catalogue: Catalogue }) {
  const { t, pick } = useI18n()
  const singles = catalogue.offers.filter((o) => o.course_ids.length === 1)
  const bundles = catalogue.offers.filter((o) => o.course_ids.length > 1)
  const courseById = new Map(catalogue.courses.map((c) => [c.id, c]))

  return (
    <>
      <div className="courses">
        {catalogue.courses.map((course) => {
          const offer = singles.find((o) => o.course_ids[0] === course.id)
          return (
            <article className="course" key={course.id}>
              <div className="app" aria-hidden="true">
                {course.badge}
              </div>
              <h3>
                <Link to={`/courses/${course.id}`}>{pick(course, 'title')}</Link>
              </h3>
              <p>{pick(course, 'summary')}</p>
              <div className="facts">
                <span>{t('month')}</span>
                <span>{t('daily')}</span>
                <span>EN · ትግ</span>
              </div>
              <div className="foot">
                {offer && <span className="amount">${offer.price_usd}</span>}
                <Link className="btn gold small" to={`/courses/${course.id}`}>
                  {offer ? t('buy') : t('details')}
                </Link>
              </div>
            </article>
          )
        })}
      </div>

      {bundles.map((bundle) => {
        const parts = bundle.course_ids.map((id) => courseById.get(id)).filter((c) => c !== undefined)
        const full = singles
          .filter((o) => bundle.course_ids.includes(o.course_ids[0]))
          .reduce((sum, o) => sum + o.price_usd, 0)
        return (
          <div className="bundle" key={bundle.id}>
            <div className="bundle-apps" aria-hidden="true">
              {parts.map((c, i) => (
                <span key={c.id} style={{ display: 'contents' }}>
                  {i > 0 && <span className="plus">+</span>}
                  <span className="app">{c.badge}</span>
                </span>
              ))}
            </div>
            <div className="bundle-text">
              <div className="eyebrow">{t('bEyebrow')}</div>
              <h3>{pick(bundle, 'title')}</h3>
              <p>{t('bP')}</p>
            </div>
            <div className="bundle-buy">
              <span className="amount big">${bundle.price_usd}</span>
              {full > bundle.price_usd && (
                <span className="save">{t('bSave').replace('$50', `$${full - bundle.price_usd}`)}</span>
              )}
              <Link className="btn gold" to={`/buy/${bundle.id}`}>
                {t('bBuy')}
              </Link>
            </div>
          </div>
        )
      })}
    </>
  )
}
