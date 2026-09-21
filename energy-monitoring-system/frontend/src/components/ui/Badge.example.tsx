/**
 * Badge Component Examples
 * 
 * This file demonstrates the refined Badge component following
 * the EcoStep UI Refinement spec (Task 6).
 * 
 * Changes from AI-generated to production-grade:
 * - ❌ Before: rounded-full (excessive roundness)
 * - ✅ After: border-radius: 6px for standard badges
 * - ❌ Before: No visible borders
 * - ✅ After: 1px solid borders with 0.2 opacity
 * - ❌ Before: Solid backgrounds
 * - ✅ After: rgba backgrounds with 0.1 opacity (subtle fill)
 * - ❌ Before: Arbitrary Tailwind colors
 * - ✅ After: Semantic colors (green: #22C55E, amber: #F59E0B, red: #EF4444, blue: #3B82F6)
 */

import { Badge } from './Badge';

export function BadgeExamples() {
  return (
    <div className="p-8 space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4">Standard Badges (6px border-radius)</h2>
        <div className="flex gap-3 flex-wrap">
          <Badge variant="success">Active</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Critical</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="default">Default</Badge>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Pill Badges (9999px border-radius)</h2>
        <div className="flex gap-3 flex-wrap">
          <Badge variant="success" shape="pill">Online</Badge>
          <Badge variant="warning" shape="pill">Pending</Badge>
          <Badge variant="danger" shape="pill">Offline</Badge>
          <Badge variant="info" shape="pill">New</Badge>
          <Badge variant="default" shape="pill">Badge</Badge>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Status Examples</h2>
        <div className="flex gap-3 flex-wrap">
          <Badge variant="success">Healthy</Badge>
          <Badge variant="success">Connected</Badge>
          <Badge variant="warning">High Usage</Badge>
          <Badge variant="warning">Maintenance</Badge>
          <Badge variant="danger">Error</Badge>
          <Badge variant="danger">Disconnected</Badge>
          <Badge variant="info">Beta</Badge>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Sensor Status (Real Use Case)</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600 w-32">Temperature:</span>
            <Badge variant="success">Normal</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600 w-32">Power:</span>
            <Badge variant="warning">High</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600 w-32">Connection:</span>
            <Badge variant="danger">Lost</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600 w-32">Data Quality:</span>
            <Badge variant="info">Calibrating</Badge>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Design Principles</h2>
        <div className="space-y-2 text-sm text-neutral-600">
          <p>✅ Semantic colors with clear meanings (green=success, amber=warning, red=error)</p>
          <p>✅ Subtle fill (0.1 opacity) with visible borders (0.2 opacity)</p>
          <p>✅ Moderate border-radius (6px) - not excessive roundness</p>
          <p>✅ WCAG AA compliant contrast ratios</p>
          <p>✅ Dark mode support with adjusted colors</p>
          <p>❌ No arbitrary colors (purple, arbitrary blue, arbitrary orange)</p>
          <p>❌ No rounded-full unless truly pill-shaped</p>
        </div>
      </section>
    </div>
  );
}

export default BadgeExamples;
