/**
 * CumulativeEnergyChart Demo
 * 
 * Simple demo to verify the component renders correctly.
 * This file can be deleted after verification.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { CumulativeEnergyChart } from './CumulativeEnergyChart';

const queryClient = new QueryClient();

export function CumulativeEnergyChartDemo() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SocketProvider>
          <div className="p-8 min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                CumulativeEnergyChart Demo
              </h1>
              
              <div className="space-y-6">
                {/* Default configuration (30 days) */}
                <CumulativeEnergyChart />
                
                {/* Custom configuration (14 days) */}
                <CumulativeEnergyChart daysToShow={14} />
              </div>
            </div>
          </div>
        </SocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
