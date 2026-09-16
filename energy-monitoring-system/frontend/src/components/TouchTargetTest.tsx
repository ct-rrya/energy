/**
 * Touch Target Utilities Test Component
 * 
 * Tests the custom Tailwind utilities for touch targets:
 * - .min-w-touch (min-width: 44px)
 * - .min-h-touch (min-height: 44px)
 * - .touch-target (min-width: 44px AND min-height: 44px)
 */

export function TouchTargetTest() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Touch Target Utilities Test</h1>
      <p className="mb-8 text-neutral-600">
        Testing custom Tailwind utilities for 44x44px minimum touch targets
      </p>

      {/* Test 1: min-w-touch */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-neutral-200">
        <h2 className="text-xl font-semibold mb-4">Test 1: .min-w-touch</h2>
        <button className="min-w-touch px-2 py-1 bg-[#1A312C] text-white rounded-lg hover:bg-[#428475] transition-colors">
          Button with min-w-touch
        </button>
        <p className="text-sm text-neutral-500 mt-2">
          Expected: Minimum width of 44px
        </p>
      </div>

      {/* Test 2: min-h-touch */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-neutral-200">
        <h2 className="text-xl font-semibold mb-4">Test 2: .min-h-touch</h2>
        <button className="min-h-touch px-4 py-1 bg-[#1A312C] text-white rounded-lg hover:bg-[#428475] transition-colors">
          Button with min-h-touch
        </button>
        <p className="text-sm text-neutral-500 mt-2">
          Expected: Minimum height of 44px
        </p>
      </div>

      {/* Test 3: touch-target (both) */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-neutral-200">
        <h2 className="text-xl font-semibold mb-4">Test 3: .touch-target</h2>
        <button className="touch-target px-2 py-1 bg-[#1A312C] text-white rounded-lg hover:bg-[#428475] transition-colors">
          Complete touch-target
        </button>
        <p className="text-sm text-neutral-500 mt-2">
          Expected: Minimum width AND height of 44px
        </p>
      </div>

      {/* Test 4: Combined with responsive classes */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-neutral-200">
        <h2 className="text-xl font-semibold mb-4">Test 4: Combined Classes</h2>
        <button className="touch-target px-4 py-2 bg-[#428475] text-white rounded-lg hover:bg-[#89D7B7] hover:text-[#1A312C] transition-all shadow-md">
          Styled Touch Target
        </button>
        <p className="text-sm text-neutral-500 mt-2">
          Expected: 44x44px minimum with full EcoStep styling
        </p>
      </div>

      {/* Test 5: Icon-only button use case */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-neutral-200">
        <h2 className="text-xl font-semibold mb-4">Test 5: Icon-Only Button (Real World)</h2>
        <button 
          className="touch-target flex items-center justify-center bg-[#1A312C] text-white rounded-lg hover:bg-[#428475] transition-colors"
          aria-label="Settings"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
        <p className="text-sm text-neutral-500 mt-2">
          Expected: Icon-only button with 44x44px touch target (mobile UX pattern)
        </p>
      </div>

      {/* Test 6: Responsive usage */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-neutral-200">
        <h2 className="text-xl font-semibold mb-4">Test 6: Responsive Pattern</h2>
        <button className="touch-target px-3 py-2 sm:px-4 sm:py-3 bg-[#1A312C] text-white rounded-lg hover:bg-[#428475] transition-colors">
          <span className="hidden sm:inline">Desktop Text</span>
          <span className="sm:hidden">Mobile</span>
        </button>
        <p className="text-sm text-neutral-500 mt-2">
          Expected: Touch target maintained across breakpoints with different padding
        </p>
      </div>

      <div className="mt-8 p-4 bg-accent-50 border border-accent-200 rounded-lg">
        <h3 className="font-semibold mb-2">✓ Implementation Complete</h3>
        <p className="text-sm text-neutral-600">
          Custom touch target utilities have been added to <code className="px-1 py-0.5 bg-neutral-100 rounded">frontend/src/index.css</code>
        </p>
        <ul className="text-sm text-neutral-600 mt-2 ml-4 list-disc">
          <li><code className="px-1 py-0.5 bg-neutral-100 rounded">.min-w-touch</code> - Minimum width of 44px</li>
          <li><code className="px-1 py-0.5 bg-neutral-100 rounded">.min-h-touch</code> - Minimum height of 44px</li>
          <li><code className="px-1 py-0.5 bg-neutral-100 rounded">.touch-target</code> - Both width and height 44px</li>
        </ul>
      </div>
    </div>
  );
}

export default TouchTargetTest;
