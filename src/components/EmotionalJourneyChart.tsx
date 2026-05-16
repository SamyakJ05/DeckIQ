'use client';

import type { SlideAnalysis } from '@/types';

interface EmotionalJourneyChartProps {
  slides: SlideAnalysis[];
}

export function EmotionalJourneyChart({ slides }: EmotionalJourneyChartProps) {
  const data = slides.map((s, i) => ({
    slide: i + 1,
    sentiment: s.nluResult?.sentiment?.score ?? 0,
  }));

  // Chart dimensions
  const width = 800;
  const height = 160;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Scale functions
  const xScale = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
  const yScale = (sentiment: number) => padding.top + chartHeight - ((sentiment + 1) / 2) * chartHeight;

  // Generate path for line
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.sentiment)}`)
    .join(' ');

  // Generate insight
  const peak = data.reduce((a, b) => a.sentiment > b.sentiment ? a : b);
  const drop = data.reduce((a, b) => a.sentiment < b.sentiment ? a : b);
  const insight = peak.slide === drop.slide
    ? 'Sentiment remains relatively consistent throughout the deck.'
    : `Investor engagement peaks at Slide ${peak.slide} and drops to its lowest at Slide ${drop.slide}.`;

  return (
    <div style={{ width: '100%', marginBottom: 'var(--sp-xl)' }}>
      <p style={{ 
        fontSize: '11px', 
        color: 'var(--muted)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.1em',
        marginBottom: 'var(--sp-sm)',
        fontFamily: 'var(--font-mono)',
      }}>
        Investor Emotional Journey
      </p>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {/* Grid lines */}
        <line x1={padding.left} y1={yScale(0)} x2={width - padding.right} y2={yScale(0)} 
          stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 3" />
        <line x1={padding.left} y1={yScale(0.5)} x2={width - padding.right} y2={yScale(0.5)} 
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1={padding.left} y1={yScale(-0.5)} x2={width - padding.right} y2={yScale(-0.5)} 
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {/* Axes */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} 
          stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} 
          stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

        {/* Y-axis labels */}
        <text x={padding.left - 10} y={yScale(1)} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="var(--font-mono)">1.0</text>
        <text x={padding.left - 10} y={yScale(0)} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="var(--font-mono)">0</text>
        <text x={padding.left - 10} y={yScale(-1)} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="var(--font-mono)">-1.0</text>

        {/* X-axis labels (every 2 slides) */}
        {data.filter((_, i) => i % 2 === 0).map((d, i) => {
          const actualIndex = i * 2;
          return (
            <text 
              key={actualIndex}
              x={xScale(actualIndex)} 
              y={height - padding.bottom + 15} 
              textAnchor="middle" 
              fill="rgba(255,255,255,0.4)" 
              fontSize="10"
              fontFamily="var(--font-mono)"
            >
              S{d.slide}
            </text>
          );
        })}

        {/* Line */}
        <path d={linePath} fill="none" stroke="#14B8A6" strokeWidth="2" />

        {/* Dots */}
        {data.map((d, i) => (
          <circle 
            key={i}
            cx={xScale(i)} 
            cy={yScale(d.sentiment)} 
            r="3" 
            fill="#14B8A6"
          />
        ))}
      </svg>
      <p style={{ 
        fontSize: '13px', 
        color: 'rgba(255,255,255,0.6)', 
        marginTop: 'var(--sp-md)',
        lineHeight: 1.5,
      }}>
        {insight}
      </p>
    </div>
  );
}

// Made with Bob
