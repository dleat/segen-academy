import { useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { formatPhone } from '../../components/Layout'
import { useAuth } from '../../lib/auth'
import { loadSettings, parseYouTubeId, type Settings } from '../../lib/data'
import { useI18n } from '../../lib/i18n'
import { act, FREE_CORRECTIONS, loadJob, loadMyEditor, money, payout, type JobDetail, type JobPayment } from '../../lib/jobs'
import { supabase } from '../../lib/supabase'
import { useLoad } from '../../lib/useLoad'

export default function JobPage() {
  const { jobId = '' } = useParams()
  const [params] = useSearchParams()
  const { t } = useI18n()
  const { session, profile } = useAuth()
  const uid = session?.user.id
  const data = useLoad(async () => {
    const [detail, editor] = await Promise.all([loadJob(jobId), loadMyEditor()])
    return { detail, editor }
  }, [jobId, uid])
  const [error, setError] = useState<string | null>(null)

  if (data.loading && !data.data) return <div className="wrap page muted">{t('loading')}</div>
  if (data.error) return <div className="wrap page error">{data.error}</div>
  const detail = data.data?.detail
  if (!detail) {
    return (
      <div className="wrap page narrow">
        <p className="card">{t('jNotFound')}</p>
        <Link className="btn gold" to="/jobs">
          {t('jFind')}
        </Link>
      </div>
    )
  }

  const { job, footage, offers, deliveries, corrections } = detail
  const isClient = job.client_id === uid
  const isEditor = job.editor_id === uid
  const isAdmin = profile?.is_admin ?? false
  const canOffer = !isClient && job.status === 'open' && data.data?.editor?.status === 'approved'
  const myOffer = offers.find((o) => o.editor_id === uid)

  async function run(fn: string, args: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return
    const message = await act(fn, args)
    setError(message)
    data.reload()
  }

  return (
    <div className="wrap page">
      <Link className="back" to={isClient || isEditor ? '/jobs/mine' : '/jobs'}>
        ← {isClient || isEditor ? t('jMine') : t('jFind')}
      </Link>
      {params.get('posted') && job.status === 'open' && <p className="notice">{t('jPosted')}</p>}
      <div className="my-top">
        <h1 className="page-title">{job.title}</h1>
        <span className={`pill job-${job.status}`}>{t(`jStatus_${job.status}`)}</span>
      </div>
      <div className="facts">
        {job.price != null ? (
          <span>
            {t('jPriceL')}: {money(job.price, job.currency)}
          </span>
        ) : (
          job.budget != null && (
            <span>
              {t('jBudgetL')}: {money(job.budget, job.currency)}
            </span>
          )
        )}
        {job.deadline && (
          <span>
            {t('jDeadlineL')}: {job.deadline}
          </span>
        )}
        <span>
          {t('jPostedOn')}: {job.created_at.slice(0, 10)}
        </span>
        {detail.editorName && <span>Editor: {detail.editorName}</span>}
      </div>
      <p className="pre job-desc">{job.description}</p>
      {footage && (
        <p>
          {t('jFootageL')}:{' '}
          <a className="gold-text" href={footage} target="_blank" rel="noreferrer">
            {footage}
          </a>
        </p>
      )}
      {error && <p className="error">{error}</p>}

      {/* Client choosing an editor */}
      {(isClient || isAdmin) && job.status === 'open' && (
        <>
          <h2 className="h3">{t('jOffers')}</h2>
          {offers.length === 0 && <p className="card">{t('jNoOffers')}</p>}
          <div className="admin-list">
            {offers.map((o) => (
              <article className="card offer" key={o.id}>
                <div className="my-top">
                  <h3>{o.editor?.display_name}</h3>
                  <span className="amount">{money(o.price, job.currency)}</span>
                </div>
                <div className="muted small-print">
                  {o.days} {t('jDaysN')}
                  {o.editor?.courses_done && ` · ${o.editor.courses_done}`}
                </div>
                {o.message && <p className="pre">{o.message}</p>}
                <div className="cta">
                  {isClient && (
                    <button className="btn gold small" type="button" onClick={() => run('accept_offer', { p_offer_id: o.id }, t('jChooseConfirm'))}>
                      {t('jChoose')}
                    </button>
                  )}
                  {o.editor?.portfolio_link && (
                    <a className="btn ghost small" href={o.editor.portfolio_link} target="_blank" rel="noreferrer">
                      {t('jPortfolio')}
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="cta spaced">
            <button className="btn ghost small" type="button" onClick={() => run('cancel_job', { p_job_id: job.id }, t('jCancelConfirm'))}>
              {t('jCancel')}
            </button>
          </div>
        </>
      )}

      {/* Approved editor sending an offer */}
      {canOffer &&
        (myOffer ? (
          <div className="card">
            <p>{t('jOfferSent')}</p>
            <p className="muted">
              {money(myOffer.price, job.currency)} · {myOffer.days} {t('jDaysN')}
            </p>
            <button
              className="btn ghost small"
              type="button"
              onClick={async () => {
                if (!supabase) return
                const { error } = await supabase.from('job_offers').delete().eq('id', myOffer.id)
                setError(error?.message ?? null)
                data.reload()
              }}
            >
              {t('jWithdraw')}
            </button>
          </div>
        ) : (
          <OfferForm jobId={job.id} currency={job.currency} onSent={data.reload} />
        ))}
      {!isClient && !isEditor && myOffer?.status === 'declined' && <p className="card muted">{t('jOfferDeclined')}</p>}

      {/* The work itself */}
      {(isClient || isEditor || isAdmin) && job.editor_id && (
        <>
          {isEditor && <EditorPay detail={detail} />}

          {isEditor && job.status === 'working' && <DeliverForm jobId={job.id} onSent={data.reload} />}
          {isEditor && job.status === 'review' && <p className="notice">{t('jWaitClient')}</p>}

          {isClient && <ClientPayment detail={detail} onPaid={data.reload} />}

          {isClient && job.status === 'review' && (
            <ClientReview detail={detail} run={run} />
          )}
          {job.status === 'done' && <p className="notice">{t('jDoneMsg')}</p>}

          <h2 className="h3">{t('jVersions')}</h2>
          {deliveries.length === 0 && <p className="muted">{t('jNoVersion')}</p>}
          <div className="admin-list">
            {deliveries.map((d) => (
              <article className="card" key={d.id}>
                <h3 className="h3 flush">
                  {t('jVersionN')} {d.version}
                </h3>
                <div className="video watermarked">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${d.preview_youtube_id}?rel=0&modestbranding=1`}
                    title={`${job.title} ${d.version}`}
                    allow="encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                  <div className="watermark" aria-hidden="true">
                    {Array.from({ length: 12 }, (_, i) => (
                      <span key={i}>SEGEN PREVIEW</span>
                    ))}
                  </div>
                </div>
                {d.note && <p className="pre">{d.note}</p>}
                {d.final_link ? (
                  <a className="btn gold small" href={d.final_link} target="_blank" rel="noreferrer">
                    {t('jDownload')}
                  </a>
                ) : (
                  <p className="muted small-print">{t('jPreviewOnly')}</p>
                )}
              </article>
            ))}
          </div>

          {corrections.length > 0 && (
            <>
              <h2 className="h3">
                {t('jCorrectionsL')}: {job.corrections_used} / {FREE_CORRECTIONS}
              </h2>
              <ol className="lesson-list">
                {corrections.map((c) => (
                  <li key={c.id}>
                    <span className="day">
                      {t('jCorrection')} {c.round}
                    </span>
                    <span className="pre">{c.request}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </>
      )}
    </div>
  )
}

function OfferForm({ jobId, currency, onSent }: { jobId: string; currency: string; onSent: () => void }) {
  const { t } = useI18n()
  const [form, setForm] = useState({ price: '', days: '3', message: '' })
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    const { error } = await supabase
      .from('job_offers')
      .insert({ job_id: jobId, price: Math.round(Number(form.price)), days: Number(form.days), message: form.message.trim() })
    if (error) setError(error.message)
    else onSent()
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h2 className="h3 flush">{t('jSendOffer')}</h2>
      <div className="row-2">
        <label>
          {t('jYourPrice')} ({currency === 'USD' ? 'USD' : 'birr'})
          <input type="number" min={1} required inputMode="numeric" value={form.price} onChange={set('price')} />
        </label>
        <label>
          {t('jYourDays')}
          <input type="number" min={1} max={90} required value={form.days} onChange={set('days')} />
        </label>
      </div>
      <label>
        {t('jOfferMsg')}
        <textarea rows={3} placeholder={t('jOfferMsgPh')} value={form.message} onChange={set('message')} />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn gold" type="submit">
        {t('jSendOffer')}
      </button>
    </form>
  )
}

function EditorPay({ detail }: { detail: JobDetail }) {
  const { t } = useI18n()
  const { job } = detail
  if (job.price == null) return null
  const p = payout(job.price)
  const state = (at: string | null) => (at ? <span className="pill approved">{t('jPaidOut')}</span> : <span className="pill">{t('jNotYet')}</span>)
  return (
    <div className="card">
      <h2 className="h3 flush">{t('jEditorPay')}</h2>
      <dl className="pay-split">
        <dt>{t('jEditorHalf')}</dt>
        <dd>
          {money(p.half, job.currency)} {state(job.editor_half_paid_at)}
        </dd>
        <dt>{t('jEditorRest')}</dt>
        <dd>
          {money(p.rest, job.currency)} {state(job.editor_rest_paid_at)}
        </dd>
      </dl>
    </div>
  )
}

function DeliverForm({ jobId, onSent }: { jobId: string; onSent: () => void }) {
  const { t } = useI18n()
  const [form, setForm] = useState({ preview: '', final: '', note: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  async function submit(e: FormEvent) {
    e.preventDefault()
    const youtubeId = parseYouTubeId(form.preview)
    if (!youtubeId) {
      setError('That does not look like a YouTube link.')
      return
    }
    if (!/^https?:\/\//.test(form.final.trim())) {
      setError('The full video link should start with https://')
      return
    }
    setBusy(true)
    const message = await act('submit_delivery', {
      p_job_id: jobId,
      p_youtube_id: youtubeId,
      p_final_link: form.final.trim(),
      p_note: form.note,
    })
    setBusy(false)
    setError(message)
    if (!message) onSent()
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h2 className="h3 flush">{t('jDeliver')}</h2>
      <label>
        {t('jPreviewLink')}
        <input required placeholder="https://youtu.be/..." value={form.preview} onChange={set('preview')} />
        <a className="small-print gold-text" href="/segen-preview-watermark.png" download>
          {t('jWatermark')}
        </a>
      </label>
      <label>
        {t('jFinalLink')}
        <input type="url" required placeholder="https://drive.google.com/..." value={form.final} onChange={set('final')} />
        <span className="muted small-print">{t('jFinalHelp')}</span>
      </label>
      <label>
        {t('jDeliverNote')}
        <textarea rows={2} value={form.note} onChange={set('note')} />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn gold" type="submit" disabled={busy}>
        {busy ? t('sending') : t('jDeliverSend')}
      </button>
    </form>
  )
}

function ClientReview({
  detail,
  run,
}: {
  detail: JobDetail
  run: (fn: string, args: Record<string, unknown>, confirmText?: string) => Promise<void>
}) {
  const { t } = useI18n()
  const { job } = detail
  const [request, setRequest] = useState('')
  const left = FREE_CORRECTIONS - job.corrections_used

  return (
    <div className="card form">
      {left > 0 ? (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault()
            void run('request_correction', { p_job_id: job.id, p_request: request })
          }}
        >
          <h2 className="h3 flush">{t('jAskChange')}</h2>
          <p className="muted small-print">
            <strong className="gold-text">{left}</strong> {t('jFreeLeft')}
          </p>
          <textarea required minLength={3} rows={3} placeholder={t('jChangePh')} value={request} onChange={(e) => setRequest(e.target.value)} />
          <button className="btn ghost" type="submit">
            {t('jSendChange')}
          </button>
        </form>
      ) : (
        <p className="muted">{t('jNoFreeLeft')}</p>
      )}
      {job.paid_at && (
        <button className="btn gold" type="button" onClick={() => run('finish_job', { p_job_id: job.id }, t('jAcceptConfirm'))}>
          {t('jAccept')}
        </button>
      )}
    </div>
  )
}

function ClientPayment({ detail, onPaid }: { detail: JobDetail; onPaid: () => void }) {
  const { t } = useI18n()
  const { job, payments, deliveries } = detail
  if (job.status === 'cancelled' || job.status === 'open') return null
  if (job.paid_at) return <p className="notice">{t('jPaid')}</p>
  if (payments.some((p) => p.status === 'waiting')) return <p className="notice">{t('jPayWaiting')}</p>
  if (deliveries.length === 0) return <p className="muted">{t('jPayAfterPreview')}</p>
  const rejected = payments.find((p) => p.status === 'rejected')
  return (
    <>
      {rejected && (
        <p className="error">
          {t('jPayRejected')}: {rejected.reject_reason}
        </p>
      )}
      <PayForm jobId={job.id} amount={money(job.price, job.currency)} onPaid={onPaid} />
    </>
  )
}

function PayForm({ jobId, amount, onPaid }: { jobId: string; amount: string; onPaid: () => void }) {
  const { t } = useI18n()
  const { session } = useAuth()
  const settings = useLoad(loadSettings, [])
  const [method, setMethod] = useState<JobPayment['method']>('telebirr')
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const s: Settings | null = settings.data

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !session) return
    if (method !== 'abroad' && !file) {
      setError(t('chooseFile'))
      return
    }
    setBusy(true)
    setError(null)
    try {
      let receiptPath: string | null = null
      if (file) {
        const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
        receiptPath = `${session.user.id}/job-${Date.now()}.${ext || 'jpg'}`
        const up = await supabase.storage.from('receipts').upload(receiptPath, file, { contentType: file.type })
        if (up.error) throw up.error
      }
      const ins = await supabase
        .from('job_payments')
        .insert({ job_id: jobId, method, receipt_path: receiptPath, note: note.trim() })
      if (ins.error) throw ins.error
      onPaid()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <div className="my-top">
        <h2 className="h3 flush">{t('jPayTitle')}</h2>
        <span className="amount">{amount}</span>
      </div>
      <fieldset className="methods">
        <legend>{t('howPay')}</legend>
        {(
          [
            ['telebirr', t('telebirr')],
            ['bank', t('bankShort')],
            ['abroad', t('abroadShort')],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className={`method${method === value ? ' on' : ''}`}>
            <input type="radio" name="method" value={value} checked={method === value} onChange={() => setMethod(value)} />
            {label}
          </label>
        ))}
      </fieldset>
      {s && method === 'telebirr' && (
        <div className="pay-details">
          <div className="muted">{t('sendTo')}</div>
          {s.telebirr_number ? (
            <>
              <div className="phone">{s.telebirr_number}</div>
              {s.telebirr_name && (
                <div>
                  {t('accountName')}: {s.telebirr_name}
                </div>
              )}
            </>
          ) : (
            <p>{t('detailsComing')}</p>
          )}
        </div>
      )}
      {s && method === 'bank' && (
        <div className="pay-details">
          <div className="muted">{t('sendTo')}</div>
          {s.bank_details ? <p className="pre">{s.bank_details}</p> : <p>{t('detailsComing')}</p>}
        </div>
      )}
      {s && method === 'abroad' && (
        <div className="pay-details">
          <p>{t('abroadHelp')}</p>
          <div className="cta">
            <a className="btn ghost small" href={`https://wa.me/${s.contact_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a className="btn ghost small" href={`tel:${s.contact_phone}`}>
              {formatPhone(s.contact_phone)}
            </a>
          </div>
        </div>
      )}
      <label>
        {t('receipt')}
        {method === 'abroad' && ` (${t('optional')})`}
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            setError(f && f.size > 5 * 1024 * 1024 ? t('receiptHelp') : null)
            setFile(f && f.size <= 5 * 1024 * 1024 ? f : null)
          }}
        />
        <span className="muted small-print">{t('receiptHelp')}</span>
      </label>
      <label>
        {t('noteLabel')}
        <textarea rows={2} placeholder={t('notePlaceholder')} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn gold" type="submit" disabled={busy}>
        {busy ? t('sending') : t('submit')}
      </button>
    </form>
  )
}
