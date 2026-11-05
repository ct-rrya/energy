import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.config';
import { useTheme } from '@/contexts/ThemeContext';
import '@/styles/landing.css';

const DEMO_VALUES = [12, 18, 14, 25, 21, 30, 17, 26, 15, 32, 24, 19];
const DEMO_LABELS = [
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
];

const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'how', label: 'How it works' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'ecochat', label: 'EcoChat' },
  { id: 'about', label: 'About' },
] as const;

export function LandingPage() {
  const { toggleTheme } = useTheme();
  const [stepsCount, setStepsCount] = useState(0);
  const [energyVal, setEnergyVal] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Active section observer (threshold: 0.55) + entrance blur-fade reveal observer (threshold: 0.16)
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      sectionRefs.current.forEach((sec) => sec?.classList.add('in-view'));
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
      { threshold: 0.55 }
    );

    const revealIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          } else if (entry.intersectionRatio === 0) {
            entry.target.classList.remove('in-view');
          }
        });
      },
      { threshold: [0, 0.04], rootMargin: '60px 0px' }
    );

    sectionRefs.current.forEach((sec) => {
      if (sec) {
        activeIo.observe(sec);
        revealIo.observe(sec);
      }
    });

    return () => {
      activeIo.disconnect();
      revealIo.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    };
  }, []);

  const handleStepClick = () => {
    setStepsCount((c) => c + 1);
    setEnergyVal((e) => e + 0.12);
    setIsPressed(true);
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      setIsPressed(false);
    }, 90);
  };

  return (
    <div className={`es-lp ${isScrolled ? 'sm' : ''}`}>
      <div className="es-bgl" aria-hidden="true" />
      <div className="es-edge-blur-top" aria-hidden="true" />
      <div className="es-edge-blur-bottom" aria-hidden="true" />

      <header className="es-hd" id="hd">
        <a className="es-logo" href="#home" aria-label="EcoStep home">
          <i>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0D1B14"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <ellipse cx="8" cy="8" rx="2.6" ry="3.6" />
              <ellipse cx="16" cy="14" rx="2.6" ry="3.6" />
              <path d="M8 13v2M16 6v1" />
            </svg>
          </i>
          <b>EcoStep</b>
        </a>

        <nav className="es-nv" aria-label="Primary">
          {SECTIONS.map((sec, idx) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className={activeIdx === idx ? 'on' : ''}
            >
              {sec.label}
            </a>
          ))}
        </nav>

        <div className="es-rt">
          <Link className="es-btn p adm" to={ROUTES.ADMIN_LOGIN}>
            Admin login
          </Link>
          <button
            type="button"
            className="es-ic"
            id="th"
            aria-label="Toggle theme"
            onClick={toggleTheme}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
            </svg>
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
        <div className="es-pn-links">
          {SECTIONS.map((sec, idx) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className={activeIdx === idx ? 'on' : ''}
            >
              {sec.label}
            </a>
          ))}
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
            <button
              type="button"
              className={`step ${isPressed ? 'pr' : ''}`}
              id="step"
              onClick={handleStepClick}
            >
              Step here
            </button>
            <div className="stats">
              <div>
                <b id="sc">{stepsCount}</b>Steps
              </div>
              <div>
                <b id="en">{energyVal.toFixed(1)}</b>mWh (demo)
              </div>
            </div>
            <p className="cap">
              Interactive demo with simulated values. Live readings are on the
              Dashboard page.
            </p>
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
            A piezoelectric tile captures the pressure of each step. An ESP32
            sends the readings online.
          </p>
          <div className="cards">
            <div className="es-cd">
              <div className="es-n">1</div>
              <h3>Step</h3>
              <p>Students walk across the piezoelectric tile.</p>
            </div>
            <div className="es-cd">
              <div className="es-n">2</div>
              <h3>Harvest</h3>
              <p>
                The tile converts mechanical energy into electrical energy.
              </p>
            </div>
            <div className="es-cd">
              <div className="es-n">3</div>
              <h3>Measure</h3>
              <p>Sensors read the voltage, current, and power generated.</p>
            </div>
            <div className="es-cd">
              <div className="es-n">4</div>
              <h3>Monitor</h3>
              <p>The ESP32 sends the data to the EcoStep web dashboard.</p>
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
            Energy, electrical measurements, system status and analytics in one
            live dashboard.
          </p>
          <div className="lp">
            <div className="scr">
              <div className="es-tb">
                <i style={{ background: '#ff5f57' }} />
                <i style={{ background: '#febc2e' }} />
                <i style={{ background: '#28c840' }} />
                <b>EcoStep Central</b>
                <span>&middot; 100 Hz Piezoelectric Tile</span>
                <div className="live">&#9679; LIVE PREVIEW</div>
              </div>
              <div className="kp">
                <div>
                  <small>Voltage</small>
                  <b>4.85 V</b>
                </div>
                <div>
                  <small>Current</small>
                  <b>14.20 mA</b>
                </div>
                <div>
                  <small>Power</small>
                  <b>68.90 mW</b>
                </div>
                <div>
                  <small>System</small>
                  <b>Active</b>
                </div>
              </div>
              <div className="ch">
                <b>Energy Generation Over Time</b>{' '}
                <span style={{ opacity: 0.6 }}>(mJ)</span>
                <div className="bars" id="bars">
                  {DEMO_VALUES.map((v, i) => (
                    <i key={i} style={{ height: `${(v / 32) * 100}%` }} />
                  ))}
                </div>
                <div className="xl" id="xl">
                  {DEMO_LABELS.map((lbl) => (
                    <span key={lbl}>{lbl.replace(':00', '')}</span>
                  ))}
                </div>
                <div className="ft">
                  <span>Illustrative Demo Data &mdash; Not Live Readings</span>
                  <span>Sample: 243 mJ</span>
                </div>
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
            Click to access live database readings &amp; diagnostics
          </p>
        </section>

        <section
          id="ecochat"
          className="es-chat"
          ref={(el) => {
            sectionRefs.current[3] = el;
          }}
        >
          <div className="l">
            <h2>Ask EcoChat anything about EcoStep</h2>
            <p className="lead">
              The built-in AI assistant helps visitors understand the system
              and find the energy data they need.
            </p>
            <Link className="es-btn" to={ROUTES.DASHBOARD}>
              Ask EcoStep &rarr;
            </Link>
          </div>
          <div className="msgs">
            <div className="bb">
              <b>EcoChat</b>Hi! I’m your EcoStep assistant. Ask me about energy
              status, analytics, or system insights.
            </div>
            <div className="bb me">How does a footstep make power?</div>
            <div className="bb">
              <b>EcoChat</b>Each step presses the piezoelectric tile, which
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
          <h2>Built for CTU Daanbantayan</h2>
          <p className="lead">
            A student-developed IoT energy monitoring system for research,
            innovation, and awareness of the energy generated by footsteps.
          </p>
          <div className="es-row" style={{ justifyContent: 'center' }}>
            <a className="es-btn" href="#how">
              Explore EcoStep &rarr;
            </a>
            <Link className="es-btn p" to={ROUTES.DASHBOARD}>
              View Dashboard
            </Link>
          </div>
          <footer>
            EcoStep Energy Monitoring System, Cebu Technological University
          </footer>
        </section>
      </main>
    </div>
  );
}
