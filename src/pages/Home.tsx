import { useState } from 'react'
import { Link } from 'react-router-dom'
import CourseCards from '../components/CourseCards'
import { CONTACT_PHONE, formatPhone } from '../components/Layout'
import { loadCatalogue } from '../lib/data'
import { useI18n } from '../lib/i18n'
import { useLoad } from '../lib/useLoad'

const DAYS = Array.from({ length: 30 }, (_, i) => i + 1)

export default function Home() {
  const { t } = useI18n()
  const catalogue = useLoad(loadCatalogue, [])
  const [copied, setCopied] = useState(false)

  return (
    <>
      <div className="wrap hero">
        <div className="eyebrow">{t('eyebrow')}</div>
        <h1>
          {t('h1a')} <em>{t('h1b')}</em>
        </h1>
        <p className="lede">{t('lede')}</p>
        <div className="cta">
          <a className="btn gold" href="#courses">
            {t('ctaCourses')}
          </a>
          <a className="btn ghost" href="#how">
            {t('ctaHow')}
          </a>
        </div>

        <div className="suite" aria-label="Example course timeline">
          <div className="suite-head">
            <span>
              <strong>Premiere Pro</strong> · {t('tlName')}
            </span>
            <span>
              {t('tlDay')} <span className="tc">05</span> / 30 · {t('tlNext')}
            </span>
          </div>
          <div className="track-scroll">
            <div className="track">
              <div className="ruler">
                {DAYS.map((d) => (
                  <span key={d}>D{d}</span>
                ))}
              </div>
              <div className="clips">
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className={`clip${d <= 5 ? ' open' : ''}${d === 5 ? ' today' : ''}${d === 30 ? ' test' : ''}`}
                    title={d === 30 ? 'Day 30: final test' : `Day ${d}`}
                  />
                ))}
              </div>
              <div className="playhead" aria-hidden="true" />
            </div>
          </div>
          <div className="legend">
            <span>
              <i className="k-open" />
              {t('kOpen')}
            </span>
            <span>
              <i className="k-lock" />
              {t('kLock')}
            </span>
            <span>
              <i className="k-test" />
              {t('kTest')}
            </span>
          </div>
        </div>
      </div>

      <section id="courses">
        <div className="wrap">
          <div className="eyebrow">{t('cEyebrow')}</div>
          <h2>{t('cTitle')}</h2>
          <p className="sub">{t('cSub')}</p>
          {catalogue.data && <CourseCards catalogue={catalogue.data} />}
          {catalogue.loading && <p className="muted">{t('loading')}</p>}
          {catalogue.error && <p className="error">{catalogue.error}</p>}
        </div>
      </section>

      <section id="how">
        <div className="wrap">
          <div className="eyebrow">{t('hEyebrow')}</div>
          <h2>{t('hTitle')}</h2>
          <p className="sub">{t('hSub')}</p>
          <div className="steps">
            {(['1', '2', '3', '4'] as const).map((n) => (
              <div className="step" key={n}>
                <div className="n">0{n}</div>
                <h3>{t(`s${n}t`)}</h3>
                <p>{t(`s${n}p`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pay">
        <div className="wrap">
          <div className="eyebrow">{t('pEyebrow')}</div>
          <h2>{t('pTitle')}</h2>
          <p className="sub">{t('pSub')}</p>
          <div className="pay">
            <div>
              <h3>Telebirr</h3>
              <p>{t('tele')}</p>
              <span className="price">{t('soon')}</span>
            </div>
            <div>
              <h3>{t('bankT')}</h3>
              <p>{t('bank')}</p>
              <span className="price">{t('soon2')}</span>
            </div>
            <div className="abroad">
              <h3>{t('abroadT')}</h3>
              <p>{t('abroad')}</p>
              <div className="phone">
                <span>{formatPhone(CONTACT_PHONE)}</span>
                <button
                  className="btn ghost small"
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(CONTACT_PHONE).then(() => setCopied(true), () => {})
                  }}
                >
                  {t('copy')}
                </button>
                <span className="copied" aria-live="polite">
                  {copied ? t('copied') : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about">
        <div className="wrap about">
          <img src="/logo.jpg" alt="Segen Editing Academy logo" width={300} height={320} />
          <div>
            <div className="eyebrow">{t('aEyebrow')}</div>
            <h2>{t('aTitle')}</h2>
            <p>{t('aP1')}</p>
            <p>{t('aP2')}</p>
            <Link className="btn gold" to="/courses">
              {t('ctaCourses')}
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
