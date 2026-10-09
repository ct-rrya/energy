import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.config';
import { LandingNav } from '../components/LandingNav';
import { PiezoTileDemo } from '../components/PiezoTileDemo';
import { HowItWorks } from '../components/HowItWorks';
import { MonitoringPreview } from '../components/MonitoringPreview';
import { EcoChatSection } from '../components/EcoChatSection';
import { useScrollSpy } from '../hooks/useScrollSpy';
import '@/styles/landing.css';

/**
 * LandingPage Component - Jitter-style redesign
 * 
 * Signature features:
 * - Floating glass-pill navigation with sliding highlight
 * - Bricolage Grotesque typography
 * - Interactive piezo tile demo
 * - Smooth animations with cubic-bezier(0.65, 0, 0.15, 1)
 * - Full light/dark theme support
 */
export function LandingPage() {

  // Section refs for scroll-spy
  const homeRef = useRef<HTMLElement | null>(null);
  const howRef = useRef<HTMLElement | null>(null);
  const monitoringRef = useRef<HTMLElement | null>(null);
  const ecochatRef = useRef<HTMLElement | null>(null);
  const aboutRef = useRef<HTMLElement | null>(null);

  const sectionRefs = [homeRef, howRef, monitoringRef, ecochatRef, aboutRef];
  const activeIndex = useScrollSpy(sectionRefs);

  // Enable smooth scroll only on landing page
  useEffect(() => {
    document.documentElement.classList.add('landing-page-active');
    return () => {
      document.documentElement.classList.remove('landing-page-active');
    };
  }, []);

  return (
    <div className="landing-page">
      {/* Floating Navigation */}
      <LandingNav activeIndex={activeIndex} sectionRefs={sectionRefs} />

      <main>
        {/* Hero Section */}
        <section ref={homeRef} id="home" className="hero" style={{ paddingTop: '150px', paddingBottom: '70px' }}>
          <div className="wrap" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '48px', alignItems: 'center' }}>
              <div>
                <span
                  className="tag"
                  style={{
                    display: 'inline-block',
                    padding: '7px 14px',
                    borderRadius: '999px',
                    background: 'var(--landing-soft)',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '22px',
                    color: 'var(--landing-ink)',
                  }}
                >
                  Cebu Technological University, Daanbantayan Campus
                </span>
                <h1 className="landing-h1" style={{ margin: '0 0 22px', color: 'var(--landing-ink)' }}>
                  Every step can make a <em className="landing-highlight">difference</em>.
                </h1>
                <p className="landing-lead" style={{ color: 'var(--landing-mute)', maxWidth: '34em', margin: '0 0 30px' }}>
                  EcoStep turns footstep energy into measurable electricity and shows it live on a web dashboard.
                </p>
                <div className="cta" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <a
                    href="#how"
                    onClick={(e) => {
                      e.preventDefault();
                      howRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="btn go"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '11px 20px',
                      borderRadius: '999px',
                      fontWeight: 700,
                      fontSize: '15px',
                      border: '1px solid var(--landing-green)',
                      background: 'var(--landing-green)',
                      color: 'var(--landing-green-ink)',
                      textDecoration: 'none',
                      transition: 'transform 0.25s cubic-bezier(0.65, 0, 0.15, 1), box-shadow 0.25s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--landing-shadow)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    See how it works
                  </a>
                  <Link
                    to={ROUTES.DASHBOARD}
                    className="btn"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '11px 20px',
                      borderRadius: '999px',
                      fontWeight: 700,
                      fontSize: '15px',
                      border: '1px solid var(--landing-line)',
                      background: 'var(--landing-surface)',
                      color: 'var(--landing-ink)',
                      cursor: 'pointer',
                      transition: 'transform 0.25s cubic-bezier(0.65, 0, 0.15, 1), box-shadow 0.25s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--landing-shadow)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    View Dashboard
                  </Link>
                </div>
              </div>
              <PiezoTileDemo />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section ref={howRef} id="how" style={{ padding: '96px 0' }}>
          <div className="wrap" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
            <HowItWorks />
          </div>
        </section>

        {/* Monitoring Preview */}
        <section ref={monitoringRef} id="monitoring" style={{ padding: '96px 0' }}>
          <div className="wrap" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
            <MonitoringPreview />
          </div>
        </section>

        {/* EcoChat */}
        <section ref={ecochatRef} id="ecochat" style={{ padding: '96px 0' }}>
          <div className="wrap" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
            <EcoChatSection />
          </div>
        </section>

        {/* About / Final CTA */}
        <section ref={aboutRef} id="about" className="end" style={{ textAlign: 'center', padding: '96px 0 70px' }}>
          <div className="wrap" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
            <h2 className="landing-h2" style={{ color: 'var(--landing-ink)', margin: '0 0 14px' }}>
              Built for CTU Daanbantayan
            </h2>
            <p
              className="sub"
              style={{
                color: 'var(--landing-mute)',
                fontSize: '19px',
                maxWidth: '36em',
                margin: '0 auto 30px',
              }}
            >
              A student-developed IoT energy monitoring system for research, innovation, and awareness of the energy generated by footsteps.
            </p>
            <div className="cta" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
              <a
                href="#how"
                onClick={(e) => {
                  e.preventDefault();
                  howRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="btn go"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: '1px solid var(--landing-green)',
                  background: 'var(--landing-green)',
                  color: 'var(--landing-green-ink)',
                  textDecoration: 'none',
                  transition: 'transform 0.25s cubic-bezier(0.65, 0, 0.15, 1), box-shadow 0.25s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--landing-shadow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Explore EcoStep
              </a>
              <Link
                to={ROUTES.DASHBOARD}
                className="btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '11px 20px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: '1px solid var(--landing-line)',
                  background: 'var(--landing-surface)',
                  color: 'var(--landing-ink)',
                  cursor: 'pointer',
                  transition: 'transform 0.25s cubic-bezier(0.65, 0, 0.15, 1), box-shadow 0.25s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--landing-shadow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', color: 'var(--landing-mute)', fontSize: '14px', padding: '0 24px 40px' }}>
        EcoStep Energy Monitoring System, Cebu Technological University
      </footer>

      {/* Mobile responsive adjustments */}
      <style>{`
        @media (max-width: 900px) {
          .hero .wrap > div {
            grid-template-columns: 1fr;
          }
          section {
            padding: 72px 0;
          }
        }
      `}</style>
    </div>
  );
}
