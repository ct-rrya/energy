import { Info, Cpu, Activity, Zap, PlayCircle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHardwareStatus } from '@/contexts/HardwareStatusContext';
import { isAdmin } from '@/lib/permissions';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';

/**
 * Replace 'YOUR_YOUTUBE_VIDEO_ID' with your YouTube video ID
 * (e.g., for https://www.youtube.com/watch?v=dQw4w9WgXcQ, use 'dQw4w9WgXcQ').
 */
const YOUTUBE_VIDEO_ID = 'YOUR_YOUTUBE_VIDEO_ID';

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  highlight?: boolean;
}

const RESEARCH_TEAM: TeamMember[] = [
  {
    name: 'Lord Jason Riveral',
    role: 'Project Lead · Hardware Lead',
    initials: 'LR',
    highlight: true,
  },
  {
    name: 'Merry Apple Edaño',
    role: 'Software and Manuscript Lead',
    initials: 'ME',
    highlight: true,
  },
  {
    name: 'Jerome Magdadaro',
    role: 'Hardware Assistant',
    initials: 'JM',
  },
  {
    name: 'Jhemarsh Lee Conde',
    role: 'Documentation and Debugging',
    initials: 'JC',
  },
  {
    name: 'Alyza Pitogo',
    role: 'Documentation and Debugging',
    initials: 'AP',
  },
  {
    name: 'Francis Keith Banan',
    role: 'Documentation · Hardware Worker',
    initials: 'FB',
  },
];

const SYSTEM_HIGHLIGHTS = [
  {
    icon: Zap,
    title: 'Piezoelectric Energy Harvesting',
    description:
      'Converts mechanical pressure from everyday footsteps into usable electrical energy stored in a capacitor bank.',
  },
  {
    icon: Cpu,
    title: 'ESP32 IoT Telemetry',
    description:
      'Captures voltage, current, power, step count, and capacitor levels in real time and transmits packets securely to the cloud.',
  },
  {
    icon: Activity,
    title: 'Live Monitoring & Diagnostics',
    description:
      'Streams live updates over Socket.IO and Firestore with historical trends, milestone tracking, and tile health checks.',
  },
];

export function AboutPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdminUser = isAdmin(isAuthenticated, user);
  const isPublicUser = !isAdminUser;
  const { status: hardwareConnectionStatus, isHardwareConnected } = useHardwareStatus();

  const hasVideoId = YOUTUBE_VIDEO_ID && YOUTUBE_VIDEO_ID !== 'YOUR_YOUTUBE_VIDEO_ID';

  return (
    <div className="page font-sans space-y-6">
      <DashboardHeader
        greeting="Project & Team"
        title="About EcoStep"
        subtitle="Smart piezoelectric footstep kinetic energy harvesting and real-time IoT monitoring."
        systemStatus={hardwareConnectionStatus}
        isPublicUser={isPublicUser}
        isWebSocketConnected={isHardwareConnected}
      />

      {/* System Overview */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111916] p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#2FBF71]/15 text-[#2FBF71]">
            <Info className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            What EcoStep Is About
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          <strong>EcoStep</strong> is a smart piezoelectric footstep energy harvesting and
          monitoring system designed to capture kinetic energy from human footsteps and
          visualize power generation in real time. Each step on the piezoelectric tile
          generates an electrical charge that is conditioned, measured by an ESP32
          microcontroller, and streamed to this web platform for live telemetry, historical
          analytics, energy milestone tracking, and hardware health diagnostics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {SYSTEM_HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] p-4 space-y-2"
            >
              <div className="inline-flex p-2 rounded-lg bg-[#2FBF71]/15 text-[#2FBF71]">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Advertisement Video Template */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111916] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2FBF71]/15 text-[#2FBF71]">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Project Advertisement Video
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Watch our EcoStep overview and hardware demonstration on YouTube.
              </p>
            </div>
          </div>
        </div>

        <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-gray-950 aspect-video">
          {hasVideoId ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
              title="EcoStep Advertisement Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-[#0e1914] via-[#11221a] to-[#0a120e] text-white space-y-3">
              <div className="p-4 rounded-full bg-[#2FBF71]/20 text-[#2FBF71] border border-[#2FBF71]/30">
                <PlayCircle className="w-10 h-10" />
              </div>
              <div className="space-y-1 max-w-md">
                <p className="text-base font-semibold">
                  YouTube Advertisement Video Template
                </p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  To embed your YouTube video here, set{' '}
                  <code className="px-1.5 py-0.5 rounded bg-white/10 text-[#2FBF71]">
                    YOUTUBE_VIDEO_ID
                  </code>{' '}
                  in{' '}
                  <code className="px-1.5 py-0.5 rounded bg-white/10 text-gray-200">
                    src/features/about/pages/AboutPage.tsx
                  </code>{' '}
                  to your YouTube video ID.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Research Team */}
      <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111916] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#2FBF71]/15 text-[#2FBF71]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Research Team
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The team behind the EcoStep hardware, software, and research manuscript.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RESEARCH_TEAM.map((member) => (
            <div
              key={member.name}
              className="flex items-center gap-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] p-4"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  member.highlight
                    ? 'bg-[#2FBF71]/20 text-[#2FBF71] border border-[#2FBF71]/40'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-200'
                }`}
              >
                {member.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {member.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
