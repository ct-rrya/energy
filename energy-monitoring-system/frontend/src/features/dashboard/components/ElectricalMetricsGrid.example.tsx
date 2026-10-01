/**
 * ElectricalMetricsGrid Component Examples
 * 
 * This file demonstrates the responsive grid layout and various states
 * of the ElectricalMetricsGrid component.
 */

import { ElectricalMetricsGrid } from './ElectricalMetricsGrid';

export function ElectricalMetricsGridExamples() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <section>
        <h2 className="text-2xl font-bold mb-4">ElectricalMetricsGrid Examples</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Demonstrating the responsive grid layout with electrical metrics.
          Resize the browser to see the grid adapt from 4 columns (desktop) →
          2 columns (tablet) → 1 column (mobile).
        </p>
      </section>

      {/* Normal State with Data */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Normal State (With Data)</h3>
        <ElectricalMetricsGrid
          voltage={230.2}
          current={12.45}
          power={2867.3}
          energy={3.42}
          isLoading={false}
        />
      </section>

      {/* Empty State (No Data) */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Empty State (Waiting for Data)</h3>
        <ElectricalMetricsGrid
          voltage={undefined}
          current={undefined}
          power={undefined}
          energy={undefined}
          isLoading={false}
        />
      </section>

      {/* Loading State */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Loading State</h3>
        <ElectricalMetricsGrid
          voltage={230.2}
          current={12.45}
          power={2867.3}
          energy={3.42}
          isLoading={true}
        />
      </section>

      {/* Partial Data */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Partial Data (Some Metrics Available)</h3>
        <ElectricalMetricsGrid
          voltage={230.2}
          current={undefined}
          power={2867.3}
          energy={undefined}
          isLoading={false}
        />
      </section>

      {/* High Values */}
      <section>
        <h3 className="text-xl font-semibold mb-4">High Values</h3>
        <ElectricalMetricsGrid
          voltage={240.8}
          current={99.99}
          power={23998.4}
          energy={158.76}
          isLoading={false}
        />
      </section>

      {/* Low/Zero Values */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Low/Zero Values</h3>
        <ElectricalMetricsGrid
          voltage={0.1}
          current={0.05}
          power={0.0}
          energy={0.00}
          isLoading={false}
        />
      </section>

      {/* Responsive Breakpoint Notes */}
      <section className="mt-12 p-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Responsive Breakpoints</h3>
        <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
          <li>
            <strong>Desktop (≥1024px):</strong> 4 columns - all metrics displayed side by side
          </li>
          <li>
            <strong>Tablet (640px - 1023px):</strong> 2 columns - metrics in a 2×2 grid
          </li>
          <li>
            <strong>Mobile (&lt;640px):</strong> 1 column - metrics stacked vertically
          </li>
        </ul>
      </section>

      {/* Metric Color Coding */}
      <section className="mt-6 p-6 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Metric Color Coding</h3>
        <ul className="space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
          <li>
            <span className="inline-block w-3 h-3 rounded-full bg-[#3DDC97] dark:bg-[#3ED98A] mr-2"></span>
            <strong>Voltage:</strong> Accent green (EcoStep brand color)
          </li>
          <li>
            <span className="inline-block w-3 h-3 rounded-full bg-[#F59E0B] mr-2"></span>
            <strong>Current:</strong> Amber (warning/energy color)
          </li>
          <li>
            <span className="inline-block w-3 h-3 rounded-full bg-[#3B82F6] mr-2"></span>
            <strong>Power:</strong> Blue (info color)
          </li>
          <li>
            <span className="inline-block w-3 h-3 rounded-full bg-[#F59E0B] mr-2"></span>
            <strong>Energy Today:</strong> Amber (energy color)
          </li>
        </ul>
      </section>
    </div>
  );
}
