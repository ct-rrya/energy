# Implementation Plan: Stage 3 - Live Energy Dashboard UI

## Overview
Replace placeholder dashboard screens with polished mobile dashboard displaying real-time energy data using Stage 2 API services. No Firebase, Socket.IO, or real-time subscriptions (Stage 4). No analytics charts (Stage 5). No push notifications (Stage 6).

## Key Constraints
- **Expo SDK 57** + React Native 0.86.3 + React 19.2.3 (fixed versions)
- **No new npm packages** unless absolutely necessary
- **Use existing Stage 2 API services** - never call axios directly
- **Public endpoints** (getDashboardMetrics, getRecentReadings) work without auth
- **Admin endpoints** require JWT from AuthContext
- **Distinguish null from zero** - null displays '--', zero displays '0.0'

## Implementation Steps

### FEAT-001: Reusable Dashboard Components and Hooks

- [ ] 1. Create reusable dashboard UI components and data fetching hooks
      Files: 
      - mobile/src/components/dashboard/MetricCard.tsx
      - mobile/src/components/dashboard/HeroEnergyCard.tsx
      - mobile/src/components/dashboard/LoadingCard.tsx
      - mobile/src/components/dashboard/ErrorCard.tsx
      - mobile/src/components/dashboard/index.ts
      - mobile/src/hooks/useDashboardData.ts
      - mobile/src/hooks/useRecentReading.ts
      - mobile/src/hooks/index.ts
      
      Create directories mobile/src/components/ and mobile/src/hooks/. Implement MetricCard (displays single metric with label, value, unit, loading/error/null states - null shows '--', zero shows '0'). Implement HeroEnergyCard (large card for daily energy with AI insight, loading/error states). Implement LoadingCard (animated skeleton). Implement ErrorCard (error message + retry button). Create useDashboardData hook wrapping getDashboardMetrics() from dashboard.service.ts. Create useRecentReading hook wrapping getRecentReadings(1) from energy.service.ts. Both hooks return { data/reading, isLoading, isError, error, refetch }. Use EcoStep colors: #2FBF71 (green), #0A2947 (dark), #F5F7FA (bg), white cards with shadows.
      
      Verify: `cd mobile && npm run type-check` - confirm 0 TypeScript errors, all imports resolve correctly

### FEAT-002: Public Dashboard Screen

- [ ] 2. Replace public dashboard placeholder with live dashboard
      Files: 
      - mobile/app/(public)/index.tsx
      
      Replace existing placeholder in app/(public)/index.tsx completely. Import hooks (useDashboardData, useRecentReading) and components (HeroEnergyCard, MetricCard, ErrorCard) from FEAT-001. Use ScrollView with RefreshControl for pull-to-refresh. Layout: HeroEnergyCard (dailyEnergy from getDashboardMetrics) + 4 stacked MetricCards (Voltage/Current/Power/Energy from getRecentReadings). Display voltage (V, 1 decimal), current (A, 2 decimals), power (W, 1 decimal), energy (kWh, 3 decimals). Handle loading (show skeletons), error (show ErrorCard with retry), empty state (totalReadings=0 shows message). Add timestamp showing lastReadingAt formatted as relative time. Null values display '--', zeros display properly formatted. Background #F5F7FA, 16px padding, SafeAreaView for safe areas. PUBLIC route - no authentication required.
      
      Verify: `cd mobile && npm run type-check` - 0 errors. Start dev server, test on device: dashboard loads without auth, pull-to-refresh works, loading/error/empty states display correctly

### FEAT-003: Admin Dashboard Enhancement

- [ ] 3. Enhance admin dashboard with live data while preserving Phase 2 auth
      Files: 
      - mobile/app/(admin)/dashboard.tsx
      
      Preserve existing user info card (name, email, role, status) and logout button from Phase 2. Replace 'Phase 3 Features Coming Soon' card with same live dashboard as public version. Import same hooks and components from FEAT-001. Add HeroEnergyCard + 4 MetricCards below user info card. Implement pull-to-refresh (refreshes dashboard data, not user info). Add timestamp display. Keep logout button functional. Layout: user info card at top, dashboard section below with same styling as public dashboard, logout button at bottom. Error handling: if dashboard fails, show ErrorCard but keep user info and logout visible. PROTECTED route - requires authentication.
      
      Verify: `cd mobile && npm run type-check` - 0 errors. Start dev server, login as admin, verify user info displays, verify live dashboard displays below, verify logout works, verify pull-to-refresh works

## Cross-FEAT Integration Verification

After all FEATs complete, verify:
1. **TypeScript**: `cd mobile && npm run type-check` - 0 errors
2. **Backend unchanged**: `cd . && npm run build` - succeeds without changes
3. **Frontend unchanged**: `cd frontend && npm run build` - succeeds without changes
4. **Public dashboard accessible**: No auth required, shows live data
5. **Admin dashboard protected**: Requires auth, shows user info + live data
6. **Pull-to-refresh**: Works on both dashboards
7. **Loading states**: Skeletons display during initial load
8. **Error states**: ErrorCard displays with retry button
9. **Empty states**: Message displays when no readings exist
10. **Null vs zero**: Null shows '--', zero shows '0.0' etc.
11. **Session expiration**: Expired JWT handled by existing interceptor
12. **Responsive layout**: Works on small screens (320px min width)

## Out of Scope for Stage 3
- Firebase Firestore integration (Stage 4)
- Socket.IO real-time updates (Stage 4)
- Analytics charts and visualizations (Stage 5)
- Push notifications (Stage 6)
- Backend modifications
- New npm packages (use existing Expo components)
- Device-specific testing (manual only if device available)

## Success Criteria
- Public and admin dashboards display live energy data
- All API calls use Stage 2 services (no direct axios calls)
- Pull-to-refresh, loading, error, empty states implemented
- Null values handled distinctly from zeros
- Authentication preserved from Phase 2
- TypeScript builds with 0 errors
- Backend and frontend remain unchanged
