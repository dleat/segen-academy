import CourseCards from '../components/CourseCards'
import { loadCatalogue } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { useLoad } from '../lib/useLoad'

export default function Courses() {
  const { t } = useI18n()
  const catalogue = useLoad(loadCatalogue, [])

  return (
    <div className="wrap page">
      <div className="eyebrow">{t('cEyebrow')}</div>
      <h1 className="page-title">{t('allCourses')}</h1>
      <p className="sub">{t('cSub')}</p>
      {catalogue.loading && <p className="muted">{t('loading')}</p>}
      {catalogue.error && (
            <p className="error">
              {t('loadFailed')} <span className="muted small-print">({catalogue.error})</span>
            </p>
          )}
      {catalogue.data && <CourseCards catalogue={catalogue.data} />}
    </div>
  )
}
