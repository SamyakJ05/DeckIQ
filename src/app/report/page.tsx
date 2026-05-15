'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ReportPage() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('deckiq-mode') === 'light') {
      document.body.classList.add('light');
      setIsLight(true);
    }
  }, []);

  function toggleMode() {
    document.body.classList.toggle('light');
    const light = document.body.classList.contains('light');
    localStorage.setItem('deckiq-mode', light ? 'light' : 'dark');
    setIsLight(light);
  }

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="container">
          <div className="nav-inner">
            <Link href="/" className="nav-logo">Deck<span>IQ</span></Link>
            <div className="nav-links">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/slide-review">Review slides</Link>
              <Link href="/report" style={{ color: 'var(--ink)' }}>Report</Link>
            </div>
            <div className="nav-actions">
              <button className="mode-toggle" onClick={toggleMode}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
              <button className="btn btn-outline btn-md" onClick={() => window.print()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Export PDF
              </button>
              <Link href="/upload" className="btn btn-primary btn-md">New analysis →</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SCORE BAND */}
      <div className="report-hero">
        <div className="container">
          <div className="hero-inner">
            {/* Score ring */}
            <div className="score-hero-wrap">
              <svg viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
                <circle cx="100" cy="100" r="84" fill="none" stroke="#ea2804" strokeWidth="10"
                  strokeDasharray="528" strokeDashoffset="153" strokeLinecap="round" />
              </svg>
              <div className="score-hero-center">
                <span className="score-hero-num">71</span>
                <span className="score-hero-tag">DeckIQ</span>
              </div>
            </div>

            {/* Right copy */}
            <div>
              <div className="hero-grade">B+</div>
              <div className="hero-verdict">Investable with fixes.<br />3 critical issues blocking close.</div>
              <p className="hero-sub">Luminary AI scores in the top 28% of Series A decks DeckIQ has analyzed. Strong problem framing and market logic. Traction narrative and team credibility need work before a top-tier meeting.</p>
              <div className="hero-pills">
                <span className="badge badge-primary">Series A</span>
                <span className="badge badge-muted">$3M ask</span>
                <span className="badge badge-muted">AI / Productivity</span>
                <span className="badge badge-muted">12 slides</span>
                <span className="badge badge-muted">Analyzed Oct 15, 2025</span>
              </div>
              <div className="hero-actions">
                <Link href="/slide-review" className="btn btn-dark btn-lg">Review slides →</Link>
                <Link href="/dashboard" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'var(--on-dark)' }}>Dashboard</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RADAR + CATEGORY BREAKDOWN */}
      <section className="radar-section">
        <div className="container">
          <div className="section-eyebrow">Category breakdown</div>
          <h2 className="section-headline">Six dimensions scored.</h2>
          <div className="radar-layout">
            {/* Radar chart */}
            <div className="radar-wrap">
              <svg className="radar-svg" viewBox="0 0 300 300">
                {/* Grid rings */}
                {/* 100% */}
                <polygon points="150,40 260,95 260,205 150,260 40,205 40,95" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                {/* 75% */}
                <polygon points="150,68 233,109 233,191 150,232 67,191 67,109" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                {/* 50% */}
                <polygon points="150,95 205,123 205,177 150,205 95,177 95,123" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                {/* 25% */}
                <polygon points="150,122 178,138 178,163 150,178 122,163 122,138" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                {/* Axes */}
                <line x1="150" y1="150" x2="150" y2="40" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="150" y1="150" x2="260" y2="95" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="150" y1="150" x2="260" y2="205" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="150" y1="150" x2="150" y2="260" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="150" y1="150" x2="40" y2="205" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="150" y1="150" x2="40" y2="95" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                {/* Data polygon: Problem 88, Market 82, Solution 75, Traction 45, Team 52, Ask 61 */}
                {/* Computed: (150,53) (228,105) (221,191) (150,200) (101,179) (92,116) */}
                <polygon points="150,53 228,105 221,191 150,200 101,179 92,116"
                  fill="rgba(234,40,4,0.15)" stroke="#ea2804" strokeWidth="2" strokeLinejoin="round" />
                {/* Dots at each vertex */}
                <circle cx="150" cy="53" r="4" fill="#ea2804" />
                <circle cx="228" cy="105" r="4" fill="#ea2804" />
                <circle cx="221" cy="191" r="4" fill="#ea2804" />
                <circle cx="150" cy="200" r="4" fill="#dc2626" />
                <circle cx="101" cy="179" r="4" fill="#d97706" />
                <circle cx="92" cy="116" r="4" fill="#d97706" />
                {/* Labels */}
                <text x="150" y="28" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="rgba(240,237,229,0.5)">Problem</text>
                <text x="275" y="95" textAnchor="start" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="rgba(240,237,229,0.5)">Market</text>
                <text x="275" y="210" textAnchor="start" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="rgba(240,237,229,0.5)">Solution</text>
                <text x="150" y="278" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#dc2626">Traction</text>
                <text x="22" y="210" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="rgba(240,237,229,0.5)">Team</text>
                <text x="22" y="95" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="rgba(240,237,229,0.5)">Ask</text>
                {/* Ring labels */}
                <text x="150" y="150" dy="-30" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgba(255,255,255,0.2)">50</text>
                <text x="150" y="150" dy="-57" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgba(255,255,255,0.2)">75</text>
              </svg>
            </div>

            {/* Category legend */}
            <div className="cat-legend">
              <div className="cat-leg-item">
                <span className="cat-leg-score" style={{ color: 'var(--success)' }}>88</span>
                <div className="cat-leg-info">
                  <div className="cat-leg-name">Problem &amp; market</div>
                  <div className="cat-leg-desc">Pain quantified, market sourced bottom-up, urgency clear</div>
                </div>
                <div className="cat-leg-bar"><div className="cat-leg-track"><div className="cat-leg-fill" style={{ width: '88%', background: 'var(--success)' }}></div></div></div>
              </div>
              <div className="cat-leg-item">
                <span className="cat-leg-score" style={{ color: 'var(--success)' }}>82</span>
                <div className="cat-leg-info">
                  <div className="cat-leg-name">Market sizing</div>
                  <div className="cat-leg-desc">$24B SAM with credible source; SOM at 2% is defensible</div>
                </div>
                <div className="cat-leg-bar"><div className="cat-leg-track"><div className="cat-leg-fill" style={{ width: '82%', background: 'var(--success)' }}></div></div></div>
              </div>
              <div className="cat-leg-item">
                <span className="cat-leg-score" style={{ color: 'var(--success)' }}>75</span>
                <div className="cat-leg-info">
                  <div className="cat-leg-name">Solution clarity</div>
                  <div className="cat-leg-desc">Product legible in one slide; moat needs one more line</div>
                </div>
                <div className="cat-leg-bar"><div className="cat-leg-track"><div className="cat-leg-fill" style={{ width: '75%', background: 'var(--success)' }}></div></div></div>
              </div>
              <div className="cat-leg-item">
                <span className="cat-leg-score" style={{ color: 'var(--warn)' }}>61</span>
                <div className="cat-leg-info">
                  <div className="cat-leg-name">Ask &amp; use of funds</div>
                  <div className="cat-leg-desc">Amount clear; milestones not milestone-specific</div>
                </div>
                <div className="cat-leg-bar"><div className="cat-leg-track"><div className="cat-leg-fill" style={{ width: '61%', background: 'var(--warn)' }}></div></div></div>
              </div>
              <div className="cat-leg-item">
                <span className="cat-leg-score" style={{ color: 'var(--warn)' }}>52</span>
                <div className="cat-leg-info">
                  <div className="cat-leg-name">Team credibility</div>
                  <div className="cat-leg-desc">Strong domain; missing exits and advisor signals</div>
                </div>
                <div className="cat-leg-bar"><div className="cat-leg-track"><div className="cat-leg-fill" style={{ width: '52%', background: 'var(--warn)' }}></div></div></div>
              </div>
              <div className="cat-leg-item">
                <span className="cat-leg-score" style={{ color: 'var(--danger)' }}>45</span>
                <div className="cat-leg-info">
                  <div className="cat-leg-name">Traction &amp; momentum</div>
                  <div className="cat-leg-desc">MRR shown; growth rate absent — biggest drag in the deck</div>
                </div>
                <div className="cat-leg-bar"><div className="cat-leg-track"><div className="cat-leg-fill" style={{ width: '45%', background: 'var(--danger)' }}></div></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ISSUES */}
      <div className="issues-section">
        <div className="container">
          <div className="section-eyebrow">Issues ranked by investor impact</div>
          <h2 className="section-headline">7 issues found.<br />3 are blocking.</h2>
          <p className="section-body" style={{ marginBottom: 'var(--sp-3xl)' }}>Fix these in order. The first three are the difference between a pass and a meeting — VCs pattern-match them in the first skim.</p>
          <div className="issues-grid">
            <div className="issue-card">
              <div className="issue-card-top">
                <span className="issue-sev-badge sev-high" style={{ background: 'color-mix(in oklch,var(--danger) 12%,transparent)', color: 'var(--danger)' }}>Critical</span>
                <span className="issue-slide-tag">Slide 06 · Traction</span>
              </div>
              <div className="issue-card-title">No growth rate on the traction slide</div>
              <div className="issue-card-body">$48K MRR is strong for the stage, but without a month-over-month growth rate VCs can't model momentum. The metric is meaningless without the slope. This is the leading cause of pass decisions at Series A.</div>
              <Link href="/slide-review" className="issue-card-action">
                Fix this slide →
              </Link>
            </div>
            <div className="issue-card">
              <div className="issue-card-top">
                <span className="issue-sev-badge sev-high" style={{ background: 'color-mix(in oklch,var(--danger) 12%,transparent)', color: 'var(--danger)' }}>Critical</span>
                <span className="issue-slide-tag">Slide 09 · Team</span>
              </div>
              <div className="issue-card-title">Team slide missing credibility anchors</div>
              <div className="issue-card-body">No prior exits, no advisor logos, no notable investors. Domain expertise is necessary but not sufficient at Series A. The question VCs ask is "why will YOU specifically win?" — this slide doesn't answer it.</div>
              <Link href="/slide-review" className="issue-card-action">
                Fix this slide →
              </Link>
            </div>
            <div className="issue-card">
              <div className="issue-card-top">
                <span className="issue-sev-badge" style={{ background: 'color-mix(in oklch,var(--warn) 12%,transparent)', color: 'var(--warn)' }}>Major</span>
                <span className="issue-slide-tag">Slide 12 · The Ask</span>
              </div>
              <div className="issue-card-title">Ask not tied to 18-month milestones</div>
              <div className="issue-card-body">$3M is stated and use-of-funds is present, but the round is not connected to specific milestones or a Series B trigger. VCs fund milestones. Reframe: "$3M takes us from X ARR to Y ARR and unlocks Series A at Z."</div>
              <Link href="/slide-review" className="issue-card-action">
                Fix this slide →
              </Link>
            </div>
            <div className="issue-card">
              <div className="issue-card-top">
                <span className="issue-sev-badge" style={{ background: 'color-mix(in oklch,var(--warn) 12%,transparent)', color: 'var(--warn)' }}>Major</span>
                <span className="issue-slide-tag">Slide 07 · Competition</span>
              </div>
              <div className="issue-card-title">Competition matrix uses wrong axes</div>
              <div className="issue-card-body">Price vs. features is a template — it doesn't show your real moat. VCs have seen 10,000 of these charts. Use axes that reflect where you specifically win: integration depth vs. on-device AI accuracy.</div>
              <Link href="/slide-review" className="issue-card-action">
                Fix this slide →
              </Link>
            </div>
            <div className="issue-card">
              <div className="issue-card-top">
                <span className="issue-sev-badge" style={{ background: 'color-mix(in oklch,var(--warn) 12%,transparent)', color: 'var(--warn)' }}>Major</span>
                <span className="issue-slide-tag">Slide 11 · Financials</span>
              </div>
              <div className="issue-card-title">Projections lack stated assumptions</div>
              <div className="issue-card-body">3-year revenue projections doubling each year with no unit economics math. VCs automatically discount ungrounded hockey sticks. Show the inputs: customers × ACV = ARR. Make the math obvious.</div>
              <Link href="/slide-review" className="issue-card-action">
                Fix this slide →
              </Link>
            </div>
            <div className="issue-card">
              <div className="issue-card-top">
                <span className="issue-sev-badge badge-muted">Minor</span>
                <span className="issue-slide-tag">Slide 01 · Cover</span>
              </div>
              <div className="issue-card-title">Cover lacks a one-liner tagline</div>
              <div className="issue-card-body">The cover shows the company name and a generic tagline. First 8 seconds = cognitive frame. Add a specific one-liner: "Luminary AI cuts enterprise meeting overhead by 70% using ambient AI that never joins the call."</div>
              <Link href="/slide-review" className="issue-card-action">
                Fix this slide →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARISON */}
      <section className="compare-section">
        <div className="container">
          <div className="section-eyebrow">Benchmark comparison</div>
          <h2 className="section-headline">How Luminary AI stacks up.</h2>
          <p className="section-body">Compared against two funded Series A decks analyzed by DeckIQ. Scores reflect decks before the round closed.</p>
          <div className="compare-grid">
            <div className="compare-card">
              <div className="compare-score" style={{ color: 'var(--success)' }}>86</div>
              <div className="compare-name">Vanta Commerce</div>
              <div className="compare-meta">Series B · A- · Funded $18M</div>
              <div className="compare-bar-row">
                <div className="compare-bar-item"><span className="compare-bar-nm">Problem</span><div className="compare-bar-track"><div className="compare-bar-fill" style={{ width: '94%', background: 'var(--success)' }}></div></div></div>
                <div className="compare-bar-item"><span className="compare-bar-nm">Traction</span><div className="compare-bar-track"><div className="compare-bar-fill" style={{ width: '89%', background: 'var(--success)' }}></div></div></div>
                <div className="compare-bar-item"><span className="compare-bar-nm">Team</span><div className="compare-bar-track"><div className="compare-bar-fill" style={{ width: '82%', background: 'var(--success)' }}></div></div></div>
                <div className="compare-bar-item"><span className="compare-bar-nm">Ask</span><div className="compare-bar-track"><div className="compare-bar-fill" style={{ width: '85%', background: 'var(--success)' }}></div></div></div>
              </div>
            </div>
            <div className="compare-card current">
              <div className="compare-score" style={{ color: 'var(--warn)' }}>71</div>
              <div className="compare-name">Luminary AI (you)</div>
              <div className="compare-meta">Series A · B+ · In progress</div>
              <div className="compare-bar-row">
                <div className="compare-bar-item"><span className="compare-bar-nm">Problem</span><div className="compare-bar-track"><div className="compare-bar-fill" style={{ width: '88%', background: 'var(--success)' }}></div></div></div>
                <div className="compare-bar-item"><span className="compare-bar-nm">Traction</span><div className="compare-bar-track"><div className="compare-bar-fill" style={{ width: '45%', background: 'var(--danger)' }}></div></div></div>
                <div className="compare-bar-item"><span className="compare-bar-nm">Team</span><div className="compare-bar-track"><div className="compare-bar-fill" style={{ width: '52%', background: 'var(--warn)' }}></div></div></div>
                <div className="compare-bar-item"><span className="compare-bar-nm">Ask</span><div className="compare-bar-track"><div className="compare-bar-fill" style={{ width: '61%', background: 'var(--warn)' }}></div></div></div>
              </div>
            </div>
            <div className="compare-card">
              <div className="compare-score" style={{ color: 'var(--success)' }}>79</div>
              <div className="compare-name">Axon Health</div>
              <div className="compare-meta">Series A · B+ · Funded $9M</div>
              <div className="compare-bar-row">
                <div className="compare-bar-item"><span className="compare-bar-nm">Problem</span><div className="compare-bar-track"><div className="compare-bar-fill" style={{ width: '85%', background: 'var(--success)' }}></div></div></div>
                <div className="compare-bar-item"><span className="compare-bar-nm">Traction</span><div className="compare-bar-track"><div className="compare-bar-fill" style={{ width: '78%', background: 'var(--success)' }}></div></div></div>
                <div className="compare-bar-item"><span className="compare-bar-nm">Team</span><div className="compare-bar-track"><div className="compare-bar-fill" style={{ width: '74%', background: 'var(--success)' }}></div></div></div>
                <div className="compare-bar-item"><span className="compare-bar-nm">Ask</span><div className="compare-bar-track"><div className="compare-bar-fill" style={{ width: '80%', background: 'var(--success)' }}></div></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECOMMENDATIONS */}
      <div className="recs-section">
        <div className="container">
          <div className="section-eyebrow" style={{ color: 'var(--primary)' }}>Recommended next steps</div>
          <h2 className="section-headline" style={{ color: 'var(--on-dark)' }}>Fix these three.<br />Re-analyze. Go raise.</h2>
          <div className="recs-grid">
            <div className="rec-card">
              <div className="rec-step">01 — Do this week</div>
              <div className="rec-title">Add a growth rate to slide 6</div>
              <div className="rec-body">Show 23% MoM growth in the headline. Add a 6-month sparkline chart showing $21K → $48K. This single change can move your Traction score from 45 to 75+ and your overall DeckIQ from 71 to 82.</div>
              <Link href="/slide-review" className="rec-link">
                See the rewrite suggestion →
              </Link>
            </div>
            <div className="rec-card">
              <div className="rec-step">02 — Do this week</div>
              <div className="rec-title">Add advisor logos to slide 9</div>
              <div className="rec-body">One well-known advisor logo in your team slide replaces three paragraphs of credentials. Reach out to 2-3 advisors with recognizable brand names in enterprise software. Even a letter of intent counts at this stage.</div>
              <Link href="/slide-review" className="rec-link">
                See the rewrite suggestion →
              </Link>
            </div>
            <div className="rec-card">
              <div className="rec-step">03 — Before the meeting</div>
              <div className="rec-title">Rewrite the ask as milestones</div>
              <div className="rec-body">The ask slide is your close. "$3M takes us to $2.4M ARR in 18 months, which unlocks Series A at $40M+ ARR" is infinitely more investable than a pie chart of hiring spend. Give VCs a picture of success.</div>
              <Link href="/slide-review" className="rec-link">
                See the rewrite suggestion →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CTA */}
      <section className="bottom-cta-section">
        <div className="container">
          <div className="bottom-cta-inner">
            <div className="bottom-cta-copy">
              <div className="bottom-cta-h">Fix. Re-analyze.<br />Track your score lift.</div>
              <div className="bottom-cta-sub">Free re-analysis after edits. Most founders improve by 12–18 points in the first revision.</div>
            </div>
            <div className="bottom-cta-action">
              <Link href="/upload" className="btn btn-white btn-lg">Re-analyze deck →</Link>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>Free · Unlimited re-analyses</span>
            </div>
          </div>
        </div>
      </section>

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
                <Link href="/slide-review">Slide review</Link>
                <a href="#">Pricing</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <div className="footer-links">
                <a href="#">About</a>
                <a href="#">Blog</a>
                <a href="#">Contact</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Legal</div>
              <div className="footer-links">
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 DeckIQ. Not affiliated with any VC firm.</span>
            <span>Made for founders.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
