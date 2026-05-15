'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Section = 'profile' | 'billing' | 'notifications' | 'api' | 'team';

interface NotificationToggles {
  analysisComplete: boolean;
  scoreImproved: boolean;
  teamUpload: boolean;
  changelog: boolean;
  usageLimits: boolean;
  tips: boolean;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [isLight, setIsLight] = useState(false);
  const [toastMsg, setToastMsg] = useState('Saved');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [notifications, setNotifications] = useState<NotificationToggles>({
    analysisComplete: true,
    scoreImproved: true,
    teamUpload: false,
    changelog: true,
    usageLimits: true,
    tips: false,
  });

  // Theme init from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('deckiq-mode');
    if (stored === 'light') {
      document.body.classList.add('light');
      setIsLight(true);
    }
  }, []);

  const toggleMode = () => {
    document.body.classList.toggle('light');
    const nowLight = document.body.classList.contains('light');
    setIsLight(nowLight);
    localStorage.setItem('deckiq-mode', nowLight ? 'light' : 'dark');
  };

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer) clearTimeout(toastTimer);
    const t = setTimeout(() => setToastVisible(false), 2400);
    setToastTimer(t);
  }, [toastTimer]);

  const toggleNotification = (key: keyof NotificationToggles) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    showToast('Preference saved');
  };

  return (
    <div className="app-shell">
      {/* NAV */}
      <nav className="nav">
        <div className="container">
          <div className="nav-inner">
            <Link href="/" className="nav-logo">Deck<span>IQ</span></Link>
            <div className="nav-links">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/upload">New analysis</Link>
              <Link href="/pricing">Pricing</Link>
            </div>
            <div className="nav-actions">
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: '#fff' }}>A</div>
              <button className="mode-toggle" onClick={toggleMode}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="app-body">
        {/* SIDEBAR */}
        <aside className="settings-sidebar">
          <div className="sidebar-section-label">Account</div>
          <a
            className={`sidebar-item${activeSection === 'profile' ? ' active' : ''}`}
            onClick={() => setActiveSection('profile')}
            style={{ cursor: 'pointer' }}
          >
            <svg className="sidebar-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="5.5" r="2.5" />
              <path d="M2 13c0-2.76 2.69-5 6-5s6 2.24 6 5" />
            </svg>
            Profile
          </a>
          <a
            className={`sidebar-item${activeSection === 'billing' ? ' active' : ''}`}
            onClick={() => setActiveSection('billing')}
            style={{ cursor: 'pointer' }}
          >
            <svg className="sidebar-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
              <path d="M1.5 6.5h13" />
            </svg>
            Billing
          </a>

          <div className="sidebar-section-label">Preferences</div>
          <a
            className={`sidebar-item${activeSection === 'notifications' ? ' active' : ''}`}
            onClick={() => setActiveSection('notifications')}
            style={{ cursor: 'pointer' }}
          >
            <svg className="sidebar-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1.5A4 4 0 0 0 4 5.5v2.3L2.5 9.5h11L12 7.8V5.5A4 4 0 0 0 8 1.5z" />
              <path d="M6.5 9.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5" />
            </svg>
            Notifications
          </a>
          <a
            className={`sidebar-item${activeSection === 'api' ? ' active' : ''}`}
            onClick={() => setActiveSection('api')}
            style={{ cursor: 'pointer' }}
          >
            <svg className="sidebar-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1.5" y="5.5" width="5" height="5" rx="1" />
              <rect x="9.5" y="5.5" width="5" height="5" rx="1" />
              <path d="M6.5 8h3" />
            </svg>
            API
          </a>

          <div className="sidebar-section-label">Team</div>
          <a
            className={`sidebar-item${activeSection === 'team' ? ' active' : ''}`}
            onClick={() => setActiveSection('team')}
            style={{ cursor: 'pointer' }}
          >
            <svg className="sidebar-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="5.5" cy="5.5" r="2" />
              <circle cx="10.5" cy="5.5" r="2" />
              <path d="M1 13c0-2 2-3.5 4.5-3.5" />
              <path d="M15 13c0-2-2-3.5-4.5-3.5s-4.5 1.5-4.5 3.5" />
            </svg>
            Team
          </a>

          <div style={{ marginTop: 'auto', padding: '24px 20px 0' }}>
            <Link href="/dashboard" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>← Dashboard</Link>
          </div>
        </aside>

        {/* MAIN */}
        <main className="settings-main">

          {/* PROFILE */}
          <section className={`settings-section${activeSection === 'profile' ? ' visible' : ''}`}>
            <h1 className="settings-h">Profile</h1>
            <p className="settings-sub">How you appear to your team and in reports.</p>

            <div className="avatar-row">
              <div className="avatar-circle">A</div>
              <div className="avatar-actions">
                <span className="avatar-upload">Upload photo</span>
                <span className="avatar-note">JPG or PNG · max 2 MB</span>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>First name</label>
                <input className="form-input" type="text" defaultValue="Arjun" />
              </div>
              <div className="form-group">
                <label>Last name</label>
                <input className="form-input" type="text" defaultValue="Patel" />
              </div>
            </div>
            <div className="form-group">
              <label>Work email</label>
              <input className="form-input" type="email" defaultValue="arjun@luminary.ai" disabled />
              <div className="field-hint">Email is managed by your SSO provider.</div>
            </div>
            <div className="form-group">
              <label>Company / fund name</label>
              <input className="form-input" type="text" defaultValue="Luminary AI" />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input className="form-input" type="text" defaultValue="Founder & CEO" />
            </div>
            <div className="form-group">
              <label>Bio <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></label>
              <textarea className="form-textarea" placeholder="Appears on white-label reports" defaultValue="Building AI infrastructure for mid-market enterprise. Pre-Seed, raising $1.2M." />
            </div>

            <div className="settings-divider" />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 16 }}>Analysis defaults</div>
            <div className="form-group">
              <label>Default raise stage</label>
              <select className="form-input" style={{ height: 40 }} defaultValue="Seed">
                <option>Pre-Seed</option>
                <option value="Seed">Seed</option>
                <option>Series A</option>
                <option>Series B+</option>
              </select>
              <div className="field-hint">Used to calibrate critique benchmarks on each new upload.</div>
            </div>
            <div className="form-group">
              <label>Default investor type</label>
              <select className="form-input" style={{ height: 40 }} defaultValue="Seed VCs">
                <option>Seed VCs</option>
                <option>Angels</option>
                <option>Corporate VC</option>
                <option>Not sure</option>
              </select>
            </div>

            <button className="btn btn-primary btn-md" onClick={() => showToast('Profile saved')}>Save changes</button>
          </section>

          {/* BILLING */}
          <section className={`settings-section${activeSection === 'billing' ? ' visible' : ''}`}>
            <h1 className="settings-h">Billing</h1>
            <p className="settings-sub">Manage your plan, usage, and invoices.</p>

            <div className="plan-current">
              <div className="plan-current-left">
                <div className="plan-tier-badge">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }} />
                  Pro plan
                </div>
                <div className="plan-price-lg">$29 <span>/ month</span></div>
                <div className="plan-renew">Renews 15 Jun 2025 · billed monthly</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/pricing" className="btn btn-outline btn-sm">View plans</Link>
                <button className="btn btn-ghost btn-sm" onClick={() => showToast('Billing portal opened')}>Manage billing</button>
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 14 }}>Usage this period</div>

            <div className="usage-card">
              <div className="usage-header">
                <span className="usage-label">Deck analyses</span>
                <span className="usage-count">∞ unlimited on Pro</span>
              </div>
              <div className="usage-bar"><div className="usage-fill safe" style={{ width: '100%' }} /></div>
              <div className="usage-reset">14 analyses run · resets 15 Jun 2025</div>
            </div>

            <div className="usage-card">
              <div className="usage-header">
                <span className="usage-label">PDF exports</span>
                <span className="usage-count">8 / ∞</span>
              </div>
              <div className="usage-bar"><div className="usage-fill safe" style={{ width: '30%' }} /></div>
              <div className="usage-reset">8 reports exported this month</div>
            </div>

            <div className="settings-divider" />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 14 }}>Invoices</div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>May 2025</td>
                  <td>$29.00</td>
                  <td><span className="badge badge-success">Paid</span></td>
                  <td><span className="invoice-download" onClick={() => showToast('Downloading invoice…')}>PDF ↓</span></td>
                </tr>
                <tr>
                  <td>Apr 2025</td>
                  <td>$29.00</td>
                  <td><span className="badge badge-success">Paid</span></td>
                  <td><span className="invoice-download" onClick={() => showToast('Downloading invoice…')}>PDF ↓</span></td>
                </tr>
                <tr>
                  <td>Mar 2025</td>
                  <td>$29.00</td>
                  <td><span className="badge badge-success">Paid</span></td>
                  <td><span className="invoice-download" onClick={() => showToast('Downloading invoice…')}>PDF ↓</span></td>
                </tr>
                <tr>
                  <td>Feb 2025</td>
                  <td>$0.00</td>
                  <td><span className="badge badge-muted">Free</span></td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>

            <div className="settings-divider" />
            <div className="danger-zone">
              <div className="danger-title">Cancel subscription</div>
              <div className="danger-body">You&apos;ll retain Pro access until 15 Jun 2025. After that, you&apos;ll revert to the Starter (3 analyses/month) plan. Your existing reports and history are preserved.</div>
              <button
                style={{ background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--r-full)', padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                onClick={() => showToast('Cancellation flow opened')}
              >
                Cancel subscription
              </button>
            </div>
          </section>

          {/* NOTIFICATIONS */}
          <section className={`settings-section${activeSection === 'notifications' ? ' visible' : ''}`}>
            <h1 className="settings-h">Notifications</h1>
            <p className="settings-sub">Choose when DeckIQ reaches out.</p>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 4 }}>Analysis</div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-label">Analysis complete</div>
                <div className="toggle-desc">Email when your deck finishes processing</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.analysisComplete}
                  onChange={() => toggleNotification('analysisComplete')}
                />
                <div className="switch-track" />
                <div className="switch-thumb" />
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-label">Score improved</div>
                <div className="toggle-desc">Notify when a re-upload beats your previous best</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.scoreImproved}
                  onChange={() => toggleNotification('scoreImproved')}
                />
                <div className="switch-track" />
                <div className="switch-thumb" />
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-label">Team member uploaded a deck</div>
                <div className="toggle-desc">Alert when a teammate submits a new deck for review</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.teamUpload}
                  onChange={() => toggleNotification('teamUpload')}
                />
                <div className="switch-track" />
                <div className="switch-thumb" />
              </label>
            </div>

            <div className="settings-divider" />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 4 }}>Product</div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-label">Changelog &amp; new features</div>
                <div className="toggle-desc">Monthly email with what&apos;s new in DeckIQ</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.changelog}
                  onChange={() => toggleNotification('changelog')}
                />
                <div className="switch-track" />
                <div className="switch-thumb" />
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-label">Usage limit warnings</div>
                <div className="toggle-desc">Alert at 80% of monthly analysis quota</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.usageLimits}
                  onChange={() => toggleNotification('usageLimits')}
                />
                <div className="switch-track" />
                <div className="switch-thumb" />
              </label>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-label">Tips for higher scores</div>
                <div className="toggle-desc">Occasional tips based on what high-IQ decks do differently</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={notifications.tips}
                  onChange={() => toggleNotification('tips')}
                />
                <div className="switch-track" />
                <div className="switch-thumb" />
              </label>
            </div>
          </section>

          {/* API */}
          <section className={`settings-section${activeSection === 'api' ? ' visible' : ''}`}>
            <h1 className="settings-h">API</h1>
            <p className="settings-sub">Integrate DeckIQ into your workflow — CI/CD for your pitch deck.</p>

            <div style={{ background: 'var(--surface-bone)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '16px 20px', marginBottom: 28 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Endpoint</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink)' }}>https://api.deckiq.com/v1</div>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 4 }}>API keys</div>

            <div className="key-row">
              <div className="key-name">Production key</div>
              <div className="key-val">diq_live_••••••••••••••3a9f</div>
              <div className="key-actions">
                <button className="btn btn-sm btn-outline" onClick={() => showToast('Copied to clipboard')}>Copy</button>
                <button className="btn btn-sm btn-ghost" onClick={() => showToast('Key regenerated')}>Regen</button>
              </div>
            </div>
            <div className="key-row">
              <div className="key-name">Test key</div>
              <div className="key-val">diq_test_••••••••••••••7c21</div>
              <div className="key-actions">
                <button className="btn btn-sm btn-outline" onClick={() => showToast('Copied to clipboard')}>Copy</button>
                <button className="btn btn-sm btn-ghost" onClick={() => showToast('Key regenerated')}>Regen</button>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button className="btn btn-outline btn-sm" onClick={() => showToast('New key created')}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="2" x2="8" y2="14" />
                  <line x1="2" y1="8" x2="14" y2="8" />
                </svg>
                Create new key
              </button>
            </div>

            <div className="settings-divider" />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 14 }}>Webhooks</div>
            <div style={{ background: 'var(--surface-bone)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>No webhooks configured. Add an endpoint to receive analysis events.</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => showToast('Webhook form opened')}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="2" x2="8" y2="14" />
                <line x1="2" y1="8" x2="14" y2="8" />
              </svg>
              Add endpoint
            </button>
          </section>

          {/* TEAM */}
          <section className={`settings-section${activeSection === 'team' ? ' visible' : ''}`}>
            <h1 className="settings-h">Team</h1>
            <p className="settings-sub">Invite co-founders or advisors to share analyses.</p>

            <div style={{ background: 'color-mix(in oklch,var(--warn) 8%,var(--surface-card))', border: '1px solid color-mix(in oklch,var(--warn) 25%,transparent)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 28, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--warn)" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="8" cy="8" r="6.5" />
                <line x1="8" y1="5" x2="8" y2="8.5" />
                <circle cx="8" cy="11" r="0.5" fill="var(--warn)" />
              </svg>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--warn)', marginBottom: 3 }}>Team seats require Pro or Team plan</div>
                <div style={{ fontSize: 13, color: 'var(--body-clr)' }}>You&apos;re on Pro (1 seat). <Link href="/pricing" style={{ color: 'var(--warn)' }}>Upgrade to Team</Link> for 5 seats, shared library, and portfolio benchmarks.</div>
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 14 }}>Members (1 / 1 seat)</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid var(--hairline)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>A</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Arjun Patel <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', fontWeight: 400 }}>(you)</span></div>
                <div style={{ fontSize: 13, color: 'var(--muted)' }}>arjun@luminary.ai</div>
              </div>
              <span className="badge badge-primary">Owner</span>
            </div>

            <div style={{ marginTop: 20 }}>
              <button className="btn btn-outline btn-sm" onClick={() => showToast('Upgrade to Team to invite members')}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="2" x2="8" y2="14" />
                  <line x1="2" y1="8" x2="14" y2="8" />
                </svg>
                Invite teammate
              </button>
            </div>
          </section>

        </main>
      </div>

      {/* Toast */}
      <div className={`toast${toastVisible ? ' visible' : ''}`}>
        <span className="toast-dot" />
        <span>{toastMsg}</span>
      </div>

      {/* Page-scoped styles */}
      <style>{`
        .app-shell {
          min-height: 100vh;
          display: grid;
          grid-template-rows: 60px 1fr;
        }
        .app-body {
          display: grid;
          grid-template-columns: 240px 1fr;
          min-height: calc(100vh - 60px);
        }

        /* Sidebar */
        .settings-sidebar {
          border-right: 1px solid var(--hairline);
          padding: 24px 0;
          background: var(--surface-bone);
          position: sticky;
          top: 60px;
          height: calc(100vh - 60px);
          overflow-y: auto;
        }
        .sidebar-section-label {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--ash);
          padding: 16px 20px 8px;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          transition: all .15s;
          border-left: 2px solid transparent;
          text-decoration: none;
        }
        .sidebar-item:hover { color: var(--ink); text-decoration: none; }
        .sidebar-item.active {
          color: var(--ink);
          background: var(--hairline);
          border-left-color: var(--primary);
        }
        .sidebar-icon { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.6; }
        .sidebar-item.active .sidebar-icon { opacity: 1; }

        /* Main content */
        .settings-main {
          padding: 40px 48px;
          max-width: 720px;
        }
        .settings-section { display: none; }
        .settings-section.visible { display: block; }

        .settings-h {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -1px;
          color: var(--ink);
          margin-bottom: 6px;
        }
        .settings-sub { font-size: 14px; color: var(--muted); margin-bottom: 32px; }
        .settings-divider { height: 1px; background: var(--hairline); margin: 32px 0; }

        /* Form */
        .form-group { margin-bottom: 24px; }
        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 6px;
        }
        .form-group .field-hint { font-size: 12px; color: var(--muted); margin-top: 5px; }
        .form-input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          background: var(--surface-card);
          border: 1px solid var(--hairline-str);
          border-radius: var(--r-md);
          font-size: 14px;
          font-family: var(--font-body);
          color: var(--ink);
          transition: border-color .15s, box-shadow .15s;
          outline: none;
        }
        .form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(234,40,4,0.10); }
        .form-input:disabled { background: var(--surface-bone); color: var(--muted); cursor: not-allowed; }
        .form-textarea {
          width: 100%;
          min-height: 80px;
          padding: 10px 12px;
          background: var(--surface-card);
          border: 1px solid var(--hairline-str);
          border-radius: var(--r-md);
          font-size: 14px;
          font-family: var(--font-body);
          color: var(--ink);
          resize: vertical;
          outline: none;
          transition: border-color .15s;
        }
        .form-textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(234,40,4,0.10); }
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        /* Avatar */
        .avatar-row { display: flex; align-items: center; gap: 20px; margin-bottom: 28px; }
        .avatar-circle {
          width: 64px; height: 64px; border-radius: 50%;
          background: var(--primary);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-size: 24px; font-weight: 800; color: #fff;
          flex-shrink: 0;
        }
        .avatar-actions { display: flex; flex-direction: column; gap: 8px; }
        .avatar-upload { font-size: 13px; font-weight: 600; color: var(--primary); cursor: pointer; }
        .avatar-upload:hover { text-decoration: underline; }
        .avatar-note { font-size: 12px; color: var(--muted); }

        /* Plan card */
        .plan-current {
          background: var(--surface-card);
          border: 1px solid var(--hairline);
          border-radius: var(--r-lg);
          padding: 24px;
          margin-bottom: 24px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
        }
        .plan-tier-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-mono); font-size: 11px; font-weight: 700;
          background: color-mix(in oklch, var(--primary) 14%, var(--surface-card));
          color: var(--primary); padding: 4px 10px; border-radius: var(--r-full);
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;
        }
        .plan-price-lg {
          font-family: var(--font-display); font-size: 32px; font-weight: 800;
          letter-spacing: -1.5px; color: var(--ink); margin-bottom: 4px;
        }
        .plan-price-lg span { font-size: 16px; color: var(--muted); font-weight: 400; }
        .plan-renew { font-family: var(--font-mono); font-size: 12px; color: var(--muted); }

        /* Usage */
        .usage-card {
          background: var(--surface-bone);
          border: 1px solid var(--hairline);
          border-radius: var(--r-md);
          padding: 20px; margin-bottom: 16px;
        }
        .usage-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
        .usage-label { font-size: 14px; font-weight: 600; color: var(--ink); }
        .usage-count { font-family: var(--font-mono); font-size: 13px; color: var(--muted); }
        .usage-bar { height: 6px; background: var(--hairline); border-radius: var(--r-full); overflow: hidden; }
        .usage-fill { height: 100%; border-radius: var(--r-full); background: var(--primary); transition: width .6s ease; }
        .usage-fill.safe { background: var(--success); }
        .usage-reset { font-size: 12px; color: var(--ash); margin-top: 6px; font-family: var(--font-mono); }

        /* Invoice table */
        .invoice-table { width: 100%; border-collapse: collapse; }
        .invoice-table th {
          font-family: var(--font-mono); font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em; color: var(--ash);
          text-align: left; padding: 0 0 12px; border-bottom: 1px solid var(--hairline);
        }
        .invoice-table td {
          font-size: 14px; color: var(--body-clr);
          padding: 12px 0; border-bottom: 1px solid var(--hairline);
        }
        .invoice-table td:first-child { font-family: var(--font-mono); font-size: 13px; }
        .invoice-table td:last-child { text-align: right; }
        .invoice-table tr:last-child td { border-bottom: none; }
        .invoice-download { font-size: 13px; color: var(--primary); cursor: pointer; }
        .invoice-download:hover { text-decoration: underline; }

        /* Toggle switches */
        .toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 0; border-bottom: 1px solid var(--hairline);
        }
        .toggle-row:last-child { border-bottom: none; }
        .toggle-label { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 3px; }
        .toggle-desc { font-size: 13px; color: var(--muted); }
        .switch {
          position: relative; width: 44px; height: 24px; flex-shrink: 0;
        }
        .switch input { opacity: 0; width: 0; height: 0; position: absolute; }
        .switch-track {
          position: absolute; inset: 0; border-radius: var(--r-full);
          background: var(--hairline-str); cursor: pointer; transition: background .2s;
        }
        .switch input:checked + .switch-track { background: var(--primary); }
        .switch-thumb {
          position: absolute; top: 3px; left: 3px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #fff; transition: transform .2s; pointer-events: none;
        }
        .switch input:checked ~ .switch-thumb { transform: translateX(20px); }

        /* API keys */
        .key-row {
          display: flex; align-items: center; gap: 12px; padding: 12px 0;
          border-bottom: 1px solid var(--hairline);
        }
        .key-row:last-child { border-bottom: none; }
        .key-name { font-size: 14px; font-weight: 600; color: var(--ink); flex: 1; }
        .key-val {
          font-family: var(--font-mono); font-size: 12px; color: var(--muted);
          background: var(--surface-bone); padding: 4px 10px; border-radius: var(--r-sm);
        }
        .key-actions { display: flex; gap: 8px; }

        /* Danger zone */
        .danger-zone {
          background: color-mix(in oklch, var(--danger) 6%, var(--surface-card));
          border: 1px solid color-mix(in oklch, var(--danger) 25%, transparent);
          border-radius: var(--r-lg); padding: 24px;
        }
        .danger-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--danger); margin-bottom: 6px; }
        .danger-body { font-size: 14px; color: var(--body-clr); margin-bottom: 16px; }

        /* Toast */
        .toast {
          position: fixed; bottom: 24px; left: 50%;
          transform: translateX(-50%) translateY(80px);
          background: var(--surface-deep);
          border: 1px solid var(--hairline-str);
          border-radius: var(--r-full);
          padding: 12px 20px;
          font-size: 14px; color: var(--on-dark); font-weight: 600;
          display: flex; align-items: center; gap: 10px; white-space: nowrap;
          transition: transform .3s ease; z-index: 999; pointer-events: none;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .toast.visible { transform: translateX(-50%) translateY(0); }
        .toast-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); }

        /* Responsive */
        @media (max-width: 900px) {
          .app-body { grid-template-columns: 200px 1fr; }
          .settings-main { padding: 32px 24px; }
        }
        @media (max-width: 640px) {
          .app-body { grid-template-columns: 1fr; }
          .settings-sidebar { display: none; }
          .settings-main { padding: 24px 16px; max-width: 100%; }
          .form-row-2 { grid-template-columns: 1fr; }
          .plan-current { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
