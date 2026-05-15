'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedStage, setSelectedStage] = useState<string | null>('Seed');
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>('Seed VCs');
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('deckiq-mode');
    if (saved === 'light') {
      setIsLight(true);
      document.body.classList.add('light');
    }
  }, []);

  function goStep(n: number) {
    setCurrentStep(n);
  }

  function toggleMode() {
    const next = !isLight;
    setIsLight(next);
    if (next) {
      document.body.classList.add('light');
      localStorage.setItem('deckiq-mode', 'light');
    } else {
      document.body.classList.remove('light');
      localStorage.setItem('deckiq-mode', 'dark');
    }
  }

  function pipClass(index: number) {
    if (index < currentStep) return 'step-pip done';
    if (index === currentStep) return 'step-pip active';
    return 'step-pip';
  }

  const stageOptions = [
    { title: 'Pre-Seed', sub: 'Idea → first $500K' },
    { title: 'Seed', sub: '$500K → $3M' },
    { title: 'Series A', sub: '$3M → $15M' },
    { title: 'Series B+', sub: '$15M+' },
  ];

  const investorOptions = [
    { title: 'Seed VCs', sub: 'Y Combinator, First Round' },
    { title: 'Angels', sub: 'Individual check writers' },
    { title: 'Corporate VC', sub: 'Strategic investors' },
    { title: 'Not sure yet', sub: 'General analysis' },
  ];

  return (
    <>
      <style>{`
        .onboard-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 420px 1fr;
        }
        .onboard-brand {
          background: var(--surface-deep);
          border-right: 1px solid var(--hairline);
          padding: 40px;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
        }
        .brand-logo {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--on-dark);
          margin-bottom: 60px;
        }
        .brand-logo span { color: var(--primary); }
        .brand-headline {
          font-family: var(--font-display);
          font-size: clamp(28px, 2.5vw, 40px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1.05;
          color: var(--on-dark);
          margin-bottom: 20px;
        }
        .brand-headline em { font-style: normal; color: var(--primary); }
        .brand-body {
          font-size: 15px;
          color: var(--on-dark-mute);
          line-height: 1.65;
          margin-bottom: 40px;
        }
        .proof-list { display: flex; flex-direction: column; gap: 12px; }
        .proof-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: var(--r-md);
          padding: 14px 16px;
        }
        .proof-text {
          font-size: 13px;
          color: var(--on-dark-mute);
          line-height: 1.5;
          margin-bottom: 10px;
        }
        .proof-author { display: flex; align-items: center; gap: 8px; }
        .proof-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          flex-shrink: 0;
        }
        .proof-name {
          font-family: var(--font-mono);
          font-size: 11px;
          color: rgba(240,237,229,0.5);
        }
        .proof-role {
          font-family: var(--font-mono);
          font-size: 10px;
          color: rgba(240,237,229,0.3);
        }
        .brand-foot {
          margin-top: auto;
          font-family: var(--font-mono);
          font-size: 11px;
          color: rgba(240,237,229,0.25);
        }
        .onboard-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
          min-height: 100vh;
        }
        .onboard-inner { width: 100%; max-width: 440px; }
        .steps-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 40px;
        }
        .step-pip {
          height: 4px;
          border-radius: var(--r-full);
          transition: all .3s;
          background: var(--hairline);
        }
        .step-pip.done    { background: var(--success); }
        .step-pip.active  { background: var(--primary); }
        .step-panel { display: none; }
        .step-panel.visible { display: block; }
        .step-eyebrow {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }
        .step-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 3vw, 40px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1.0;
          color: var(--ink);
          margin-bottom: 8px;
        }
        .step-subtitle {
          font-size: 15px;
          color: var(--body-clr);
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .field { margin-bottom: 16px; }
        .field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 6px;
        }
        .field input, .field select {
          width: 100%;
          height: 44px;
          padding: 0 14px;
          background: var(--surface-card);
          border: 1px solid var(--hairline-str);
          border-radius: var(--r-md);
          font-size: 15px;
          font-family: var(--font-body);
          color: var(--ink);
          transition: border-color .15s, box-shadow .15s;
          outline: none;
          appearance: none;
        }
        .field input:focus, .field select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(234,40,4,0.12);
        }
        .field input::placeholder { color: var(--ash); }
        .field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          height: 48px;
          border-radius: var(--r-md);
          background: var(--surface-card);
          border: 1px solid var(--hairline-str);
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
          cursor: pointer;
          transition: border-color .15s, box-shadow .15s;
          text-decoration: none;
          font-family: var(--font-body);
        }
        .btn-google:hover {
          border-color: var(--hairline-str);
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          text-decoration: none;
        }
        .or-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
          color: var(--ash);
          font-size: 13px;
          font-family: var(--font-mono);
        }
        .or-divider::before, .or-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--hairline);
        }
        .radio-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 16px;
        }
        .radio-card {
          border: 1px solid var(--hairline-str);
          border-radius: var(--r-md);
          padding: 14px 16px;
          cursor: pointer;
          transition: all .15s;
        }
        .radio-card:hover { border-color: var(--primary); }
        .radio-card.selected {
          border-color: var(--primary);
          background: color-mix(in oklch, var(--primary) 6%, var(--surface-card));
        }
        .radio-card-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 3px;
        }
        .radio-card-sub { font-size: 12px; color: var(--muted); }
        .pstep { display: flex; align-items: center; gap: 12px; }
        .pstep-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--hairline);
          background: var(--surface-bone);
        }
        .pstep-icon.done {
          background: color-mix(in oklch, var(--success) 15%, var(--surface-card));
          border-color: var(--success);
        }
        .pstep-icon.active {
          background: color-mix(in oklch, var(--primary) 15%, var(--surface-card));
          border-color: var(--primary);
        }
        .pstep-icon.pending {
          background: var(--surface-bone);
          border-color: var(--hairline);
        }
        .pstep-text { font-size: 14px; color: var(--body-clr); }
        .pstep-text.done { color: var(--ink); }
        .form-footer { margin-top: 28px; }
        .btn-next { width: 100%; height: 48px; font-size: 16px; }
        .form-note {
          text-align: center;
          margin-top: 16px;
          font-size: 13px;
          color: var(--muted);
        }
        .form-note a { color: var(--body-clr); }
        @media (max-width: 900px) {
          .onboard-shell { grid-template-columns: 1fr; }
          .onboard-brand { display: none; }
          .onboard-main { padding: 40px 24px; }
        }
        @media (max-width: 480px) {
          .field-row { grid-template-columns: 1fr; }
          .radio-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="onboard-shell">

        {/* LEFT: Brand panel */}
        <aside className="onboard-brand">
          <div className="brand-logo">Deck<span>IQ</span></div>
          <div>
            <h2 className="brand-headline">Close the round.<br />Not just the <em>deck.</em></h2>
            <p className="brand-body">DeckIQ tells you exactly what investors will flag — before you're in the room. Slide-level critique, investor-grade score, fix suggestions in under 60 seconds.</p>

            <div className="proof-list">
              <div className="proof-card">
                <div className="proof-text">&ldquo;Got a 62 on my first upload. Fixed the traction slide and the market narrative — re-scored 84 in two days. Closed our pre-seed two weeks later.&rdquo;</div>
                <div className="proof-author">
                  <div className="proof-avatar" style={{ background: '#ea2804' }}>A</div>
                  <div>
                    <div className="proof-name">Arjun Patel</div>
                    <div className="proof-role">Founder · Luminary AI (Pre-Seed 2024)</div>
                  </div>
                </div>
              </div>
              <div className="proof-card">
                <div className="proof-text">&ldquo;The problem slide feedback was uncomfortably accurate. Our deck had three different markets hidden in one slide. Fixed it in an afternoon.&rdquo;</div>
                <div className="proof-author">
                  <div className="proof-avatar" style={{ background: '#2b9a66' }}>S</div>
                  <div>
                    <div className="proof-name">Sofia Moretti</div>
                    <div className="proof-role">Co-founder · Fieldstream ($1.2M Seed)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="brand-foot">SOC 2 Type II · Decks auto-deleted in 30 days</div>
        </aside>

        {/* RIGHT: Step flow */}
        <main className="onboard-main">
          <div className="onboard-inner">

            {/* Steps indicator */}
            <div className="steps-indicator">
              <div className={pipClass(0)} style={{ width: currentStep === 0 ? 48 : 32 }}></div>
              <div className={pipClass(1)} style={{ width: currentStep === 1 ? 48 : 32 }}></div>
              <div className={pipClass(2)} style={{ width: currentStep === 2 ? 48 : 32 }}></div>
            </div>

            {/* Step 0: Create account */}
            <div className={`step-panel${currentStep === 0 ? ' visible' : ''}`}>
              <div className="step-eyebrow">Step 1 of 3</div>
              <h1 className="step-title">Create your account</h1>
              <p className="step-subtitle">Free — no credit card. 3 analyses included.</p>

              <a href="#" className="btn-google" onClick={(e) => e.preventDefault()}>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </a>

              <div className="or-divider">or</div>

              <div className="field">
                <label htmlFor="email">Work email</label>
                <input type="email" id="email" placeholder="you@startup.com" defaultValue="" />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="fname">First name</label>
                  <input type="text" id="fname" placeholder="Arjun" defaultValue="" />
                </div>
                <div className="field">
                  <label htmlFor="lname">Last name</label>
                  <input type="text" id="lname" placeholder="Patel" defaultValue="" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="pass">Password</label>
                <input type="password" id="pass" placeholder="Min. 8 characters" defaultValue="" />
              </div>

              <div className="form-footer">
                <button className="btn btn-primary btn-md btn-next" onClick={() => goStep(1)}>
                  Create account →
                </button>
                <div className="form-note">Already have an account? <a href="#">Log in</a></div>
              </div>
            </div>

            {/* Step 1: About your raise */}
            <div className={`step-panel${currentStep === 1 ? ' visible' : ''}`}>
              <div className="step-eyebrow">Step 2 of 3</div>
              <h1 className="step-title">Tell us about your raise</h1>
              <p className="step-subtitle">We&apos;ll calibrate our analysis to your stage and investor type.</p>

              <div className="field">
                <label>What stage are you raising?</label>
                <div className="radio-grid">
                  {stageOptions.map((opt) => (
                    <div
                      key={opt.title}
                      className={`radio-card${selectedStage === opt.title ? ' selected' : ''}`}
                      onClick={() => setSelectedStage(opt.title)}
                    >
                      <div className="radio-card-title">{opt.title}</div>
                      <div className="radio-card-sub">{opt.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Who is your target investor?</label>
                <div className="radio-grid">
                  {investorOptions.map((opt) => (
                    <div
                      key={opt.title}
                      className={`radio-card${selectedInvestor === opt.title ? ' selected' : ''}`}
                      onClick={() => setSelectedInvestor(opt.title)}
                    >
                      <div className="radio-card-title">{opt.title}</div>
                      <div className="radio-card-sub">{opt.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="field">
                <label htmlFor="sector">Your sector</label>
                <select id="sector" defaultValue="B2B SaaS">
                  <option value="">Select a sector…</option>
                  <option>B2B SaaS</option>
                  <option>AI / ML</option>
                  <option>Fintech</option>
                  <option>Consumer</option>
                  <option>Healthcare</option>
                  <option>Deep tech</option>
                  <option>Climate / cleantech</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="form-footer">
                <button className="btn btn-primary btn-md btn-next" onClick={() => goStep(2)}>
                  Looks good →
                </button>
                <div className="form-note">
                  <a href="#" onClick={(e) => { e.preventDefault(); goStep(0); }}>← Back</a>
                </div>
              </div>
            </div>

            {/* Step 2: All set */}
            <div className={`step-panel${currentStep === 2 ? ' visible' : ''}`}>
              <div className="step-eyebrow">Step 3 of 3</div>
              <h1 className="step-title">You&apos;re all set.</h1>
              <p className="step-subtitle">Upload your first deck and get your IQ score in under 60 seconds.</p>

              {/* Quick upload shortcut */}
              <Link
                href="/upload"
                style={{
                  border: '2px dashed var(--hairline-str)',
                  borderRadius: 'var(--r-lg)',
                  padding: 'var(--sp-xxl)',
                  textAlign: 'center',
                  background: 'var(--surface-bone)',
                  cursor: 'pointer',
                  marginBottom: 'var(--sp-xxl)',
                  display: 'block',
                  textDecoration: 'none',
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--r-md)',
                  background: 'color-mix(in oklch, var(--primary) 14%, var(--surface))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '-0.3px',
                  color: 'var(--ink)',
                  marginBottom: 6,
                }}>Drop your deck here</div>
                <div style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
                  or click to browse — PDF or PPTX
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <span className="badge badge-muted">PDF</span>
                  <span className="badge badge-muted">PPTX</span>
                  <span className="badge badge-muted">Google Slides URL</span>
                </div>
              </Link>

              {/* What to expect checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 'var(--sp-xxl)' }}>
                <div className="pstep">
                  <div className="pstep-icon done">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <polyline points="3 8 6.5 11.5 13 4.5" stroke="var(--success)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="pstep-text done">Account created</span>
                </div>
                <div className="pstep">
                  <div className="pstep-icon done">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <polyline points="3 8 6.5 11.5 13 4.5" stroke="var(--success)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="pstep-text done">Analysis calibrated for your stage</span>
                </div>
                <div className="pstep">
                  <div className="pstep-icon active">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <polyline points="3 8 6.5 11.5 13 4.5" stroke="var(--primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="pstep-text" style={{ color: 'var(--ink)' }}>Upload deck → get IQ score in &lt;60 s</span>
                </div>
              </div>

              <div className="form-footer">
                <Link href="/upload" className="btn btn-primary btn-md btn-next" style={{ display: 'flex' }}>
                  Upload my first deck →
                </Link>
                <div className="form-note">
                  Or <Link href="/dashboard">go to my dashboard</Link>
                </div>
              </div>
            </div>

          </div>

          {/* Theme toggle — fixed bottom-right */}
          <button
            className="mode-toggle"
            onClick={toggleMode}
            style={{ position: 'fixed', bottom: 24, right: 24 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
        </main>
      </div>
    </>
  );
}
