import { supabase } from './supabase'

export type Course = {
  id: string
  badge: string
  title_en: string
  title_ti: string
  summary_en: string
  summary_ti: string
  description_en: string
  description_ti: string
  access_days: number
  sort_order: number
}

export type Offer = {
  id: string
  title_en: string
  title_ti: string
  price_usd: number
  sort_order: number
  course_ids: string[]
}

export type Lesson = {
  id: string
  course_id: string
  day: number
  title_en: string
  title_ti: string
}

export type Purchase = {
  id: string
  user_id: string
  offer_id: string
  method: 'telebirr' | 'bank' | 'abroad'
  receipt_path: string | null
  note: string
  status: 'waiting' | 'approved' | 'rejected'
  reject_reason: string | null
  starts_at: string | null
  ends_at: string | null
  created_at: string
}

export type Settings = {
  contact_phone: string
  telebirr_number: string
  telebirr_name: string
  bank_details: string
  price_note_en: string
  price_note_ti: string
}

export type Catalogue = { courses: Course[]; offers: Offer[] }

// Used only while the site is not yet connected to Supabase, so the public
// pages can be previewed. Keep in step with supabase/migrations/*_catalogue.sql.
const previewCatalogue: Catalogue = {
  courses: [
    {
      id: 'premiere-pro', badge: 'Pr', title_en: 'Adobe Premiere Pro', title_ti: 'ኣዶቤ ፕሪሚየር ፕሮ',
      summary_en: 'Cut, trim and build a full edit, add titles and music, then export for YouTube and social media.',
      summary_ti: 'ቪድዮ ቁረጽ፡ ኣዳልው፡ ጽሑፍን ሙዚቃን ወስኽ፡ ንዩቱብን ማሕበራዊ ሚድያን ኣውጽእ።',
      description_en: 'Learn Premiere Pro the way it is taught in class at Segen Editing Academy. You start with importing footage and the timeline, then move on to cutting, transitions, titles, music and sound, colour, and exporting for YouTube, TikTok and Instagram. One new lesson opens every day for one month.',
      description_ti: 'ፕሪሚየር ፕሮ ልክዕ ከምቲ ኣብ ሰገን ኤዲቲንግ ኣካዳሚ ዝምሃር ተማሃር። ካብ ፉተጅ ምእታውን ታይምላይንን ጀሚርካ፡ ምቑራጽ፡ ትራንዚሽን፡ ጽሑፍ፡ ሙዚቃን ድምጽን፡ ሕብሪ፡ ከምኡ ድማ ንዩቱብ፡ ቲክቶክን ኢንስታግራምን ምውጻእ ትምሃር። ን ሓደ ወርሒ መዓልቲ መዓልቲ ሓድሽ ትምህርቲ ይኽፈት።',
      access_days: 30, sort_order: 1,
    },
    {
      id: 'davinci-resolve', badge: 'Dv', title_en: 'DaVinci Resolve', title_ti: 'ዳቪንቺ ሪዞልቭ',
      summary_en: 'Edit on the cut page, colour grade your footage and clean up sound, all in free software.',
      summary_ti: 'ቪድዮ ኣርትዕ፡ ሕብሪ ኣመሓይሽ፡ ድምጺ ኣጽሪ፡ ብነጻ ሶፍትዌር።',
      description_en: 'DaVinci Resolve is free and used on real films. This course covers the cut and edit pages, colour grading, Fairlight sound and delivering your finished video. One new lesson opens every day for one month.',
      description_ti: 'ዳቪንቺ ሪዞልቭ ነጻ እዩ፡ ኣብ ሓቀኛ ፊልምታት ድማ ይጥቀሙሉ። እዚ ኮርስ ናይ ምቑራጽን ምርታዕን ገጻት፡ ሕብሪ ምምሕያሽ፡ ድምጺ ከምኡ ድማ ዝተወደአ ቪድዮ ምውጻእ ይሸፍን። ን ሓደ ወርሒ መዓልቲ መዓልቲ ሓድሽ ትምህርቲ ይኽፈት።',
      access_days: 30, sort_order: 2,
    },
    {
      id: 'photoshop', badge: 'Ps', title_en: 'Adobe Photoshop', title_ti: 'ኣዶቤ ፎቶሾፕ',
      summary_en: 'Design thumbnails, posters and social posts, and retouch photos with layers and masks.',
      summary_ti: 'ታምብኔይል፡ ፖስተርን ፖስትን ስራሕ፡ ስእልታት ብሌየርን ማስክን ኣመሓይሽ።',
      description_en: 'Photoshop for video editors and designers: layers, selections and masks, retouching, text and effects, and designing thumbnails and posters that get clicks. One new lesson opens every day for one month.',
      description_ti: 'ፎቶሾፕ ንቪድዮ ኤዲተራትን ዲዛይነራትን፦ ሌየር፡ ምምራጽን ማስክን፡ ስእሊ ምምሕያሽ፡ ጽሑፍን ኢፌክትን፡ ከምኡ ድማ ዝስሕቡ ታምብኔይላትን ፖስተራትን ምድላው። ን ሓደ ወርሒ መዓልቲ መዓልቲ ሓድሽ ትምህርቲ ይኽፈት።',
      access_days: 30, sort_order: 3,
    },
  ],
  offers: [
    { id: 'premiere-pro', title_en: 'Adobe Premiere Pro', title_ti: 'ኣዶቤ ፕሪሚየር ፕሮ', price_usd: 100, sort_order: 1, course_ids: ['premiere-pro'] },
    { id: 'davinci-resolve', title_en: 'DaVinci Resolve', title_ti: 'ዳቪንቺ ሪዞልቭ', price_usd: 100, sort_order: 2, course_ids: ['davinci-resolve'] },
    { id: 'photoshop', title_en: 'Adobe Photoshop', title_ti: 'ኣዶቤ ፎቶሾፕ', price_usd: 100, sort_order: 3, course_ids: ['photoshop'] },
    { id: 'premiere-photoshop', title_en: 'Premiere Pro + Photoshop', title_ti: 'ፕሪሚየር ፕሮ + ፎቶሾፕ', price_usd: 150, sort_order: 4, course_ids: ['premiere-pro', 'photoshop'] },
  ],
}

export const defaultSettings: Settings = {
  contact_phone: '+251979298765',
  telebirr_number: '',
  telebirr_name: '',
  bank_details: '',
  price_note_en: '',
  price_note_ti: '',
}

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data as T
}

export async function loadCatalogue(): Promise<Catalogue> {
  if (!supabase) return previewCatalogue
  const [courses, offers, links] = await Promise.all([
    supabase.from('courses').select('*').order('sort_order'),
    supabase.from('offers').select('*').order('sort_order'),
    supabase.from('offer_courses').select('offer_id, course_id'),
  ])
  const linkRows = check(links) as { offer_id: string; course_id: string }[]
  return {
    courses: check(courses) as Course[],
    offers: (check(offers) as Omit<Offer, 'course_ids'>[]).map((o) => ({
      ...o,
      course_ids: linkRows.filter((l) => l.offer_id === o.id).map((l) => l.course_id),
    })),
  }
}

export async function loadSettings(): Promise<Settings> {
  if (!supabase) return defaultSettings
  const { data } = await supabase.from('site_settings').select('*').maybeSingle()
  return { ...defaultSettings, ...(data ?? {}) }
}

export async function loadLessons(courseId: string): Promise<Lesson[]> {
  if (!supabase) return []
  return check(
    await supabase.from('lessons').select('*').eq('course_id', courseId).order('day'),
  ) as Lesson[]
}

export async function loadMyPurchases(): Promise<Purchase[]> {
  if (!supabase) return []
  return check(
    await supabase.from('purchases').select('*').order('created_at', { ascending: false }),
  ) as Purchase[]
}

export type Access = { purchase_id: string; starts_at: string; ends_at: string; unlocked_day: number }

export async function loadAccess(courseId: string): Promise<Access | null> {
  if (!supabase) return null
  const rows = check(await supabase.rpc('course_access', { p_course_id: courseId })) as Access[]
  return rows[0] ?? null
}

// Returns only the videos the database lets this student see.
export async function loadVideos(courseId: string): Promise<Record<string, string>> {
  if (!supabase) return {}
  const rows = check(
    await supabase
      .from('lesson_videos')
      .select('lesson_id, youtube_id, lessons!inner(course_id)')
      .eq('lessons.course_id', courseId),
  ) as { lesson_id: string; youtube_id: string }[]
  return Object.fromEntries(rows.map((r) => [r.lesson_id, r.youtube_id]))
}

// Accepts any common YouTube link (or a bare id) and returns the video id.
export function parseYouTubeId(input: string): string | null {
  const text = input.trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text
  try {
    const url = new URL(text)
    const host = url.hostname.replace(/^www\.|^m\./, '')
    if (host === 'youtu.be') return valid(url.pathname.slice(1))
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v')
      if (v) return valid(v)
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)
      if (m) return valid(m[1])
    }
  } catch {
    // not a URL
  }
  return null
}

function valid(id: string): string | null {
  return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null
}

export function daysLeft(endsAt: string): number {
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000))
}
