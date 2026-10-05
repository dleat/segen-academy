import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../lib/i18n'
import type { Job } from '../../lib/jobs'
import { supabase } from '../../lib/supabase'

export default function PostJob() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', footage: '', budget: '', currency: 'ETB', deadline: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    const footage = form.footage.trim()
    if (footage && !/^https?:\/\//.test(footage)) {
      setError('The footage link should start with https://')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const ins = await supabase
        .from('jobs')
        .insert({
          title: form.title.trim(),
          description: form.description.trim(),
          budget: form.budget ? Math.round(Number(form.budget)) : null,
          currency: form.currency,
          deadline: form.deadline || null,
        })
        .select()
        .single()
      if (ins.error) throw ins.error
      const job = ins.data as Job
      if (footage) {
        const f = await supabase.from('job_footage').insert({ job_id: job.id, link: footage })
        if (f.error) throw f.error
      }
      navigate(`/jobs/${job.id}?posted=1`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <div className="wrap page narrow">
      <h1 className="page-title">{t('jPost')}</h1>
      <form className="card form" onSubmit={submit}>
        <label>
          {t('jTitle')}
          <input required minLength={3} maxLength={120} placeholder={t('jTitlePh')} value={form.title} onChange={set('title')} />
        </label>
        <label>
          {t('jDesc')}
          <textarea required rows={5} placeholder={t('jDescPh')} value={form.description} onChange={set('description')} />
        </label>
        <label>
          {t('jFootage')}
          <input type="url" placeholder="https://drive.google.com/..." value={form.footage} onChange={set('footage')} />
          <span className="muted small-print">{t('jFootageHelp')}</span>
        </label>
        <div className="row-2">
          <label>
            {t('jBudget')}
            <input type="number" min={0} inputMode="numeric" value={form.budget} onChange={set('budget')} />
          </label>
          <label>
            {t('jCurrency')}
            <select value={form.currency} onChange={set('currency')}>
              <option value="ETB">Birr (ETB)</option>
              <option value="USD">Dollar (USD)</option>
            </select>
          </label>
        </div>
        <label>
          {t('jDeadline')}
          <input type="date" value={form.deadline} onChange={set('deadline')} />
        </label>
        <p className="notice">{t('jTerms')}</p>
        {error && <p className="error">{error}</p>}
        <button className="btn gold" type="submit" disabled={busy || !supabase}>
          {busy ? t('sending') : t('jSubmitJob')}
        </button>
      </form>
    </div>
  )
}
