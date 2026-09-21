import { useNavigate } from 'react-router-dom';
import { Activity, Database, BarChart3, ShieldCheck, TrendingUp, Lock } from 'lucide-react';
import Logo from '@/assets/logo/1.svg?react';
import { ROUTES } from '@/routes/routes.config';
import { Navigation } from '@/components/layout';
import TelemetryDisplay from '@/features/landing/components/TelemetryDisplay';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/lib/theme';

/**
 * LandingPage Component
 * 
 * Marketing-focused landing page for EcoStep energy monitoring system.
 * Serves as the public entry point highlighting system capabilities and features.
 * Directs visitors to dashboard access and provides system information.
 * 
 * Task 20.1: Updated to remove embedded chat/telemetry (now handled globally)
 * Requirements: 19.5 - Privacy notice about data handling
 */

/**
 * Responsive CSS styles for LandingPage layout
 */
const landingPageStyles = `
  /* Small mobile devices */
  @media (max-width: 640px) {
    .hero-cta-group {
      flex-direction: column !important;
      width: 100% !important;
    }

    .hero-cta-button {
      width: 100% !important;
      justify-content: center !important;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('landing-page-responsive-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'landing-page-responsive-styles';
  styleSheet.textContent = landingPageStyles;
  document.head.appendChild(styleSheet);
}

export function LandingPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  const handleAccessDashboard = () => {
    navigate(ROUTES.LOGIN);
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        background: theme === 'light' ? '#FAFAFA' : colors.pageBackground
      }}
    >
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold" style={{
          background: theme === 'light' ? '#FFFFFF' : colors.cardBackground,
          color: colors.accent,
          borderColor: theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)'
        }}>
            <ShieldCheck className="h-4 w-4" />
            <span>Authorized Personnel Only</span>
          </div>

          {/* Headline */}
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl" style={{
            color: colors.textPrimary
          }}>
            <br />
            <span style={{ color: colors.accent }}>Energy Monitoring Dashboard</span>
          </h2>

          {/* Subheadline - Enhanced value proposition */}
          <p className="mx-auto mb-8 max-w-2xl text-lg sm:text-xl" style={{
            color: colors.textSecondary
          }}>
            Real-time analytics and monitoring portal for authorized CODETech administrators.
            Track energy harvesting performance, manage hardware infrastructure, and access
            comprehensive system diagnostics.
          </p>

          {/* Primary CTA - More prominent */}
          <div className="hero-cta-group flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={handleAccessDashboard}
              className="hero-cta-button inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                background: '#3DDC97',
                color: '#FFFFFF',
                boxShadow: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#35c27b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3DDC97';
              }}
            >
              <Lock className="h-5 w-5" />
              Access Admin Dashboard
            </button>
            <a
              href="#features"
              className="hero-cta-button inline-flex items-center gap-2 rounded-lg border px-8 py-4 text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                background: theme === 'light' ? '#FFFFFF' : colors.cardBackground,
                color: colors.textPrimary,
                borderColor: theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3DDC97';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme === 'light' ? '#FFFFFF' : colors.cardBackground;
                e.currentTarget.style.color = colors.textPrimary;
              }}
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Hero Visual - System Stats Preview */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg p-6 text-center transition-all" style={{ 
            background: theme === 'light' ? '#FFFFFF' : colors.cardBackground,
            border: `1px solid ${theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)'}`,
            boxShadow: 'none'
          }}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg p-2" style={{
              background: theme === 'light' ? '#FFFFFF' : 'transparent'
            }}>
              <Logo className="h-full w-full" />
            </div>
            <div className="text-3xl font-bold" style={{ color: colors.textPrimary }}>Real-Time</div>
            <div className="text-sm font-medium" style={{ color: colors.accent }}>Data Monitoring</div>
          </div>
          <div className="rounded-lg p-6 text-center transition-all" style={{ 
            background: theme === 'light' ? '#FFFFFF' : colors.cardBackground,
            border: `1px solid ${theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)'}`,
            boxShadow: 'none'
          }}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: 'rgba(61, 220, 151, 0.1)' }}>
              <Activity className="h-6 w-6" style={{ color: colors.accent }} />
            </div>
            <div className="text-3xl font-bold" style={{ color: colors.textPrimary }}>ESP32</div>
            <div className="text-sm font-medium" style={{ color: colors.accent }}>IoT Integration</div>
          </div>
          <div className="rounded-lg p-6 text-center transition-all" style={{ 
            background: theme === 'light' ? '#FFFFFF' : colors.cardBackground,
            border: `1px solid ${theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)'}`,
            boxShadow: 'none'
          }}>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg" style={{ background: 'rgba(61, 220, 151, 0.1)' }}>
              <Database className="h-6 w-6" style={{ color: colors.accent }} />
            </div>
            <div className="text-3xl font-bold" style={{ color: colors.textPrimary }}>MongoDB</div>
            <div className="text-sm font-medium" style={{ color: colors.accent }}>Time-Series Storage</div>
          </div>
        </div>
      </section>

      {/* Live System Preview Section - Task 20.2 */}
      <section className="border-t py-16 lg:py-24" style={{ 
        borderColor: theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)',
        background: theme === 'light' ? '#FFFFFF' : colors.cardBackground
      }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold" style={{
              background: 'rgba(61, 220, 151, 0.1)',
              color: colors.textPrimary,
              borderColor: theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)'
            }}>
              <Activity className="h-4 w-4" style={{ color: colors.accent }} />
              <span>Live Data Stream</span>
            </div>
            
            <h3 className="mb-4 text-3xl font-bold sm:text-4xl" style={{ color: colors.textPrimary }}>
              Real-Time Energy Data
            </h3>
            
            <p className="mx-auto max-w-2xl text-lg leading-relaxed" style={{ color: colors.textSecondary }}>
              See live telemetry streaming from our piezoelectric energy harvesting system. 
              Watch voltage, current, power output, and daily energy generation update in real-time 
              as footsteps power the future of sustainable energy.
            </p>
          </div>

          {/* TelemetryDisplay Component - Centered with max-width */}
          <div className="mx-auto mb-12" style={{ maxWidth: '900px' }}>
            <TelemetryDisplay />
          </div>

          {/* Call-to-Action */}
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-base font-medium" style={{ color: colors.textSecondary }}>
              Want to dive deeper into system analytics and performance metrics?
            </p>
            
            <button
              onClick={handleAccessDashboard}
              className="inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                background: '#3DDC97',
                boxShadow: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#35c27b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3DDC97';
              }}
            >
              <BarChart3 className="h-5 w-5" />
              Access Full Dashboard for Detailed Analytics
            </button>

            <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
              Administrator authentication required
            </p>
          </div>
        </div>
      </section>

      {/* System Overview (Feature Cards) */}
      <section id="features" className="border-t py-16 lg:py-24" style={{ 
        borderColor: theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)',
        background: theme === 'light' ? '#FAFAFA' : colors.pageBackground
      }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-12 text-center">
            <h3 className="mb-3 text-3xl font-bold sm:text-4xl" style={{ color: colors.textPrimary }}>
              Core Administrative Functions
            </h3>
            <p className="mx-auto max-w-2xl text-lg" style={{ color: colors.textSecondary }}>
              Comprehensive tools for managing and monitoring the EcoStep piezoelectric energy harvesting system
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Feature 1: Real-Time Monitoring */}
            <div className="group rounded-lg p-8 transition-all" style={{ 
              border: `1px solid ${theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)'}`,
              background: theme === 'light' ? '#FFFFFF' : colors.cardBackground,
              boxShadow: 'none'
            }}>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg transition-transform" style={{ 
                background: '#3DDC97'
              }}>
                <Activity className="h-7 w-7 text-white" />
              </div>
              <h4 className="mb-3 text-xl font-bold" style={{ color: colors.textPrimary }}>
                Real-Time Monitoring
              </h4>
              <p className="mb-4 text-base leading-relaxed" style={{ color: colors.textSecondary }}>
                View live voltage, current, power, and accumulated energy metrics streamed via WebSocket connections. Monitor system performance with sub-second latency and interactive dashboards.
              </p>
              <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
                <li className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: colors.accent }} />
                  <span>Live voltage, current, power readings</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: colors.accent }} />
                  <span>WebSocket real-time updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: colors.accent }} />
                  <span>Interactive time-series charts</span>
                </li>
              </ul>
            </div>

            {/* Feature 2: Hardware Management */}
            <div className="group rounded-lg p-8 transition-all" style={{ 
              border: `1px solid ${theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)'}`,
              background: theme === 'light' ? '#FFFFFF' : colors.cardBackground,
              boxShadow: 'none'
            }}>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg transition-transform" style={{ 
                background: '#3DDC97'
              }}>
                <Database className="h-7 w-7 text-white" />
              </div>
              <h4 className="mb-3 text-xl font-bold" style={{ color: colors.textPrimary }}>
                Hardware Management
              </h4>
              <p className="mb-4 text-base leading-relaxed" style={{ color: colors.textSecondary }}>
                Manage ESP32 microcontroller API keys, monitor sensor connectivity status, and configure hardware endpoints. Ensure reliable IoT infrastructure operation.
              </p>
              <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
                <li className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: colors.accent }} />
                  <span>ESP32 API key management</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: colors.accent }} />
                  <span>Sensor health diagnostics</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: colors.accent }} />
                  <span>Connection status tracking</span>
                </li>
              </ul>
            </div>

            {/* Feature 3: Data Analytics */}
            <div className="group rounded-lg p-8 transition-all" style={{ 
              border: `1px solid ${theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)'}`,
              background: theme === 'light' ? '#FFFFFF' : colors.cardBackground,
              boxShadow: 'none'
            }}>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg transition-transform" style={{ 
                background: '#3DDC97'
              }}>
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <h4 className="mb-3 text-xl font-bold" style={{ color: colors.textPrimary }}>
                Data Analytics
              </h4>
              <p className="mb-4 text-base leading-relaxed" style={{ color: colors.textSecondary }}>
                Generate historical reports, analyze system reliability metrics, and evaluate performance efficiency. Export data for research and compliance documentation.
              </p>
              <ul className="space-y-2 text-sm" style={{ color: colors.textSecondary }}>
                <li className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: colors.accent }} />
                  <span>Historical trend analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: colors.accent }} />
                  <span>Performance efficiency reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: colors.accent }} />
                  <span>Automated PDF/CSV export</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Chat Notice Section - Requirement 19.5 */}
      <section className="border-t py-12" style={{ 
        borderColor: theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)',
        background: theme === 'light' ? '#FFFFFF' : colors.cardBackground
      }}>
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <div className="rounded-lg p-8" style={{ 
            border: `1px solid ${theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)'}`,
            background: theme === 'light' ? '#FAFAFA' : colors.pageBackground,
            boxShadow: 'none'
          }}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(61, 220, 151, 0.1)' }}>
                <ShieldCheck className="h-6 w-6" style={{ color: colors.accent }} />
              </div>
              <h3 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                Privacy & Data Handling
              </h3>
            </div>
            
            <div className="space-y-4 text-base leading-relaxed" style={{ color: colors.textSecondary }}>
              <p>
                <strong>Your privacy matters.</strong> The EcoStep system is designed with data protection in mind:
              </p>
              
              <ul className="ml-6 space-y-2 list-disc">
                <li>
                  <strong>Anonymous Chat:</strong> Conversations with our chat assistant are anonymous and temporary. 
                  We do not collect personally identifiable information through the chat interface.
                </li>
                <li>
                  <strong>Session Data:</strong> Chat session data is stored temporarily for 30 minutes to maintain 
                  conversation context, then automatically deleted.
                </li>
                <li>
                  <strong>No Permanent Storage:</strong> Message content is not permanently stored and is only 
                  logged in non-production environments for debugging purposes.
                </li>
                <li>
                  <strong>No Third-Party Sharing:</strong> We do not share chat data or telemetry information 
                  with third parties.
                </li>
                <li>
                  <strong>Public Telemetry:</strong> System telemetry data (voltage, current, power, energy) 
                  displayed publicly is anonymized and does not contain user information.
                </li>
              </ul>
              
              <p className="pt-2 text-sm" style={{ color: colors.textSecondary }}>
                For subscription features and personalized notifications, please use our Meta Messenger 
                integration, which follows Facebook's data protection policies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-white" style={{ 
        background: '#1A312C',
        borderColor: theme === 'light' ? 'rgba(26, 49, 44, 0.08)' : 'rgba(137, 215, 183, 0.12)'
      }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Left: Branding */}
            <div className="text-center sm:text-left">
              <div className="mb-1 font-bold">EcoStep Energy Monitoring System</div>
              <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Cebu Technological University - CODETech
              </div>
            </div>

            {/* Right: Version & Copyright */}
            <div className="text-center text-sm sm:text-right" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <div>System Version 1.0.0</div>
              <div>� {new Date().getFullYear()} CTU. All rights reserved.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
