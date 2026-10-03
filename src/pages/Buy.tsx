import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CONTACT_PHONE, formatPhone } from '../components/Layout'
import { useAuth } from '../lib/auth'
import { loadCatalogue, loadSettings, type Purchase } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { useLoad } from '../lib/useLoad'
import NotFound from './NotFound'

type Method = Purchase['method']

export default function Buy() {
  const { offerId = '' } = useParams()
  const { t, pick } = useI18n()
  const { session } = useAuth()
  const data = useLoad(async () => {
    const [catalogue, settings] = await Promise.all([loadCatalogue(), loadSettings()])
    return { catalogue, settings }
  }, [])

  const [method, setMethod] = useState<Method>('telebirr')
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (data.loading) return <div className="wrap page muted">{t('loading')}</div>
  if (data.error || !data.data) return <div className="wrap page error">{data.error}</div>

  const { catalogue, settings } = data.data
  const offer = catalogue.offers.find((o) => o.id === offerId)
  if (!offer) return <NotFound />
  const courses = catalogue.courses.filter((c) => offer.course_ids.includes(c.id))
  const phone = settings.contact_phone || CONTACT_PHONE
  const priceNote = pick(settings, 'price_note')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase || !session || !offer) return
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
        receiptPath = `${session.user.id}/${Date.now()}.${ext || 'jpg'}`
        const up = await supabase.storage.from('receipts').upload(receiptPath, file, { contentType: file.type })
        if (up.error) throw up.error
      }
      const ins = await supabase
        .from('purchases')
        .insert({ offer_id: offer.id, method, receipt_path: receiptPath, note: note.trim() })
      if (ins.error) throw ins.error
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="wrap page narrow">
      <Link className="back" to={courses.length === 1 ? `/courses/${courses[0].id}` : '/courses'}>
        ← {t('allCourses')}
      </Link>
      <div className="eyebrow">{t('buyTitle')}</div>
      <h1 className="page-title">{pick(offer, 'title')}</h1>
      <div className="price-line">
        <span className="amount big">${offer.price_usd}</span>
        {courses.length > 1 && <span className="muted">{courses.map((c) => pick(c, 'title')).join(' + ')}</span>}
      </div>
      {priceNote && <p className="notice">{priceNote}</p>}

      {done ? (
        <div className="card">
          <p>{t('sent')}</p>
          <Link className="btn gold" to="/my">
            {t('navMy')}
          </Link>
        </div>
      ) : !session ? (
        <div className="card">
          <p>{t('loginNeeded')}</p>
          <div className="cta">
            <Link className="btn gold" to={`/signup?next=/buy/${offer.id}`}>
              {t('signup')}
            </Link>
            <Link className="btn ghost" to={`/login?next=/buy/${offer.id}`}>
              {t('login')}
            </Link>
          </div>
        </div>
      ) : (
        <form className="card form" onSubmit={submit}>
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
                <input
                  type="radio"
                  name="method"
                  value={value}
                  checked={method === value}
                  onChange={() => setMethod(value)}
                />
                {label}
              </label>
            ))}
          </fieldset>

          {method === 'telebirr' && (
            <div className="pay-details">
              <div className="muted">{t('sendTo')}</div>
              {settings.telebirr_number ? (
                <>
                  <div className="phone">{settings.telebirr_number}</div>
                  {settings.telebirr_name && (
                    <div>
                      {t('accountName')}: {settings.telebirr_name}
                    </div>
                  )}
                </>
              ) : (
                <p>{t('detailsComing')}</p>
              )}
            </div>
          )}
          {method === 'bank' && (
            <div className="pay-details">
              <div className="muted">{t('sendTo')}</div>
              {settings.bank_details ? <p className="pre">{settings.bank_details}</p> : <p>{t('detailsComing')}</p>}
            </div>
          )}
          {method === 'abroad' && (
            <div className="pay-details">
              <p>{t('abroadHelp')}</p>
              <div className="cta">
                <a className="btn ghost small" href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
                <a className="btn ghost small" href={`tel:${phone}`}>
                  {formatPhone(phone)}
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
      )}
    </div>
  )
}
