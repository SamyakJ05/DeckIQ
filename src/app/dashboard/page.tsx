'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ActiveTab = 'overview' | 'issues' | 'slides';

const slideThumbs = [
  { n: '01', label: 'Cover', sub: 'Title slide', score: '—', scoreColor: 'var(--muted)', bg: 'linear-gradient(135deg,#1a1a1a,#2a2a2a)' },
  { n: '02', label: 'The Problem', sub: 'Pain point', score: '92', scoreColor: 'var(--success)', bg: 'linear-gradient(135deg,#0d1117,#1a2030)' },
  { n: '03', label: 'Our Solution', sub: 'Product', score: '78', scoreColor: 'var(--success)', bg: 'linear-gradient(135deg,#0f1a10,#1a2d1b)' },
  { n: '04', label: 'Market Size', sub: 'TAM/SAM/SOM', score: '82', scoreColor: 'var(--success)', bg: 'linear-gradient(135deg,#10101a,#1a1a2d)' },
  { n: '05', label: 'Business Model', sub: 'Revenue', score: '74', scoreColor: 'var(--success)', bg: 'linear-gradient(135deg,#1a100f,#2d1a18)' },
  { n: '06', label: 'Traction', sub: 'Metrics', score: '45', scoreColor: 'var(--danger)', bg: 'linear-gradient(135deg,#161210,#251c18)' },
  { n: '07', label: 'Competition', sub: 'Landscape', score: '66', scoreColor: 'var(--warn)', bg: 'linear-gradient(135deg,#121418,#1d2026)' },
  { n: '08', label: 'Go-to-Market', sub: 'Strategy', score: '69', scoreColor: 'var(--warn)', bg: 'linear-gradient(135deg,#0f1318,#181d24)' },
  { n: '09', label: 'Team', sub: 'Founders', score: '52', scoreColor: 'var(--warn)', bg: 'linear-gradient(135deg,#181314,#261c1e)' },
  { n: '10', label: 'Roadmap', sub: '18-month plan', score: '77', scoreColor: 'var(--success)', bg: 'linear-gradient(135deg,#141718,#1f2326)' },
  { n: '11', label: 'Financials', sub: 'Projections', score: '63', scoreColor: 'var(--warn)', bg: 'linear-gradient(135deg,#141210,#20191a)' },
  { n: '12', label: 'The Ask', sub: '$3M raise', score: '61', scoreColor: 'var(--warn)', bg: 'linear-gradient(135deg,#1a0d0d,#2d1414)' },
];

const slideRows = [
  { n: '01', name: 'Cover', score: '—', clr: 'var(--muted)', note: 'No one-liner tagline. Add: "AI that eliminates meeting overhead."' },
  { n: '02', name: 'The Problem', score: '92', clr: 'var(--success)', note: 'Excellent. Pain quantified ($180B/yr), VCs confirmed problem space, urgency clear.' },
  { n: '03', name: 'Our Solution', score: '78', clr: 'var(--success)', note: 'Product clear in one slide. Workflow diagram helps. Moat needs one more line.' },
  { n: '04', name: 'Market Size', score: '82', clr: 'var(--success)', note: 'Bottom-up TAM with source. SAM logic follows. SOM is defensible at 1.2%.' },
  { n: '05', name: 'Business Model', score: '74', clr: 'var(--success)', note: 'Per-seat SaaS is clear. Enterprise contract size mentioned. Expansion revenue path implied.' },
  { n: '06', name: 'Traction', score: '45', clr: 'var(--danger)', note: '$48K MRR shown — but no growth rate. This is the single biggest issue in the deck.' },
  { n: '07', name: 'Competition', score: '66', clr: 'var(--warn)', note: "Matrix present but axes are generic. Price vs. features doesn't show your moat." },
  { n: '08', name: 'Go-to-Market', score: '69', clr: 'var(--warn)', note: '5 channels listed with no primary. Pick the one working and double down on it.' },
  { n: '09', name: 'Team', score: '52', clr: 'var(--warn)', note: 'Strong domain expertise. Missing: prior exits, advisor logos, notable employers.' },
  { n: '10', name: 'Roadmap', score: '77', clr: 'var(--success)', note: '18-month milestones present. Product milestones clear. Revenue checkpoints missing.' },
  { n: '11', name: 'Financials', score: '63', clr: 'var(--warn)', note: 'Hockey stick projections without stated assumptions. Add the unit economics math.' },
  { n: '12', name: 'The Ask', score: '61', clr: 'var(--warn)', note: '$3M stated. Use of funds listed. Not tied to milestones — rework the narrative.' },
];

export default function DashboardPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
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
    <div className="app-shell">
      {/* NAV */}
      <nav className="nav" style={{ position: 'relative', top: '0' }}>
        <div className="container">
          <div className="nav-inner">
            <Link href="/" className="nav-logo">Deck<span>IQ</span></Link>
            <div className="nav-links">
              <Link href="/dashboard" style={{ color: 'var(--ink)' }}>Dashboard</Link>
              <Link href="/slide-review">Review</Link>
              <Link href="/report">Report</Link>
            </div>
            <div className="nav-actions">
              <button className="mode-toggle" onClick={toggleMode}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
              <Link href="/upload" className="btn btn-outline btn-md">New analysis</Link>
              <Link href="/report" className="btn btn-primary btn-md">Full report →</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="main-layout">
        {/* Left: slide list */}
        <aside className="slide-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-deck-name">Luminary AI</div>
            <div className="sidebar-deck-meta">12 slides · Oct 2025</div>
          </div>
          <div className="slide-list">
            {slideThumbs.map((slide, idx) => (
              <div
                key={slide.n}
                className={`slide-thumb${activeSlide === idx ? ' active' : ''}`}
                onClick={() => setActiveSlide(idx)}
              >
                <div className="thumb-preview">
                  <div className="thumb-bg" style={{ background: slide.bg }}></div>
                  <span>{slide.n}</span>
                </div>
                <div className="thumb-info">
                  <div className="thumb-label">{slide.label}</div>
                  <div className="thumb-sub">{slide.sub}</div>
                </div>
                <span className="thumb-score" style={{ color: slide.scoreColor }}>{slide.score}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: analysis */}
        <main className="main-content">
          <div className="deck-topbar">
            <div className="deck-title-block">
              <div className="deck-title">Luminary AI</div>
              <div className="deck-subtitle">Series A pitch · Analyzed Oct 15, 2025 · 12 slides</div>
            </div>
            <div className="deck-actions">
              <Link href="/slide-review" className="btn btn-outline btn-md">Slide review →</Link>
              <Link href="/report" className="btn btn-primary btn-md">Full report →</Link>
            </div>
          </div>

          {/* Score card */}
          <div className="score-overview">
            <div className="score-ring-main">
              <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', width: '140px', height: '140px' }}>
                <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
                <circle cx="70" cy="70" r="58" fill="none" stroke="#ea2804" strokeWidth="8"
                  strokeDasharray="364" strokeDashoffset="106" strokeLinecap="round" />
              </svg>
              <div className="score-center">
                <span className="score-big">71</span>
                <span className="score-tag">DeckIQ</span>
              </div>
            </div>
            <div className="overview-meta">
              <div className="grade-row">
                <span className="grade-letter">B+</span>
                <div>
                  <div className="grade-desc">Investable with fixes</div>
                  <div className="grade-sub">Top 28% of decks at Series A stage</div>
                </div>
              </div>
              <div className="meta-pills">
                <span className="badge badge-primary">Series A</span>
                <span className="badge badge-muted">$3M ask</span>
                <span className="badge badge-muted">AI / Productivity</span>
                <span className="badge badge-muted">12 slides</span>
              </div>
              <p className="overview-body">Strong problem framing and credible market analysis. The traction slide is the single biggest drag — showing MRR without a growth rate is the leading cause of pass decisions at this stage. Fix traction and team before Sequoia.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="tab-bar">
            <button
              className={`tab-btn${activeTab === 'overview' ? ' active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab-btn${activeTab === 'issues' ? ' active' : ''}`}
              onClick={() => setActiveTab('issues')}
            >
              Issues (7)
            </button>
            <button
              className={`tab-btn${activeTab === 'slides' ? ' active' : ''}`}
              onClick={() => setActiveTab('slides')}
            >
              By slide
            </button>
          </div>

          {/* Tab: Overview */}
          {activeTab === 'overview' && (
            <div id="tab-overview">
              <div className="category-grid">
                <div className="cat-card high" onClick={() => { window.location.href = '/slide-review'; }}>
                  <div className="cat-card-score high">88</div>
                  <div className="cat-card-name">Problem &amp; market</div>
                  <div className="cat-card-desc">Pain specific, TAM bottom-up, well-sourced</div>
                </div>
                <div className="cat-card high" onClick={() => { window.location.href = '/slide-review'; }}>
                  <div className="cat-card-score high">82</div>
                  <div className="cat-card-name">Market sizing</div>
                  <div className="cat-card-desc">$24B SAM cited; SOM logic clean</div>
                </div>
                <div className="cat-card high" onClick={() => { window.location.href = '/slide-review'; }}>
                  <div className="cat-card-score high">75</div>
                  <div className="cat-card-name">Solution clarity</div>
                  <div className="cat-card-desc">One-slide product; moat partially explained</div>
                </div>
                <div className="cat-card medium" onClick={() => { window.location.href = '/slide-review'; }}>
                  <div className="cat-card-score medium">61</div>
                  <div className="cat-card-name">Ask &amp; use of funds</div>
                  <div className="cat-card-desc">Amount present; milestones vague</div>
                </div>
                <div className="cat-card medium" onClick={() => { window.location.href = '/slide-review'; }}>
                  <div className="cat-card-score medium">52</div>
                  <div className="cat-card-name">Team credibility</div>
                  <div className="cat-card-desc">Strong domain; missing prior exit signals</div>
                </div>
                <div className="cat-card low" onClick={() => { window.location.href = '/slide-review'; }}>
                  <div className="cat-card-score low">45</div>
                  <div className="cat-card-name">Traction &amp; momentum</div>
                  <div className="cat-card-desc">MRR present; no growth rate → investors skip</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Issues */}
          {activeTab === 'issues' && (
            <div id="tab-issues">
              <div className="issues-card">
                <div className="issues-header">
                  <span className="issues-title">All issues</span>
                  <span className="badge badge-muted">7 total</span>
                </div>
                <div className="issue-item">
                  <span className="issue-sev sev-high">Critical</span>
                  <div className="issue-body">
                    <div className="issue-title">Traction slide missing growth rate</div>
                    <div className="issue-detail">Slide 6 shows $48K MRR but no month-over-month or year-over-year growth rate. VCs at Series A need to see momentum, not a snapshot. Without a growth rate, the metric has no signal value.</div>
                    <div className="issue-slide">Slide 06 · Traction</div>
                  </div>
                </div>
                <div className="issue-item">
                  <span className="issue-sev sev-high">Critical</span>
                  <div className="issue-body">
                    <div className="issue-title">Team slide missing credibility anchors</div>
                    <div className="issue-detail">No prior exits, no advisor logos, no notable past employers highlighted. At Series A, founders need to answer &ldquo;why will you specifically win?&rdquo; — domain expertise alone isn&apos;t enough.</div>
                    <div className="issue-slide">Slide 09 · Team</div>
                  </div>
                </div>
                <div className="issue-item">
                  <span className="issue-sev sev-medium">Major</span>
                  <div className="issue-body">
                    <div className="issue-title">Ask not tied to milestones</div>
                    <div className="issue-detail">$3M ask is stated but not connected to specific 18-month milestones. VCs fund milestones, not operations. Reframe as: &ldquo;$3M takes us from X to Y, which unlocks Series B at Z valuation.&rdquo;</div>
                    <div className="issue-slide">Slide 12 · The Ask</div>
                  </div>
                </div>
                <div className="issue-item">
                  <span className="issue-sev sev-medium">Major</span>
                  <div className="issue-body">
                    <div className="issue-title">Competition matrix uses wrong axes</div>
                    <div className="issue-detail">Slide 7 plots price vs. features — a common template that doesn&apos;t explain why you win. VCs want to see axes that reflect your actual moat (e.g. integration depth vs. LLM accuracy).</div>
                    <div className="issue-slide">Slide 07 · Competition</div>
                  </div>
                </div>
                <div className="issue-item">
                  <span className="issue-sev sev-medium">Major</span>
                  <div className="issue-body">
                    <div className="issue-title">Financials show hockey stick without assumptions</div>
                    <div className="issue-detail">3-year projections double every year with no stated assumptions. VCs discount ungrounded projections; show the unit economics math that produces the curve.</div>
                    <div className="issue-slide">Slide 11 · Financials</div>
                  </div>
                </div>
                <div className="issue-item">
                  <span className="issue-sev sev-low">Minor</span>
                  <div className="issue-body">
                    <div className="issue-title">Cover slide lacks a clear one-line</div>
                    <div className="issue-detail">The cover shows the company name and logo but no tagline. First impression sets the cognitive frame — add a one-liner: &ldquo;Luminary AI reduces enterprise meeting overhead by 70% using ambient AI.&rdquo;</div>
                    <div className="issue-slide">Slide 01 · Cover</div>
                  </div>
                </div>
                <div className="issue-item">
                  <span className="issue-sev sev-low">Minor</span>
                  <div className="issue-body">
                    <div className="issue-title">GTM slide lacks a primary acquisition channel</div>
                    <div className="issue-detail">Slide 8 lists 5 acquisition channels equally. Top-of-funnel signals are diluted when no channel is called out as primary. Highlight the channel that&apos;s working and size it.</div>
                    <div className="issue-slide">Slide 08 · Go-to-Market</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: By slide */}
          {activeTab === 'slides' && (
            <div id="tab-slides">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                {slideRows.map((s) => (
                  <div
                    key={s.n}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 'var(--sp-lg)',
                      background: 'var(--surface-card)',
                      border: '1px solid var(--hairline)',
                      borderRadius: 'var(--r-md)',
                      padding: 'var(--sp-lg) var(--sp-xl)',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', width: '20px', flexShrink: 0, paddingTop: '2px' }}>
                      {s.n}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>{s.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--body-clr)', lineHeight: '1.5' }}>{s.note}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600, color: s.clr, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      {s.score}
                    </span>
                    <Link href="/slide-review" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: 'var(--muted)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Right: VC lens panel */}
        <aside className="vc-panel">
          <div className="panel-section">
            <div className="panel-title">VC quick signals</div>
            <div className="signal-row"><span className="signal-nm">Problem-solution fit</span><span className="signal-val pass">✓ Pass</span></div>
            <div className="signal-row"><span className="signal-nm">Market size credibility</span><span className="signal-val pass">✓ Pass</span></div>
            <div className="signal-row"><span className="signal-nm">Growth rate visible</span><span className="signal-val fail">✗ Fail</span></div>
            <div className="signal-row"><span className="signal-nm">Prior exits on team</span><span className="signal-val fail">✗ Fail</span></div>
            <div className="signal-row"><span className="signal-nm">Milestone-linked ask</span><span className="signal-val fail">✗ Fail</span></div>
            <div className="signal-row"><span className="signal-nm">Competitive moat clear</span><span className="signal-val warn">~ Partial</span></div>
            <div className="signal-row"><span className="signal-nm">Unit economics present</span><span className="signal-val warn">~ Partial</span></div>
            <div className="signal-row"><span className="signal-nm">10-min skim survives</span><span className="signal-val pass">✓ Pass</span></div>
          </div>
          <div className="panel-section">
            <div className="panel-title">Top recommendations</div>
            <div className="recommendation">
              <strong>Fix Slide 6 first</strong>
              Add month-over-month growth rate next to MRR. Even 15% MoM changes the conversation from &ldquo;static company&rdquo; to &ldquo;rocket ship.&rdquo;
            </div>
            <div className="recommendation">
              <strong>Add advisor logos to Slide 9</strong>
              One well-known advisor with a logo replaces three paragraphs of text. Brand recognition is credibility compression.
            </div>
            <div className="recommendation">
              <strong>Rewrite Slide 12 ask</strong>
              Format: &ldquo;$3M → [Milestone A] by [Date] → Series B at $20M+ ARR.&rdquo; Show what success looks like for the investors, not just for you.
            </div>
          </div>
          <div className="panel-section">
            <div className="panel-title">Comparable analyses</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
              <Link href="/report" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', textDecoration: 'none', padding: 'var(--sp-sm) 0', borderBottom: '1px solid var(--hairline)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: 'var(--success)', width: '32px' }}>86</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Vanta Commerce</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Series B · A- · funded</div>
                </div>
              </Link>
              <Link href="/report" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', textDecoration: 'none', padding: 'var(--sp-sm) 0' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 600, color: 'var(--success)', width: '32px' }}>79</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Axon Health</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Series A · B+ · funded</div>
                </div>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
