import { FileText, Radio, BarChart3, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardCard } from './DashboardCard';
import { ROUTES } from '@/routes/routes.config';

/**
 * Quick Actions Card Component
 * Four action cards with icons and descriptions
 */
export function QuickActionsCard() {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'sensors',
      icon: Radio,
      label: 'Manage Sensors',
      description: 'Configure connected energy sensors.',
      onClick: () => navigate(ROUTES.SENSORS_MONITORING),
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: 'View Analytics',
      description: 'Explore detailed consumption patterns.',
      onClick: () => navigate(ROUTES.ANALYTICS),
    },
    {
      id: 'reports',
      icon: FileText,
      label: 'Generate Report',
      description: 'Create an energy report.',
      onClick: () => navigate(ROUTES.REPORTS),
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'System Settings',
      description: 'Configure EcoStep.',
      onClick: () => {
        // Settings page will be implemented later
        console.log('Settings clicked');
      },
    },
  ];

  return (
    <DashboardCard title="Quick Actions" subtitle="Common tasks">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="group flex items-start gap-3 rounded-xl bg-white/60 dark:bg-[#1A312C]/40 border border-white/70 dark:border-[#89D7B7]/10 p-4 text-left transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#428475] to-[#89D7B7] shadow-sm">
                <Icon className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1A312C] dark:text-[#89D7B7] group-hover:text-[#428475] dark:group-hover:text-[#FFF4E1] transition-colors text-sm">
                  {action.label}
                </p>
                <p className="mt-1 text-xs text-[rgb(var(--color-neutral-600))] line-clamp-2">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </DashboardCard>
  );
}
