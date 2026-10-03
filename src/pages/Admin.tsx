import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Profile } from '../lib/auth'
import {
  daysLeft,
  loadCatalogue,
  loadSettings,
  parseYouTubeId,
  type Catalogue,
  type Lesson,
  type Purchase,
  type Settings,
} from '../lib/data'
import { supabase } from '../lib/supabase'
import { useLoad } from '../lib/useLoad'

// Dleat's private area. Kept in English only.

type Row = Purchase & { profile: Pick<Profile, 'full_name' | 'phone' | 'country'> | null }

const TABS = [
  ['payments', 'Payments to approve'],
  ['students', 'Students'],
  ['lessons', 'Lessons'],
  ['settings', 'Payment details'],
] as const

type Tab = (typeof TABS)[number][0]

async function loadPurchases(status: Purchase['status'][]): Promise<Row[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('purchases')
    .select('*, profile:profiles(full_name, phone, country)')
    .in('status', status)
    .order('created_at', { ascending: status.includes('waiting') })
  if (error) throw error
  return data as Row[]
}

export default function Admin() {
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find(([id]) => id === params.get('tab'))?.[0] ?? 'payments') as Tab
  const catalogue = useLoad(loadCatalogue, [])

  return (
    <div className="wrap page">
      <h1 className="page-title">Admin</h1>
      <div className="tabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setParams({ tab: id })}
          >
            {label}
          </button>
        ))}
      </div>
      {catalogue.error && <p className="error">{catalogue.error}</p>}
      {catalogue.data && (
        <>
          {tab === 'payments' && <Payments catalogue={catalogue.data} />}
          {tab === 'students' && <Students catalogue={catalogue.data} />}
          {tab === 'lessons' && <Lessons catalogue={catalogue.data} />}
          {tab === 'settings' && <SettingsForm />}
        </>
      )}
    </div>
  )
}

function offerTitle(catalogue: Catalogue, id: string) {
  return catalogue.offers.find((o) => o.id === id)?.title_en ?? id
}

const METHOD: Record<Purchase['method'], string> = { telebirr: 'Telebirr', bank: 'Bank transfer', abroad: 'Outside Ethiopia' }

function when(s: string) {
  return new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function Payments({ catalogue }: { catalogue: Catalogue }) {
  const list = useLoad(() => loadPurchases(['waiting']), [])
  const [error, setError] = useState<string | null>(null)

  async function act(fn: 'approve_purchase' | 'reject_purchase', p: Row) {
    if (!supabase) return
    let args: Record<string, unknown> = { p_purchase_id: p.id }
    if (fn === 'reject_purchase') {
      const reason = window.prompt('Why is this receipt rejected? The student will see this.', 'Payment not received')
      if (reason === null) return
      args = { ...args, p_reason: reason }
    } else if (!window.confirm(`Approve ${p.profile?.full_name || 'this student'} for ${offerTitle(catalogue, p.offer_id)}? Their month starts today.`)) {
      return
    }
    const { error } = await supabase.rpc(fn, args)
    setError(error?.message ?? null)
    list.reload()
  }

  if (list.loading) return <p className="muted">Loading...</p>
  if (list.error) return <p className="error">{list.error}</p>
  if (!list.data?.length) return <p className="card">No payments are waiting. New receipts appear here.</p>

  return (
    <div className="admin-list">
      {error && <p className="error">{error}</p>}
      {list.data.map((p) => (
        <article className="card admin-item" key={p.id}>
          <Receipt path={p.receipt_path} />
          <div className="admin-body">
            <h3>{p.profile?.full_name || 'No name'}</h3>
            <div className="muted">
              {p.profile?.phone} · {p.profile?.country}
            </div>
            <dl>
              <dt>Course</dt>
              <dd>
                {offerTitle(catalogue, p.offer_id)} · ${catalogue.offers.find((o) => o.id === p.offer_id)?.price_usd}
              </dd>
              <dt>Paid by</dt>
              <dd>{METHOD[p.method]}</dd>
              <dt>Sent</dt>
              <dd>{when(p.created_at)}</dd>
              {p.note && (
                <>
                  <dt>Message</dt>
                  <dd>{p.note}</dd>
                </>
              )}
            </dl>
            <div className="cta">
              <button className="btn gold" type="button" onClick={() => act('approve_purchase', p)}>
                Approve
              </button>
              <button className="btn ghost" type="button" onClick={() => act('reject_purchase', p)}>
                Reject
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

// Receipts are private, so each one is shown through a short-lived link.
function Receipt({ path }: { path: string | null }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!supabase || !path) return
    supabase.storage
      .from('receipts')
      .createSignedUrl(path, 3600)
      .then(({ data }) => setUrl(data?.signedUrl ?? null))
  }, [path])

  if (!path) return <div className="receipt empty">No receipt (outside Ethiopia)</div>
  if (!url) return <div className="receipt empty">Loading receipt...</div>
  if (path.endsWith('.pdf')) {
    return (
      <a className="receipt empty" href={url} target="_blank" rel="noreferrer">
        Open PDF receipt
      </a>
    )
  }
  return (
    <a className="receipt" href={url} target="_blank" rel="noreferrer" title="Open full size">
      <img src={url} alt="Payment receipt" />
    </a>
  )
}

function Students({ catalogue }: { catalogue: Catalogue }) {
  const list = useLoad(() => loadPurchases(['approved', 'rejected']), [])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function extend(p: Row) {
    if (!supabase) return
    const answer = window.prompt(`Give ${p.profile?.full_name || 'this student'} how many extra days?`, '7')
    if (!answer) return
    const { error } = await supabase.rpc('extend_purchase', { p_purchase_id: p.id, p_days: Number(answer) })
    setError(error?.message ?? null)
    list.reload()
  }

  if (list.loading) return <p className="muted">Loading...</p>
  if (list.error) return <p className="error">{list.error}</p>

  const q = query.trim().toLowerCase()
  const rows = (list.data ?? []).filter(
    (p) => !q || `${p.profile?.full_name} ${p.profile?.phone}`.toLowerCase().includes(q),
  )

  return (
    <>
      <input className="search" type="search" placeholder="Search by name or phone" value={query} onChange={(e) => setQuery(e.target.value)} />
      {error && <p className="error">{error}</p>}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Status</th>
              <th>Days left</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const left = p.ends_at ? daysLeft(p.ends_at) : 0
              return (
                <tr key={p.id}>
                  <td>
                    {p.profile?.full_name}
                    <div className="muted small-print">{p.profile?.phone}</div>
                  </td>
                  <td>{offerTitle(catalogue, p.offer_id)}</td>
                  <td>
                    {p.status === 'rejected' ? (
                      <span className="pill rejected" title={p.reject_reason ?? ''}>
                        Rejected
                      </span>
                    ) : left > 0 ? (
                      <span className="pill approved">Active</span>
                    ) : (
                      <span className="pill ended">Ended</span>
                    )}
                  </td>
                  <td>{p.status === 'approved' ? left : '–'}</td>
                  <td>
                    {p.status === 'approved' && (
                      <button className="btn ghost small" type="button" onClick={() => extend(p)}>
                        Extra days
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="muted">No students yet.</p>}
      </div>
    </>
  )
}

type LessonRow = Lesson & { lesson_videos: { youtube_id: string } | null }

function Lessons({ catalogue }: { catalogue: Catalogue }) {
  const [courseId, setCourseId] = useState(catalogue.courses[0]?.id ?? '')
  const list = useLoad(async () => {
    if (!supabase || !courseId) return [] as LessonRow[]
    const { data, error } = await supabase
      .from('lessons')
      .select('*, lesson_videos(youtube_id)')
      .eq('course_id', courseId)
      .order('day')
    if (error) throw error
    return data as LessonRow[]
  }, [courseId])

  const nextDay = (list.data?.reduce((m, l) => Math.max(m, l.day), 0) ?? 0) + 1

  return (
    <>
      <label className="inline">
        Course{' '}
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {catalogue.courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title_en}
            </option>
          ))}
        </select>
      </label>
      <p className="muted">
        Add one lesson per day. Paste the YouTube link of an unlisted video. Students never see the link itself.{' '}
        <Link to={`/learn/${courseId}`}>Preview the course</Link>
      </p>
      {list.loading && <p className="muted">Loading...</p>}
      {list.error && <p className="error">{list.error}</p>}
      <div className="admin-list">
        {list.data?.map((l) => (
          <LessonEditor key={l.id} courseId={courseId} lesson={l} onSaved={list.reload} />
        ))}
        {!list.loading && <LessonEditor key={`new-${nextDay}`} courseId={courseId} day={nextDay} onSaved={list.reload} />}
      </div>
    </>
  )
}

function LessonEditor({
  courseId,
  lesson,
  day,
  onSaved,
}: {
  courseId: string
  lesson?: LessonRow
  day?: number
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    day: String(lesson?.day ?? day ?? 1),
    title_en: lesson?.title_en ?? '',
    title_ti: lesson?.title_ti ?? '',
    link: lesson?.lesson_videos?.youtube_id ? `https://youtu.be/${lesson.lesson_videos.youtube_id}` : '',
  })
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setError(null)
    const youtubeId = form.link.trim() ? parseYouTubeId(form.link) : null
    if (form.link.trim() && !youtubeId) {
      setError('That does not look like a YouTube link.')
      return
    }
    const values = { course_id: courseId, day: Number(form.day), title_en: form.title_en.trim(), title_ti: form.title_ti.trim() }
    const res = lesson
      ? await supabase.from('lessons').update(values).eq('id', lesson.id).select().single()
      : await supabase.from('lessons').insert(values).select().single()
    if (res.error) {
      setError(res.error.message)
      return
    }
    const lessonId = (res.data as Lesson).id
    const vid = youtubeId
      ? await supabase.from('lesson_videos').upsert({ lesson_id: lessonId, youtube_id: youtubeId })
      : await supabase.from('lesson_videos').delete().eq('lesson_id', lessonId)
    if (vid.error) {
      setError(vid.error.message)
      return
    }
    setStatus('Saved')
    onSaved()
  }

  async function remove() {
    if (!supabase || !lesson) return
    if (!window.confirm(`Delete day ${lesson.day}: ${lesson.title_en}?`)) return
    const { error } = await supabase.from('lessons').delete().eq('id', lesson.id)
    if (error) setError(error.message)
    else onSaved()
  }

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setStatus(null)
    setForm({ ...form, [k]: e.target.value })
  }

  return (
    <form className={`card lesson-editor${lesson ? '' : ' new'}`} onSubmit={save}>
      <label className="day-field">
        Day
        <input type="number" min={1} required value={form.day} onChange={set('day')} />
      </label>
      <label>
        Title (English)
        <input required value={form.title_en} onChange={set('title_en')} />
      </label>
      <label>
        Title (Tigrinya)
        <input value={form.title_ti} onChange={set('title_ti')} />
      </label>
      <label className="wide">
        YouTube link
        <input placeholder="https://youtu.be/..." value={form.link} onChange={set('link')} />
      </label>
      <div className="cta">
        <button className="btn gold small" type="submit">
          {lesson ? 'Save' : 'Add lesson'}
        </button>
        {lesson && (
          <button className="btn ghost small" type="button" onClick={remove}>
            Delete
          </button>
        )}
        {status && <span className="muted">{status}</span>}
        {error && <span className="error">{error}</span>}
      </div>
    </form>
  )
}

function SettingsForm() {
  const loaded = useLoad(loadSettings, [])
  if (loaded.error) return <p className="error">{loaded.error}</p>
  if (!loaded.data) return <p className="muted">Loading...</p>
  return <SettingsEditor initial={loaded.data} />
}

function SettingsEditor({ initial }: { initial: Settings }) {
  const [form, setForm] = useState<Settings>(initial)
  const [status, setStatus] = useState<string | null>(null)

  const set = (k: keyof Settings) => (e: { target: { value: string } }) => {
    setStatus(null)
    setForm({ ...form, [k]: e.target.value })
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    const { error } = await supabase.from('site_settings').update(form).eq('id', true)
    setStatus(error ? error.message : 'Saved')
  }

  return (
    <form className="card form" onSubmit={save}>
      <p className="muted">Students see these details on the payment page after they choose a course.</p>
      <label>
        Telebirr number
        <input value={form.telebirr_number} onChange={set('telebirr_number')} />
      </label>
      <label>
        Name on the Telebirr account
        <input value={form.telebirr_name} onChange={set('telebirr_name')} />
      </label>
      <label>
        Bank accounts (bank name, account name and number, one per line)
        <textarea rows={4} value={form.bank_details} onChange={set('bank_details')} />
      </label>
      <label>
        Price note in English (for example the price in birr)
        <input value={form.price_note_en} onChange={set('price_note_en')} />
      </label>
      <label>
        Price note in Tigrinya
        <input value={form.price_note_ti} onChange={set('price_note_ti')} />
      </label>
      <label>
        Contact phone for students abroad
        <input value={form.contact_phone} onChange={set('contact_phone')} />
      </label>
      <div className="cta">
        <button className="btn gold" type="submit">
          Save
        </button>
        {status && <span className="muted">{status}</span>}
      </div>
    </form>
  )
}
