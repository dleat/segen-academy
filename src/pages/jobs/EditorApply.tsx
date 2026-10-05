import { useState, type FormEvent } from 'react'
import { useAuth } from '../../lib/auth'
import { useI18n } from '../../lib/i18n'
import { act, loadMyEditor, type Editor } from '../../lib/jobs'
import { useLoad } from '../../lib/useLoad'

export default function EditorApply() {
  const { t } = useI18n()
  const editor = useLoad(loadMyEditor, [])

  if (editor.loading) return <div className="wrap page muted">{t('loading')}</div>
  if (editor.error) return <div className="wrap page error">{editor.error}</div>
  return <ApplyForm current={editor.data} onSaved={editor.reload} />
}

function ApplyForm({ current, onSaved }: { current: Editor | null; onSaved: () => void }) {
  const { t } = useI18n()
  const { profile } = useAuth()
  const [form, setForm] = useState({
    name: current?.display_name ?? profile?.full_name ?? '',
    courses: current?.courses_done ?? '',
    portfolio: current?.portfolio_link ?? '',
    about: current?.about ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    const message = await act('apply_as_editor', {
      p_display_name: form.name,
      p_courses_done: form.courses,
      p_portfolio_link: form.portfolio,
      p_about: form.about,
    })
    setBusy(false)
    setError(message)
    if (!message) onSaved()
  }

  return (
    <div className="wrap page narrow">
      <h1 className="page-title">{t('jApplyTitle')}</h1>
      {current ? (
        <div className={`notice ed-${current.status}`}>
          <p className="flush">{t(`jEd_${current.status}`)}</p>
          {current.admin_note && <p className="flush muted">{current.admin_note}</p>}
        </div>
      ) : (
        <p className="lede">{t('jApplyLede')}</p>
      )}
      <form className="card form" onSubmit={submit}>
        <label>
          {t('jName')}
          <input required minLength={2} maxLength={80} value={form.name} onChange={set('name')} />
        </label>
        <label>
          {t('jCoursesDone')}
          <input required placeholder="Premiere Pro, Photoshop" value={form.courses} onChange={set('courses')} />
        </label>
        <label>
          {t('jPortfolioL')}
          <input type="url" required placeholder="https://" value={form.portfolio} onChange={set('portfolio')} />
        </label>
        <label>
          {t('jAbout')}
          <textarea rows={3} value={form.about} onChange={set('about')} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn gold" type="submit" disabled={busy}>
          {current ? t('jApplyUpdate') : t('jApplySend')}
        </button>
      </form>
    </div>
  )
}
