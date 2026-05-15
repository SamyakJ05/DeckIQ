'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Billing = 'monthly' | 'annual';

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly');
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

  const proPrice = billing === 'annual' ? '$20' : '$29';
  const proAnnual = billing === 'annual' ? 'Billed $240/yr · save $108' : 'Billed monthly';
  const teamPrice = billing === 'annual' ? '$55' : '$79';
  const teamAnnual = billing === 'annual'
    ? 'Billed $660/yr · save $288 · up to 5 seats'
    : 'Billed monthly · up to 5 seats';

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="container">
          <div className="nav-inner">
            <Link href="/" className="nav-logo">Deck<span>IQ</span></Link>
            <div className="nav-links">
              <Link href="/">Product</Link>
              <Link href="/pricing" style={{ color: 'var(--ink)' }}>Pricing</Link>
              <a href="#">Docs</a>
            </div>
            <div className="nav-actions">
              <a href="#" className="btn btn-sm btn-ghost">Log in</a>
              <Link href="/upload" className="btn btn-sm btn-primary">Analyse a deck →</Link>
              <button className="mode-toggle" onClick={toggleMode}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="pricing-hero">
        <div className="container" style={{ position: 'relative' }}>
          <div className="eyebrow">Pricing</div>
          <h1 className="hero-h">Know before you <em>pitch.</em></h1>
          <p className="hero-sub">One analysis can save months of wrong turns. Start free — upgrade when the deck is working.</p>

          {/* Billing toggle */}
          <div className="billing-toggle">
            <div
              className={`toggle-opt${billing === 'monthly' ? ' active' : ''}`}
              onClick={() => setBilling('monthly')}
            >
              Monthly
            </div>
            <div
              className={`toggle-opt${billing === 'annual' ? ' active' : ''}`}
              onClick={() => setBilling('annual')}
              style={{ position: 'relative' }}
            >
              Annual
              <span className="toggle-badge">–30%</span>
            </div>
          </div>
        </div>
      </div>

      {/* PLANS */}
      <div className="plans">
        <div className="container">
          <div className="plans-grid">

            {/* Starter */}
            <div className="plan-card">
              <div className="plan-name">Starter</div>
              <div className="plan-price-row">
                <span className="plan-price">$0</span>
                <span className="plan-price-period">/mo</span>
              </div>
              <div className="plan-price-annual">Free forever</div>
              <div className="plan-desc">Test-drive DeckIQ with your first decks. No card required.</div>
              <Link href="/onboarding" className="btn btn-outline btn-md plan-cta">Get started free</Link>

              <div className="plan-divider"></div>
              <div className="plan-feature-label">Includes</div>
              <div className="features-list">
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--success)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text"><strong>3 deck analyses</strong> per month</span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--success)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text">Overall IQ score + grade</span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--success)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text">Slide-level flags (up to 10 slides)</span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--hairline-str)" strokeWidth="1" />
                    <line x1="5" y1="8" x2="11" y2="8" stroke="var(--hairline-str)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="feature-text" style={{ color: 'var(--ash)' }}>No PDF export</span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--hairline-str)" strokeWidth="1" />
                    <line x1="5" y1="8" x2="11" y2="8" stroke="var(--hairline-str)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="feature-text" style={{ color: 'var(--ash)' }}>No team sharing</span>
                </div>
              </div>
            </div>

            {/* Pro (featured) */}
            <div className="plan-card featured">
              <div className="plan-featured-badge">Most popular</div>
              <div className="plan-name" style={{ color: 'var(--primary)' }}>Pro</div>
              <div className="plan-price-row">
                <span className="plan-price">{proPrice}</span>
                <span className="plan-price-period">/mo</span>
              </div>
              <div className="plan-price-annual">{proAnnual}</div>
              <div className="plan-desc">Unlimited analyses for founders preparing to raise. Everything you need to walk in confident.</div>
              <Link href="/onboarding" className="btn btn-primary btn-md plan-cta">Start Pro trial →</Link>

              <div className="plan-divider"></div>
              <div className="plan-feature-label">Everything in Starter, plus</div>
              <div className="features-list">
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--primary)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text"><strong>Unlimited analyses</strong></span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--primary)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text">Full slide-by-slide critique with fix suggestions</span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--primary)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text">Investor-ready score report <span className="badge badge-primary" style={{ verticalAlign: 'middle' }}>PDF</span></span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--primary)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text">Radar chart across 6 dimensions</span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--primary)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text">Version history — track every revision</span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--primary)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text">Priority analysis queue (under 30 sec)</span>
                </div>
              </div>
            </div>

            {/* Team */}
            <div className="plan-card">
              <div className="plan-name">Team</div>
              <div className="plan-price-row">
                <span className="plan-price">{teamPrice}</span>
                <span className="plan-price-period">/mo</span>
              </div>
              <div className="plan-price-annual">{teamAnnual}</div>
              <div className="plan-desc">For accelerators, venture studios, and founding teams reviewing decks together.</div>
              <a href="#" className="btn btn-outline btn-md plan-cta">Contact sales</a>

              <div className="plan-divider"></div>
              <div className="plan-feature-label">Everything in Pro, plus</div>
              <div className="features-list">
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--success)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text"><strong>5 team seats</strong> (more on request)</span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--success)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text">Shared deck library + annotation</span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--success)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text">Portfolio-level benchmarks across cohort</span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--success)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text">White-label reports with your firm&apos;s logo</span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--success)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text">SSO + SAML, admin controls</span>
                </div>
                <div className="feature-item">
                  <svg className="feature-check" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7.5" stroke="var(--success)" strokeWidth="1" />
                    <polyline points="4.5 8 7 10.5 11.5 5.5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="feature-text">Dedicated Slack + onboarding call</span>
                </div>
              </div>
            </div>

          </div>

          {/* Trust strip */}
          <div style={{ marginTop: 'var(--sp-xxl)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-xxl)', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>✓ No credit card for free plan</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>✓ Cancel Pro anytime</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted)' }}>✓ SOC 2 Type II · your deck stays private</span>
          </div>
        </div>
      </div>

      {/* COMPARISON TABLE */}
      <div className="compare">
        <div className="container">
          <h2 className="compare-title">Full comparison</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="compare-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Feature</th>
                  <th style={{ width: '20%' }}>Starter</th>
                  <th style={{ width: '20%' }}>Pro</th>
                  <th style={{ width: '20%' }}>Team</th>
                </tr>
              </thead>
              <tbody>
                <tr className="section-row"><td colSpan={4}>Analysis</td></tr>
                <tr>
                  <td>Deck analyses per month</td>
                  <td className="check-num">3</td>
                  <td className="check-num">∞</td>
                  <td className="check-num">∞</td>
                </tr>
                <tr>
                  <td>Overall IQ score + letter grade</td>
                  <td><span className="check-yes">✓</span></td>
                  <td><span className="check-yes">✓</span></td>
                  <td><span className="check-yes">✓</span></td>
                </tr>
                <tr>
                  <td>Slide-level critique</td>
                  <td>Up to 10 slides</td>
                  <td className="check-yes">✓</td>
                  <td className="check-yes">✓</td>
                </tr>
                <tr>
                  <td>Fix suggestions per slide</td>
                  <td className="check-no">—</td>
                  <td className="check-yes">✓</td>
                  <td className="check-yes">✓</td>
                </tr>
                <tr>
                  <td>6-dimension radar chart</td>
                  <td className="check-no">—</td>
                  <td className="check-yes">✓</td>
                  <td className="check-yes">✓</td>
                </tr>

                <tr className="section-row"><td colSpan={4}>Reports</td></tr>
                <tr>
                  <td>Score report PDF export</td>
                  <td className="check-no">—</td>
                  <td className="check-yes">✓</td>
                  <td className="check-yes">✓</td>
                </tr>
                <tr>
                  <td>White-label reports</td>
                  <td className="check-no">—</td>
                  <td className="check-no">—</td>
                  <td className="check-yes">✓</td>
                </tr>
                <tr>
                  <td>Version history</td>
                  <td className="check-no">—</td>
                  <td className="check-yes">✓</td>
                  <td className="check-yes">✓</td>
                </tr>

                <tr className="section-row"><td colSpan={4}>Team</td></tr>
                <tr>
                  <td>Seats</td>
                  <td className="check-num">1</td>
                  <td className="check-num">1</td>
                  <td className="check-num">5+</td>
                </tr>
                <tr>
                  <td>Shared deck library</td>
                  <td className="check-no">—</td>
                  <td className="check-no">—</td>
                  <td className="check-yes">✓</td>
                </tr>
                <tr>
                  <td>Portfolio benchmarks</td>
                  <td className="check-no">—</td>
                  <td className="check-no">—</td>
                  <td className="check-yes">✓</td>
                </tr>
                <tr>
                  <td>SSO / SAML</td>
                  <td className="check-no">—</td>
                  <td className="check-no">—</td>
                  <td className="check-yes">✓</td>
                </tr>

                <tr className="section-row"><td colSpan={4}>Support</td></tr>
                <tr>
                  <td>Response time</td>
                  <td>Community</td>
                  <td>Email &lt; 24 h</td>
                  <td>Slack + call</td>
                </tr>
                <tr>
                  <td>Analysis queue priority</td>
                  <td>Standard</td>
                  <td>Priority (&lt;30 s)</td>
                  <td>Priority (&lt;30 s)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="faq">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--sp-sec)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,3.5vw,48px)', fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--ink)' }}>Questions</h2>
          </div>
          <div className="faq-grid">
            <div className="faq-item">
              <div className="faq-q">Is my pitch deck kept confidential?</div>
              <div className="faq-a">Yes. Decks are encrypted in transit and at rest, never used to train models, and auto-deleted from our servers after 30 days unless you save them. We&apos;re SOC 2 Type II certified.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">How long does an analysis take?</div>
              <div className="faq-a">Typically under 60 seconds for a 12-slide deck. Pro subscribers get priority queue — usually under 30 seconds. We process slide content, not just keywords.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">What formats do you accept?</div>
              <div className="faq-a">PDF and PPTX. Keynote users: export to PDF first. If your deck is a Google Slides link, paste the share URL and we&apos;ll import it directly.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Can I cancel Pro at any time?</div>
              <div className="faq-a">Yes — cancel from Settings with one click. You keep access until the end of your billing period. No hidden fees.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">Do you offer discounts for accelerators?</div>
              <div className="faq-a">Yes. Batch 100+ founders through a cohort? We have a partner programme — email <strong>partners@deckiq.com</strong> and we&apos;ll set you up on Team at a per-seat rate.</div>
            </div>
            <div className="faq-item">
              <div className="faq-q">What if I go over 3 analyses on the free plan?</div>
              <div className="faq-a">You&apos;ll get a prompt to upgrade. We never block mid-flow without warning. Unused monthly analyses don&apos;t roll over on any plan.</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA BAND */}
      <div className="cta-band">
        <div className="container">
          <h2>Stop guessing.<br />Start <em>knowing.</em></h2>
          <p>Upload your first deck in under a minute — no card, no friction.</p>
          <div className="cta-actions">
            <Link href="/upload" className="btn btn-primary btn-lg">Analyse my deck →</Link>
            <a href="#" className="btn btn-outline btn-lg" style={{ color: 'var(--on-dark)', borderColor: 'rgba(255,255,255,0.2)' }}>Talk to a human</a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">Deck<span>IQ</span></div>
              <div className="footer-tagline">AI-powered pitch deck intelligence for founders who want to close their round, not just finish their deck.</div>
            </div>
            <div>
              <div className="footer-col-title">Product</div>
              <div className="footer-links">
                <Link href="/">Features</Link>
                <Link href="/pricing" style={{ color: 'var(--on-dark)' }}>Pricing</Link>
                <a href="#">Changelog</a>
              </div>
            </div>
            <div>
              <div className="footer-col-title">Company</div>
              <div className="footer-links">
                <a href="#">About</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
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
            <span>© 2025 DeckIQ, Inc.</span>
            <span>Built for founders, by founders.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
