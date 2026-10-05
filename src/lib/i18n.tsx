import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { jobsEn, jobsTi } from './jobsText'

export type Lang = 'en' | 'ti'

// Tigrinya text is a first draft for Dleat to correct.
const en = {
  navCourses: 'Courses', navHow: 'How it works', navPay: 'Payment', navMy: 'My courses', navAdmin: 'Admin',
  login: 'Log in', logout: 'Log out', signup: 'Sign up',
  notConnected: 'Preview mode: the site is not connected to its database yet, so logging in and buying are turned off.',

  eyebrow: 'Online video editing courses',
  h1a: 'Learn to edit like a pro,', h1b: 'one lesson a day.',
  lede: 'The same classes taught in person at Segen Editing Academy, now recorded for students in every city and country. Buy only the course you want and finish it in one month.',
  ctaCourses: 'See the courses', ctaHow: 'How it works',
  tlName: 'your 30-day timeline', tlDay: 'Day', tlNext: 'next lesson opens tomorrow',
  kOpen: 'Unlocked, watch again any time', kLock: 'Opens one per day', kTest: 'Final test and project',

  cEyebrow: 'Courses', cTitle: 'Start with the tools editors use every day',
  cSub: 'Each course runs for one month. You can buy one, or several at once.',
  month: '1 month', daily: '1 lesson / day', buy: 'Buy course', details: 'See details',
  bEyebrow: 'Bundle offer', bP: 'Edit your videos and design their thumbnails. Both courses for one price.',
  bSave: 'Save $50', bBuy: 'Buy the bundle',

  hEyebrow: 'How it works', hTitle: 'From your first lesson to your certificate',
  hSub: 'A steady pace works better than watching everything in one night, so each course opens one lesson at a time.',
  s1t: 'Choose a course', s1p: 'Create a free account and pick the course you want.',
  s2t: 'Pay and send the receipt', s2p: 'Pay by Telebirr or bank, upload a screenshot, and your course opens once it is approved.',
  s3t: 'Watch one lesson a day', s3p: 'A new video opens every day for one month. Rewatch earlier lessons whenever you like.',
  s4t: 'Pass the test, get certified', s4p: 'Take the quiz, send your edited project, and receive a certificate with your name.',

  pEyebrow: 'Payment', pTitle: 'Pay the way that works for you',
  pSub: 'No card needed. Dleat checks every payment by hand.',
  tele: "Send the course price to the academy's Telebirr number, then upload your screenshot.",
  soon: 'Number shown after you choose a course',
  bankT: 'Bank transfer', bank: "Transfer to the academy's bank account and upload a photo of the receipt.",
  soon2: 'Account shown after you choose a course',
  abroadT: 'Outside Ethiopia?', abroad: 'Contact Dleat and you will agree on a way to pay together.',
  copy: 'Copy number', copied: 'Copied',

  aEyebrow: 'About the academy', aTitle: 'Taught by Dleat, from a real classroom',
  aP1: 'Segen Editing Academy has trained editors in person in Ethiopia. These online courses bring the same lessons to students who cannot come to class.',
  aP2: 'Every receipt and every final project is reviewed by Dleat personally.',

  allCourses: 'All courses', lessonsTitle: 'Lessons', lessonsSoon: 'The lesson list will appear here soon.',
  dayN: 'Day', includedIn: 'Buy this course', youOwn: 'You have this course', goToLessons: 'Go to lessons',
  waitingApproval: 'Your payment is waiting for approval.',

  // auth
  email: 'Email', password: 'Password', fullName: 'Full name (as it should appear on your certificate)',
  phone: 'Phone number', country: 'Country', createAccount: 'Create account', haveAccount: 'Already have an account?',
  noAccount: 'New here?', forgot: 'Forgot your password?', sendReset: 'Send reset link',
  resetSent: 'If that email has an account, a reset link is on its way. Check your inbox.',
  newPassword: 'New password', savePassword: 'Save password', passwordSaved: 'Password saved. You are logged in.',
  checkEmail: 'Account created. Check your email to confirm it, then log in.',
  loginTitle: 'Log in', signupTitle: 'Create your account', resetTitle: 'Reset your password',
  loginNeeded: 'Log in or create an account to continue.',

  // buy
  buyTitle: 'Buy', price: 'Price', howPay: 'How will you pay?',
  telebirr: 'Telebirr', bankShort: 'Bank transfer', abroadShort: 'Outside Ethiopia',
  sendTo: 'Send the payment to', accountName: 'Name', detailsComing: 'Dleat will add these details soon. Contact Dleat for now.',
  receipt: 'Receipt screenshot or photo', receiptHelp: 'JPG, PNG or PDF, up to 5 MB.', optional: 'optional',
  noteLabel: 'Message for Dleat (optional)', notePlaceholder: 'For example the name on the payment or the transaction number',
  abroadHelp: 'Contact Dleat first to agree how to pay. When you have paid, send this form so Dleat can open your course.',
  submit: 'Send for approval', sending: 'Sending...', chooseFile: 'Please choose your receipt picture.',
  sent: 'Thank you. Dleat will check your payment and open your course. You can follow it on My courses.',
  callDleat: 'Call or message Dleat',

  // my courses
  myTitle: 'My courses', myEmpty: 'You have not bought a course yet.', browse: 'Browse courses',
  status_waiting: 'Waiting for approval', status_approved: 'Approved', status_rejected: 'Not approved',
  daysLeftN: 'days left', ended: 'Access ended', todayLesson: "Today's lesson", openCourse: 'Open course',
  rejectedReason: 'Reason', tryAgain: 'Send a new receipt', sentOn: 'Sent',

  // learn
  locked: 'Locked', opensIn: 'Opens in', opensTomorrow: 'Opens tomorrow', days: 'days', today: 'Today',
  noAccess: 'This course is not open for you. Buy it, or wait for your payment to be approved.',
  courseEnded: 'Your month for this course has ended.',
  noVideo: 'This lesson has no video yet.', dayOf: 'of',

  // misc
  loading: 'Loading...', error: 'Something went wrong', loadFailed: 'The courses could not be loaded. Please refresh the page, or contact Dleat if this keeps happening.', notFound: 'Page not found', home: 'Home', save: 'Save', saved: 'Saved',
  contact: 'Contact', footerRights: 'Segen Editing Academy',

  ...jobsEn,
}

type Dict = typeof en

const ti: Partial<Dict> = {
  navCourses: 'ኮርሳት', navHow: 'ብኸመይ ይሰርሕ', navPay: 'ክፍሊት', navMy: 'ኮርሳተይ', navAdmin: 'ኣመሓዳሪ',
  login: 'እቶ', logout: 'ውጻእ', signup: 'ተመዝገብ',
  notConnected: 'ናይ ምርኣይ ኩነታት፦ እቲ ወብሳይት ገና ምስ ዳታቤዙ ኣይተራኸበን፡ ስለዚ ምእታውን ምግዛእን ዕጹው እዩ።',
  eyebrow: 'ናይ ቪድዮ ኤዲቲንግ ኮርሳት ብኦንላይን',
  h1a: 'ቪድዮ ኤዲቲንግ ተማሃር፡', h1b: 'መዓልቲ መዓልቲ ሓደ ትምህርቲ።',
  lede: 'ኣብ ሰገን ኤዲቲንግ ኣካዳሚ ብኣካል ዝወሃብ ትምህርቲ፡ ሕጂ ንኹሉ ከተማን ሃገርን ተቐሪጹ ቀሪቡ ኣሎ። ዝደለኻዮ ኮርስ ጥራይ ግዛእ፡ ኣብ ሓደ ወርሒ ወድኦ።',
  ctaCourses: 'ኮርሳት ርአ', ctaHow: 'ብኸመይ ይሰርሕ',
  tlName: 'ናይ 30 መዓልቲ መደብካ', tlDay: 'መዓልቲ', tlNext: 'ዝቕጽል ትምህርቲ ጽባሕ ይኽፈት',
  kOpen: 'ዝተኸፍተ፡ ደጊምካ ክትርእዮ ትኽእል', kLock: 'መዓልቲ መዓልቲ ሓደ ይኽፈት', kTest: 'መወዳእታ ፈተናን ፕሮጀክትን',
  cEyebrow: 'ኮርሳት', cTitle: 'ኤዲተራት መዓልቲ መዓልቲ ብዝጥቀሙሉ መሳርሒታት ጀምር',
  cSub: 'ነፍሲ ወከፍ ኮርስ ሓደ ወርሒ ይጸንሕ። ሓደ ወይ ልዕሊኡ ክትገዝእ ትኽእል።',
  month: '1 ወርሒ', daily: '1 ትምህርቲ / መዓልቲ', buy: 'ኮርስ ግዛእ', details: 'ዝርዝር ርአ',
  bEyebrow: 'ናይ ሓባር ዋጋ', bP: 'ቪድዮታትካ ኣርትዕ፡ ታምብኔይል ስራሕ። ክልቲኦም ኮርሳት ብሓደ ዋጋ።', bSave: '$50 ትቑጥብ', bBuy: 'ክልቲኦም ግዛእ',
  hEyebrow: 'ብኸመይ ይሰርሕ', hTitle: 'ካብ ቀዳማይ ትምህርቲ ክሳብ ሰርቲፊኬት',
  hSub: 'ብሓደ ለይቲ ኩሉ ካብ ምርኣይ፡ ቀስ ኢልካ ምምሃር ይሓይሽ። ስለዚ ኮርስ መዓልቲ መዓልቲ ሓደ ትምህርቲ ይኽፈት።',
  s1t: 'ኮርስ ምረጽ', s1p: 'ነጻ ኣካውንት ክፈት፡ ዝደለኻዮ ኮርስ ምረጽ።',
  s2t: 'ክፈል፡ ቅብሊት ስደድ', s2p: 'ብቴሌብር ወይ ባንኪ ክፈል፡ ስክሪንሾት ስደድ፡ ምስ ተቐበልና ኮርስካ ይኽፈት።',
  s3t: 'መዓልቲ መዓልቲ ሓደ ትምህርቲ ርአ', s3p: 'ን ሓደ ወርሒ መዓልቲ መዓልቲ ሓድሽ ቪድዮ ይኽፈት። ዝሓለፈ ደጊምካ ክትርእዮ ትኽእል።',
  s4t: 'ፈተና ሕለፍ፡ ሰርቲፊኬት ውሰድ', s4p: 'ፈተና ውሰድ፡ ዝሰራሕካዮ ፕሮጀክት ስደድ፡ ብስምካ ሰርቲፊኬት ተቐበል።',
  pEyebrow: 'ክፍሊት', pTitle: 'ብዝምቾኣካ መንገዲ ክፈል', pSub: 'ካርድ ኣየድልን። ነፍሲ ወከፍ ክፍሊት ብኢድ ይረጋገጽ።',
  tele: 'ዋጋ ኮርስ ናብ ቁጽሪ ቴሌብር ኣካዳሚ ስደድ፡ ድሕሪኡ ስክሪንሾት ስደድ።', soon: 'ቁጽሪ ኮርስ ምስ መረጽካ ይርአ',
  bankT: 'ብባንኪ', bank: 'ናብ ሕሳብ ባንኪ ኣካዳሚ ኣሕልፍ፡ ስእሊ ቅብሊት ስደድ።', soon2: 'ሕሳብ ኮርስ ምስ መረጽካ ይርአ',
  abroadT: 'ካብ ኢትዮጵያ ወጻኢ ዲኻ?', abroad: 'ን ድለት ርኸቦ፡ ብኸመይ ከም እትኸፍል ብሓባር ክትሰማምዑ ኢኹም።',
  copy: 'ቁጽሪ ቅዳሕ', copied: 'ተቐዲሑ',
  aEyebrow: 'ብዛዕባ ኣካዳሚ', aTitle: 'ብድለት ዝወሃብ፡ ካብ ናይ ሓቂ ክፍሊ',
  aP1: 'ሰገን ኤዲቲንግ ኣካዳሚ ኣብ ኢትዮጵያ ብኣካል ኤዲተራት ኣሰልጢኑ እዩ። እዞም ኦንላይን ኮርሳት ነቲ ተመሳሳሊ ትምህርቲ ናብ ክፍሊ ክመጹ ዘይክእሉ ተማሃሮ የብጽሕዎ።',
  aP2: 'ነፍሲ ወከፍ ቅብሊትን መወዳእታ ፕሮጀክትን ብድለት ባዕሉ ይርአ።',
  allCourses: 'ኩሎም ኮርሳት', lessonsTitle: 'ትምህርትታት', lessonsSoon: 'ዝርዝር ትምህርትታት ኣብዚ ቀልጢፉ ክወጽእ እዩ።',
  dayN: 'መዓልቲ', includedIn: 'ነዚ ኮርስ ግዛእ', youOwn: 'እዚ ኮርስ ኣለካ', goToLessons: 'ናብ ትምህርትታት ኪድ',
  waitingApproval: 'ክፍሊትካ ምርግጋጽ ይጽበ ኣሎ።',
  email: 'ኢመይል', password: 'መሕለፊ ቃል', fullName: 'ምሉእ ስም (ከምቲ ኣብ ሰርቲፊኬትካ ዝጽሓፍ)',
  phone: 'ቁጽሪ ተሌፎን', country: 'ሃገር', createAccount: 'ኣካውንት ክፈት', haveAccount: 'ኣካውንት ኣለካ ድዩ?',
  noAccount: 'ሓድሽ ዲኻ?', forgot: 'መሕለፊ ቃል ረሲዕካ?', sendReset: 'መሐደሲ ሊንክ ስደድ',
  resetSent: 'እቲ ኢመይል ኣካውንት እንተሃልይዎ፡ መሐደሲ ሊንክ ተላኢኹ ኣሎ። ኢመይልካ ርአ።',
  newPassword: 'ሓድሽ መሕለፊ ቃል', savePassword: 'መሕለፊ ቃል ዕቀብ', passwordSaved: 'መሕለፊ ቃል ተዓቂቡ። ኣቲኻ ኣለኻ።',
  checkEmail: 'ኣካውንት ተኸፊቱ። ንምርግጋጽ ኢመይልካ ርአ፡ ድሕሪኡ እቶ።',
  loginTitle: 'እቶ', signupTitle: 'ኣካውንትካ ክፈት', resetTitle: 'መሕለፊ ቃልካ ሓድስ',
  loginNeeded: 'ንምቕጻል እቶ ወይ ኣካውንት ክፈት።',
  buyTitle: 'ግዛእ', price: 'ዋጋ', howPay: 'ብኸመይ ክትከፍል ኢኻ?',
  telebirr: 'ቴሌብር', bankShort: 'ብባንኪ', abroadShort: 'ካብ ኢትዮጵያ ወጻኢ',
  sendTo: 'ክፍሊት ናብዚ ስደድ', accountName: 'ስም', detailsComing: 'ድለት ነዚ ሓበሬታ ቀልጢፉ ክውስኾ እዩ። ክሳብ ሽዑ ን ድለት ርኸቦ።',
  receipt: 'ስክሪንሾት ወይ ስእሊ ቅብሊት', receiptHelp: 'JPG, PNG ወይ PDF፡ ክሳብ 5 MB።', optional: 'ኣማራጺ',
  noteLabel: 'መልእኽቲ ን ድለት (ኣማራጺ)', notePlaceholder: 'ንኣብነት ኣብ ክፍሊት ዘሎ ስም ወይ ቁጽሪ ትራንዛክሽን',
  abroadHelp: 'ብኸመይ ከም እትኸፍል ንምስምማዕ ቅድም ን ድለት ርኸቦ። ምስ ከፈልካ፡ ድለት ኮርስካ ክኸፍተልካ ነዚ ቅጥዒ ስደድ።',
  submit: 'ንምርግጋጽ ስደድ', sending: 'ይለኣኽ ኣሎ...', chooseFile: 'በጃኻ ስእሊ ቅብሊትካ ምረጽ።',
  sent: 'የቐንየልና። ድለት ክፍሊትካ ርእዩ ኮርስካ ክኸፍተልካ እዩ። ኣብ ኮርሳተይ ክትከታተሎ ትኽእል።',
  callDleat: 'ን ድለት ደውል ወይ መልእኽቲ ስደድ',
  myTitle: 'ኮርሳተይ', myEmpty: 'ገና ኮርስ ኣይገዛእካን።', browse: 'ኮርሳት ርአ',
  status_waiting: 'ምርግጋጽ ይጽበ', status_approved: 'ተቐቢሉ', status_rejected: 'ኣይተቐበለን',
  daysLeftN: 'መዓልትታት ተሪፉ', ended: 'ግዜ ተወዲኡ', todayLesson: 'ናይ ሎሚ ትምህርቲ', openCourse: 'ኮርስ ክፈት',
  rejectedReason: 'ምኽንያት', tryAgain: 'ሓድሽ ቅብሊት ስደድ', sentOn: 'ዝተላእከሉ',
  locked: 'ዕጹው', opensIn: 'ዝኽፈተሉ ድሕሪ', opensTomorrow: 'ጽባሕ ይኽፈት', days: 'መዓልትታት', today: 'ሎሚ',
  noAccess: 'እዚ ኮርስ ንዓኻ ክፉት ኣይኮነን። ግዛእዎ፡ ወይ ክፍሊትካ ክሳብ ዝረጋገጽ ተጸበ።',
  courseEnded: 'ናይዚ ኮርስ ወርሒ ተወዲኡ።',
  noVideo: 'እዚ ትምህርቲ ገና ቪድዮ የብሉን።', dayOf: 'ካብ',
  loading: 'ይጽዕን ኣሎ...', error: 'ጌጋ ተፈጢሩ', loadFailed: 'ኮርሳት ክጽዓኑ ኣይከኣሉን። በጃኹም ገጹ ኣሐድሱ፡ እንተ ቀጺሉ ን ድለት ርኸቡ።', notFound: 'ገጽ ኣይተረኽበን', home: 'መበገሲ', save: 'ዕቀብ', saved: 'ተዓቂቡ',
  contact: 'ርኸበና', footerRights: 'ሰገን ኤዲቲንግ ኣካዳሚ',

  ...jobsTi,
}

export type TKey = keyof Dict

type I18n = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TKey) => string
  // Picks the Tigrinya column of a database row when chosen and filled in.
  pick: (row: Record<string, unknown>, field: string) => string
}

const I18nContext = createContext<I18n | null>(null)

function readStoredLang(): Lang {
  try {
    return localStorage.getItem('segen-lang') === 'ti' ? 'ti' : 'en'
  } catch {
    return 'en'
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem('segen-lang', l)
    } catch {
      // storage may be blocked; the switch still works for this visit
    }
  }

  const t = (key: TKey) => (lang === 'ti' ? ti[key] : undefined) ?? en[key]
  const pick: I18n['pick'] = (row, field) => {
    const tiText = row[`${field}_ti`]
    return String(lang === 'ti' && tiText ? tiText : (row[`${field}_en`] ?? ''))
  }

  return <I18nContext.Provider value={{ lang, setLang, t, pick }}>{children}</I18nContext.Provider>
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
