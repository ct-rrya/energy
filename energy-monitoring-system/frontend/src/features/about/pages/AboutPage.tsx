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
    title: 'Smart Footstep Power',
    description:
      'Turns the pressure of everyday footsteps into clean electrical energy stored safely inside the tile.',
  },
  {
    icon: Cpu,
    title: 'Live Smart Sensing',
    description:
      'Measures voltage, current, power, and footsteps in real time and sends readings straight to this dashboard.',
  },
  {
    icon: Activity,
    title: 'Live Monitoring & Goals',
    description:
      'Shows instant updates on the web dashboard with history charts, energy goals, and tile health checks.',
  },
];

export function AboutPage() {
  const { user, isAuthenticated } = useAuth();
  const isAdminUser = isAdmin(isAuthenticated, user);
  const isPublicUser = !isAdminUser;
  const { status: hardwareConnectionStatus } = useHardwareStatus();

  const hasVideoId = YOUTUBE_VIDEO_ID && YOUTUBE_VIDEO_ID !== 'YOUR_YOUTUBE_VIDEO_ID';

  return (
    <div className="page font-sans">
      <DashboardHeader
        greeting="Project & Team"
        title="About EcoStep"
        subtitle="Footstep energy harvesting & live monitoring"
        systemStatus={hardwareConnectionStatus}
        isPublicUser={isPublicUser}
      />

      {/* Open Editorial Layout — Full-Width Aligned With Page Header, Zero Nested Boxes */}
      <div className="w-full divide-y divide-[var(--line)]">
        {/* 1. System Overview */}
        <section className="py-6 first:pt-2 space-y-5">
          <div className="flex items-center gap-2 text-[var(--acc)]">
            <Info className="w-4 h-4 shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold text-[var(--t)] m-0">
              What EcoStep Is About
            </h2>
          </div>

          <p className="text-sm sm:text-[15px] leading-relaxed text-[var(--mu)] w-full pb-2 m-0">
            <strong className="text-[var(--t)]">EcoStep</strong> is a smart footstep energy harvesting and
            monitoring system that turns everyday walking into measurable clean
            electricity. Each step on the floor tile creates a small electrical
            charge that is safely stored, measured by built-in smart sensors, and
            shared live on this web platform for real-time tracking, history
            charts, energy milestones, and tile health checks.
          </p>

          {/* Flat Horizontal 3-Column Highlight Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--line)] border-y border-[var(--line)]">
            {SYSTEM_HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="py-4 md:px-5 md:first:pl-0 md:last:pr-0 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[var(--acc)] shrink-0" />
                  <h3 className="text-sm font-semibold text-[var(--t)] m-0">
                    {title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-[var(--mu)] m-0">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Advertisement Video */}
        <section className="py-7 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[var(--acc)]">
              <PlayCircle className="w-4 h-4 shrink-0" />
              <h2 className="text-base sm:text-lg font-semibold text-[var(--t)] m-0">
                Project Advertisement Video
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--mu)] m-0">
              Watch our EcoStep overview and hardware demonstration on YouTube.
            </p>
          </div>

          <div className="relative w-full overflow-hidden rounded-xl border border-[var(--line)] bg-gray-950 aspect-video max-h-[480px]">
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
                <div className="p-3.5 rounded-full bg-[#2FBF71]/15 text-[#2FBF71] border border-[#2FBF71]/30">
                  <PlayCircle className="w-9 h-9" />
                </div>
                <div className="space-y-1 max-w-md">
                  <p className="text-base font-semibold m-0">Video Coming Soon</p>
                  <p className="text-xs text-gray-300 leading-relaxed m-0">
                    Our EcoStep overview and hardware demonstration video is currently in production. Check back soon!
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. Research Team — Flat Typographic Roster */}
        <section className="py-7 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[var(--acc)]">
              <Users className="w-4 h-4 shrink-0" />
              <h2 className="text-base sm:text-lg font-semibold text-[var(--t)] m-0">
                Research Team
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[var(--mu)] m-0">
              The team behind the EcoStep hardware, software, and research manuscript.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
            {RESEARCH_TEAM.map((member) => (
              <div
                key={member.name}
                className="flex items-center gap-3.5 py-3.5 border-b border-[var(--line)]"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    member.highlight
                      ? 'bg-[#2FBF71]/15 text-[#2FBF71] border border-[#2FBF71]/35'
                      : 'bg-[var(--soft)] text-[var(--t)] border border-[var(--line)]'
                  }`}
                >
                  {member.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--t)] truncate m-0">
                    {member.name}
                  </p>
                  <p className="text-xs text-[var(--mu)] m-0 mt-0.5">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
