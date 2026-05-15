'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('deckiq-mode');
    if (saved === 'light') {
      document.body.classList.add('light');
      setIsLight(true);
    }
  }, []);

  function toggleMode() {
    const next = !isLight;
    setIsLight(next);
    document.body.classList.toggle('light', next);
    localStorage.setItem('deckiq-mode', next ? 'light' : 'dark');
  }

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="container">
          <div className="nav-inner">
            <Link href="/" className="nav-logo">Deck<span>IQ</span></Link>
            <div className="nav-links">
              <a href="#">Product</a>
              <a href="#">Examples</a>
              <a href="#">Pricing</a>
              <a href="#">Blog</a>
            </div>
            <div className="nav-actions">
              <button className="mode-toggle" onClick={toggleMode} title="Toggle theme">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isLight ? (
                    <>
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/>
                      <line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/>
                      <line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </>
                  ) : (
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  )}
                </svg>
              </button>
              <Link href="/upload" className="btn btn-outline btn-md">Sign in</Link>
              <Link href="/upload" className="btn btn-primary btn-md">Upload deck →</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-grid">
            {/* Left: copy */}
            <div>
              <div className="hero-eyebrow"><span className="hero-eyebrow-dot"></span>AI-powered deck intelligence</div>
              <h1 className="hero-h1">Know if your<br />deck will <em>close.</em><br />Before the meeting.</h1>
              <p className="hero-sub">DeckIQ scores your pitch deck against 47 signals used by top-tier VCs to decide in the first 3 minutes. Slide-by-slide critique, fundability score, and a fix list — in 60 seconds.</p>
              <div className="hero-actions">
                <Link href="/upload" className="btn btn-primary btn-lg">Upload your deck →</Link>
                <Link href="/report" className="btn btn-outline btn-lg">See example report</Link>
              </div>
              <div className="hero-trust">
                <span><span className="trust-dot"></span>2,847 decks analyzed</span>
                <span>Free to start</span>
                <span>No account needed</span>
              </div>
            </div>

            {/* Right: mock analysis card */}
            <div className="preview-card" aria-hidden="true">
              <div className="preview-header">
                <span className="preview-title">Analysis report</span>
                <span className="badge badge-success">
                  <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  Complete
                </span>
              </div>
              <div className="score-row">
                <div className="score-ring-wrap" style={{ width: '96px', height: '96px' }}>
                  <svg viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)', width: '96px', height: '96px' }}>
                    <circle cx="48" cy="48" r="40" fill="none" strokeWidth="6" stroke="rgba(255,255,255,0.08)"/>
                    <circle cx="48" cy="48" r="40" fill="none" strokeWidth="6" stroke="#ea2804"
                      strokeDasharray="251" strokeDashoffset="73" strokeLinecap="round"/>
                  </svg>
                  <div className="score-center">
                    <span className="score-num">71</span>
                    <span className="score-lbl">DeckIQ</span>
                  </div>
                </div>
                <div className="score-meta">
                  <div className="score-deck">Luminary AI</div>
                  <div className="score-sub">Series A · 12 slides</div>
                  <div className="score-grade">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    B+ · Investable with fixes
                  </div>
                </div>
              </div>
              <div className="cats">
                <div className="cat-bar"><span className="cat-nm">Problem</span><div className="bar-track"><div className="bar-fill" style={{ width: '88%' }}></div></div><span className="cat-sc">88</span></div>
                <div className="cat-bar"><span className="cat-nm">Market</span><div className="bar-track"><div className="bar-fill" style={{ width: '82%' }}></div></div><span className="cat-sc">82</span></div>
                <div className="cat-bar"><span className="cat-nm">Solution</span><div className="bar-track"><div className="bar-fill" style={{ width: '75%' }}></div></div><span className="cat-sc">75</span></div>
                <div className="cat-bar"><span className="cat-nm">Ask</span><div className="bar-track"><div className="bar-fill w" style={{ width: '61%' }}></div></div><span className="cat-sc">61</span></div>
                <div className="cat-bar"><span className="cat-nm">Team</span><div className="bar-track"><div className="bar-fill w" style={{ width: '52%' }}></div></div><span className="cat-sc">52</span></div>
                <div className="cat-bar"><span className="cat-nm">Traction</span><div className="bar-track"><div className="bar-fill d" style={{ width: '45%' }}></div></div><span className="cat-sc">45</span></div>
              </div>
              <div className="preview-issues">
                <div className="issues-hd">Top issues</div>
                <div className="iss"><div className="iss-dot" style={{ background: 'var(--danger)' }}></div>Traction slide shows MRR snapshot but no growth rate — investors need momentum curves.</div>
                <div className="iss"><div className="iss-dot" style={{ background: 'var(--warn)' }}></div>Team slide missing advisor logos and prior exits — credibility gap for Series A.</div>
                <div className="iss"><div className="iss-dot" style={{ background: 'var(--warn)' }}></div>$3M ask not tied to 18-month milestones — VCs need to see what the round achieves.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAND */}
      <div className="stats-band">
        <div className="container">
          <div className="stats-grid">
            <div className="stat"><div className="stat-n accent">2,847</div><div className="stat-l">Decks analyzed</div></div>
            <div className="stat"><div className="stat-n">47</div><div className="stat-l">VC scoring signals</div></div>
            <div className="stat"><div className="stat-n">+18</div><div className="stat-l">Avg score lift after fixes</div></div>
            <div className="stat"><div className="stat-n">60s</div><div className="stat-l">To full analysis</div></div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="features">
        <div className="container">
          <div className="features-intro">
            <div>
              <div className="section-eyebrow">What DeckIQ analyzes</div>
              <h2 className="section-headline">6 dimensions.<br />47 signals.<br />No mercy.</h2>
            </div>
            <div style={{ paddingTop: 'var(--sp-3xl)' }}>
              <p className="section-body">Every score maps directly to documented investor decision frameworks — not design opinions or gut feel. We score what VCs score, using pattern data from 200+ funded decks.</p>
            </div>
          </div>
          <div className="features-grid">
            <div className="feat-card">
              <div className="feat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              </div>
              <div className="feat-title">Problem & market</div>
              <div className="feat-body">Does the problem feel real and urgent? Is the market sizing credible, bottom-up, and not from a Gartner PDF dated 2019?</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div className="feat-title">Solution clarity</div>
              <div className="feat-body">Can a partner explain your product in one sentence after slide 3? Is the differentiation defensible or category-generic?</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              </div>
              <div className="feat-title">Traction & momentum</div>
              <div className="feat-body">Revenue, DAUs, growth rate, retention — traction slides graded on narrative arc and momentum signal, not just absolute numbers.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div className="feat-title">Team credibility</div>
              <div className="feat-body">Do your backgrounds explain why you specifically will win? Domain expertise, prior exits, cofounder completeness — all scored.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div className="feat-title">Ask & use of funds</div>
              <div className="feat-body">Is the raise defensible? Are milestones 18-month horizon? Does round size match the stage and the traction you&apos;ve shown?</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <div className="feat-title">Narrative flow</div>
              <div className="feat-body">Does slide 1 set up slide 2? Does the deck build toward a single compelling ask? Investor cognitive load, systematically measured.</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <div className="how-band">
        <div className="container">
          <div className="section-eyebrow" style={{ marginBottom: 'var(--sp-3xl)' }}>How it works</div>
          <div className="how-inner">
            <div className="step">
              <div className="step-num">01 — Upload</div>
              <div className="step-title">Drop your deck</div>
              <div className="step-body">PDF or PPTX. Up to 40 slides. Paste a Google Slides link. No account required to start your first analysis.</div>
            </div>
            <div className="step">
              <div className="step-num">02 — Analyze</div>
              <div className="step-title">47 signals run</div>
              <div className="step-body">Our model reads every slide — copy, data, structure, narrative — against patterns extracted from funded decks.</div>
            </div>
            <div className="step">
              <div className="step-num">03 — Score</div>
              <div className="step-title">Get your DeckIQ</div>
              <div className="step-body">Overall score 0–100 plus letter grade. Per-slide breakdown. Category scores. Issues ranked by investor impact severity.</div>
            </div>
            <div className="step">
              <div className="step-num">04 — Fix</div>
              <div className="step-title">Ship a better deck</div>
              <div className="step-body">Specific rewrites suggested for weak slides. Re-analyze for free after edits to track your score improvement.</div>
            </div>
          </div>
        </div>
      </div>

      {/* CRITERIA PREVIEW */}
      <div className="criteria-section">
        <div className="container">
          <div className="section-eyebrow">Example analysis</div>
          <h2 className="section-headline">Luminary AI — Series A</h2>
          <p className="section-body">71/100 DeckIQ score — B+. Strong problem and market framing; traction narrative needs work before meeting Sequoia next week.</p>
          <div className="criteria-grid">
            <div className="crit-item">
              <span className="crit-score good">88</span>
              <div className="crit-info"><div className="crit-nm">Problem framing</div><div className="crit-desc">Pain is specific, quantified, and investor-recognized</div></div>
              <div className="crit-bar-wrap"><div className="crit-track"><div className="crit-fill" style={{ width: '88%', background: 'var(--success)' }}></div></div></div>
            </div>
            <div className="crit-item">
              <span className="crit-score good">82</span>
              <div className="crit-info"><div className="crit-nm">Market sizing</div><div className="crit-desc">Bottom-up TAM with credible source cited</div></div>
              <div className="crit-bar-wrap"><div className="crit-track"><div className="crit-fill" style={{ width: '82%', background: 'var(--success)' }}></div></div></div>
            </div>
            <div className="crit-item">
              <span className="crit-score good">75</span>
              <div className="crit-info"><div className="crit-nm">Solution clarity</div><div className="crit-desc">Product explained in one slide; moat partially clear</div></div>
              <div className="crit-bar-wrap"><div className="crit-track"><div className="crit-fill" style={{ width: '75%', background: 'var(--success)' }}></div></div></div>
            </div>
            <div className="crit-item">
              <span className="crit-score medium">61</span>
              <div className="crit-info"><div className="crit-nm">Ask & use of funds</div><div className="crit-desc">$3M ask present; milestones not milestone-specific</div></div>
              <div className="crit-bar-wrap"><div className="crit-track"><div className="crit-fill" style={{ width: '61%', background: 'var(--warn)' }}></div></div></div>
            </div>
            <div className="crit-item">
              <span className="crit-score medium">52</span>
              <div className="crit-info"><div className="crit-nm">Team credibility</div><div className="crit-desc">Strong domain expertise; missing prior exit signals</div></div>
              <div className="crit-bar-wrap"><div className="crit-track"><div className="crit-fill" style={{ width: '52%', background: 'var(--warn)' }}></div></div></div>
            </div>
            <div className="crit-item">
              <span className="crit-score low">45</span>
              <div className="crit-info"><div className="crit-nm">Traction & momentum</div><div className="crit-desc">MRR shown, growth rate absent — investors skip it</div></div>
              <div className="crit-bar-wrap"><div className="crit-track"><div className="crit-fill" style={{ width: '45%', background: 'var(--danger)' }}></div></div></div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA BAND */}
      <div className="cta-band">
        <div className="container">
          <h2 className="cta-h">Ready to know<br />your score?</h2>
          <p className="cta-sub">Free. No account. 60 seconds to a full analysis.</p>
          <Link href="/upload" className="btn btn-white btn-lg">Upload your deck →</Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">Deck<span>IQ</span></div>
              <p className="footer-tagline">AI-powered pitch deck analysis for founders who want to close, not just pitch.</p>
            </div>
            <div>
              <div className="footer-col-title">Product</div>
              <div className="footer-links">
                <Link href="/upload">Upload deck</Link>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/report">Example report</Link>
                <a href="#">Pricing</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <div className="footer-links">
                <a href="#">About</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
                <a href="#">Contact</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Legal</div>
              <div className="footer-links">
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Security</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 DeckIQ. Not affiliated with any VC firm. Analysis for informational purposes.</span>
            <span>Made for founders.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
