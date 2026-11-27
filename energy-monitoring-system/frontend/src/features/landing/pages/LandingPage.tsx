import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.config';
import { useTheme } from '@/contexts/ThemeContext';
import { EcoStepBrandLockup } from '@/components/common/EcoStepLogo';
import { MaintenanceOverlay } from '@/components/common/MaintenanceOverlay';
import { EcoStepMat } from '../components/EcoStepMat';
import '@/styles/landing.css';

const PREVIEW_SLIDES: ReadonlyArray<{
  id: string;
  label: string;
  pathLabel: string;
  caption: string;
  to: string;
  lightSrc: string;
  darkSrc: string;
}> = [
  {
    id: 'central',
    label: 'Central',
    pathLabel: 'ecostep.cebutech.digital/dashboard',
    caption: 'Live footstep power, today’s harvested energy, and campus milestones',
    to: ROUTES.DASHBOARD,
    lightSrc: '/previews/central-light.png',
    darkSrc: '/previews/central-dark.png',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    pathLabel: 'ecostep.cebutech.digital/analytics',
    caption: 'Interactive power, step count, voltage, and hourly trend charts',
    to: ROUTES.ANALYTICS,
    lightSrc: '/previews/analytics-light.png',
    darkSrc: '/previews/analytics-dark.png',
  },
  {
    id: 'reports',
    label: 'Reports',
    pathLabel: 'ecostep.cebutech.digital/reports',
    caption: 'Generate and download official campus energy reports in PDF or CSV',
    to: ROUTES.REPORTS,
    lightSrc: '/previews/reports-light.png',
    darkSrc: '/previews/reports-dark.png',
  },
  {
    id: 'ecommunity',
    label: 'ECommunity',
    pathLabel: 'ecostep.cebutech.digital/feedback',
    caption: 'Public campus Q&A board for tile issues, reviews, and feature ideas',
    to: ROUTES.FEEDBACK,
    lightSrc: '/previews/ecommunity-light.png',
    darkSrc: '/previews/ecommunity-dark.png',
  },
];

const SECTIONS: ReadonlyArray<{ id: string; label: string; to?: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'how', label: 'How it works' },
  { id: 'dashboard', label: 'Dashboard', to: ROUTES.DASHBOARD },
  { id: 'ecoguide', label: 'EcoGuide' },
  { id: 'about', label: 'About' },
];

const RESEARCH_TEAM = [
  { name: 'Lord Jason Riveral', role: 'Project Lead · Hardware Lead', initials: 'LR', lead: true },
  { name: 'Merry Apple Edaño', role: 'Software and Manuscript Lead', initials: 'ME', lead: true },
  { name: 'Jerome Magdadaro', role: 'Hardware Assistant', initials: 'JM', lead: false },
  { name: 'Jhemarsh Lee Conde', role: 'Documentation and Debugging', initials: 'JC', lead: false },
  { name: 'Alyza Pitogo', role: 'Documentation and Debugging', initials: 'AP', lead: false },
  { name: 'Francis Keith Banan', role: 'Documentation · Hardware Worker', initials: 'FB', lead: false },
] as const;

const HOME_FAQS = [
  {
    q: 'How does a footstep generate electricity?',
    a: 'Each step presses smart energy-harvesting pads inside the floor tile, turning everyday walking pressure into a small burst of clean electrical energy.',
  },
  {
    q: 'How much energy does EcoStep collect?',
    a: 'Every footstep adds a tiny fraction of a milliwatt-hour (mWh) to onboard storage. Around 50 footsteps can power a small indicator LED light for about a second—and steps add up all day.',
  },
  {
    q: 'Do I need an account to view live energy data?',
    a: 'No account needed! Any student or guest can open the Dashboard, Analytics, Milestones, and EcoGuide assistant directly.',
  },
] as const;

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [previewIdx, setPreviewIdx] = useState(0);

  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Pure automatic slideshow across public EcoStep pages every 4 seconds
  useEffect(() => {
    const timer = window.setInterval(() => {
      setPreviewIdx((idx) => (idx + 1) % PREVIEW_SLIDES.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  // Enable landing page styling and ensure document scrolling is unlocked while mounted
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add('landing-page-active');
    html.style.overflowY = 'auto';
    html.style.height = 'auto';
    body.style.overflow = 'visible';
    body.style.height = 'auto';

    return () => {
      html.classList.remove('landing-page-active');
      html.style.overflowY = '';
      html.style.height = '';
      body.style.overflow = '';
      body.style.height = '';
    };
  }, []);

  // Header collapse on scroll (> 40px)
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 40;
      setIsScrolled(scrolled);
      if (!scrolled && window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Active section observer (threshold: 0.45) to highlight current nav link
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const activeIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.indexOf(entry.target as HTMLElement);
            if (idx !== -1) {
              setActiveIdx(idx);
            }
          }
        });
      },
      { threshold: 0.45 }
    );

    sectionRefs.current.forEach((sec) => {
      if (sec) {
        activeIo.observe(sec);
      }
    });

    return () => {
      activeIo.disconnect();
    };
  }, []);

  return (
    <div className={`es-lp ${isScrolled ? 'sm' : ''}`}>
      <div className="es-bgl" aria-hidden="true" />
      <div className="es-edge-blur-top" aria-hidden="true" />
      <div className="es-edge-blur-bottom" aria-hidden="true" />
      <MaintenanceOverlay />

      <header className="es-hd" id="hd">
        <EcoStepBrandLockup
          markHeight={32}
          wordmarkSize="1.35rem"
          href="#home"
          className="es-logo"
        />

        <nav className="es-nv" aria-label="Primary">
          {SECTIONS.map((sec, idx) =>
            sec.to ? (
              <Link key={sec.id} to={sec.to}>
                {sec.label}
              </Link>
            ) : (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className={activeIdx === idx ? 'on' : ''}
              >
                {sec.label}
              </a>
            )
          )}
        </nav>

        <div className="es-rt">
          <Link className="es-btn p adm" to={ROUTES.ADMIN_LOGIN}>
            Admin login
          </Link>
          <button
            type="button"
            className="es-ic"
            id="th"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="es-mb"
            id="mb"
            aria-expanded={menuOpen}
            aria-controls="pn"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
                Close
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
                Menu
              </>
            )}
          </button>
        </div>
      </header>

      <div
        className={`es-pn ${menuOpen ? 'open' : ''}`}
        id="pn"
        onClick={() => setMenuOpen(false)}
      >
        <div className="es-pn-brand">
          <EcoStepBrandLockup
            markHeight={26}
            wordmarkSize="1.15rem"
            href="#home"
            className="es-logo"
            onClick={() => setMenuOpen(false)}
          />
        </div>
        <div className="es-pn-links">
          {SECTIONS.map((sec, idx) =>
            sec.to ? (
              <Link key={sec.id} to={sec.to}>
                {sec.label}
              </Link>
            ) : (
              <a
                key={sec.id}
                href={`#${sec.id}`}
                className={activeIdx === idx ? 'on' : ''}
              >
                {sec.label}
              </a>
            )
          )}
        </div>
        <Link className="es-pn-adm" to={ROUTES.ADMIN_LOGIN}>
          Admin login
        </Link>
      </div>

      <main>
        <section
          id="home"
          className="es-hero in-view"
          ref={(el) => {
            sectionRefs.current[0] = el;
          }}
        >
          <div className="l">
            <div className="tag">
              Cebu Technological University, Daanbantayan Campus
            </div>
            <h1>
              Every step can make a <u>difference.</u>
            </h1>
            <p className="lead">
              EcoStep turns footstep energy into measurable electricity and
              shows it live on a web dashboard.
            </p>
            <div className="es-row">
              <a className="es-btn" href="#how">
                See how it works &rarr;
              </a>
              <Link className="es-btn p" to={ROUTES.DASHBOARD}>
                View dashboard
              </Link>
            </div>
          </div>
          <div className="r">
            <EcoStepMat className="w-full max-w-[540px] mx-auto select-none" />
          </div>
        </section>

        <section
          id="how"
          ref={(el) => {
            sectionRefs.current[1] = el;
          }}
        >
          <h2>From footstep to dashboard in four moves</h2>
          <p className="lead">
            A smart floor tile captures the pressure of each step, and built-in
            sensors send the readings live online.
          </p>
          <div className="cards">
            <div className="es-cd">
              <div className="es-n">1</div>
              <h3>Step</h3>
              <p>Students walk across the smart floor tile.</p>
            </div>
            <div className="es-cd">
              <div className="es-n">2</div>
              <h3>Harvest</h3>
              <p>
                The tile turns footstep pressure into usable electrical energy.
              </p>
            </div>
            <div className="es-cd">
              <div className="es-n">3</div>
              <h3>Measure</h3>
              <p>Built-in sensors measure voltage, current, and power.</p>
            </div>
            <div className="es-cd">
              <div className="es-n">4</div>
              <h3>Monitor</h3>
              <p>Live updates appear right away on the EcoStep dashboard.</p>
            </div>
          </div>
        </section>

        <section
          id="dashboard"
          className="dash"
          ref={(el) => {
            sectionRefs.current[2] = el;
          }}
        >
          <h2>See what others are generating</h2>
          <p className="lead">
            Energy, electrical measurements, system status, reports, and
            community insights in one live platform.
          </p>

          <div className="lp" aria-label="EcoStep live page preview slideshow">
            <div className="scr scr-preview">
              <div className="es-tb">
                <i style={{ background: '#ff5f57' }} />
                <i style={{ background: '#febc2e' }} />
                <i style={{ background: '#28c840' }} />
                <b>EcoStep {PREVIEW_SLIDES[previewIdx].label}</b>
                <span>&middot; {PREVIEW_SLIDES[previewIdx].pathLabel}</span>
                <div className="live">&#9679; LIVE SITE PREVIEW</div>
              </div>
              <div className="es-preview-stage">
                {PREVIEW_SLIDES.map((slide, idx) => (
                  <img
                    key={slide.id}
                    src={theme === 'dark' ? slide.darkSrc : slide.lightSrc}
                    alt={`EcoStep ${slide.label} page preview (${theme} mode)`}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    className={`es-preview-img ${previewIdx === idx ? 'is-active' : ''}`}
                  />
                ))}
              </div>
            </div>
            <div className="base" />
          </div>

          <div className="es-row" style={{ justifyContent: 'center' }}>
            <Link className="es-btn p" to={ROUTES.DASHBOARD}>
              Open Dashboard &rarr;
            </Link>
          </div>
          <p className="cap" style={{ maxWidth: 'none' }}>
            {PREVIEW_SLIDES[previewIdx].caption}
          </p>
        </section>

        <section
          id="ecoguide"
          className="es-chat"
          ref={(el) => {
            sectionRefs.current[3] = el;
          }}
        >
          <div className="l">
            <h2>Ask EcoGuide anything about EcoStep</h2>
            <p className="lead">
              The built-in AI assistant helps visitors understand the system
              and find the energy data they need.
            </p>
            <Link className="es-btn" to={ROUTES.DASHBOARD}>
              Ask EcoGuide &rarr;
            </Link>
          </div>
          <div className="msgs">
            <div className="bb">
              <b>EcoGuide</b>Hi! I’m your EcoStep assistant. Ask me about energy
              status, analytics, or system insights.
            </div>
            <div className="bb me">How does a footstep make power?</div>
            <div className="bb">
              <b>EcoGuide</b>Each step presses the piezoelectric tile, which
              turns that pressure into a small electric charge we measure.
            </div>
          </div>
        </section>

        <section
          id="about"
          className="abt"
          ref={(el) => {
            sectionRefs.current[4] = el;
          }}
        >
          <div className="es-abt-wrap">
            <h2>About EcoStep</h2>
            <p className="lead">
              EcoStep is a smart footstep energy harvesting and monitoring
              system. Each step on the floor tile creates clean electrical
              energy that is measured by built-in sensors and shared live on
              this platform for real-time tracking, analytics, milestone goals,
              and tile health checks.
            </p>

            <div className="es-row" style={{ justifyContent: 'center' }}>
              <a className="es-btn" href="#how">
                Explore EcoStep &rarr;
              </a>
              <Link className="es-btn p" to={ROUTES.DASHBOARD}>
                View Dashboard
              </Link>
            </div>

            <div className="es-abt-block">
              <h3 className="es-abt-sub">Research Team</h3>
              <div className="es-team-grid">
                {RESEARCH_TEAM.map((member) => (
                  <div key={member.name} className="es-team-card">
                    <div className={`es-team-av ${member.lead ? 'lead' : ''}`}>
                      {member.initials}
                    </div>
                    <div className="es-team-info">
                      <strong>{member.name}</strong>
                      <span>{member.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="es-abt-block" id="faq">
              <h3 className="es-abt-sub">Frequently Asked Questions</h3>
              <div style={{ display: 'grid', gap: '10px', textAlign: 'left', maxWidth: '720px', width: '100%', margin: '0 auto' }}>
                {HOME_FAQS.map((item) => (
                  <details
                    key={item.q}
                    style={{
                      borderRadius: '14px',
                      border: '1px solid var(--line)',
                      background: 'var(--card)',
                      padding: '12px 16px',
                    }}
                  >
                    <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.92rem', color: 'var(--t)' }}>
                      {item.q}
                    </summary>
                    <p style={{ marginTop: '8px', fontSize: '0.84rem', lineHeight: 1.5, color: 'var(--mu)' }}>
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <footer className="es-footer">
            <div className="es-footer-brand">
              <EcoStepBrandLockup
                markHeight={26}
                wordmarkSize="1.15rem"
                href="#home"
                className="es-logo"
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', fontSize: '0.85rem' }}>
              <Link to={ROUTES.DASHBOARD} style={{ color: 'var(--t)', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
              <Link to={ROUTES.ANALYTICS} style={{ color: 'var(--t)', textDecoration: 'none', fontWeight: 500 }}>Analytics</Link>
              <Link to={ROUTES.MILESTONES} style={{ color: 'var(--t)', textDecoration: 'none', fontWeight: 500 }}>Milestones</Link>
              <Link to={ROUTES.ABOUT} style={{ color: 'var(--t)', textDecoration: 'none', fontWeight: 500 }}>About &amp; Team</Link>
              <Link to={`${ROUTES.LEGAL}?tab=privacy`} style={{ color: 'var(--t)', textDecoration: 'none', fontWeight: 500 }}>Privacy</Link>
              <Link to={`${ROUTES.LEGAL}?tab=terms`} style={{ color: 'var(--t)', textDecoration: 'none', fontWeight: 500 }}>Terms</Link>
              <Link to={`${ROUTES.LEGAL}?tab=cookies`} style={{ color: 'var(--t)', textDecoration: 'none', fontWeight: 500 }}>Cookies</Link>
              <Link to={`${ROUTES.LEGAL}?tab=community`} style={{ color: 'var(--t)', textDecoration: 'none', fontWeight: 500 }}>Guidelines</Link>
              <a href="#faq" style={{ color: 'var(--t)', textDecoration: 'none', fontWeight: 500 }}>FAQ</a>
            </div>
            <span>Questions or feedback? Reach out to the EcoStep Research Team or ask EcoGuide inside the dashboard.</span>
          </footer>
        </section>
      </main>
    </div>
  );
}
