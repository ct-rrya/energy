/**
 * Example Usage of useMediaQuery Hook
 * 
 * This file demonstrates various ways to use the useMediaQuery hook
 * for responsive behavior in React components.
 */

import { useMediaQuery } from './useMediaQuery';

/**
 * Example 1: Basic Mobile Detection
 */
export function MobileExample() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  return (
    <div>
      {isMobile ? (
        <button className="w-full">Mobile Full-Width Button</button>
      ) : (
        <button className="px-6 py-2">Desktop Button</button>
      )}
    </div>
  );
}

/**
 * Example 2: Multiple Breakpoints
 */
export function ResponsiveLayout() {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  return (
    <div>
      <h1>Current Device Type</h1>
      {isMobile && <p>Mobile View (&lt; 640px)</p>}
      {isTablet && <p>Tablet View (640-1023px)</p>}
      {isDesktop && <p>Desktop View (≥ 1024px)</p>}
    </div>
  );
}

/**
 * Example 3: Tailwind Breakpoints
 */
export function TailwindBreakpoints() {
  const isSm = useMediaQuery('(min-width: 640px)');   // sm
  const isMd = useMediaQuery('(min-width: 768px)');   // md
  const isLg = useMediaQuery('(min-width: 1024px)');  // lg
  const isXl = useMediaQuery('(min-width: 1280px)');  // xl
  const is2xl = useMediaQuery('(min-width: 1536px)'); // 2xl
  
  const columns = is2xl ? 6 : isXl ? 4 : isLg ? 3 : isMd ? 2 : isSm ? 2 : 1;
  
  return (
    <div 
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      <p>Grid with {columns} columns</p>
    </div>
  );
}

/**
 * Example 4: Accessibility - Reduced Motion
 */
export function AnimatedComponent() {
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  return (
    <div 
      className={`transition-transform ${
        prefersReducedMotion ? '' : 'hover:scale-105 duration-300'
      }`}
    >
      <p>This component respects user motion preferences</p>
    </div>
  );
}

/**
 * Example 5: Orientation Detection
 */
export function OrientationExample() {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  
  return (
    <div>
      {isPortrait && <p>📱 Portrait Mode</p>}
      {isLandscape && <p>🖥️ Landscape Mode</p>}
    </div>
  );
}

/**
 * Example 6: Dark Mode Detection
 */
export function DarkModeExample() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  
  return (
    <div className={prefersDark ? 'bg-gray-900 text-white' : 'bg-white text-black'}>
      <p>System prefers: {prefersDark ? 'Dark' : 'Light'} mode</p>
    </div>
  );
}

/**
 * Example 7: Touch Device Detection
 */
export function TouchDeviceExample() {
  const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)');
  
  return (
    <div>
      <button 
        className={`px-4 py-2 ${
          isTouchDevice ? 'min-w-[44px] min-h-[44px]' : ''
        }`}
      >
        {isTouchDevice ? 'Touch-Optimized Button' : 'Mouse-Optimized Button'}
      </button>
    </div>
  );
}

/**
 * Example 8: Conditional Rendering Based on Screen Size
 */
export function ConditionalContent() {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  return (
    <div>
      {/* Always show */}
      <div>Essential Content</div>
      
      {/* Desktop-only sidebar */}
      {isDesktop && (
        <aside className="w-64 border-l">
          Desktop Sidebar
        </aside>
      )}
    </div>
  );
}

/**
 * Example 9: Responsive Chart Height
 */
export function ResponsiveChart() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  
  const chartHeight = isMobile ? 250 : 400;
  
  return (
    <div>
      <div style={{ height: chartHeight }}>
        Chart Container (Height: {chartHeight}px)
      </div>
    </div>
  );
}

/**
 * Example 10: High DPI Display Detection
 */
export function HighDPIExample() {
  const isHighDPI = useMediaQuery('(min-resolution: 2dppx)');
  
  return (
    <img 
      src={isHighDPI ? '/logo@2x.png' : '/logo.png'}
      alt="Logo"
    />
  );
}
