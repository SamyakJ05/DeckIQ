'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type UploadState = 'idle' | 'file-selected' | 'processing' | 'done';

type StepStatus = 'pending' | 'active' | 'done';

interface Step {
  id: number;
  label: string;
  status: StepStatus;
}

const INITIAL_STEPS: Step[] = [
  { id: 1, label: 'Parsing slides and extracting content', status: 'done' },
  { id: 2, label: 'Scoring problem & market framing', status: 'active' },
  { id: 3, label: 'Evaluating traction & momentum signals', status: 'pending' },
  { id: 4, label: 'Assessing team credibility indicators', status: 'pending' },
  { id: 5, label: 'Analyzing narrative flow & ask structure', status: 'pending' },
  { id: 6, label: 'Generating slide-by-slide critique', status: 'pending' },
];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  const [isLight, setIsLight] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [urlValue, setUrlValue] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [errorMsg, setErrorMsg] = useState('');

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

  function showFile(file: File) {
    selectedFileRef.current = file;
    setFileName(file.name);
    setFileSize((file.size / 1024 / 1024).toFixed(1) + ' MB');
    setUploadState('file-selected');
    setErrorMsg('');
  }

  function removeFile() {
    selectedFileRef.current = null;
    setUploadState('idle');
    setFileName('');
    setFileSize('');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) showFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) showFile(file);
  }

  function startFromUrl() {
    if (!urlValue.trim()) return;
    if (!urlValue.includes('docs.google.com/presentation')) {
      setErrorMsg('Please enter a valid Google Slides URL (docs.google.com/presentation/...)');
      return;
    }
    runUrlAnalysis(urlValue.trim());
  }

  async function runUrlAnalysis(url: string) {
    setSteps(INITIAL_STEPS);
    setCurrentStep(2);
    setUploadState('processing');
    setErrorMsg('');

    const timers: ReturnType<typeof setTimeout>[] = [];
    advanceSteps(timers);

    try {
      const formData = new FormData();
      formData.append('url', url);

      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      timers.forEach(clearTimeout);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Analysis failed (${res.status})`);
      }

      const result = await res.json();
      sessionStorage.setItem('deckiq-analysis', JSON.stringify(result));
      sessionStorage.setItem('deckiq-filename', 'Google Slides Presentation');
      router.push('/report');
    } catch (err) {
      timers.forEach(clearTimeout);
      setErrorMsg(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setUploadState('idle');
    }
  }

  function startAnalysis() {
    if (!selectedFileRef.current) return;
    runAnalysis(selectedFileRef.current);
  }

  function advanceSteps(timers: ReturnType<typeof setTimeout>[]) {
    const transitions = [
      { step: 3, delay: 2000 },
      { step: 4, delay: 5000 },
      { step: 5, delay: 9000 },
      { step: 6, delay: 12000 },
    ];
    transitions.forEach(({ step, delay }) => {
      timers.push(setTimeout(() => {
        setCurrentStep(step);
        setSteps(prev =>
          prev.map(s => {
            if (s.id < step) return { ...s, status: 'done' };
            if (s.id === step) return { ...s, status: 'active' };
            return s;
          })
        );
      }, delay));
    });
  }

  async function runAnalysis(file: File) {
    setSteps(INITIAL_STEPS);
    setCurrentStep(2);
    setUploadState('processing');
    setErrorMsg('');

    const timers: ReturnType<typeof setTimeout>[] = [];
    advanceSteps(timers);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      timers.forEach(clearTimeout);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Analysis failed (${res.status})`);
      }

      const result = await res.json();
      sessionStorage.setItem('deckiq-analysis', JSON.stringify(result));
      sessionStorage.setItem('deckiq-filename', file.name);
      router.push('/report');
    } catch (err) {
      timers.forEach(clearTimeout);
      setErrorMsg(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setUploadState('file-selected');
    }
  }

  function renderStepIcon(status: StepStatus) {
    if (status === 'done') {
      return (
        <div className="step-icon check">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      );
    }
    if (status === 'active') {
      return (
        <div className="step-icon spinning">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
          </svg>
        </div>
      );
    }
    return <div className="step-icon pending" />;
  }

  return (
    <>
      {/* NAV */}
      <nav className="nav">
        <div className="container">
          <div className="nav-inner">
            <Link href="/" className="nav-logo">
              Deck<span>IQ</span>
            </Link>
            <div className="nav-links">
              <a href="#">How it works</a>
              <Link href="/report">Example</Link>
              <a href="#">Pricing</a>
            </div>
            <div className="nav-actions">
              <button className="mode-toggle" onClick={toggleMode} title="Toggle theme">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
              <a href="#" className="btn btn-ghost btn-md">Sign in</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="upload-page">
        {/* Left: upload area */}
        <div className="upload-main">
          {/* Initial state */}
          {uploadState === 'idle' && (
            <div id="initialState">
              <div className="upload-header">
                <h1 className="upload-h">Drop your deck.<br />Get your score.</h1>
                <p className="upload-sub">PDF or PPTX · Up to 40 slides · Analysis in 60 seconds</p>
              </div>

              <div
                className={`drop-zone${isDragOver ? ' dragover' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.pptx,.ppt"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <div className="drop-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div className="drop-title">Drag your deck here</div>
                <div className="drop-meta">or click to browse files</div>
                <div className="drop-types">
                  <span className="type-pill">PDF</span>
                  <span className="type-pill">PPTX</span>
                  <span className="type-pill">PPT</span>
                  <span className="type-pill">up to 40 slides</span>
                </div>
              </div>

              <div className="divider-row">
                <div className="divider-line" />
                <span className="divider-text">or paste a link</span>
                <div className="divider-line" />
              </div>

              <div className="url-row">
                <input
                  type="url"
                  className="url-input"
                  placeholder="Google Slides or Figma share link…"
                  value={urlValue}
                  onChange={e => setUrlValue(e.target.value)}
                />
                <button className="btn btn-primary btn-md" onClick={startFromUrl}>
                  Analyze →
                </button>
              </div>
            </div>
          )}

          {/* File selected state */}
          {uploadState === 'file-selected' && (
            <>
              <div className="upload-header">
                <h1 className="upload-h">Drop your deck.<br />Get your score.</h1>
                <p className="upload-sub">PDF or PPTX · Up to 40 slides · Analysis in 60 seconds</p>
              </div>

              <div className="file-selected visible">
                <div className="file-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="file-info">
                  <div className="file-name">{fileName}</div>
                  <div className="file-size">{fileSize}</div>
                </div>
                <button className="file-remove" onClick={removeFile} title="Remove">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div style={{ marginTop: 'var(--sp-xl)', width: '100%', maxWidth: '560px' }}>
                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={startAnalysis}>
                  Analyze deck →
                </button>
                {errorMsg && (
                  <p style={{ textAlign: 'center', marginTop: 'var(--sp-md)', fontSize: '13px', color: 'var(--danger)' }}>
                    {errorMsg}
                  </p>
                )}
                {!errorMsg && (
                  <p style={{ textAlign: 'center', marginTop: 'var(--sp-md)', fontSize: '13px', color: 'var(--muted)' }}>
                    Free · No account needed · Results in ~60 seconds
                  </p>
                )}
              </div>
            </>
          )}

          {/* Processing state */}
          {uploadState === 'processing' && (
            <div className="processing-state visible">
              <div className="processing-ring">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--hairline)" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34"
                    fill="none" stroke="var(--primary)" strokeWidth="6"
                    strokeDasharray="213" strokeDashoffset="160" strokeLinecap="round"
                    transform="rotate(-90 40 40)"
                  />
                </svg>
              </div>
              <div className="processing-title">Analyzing your deck</div>
              <div className="processing-sub">Running 47 VC scoring signals across all slides…</div>
              <div className="progress-steps">
                {steps.map(step => (
                  <div
                    key={step.id}
                    className={`progress-step${step.status === 'active' ? ' active' : ''}${step.status === 'done' ? ' done' : ''}`}
                  >
                    {renderStepIcon(step.status)}
                    {step.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: sidebar */}
        <aside className="upload-sidebar">
          <div>
            <div className="sidebar-title">What we analyze</div>
            <div className="analyze-list">
              <div className="analyze-item">
                <span className="analyze-num">01</span>
                <div>
                  <div className="analyze-nm">Problem &amp; market</div>
                  <div className="analyze-desc">Pain specificity, market sizing credibility, TAM logic</div>
                </div>
              </div>
              <div className="analyze-item">
                <span className="analyze-num">02</span>
                <div>
                  <div className="analyze-nm">Solution clarity</div>
                  <div className="analyze-desc">Product explainability, differentiation, moat signals</div>
                </div>
              </div>
              <div className="analyze-item">
                <span className="analyze-num">03</span>
                <div>
                  <div className="analyze-nm">Traction &amp; momentum</div>
                  <div className="analyze-desc">Growth rate, retention, revenue narrative arc</div>
                </div>
              </div>
              <div className="analyze-item">
                <span className="analyze-num">04</span>
                <div>
                  <div className="analyze-nm">Team credibility</div>
                  <div className="analyze-desc">Domain expertise, prior exits, cofounder fit</div>
                </div>
              </div>
              <div className="analyze-item">
                <span className="analyze-num">05</span>
                <div>
                  <div className="analyze-nm">Ask &amp; use of funds</div>
                  <div className="analyze-desc">Raise defensibility, milestone clarity, stage fit</div>
                </div>
              </div>
              <div className="analyze-item">
                <span className="analyze-num">06</span>
                <div>
                  <div className="analyze-nm">Narrative flow</div>
                  <div className="analyze-desc">Slide-to-slide logic, cognitive load, persuasion arc</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="sidebar-title">Example reports</div>
            <div className="example-cards">
              <Link href="/report" className="example-card">
                <span className="example-score" style={{ color: 'var(--success)' }}>71</span>
                <div className="example-info">
                  <div className="example-nm">Luminary AI</div>
                  <div className="example-meta">Series A · B+ · 12 slides</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
              <Link href="/report" className="example-card">
                <span className="example-score" style={{ color: 'var(--warn)' }}>58</span>
                <div className="example-info">
                  <div className="example-nm">Meridian Health</div>
                  <div className="example-meta">Seed · C+ · 9 slides</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
              <Link href="/report" className="example-card">
                <span className="example-score" style={{ color: 'var(--success)' }}>86</span>
                <div className="example-info">
                  <div className="example-nm">Vanta Commerce</div>
                  <div className="example-meta">Series B · A- · 15 slides</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="privacy-note">
            <strong>Your deck is private.</strong> We process it in memory, store only the analysis output, and never share your content. Delete your report at any time.
          </div>
        </aside>
      </div>

      <style>{`
        /* ─── Upload page layout ─── */
        .upload-page {
          min-height: calc(100vh - 60px);
          display: grid;
          grid-template-columns: 1fr 380px;
        }

        /* Left: upload zone */
        .upload-main {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: var(--sp-sec) var(--sp-3xl);
          border-right: 1px solid var(--hairline);
        }
        .upload-header { text-align: center; margin-bottom: var(--sp-3xl); }
        .upload-h { font-family: var(--font-display); font-size: clamp(32px, 4vw, 48px); font-weight: 800; letter-spacing: -1.5px; color: var(--ink); margin-bottom: var(--sp-md); line-height: 1.0; }
        .upload-sub { font-size: 16px; color: var(--body-clr); }

        /* Drop zone */
        .drop-zone {
          width: 100%; max-width: 560px;
          border: 2px dashed var(--hairline-str);
          border-radius: var(--r-lg);
          padding: var(--sp-3xl) var(--sp-xxl);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: var(--sp-lg);
          cursor: pointer; transition: all .2s;
          background: var(--surface-bone);
          position: relative;
          text-align: center;
        }
        .drop-zone:hover, .drop-zone.dragover {
          border-color: var(--primary);
          background: color-mix(in oklch, var(--primary) 5%, var(--surface));
        }
        .drop-icon {
          width: 56px; height: 56px; border-radius: var(--r-lg);
          background: color-mix(in oklch, var(--primary) 12%, var(--surface));
          display: flex; align-items: center; justify-content: center;
          margin-bottom: var(--sp-sm);
        }
        .drop-title { font-family: var(--font-display); font-size: 22px; font-weight: 700; letter-spacing: -0.3px; color: var(--ink); }
        .drop-meta { font-size: 14px; color: var(--muted); }
        .drop-types {
          display: flex; gap: var(--sp-sm); flex-wrap: wrap; justify-content: center;
        }
        .type-pill {
          font-family: var(--font-mono); font-size: 11px; font-weight: 600;
          color: var(--muted); background: var(--hairline);
          padding: 4px 10px; border-radius: var(--r-full);
        }

        /* OR divider */
        .divider-row { display: flex; align-items: center; gap: var(--sp-lg); width: 100%; max-width: 560px; }
        .divider-line { flex: 1; height: 1px; background: var(--hairline); }
        .divider-text { font-size: 13px; color: var(--muted); }

        /* URL input row */
        .url-row { display: flex; gap: var(--sp-sm); width: 100%; max-width: 560px; }
        .url-input {
          flex: 1; height: 44px;
          background: var(--surface-card); color: var(--ink);
          border: 1px solid var(--hairline-str); border-radius: var(--r-full);
          padding: 0 var(--sp-xl);
          font-family: var(--font-body); font-size: 14px;
          outline: none; transition: border-color .15s;
        }
        .url-input::placeholder { color: var(--muted); }
        .url-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--ring-focus); }

        /* File selected state */
        .file-selected {
          display: none; width: 100%; max-width: 560px;
          background: var(--surface-card); border: 1px solid var(--hairline);
          border-radius: var(--r-lg); padding: var(--sp-xl);
        }
        .file-selected.visible { display: flex; align-items: center; gap: var(--sp-lg); }
        .file-icon {
          width: 44px; height: 44px; border-radius: var(--r-md);
          background: color-mix(in oklch, var(--primary) 12%, var(--surface));
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .file-info { flex: 1; min-width: 0; }
        .file-name { font-size: 14px; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-size { font-family: var(--font-mono); font-size: 12px; color: var(--muted); margin-top: 2px; }
        .file-remove { width: 32px; height: 32px; border-radius: var(--r-full); border: 1px solid var(--hairline-str); background: transparent; color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .15s; }
        .file-remove:hover { color: var(--danger); border-color: var(--danger); }

        /* ─── Processing state ─── */
        .processing-state { display: none; width: 100%; max-width: 560px; text-align: center; }
        .processing-state.visible { display: block; }
        .processing-ring { position: relative; width: 80px; height: 80px; margin: 0 auto var(--sp-xl); }
        .processing-ring svg { animation: spin 1.5s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .processing-title { font-family: var(--font-display); font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: var(--ink); margin-bottom: var(--sp-sm); }
        .processing-sub { font-size: 14px; color: var(--muted); margin-bottom: var(--sp-xxl); }
        .progress-steps { display: flex; flex-direction: column; gap: var(--sp-sm); text-align: left; }
        .progress-step {
          display: flex; align-items: center; gap: var(--sp-md);
          font-size: 13px; color: var(--muted);
          padding: var(--sp-sm) var(--sp-lg);
          border-radius: var(--r-md);
          transition: all .3s;
        }
        .progress-step.active { color: var(--ink); background: var(--surface-card); border: 1px solid var(--hairline); }
        .progress-step.done { color: var(--success); }
        .step-icon { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .step-icon.pending { background: var(--hairline); }
        .step-icon.spinning { background: color-mix(in oklch, var(--primary) 15%, transparent); animation: pulse 1s infinite; }
        .step-icon.check    { background: color-mix(in oklch, var(--success) 15%, transparent); }

        /* ─── Right panel ─── */
        .upload-sidebar {
          padding: var(--sp-xxl);
          display: flex; flex-direction: column; gap: var(--sp-xl);
          overflow-y: auto;
        }
        .sidebar-title { font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: var(--sp-md); }

        /* What we analyze list */
        .analyze-list { display: flex; flex-direction: column; gap: 2px; }
        .analyze-item {
          display: flex; align-items: flex-start; gap: var(--sp-md);
          padding: var(--sp-md) var(--sp-lg);
          border-radius: var(--r-md);
          transition: background .15s;
        }
        .analyze-item:hover { background: var(--surface-card); }
        .analyze-num {
          font-family: var(--font-mono); font-size: 10px; font-weight: 600;
          color: var(--primary); width: 20px; flex-shrink: 0; margin-top: 2px;
        }
        .analyze-nm  { font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
        .analyze-desc { font-size: 12px; color: var(--muted); line-height: 1.4; }

        /* Example decks */
        .example-cards { display: flex; flex-direction: column; gap: var(--sp-sm); }
        .example-card {
          display: flex; align-items: center; gap: var(--sp-md);
          background: var(--surface-card); border: 1px solid var(--hairline);
          border-radius: var(--r-md); padding: var(--sp-md) var(--sp-lg);
          text-decoration: none; transition: border-color .15s;
        }
        .example-card:hover { border-color: var(--hairline-str); text-decoration: none; }
        .example-score {
          font-family: var(--font-mono); font-size: 18px; font-weight: 600;
          color: var(--ink); width: 36px; flex-shrink: 0; font-variant-numeric: tabular-nums;
        }
        .example-info { flex: 1; }
        .example-nm { font-size: 13px; font-weight: 600; color: var(--ink); }
        .example-meta { font-size: 11px; color: var(--muted); margin-top: 1px; }

        /* Privacy note */
        .privacy-note {
          background: var(--surface-bone);
          border: 1px solid var(--hairline);
          border-radius: var(--r-md);
          padding: var(--sp-lg);
          font-size: 12px; color: var(--muted); line-height: 1.6;
        }
        .privacy-note strong { color: var(--charcoal); }

        /* ─── Responsive ─── */
        @media (max-width: 960px) {
          .upload-page { grid-template-columns: 1fr; }
          .upload-sidebar { display: none; }
          .upload-main { border-right: none; }
        }
        @media (max-width: 640px) {
          .upload-main { padding: var(--sp-xxl) var(--sp-lg); }
        }
      `}</style>
    </>
  );
}
