import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Activity, LineChart, MessageSquare } from 'lucide-react';
import { ROUTES } from '@/routes/routes.config';
import { Navigation } from '@/components/layout';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * LandingPage Component - Redesigned
 * 
 * Modern, clean university technology/sustainability project website
 * Introduces EcoStep to students and visitors before entering the monitoring system
 * 
 * Design Philosophy:
 * - Clean and modern
 * - University + technology + sustainability feel
 * - Professional but not corporate
 * - Simple, not overly decorative
 * - Strong visual hierarchy
 * - EcoStep color identity: Navy #0B132B, Green #39FF88
 */
export function LandingPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme === 'light' ? '#FFFFFF' : '#0B132B' }}>
      {/* Navigation */}
      <Navigation />

      {/* HERO SECTION with CTU Building Background */}
      <section className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/ctudb.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Dark overlay for text readability */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, rgba(11, 19, 43, 0.92) 0%, rgba(11, 19, 43, 0.85) 100%)'
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wide uppercase"
              style={{
                borderColor: 'rgba(57, 255, 136, 0.3)',
                backgroundColor: 'rgba(57, 255, 136, 0.1)',
                color: '#39FF88'
              }}
            >
              <span style={{ color: '#F5F7FA' }}>Cebu Technological University</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>Daanbantayan Campus</span>
            </div>

            {/* Main Heading */}
            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
              style={{ color: '#F5F7FA' }}
            >
              Every Step Can Make a <span style={{ color: '#39FF88' }}>Difference.</span>
            </h1>

            {/* Supporting Text */}
            <p className="mb-10 text-lg leading-relaxed sm:text-xl"
              style={{ color: 'rgba(245, 247, 250, 0.85)' }}
            >
              EcoStep transforms footstep energy into measurable electrical energy and provides 
              real-time monitoring through an IoT-enabled platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => scrollToSection('about')}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base font-semibold transition-all duration-200"
                style={{
                  backgroundColor: '#39FF88',
                  color: '#0B132B'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2FD670';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#39FF88';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Explore EcoStep
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={() => navigate(ROUTES.DASHBOARD)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border px-8 py-4 text-base font-semibold transition-all duration-200"
                style={{
                  borderColor: 'rgba(57, 255, 136, 0.3)',
                  color: '#F5F7FA',
                  backgroundColor: 'rgba(57, 255, 136, 0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(57, 255, 136, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(57, 255, 136, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(57, 255, 136, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(57, 255, 136, 0.3)';
                }}
              >
                View Monitoring
                <Activity className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — QUICK HIGHLIGHTS */}
      <section className="border-y py-12"
        style={{
          backgroundColor: theme === 'light' ? '#F5F7FA' : '#0B132B',
          borderColor: theme === 'light' ? 'rgba(11, 19, 43, 0.08)' : 'rgba(57, 255, 136, 0.12)'
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {/* Piezoelectric */}
            <div className="text-center">
              <div className="mb-3 text-sm font-bold uppercase tracking-wide"
                style={{ color: '#39FF88' }}
              >
                Piezoelectric
              </div>
              <div className="text-base font-medium"
                style={{ color: theme === 'light' ? '#374151' : '#9CA3AF' }}
              >
                Energy Harvesting
              </div>
            </div>

            {/* IoT-Enabled */}
            <div className="text-center">
              <div className="mb-3 text-sm font-bold uppercase tracking-wide"
                style={{ color: '#39FF88' }}
              >
                IoT-Enabled
              </div>
              <div className="text-base font-medium"
                style={{ color: theme === 'light' ? '#374151' : '#9CA3AF' }}
              >
                Energy Monitoring
              </div>
            </div>

            {/* Real-Time */}
            <div className="text-center">
              <div className="mb-3 text-sm font-bold uppercase tracking-wide"
                style={{ color: '#39FF88' }}
              >
                Real-Time
              </div>
              <div className="text-base font-medium"
                style={{ color: theme === 'light' ? '#374151' : '#9CA3AF' }}
              >
                Data Visualization
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — ABOUT ECOSTEP */}
      <section id="about" className="py-24"
        style={{ backgroundColor: theme === 'light' ? '#FFFFFF' : '#0F1621' }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-20">
            {/* Left: Text */}
            <div>
              <h2 className="mb-6 text-4xl font-bold leading-tight tracking-tight lg:text-5xl"
                style={{ color: theme === 'light' ? '#0B132B' : '#F5F7FA' }}
              >
                Turning Footsteps Into <span style={{ color: '#39FF88' }}>Data</span>
              </h2>
              <p className="text-lg leading-relaxed"
                style={{ color: theme === 'light' ? '#374151' : '#9CA3AF' }}
              >
                EcoStep is a smart energy monitoring system designed to monitor electrical energy 
                generated through piezoelectric footstep harvesting. The system collects sensor data 
                and presents it through an accessible web-based platform.
              </p>
            </div>

            {/* Right: Process Visual */}
            <div className="flex items-center">
              <div className="w-full space-y-6">
                {[
                  { icon: '👣', label: 'FOOTSTEP', desc: 'Physical pressure applied' },
                  { icon: '⚡', label: 'PIEZOELECTRIC TILE', desc: 'Converts mechanical to electrical' },
                  { icon: '📊', label: 'ENERGY MEASUREMENT', desc: 'Voltage, current, power data' },
                  { icon: '📡', label: 'IoT TRANSMISSION', desc: 'ESP32 microcontroller' },
                  { icon: '💻', label: 'WEB MONITORING', desc: 'Real-time dashboard access' }
                ].map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-2xl"
                      style={{ backgroundColor: 'rgba(57, 255, 136, 0.1)' }}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <div className="mb-1 text-sm font-bold uppercase tracking-wide"
                        style={{ color: '#39FF88' }}
                      >
                        {step.label}
                      </div>
                      <div className="text-sm"
                        style={{ color: theme === 'light' ? '#6B7280' : '#6B7280' }}
                      >
                        {step.desc}
                      </div>
                    </div>
                    {index < 4 && (
                      <div className="ml-6 flex-shrink-0" style={{ color: '#39FF88' }}>↓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section id="how-it-works" className="border-t py-24"
        style={{
          backgroundColor: theme === 'light' ? '#F5F7FA' : '#0B132B',
          borderColor: theme === 'light' ? 'rgba(11, 19, 43, 0.08)' : 'rgba(57, 255, 136, 0.12)'
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl"
              style={{ color: theme === 'light' ? '#0B132B' : '#F5F7FA' }}
            >
              How It Works
            </h2>
          </div>

          {/* Process Cards */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: '01',
                title: 'STEP',
                desc: 'Students walk across the piezoelectric tile.',
                icon: Zap
              },
              {
                number: '02',
                title: 'HARVEST',
                desc: 'Mechanical energy from footsteps is converted into electrical energy.',
                icon: Zap
              },
              {
                number: '03',
                title: 'MEASURE',
                desc: 'Sensors measure the electrical data generated by the system.',
                icon: Activity
              },
              {
                number: '04',
                title: 'MONITOR',
                desc: 'The collected data is transmitted and presented through the EcoStep Web Dashboard.',
                icon: LineChart
              }
            ].map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div
                  key={index}
                  className="group rounded-lg border p-6 transition-all duration-300"
                  style={{
                    backgroundColor: theme === 'light' ? '#FFFFFF' : '#0F1621',
                    borderColor: theme === 'light' ? 'rgba(11, 19, 43, 0.08)' : 'rgba(57, 255, 136, 0.12)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#39FF88';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme === 'light' ? 'rgba(11, 19, 43, 0.08)' : 'rgba(57, 255, 136, 0.12)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-3xl font-bold"
                      style={{ color: '#39FF88' }}
                    >
                      {step.number}
                    </div>
                    <div className="rounded-lg p-2"
                      style={{ backgroundColor: 'rgba(57, 255, 136, 0.1)' }}
                    >
                      <IconComponent className="h-6 w-6" style={{ color: '#39FF88' }} />
                    </div>
                  </div>
                  <h3 className="mb-3 text-lg font-bold uppercase tracking-wide"
                    style={{ color: theme === 'light' ? '#0B132B' : '#F5F7FA' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed"
                    style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}
                  >
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5 — SYSTEM PREVIEW */}
      <section id="monitoring" className="border-t py-24"
        style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#0F1621',
          borderColor: theme === 'light' ? 'rgba(11, 19, 43, 0.08)' : 'rgba(57, 255, 136, 0.12)'
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl"
              style={{ color: theme === 'light' ? '#0B132B' : '#F5F7FA' }}
            >
              Monitor What Each Step Produces
            </h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed"
              style={{ color: theme === 'light' ? '#374151' : '#9CA3AF' }}
            >
              View energy-generation data, electrical measurements, system status, and analytics 
              through the EcoStep Web Dashboard.
            </p>
          </div>

          {/* Dashboard Preview (Placeholder for actual component) */}
          <div className="mb-8 overflow-hidden rounded-lg border"
            style={{
              backgroundColor: theme === 'light' ? '#F5F7FA' : '#0B132B',
              borderColor: theme === 'light' ? 'rgba(11, 19, 43, 0.08)' : 'rgba(57, 255, 136, 0.12)'
            }}
          >
            <div className="flex items-center justify-center p-24">
              <div className="text-center">
                <Activity className="mx-auto mb-4 h-16 w-16" style={{ color: '#39FF88' }} />
                <p className="text-lg font-medium" style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
                  Dashboard Preview
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base font-semibold transition-all duration-200"
              style={{
                backgroundColor: '#39FF88',
                color: '#0B132B'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2FD670';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#39FF88';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              View Monitoring
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 6 — AI CHATBOT */}
      <section className="border-t py-24"
        style={{
          backgroundColor: theme === 'light' ? '#F5F7FA' : '#0B132B',
          borderColor: theme === 'light' ? 'rgba(11, 19, 43, 0.08)' : 'rgba(57, 255, 136, 0.12)'
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
            {/* Left: Text */}
            <div className="flex flex-col justify-center">
              <h2 className="mb-6 text-4xl font-bold leading-tight tracking-tight lg:text-5xl"
                style={{ color: theme === 'light' ? '#0B132B' : '#F5F7FA' }}
              >
                Ask. Explore. <span style={{ color: '#39FF88' }}>Understand.</span>
              </h2>
              <p className="mb-8 text-lg leading-relaxed"
                style={{ color: theme === 'light' ? '#374151' : '#9CA3AF' }}
              >
                Curious about EcoStep or the energy data it collects? The built-in AI chatbot helps 
                public users understand the system and access relevant information.
              </p>
              <div>
                <button
                  onClick={() => {
                    // Open chat interface if route exists
                    // For now, placeholder action
                    console.log('Open chatbot');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border px-8 py-4 text-base font-semibold transition-all duration-200"
                  style={{
                    borderColor: theme === 'light' ? 'rgba(11, 19, 43, 0.12)' : 'rgba(57, 255, 136, 0.3)',
                    color: theme === 'light' ? '#0B132B' : '#F5F7FA',
                    backgroundColor: theme === 'light' ? '#FFFFFF' : 'rgba(57, 255, 136, 0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#39FF88';
                    e.currentTarget.style.color = '#0B132B';
                    e.currentTarget.style.borderColor = '#39FF88';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'light' ? '#FFFFFF' : 'rgba(57, 255, 136, 0.05)';
                    e.currentTarget.style.color = theme === 'light' ? '#0B132B' : '#F5F7FA';
                    e.currentTarget.style.borderColor = theme === 'light' ? 'rgba(11, 19, 43, 0.12)' : 'rgba(57, 255, 136, 0.3)';
                  }}
                >
                  Ask EcoStep
                  <MessageSquare className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Right: Chat Preview */}
            <div className="flex items-center">
              <div className="w-full rounded-lg border p-6"
                style={{
                  backgroundColor: theme === 'light' ? '#FFFFFF' : '#0F1621',
                  borderColor: theme === 'light' ? 'rgba(11, 19, 43, 0.08)' : 'rgba(57, 255, 136, 0.12)'
                }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'rgba(57, 255, 136, 0.2)' }}
                  >
                    <MessageSquare className="h-6 w-6" style={{ color: '#39FF88' }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: theme === 'light' ? '#0B132B' : '#F5F7FA' }}>
                      EcoChat
                    </div>
                    <div className="text-xs" style={{ color: '#39FF88' }}>
                      AI Assistant
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed"
                  style={{ color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}
                >
                  "Hi! I'm your EcoStep assistant. Ask me about energy status, analytics, or system insights!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — CTU IDENTITY */}
      <section className="border-t py-24"
        style={{
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#0F1621',
          borderColor: theme === 'light' ? 'rgba(11, 19, 43, 0.08)' : 'rgba(57, 255, 136, 0.12)'
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl"
              style={{ color: theme === 'light' ? '#0B132B' : '#F5F7FA' }}
            >
              Built for <span style={{ color: '#39FF88' }}>CTU Daanbantayan</span>
            </h2>
            <p className="text-lg leading-relaxed"
              style={{ color: theme === 'light' ? '#374151' : '#9CA3AF' }}
            >
              EcoStep is a student-developed IoT energy monitoring system created for research, 
              innovation, and greater awareness of energy generated through footstep activity.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 8 — FINAL CTA */}
      <section className="border-t py-24"
        style={{ backgroundColor: '#0B132B', borderColor: 'rgba(57, 255, 136, 0.12)' }}
      >
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="mb-6 text-4xl font-bold tracking-tight lg:text-5xl"
            style={{ color: '#F5F7FA' }}
          >
            Ready to Explore EcoStep?
          </h2>
          <p className="mb-10 text-lg leading-relaxed"
            style={{ color: 'rgba(245, 247, 250, 0.85)' }}
          >
            Discover how footstep energy can be measured, monitored, and understood through a 
            connected web-based system.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={() => scrollToSection('about')}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base font-semibold transition-all duration-200"
              style={{
                backgroundColor: '#39FF88',
                color: '#0B132B'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2FD670';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#39FF88';
              }}
            >
              Explore EcoStep
            </button>

            <button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border px-8 py-4 text-base font-semibold transition-all duration-200"
              style={{
                borderColor: 'rgba(57, 255, 136, 0.3)',
                color: '#F5F7FA',
                backgroundColor: 'rgba(57, 255, 136, 0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(57, 255, 136, 0.15)';
                e.currentTarget.style.borderColor = '#39FF88';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(57, 255, 136, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(57, 255, 136, 0.3)';
              }}
            >
              View Monitoring
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-12"
        style={{ backgroundColor: '#0B132B', borderColor: 'rgba(57, 255, 136, 0.12)' }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Left: Brand */}
            <div>
              <div className="mb-2 text-lg font-bold" style={{ color: '#F5F7FA' }}>
                EcoStep
              </div>
              <div className="mb-1 text-sm" style={{ color: '#39FF88' }}>
                Energy Monitoring System
              </div>
              <div className="text-sm" style={{ color: 'rgba(245, 247, 250, 0.6)' }}>
                Cebu Technological University
              </div>
              <div className="text-sm" style={{ color: 'rgba(245, 247, 250, 0.6)' }}>
                Daanbantayan Campus
              </div>
            </div>

            {/* Middle: Navigation */}
            <div>
              <div className="mb-4 text-sm font-bold uppercase tracking-wide" style={{ color: '#F5F7FA' }}>
                Navigate
              </div>
              <nav className="space-y-2">
                {[
                  { label: 'Home', path: ROUTES.HOME },
                  { label: 'About', action: () => scrollToSection('about') },
                  { label: 'How It Works', action: () => scrollToSection('how-it-works') },
                  { label: 'Monitoring', path: ROUTES.DASHBOARD },
                  { label: 'Login', path: ROUTES.LOGIN }
                ].map((item, index) => (
                  <div key={index}>
                    {item.path ? (
                      <button
                        onClick={() => navigate(item.path)}
                        className="text-sm transition-colors duration-200"
                        style={{ color: 'rgba(245, 247, 250, 0.7)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#39FF88';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(245, 247, 250, 0.7)';
                        }}
                      >
                        {item.label}
                      </button>
                    ) : (
                      <button
                        onClick={item.action}
                        className="text-sm transition-colors duration-200"
                        style={{ color: 'rgba(245, 247, 250, 0.7)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#39FF88';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(245, 247, 250, 0.7)';
                        }}
                      >
                        {item.label}
                      </button>
                    )}
                  </div>
                ))}
              </nav>
            </div>

            {/* Right: Copyright */}
            <div className="text-sm" style={{ color: 'rgba(245, 247, 250, 0.6)' }}>
              <p className="mb-2">© {new Date().getFullYear()} CTU Daanbantayan Campus</p>
              <p>All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
