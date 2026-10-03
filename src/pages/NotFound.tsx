import { Link } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div className="wrap page narrow">
      <h1 className="page-title">{t('notFound')}</h1>
      <Link className="btn gold" to="/">
        {t('home')}
      </Link>
    </div>
  )
}
