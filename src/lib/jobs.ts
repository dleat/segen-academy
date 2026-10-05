import { supabase } from './supabase'

// Segen keeps this share of each job; the editor gets the rest.
export const FEE_PERCENT = 15
export const FREE_CORRECTIONS = 3

export type Editor = {
  user_id: string
  display_name: string
  courses_done: string
  portfolio_link: string
  about: string
  status: 'waiting' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
}

export type Job = {
  id: string
  client_id: string
  title: string
  description: string
  budget: number | null
  currency: 'ETB' | 'USD'
  deadline: string | null
  status: 'open' | 'working' | 'review' | 'done' | 'cancelled'
  editor_id: string | null
  price: number | null
  corrections_used: number
  paid_at: string | null
  editor_half_paid_at: string | null
  editor_rest_paid_at: string | null
  done_at: string | null
  created_at: string
}

export type Offer = {
  id: string
  job_id: string
  editor_id: string
  price: number
  days: number
  message: string
  status: 'sent' | 'accepted' | 'declined'
  created_at: string
}

export type Delivery = {
  id: string
  job_id: string
  version: number
  preview_youtube_id: string
  note: string
  created_at: string
}

export type Correction = { id: string; job_id: string; round: number; request: string; created_at: string }

export type JobPayment = {
  id: string
  job_id: string
  client_id: string
  method: 'telebirr' | 'bank' | 'abroad'
  receipt_path: string | null
  note: string
  status: 'waiting' | 'approved' | 'rejected'
  reject_reason: string | null
  created_at: string
}

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data as T
}

export function money(amount: number | null, currency: Job['currency']) {
  if (amount == null) return '–'
  return currency === 'USD' ? `$${amount.toLocaleString('en-US')}` : `${amount.toLocaleString('en-US')} birr`
}

// What the editor is owed: half when the client pays, the rest (after the
// fee) when the client accepts the work.
export function payout(price: number) {
  const fee = Math.round((price * FEE_PERCENT) / 100)
  const half = Math.round(price / 2)
  return { fee, half, rest: price - fee - half, editorTotal: price - fee }
}

export async function loadMyEditor(): Promise<Editor | null> {
  if (!supabase) return null
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null
  return check(await supabase.from('editors').select('*').eq('user_id', auth.user.id).maybeSingle()) as Editor | null
}

export async function loadOpenJobs(): Promise<Job[]> {
  if (!supabase) return []
  return check(
    await supabase.from('jobs').select('*').eq('status', 'open').order('created_at', { ascending: false }),
  ) as Job[]
}

export type JobDetail = {
  job: Job
  footage: string | null
  offers: (Offer & { editor: Pick<Editor, 'display_name' | 'portfolio_link' | 'about' | 'courses_done'> | null })[]
  deliveries: (Delivery & { final_link: string | null })[]
  corrections: Correction[]
  payments: JobPayment[]
  editorName: string | null
}

// Everything about one job that the database lets this person see.
export async function loadJob(id: string): Promise<JobDetail | null> {
  if (!supabase) return null
  const job = check(await supabase.from('jobs').select('*').eq('id', id).maybeSingle()) as Job | null
  if (!job) return null
  const [footage, offers, deliveries, files, corrections, payments, editor] = await Promise.all([
    supabase.from('job_footage').select('link').eq('job_id', id).maybeSingle(),
    supabase
      .from('job_offers')
      .select('*, editor:editors(display_name, portfolio_link, about, courses_done)')
      .eq('job_id', id)
      .order('price'),
    supabase.from('job_deliveries').select('*').eq('job_id', id).order('version', { ascending: false }),
    supabase.from('delivery_files').select('delivery_id, final_link, job_deliveries!inner(job_id)').eq('job_deliveries.job_id', id),
    supabase.from('job_corrections').select('*').eq('job_id', id).order('round'),
    supabase.from('job_payments').select('*').eq('job_id', id).order('created_at', { ascending: false }),
    job.editor_id
      ? supabase.from('editors').select('display_name').eq('user_id', job.editor_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])
  const links = Object.fromEntries(
    (check(files) as { delivery_id: string; final_link: string }[]).map((f) => [f.delivery_id, f.final_link]),
  )
  return {
    job,
    footage: (check(footage) as { link: string } | null)?.link ?? null,
    offers: check(offers) as JobDetail['offers'],
    deliveries: (check(deliveries) as Delivery[]).map((d) => ({ ...d, final_link: links[d.id] ?? null })),
    corrections: check(corrections) as Correction[],
    payments: check(payments) as JobPayment[],
    editorName: (check(editor) as { display_name: string } | null)?.display_name ?? null,
  }
}

export type MyJobs = { posted: Job[]; editing: Job[]; offers: (Offer & { job: Pick<Job, 'id' | 'title' | 'status'> | null })[] }

export async function loadMyJobs(): Promise<MyJobs> {
  if (!supabase) return { posted: [], editing: [], offers: [] }
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return { posted: [], editing: [], offers: [] }
  const [posted, editing, offers] = await Promise.all([
    supabase.from('jobs').select('*').eq('client_id', uid).order('created_at', { ascending: false }),
    supabase.from('jobs').select('*').eq('editor_id', uid).order('created_at', { ascending: false }),
    supabase
      .from('job_offers')
      .select('*, job:jobs(id, title, status)')
      .eq('editor_id', uid)
      .eq('status', 'sent')
      .order('created_at', { ascending: false }),
  ])
  return {
    posted: check(posted) as Job[],
    editing: check(editing) as Job[],
    offers: check(offers) as MyJobs['offers'],
  }
}

// Runs one of the database actions and turns its error into a message.
export async function act(fn: string, args: Record<string, unknown>): Promise<string | null> {
  if (!supabase) return 'Not connected'
  const { error } = await supabase.rpc(fn, args)
  return error?.message ?? null
}
