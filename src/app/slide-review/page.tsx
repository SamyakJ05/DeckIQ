'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { DeckAnalysisResult, SlideAnalysis, SlideType, RubricScores, NLUResult } from '@/types';
import { formatDimension } from '@/lib/formatters';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slideColor(score: number | null): string {
  if (score == null) return 'var(--muted)';
  if (score >= 70) return 'var(--success)';
  if (score >= 50) return 'var(--warn)';
  return 'var(--danger)';
}

function slideBg(slideType: SlideType): string {
  const map: Record<SlideType, string> = {
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

// ─── Real Slide Content ───────────────────────────────────────────────────────

function RealSlideContent({ rawText, slideType }: { rawText: string; slideType: SlideType }) {
  const lines = rawText.split('\n').filter((l) => l.trim());
  const title = lines[0] ?? slideType;
  const body = lines.slice(1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'hidden' }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2.5vw,28px)',
        fontWeight: 800, color: '#f0ede5', letterSpacing: '-0.5px', lineHeight: 1.1,
      }}>
        {title}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {body.slice(0, 8).map((line, i) => (
          <div key={i} style={{
            fontSize: 'clamp(10px,1.5vw,13px)', color: 'rgba(240,237,229,0.65)',
            lineHeight: 1.5, marginBottom: '4px',
          }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Signal Icon ──────────────────────────────────────────────────────────────

function SignalIcon({ status }: { status: 'pass' | 'fail' | 'warn' }) {
  const color = status === 'pass' ? 'var(--success)' : status === 'fail' ? 'var(--danger)' : 'var(--warn)';
  return (
    <div className={`signal-check ${status}`}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
        {status === 'pass' && <polyline points="20 6 9 17 4 12" />}
        {status === 'fail' && (
          <>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </>
        )}
        {status === 'warn' && <line x1="12" y1="5" x2="12" y2="13" />}
      </svg>
    </div>
  );
}

// ─── Build signals from NLU ───────────────────────────────────────────────────

function buildSignals(slide: SlideAnalysis): { nm: string; s: 'pass' | 'fail' | 'warn' }[] {
  const sigs: { nm: string; s: 'pass' | 'fail' | 'warn' }[] = [];
  const { nluResult } = slide;

  const sentStatus = nluResult.sentiment.label === 'positive' ? 'pass'
    : nluResult.sentiment.label === 'negative' ? 'fail' : 'warn';
  sigs.push({ nm: `Sentiment: ${nluResult.sentiment.label}`, s: sentStatus });

  const topKeywords = nluResult.keywords.slice(0, 3);
  if (topKeywords.length > 0) {
    sigs.push({ nm: `Key terms present: ${topKeywords.map((k) => k.text).join(', ')}`, s: 'pass' });
  } else {
    sigs.push({ nm: 'No strong keywords detected', s: 'warn' });
  }

  for (const tone of nluResult.tone) {
    if (tone.score > 0.6) {
      const bad = ['frustrated', 'impolite', 'sad'].includes(tone.label);
      sigs.push({ nm: `Tone: ${tone.label}`, s: bad ? 'warn' : 'pass' });
    }
  }

  const scoreEntries = Object.entries(slide.graniteScores) as [string, { score: number; rationale: string }][];
  const lowest = scoreEntries.sort((a, b) => a[1].score - b[1].score)[0];
  if (lowest && lowest[1].score < 5) {
    sigs.push({ nm: `Weak area: ${formatDimension(lowest[0])}`, s: 'fail' });
  }

  if (slide.slideHealthScore >= 70) sigs.push({ nm: 'Slide health: strong', s: 'pass' });
  else if (slide.slideHealthScore >= 50) sigs.push({ nm: 'Slide health: needs work', s: 'warn' });
  else sigs.push({ nm: 'Slide health: critical', s: 'fail' });

  return sigs;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function SlideReviewPage() {
  const [analysis, setAnalysis] = useState<DeckAnalysisResult | null>(null);
  const [deckFileName, setDeckFileName] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCritiqueTab, setActiveCritiqueTab] = useState<'critique' | 'signals' | 'rewrite'>('critique');
  const [isLight, setIsLight] = useState(false);
  const [rewrites, setRewrites] = useState<Record<number, string>>({});
  const [rewriteLoading, setRewriteLoading] = useState<Record<number, boolean>>({});

  const searchParams = useSearchParams();

  useEffect(() => {
    const stored = localStorage.getItem('deckiq-mode');
    if (stored === 'light') setIsLight(true);
    const raw = sessionStorage.getItem('deckiq-analysis');
    if (raw) {
      try { setAnalysis(JSON.parse(raw)); } catch { /* corrupt */ }
    }
    setDeckFileName(sessionStorage.getItem('deckiq-filename') ?? '');

    // Read slide query parameter and set initial slide
    const slideParam = searchParams.get('slide');
    if (slideParam) {
      const slideNum = parseInt(slideParam, 10);
      if (!isNaN(slideNum) && slideNum > 0) {
        // slideToFix is 1-based, currentSlide is 0-based
        setCurrentSlide(slideNum - 1);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    document.body.classList.toggle('light', isLight);
    localStorage.setItem('deckiq-mode', isLight ? 'light' : 'dark');
  }, [isLight]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const total = analysis?.perSlideAnalysis.length ?? 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setCurrentSlide((c) => Math.min(c + 1, total - 1));
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setCurrentSlide((c) => Math.max(c - 1, 0));
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [analysis]);

  useEffect(() => {
    setActiveCritiqueTab('critique');
  }, [currentSlide]);

  const slides = analysis?.perSlideAnalysis ?? [];
  const totalSlides = slides.length;
  const slide = slides[currentSlide];

  const navigate = (dir: -1 | 1) => {
    setCurrentSlide((c) => Math.max(0, Math.min(c + dir, totalSlides - 1)));
  };

  async function fetchRewrite(slideIdx: number) {
    if (!slide) return;
    const fix = analysis?.criticalFixes.find((f) => f.slideToFix === slide.slideNumber);
    const fixInstruction = fix?.fix ?? `Improve this ${slide.slideType} slide for investor readiness.`;

    setRewriteLoading((prev) => ({ ...prev, [slideIdx]: true }));
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideNumber: slide.slideNumber,
          slideType: slide.slideType,
          originalText: slide.rawText,
          fixInstruction,
          nluSnapshot: {
            sentiment: slide.nluResult.sentiment.label,
            problematicTones: slide.nluResult.tone
              .filter((t) => t.score > 0.6 && ['frustrated', 'impolite', 'sad'].includes(t.label))
              .map((t) => t.label),
          },
        }),
      });
      if (res.ok) {
        const data = await res.json() as { rewrittenText: string };
        setRewrites((prev) => ({ ...prev, [slideIdx]: data.rewrittenText }));
      } else {
        setRewrites((prev) => ({ ...prev, [slideIdx]: 'Rewrite unavailable. Please try again.' }));
      }
    } catch {
      setRewrites((prev) => ({ ...prev, [slideIdx]: 'Network error. Please try again.' }));
    } finally {
      setRewriteLoading((prev) => ({ ...prev, [slideIdx]: false }));
    }
  }

  async function handleApplyAndRescore(slideIdx: number) {
    if (!slide || !rewrites[slideIdx]) return;
    
    try {
      const res = await fetch('/api/rescore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewrittenText: rewrites[slideIdx],
          slideNumber: slide.slideNumber,
          slideType: slide.slideType,
        }),
      });
      
      if (res.ok) {
        const data = await res.json() as { slideHealthScore: number; graniteScores: RubricScores; nluResult: NLUResult };

        // Update the slide in analysis state
        if (analysis) {
          const updatedSlides = [...analysis.perSlideAnalysis];
          updatedSlides[slideIdx] = {
            ...updatedSlides[slideIdx],
            slideHealthScore: data.slideHealthScore,
            graniteScores: data.graniteScores,
            rawText: rewrites[slideIdx],
          };

          // Recalculate aggregated rubric scores
          const weights: Record<string, number> = {
            problemClarity: 0.10, solutionFit: 0.10, marketSize: 0.10,
            tractionEvidence: 0.20, businessModel: 0.10, competitiveMoat: 0.08,
            teamStrength: 0.12, askClarity: 0.10, narrativeFlow: 0.08, investorReadiness: 0.02,
          };
          const dimKeys = Object.keys(weights) as (keyof RubricScores)[];
          let newWeightedSum = 0;
          for (const dim of dimKeys) {
            const avg = updatedSlides.reduce((sum, s) => sum + s.graniteScores[dim].score, 0) / updatedSlides.length;
            newWeightedSum += avg * weights[dim];
          }
          const newOverallScore = Math.round(newWeightedSum * 10);

          const updatedAnalysis = {
            ...analysis,
            perSlideAnalysis: updatedSlides,
            overallScore: newOverallScore,
          };
          
          setAnalysis(updatedAnalysis);
          sessionStorage.setItem('deckiq-analysis', JSON.stringify(updatedAnalysis));
        }
      }
    } catch (err) {
      console.error('Rescore failed:', err);
    }
  }

  const CIRCUMFERENCE = 138;

  if (!analysis || totalSlides === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', color: 'var(--muted)' }}>
        <p style={{ fontSize: '18px' }}>No analysis found.</p>
        <Link href="/upload" className="btn btn-primary btn-md">Upload a deck →</Link>
      </div>
    );
  }

  const slideRingOffset = slide
    ? CIRCUMFERENCE - (slide.slideHealthScore / 100) * CIRCUMFERENCE
    : CIRCUMFERENCE;

  const scoreDims = slide
    ? (Object.entries(slide.graniteScores) as [string, { score: number; rationale: string }][])
    : [];
  const topDim = scoreDims.sort((a, b) => b[1].score - a[1].score)[0];
  const bottomDim = [...scoreDims].sort((a, b) => a[1].score - b[1].score)[0];

  const feedback = slide
    ? `${topDim ? `Strength: ${topDim[1].rationale}` : ''} ${bottomDim && bottomDim[1].score < 6 ? `\n\nWeakness: ${bottomDim[1].rationale}` : ''}`.trim()
    : '';

  const matchingFix = analysis.criticalFixes.find((f) => f.slideToFix === slide?.slideNumber);
  const suggestion = matchingFix?.fix ?? (bottomDim ? `Improve ${formatDimension(bottomDim[0])}: ${bottomDim[1].rationale}` : 'No specific suggestion.');

  const signals = slide ? buildSignals(slide) : [];

  return (
    <div className="app-shell" style={{ display: 'grid', gridTemplateRows: '60px 1fr 80px', height: '100vh' }}>
      {/* NAV */}
      <nav className="nav" style={{ position: 'relative', top: 0 }}>
        <div className="container">
          <div className="nav-inner">
            <Link href="/" className="nav-logo">Deck<span>IQ</span></Link>
            <div className="nav-links">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/slide-review" style={{ color: 'var(--ink)' }}>Review</Link>
              <Link href="/report">Report</Link>
            </div>
            <div className="nav-actions" style={{ gap: 'var(--sp-md)' }}>
              <button className="mode-toggle" onClick={() => setIsLight((v) => !v)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>
                {deckFileName || 'Deck'} · {totalSlides} slides
              </span>
              <Link href="/report" className="btn btn-primary btn-md">Full report →</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* REVIEW LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', overflow: 'hidden' }}>
        {/* Left: slide viewer */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--sp-xxl)', background: 'var(--surface-deep)',
          position: 'relative', overflow: 'hidden',
        }}>
          {slide && (
            <div style={{
              width: '100%', maxWidth: '760px', aspectRatio: '16 / 9',
              borderRadius: 'var(--r-md)', overflow: 'hidden', position: 'relative',
              boxShadow: '0 32px 64px rgba(0,0,0,0.5)', transition: 'opacity .2s',
              background: slide.image ? '#000' : slideBg(slide.slideType),
            }}>
              {slide.image ? (
                <img
                  src={`data:${slide.imageMime ?? 'image/jpeg'};base64,${slide.image}`}
                  alt={`Slide ${slide.slideNumber}`}
                  className="w-full h-full object-contain"
                  style={{ borderRadius: 'var(--r-md)' }}
                  draggable={false}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: 'clamp(20px, 4%, 48px)' }}>
                  <RealSlideContent rawText={slide.rawText} slideType={slide.slideType} />
                </div>
              )}
              <span style={{
                position: 'absolute', bottom: '16px', right: '16px',
                fontFamily: 'var(--font-mono)', fontSize: '11px',
                color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em',
              }}>
                {String(slide.slideNumber).padStart(2, '0')} / {totalSlides}
              </span>
              {slide.usedOcr && (
                <span style={{
                  position: 'absolute', bottom: '16px', left: '16px',
                  fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
                  color: 'rgba(255,200,80,0.9)', letterSpacing: '0.06em',
                  background: 'rgba(255,200,80,0.12)', border: '1px solid rgba(255,200,80,0.3)',
                  borderRadius: '4px', padding: '2px 7px',
                }}>
                  OCR extracted
                </span>
              )}
            </div>
          )}

          {/* Nav arrows */}
          <div style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            display: 'flex', justifyContent: 'space-between',
            width: 'calc(100% - var(--sp-xxl) * 2)', pointerEvents: 'none',
          }}>
            <button onClick={() => navigate(-1)} disabled={currentSlide === 0} style={{
              width: '40px', height: '40px', borderRadius: 'var(--r-full)',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'all', transition: 'all .15s', opacity: currentSlide === 0 ? 0.3 : 1,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button onClick={() => navigate(1)} disabled={currentSlide === totalSlides - 1} style={{
              width: '40px', height: '40px', borderRadius: 'var(--r-full)',
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', cursor: currentSlide === totalSlides - 1 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'all', transition: 'all .15s', opacity: currentSlide === totalSlides - 1 ? 0.3 : 1,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Slide counter */}
          <span style={{
            position: 'absolute', bottom: 'var(--sp-lg)',
            fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(255,255,255,0.4)',
          }}>
            {currentSlide + 1} / {totalSlides}
          </span>
        </div>

        {/* Right: critique panel */}
        <aside style={{ borderLeft: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            padding: 'var(--sp-lg) var(--sp-xl)', borderBottom: '1px solid var(--hairline)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--ink)' }}>
                {slide?.slideType ?? '—'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Slide {slide ? String(slide.slideNumber).padStart(2, '0') : '—'} · Score {
                  slide && slide.slideHealthScore === 0 && ['Title', 'Other'].includes(slide.slideType)
                    ? '—'
                    : slide?.slideHealthScore ?? '—'
                }
                {slide?.usedOcr && (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600,
                    color: 'rgb(200,150,40)', background: 'rgba(255,200,80,0.1)',
                    border: '1px solid rgba(255,200,80,0.25)', borderRadius: '4px', padding: '1px 6px',
                  }}>
                    OCR
                  </span>
                )}
              </div>
            </div>

            {/* Score ring */}
            <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
              <svg viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)', width: '56px', height: '56px' }}>
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                <circle
                  cx="28" cy="28" r="22" fill="none"
                  stroke={slideColor(slide?.slideHealthScore ?? null)}
                  strokeWidth="5" strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={slideRingOffset} strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {slide && slide.slideHealthScore === 0 && ['Title', 'Other'].includes(slide.slideType) ? (
                  <>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800, color: 'var(--muted)', lineHeight: 1 }}>
                      —
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      N/A
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
                      {slide?.slideHealthScore ?? '—'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      score
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Critique body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--sp-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 'var(--sp-xs)' }}>
              {(['critique', 'signals', 'rewrite'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveCritiqueTab(tab)} className={`ctab${activeCritiqueTab === tab ? ' active' : ''}`}>
                  {tab === 'critique' ? 'Feedback' : tab === 'signals' ? 'Signals' : 'Rewrite'}
                </button>
              ))}
            </div>

            {/* Feedback tab */}
            {activeCritiqueTab === 'critique' && (
              <>
                <div className="critique-summary">
                  <div className="critique-label">Analysis</div>
                  <div className="critique-text" style={{ whiteSpace: 'pre-line' }}>{feedback}</div>
                </div>
                <div className="suggestion-card">
                  <div className="suggestion-label">Suggestion</div>
                  <div className="suggestion-text">{suggestion}</div>
                </div>
              </>
            )}

            {/* Signals tab */}
            {activeCritiqueTab === 'signals' && (
              <div className="critique-summary">
                <div className="critique-label">VC signal checklist</div>
                <div className="signal-grid">
                  {signals.map((sig, i) => (
                    <div key={i} className="signal-item">
                      <SignalIcon status={sig.s} />
                      <span className="signal-nm">{sig.nm}</span>
                      <span className={`signal-res ${sig.s}`}>
                        {sig.s === 'pass' ? 'Pass' : sig.s === 'fail' ? 'Fail' : 'Partial'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Context Display (shown in all tabs if available) */}
            {slide?.visualContext && (slide.visualContext.hasCharts || slide.visualContext.hasImages || slide.visualContext.hasTables) && (
              <div style={{
                marginTop: activeCritiqueTab === 'critique' ? 'var(--sp-lg)' : 0,
                padding: 'var(--sp-md)',
                borderRadius: 'var(--r-md)',
                background: 'rgba(100,150,255,0.05)',
                border: '1px solid rgba(100,150,255,0.15)',
              }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'rgba(100,150,255,0.9)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 'var(--sp-sm)',
                }}>
                  📊 Visual Analysis
                </div>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--ink)',
                  lineHeight: 1.5,
                  marginBottom: 'var(--sp-sm)',
                }}>
                  {slide.visualContext.layoutDescription}
                </p>
                <div style={{ display: 'flex', gap: 'var(--sp-xs)', flexWrap: 'wrap', marginBottom: 'var(--sp-sm)' }}>
                  {slide.visualContext.hasCharts && (
                    <span style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      background: 'rgba(59,130,246,0.15)',
                      color: 'rgb(96,165,250)',
                      border: '1px solid rgba(59,130,246,0.25)',
                      fontWeight: 500,
                    }}>
                      📊 Chart detected
                    </span>
                  )}
                  {slide.visualContext.hasImages && (
                    <span style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      background: 'rgba(34,197,94,0.15)',
                      color: 'rgb(74,222,128)',
                      border: '1px solid rgba(34,197,94,0.25)',
                      fontWeight: 500,
                    }}>
                      🖼️ Image detected
                    </span>
                  )}
                  {slide.visualContext.hasTables && (
                    <span style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      background: 'rgba(168,85,247,0.15)',
                      color: 'rgb(192,132,252)',
                      border: '1px solid rgba(168,85,247,0.25)',
                      fontWeight: 500,
                    }}>
                      📋 Table detected
                    </span>
                  )}
                </div>
                
                {/* Design Quality Section */}
                {slide.visualContext.designScore && (
                  <div style={{
                    marginTop: 'var(--sp-md)',
                    paddingTop: 'var(--sp-md)',
                    borderTop: '1px solid rgba(100,150,255,0.2)',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 'var(--sp-xs)',
                    }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(100,150,255,0.9)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}>
                        Design Quality
                      </span>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: slide.visualContext.designScore >= 7 ? 'rgb(74,222,128)' :
                               slide.visualContext.designScore >= 5 ? 'rgb(250,204,21)' : 'rgb(248,113,113)',
                      }}>
                        {slide.visualContext.designScore}/10
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      marginBottom: 'var(--sp-sm)',
                    }}>
                      {slide.visualContext.densityRating && (
                        <span style={{
                          padding: '3px 8px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          background: 'rgba(100,150,255,0.15)',
                          color: 'rgb(147,197,253)',
                          border: '1px solid rgba(100,150,255,0.25)',
                          fontWeight: 500,
                        }}>
                          {slide.visualContext.densityRating}
                        </span>
                      )}
                      {slide.visualContext.whitespaceQuality && (
                        <span style={{
                          padding: '3px 8px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          background: 'rgba(100,150,255,0.15)',
                          color: 'rgb(147,197,253)',
                          border: '1px solid rgba(100,150,255,0.25)',
                          fontWeight: 500,
                        }}>
                          {slide.visualContext.whitespaceQuality}
                        </span>
                      )}
                      {slide.visualContext.colorDiscipline && (
                        <span style={{
                          padding: '3px 8px',
                          fontSize: '11px',
                          borderRadius: '4px',
                          background: 'rgba(100,150,255,0.15)',
                          color: 'rgb(147,197,253)',
                          border: '1px solid rgba(100,150,255,0.25)',
                          fontWeight: 500,
                        }}>
                          {slide.visualContext.colorDiscipline}
                        </span>
                      )}
                    </div>
                    {slide.visualContext.designFeedback && (
                      <p style={{
                        fontSize: '12px',
                        color: 'var(--ink-light)',
                        lineHeight: 1.4,
                      }}>
                        {slide.visualContext.designFeedback}
                      </p>
                    )}
                  </div>
                )}

                {slide.visualContext.chartData && (
                  <div style={{ marginTop: 'var(--sp-sm)' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      marginBottom: '4px',
                    }}>
                      Chart Data:
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--ink-light)',
                      lineHeight: 1.4,
                    }}>
                      {slide.visualContext.chartData}
                    </p>
                  </div>
                )}
                {slide.visualContext.tableData && (
                  <div style={{ marginTop: 'var(--sp-sm)' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      marginBottom: '4px',
                    }}>
                      Table Data:
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--ink-light)',
                      lineHeight: 1.4,
                    }}>
                      {slide.visualContext.tableData}
                    </p>
                  </div>
                )}
                {slide.visualContext.imageDescriptions && (
                  <div style={{ marginTop: 'var(--sp-sm)' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--muted)',
                      marginBottom: '4px',
                    }}>
                      Images:
                    </div>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--ink-light)',
                      lineHeight: 1.4,
                    }}>
                      {slide.visualContext.imageDescriptions}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Rewrite tab */}
            {activeCritiqueTab === 'rewrite' && (
              <div className="rewrite-block">
                <div className="rewrite-tabs">
                  <div className="rtab active">AI-generated rewrite</div>
                </div>
                {rewrites[currentSlide] ? (
                  <>
                    {/* Slide preview of rewritten content */}
                    <div style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      borderRadius: 'var(--r-md)',
                      overflow: 'hidden',
                      background: slideBg(slide.slideType),
                      position: 'relative',
                      marginBottom: 'var(--sp-md)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                    }}>
                      <div style={{ position: 'absolute', inset: 0, padding: 'clamp(14px, 3%, 28px)' }}>
                        <RealSlideContent rawText={rewrites[currentSlide]} slideType={slide.slideType} />
                      </div>
                      <span style={{
                        position: 'absolute', bottom: '10px', right: '12px',
                        fontFamily: 'var(--font-mono)', fontSize: '9px',
                        color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em',
                      }}>
                        AI REWRITE
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--sp-md)', marginTop: 'var(--sp-md)' }}>
                      <button
                        onClick={() => navigator.clipboard.writeText(rewrites[currentSlide])}
                        className="btn btn-outline btn-md"
                        style={{ flex: 1 }}
                      >
                        Copy to clipboard
                      </button>
                      <button
                        onClick={() => handleApplyAndRescore(currentSlide)}
                        className="btn btn-primary btn-md"
                        style={{ flex: 1 }}
                      >
                        Apply & Rescore →
                      </button>
                    </div>
                  </>
                ) : rewriteLoading[currentSlide] ? (
                  <div style={{ padding: 'var(--sp-lg)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    Generating rewrite…
                  </div>
                ) : (
                  <div style={{ padding: 'var(--sp-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-md)' }}>
                    <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
                      Generate an AI-powered rewrite suggestion for this slide based on investor feedback.
                    </p>
                    <button
                      onClick={() => fetchRewrite(currentSlide)}
                      className="btn btn-primary btn-md"
                      style={{ alignSelf: 'flex-start' }}
                    >
                      Generate rewrite →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* SLIDE STRIP */}
      <div style={{
        borderTop: '1px solid var(--hairline)', background: 'var(--surface)',
        display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
        padding: 'var(--sp-sm) var(--sp-xl)', overflowX: 'auto',
      }}>
        {slides.map((s, i) => (
          <button key={s.slideNumber} onClick={() => setCurrentSlide(i)} style={{
            flexShrink: 0, width: '80px', height: '45px', borderRadius: 'var(--r-sm)',
            background: s.image ? '#000' : slideBg(s.slideType),
            border: `2px solid ${i === currentSlide ? 'var(--primary)' : 'var(--hairline)'}`,
            cursor: 'pointer', position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color .15s', padding: 0,
          }}>
            {s.image ? (
              <img
                src={`data:${s.imageMime ?? 'image/jpeg'};base64,${s.image}`}
                alt={`Slide ${s.slideNumber}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                draggable={false}
              />
            ) : (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', position: 'relative', zIndex: 1 }}>
                {String(s.slideNumber).padStart(2, '0')}
              </span>
            )}
            <div style={{
              position: 'absolute', bottom: '3px', right: '4px',
              width: '6px', height: '6px', borderRadius: '50%',
              background: slideColor(s.slideHealthScore),
              border: '1px solid rgba(0,0,0,0.3)',
              zIndex: 2,
            }} />
          </button>
        ))}
      </div>
    </div>
  );
}
