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
        <section ref={homeRef} id="home" className="hero" style={{ paddingTop: '140px', paddingBottom: '60px' }}>
          <div className="wrap" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '48px', alignItems: 'center' }}>
              <div>
                {/* 1. Tag (Delay: 0ms) */}
                <span
                  className="tag hero-stagger-1"
                  style={{
                    display: 'inline-block',
                    padding: '7px 14px',
                    borderRadius: '999px',
                    background: 'var(--landing-soft)',
                    fontWeight: 600,
                    fontSize: '14px',
                    marginBottom: '20px',
                    color: 'var(--landing-ink)',
                    border: '1px solid var(--landing-line)',
                  }}
                >
                  Cebu Technological University, Daanbantayan Campus
                </span>

                {/* 2. Headline (Delay: 90ms) */}
                <h1 className="landing-h1 hero-stagger-2" style={{ margin: '0 0 20px', color: 'var(--landing-ink)' }}>
                  Every step can make a <em className="landing-highlight">difference</em>.
                </h1>

                {/* 3. Lead text (Delay: 180ms) */}
                <p className="landing-lead hero-stagger-3" style={{ color: 'var(--landing-mute)', maxWidth: '34em', margin: '0 0 28px' }}>
                  EcoStep turns footstep energy into measurable electricity and shows it live on a web dashboard.
                </p>

                {/* 4. CTA buttons (Delay: 270ms) */}
                <div className="cta hero-stagger-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
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
                    }}
                  >
                    See how it works
                    <span className="arrow-micro">→</span>
                  </a>
                  <Link
                    to={ROUTES.DASHBOARD}
                    className="btn btn-micro"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 22px',
                      borderRadius: '999px',
                      fontWeight: 700,
                      fontSize: '15px',
                      border: '1px solid var(--landing-line)',
                      background: 'var(--landing-surface)',
                      color: 'var(--landing-ink)',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                  >
                    View Dashboard
                  </Link>
                </div>
              </div>

              {/* 5. Hero Product Visual (Delay: 200ms) */}
              <div className="hero-stagger-5">
                <PiezoTileDemo />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works (Scroll Reveal) */}
        <section
          ref={howRef}
          id="how"
          className="scroll-reveal"
          style={{ padding: '80px 0' }}
        >
          <div className="wrap" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
            <HowItWorks />
          </div>
        </section>

        {/* Monitoring Preview (Scroll Reveal, Fits in single viewport) */}
        <section
          ref={monitoringRef}
          id="monitoring"
          className="scroll-reveal"
          style={{
            minHeight: 'calc(100vh - 80px)',
            display: 'flex',
            alignItems: 'center',
            padding: '36px 0',
          }}
        >
          <div className="wrap" style={{ maxWidth: '1120px', width: '100%', margin: '0 auto', padding: '0 24px' }}>
            <MonitoringPreview />
          </div>
        </section>

        {/* EcoChat (Scroll Reveal) */}
        <section
          ref={ecochatRef}
          id="ecochat"
          className="scroll-reveal"
          style={{ padding: '80px 0' }}
        >
          <div className="wrap" style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px' }}>
            <EcoChatSection />
          </div>
        </section>

        {/* About / Final CTA (Scroll Reveal) */}
        <section
          ref={aboutRef}
          id="about"
          className="end scroll-reveal"
          style={{ textAlign: 'center', padding: '80px 0 60px' }}
        >
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
                className="btn go btn-micro"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
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
                  gap: '8px',
                  padding: '12px 22px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  fontSize: '15px',
                  border: '1px solid var(--landing-line)',
                  background: 'var(--landing-surface)',
                  color: 'var(--landing-ink)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', color: 'var(--landing-mute)', fontSize: '14px', padding: '0 24px 36px', position: 'relative', zIndex: 1 }}>
        EcoStep Energy Monitoring System, Cebu Technological University
      </footer>

      {/* Mobile responsive adjustments */}
      <style>{`
        @media (max-width: 900px) {
          .hero .wrap > div {
            grid-template-columns: 1fr;
          }
          section {
            padding: 60px 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
