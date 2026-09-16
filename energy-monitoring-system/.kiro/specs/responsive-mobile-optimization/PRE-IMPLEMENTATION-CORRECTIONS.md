# Pre-Implementation Corrections Applied

This document tracks the 6 critical corrections applied to design.md and tasks.md before implementation begins.

## Correction 1: Fix Dynamic Tailwind Classes ✅

**Problem:** Template literal expressions in className strings (e.g., `ml-[${sidebarWidth}px]`) are not supported by Tailwind's JIT compiler.

**Solution Applied:**
- Replaced all `${` patterns in className with CSS custom properties pattern
- Updated DashboardLayout implementation to use: `style={{ '--sidebar-width': `${sidebarWidth}px`, marginLeft: 'calc(var(--sidebar-width) + 48px)' }}`
- Noted that inline style patterns like `height: ${virtualRow.size}px` are acceptable (not in className)

**Files Updated:**
- `design.md`: Section 1 (DashboardLayout) implementation pattern
- `tasks.md`: Task 2.5 (Update Main Content Margin Logic)

---

## Correction 2: Tablet Sidebar Behavior - Pick Option A ✅

**Problem:** Design.md presented two options for tablet sidebar behavior, creating implementation ambiguity.

**Decision:** Option A selected - hamburger menu persists through tablet breakpoint for consistency.

**Solution Applied:**
- Removed "Option B" from design.md Section 1
- Clarified: Mobile overlay sidebar for < 1024px, fixed sidebar for ≥ 1024px
- Updated implementation to check only `isDesktop` (not 3 separate states)

**Files Updated:**
- `design.md`: Section 1 (DashboardLayout) - removed Option B code block
- `tasks.md`: Task 2.1, 2.2, 2.3 - updated to reference `isDesktop` instead of `isMobile`/`isTablet` split
- `tasks.md`: Task 11.3 - updated sidebar verification criteria

---

## Correction 3: Memoization Contract ✅

**Problem:** Memoizing MetricCard without addressing WebSocket data flow will fail to prevent re-renders.

**Solution Applied:**
- Added new section "Memoization Contract for Live-Updating Cards" under Performance Optimizations
- Specified: MetricCard must receive primitive props only (label: string, value: number, unit: string)
- Documented correct pattern: Parent uses useMemo/selectors to extract primitives from WebSocket data
- Documented incorrect pattern: Passing object references that change every update

**Files Updated:**
- `design.md`: New subsection added after "Memoized Responsive Components"
- `tasks.md`: Task 9.2 - added verification step before implementing MetricCard memo

---

## Correction 4: Phase 1 Checkpoint ✅

**Problem:** No validation gate between foundation work and component work could allow structural issues to propagate.

**Solution Applied:**
- Added "Phase 1 Checkpoint: Structural Validation" between Phase 1 and Phase 2 in Migration Path
- Requires Playwright tests on 4 key viewports (320, 768, 1280, 1920) before proceeding
- Verification criteria: no horizontal scroll, sidebar visibility, margin calculations, metric cards grid
- Added Task 3.4 with explicit checkpoint testing requirements

**Files Updated:**
- `design.md`: New subsection in Migration Path between Phase 1 and Phase 2
- `tasks.md`: New Task 3.4 added between Task 3 and Task 4 with DO NOT PROCEED instruction

---

## Correction 5: Scope Guardrail for Tables ✅

**Problem:** Design included card-based mobile layout as equal alternative to horizontal scroll, risking scope creep.

**Solution Applied:**
- Updated design.md Section 4 to clarify horizontal scroll is default (requirements 5.1-5.3)
- Marked card-stacking layout (5.4) as "MAY" (optional) - only implement if explicitly required
- Changed subsection title to "Card-Based Mobile Layout (Optional - MAY Requirement)"

**Files Updated:**
- `design.md`: Section 4 (Tables Responsive Pattern) - added scope clarification
- `tasks.md`: Task 5 intro - added note about default pattern and optional card layout

---

## Correction 6: Physical Device Testing Requirement ✅

**Problem:** Design could be misinterpreted as DevTools testing being sufficient per Requirement 11.9.

**Solution Applied:**
- Added note to design.md Testing Strategy: "DevTools responsive mode results per Requirement 11.9 SHALL be verified on actual physical devices"
- Updated tasks.md Task 11 intro with IMPORTANT notice about physical device verification
- Updated Task 11.2-11.4 acceptance criteria to note: "Subject to physical device verification per Requirement 11.9"
- Added instruction to flag tests as 'Pending Physical Device QA' if physical devices unavailable

**Files Updated:**
- `design.md`: Testing Strategy section - added physical device requirement note
- `tasks.md`: Task 11 intro and Tasks 11.2, 11.3, 11.4 - added physical device verification requirements

---

## Implementation Readiness

All 6 corrections have been applied to design.md and tasks.md. The specifications are now ready for implementation with:

1. ✅ No Tailwind dynamic class issues
2. ✅ Clear tablet sidebar behavior (Option A: hamburger menu)
3. ✅ Proper memoization contract for live-updating components
4. ✅ Checkpoint gate to validate foundation before complexity
5. ✅ Clear scope boundaries for table responsive patterns
6. ✅ Explicit physical device testing requirements

**Next Step:** Begin implementation starting with Task 1 (Foundation - Utility Hooks & Layout Setup).
