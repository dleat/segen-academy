import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Profile } from '../lib/auth'
import { act, FEE_PERCENT, money, payout, type Editor, type Job, type JobPayment } from '../lib/jobs'
import { supabase } from '../lib/supabase'
import { useLoad } from '../lib/useLoad'
import { Receipt, when } from './Admin'

// Dleat's side of Segen Jobs: approve editors, approve job payments and
// keep track of what each editor is owed.

type Contact = Pick<Profile, 'full_name' | 'phone' | 'country'>
type EditorRow = Editor & { profile: Contact | null }

export function EditorsAdmin() {
  const list = useLoad(async () => {
    if (!supabase) return [] as EditorRow[]
    const { data, error } = await supabase
      .from('editors')
      .select('*, profile:profiles(full_name, phone, country)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data as EditorRow[]
  }, [])
  const [error, setError] = useState<string | null>(null)

  async function review(e: EditorRow, approve: boolean) {
    const note = approve
      ? window.confirm(`Approve ${e.display_name}? They can then send offers on jobs.`) && ''
      : window.prompt('Why not approved? The editor will see this.', 'Please contact Dleat for the test')
    if (note === false || note === null) return
    setError(await act('review_editor', { p_user_id: e.user_id, p_approve: approve, p_note: note }))
    list.reload()
  }

  if (list.loading) return <p className="muted">Loading...</p>
  if (list.error) return <p className="error">{list.error}</p>
  if (!list.data?.length) return <p className="card">No editor applications yet. They apply on the Jobs page.</p>

  const order = { waiting: 0, approved: 1, rejected: 2 }
  const rows = [...list.data].sort((a, b) => order[a.status] - order[b.status])

  return (
    <div className="admin-list">
      <p className="muted">Approve an editor only after you have checked their Segen certificate and they passed your test.</p>
      {error && <p className="error">{error}</p>}
      {rows.map((e) => (
        <article className="card" key={e.user_id}>
          <div className="my-top">
            <h3 className="flush">{e.display_name}</h3>
            <span className={`pill ${e.status === 'waiting' ? 'waiting' : e.status === 'approved' ? 'approved' : 'rejected'}`}>{e.status}</span>
          </div>
          <div className="muted">
            {e.profile?.full_name} · {e.profile?.phone} · {e.profile?.country}
          </div>
          <dl className="pay-split">
            <dt>Courses finished</dt>
            <dd>{e.courses_done || '–'}</dd>
            <dt>Work</dt>
            <dd>
              {e.portfolio_link ? (
                <a className="gold-text" href={e.portfolio_link} target="_blank" rel="noreferrer">
                  {e.portfolio_link}
                </a>
              ) : (
                '–'
              )}
            </dd>
            {e.about && (
              <>
                <dt>About</dt>
                <dd className="pre">{e.about}</dd>
              </>
            )}
            <dt>Applied</dt>
            <dd>{when(e.created_at)}</dd>
          </dl>
          <div className="cta">
            {e.status !== 'approved' && (
              <button className="btn gold small" type="button" onClick={() => review(e, true)}>
                Approve
              </button>
            )}
            <button className="btn ghost small" type="button" onClick={() => review(e, false)}>
              {e.status === 'approved' ? 'Remove approval' : 'Not approved'}
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

type JobRow = Job & {
  client: Contact | null
  editor: (Pick<Editor, 'display_name'> & { profile: Pick<Profile, 'phone'> | null }) | null
}
type PaymentRow = JobPayment & { client: Contact | null; job: Pick<Job, 'id' | 'title' | 'price' | 'currency'> | null }

export function JobsAdmin() {
  const data = useLoad(async () => {
    if (!supabase) return { jobs: [] as JobRow[], payments: [] as PaymentRow[] }
    const [jobs, payments] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, client:profiles(full_name, phone, country), editor:editors(display_name, profile:profiles(phone))')
        .order('created_at', { ascending: false }),
      supabase
        .from('job_payments')
        .select('*, client:profiles(full_name, phone, country), job:jobs(id, title, price, currency)')
        .eq('status', 'waiting')
        .order('created_at'),
    ])
    if (jobs.error) throw jobs.error
    if (payments.error) throw payments.error
    return { jobs: jobs.data as JobRow[], payments: payments.data as PaymentRow[] }
  }, [])
  const [error, setError] = useState<string | null>(null)

  async function reviewPayment(p: PaymentRow, approve: boolean) {
    const reason = approve
      ? window.confirm(`Approve the payment for "${p.job?.title}"? The client can then download the video.`) && ''
      : window.prompt('Why is this receipt rejected? The client will see this.', 'Payment not received')
    if (reason === false || reason === null) return
    setError(await act('review_job_payment', { p_payment_id: p.id, p_approve: approve, p_reason: reason }))
    data.reload()
  }

  async function markPaid(j: JobRow, part: 'half' | 'rest', amount: string) {
    if (!window.confirm(`Did you send ${amount} to ${j.editor?.display_name}?`)) return
    setError(await act('mark_editor_paid', { p_job_id: j.id, p_part: part }))
    data.reload()
  }

  if (data.loading) return <p className="muted">Loading...</p>
  if (data.error || !data.data) return <p className="error">{data.error}</p>
  const { jobs, payments } = data.data

  const halfDue = jobs.filter((j) => j.paid_at && !j.editor_half_paid_at)
  const restDue = jobs.filter((j) => j.status === 'done' && !j.editor_rest_paid_at)

  return (
    <div className="admin-list">
      {error && <p className="error">{error}</p>}

      <h2 className="h3 flush">Job payments to approve</h2>
      {payments.length === 0 && <p className="muted">No job payments are waiting.</p>}
      {payments.map((p) => (
        <article className="card admin-item" key={p.id}>
          <Receipt path={p.receipt_path} />
          <div className="admin-body">
            <h3>{p.client?.full_name || 'No name'}</h3>
            <div className="muted">
              {p.client?.phone} · {p.client?.country}
            </div>
            <dl>
              <dt>Job</dt>
              <dd>
                <Link to={`/jobs/${p.job_id}`}>{p.job?.title}</Link>
              </dd>
              <dt>Price</dt>
              <dd>{p.job ? money(p.job.price, p.job.currency) : '–'}</dd>
              <dt>Paid by</dt>
              <dd>{p.method}</dd>
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
              <button className="btn gold" type="button" onClick={() => reviewPayment(p, true)}>
                Approve
              </button>
              <button className="btn ghost" type="button" onClick={() => reviewPayment(p, false)}>
                Reject
              </button>
            </div>
          </div>
        </article>
      ))}

      <h2 className="h3 flush">Pay editors</h2>
      {halfDue.length + restDue.length === 0 && <p className="muted">No editor payments are due.</p>}
      {[...halfDue.map((j) => [j, 'half'] as const), ...restDue.map((j) => [j, 'rest'] as const)].map(([j, part]) => {
        const p = payout(j.price ?? 0)
        const amount = money(part === 'half' ? p.half : p.rest, j.currency)
        return (
          <article className="card" key={`${j.id}-${part}`}>
            <div className="my-top">
              <h3 className="flush">
                <Link to={`/jobs/${j.id}`}>{j.title}</Link>
              </h3>
              <span className="amount">{amount}</span>
            </div>
            <p className="muted">
              {part === 'half' ? 'First half (client has paid)' : `Rest after the client accepted (you keep ${money(p.fee, j.currency)})`} to{' '}
              {j.editor?.display_name} · {j.editor?.profile?.phone}
            </p>
            <button className="btn gold small" type="button" onClick={() => markPaid(j, part, amount)}>
              I sent it
            </button>
          </article>
        )
      })}

      <h2 className="h3 flush">All jobs</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Client</th>
              <th>Editor</th>
              <th>Price</th>
              <th>Your {FEE_PERCENT}%</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id}>
                <td>
                  <Link to={`/jobs/${j.id}`}>{j.title}</Link>
                  <div className="muted small-print">{j.created_at.slice(0, 10)}</div>
                </td>
                <td>
                  {j.client?.full_name}
                  <div className="muted small-print">{j.client?.phone}</div>
                </td>
                <td>{j.editor?.display_name ?? '–'}</td>
                <td>{money(j.price, j.currency)}</td>
                <td>{j.price != null ? money(payout(j.price).fee, j.currency) : '–'}</td>
                <td>
                  {j.status}
                  {j.paid_at && <div className="muted small-print">client paid</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && <p className="muted">No jobs yet.</p>}
      </div>
    </div>
  )
}
