'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Signal {
  nm: string;
  s: 'pass' | 'fail' | 'warn';
}

interface SlideData {
  num: number;
  name: string;
  category: string;
  score: number | null;
  bg: string;
  content: React.ReactNode;
  feedback: string;
  signals: Signal[];
  suggestion: string;
  rewrite: string;
}

// ─── Slide Content Components ─────────────────────────────────────────────────

function CoverContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '16px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 800, color: '#f0ede5', letterSpacing: '-2px', lineHeight: 1 }}>Luminary AI</div>
      <div style={{ fontSize: 'clamp(12px,2vw,18px)', color: 'rgba(240,237,229,0.5)' }}>Ambient AI for the modern enterprise</div>
      <div style={{ marginTop: '8px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: '9999px', color: 'rgba(240,237,229,0.5)' }}>Series A</span>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', background: 'rgba(255,255,255,0.08)', padding: '4px 12px', borderRadius: '9999px', color: 'rgba(240,237,229,0.5)' }}>October 2025</span>
      </div>
    </div>
  );
}

function ProblemContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px,3vw,32px)', fontWeight: 800, color: '#f0ede5', letterSpacing: '-1px', lineHeight: 1.1 }}>
        Executives waste 31 hours/week<br />in meetings that don&apos;t move the business.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: 'auto' }}>
        {[
          { num: '$180B', label: 'annual productivity cost (McKinsey)' },
          { num: '71%', label: 'of meetings rated "unproductive"' },
          { num: '0%', label: 'of current tools eliminate the problem' },
        ].map(({ num, label }) => (
          <div key={num} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3.5vw,36px)', fontWeight: 800, color: '#ea2804' }}>{num}</div>
            <div style={{ fontSize: '11px', color: 'rgba(240,237,229,0.5)', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SolutionContent() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2.5vw,24px)', fontWeight: 800, color: '#f0ede5', textAlign: 'center', padding: '20px' }}>
      Solution slide — Ambient AI captures, summarizes, and acts on meetings without a bot in the room.
    </div>
  );
}

function MarketContent() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2.5vw,24px)', fontWeight: 800, color: '#f0ede5', textAlign: 'center', padding: '20px' }}>
      Market size slide — $180B TAM, $24B SAM (US enterprise), $480M SOM (5% capture in 5 years)
    </div>
  );
}

function BusinessModelContent() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2.5vw,24px)', fontWeight: 800, color: '#f0ede5', textAlign: 'center', padding: '20px' }}>
      Business Model — Per-seat SaaS $29/user/month. Enterprise contract $15K-80K ARR. Expansion revenue through seat growth.
    </div>
  );
}

function TractionContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2.5vw,24px)', fontWeight: 800, color: '#f0ede5', letterSpacing: '-0.5px' }}>Traction</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
        {[
          { val: '$48K', label: 'Monthly Recurring Revenue', labelColor: undefined },
          { val: '24', label: 'Enterprise customers', labelColor: undefined },
          { val: '92%', label: 'Annual retention', labelColor: undefined },
          { val: '—', label: 'MoM growth rate (missing)', labelColor: '#dc2626' },
        ].map(({ val, label, labelColor }) => (
          <div key={val + label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3.5vw,40px)', fontWeight: 800, color: '#f0ede5' }}>{val}</div>
            <div style={{ fontSize: '11px', color: labelColor ?? 'rgba(240,237,229,0.5)' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompetitionContent() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2.5vw,24px)', fontWeight: 800, color: '#f0ede5', textAlign: 'center', padding: '20px' }}>
      Competition matrix — 2x2 grid: Price vs. Features. Luminary positioned top-right.
    </div>
  );
}

function GTMContent() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2.5vw,24px)', fontWeight: 800, color: '#f0ede5', textAlign: 'center', padding: '20px' }}>
      GTM slide — 5 channels: Content, PLG, Outbound, Partnerships, Events
    </div>
  );
}

function TeamContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2.5vw,24px)', fontWeight: 800, color: '#f0ede5', letterSpacing: '-0.5px' }}>Team</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
        {[
          { name: 'Arjun Patel', role: 'CEO & Co-founder', bio: 'Former PM at Salesforce\nStanford MBA' },
          { name: 'Maya Chen', role: 'CTO & Co-founder', bio: 'Former ML Lead at Zoom\nPhD Berkeley' },
        ].map(({ name, role, bio }) => (
          <div key={name} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2a2a2a', margin: '0 auto 8px', border: '1px solid rgba(255,255,255,0.1)' }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0ede5' }}>{name}</div>
            <div style={{ fontSize: '11px', color: 'rgba(240,237,229,0.5)', marginTop: '2px' }}>{role}</div>
            <div style={{ fontSize: '11px', color: 'rgba(240,237,229,0.4)', marginTop: '6px', whiteSpace: 'pre-line' }}>{bio}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapContent() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2.5vw,24px)', fontWeight: 800, color: '#f0ede5', textAlign: 'center', padding: '20px' }}>
      Roadmap — Q4&apos;25 Security certs. Q1&apos;26 EU launch. Q2&apos;26 Salesforce integration. Q3&apos;26 Series A.
    </div>
  );
}

function FinancialsContent() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2.5vw,24px)', fontWeight: 800, color: '#f0ede5', textAlign: 'center', padding: '20px' }}>
      Financials — Year 1: $576K ARR. Year 2: $2.4M ARR. Year 3: $8.4M ARR. (3-year projection)
    </div>
  );
}

function AskContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2.5vw,24px)', fontWeight: 800, color: '#f0ede5', letterSpacing: '-0.5px' }}>The Ask</div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginTop: '8px' }}>
        <div style={{ background: 'rgba(234,40,4,0.1)', border: '1px solid rgba(234,40,4,0.25)', borderRadius: '8px', padding: '16px 24px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: '#ea2804', letterSpacing: '-2px' }}>$3M</div>
          <div style={{ fontSize: '11px', color: 'rgba(240,237,229,0.5)' }}>Seed round</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {['40% Engineering (3 hires)', '30% Sales & Marketing', '20% Infrastructure & AI', '10% Operations'].map((item) => (
            <div key={item} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: 'rgba(240,237,229,0.7)' }}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Slide Data ───────────────────────────────────────────────────────────────

const ALL_SLIDES: SlideData[] = [
  {
    num: 1, name: 'Cover', category: 'Title slide', score: null,
    bg: 'linear-gradient(135deg,#0d0d0d 0%,#1a1a1a 100%)',
    content: <CoverContent />,
    feedback: 'Cover slide sets the frame but lacks a one-liner tagline. Investors decide whether to keep reading in the first 8 seconds.',
    signals: [
      { nm: 'Company name clear', s: 'pass' },
      { nm: 'One-liner tagline present', s: 'fail' },
      { nm: 'Stage and date indicated', s: 'pass' },
      { nm: 'Contact info / logo present', s: 'pass' },
    ],
    suggestion: 'Add a one-liner directly under the company name: "Luminary AI reduces enterprise meeting overhead by 70% using ambient AI that writes the notes, assigns the tasks, and never joins the call."',
    rewrite: `CURRENT
"Ambient AI for the modern enterprise"

SUGGESTED
"Luminary AI cuts enterprise meeting overhead by 70%.
 Ambient AI. No bot. No friction."

WHY: Specific > generic. "Modern enterprise" is filler.
     A number anchors the claim in investor memory.`,
  },
  {
    num: 2, name: 'The Problem', category: 'Pain point', score: 92,
    bg: 'linear-gradient(135deg,#0d1117 0%,#1a2030 100%)',
    content: <ProblemContent />,
    feedback: 'Excellent problem slide. Pain is quantified with a credible third-party source, the problem is investor-recognized, and the urgency is felt without being manufactured.',
    signals: [
      { nm: 'Pain quantified with data', s: 'pass' },
      { nm: 'Source cited (McKinsey)', s: 'pass' },
      { nm: 'Problem investor-recognized', s: 'pass' },
      { nm: 'Urgency without hysteria', s: 'pass' },
      { nm: 'Current solutions addressed', s: 'warn' },
    ],
    suggestion: "Near-perfect. Add one sentence acknowledging that Zoom/Notion/Otter exist but don't solve the problem — this pre-empts the \"what about [existing tool]?\" question.",
    rewrite: `ADD TO BOTTOM:
"Zoom records it. Otter transcribes it.
 Neither acts on it. We do."`,
  },
  {
    num: 3, name: 'Our Solution', category: 'Product', score: 78,
    bg: 'linear-gradient(135deg,#0f1a10,#1a2d1b)',
    content: <SolutionContent />,
    feedback: 'Product is explained clearly in one slide.',
    signals: [
      { nm: 'One-slide product summary', s: 'pass' },
      { nm: 'Workflow diagram present', s: 'pass' },
      { nm: 'Moat / differentiation clear', s: 'warn' },
    ],
    suggestion: "Add one sentence on defensibility: what makes this hard to copy?",
    rewrite: `Add: "Our ambient capture pipeline runs entirely on-device — no audio ever leaves the building. That's the moat."`,
  },
  {
    num: 4, name: 'Market Size', category: 'TAM/SAM/SOM', score: 82,
    bg: 'linear-gradient(135deg,#10101a,#1a1a2d)',
    content: <MarketContent />,
    feedback: 'Bottom-up TAM with source. SAM logic is clean.',
    signals: [
      { nm: 'TAM sourced credibly', s: 'pass' },
      { nm: 'Bottom-up SAM', s: 'pass' },
      { nm: 'SOM is achievable', s: 'pass' },
    ],
    suggestion: 'Strong. No major changes needed.',
    rewrite: `Keep as-is. Possibly add one line about the TAM growth rate (AI productivity market growing at 34% CAGR).`,
  },
  {
    num: 5, name: 'Business Model', category: 'Revenue', score: 74,
    bg: 'linear-gradient(135deg,#161210,#251c18)',
    content: <BusinessModelContent />,
    feedback: 'Per-seat SaaS is clear. Enterprise contract size mentioned.',
    signals: [
      { nm: 'Pricing model clear', s: 'pass' },
      { nm: 'ACV range stated', s: 'pass' },
      { nm: 'Expansion revenue path', s: 'warn' },
    ],
    suggestion: 'Add LTV:CAC ratio if you have it. Even an estimate signals financial sophistication.',
    rewrite: `Add: "Avg LTV $8,200 · CAC $1,400 · LTV:CAC 5.9x · Payback 4.2 months"`,
  },
  {
    num: 6, name: 'Traction', category: 'Metrics', score: 45,
    bg: 'linear-gradient(135deg,#160e0e 0%,#2d1414 100%)',
    content: <TractionContent />,
    feedback: 'Critical issue. The numbers are real and impressive, but without a month-over-month growth rate, VCs cannot model momentum. A static $48K MRR could be growing 3% or 40% per month — the difference between a pass and a term sheet.',
    signals: [
      { nm: 'MRR or ARR present', s: 'pass' },
      { nm: 'Growth rate shown', s: 'fail' },
      { nm: 'Retention rate present', s: 'pass' },
      { nm: 'Customer count credible', s: 'pass' },
      { nm: 'Logo-wall or case study', s: 'fail' },
      { nm: 'Cohort or momentum chart', s: 'fail' },
    ],
    suggestion: 'Add MoM growth rate as the primary headline metric. Even 15% MoM changes this from "static company" to "rocket ship." Show a 6-month sparkline chart — not a table, a line going up-right.',
    rewrite: `REPLACE STATIC BOX WITH:

Headline: "$48K MRR · Growing 23% month-over-month"
Subline:  "12-month ARR run rate: $576K"

ADD: Mini sparkline chart showing last 6 months
     Feb $21K → Mar $27K → Apr $34K → May $40K → Jun $44K → Jul $48K

WHY: The shape of growth is more valuable than the number.`,
  },
  {
    num: 7, name: 'Competition', category: 'Landscape', score: 66,
    bg: 'linear-gradient(135deg,#121418,#1d2026)',
    content: <CompetitionContent />,
    feedback: "Matrix present but axes don't show your actual moat.",
    signals: [
      { nm: 'Competition acknowledged', s: 'pass' },
      { nm: 'Axes show real moat', s: 'fail' },
      { nm: 'Named competitors listed', s: 'pass' },
    ],
    suggestion: "Replace Price vs. Features with Integration depth vs. On-device AI accuracy. That's where you win.",
    rewrite: `REPLACE AXES:
X: "Requires cloud processing" → "On-device processing"
Y: "Feature-limited" → "Full-workflow automation"

Positions you uniquely — Otter and Zoom are stuck on the left.`,
  },
  {
    num: 8, name: 'Go-to-Market', category: 'Strategy', score: 69,
    bg: 'linear-gradient(135deg,#0f1318,#181d24)',
    content: <GTMContent />,
    feedback: '5 channels listed equally. Pick one primary and size it.',
    signals: [
      { nm: 'Primary channel identified', s: 'fail' },
      { nm: 'CAC by channel', s: 'fail' },
      { nm: 'GTM motion matches ACV', s: 'warn' },
    ],
    suggestion: 'Enterprise ACV of $15K-80K requires outbound + partnerships, not PLG. Restructure around your motion.',
    rewrite: `REORDER:
1. Outbound SDR motion (primary — matches ACV)
2. Integration partnerships with Salesforce/HubSpot (leverage)
3. Content / SEO (brand + inbound)

Drop Events from the featured list.`,
  },
  {
    num: 9, name: 'Team', category: 'Founders', score: 52,
    bg: 'linear-gradient(135deg,#181314 0%,#261c1e 100%)',
    content: <TeamContent />,
    feedback: "Strong domain expertise — PM at Salesforce and ML Lead at Zoom are directly relevant. But the slide is missing the three credibility anchors that Series A VCs pattern-match: prior exits, advisor logos, and notable investors.",
    signals: [
      { nm: 'Domain expertise present', s: 'pass' },
      { nm: 'Prior exits mentioned', s: 'fail' },
      { nm: 'Advisor logos shown', s: 'fail' },
      { nm: 'Cofounder completeness', s: 'pass' },
      { nm: 'Relevant company logos', s: 'warn' },
      { nm: 'Why now / why you', s: 'fail' },
    ],
    suggestion: "Add a \"Backed by\" or \"Advisors\" section with 2-3 logo marks. Add a brief \"why us\" line: \"Arjun spent 4 years inside the problem at Salesforce. Maya built meeting AI at Zoom before it was mainstream.\" Show, don't just list.",
    rewrite: `ADD SECTION AT BOTTOM:
"Advisors" row with 2-3 logos (even pre-seed angels count)

ADD LINE BELOW EACH BIO:
Arjun: "4 years inside this exact problem at Salesforce —
        saw $40M wasted on meeting software that didn't work"
Maya:  "Built Zoom's AI transcription layer;
        knows where the bodies are buried"`,
  },
  {
    num: 10, name: 'Roadmap', category: '18-month plan', score: 77,
    bg: 'linear-gradient(135deg,#141718,#1f2326)',
    content: <RoadmapContent />,
    feedback: 'Product milestones clear. Missing revenue checkpoints.',
    signals: [
      { nm: '18-month horizon', s: 'pass' },
      { nm: 'Product milestones', s: 'pass' },
      { nm: 'Revenue milestones', s: 'fail' },
    ],
    suggestion: 'Add ARR targets at each milestone. VCs track revenue, not features.',
    rewrite: `ADD TO EACH MILESTONE:
Q4'25: SOC 2 + "$0.8M ARR"
Q1'26: EU + "$1.4M ARR"
Q2'26: Salesforce integration + "$2.4M ARR"
Q3'26: Series A trigger → "$4M ARR"`,
  },
  {
    num: 11, name: 'Financials', category: 'Projections', score: 63,
    bg: 'linear-gradient(135deg,#141210,#20191a)',
    content: <FinancialsContent />,
    feedback: 'Hockey stick projections without stated assumptions. VCs discount this immediately.',
    signals: [
      { nm: '3-year projections present', s: 'pass' },
      { nm: 'Assumptions stated', s: 'fail' },
      { nm: 'Unit economics visible', s: 'fail' },
      { nm: 'Burn rate / runway', s: 'fail' },
    ],
    suggestion: 'Add one line of assumptions math under each year. "Year 2: 50 customers × $48K ACV = $2.4M ARR. Achievable with 3 AEs at 4 customers/quarter quota."',
    rewrite: `ADD ASSUMPTION MATH:
Year 1: "24 → 40 customers × $15K avg ACV"
Year 2: "40 → 90 customers × $27K avg ACV (expansion revenue)"
Year 3: "90 → 200 customers × $42K avg ACV"

ADD BURN: "$240K/month burn · 12.5 months runway on $3M"`,
  },
  {
    num: 12, name: 'The Ask', category: '$3M raise', score: 61,
    bg: 'linear-gradient(135deg,#1a0d0d 0%,#2d1414 100%)',
    content: <AskContent />,
    feedback: 'The amount is clear and the use-of-funds breakdown is present. The critical gap: the ask is not tied to milestones. VCs fund milestones, not operations. The slide needs to answer "what does $3M accomplish in 18 months?"',
    signals: [
      { nm: 'Raise amount stated clearly', s: 'pass' },
      { nm: 'Use of funds breakdown', s: 'pass' },
      { nm: '18-month milestones present', s: 'fail' },
      { nm: 'Series B trigger identified', s: 'fail' },
      { nm: 'Valuation / terms hinted', s: 'warn' },
      { nm: 'Current investors noted', s: 'fail' },
    ],
    suggestion: 'Reframe the narrative: "$3M takes us from $576K ARR to $2.4M ARR, 5→25 enterprise customers, and positions us for a $15M Series A at $40M+ ARR." The money is a means; the milestone is the story.',
    rewrite: `REPLACE STATIC BREAKDOWN WITH:

"$3M → 18 months → Series A ready"

Milestone 1 (Month 6):  $1.2M ARR, 12 enterprise logos,
                        2 integration partnerships live
Milestone 2 (Month 12): $2.4M ARR, SOC 2 certified,
                         EU data residency shipped
Milestone 3 (Month 18): $4M ARR → Series A at $40M+ ARR target`,
  },
];

// ─── Score Color Helper ───────────────────────────────────────────────────────

function scoreColor(score: number | null): string {
  if (score == null) return 'var(--muted)';
  if (score >= 75) return 'var(--success)';
  if (score >= 55) return 'var(--warn)';
  return 'var(--danger)';
}

function scoreStrokeColor(score: number | null): string {
  if (score == null) return 'var(--muted)';
  if (score >= 75) return 'var(--success)';
  if (score >= 55) return 'var(--warn)';
  return 'var(--danger)';
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
        {status === 'warn' && <polyline points="12 5 12 12 12 12" />}
      </svg>
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function SlideReviewPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCritiqueTab, setActiveCritiqueTab] = useState<'critique' | 'signals' | 'rewrite'>('critique');
  const [isLight, setIsLight] = useState(false);

  const slide = ALL_SLIDES[currentSlide];
  const CIRCUMFERENCE = 138;

  // Theme persistence
  useEffect(() => {
    const stored = localStorage.getItem('deckiq-mode');
    if (stored === 'light') setIsLight(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('light', isLight);
    localStorage.setItem('deckiq-mode', isLight ? 'light' : 'dark');
  }, [isLight]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setCurrentSlide((c) => Math.min(c + 1, ALL_SLIDES.length - 1));
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrentSlide((c) => Math.max(c - 1, 0));
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Reset critique tab when slide changes
  useEffect(() => {
    setActiveCritiqueTab('critique');
  }, [currentSlide]);

  const navigate = (dir: -1 | 1) => {
    setCurrentSlide((c) => Math.max(0, Math.min(c + dir, ALL_SLIDES.length - 1)));
  };

  const ringOffset = slide.score != null
    ? CIRCUMFERENCE - (slide.score / 100) * CIRCUMFERENCE
    : CIRCUMFERENCE;

  return (
    <div
      className="app-shell"
      style={{ display: 'grid', gridTemplateRows: '60px 1fr 80px', height: '100vh' }}
    >
      {/* ── NAV ── */}
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
                Luminary AI · 12 slides
              </span>
              <Link href="/report" className="btn btn-primary btn-md">Full report →</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── REVIEW LAYOUT ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          overflow: 'hidden',
        }}
      >
        {/* Left: slide viewer */}
        <div
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--sp-xxl)',
            background: 'var(--surface-deep)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Slide canvas */}
          <div
            style={{
              width: '100%', maxWidth: '760px', aspectRatio: '16 / 9',
              borderRadius: 'var(--r-md)',
              overflow: 'hidden', position: 'relative',
              boxShadow: '0 32px 64px rgba(0,0,0,0.5)',
              transition: 'opacity .2s',
              background: slide.bg,
            }}
          >
            <div
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                padding: 'clamp(20px, 4%, 48px)',
              }}
            >
              {slide.content}
            </div>
            <span
              style={{
                position: 'absolute', bottom: '16px', right: '16px',
                fontFamily: 'var(--font-mono)', fontSize: '11px',
                color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em',
              }}
            >
              {String(slide.num).padStart(2, '0')} / 12
            </span>
          </div>

          {/* Nav arrows */}
          <div
            style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              display: 'flex', justifyContent: 'space-between',
              width: 'calc(100% - var(--sp-xxl) * 2)',
              pointerEvents: 'none',
            }}
          >
            <button
              onClick={() => navigate(-1)}
              disabled={currentSlide === 0}
              style={{
                width: '40px', height: '40px', borderRadius: 'var(--r-full)',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)',
                cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'all', transition: 'all .15s',
                opacity: currentSlide === 0 ? 0.3 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => navigate(1)}
              disabled={currentSlide === ALL_SLIDES.length - 1}
              style={{
                width: '40px', height: '40px', borderRadius: 'var(--r-full)',
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)',
                cursor: currentSlide === ALL_SLIDES.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'all', transition: 'all .15s',
                opacity: currentSlide === ALL_SLIDES.length - 1 ? 0.3 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Slide counter */}
          <span
            style={{
              position: 'absolute', bottom: 'var(--sp-lg)',
              fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'rgba(255,255,255,0.4)',
            }}
          >
            {currentSlide + 1} / {ALL_SLIDES.length}
          </span>
        </div>

        {/* Right: critique panel */}
        <aside
          style={{
            borderLeft: '1px solid var(--hairline)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Critique header */}
          <div
            style={{
              padding: 'var(--sp-lg) var(--sp-xl)',
              borderBottom: '1px solid var(--hairline)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--ink)' }}>
                {slide.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                Slide {String(slide.num).padStart(2, '0')} · {slide.category}
              </div>
            </div>

            {/* Score ring */}
            <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
              <svg viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)', width: '56px', height: '56px' }}>
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                <circle
                  cx="28" cy="28" r="22"
                  fill="none"
                  stroke={scoreStrokeColor(slide.score)}
                  strokeWidth="5"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
                  {slide.score ?? '—'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '7px', color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  score
                </span>
              </div>
            </div>
          </div>

          {/* Critique body */}
          <div
            style={{
              flex: 1, overflowY: 'auto', padding: 'var(--sp-xl)',
              display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
            }}
          >
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 'var(--sp-xs)' }}>
              {(['critique', 'signals', 'rewrite'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCritiqueTab(tab)}
                  className={`ctab${activeCritiqueTab === tab ? ' active' : ''}`}
                >
                  {tab === 'critique' ? 'Feedback' : tab === 'signals' ? 'Signals' : 'Rewrite'}
                </button>
              ))}
            </div>

            {/* Feedback tab */}
            {activeCritiqueTab === 'critique' && (
              <>
                <div className="critique-summary">
                  <div className="critique-label">Analysis</div>
                  <div className="critique-text">{slide.feedback}</div>
                </div>
                <div className="suggestion-card">
                  <div className="suggestion-label">Suggestion</div>
                  <div className="suggestion-text">{slide.suggestion}</div>
                </div>
              </>
            )}

            {/* Signals tab */}
            {activeCritiqueTab === 'signals' && (
              <div className="critique-summary">
                <div className="critique-label">VC signal checklist</div>
                <div className="signal-grid">
                  {slide.signals.map((sig) => (
                    <div key={sig.nm} className="signal-item">
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

            {/* Rewrite tab */}
            {activeCritiqueTab === 'rewrite' && (
              <div className="rewrite-block">
                <div className="rewrite-tabs">
                  <div className="rtab active">Suggested rewrite</div>
                </div>
                <div className="rewrite-content">{slide.rewrite}</div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── SLIDE STRIP ── */}
      <div
        style={{
          borderTop: '1px solid var(--hairline)',
          background: 'var(--surface)',
          display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)',
          padding: 'var(--sp-sm) var(--sp-xl)',
          overflowX: 'auto',
        }}
      >
        {ALL_SLIDES.map((s, i) => (
          <button
            key={s.num}
            onClick={() => setCurrentSlide(i)}
            style={{
              flexShrink: 0, width: '64px', height: '40px', borderRadius: 'var(--r-sm)',
              background: s.bg,
              border: `1.5px solid ${i === currentSlide ? 'var(--primary)' : 'var(--hairline)'}`,
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color .15s',
              padding: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)',
                position: 'relative', zIndex: 1,
              }}
            >
              {String(s.num).padStart(2, '0')}
            </span>
            <div
              style={{
                position: 'absolute', bottom: '3px', right: '4px',
                width: '5px', height: '5px', borderRadius: '50%',
                background: scoreColor(s.score),
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
