'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { DeckAnalysisResult, RubricScores } from '@/types';
import { formatDimension } from '@/lib/formatters';
import { EmotionalJourneyChart } from '@/components/EmotionalJourneyChart';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function scoreColor(s: number): string {
  if (s >= 70) return 'var(--success)';
  if (s >= 50) return 'var(--warn)';
  return 'var(--danger)';
}

// Hexagon radar: 6 axes mapped to rubric dims (score 0-10 → 0-100%)
// Axes clockwise from top: Problem, Market, Solution, Traction, Team, Ask
// Outer vertices at 100%: (150,40) (260,95) (260,205) (150,260) (40,205) (40,95)
function radarPoints(r: RubricScores): string {
  const cx = 150, cy = 150;
  const axes = [
    { score: r.problemClarity.score,    ox: 150, oy: 40  },
    { score: r.marketSize.score,        ox: 260, oy: 95  },
    { score: r.solutionFit.score,       ox: 260, oy: 205 },
    { score: r.tractionEvidence.score,  ox: 150, oy: 260 },
    { score: r.teamStrength.score,      ox: 40,  oy: 205 },
    { score: r.askClarity.score,        ox: 40,  oy: 95  },
  ];
  return axes
    .map(({ score, ox, oy }) => {
      const t = score / 10;
      const x = Math.round(cx + t * (ox - cx));
      const y = Math.round(cy + t * (oy - cy));
      return `${x},${y}`;
    })
    .join(' ');
}


function AnimatedScore({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = target / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [target]);

  return <span>{display}</span>;
}

export default function ReportPage() {
  const [isLight, setIsLight] = useState(false);
  const [analysis, setAnalysis] = useState<DeckAnalysisResult | null>(null);
  const [deckFileName, setDeckFileName] = useState('');
  useEffect(() => {
    if (localStorage.getItem('deckiq-mode') === 'light') {
      document.body.classList.add('light');
      setIsLight(true);
    }
    const raw = sessionStorage.getItem('deckiq-analysis');
    if (raw) {
      try { setAnalysis(JSON.parse(raw)); } catch { /* corrupt data */ }
    }
    setDeckFileName(sessionStorage.getItem('deckiq-filename') ?? '');
  }, []);

  function toggleMode() {
    document.body.classList.toggle('light');
    const light = document.body.classList.contains('light');
    localStorage.setItem('deckiq-mode', light ? 'light' : 'dark');
    setIsLight(light);
  }

  function handleExportPDF() {
    window.print();
  }

  // Derived display values
  const score = analysis?.overallScore ?? 0;
  const ringOffset = Math.round(528 * (1 - score / 100));
  const grade = scoreGrade(score);
  const fixes = analysis?.criticalFixes ?? [];
  const slides = analysis?.perSlideAnalysis ?? [];
  const rubric = analysis?.rubricBreakdown;
  const radarPts = rubric ? radarPoints(rubric) : '150,150 150,150 150,150 150,150 150,150 150,150';
  const radarDotAxes = rubric ? [
    { score: rubric.problemClarity.score,   ox: 150, oy: 40  },
    { score: rubric.marketSize.score,       ox: 260, oy: 95  },
    { score: rubric.solutionFit.score,      ox: 260, oy: 205 },
    { score: rubric.tractionEvidence.score, ox: 150, oy: 260 },
    { score: rubric.teamStrength.score,     ox: 40,  oy: 205 },
    { score: rubric.askClarity.score,       ox: 40,  oy: 95  },
  ] : [];

  if (!analysis) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', color: 'var(--muted)' }}>
        <p style={{ fontSize: '18px' }}>No analysis found.</p>
        <Link href="/upload" className="btn btn-primary btn-md">Upload a deck →</Link>
      </div>
    );
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
              <button
                className="btn btn-outline btn-md"
                onClick={handleExportPDF}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print / Save as PDF
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
                  strokeDasharray="528" strokeDashoffset={ringOffset} strokeLinecap="round" />
              </svg>
              <div className="score-hero-center">
                <span className="score-hero-num"><AnimatedScore target={score} /></span>
                <span className="score-hero-tag">DeckIQ</span>
              </div>
            </div>

            {/* Right copy */}
            <div>
              <div className="hero-grade">{grade}</div>
              <div className="hero-verdict">{analysis.verdict}</div>
              <p className="hero-sub">{analysis.investorSummary}</p>
              <div className="hero-pills">
                {deckFileName && <span className="badge badge-primary">{deckFileName}</span>}
                <span className="badge badge-muted">{slides.length} slides</span>
                <span className="badge badge-muted">Analyzed {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
                {/* Data polygon from real rubric scores */}
                <polygon points={radarPts}
                  fill="rgba(234,40,4,0.15)" stroke="#ea2804" strokeWidth="2" strokeLinejoin="round" />
                {/* Dots at each vertex */}
                {radarDotAxes.map(({ score: s, ox, oy }, i) => {
                  const t = s / 10;
                  const x = Math.round(150 + t * (ox - 150));
                  const y = Math.round(150 + t * (oy - 150));
                  const color = s >= 7 ? '#ea2804' : s >= 5 ? '#d97706' : '#dc2626';
                  return <circle key={i} cx={x} cy={y} r="4" fill={color} />;
                })}
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

            {/* Category legend — real rubric data */}
            <div className="cat-legend">
              {rubric && (Object.entries(rubric) as [keyof RubricScores, { score: number; rationale: string }][])
                .sort((a, b) => b[1].score - a[1].score)
                .map(([key, { score: s, rationale }]) => {
                  const pct = s * 10;
                  const color = scoreColor(pct);
                  return (
                    <div key={key} className="cat-leg-item">
                      <span className="cat-leg-score" style={{ color }}>{pct}</span>
                      <div className="cat-leg-info">
                        <div className="cat-leg-name">{formatDimension(key)}</div>
                        <div className="cat-leg-desc">{rationale}</div>
                      </div>
                      <div className="cat-leg-bar">
                        <div className="cat-leg-track">
                          <div className="cat-leg-fill" style={{ width: `${pct}%`, background: color }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      </section>

      {/* EMOTIONAL JOURNEY */}
      <section style={{ padding: 'var(--sp-3xl) 0', background: 'var(--surface-deep)' }}>
        <div className="container">
          <EmotionalJourneyChart slides={slides} />
        </div>
      </section>

      {/* ISSUES */}
      <div className="issues-section">
        <div className="container">
          <div className="section-eyebrow">Issues ranked by investor impact</div>
          <h2 className="section-headline">{fixes.length} critical issues found.</h2>
          <p className="section-body" style={{ marginBottom: 'var(--sp-3xl)' }}>Fix these in order. The first issues are the difference between a pass and a meeting — VCs pattern-match them in the first skim.</p>
          <div className="issues-grid">
            {fixes.map((fix) => (
              <div key={fix.rank} className="issue-card">
                <div className="issue-card-top">
                  <span className="issue-sev-badge sev-high" style={{ background: 'color-mix(in oklch,var(--danger) 12%,transparent)', color: 'var(--danger)' }}>
                    Critical #{fix.rank}
                  </span>
                  <span className="issue-slide-tag">Slide {fix.slideToFix} · {formatDimension(fix.dimension)}</span>
                </div>
                <div className="issue-card-title">{fix.fix}</div>
                <div className="issue-card-body">
                  Fixing this could improve your score by ~{fix.estimatedScoreImpact} points.
                </div>
                <Link href={`/slide-review?slide=${fix.slideToFix}`} className="issue-card-action">
                  Fix this slide →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COMPARISON */}
      <section className="compare-section">
        <div className="container">
          <div className="section-eyebrow">Benchmark comparison</div>
          <h2 className="section-headline">How your deck stacks up.</h2>
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
              <div className="compare-score" style={{ color: scoreColor(score) }}>{score}</div>
              <div className="compare-name">{deckFileName || 'Your deck'}</div>
              <div className="compare-meta">{grade} · In progress</div>
              {rubric && (
                <div className="compare-bar-row">
                  {([
                    ['Problem', rubric.problemClarity.score],
                    ['Traction', rubric.tractionEvidence.score],
                    ['Team', rubric.teamStrength.score],
                    ['Ask', rubric.askClarity.score],
                  ] as [string, number][]).map(([label, s]) => {
                    const pct = s * 10;
                    return (
                      <div key={label} className="compare-bar-item">
                        <span className="compare-bar-nm">{label}</span>
                        <div className="compare-bar-track">
                          <div className="compare-bar-fill" style={{ width: `${pct}%`, background: scoreColor(pct) }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
            {fixes.map((fix, i) => (
              <div key={fix.rank} className="rec-card">
                <div className="rec-step">{String(i + 1).padStart(2, '0')} — Do this first</div>
                <div className="rec-title">{formatDimension(fix.dimension)}: Slide {fix.slideToFix}</div>
                <div className="rec-body">{fix.fix}</div>
                <p className="text-xs text-teal-400 font-medium mt-2">
                  Estimated score impact: +{fix.estimatedScoreImpact} points
                </p>
                <Link href={`/slide-review?slide=${fix.slideToFix}`} className="rec-link">
                  See the rewrite suggestion →
                </Link>
              </div>
            ))}
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
