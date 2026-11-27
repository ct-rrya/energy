import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  Cookie,
  MessageSquareHeart,
  ArrowLeft,
} from 'lucide-react';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/routes/routes.config';

type LegalTab = 'privacy' | 'terms' | 'cookies' | 'community';

const LEGAL_TABS: Array<{ id: LegalTab; label: string; Icon: React.ElementType }> = [
  { id: 'privacy', label: 'Privacy Policy', Icon: ShieldCheck },
  { id: 'terms', label: 'Terms & Conditions', Icon: FileText },
  { id: 'cookies', label: 'Cookies & Storage', Icon: Cookie },
  { id: 'community', label: 'Community Guidelines', Icon: MessageSquareHeart },
];

const LOCAL_STORAGE_ITEMS = [
  {
    key: 'ecostep_visitor_id / nickname',
    purpose: 'Keeps your chosen guest nickname, ECommunity votes, and Direct-to-Admin chat thread intact without requiring an account.',
  },
  {
    key: 'theme',
    purpose: 'Remembers your Light or Dark appearance preference.',
  },
  {
    key: 'ecostep_visitor_tour_done',
    purpose: 'Prevents the first-time onboarding walkthrough from auto-playing on every visit.',
  },
  {
    key: 'ecostep_chat_alerts_muted',
    purpose: 'Remembers whether incoming chat chime & toast alerts are muted.',
  },
  {
    key: 'ecostep.leftPinned / rightPinned',
    purpose: 'Remembers your sidebar and EcoGuide panel layout preference.',
  },
  {
    key: 'auth_token (Admins only)',
    purpose: 'Maintains an authenticated administrator session after signing in with an access code.',
  },
];

export function LegalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { status: hardwareStatus } = useHardwareStatus();
  const { isAuthenticated } = useAuth();

  const rawTab = searchParams.get('tab') as LegalTab | null;
  const activeTab: LegalTab =
    rawTab && LEGAL_TABS.some((t) => t.id === rawTab) ? rawTab : 'privacy';

  const setActiveTab = (tab: LegalTab) => {
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <div className="page font-sans">
      <DashboardHeader
        greeting="Policies & Transparency"
        title="Legal & Community Policies"
        subtitle="How EcoStep handles privacy, browser storage, community standards, and sensor data"
        systemStatus={hardwareStatus}
        isPublicUser={!isAuthenticated}
      />

      <div className="flex items-center justify-between gap-2 pb-1">
        <Link
          to={ROUTES.ABOUT}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--mu)] hover:text-[var(--acc)] no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to About EcoStep</span>
        </Link>
        <span className="text-[11px] text-[var(--mu)]">
          Last updated: November 2026
        </span>
      </div>

      {/* Connected Record-Folder Tabs */}
      <div
        className="flex flex-wrap items-end gap-1 max-w-full pt-1"
        role="tablist"
        aria-label="Legal and policy sections"
      >
        {LEGAL_TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(id)}
              className={`relative inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-[13px] font-semibold rounded-t-xl border-t border-x transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--card-bg)] text-[var(--t)] border-[var(--line)] -mb-px z-10 pb-2.5'
                  : 'bg-transparent text-[var(--mu)] border-transparent hover:text-[var(--t)] hover:bg-[var(--card-bg)]/50'
              }`}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-3 right-3 h-[2.5px] rounded-b-full bg-[var(--acc)]"
                  aria-hidden="true"
                />
              )}
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Connected Content Sheet */}
      <section className="rounded-b-2xl rounded-tr-2xl border border-[var(--line)] bg-[var(--card-bg)] px-5 sm:px-7 py-6">
        {activeTab === 'privacy' && (
          <div className="space-y-5 max-w-3xl text-sm leading-relaxed text-[var(--mu)]">
            <div>
              <h2 className="text-lg font-semibold text-[var(--t)] m-0">
                Privacy Policy
              </h2>
              <p className="mt-1.5 mb-0">
                EcoStep is committed to protecting your privacy in accordance with the{' '}
                <strong className="text-[var(--t)]">
                  Philippine Data Privacy Act of 2012 (Republic Act No. 10173)
                </strong>
                . Public visitors can explore live energy data without creating an account.
              </p>
            </div>

            <div className="border-t border-[var(--line)] pt-4 space-y-2">
              <h3 className="text-sm font-semibold text-[var(--t)] m-0">
                1. Information We Collect
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 m-0">
                <li>
                  <strong className="text-[var(--t)]">Public Visitors:</strong> Your chosen or
                  auto-generated browser nickname, a random browser-stored visitor token (used for
                  upvotes, posting limits, and Direct-to-Admin chat continuity), ECommunity posts
                  and replies, and messages sent to Campus Admins.
                </li>
                <li>
                  <strong className="text-[var(--t)]">Administrators:</strong> Name, email address,
                  hashed access credentials, and security audit logs of administrative actions.
                </li>
                <li>
                  <strong className="text-[var(--t)]">Hardware Telemetry:</strong> Anonymous
                  electrical measurements (voltage, current, power, energy, and step counts) from
                  the campus piezoelectric floor mat. No cameras, biometrics, or personally
                  identifiable footstep tracking are used.
                </li>
              </ul>
            </div>

            <div className="border-t border-[var(--line)] pt-4 space-y-2">
              <h3 className="text-sm font-semibold text-[var(--t)] m-0">
                2. What We Do Not Collect
              </h3>
              <p className="m-0">
                EcoStep does <strong className="text-[var(--t)]">not</strong> store visitor IP
                addresses in the database, does not sell data, and does not run third-party
                advertising or behavioral tracking scripts.
              </p>
            </div>

            <div className="border-t border-[var(--line)] pt-4 space-y-2">
              <h3 className="text-sm font-semibold text-[var(--t)] m-0">
                3. Third-Party Services Used
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 m-0">
                <li>
                  <strong className="text-[var(--t)]">AI Processing (Google Gemini / Groq):</strong>{' '}
                  Used to power EcoGuide Q&amp;A responses, report summaries, and automated
                  community content moderation. Please avoid sharing sensitive personal details in
                  public posts or chat messages.
                </li>
                <li>
                  <strong className="text-[var(--t)]">Email Delivery (Resend):</strong> Used solely
                  to deliver administrator access codes and automated tile health alerts to
                  registered campus admins.
                </li>
              </ul>
            </div>

            <div className="border-t border-[var(--line)] pt-4 space-y-2">
              <h3 className="text-sm font-semibold text-[var(--t)] m-0">
                4. Your Rights &amp; Removal Requests
              </h3>
              <p className="m-0">
                You may request the removal of any ECommunity post, Direct Chat thread, or admin
                account by messaging the EcoStep team via{' '}
                <strong className="text-[var(--t)]">EcoGuide → Message Admin</strong> or contacting
                the campus EcoStep Research Team.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-5 max-w-3xl text-sm leading-relaxed text-[var(--mu)]">
            <div>
              <h2 className="text-lg font-semibold text-[var(--t)] m-0">
                Terms &amp; Conditions
              </h2>
              <p className="mt-1.5 mb-0">
                By accessing or using the EcoStep web application, you agree to these Terms of Use.
              </p>
            </div>

            <div className="border-t border-[var(--line)] pt-4 space-y-2">
              <h3 className="text-sm font-semibold text-[var(--t)] m-0">
                1. Educational &amp; Campus Monitoring Purpose
              </h3>
              <p className="m-0">
                All live power, voltage, current, step count, and energy readings shown on EcoStep
                are provided for campus sustainability monitoring, research, and educational
                demonstration. Readings are not utility-grade billing measurements.
              </p>
            </div>

            <div className="border-t border-[var(--line)] pt-4 space-y-2">
              <h3 className="text-sm font-semibold text-[var(--t)] m-0">
                2. AI &amp; Hardware Diagnostics Disclaimer
              </h3>
              <p className="m-0">
                Insights generated by <strong className="text-[var(--t)]">EcoGuide AI</strong> and
                automated tile health scores are advisory summaries derived from sensor telemetry.
                They do not replace physical inspection or maintenance by qualified campus
                electricians or technicians.
              </p>
            </div>

            <div className="border-t border-[var(--line)] pt-4 space-y-2">
              <h3 className="text-sm font-semibold text-[var(--t)] m-0">
                3. Moderation &amp; Maintenance Availability
              </h3>
              <p className="m-0">
                EcoStep administrators reserve the right to remove posts or replies that violate
                our Community Guidelines and to temporarily pause public access or hardware uploads
                during Maintenance Mode for wiring inspection, cleaning, or calibration.
              </p>
            </div>

            <div className="border-t border-[var(--line)] pt-4 space-y-2">
              <h3 className="text-sm font-semibold text-[var(--t)] m-0">
                4. Prohibited Conduct
              </h3>
              <p className="m-0">
                You agree not to attempt unauthorized access to admin accounts, flood the system
                with automated bots/requests, tamper with the physical floor mat hardware, or upload
                malicious or abusive content.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'cookies' && (
          <div className="space-y-5 max-w-3xl text-sm leading-relaxed text-[var(--mu)]">
            <div>
              <h2 className="text-lg font-semibold text-[var(--t)] m-0">
                Cookies &amp; Browser Storage Policy
              </h2>
              <p className="mt-1.5 mb-0">
                EcoStep uses <strong className="text-[var(--t)]">zero advertising cookies</strong>{' '}
                and <strong className="text-[var(--t)]">zero third-party tracking cookies</strong>.
                We only store strictly necessary preferences in your browser&apos;s{' '}
                <code>localStorage</code> so the app works smoothly.
              </p>
            </div>

            <div className="border-t border-[var(--line)] pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[11px] uppercase tracking-wider text-[var(--mu)]">
                      <th className="py-2.5 pr-4 font-semibold">Storage Key</th>
                      <th className="py-2.5 font-semibold">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {LOCAL_STORAGE_ITEMS.map((item) => (
                      <tr key={item.key}>
                        <td className="py-3 pr-4 font-mono text-xs text-[var(--t)] whitespace-nowrap align-top">
                          {item.key}
                        </td>
                        <td className="py-3 text-[var(--mu)]">{item.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-[var(--mu)] mt-4 mb-0">
                You can clear this data anytime through your browser&apos;s site settings. Clearing
                storage resets your guest nickname, onboarding tour state, and theme preference.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="space-y-5 max-w-3xl text-sm leading-relaxed text-[var(--mu)]">
            <div>
              <h2 className="text-lg font-semibold text-[var(--t)] m-0">
                ECommunity &amp; Direct Chat Guidelines
              </h2>
              <p className="mt-1.5 mb-0">
                ECommunity is a shared space for students, faculty, and campus staff to report
                hardware issues, ask questions, and suggest improvements to EcoStep.
              </p>
            </div>

            <div className="border-t border-[var(--line)] pt-4 space-y-2.5">
              <ul className="list-disc pl-5 space-y-2 m-0">
                <li>
                  <strong className="text-[var(--t)]">Stay on topic:</strong> Posts should relate to
                  EcoStep, the floor tile hardware, live energy data, website bugs, or campus
                  sustainability ideas.
                </li>
                <li>
                  <strong className="text-[var(--t)]">Keep it respectful:</strong> Profanity,
                  harassment, hate speech, and sexually explicit content or slang (in English,
                  Tagalog, Cebuano/Bisaya, or any language) are strictly prohibited.
                </li>
                <li>
                  <strong className="text-[var(--t)]">Search before posting:</strong> Use the
                  ECommunity search bar to check if someone already raised the same topic — upvote
                  or reply to existing threads instead of posting duplicates.
                </li>
                <li>
                  <strong className="text-[var(--t)]">No spam or external links:</strong>{' '}
                  Promotional links, advertisements, and random gibberish are blocked automatically.
                </li>
                <li>
                  <strong className="text-[var(--t)]">Fair-use limits:</strong> To prevent spam
                  floods, public visitors have daily posting/reply quotas and short cooldowns, and
                  submissions are checked by automated content moderation.
                </li>
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
