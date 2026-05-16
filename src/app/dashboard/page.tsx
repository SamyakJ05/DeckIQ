'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { DeckAnalysisResult, SlideAnalysis } from '@/types';

type ActiveTab = 'overview' | 'issues' | 'slides';

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--success)';
  if (score >= 50) return 'var(--warn)';
  return 'var(--danger)';
}

function scoreGrade(s: number): string {
  if (s >= 90) return 'A+';
  if (s >= 85) return 'A';
  if (s >= 80) return 'A-';
  if (s >= 75) return 'B+';
  if (s >= 70) return 'B';
  if (s >= 65) return 'B-';
  if (s >= 60) return 'C+';
  if (s >= 55) return 'C';
  if (s >= 50) return 'C-';
  return 'D';
}

function slideBg(slideType: string): string {
  const map: Record<string, string> = {
    Title:         'linear-gradient(135deg,#0d0d0d 0%,#1a1a1a 100%)',
    Problem:       'linear-gradient(135deg,#0d1117 0%,#1a2030 100%)',
    Solution:      'linear-gradient(135deg,#0f1a10,#1a2d1b)',
    Market:        'linear-gradient(135deg,#10101a,#1a1a2d)',
    BusinessModel: 'linear-gradient(135deg,#161210,#251c18)',
    Traction:      'linear-gradient(135deg,#160e0e 0%,#2d1414 100%)',
    Competition:   'linear-gradient(135deg,#121418,#1d2026)',
    Team:          'linear-gradient(135deg,#181314 0%,#261c1e 100%)',
    Ask:           'linear-gradient(135deg,#1a0d0d 0%,#2d1414 100%)',
    Other:         'linear-gradient(135deg,#141718,#1f2326)',
  };
  return map[slideType] ?? map.Other;
}

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState<DeckAnalysisResult | null>(null);
  const [deckFileName, setDeckFileName] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('deckiq-mode');
    if (saved === 'light') {
      document.body.classList.add('light');
      setIsLight(true);
    }

    // Load analysis from sessionStorage
    const raw = sessionStorage.getItem('deckiq-analysis');
    if (raw) {
      try {
        setAnalysis(JSON.parse(raw));
      } catch {
        // corrupt data
      }
    }
    setDeckFileName(sessionStorage.getItem('deckiq-filename') ?? '');
  }, []);

  function toggleMode() {
    const next = !isLight;
    setIsLight(next);
    document.body.classList.toggle('light', next);
    localStorage.setItem('deckiq-mode', next ? 'light' : 'dark');
  }

  // If no analysis, show prompt
  if (!analysis) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', color: 'var(--muted)' }}>
        <p style={{ fontSize: '18px' }}>No analysis found. Upload a deck to get started.</p>
        <Link href="/upload" className="btn btn-primary btn-md">Upload a deck →</Link>
      </div>
    );
  }

  const slides = analysis.perSlideAnalysis;
  const score = analysis.overallScore;
  const grade = scoreGrade(score);
  const ringOffset = Math.round(364 * (1 - score / 100));

  // Build category scores from rubric
  const rubric = analysis.rubricBreakdown;
  const categories = [
    { name: 'Problem & market', score: Math.round((rubric.problemClarity.score + rubric.marketSize.score) / 2 * 10), desc: rubric.problemClarity.rationale },
    { name: 'Market sizing', score: Math.round(rubric.marketSize.score * 10), desc: rubric.marketSize.rationale },
    { name: 'Solution clarity', score: Math.round(rubric.solutionFit.score * 10), desc: rubric.solutionFit.rationale },
    { name: 'Ask & use of funds', score: Math.round(rubric.askClarity.score * 10), desc: rubric.askClarity.rationale },
    { name: 'Team credibility', score: Math.round(rubric.teamStrength.score * 10), desc: rubric.teamStrength.rationale },
    { name: 'Traction & momentum', score: Math.round(rubric.tractionEvidence.score * 10), desc: rubric.tractionEvidence.rationale },
  ].sort((a, b) => b.score - a.score);

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
            <div className="sidebar-deck-name">{deckFileName || 'Your Deck'}</div>
            <div className="sidebar-deck-meta">{slides.length} slides · {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
          </div>
          <div className="slide-list">
            {slides.map((slide, idx) => {
              const slideScore = slide.slideHealthScore;
              const displayScore = slideScore === 0 && ['Title', 'Other'].includes(slide.slideType) ? '—' : Math.round(slideScore).toString();
              const color = slideScore === 0 ? 'var(--muted)' : scoreColor(slideScore);
              return (
                <div
                  key={slide.slideNumber}
                  className={`slide-thumb${activeSlide === idx ? ' active' : ''}`}
                  onClick={() => setActiveSlide(idx)}
                >
                  <div className="thumb-preview">
                    <div className="thumb-bg" style={{ background: slideBg(slide.slideType) }}></div>
                    <span>{String(slide.slideNumber).padStart(2, '0')}</span>
                  </div>
                  <div className="thumb-info">
                    <div className="thumb-label">{slide.slideType}</div>
                    <div className="thumb-sub">{slide.rawText.split('\n')[0]?.substring(0, 20) || 'Slide'}</div>
                  </div>
                  <span className="thumb-score" style={{ color }}>{displayScore}</span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center: analysis */}
        <main className="main-content">
          <div className="deck-topbar">
            <div className="deck-title-block">
              <div className="deck-title">{deckFileName || 'Your Deck'}</div>
              <div className="deck-subtitle">Analyzed {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {slides.length} slides</div>
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
                  strokeDasharray="364" strokeDashoffset={ringOffset} strokeLinecap="round" />
              </svg>
              <div className="score-center">
                <span className="score-big">{score}</span>
                <span className="score-tag">DeckIQ</span>
              </div>
            </div>
            <div className="overview-meta">
              <div className="grade-row">
                <span className="grade-letter">{grade}</span>
                <div>
                  <div className="grade-desc">{analysis.verdict}</div>
                  <div className="grade-sub">{slides.length} slides analyzed</div>
                </div>
              </div>
              <div className="meta-pills">
                {deckFileName && <span className="badge badge-primary">{deckFileName}</span>}
                <span className="badge badge-muted">{slides.length} slides</span>
              </div>
              <p className="overview-body">{analysis.investorSummary}</p>
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
              Issues ({analysis.criticalFixes.length})
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
                {categories.map((cat) => {
                  const className = cat.score >= 70 ? 'high' : cat.score >= 50 ? 'medium' : 'low';
                  return (
                    <div key={cat.name} className={`cat-card ${className}`} onClick={() => { window.location.href = '/slide-review'; }}>
                      <div className={`cat-card-score ${className}`}>{cat.score}</div>
                      <div className="cat-card-name">{cat.name}</div>
                      <div className="cat-card-desc">{cat.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Issues */}
          {activeTab === 'issues' && (
            <div id="tab-issues">
              <div className="issues-card">
                <div className="issues-header">
                  <span className="issues-title">All issues</span>
                  <span className="badge badge-muted">{analysis.criticalFixes.length} total</span>
                </div>
                {analysis.criticalFixes.map((fix) => (
                  <div key={fix.rank} className="issue-item">
                    <span className="issue-sev sev-high">Critical</span>
                    <div className="issue-body">
                      <div className="issue-title">{fix.fix}</div>
                      <div className="issue-detail">Estimated score impact: +{fix.estimatedScoreImpact} points</div>
                      <div className="issue-slide">Slide {String(fix.slideToFix).padStart(2, '0')} · {fix.dimension}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: By slide */}
          {activeTab === 'slides' && (
            <div id="tab-slides">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
                {slides.map((slide) => {
                  const slideScore = slide.slideHealthScore;
                  const displayScore = slideScore === 0 && ['Title', 'Other'].includes(slide.slideType) ? '—' : Math.round(slideScore).toString();
                  const color = slideScore === 0 ? 'var(--muted)' : scoreColor(slideScore);
                  
                  // Get top dimension rationale
                  const dims = Object.entries(slide.graniteScores) as [string, { score: number; rationale: string }][];
                  const topDim = dims.sort((a, b) => b[1].score - a[1].score)[0];
                  const note = topDim ? topDim[1].rationale : 'No analysis available';

                  return (
                    <div
                      key={slide.slideNumber}
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
                        {String(slide.slideNumber).padStart(2, '0')}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '3px' }}>{slide.slideType}</div>
                        <div style={{ fontSize: '12px', color: 'var(--body-clr)', lineHeight: '1.5' }}>{note}</div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {displayScore}
                      </span>
                      <Link href={`/slide-review?slide=${slide.slideNumber}`} style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: 'var(--muted)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Right: VC lens panel */}
        <aside className="vc-panel">
          <div className="panel-section">
            <div className="panel-title">VC quick signals</div>
            <div className="signal-row"><span className="signal-nm">Problem-solution fit</span><span className={`signal-val ${rubric.problemClarity.score >= 7 ? 'pass' : 'fail'}`}>{rubric.problemClarity.score >= 7 ? '✓ Pass' : '✗ Fail'}</span></div>
            <div className="signal-row"><span className="signal-nm">Market size credibility</span><span className={`signal-val ${rubric.marketSize.score >= 7 ? 'pass' : 'fail'}`}>{rubric.marketSize.score >= 7 ? '✓ Pass' : '✗ Fail'}</span></div>
            <div className="signal-row"><span className="signal-nm">Traction visible</span><span className={`signal-val ${rubric.tractionEvidence.score >= 7 ? 'pass' : 'fail'}`}>{rubric.tractionEvidence.score >= 7 ? '✓ Pass' : '✗ Fail'}</span></div>
            <div className="signal-row"><span className="signal-nm">Team strength</span><span className={`signal-val ${rubric.teamStrength.score >= 7 ? 'pass' : rubric.teamStrength.score >= 5 ? 'warn' : 'fail'}`}>{rubric.teamStrength.score >= 7 ? '✓ Pass' : rubric.teamStrength.score >= 5 ? '~ Partial' : '✗ Fail'}</span></div>
            <div className="signal-row"><span className="signal-nm">Ask clarity</span><span className={`signal-val ${rubric.askClarity.score >= 7 ? 'pass' : rubric.askClarity.score >= 5 ? 'warn' : 'fail'}`}>{rubric.askClarity.score >= 7 ? '✓ Pass' : rubric.askClarity.score >= 5 ? '~ Partial' : '✗ Fail'}</span></div>
            <div className="signal-row"><span className="signal-nm">Competitive moat clear</span><span className={`signal-val ${rubric.competitiveMoat.score >= 7 ? 'pass' : rubric.competitiveMoat.score >= 5 ? 'warn' : 'fail'}`}>{rubric.competitiveMoat.score >= 7 ? '✓ Pass' : rubric.competitiveMoat.score >= 5 ? '~ Partial' : '✗ Fail'}</span></div>
            <div className="signal-row"><span className="signal-nm">Business model clear</span><span className={`signal-val ${rubric.businessModel.score >= 7 ? 'pass' : rubric.businessModel.score >= 5 ? 'warn' : 'fail'}`}>{rubric.businessModel.score >= 7 ? '✓ Pass' : rubric.businessModel.score >= 5 ? '~ Partial' : '✗ Fail'}</span></div>
            <div className="signal-row"><span className="signal-nm">Investor readiness</span><span className={`signal-val ${rubric.investorReadiness.score >= 7 ? 'pass' : 'warn'}`}>{rubric.investorReadiness.score >= 7 ? '✓ Pass' : '~ Partial'}</span></div>
          </div>
          <div className="panel-section">
            <div className="panel-title">Top recommendations</div>
            {analysis.criticalFixes.slice(0, 3).map((fix, i) => (
              <div key={fix.rank} className="recommendation">
                <strong>Fix #{i + 1}: Slide {fix.slideToFix}</strong>
                {fix.fix}
              </div>
            ))}
          </div>
          <div className="panel-section">
            <div className="panel-title">Quick actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-sm)' }}>
              <Link href="/slide-review" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', textDecoration: 'none', padding: 'var(--sp-sm) 0', borderBottom: '1px solid var(--hairline)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Review all slides</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Detailed per-slide analysis</div>
                </div>
              </Link>
              <Link href="/report" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-md)', textDecoration: 'none', padding: 'var(--sp-sm) 0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>Full report</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Complete analysis & recommendations</div>
                </div>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Made with Bob
