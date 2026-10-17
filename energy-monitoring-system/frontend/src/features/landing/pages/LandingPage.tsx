import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/routes.config';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { LandingNav } from '../components/LandingNav';
import { PiezoTileDemo } from '../components/PiezoTileDemo';
import { HowItWorks } from '../components/HowItWorks';
import { MonitoringPreview } from '../components/MonitoringPreview';
import { EcoChatSection } from '../components/EcoChatSection';
import { useScrollSpy } from '../hooks/useScrollSpy';
import '@/styles/landing.css';

/**
 * LandingPage Component
 * 
 * Performance & Motion Architecture:
 * - GPU-accelerated: Only animates `transform` and `opacity`
 * - Staggered Hero entrance (finishes in <850ms)
 * - Single-play scroll reveals via IntersectionObserver (no scroll listeners)
 * - Slow ambient background drift in pure CSS
 * - Interactive piezo tile demo and responsive device mockup
 * - Full prefers-reduced-motion accessibility support
 */
export function LandingPage() {
  const isMobile = useMediaQuery('(max-width: 767px)');

  // Section refs for scroll-spy and scroll reveals
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

  // High-performance single-play scroll reveals using IntersectionObserver
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      // Fallback: immediately reveal all sections
      [howRef, monitoringRef, ecochatRef, aboutRef].forEach((ref) => {
        ref.current?.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            // Unobserve immediately so animation only plays once and costs zero runtime CPU
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    [howRef, monitoringRef, ecochatRef, aboutRef].forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page" style={{ position: 'relative' }}>
      {/* Slow Ambient Background Drift (GPU-only pure CSS) */}
      <div className="ambient-glow-wrapper" aria-hidden="true">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
      </div>

      {/* CTU-DB Campus Photo Watermark */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          opacity: 0.05,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: 'url(/ctudb.svg)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
        }}
        aria-hidden="true"
      />

      {/* Jitter-Style Adaptive Floating Navigation */}
      <LandingNav activeIndex={activeIndex} sectionRefs={sectionRefs} />

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* Hero Section with Staggered Entrance (<850ms) */}
        <section ref={homeRef} id="home" className="hero-section hero">
          <div className="landing-page-wrap">
            <div className="hero-grid">
              <div>
                {/* 1. Tag (Delay: 0ms) */}
                <span
                  className="tag hero-stagger-1"
                  style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    background: 'var(--landing-soft)',
                    fontWeight: 600,
                    fontSize: isMobile ? '12px' : '13.5px',
                    lineHeight: '1.4',
                    marginBottom: isMobile ? '14px' : '20px',
                    color: isMobile ? '#16a34a' : 'var(--landing-ink)',
                    border: '1px solid var(--landing-line)',
                    maxWidth: '100%',
                    wordBreak: 'break-word',
                  }}
                >
                  {isMobile ? 'CTU Daanbantayan Campus' : 'Cebu Technological University, Daanbantayan Campus'}
                </span>

                {/* 2. Headline (Delay: 90ms) */}
                <h1
                  className="landing-h1 hero-stagger-2"
                  style={{
                    margin: '0 0 16px',
                    color: 'var(--landing-ink)',
                    fontSize: isMobile ? '34px' : undefined,
                    lineHeight: isMobile ? '1.1' : undefined,
                  }}
                >
                  Every step can make a <em className="landing-highlight" style={{ fontStyle: 'normal' }}>difference.</em>
                </h1>

                {/* 3. Lead text (Delay: 180ms) */}
                <p
                  className="landing-lead hero-stagger-3"
                  style={{
                    color: 'var(--landing-mute)',
                    maxWidth: '34em',
                    margin: isMobile ? '0 0 20px' : '0 0 28px',
                    fontSize: isMobile ? '14px' : undefined,
                    lineHeight: isMobile ? '1.45' : undefined,
                  }}
                >
                  EcoStep turns footstep energy into measurable electricity and shows it live on a web dashboard.
                </p>

                {/* 4. CTA buttons (Delay: 270ms) */}
                <div
                  className="cta hero-stagger-4"
                  style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '10px' : '12px',
                    width: '100%',
                  }}
                >
                  <a
                    href="#how"
                    onClick={(e) => {
                      e.preventDefault();
                      howRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="btn go btn-micro"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: isMobile ? '13px 20px' : '12px 22px',
                      borderRadius: '999px',
                      fontWeight: 700,
                      fontSize: '15px',
                      border: '1px solid var(--landing-green)',
                      background: 'var(--landing-green)',
                      color: 'var(--landing-green-ink)',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      width: isMobile ? '100%' : 'auto',
                      boxSizing: 'border-box',
                    }}
                  >
                    See how it works
                    {!isMobile && <span className="arrow-micro">→</span>}
                  </a>
                  <Link
                    to={ROUTES.DASHBOARD}
                    className="btn btn-micro"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: isMobile ? '13px 20px' : '12px 22px',
                      borderRadius: '999px',
                      fontWeight: 700,
                      fontSize: '15px',
                      border: '1px solid var(--landing-line)',
                      background: 'var(--landing-surface)',
                      color: 'var(--landing-ink)',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      width: isMobile ? '100%' : 'auto',
                      boxSizing: 'border-box',
                    }}
                  >
                    View dashboard
                  </Link>
                </div>
              </div>

              {/* 5. Hero Product Visual (Delay: 200ms) */}
              <div className="hero-stagger-5" style={{ width: '100%', maxWidth: '420px', margin: '0 auto' }}>
                <PiezoTileDemo />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works (Scroll Reveal) */}
        <section
          ref={howRef}
          id="how"
          className="scroll-reveal landing-section-py"
          style={{ padding: isMobile ? '40px 0' : '80px 0' }}
        >
          <div className="landing-page-wrap">
            <HowItWorks />
          </div>
        </section>

        {/* Monitoring Preview (Scroll Reveal, Fits in single viewport on desktop) */}
        <section
          ref={monitoringRef}
          id="monitoring"
          className="scroll-reveal landing-section-monitoring"
          style={{
            minHeight: isMobile ? 'auto' : 'calc(100vh - 80px)',
            display: 'flex',
            alignItems: 'center',
            padding: isMobile ? '36px 0' : '36px 0',
          }}
        >
          <div className="landing-page-wrap">
            <MonitoringPreview />
          </div>
        </section>

        {/* EcoChat (Scroll Reveal) */}
        <section
          ref={ecochatRef}
          id="ecochat"
          className="scroll-reveal landing-section-py"
          style={{ padding: isMobile ? '40px 0' : '80px 0' }}
        >
          <div className="landing-page-wrap">
            <EcoChatSection />
          </div>
        </section>

        {/* About / Final CTA (Scroll Reveal) */}
        <section
          ref={aboutRef}
          id="about"
          className="end scroll-reveal landing-section-py"
          style={{
            textAlign: isMobile ? 'left' : 'center',
            padding: isMobile ? '44px 0 36px' : '80px 0 60px',
            background: isMobile ? '#0d271e' : 'transparent',
            color: isMobile ? '#ffffff' : 'inherit',
            marginTop: isMobile ? '32px' : 0,
          }}
        >
          <div className="landing-page-wrap">
            <h2
              className="landing-h2"
              style={{
                color: isMobile ? '#ffffff' : 'var(--landing-ink)',
                margin: '0 0 12px',
                fontSize: isMobile ? '26px' : undefined,
                lineHeight: 1.15,
              }}
            >
              Built for CTU Daanbantayan
            </h2>
            <p
              className="sub"
              style={{
                color: isMobile ? '#a7c2b3' : 'var(--landing-mute)',
                fontSize: isMobile ? '14px' : '19px',
                maxWidth: '36em',
                margin: isMobile ? '0 0 24px' : '0 auto 30px',
                lineHeight: 1.45,
              }}
            >
              A student-developed IoT energy monitoring system for research, innovation, and awareness of the energy generated by footsteps.
            </p>
            <div
              className="cta"
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                flexWrap: 'wrap',
                gap: '12px',
                justifyContent: isMobile ? 'stretch' : 'center',
              }}
            >
              <a
                href="#how"
                onClick={(e) => {
                  e.preventDefault();
                  howRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="btn go btn-micro"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: '1px solid var(--landing-green)',
                  background: 'var(--landing-green)',
                  color: 'var(--landing-green-ink)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  width: isMobile ? '100%' : 'auto',
                  boxSizing: 'border-box',
                }}
              >
                Explore EcoStep
                <span className="arrow-micro">→</span>
              </a>
              <Link
                to={ROUTES.DASHBOARD}
                className="btn btn-micro"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 22px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: isMobile ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid var(--landing-line)',
                  background: isMobile ? 'rgba(255, 255, 255, 0.08)' : 'var(--landing-surface)',
                  color: isMobile ? '#ffffff' : 'var(--landing-ink)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  width: isMobile ? '100%' : 'auto',
                  boxSizing: 'border-box',
                }}
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          color: isMobile ? '#6e8579' : 'var(--landing-mute)',
          fontSize: '13px',
          padding: isMobile ? '16px 16px 28px' : '0 16px 36px',
          background: isMobile ? '#0d271e' : 'transparent',
          position: 'relative',
          zIndex: 1,
        }}
      >
        EcoStep Energy Monitoring System, Cebu Technological University
      </footer>
    </div>
  );
}
