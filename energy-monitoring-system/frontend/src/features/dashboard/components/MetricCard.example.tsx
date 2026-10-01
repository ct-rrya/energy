/**
 * MetricCard Component Examples
 * 
 * This file demonstrates the various states and configurations
 * of the MetricCard component as specified in the design document.
 */

import { MetricCard } from './MetricCard';
import { MetricCardSkeleton } from './MetricCardSkeleton';
import { Zap, Activity, TrendingUp } from 'lucide-react';

export function MetricCardExamples() {
  return (
    <div className="p-8 space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">MetricCard Examples</h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">
          Demonstrating the data-first visual hierarchy with 36px values,
          13px uppercase labels, and accent color coding.
        </p>
      </section>

      {/* Normal States */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Normal States</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Voltage"
            value={230.2}
            unit="V"
            precision={1}
            color="accent"
            icon={<Zap size={16} />}
          />
          <MetricCard
            label="Current"
            value={12.45}
            unit="A"
            precision={2}
            color="amber"
            icon={<Activity size={16} />}
          />
          <MetricCard
            label="Power"
            value={2867}
            unit="W"
            precision={1}
            color="blue"
            icon={<Zap size={16} />}
          />
          <MetricCard
            label="Energy Today"
            value={3.42}
            unit="kWh"
            precision={2}
            color="amber"
            icon={<TrendingUp size={16} />}
          />
        </div>
      </section>

      {/* Empty States */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Empty States</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Voltage"
            value={undefined}
            unit="V"
            precision={1}
            color="accent"
            icon={<Zap size={16} />}
          />
          <MetricCard
            label="Current"
            value={undefined}
            unit="A"
            precision={2}
            color="amber"
            icon={<Activity size={16} />}
          />
        </div>
      </section>

      {/* Loading States */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Loading States</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>
      </section>

      {/* All Color Variants */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Color Variants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Accent"
            value={100}
            unit="Unit"
            precision={0}
            color="accent"
          />
          <MetricCard
            label="Amber"
            value={100}
            unit="Unit"
            precision={0}
            color="amber"
          />
          <MetricCard
            label="Blue"
            value={100}
            unit="Unit"
            precision={0}
            color="blue"
          />
          <MetricCard
            label="Red"
            value={100}
            unit="Unit"
            precision={0}
            color="red"
          />
        </div>
      </section>

      {/* Different Precisions */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Precision Variants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="No Decimals"
            value={1234}
            unit="W"
            precision={0}
            color="blue"
          />
          <MetricCard
            label="One Decimal"
            value={123.456}
            unit="V"
            precision={1}
            color="accent"
          />
          <MetricCard
            label="Two Decimals"
            value={12.3456}
            unit="A"
            precision={2}
            color="amber"
          />
          <MetricCard
            label="Three Decimals"
            value={1.23456}
            unit="kWh"
            precision={3}
            color="blue"
          />
        </div>
      </section>
    </div>
  );
}
