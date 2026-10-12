# Implementation Plan: Phase 2 Mobile Authentication

## Discovered Backend Contract

Based on exploration of `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\src\auth\`:

### Authentication Endpoints

1. **POST /auth/login** - Standard email/password login
   - DTO: `LoginDto { email: string, password: string }`
   - Response: `AuthResponseDto`
   - Rate limit: 10 attempts per 15 minutes
   - **IMPORTANT**: Administrators (SYSTEM_ADMIN, SUPER_ADMIN) are BLOCKED from this endpoint

2. **POST /auth/admin/access-code** - Administrator access code login
   - DTO: `AccessCodeLoginDto { accessCode: string }` (exactly 12 alphanumeric characters)
   - Response: `AuthResponseDto`
   - Rate limit: 5 attempts per 15 minutes
   - Only for SYSTEM_ADMIN and SUPER_ADMIN roles

### Response Structure

```typescript
AuthResponseDto {
  success: boolean
  message: string
  data: {
    token: string  // JWT token
    user: {
      id: string
      email: string
      name: string
      role: string  // "SUPER_ADMIN" | "SYSTEM_ADMIN" | "PUBLIC_USER"
      isActive: boolean
      lastLoginAt: Date
      createdAt: Date
      updatedAt: Date
    }
  }
}
```

### Roles

- **SUPER_ADMIN**: Account management (cannot use password login, must use access code)
- **SYSTEM_ADMIN**: Dashboard operations (cannot use password login, must use access code)
- **PUBLIC_USER**: Public monitoring access (can use password login)

### JWT Configuration

- Authorization header format: `Bearer <token>`
- JWT expiration: 7 days (configurable via JWT_EXPIRATION env var)
- JWT payload includes: `{ sub: userId, email, role, jti: sessionId }`
- No refresh token mechanism exists

### Security Constraints

1. Admin roles MUST use access code authentication (backend enforces this)
2. Access codes are 12-character alphanumeric (case-sensitive)
3. Backend validates account status (isActive) before issuing token
4. Generic error messages prevent user enumeration

## Frontend Web API Client Pattern

Explored `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\frontend\src\api\`:

- Uses axios with interceptors (`frontend/src/api/client.ts`)
- Base URL from `VITE_API_BASE_URL` environment variable
- Request interceptor attaches JWT from `localStorage.getItem('auth_token')` as `Bearer <token>`
- Response interceptor handles 401 (clears token, redirects), 403, 404, 500
- Service layer pattern: `frontend/src/api/services/auth.service.ts`
- Type-safe with TypeScript interfaces from `frontend/src/types/auth.types.ts`
- Centralized endpoint constants in `frontend/src/api/constants.ts`

## Mobile App Current State

Explored `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\`:

- Expo SDK 57, React Native 0.86.3, React 19.2.3, TypeScript 6.0.3
- File-based routing with Expo Router (~57.0.26)
- Routes:
  - `app/index.tsx` - Welcome screen with "View Dashboard" and "Administrator Login" buttons
  - `app/(public)/_layout.tsx` + `app/(public)/index.tsx`, `analytics.tsx`, `energy.tsx` - Public screens
  - `app/(admin)/_layout.tsx` + `app/(admin)/index.tsx` - Admin screens (placeholder)
  - `app/_layout.tsx` - Root layout with SafeAreaProvider
- No `src/` directory yet
- No authentication dependencies installed
- Environment config: `.env.example` with `EXPO_PUBLIC_API_BASE_URL`
- TypeScript path alias `@/*` configured for `./src/*`
- Branding: Dark blue (#0A2947), Green (#2FBF71)

## Dependencies to Install

All packages must be Expo SDK 57 compatible:

- [ ] 1. Install required dependencies
      ```bash
      npx expo install expo-secure-store axios
      ```
      - `expo-secure-store`: Secure token storage (hardware-backed on iOS/Android)
      - `axios@^1.7.0`: HTTP client (same as web frontend uses)
      
      Files: `mobile/package.json` (updated automatically)
      Verify: Check `mobile/package.json` contains both packages after install

## Implementation Steps

### Phase 1: Type Definitions and Constants

- [ ] 2. Create TypeScript type definitions for authentication
      Reuse the backend contract discovered. Define User, LoginCredentials, AccessCodeLoginCredentials, AuthResponse types matching backend DTOs exactly.
      Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\src\types\auth.types.ts`
      Verify: `npm run type-check` passes in mobile directory

- [ ] 3. Create API endpoint constants
      Define AUTH_ENDPOINTS matching backend routes: LOGIN = '/auth/login', ADMIN_ACCESS_CODE = '/auth/admin/access-code'. Include base URL from EXPO_PUBLIC_API_BASE_URL.
      Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\src\constants\api.ts`
      Verify: `npm run type-check` passes

### Phase 2: API Client Infrastructure

- [ ] 4. Create axios API client with interceptors
      Set up base axios instance with:
      - Base URL from `process.env.EXPO_PUBLIC_API_BASE_URL`
      - 30-second timeout
      - Request interceptor to attach JWT token from secure storage as `Authorization: Bearer <token>`
      - Response interceptor to handle 401 (clear token), 403, 404, 500 errors
      - Follow the pattern from `frontend/src/api/client.ts` but adapted for React Native (no window.location, use React Navigation)
      Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\src\api\client.ts`
      Verify: `npm run type-check` passes

- [ ] 5. Create authentication service
      Implement typed API calls:
      - `login(credentials: LoginCredentials): Promise<AuthResponse>`
      - `loginWithAccessCode(credentials: AccessCodeLoginCredentials): Promise<AuthResponse>`
      Both should call the axios client and return the standardized response shape.
      Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\src\api\services\auth.service.ts`
      Verify: `npm run type-check` passes

### Phase 3: Secure Token Storage

- [ ] 6. Create secure token storage utility
      Wrap expo-secure-store with methods:
      - `saveToken(token: string): Promise<void>` - Store JWT securely
      - `getToken(): Promise<string | null>` - Retrieve JWT
      - `removeToken(): Promise<void>` - Delete JWT on logout
      - `saveUser(user: User): Promise<void>` - Store user JSON
      - `getUser(): Promise<User | null>` - Retrieve user
      - `removeUser(): Promise<void>` - Delete user on logout
      Use key names: 'auth_token', 'auth_user'
      Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\src\utils\secureStorage.ts`
      Verify: `npm run type-check` passes

### Phase 4: Authentication Context

- [ ] 7. Create AuthContext and AuthProvider
      Implement React Context with:
      - State: `user: User | null`, `token: string | null`, `isAuthenticated: boolean`, `isLoading: boolean`
      - Methods: `login(credentials)`, `loginWithAccessCode(credentials)`, `logout()`, `restoreSession()`
      - On mount: call `restoreSession()` to load token and user from secure storage
      - On login success: save token and user to secure storage, update state
      - On logout: remove token and user from secure storage, update state, navigate to welcome
      - Export `useAuth()` hook for accessing context
      Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\src\contexts\AuthContext.tsx`
      Verify: `npm run type-check` passes

- [ ] 8. Wrap app with AuthProvider
      Modify `app/_layout.tsx` to wrap the Stack navigator with AuthProvider so auth state is available throughout the app.
      Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\app\_layout.tsx`
      Verify: `npm run type-check` passes, app builds without errors

### Phase 5: Login Screen

- [ ] 9. Create reusable form components
      Create: `TextInput.tsx` (styled input with label, error message, secure text toggle for password), `Button.tsx` (primary/secondary variants, loading state).
      Follow EcoStep branding: dark blue (#0A2947), green (#2FBF71).
      Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\src\components\TextInput.tsx`, `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\src\components\Button.tsx`
      Verify: `npm run type-check` passes

- [ ] 10. Create admin access code login screen
       Replace `app/(admin)/index.tsx` placeholder with full login screen:
       - EcoStep branding header
       - Single input: accessCode (12-char alphanumeric, case-sensitive)
       - Show/hide toggle for access code (secureTextEntry)
       - Input validation (length, alphanumeric)
       - Submit button (calls `loginWithAccessCode` from AuthContext)
       - Loading state during authentication
       - Error message display (invalid access code, network error)
       - Keyboard-aware layout (KeyboardAvoidingView)
       - Safe area handling
       - Accessible labels
       On success: AuthContext navigates to admin dashboard automatically
       Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\app\(admin)\index.tsx`
       Verify: `npm run type-check` passes, screen renders without errors

- [ ] 11. Update welcome screen navigation
       Modify `app/index.tsx`:
       - Remove "(Not implemented in Phase 1)" note from admin button
       - Keep "View Dashboard" button routing to `/(public)` (no auth required)
       - Keep "Administrator Login" button routing to `/(admin)` (now shows login screen)
       Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\app\index.tsx`
       Verify: `npm run type-check` passes, navigation works

### Phase 6: Route Protection

- [ ] 12. Create route guard hook
       Implement `useRequireAuth(requiredRole?: string)` hook:
       - Reads auth state from AuthContext
       - If not authenticated, redirects to `/(admin)` (login screen)
       - If authenticated but wrong role, redirects to `/(public)` or shows unauthorized message
       - Shows loading indicator while auth is initializing
       Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\src\hooks\useRequireAuth.ts`
       Verify: `npm run type-check` passes

- [ ] 13. Create admin dashboard placeholder (protected)
       Create new file `app/(admin)/dashboard.tsx`:
       - Call `useRequireAuth(['SYSTEM_ADMIN', 'SUPER_ADMIN'])` at top of component
       - Display user name, role, email from auth context
       - Show "Logout" button that calls `logout()` from AuthContext
       - Placeholder content: "Admin Dashboard - Coming in Phase 3"
       Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\app\(admin)\dashboard.tsx`
       Verify: `npm run type-check` passes

- [ ] 14. Update admin layout to handle auth navigation
       Modify `app/(admin)/_layout.tsx`:
       - Add `dashboard` screen to Stack
       - On successful login, AuthContext should navigate to `/(admin)/dashboard`
       Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\app\(admin)\_layout.tsx`
       Verify: `npm run type-check` passes, navigation flows correctly

### Phase 7: Environment Configuration

- [ ] 15. Create production .env file
       Copy `.env.example` to `.env` (git-ignored):
       ```
       EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
       ```
       For testing, use local backend. For production, use HTTPS URL.
       Files: `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile\.env`
       Verify: `EXPO_PUBLIC_API_BASE_URL` is accessible via `process.env.EXPO_PUBLIC_API_BASE_URL` in code

### Phase 8: Testing

- [ ] 16. Manual testing: Valid admin access code login
       Prerequisites: Backend running on localhost:3000 with seeded admin account
       Steps:
       1. Start mobile app: `npm start` in mobile directory
       2. Navigate to Administrator Login
       3. Enter valid 12-char access code (get from backend seed or admin management)
       4. Submit
       Expected: Login succeeds, JWT stored, navigates to admin dashboard, user info displayed
       Verify: Manually test and document result

- [ ] 17. Manual testing: Invalid access code
       Steps:
       1. Enter invalid access code (e.g., "INVALID12345")
       2. Submit
       Expected: Error message "Invalid access code" displayed, no navigation, token not stored
       Verify: Manually test and document result

- [ ] 18. Manual testing: Network failure
       Steps:
       1. Stop backend server
       2. Attempt login with any access code
       Expected: Error message "Network error" or similar displayed
       Verify: Manually test and document result

- [ ] 19. Manual testing: Session restoration
       Steps:
       1. Login successfully
       2. Close app completely (not just minimize)
       3. Reopen app
       Expected: App restores to admin dashboard (token retrieved from secure storage), no login required
       Verify: Manually test and document result

- [ ] 20. Manual testing: Logout
       Steps:
       1. Login successfully
       2. Navigate to admin dashboard
       3. Tap "Logout" button
       Expected: Token removed, navigates back to welcome screen, cannot access admin routes
       Verify: Manually test and document result

- [ ] 21. Manual testing: Expired token (simulate)
       Steps:
       1. Login successfully
       2. Manually modify backend to reject token (or wait for expiration if JWT_EXPIRATION is short)
       3. Attempt to access protected route
       Expected: 401 response intercepted, token cleared, redirected to login
       Verify: Manually test and document result (or mark as not testable without backend change)

- [ ] 22. Manual testing: Role-based access
       Steps:
       1. Login with SYSTEM_ADMIN access code
       2. Verify dashboard shows correct role
       3. Logout
       4. Attempt to access `/(admin)/dashboard` directly without login
       Expected: Redirected to login screen
       Verify: Manually test and document result

- [ ] 23. Manual testing: Public access without login
       Steps:
       1. From welcome screen, tap "View Dashboard"
       2. Navigate to public dashboard, analytics, energy screens
       Expected: All public screens accessible without login, no auth prompt
       Verify: Manually test and document result

- [ ] 24. Manual testing: Unauthorized route access attempt
       Steps:
       1. Logout completely
       2. Use React Navigation DevTools or direct navigation to attempt accessing `/(admin)/dashboard`
       Expected: `useRequireAuth` hook redirects to login
       Verify: Manually test and document result

- [ ] 25. Manual testing: Public user login attempt (edge case)
       Steps:
       1. If backend has a PUBLIC_USER account with password login enabled, test using admin login screen
       Expected: Backend should handle appropriately (PUBLIC_USER can use password endpoint, not access code endpoint)
       Note: Admin access code endpoint should reject PUBLIC_USER role. This is a backend concern, but mobile should display error gracefully.
       Verify: Manually test if applicable, or mark as N/A if no PUBLIC_USER test account

### Phase 9: Build Verification

- [ ] 26. Run TypeScript type-check
       Command: `npm run type-check` in `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile`
       Expected: No TypeScript errors
       Verify: Run command and confirm exit code 0

- [ ] 27. Run linter
       Command: `npm run lint` in `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile`
       Expected: No linting errors (or only warnings)
       Verify: Run command and confirm exit code 0

- [ ] 28. Test Expo development build
       Command: `npm start` in `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\mobile`
       Expected: Metro bundler starts successfully, app loads in Expo Go or simulator without crashes
       Verify: Run command and manually test app startup

- [ ] 29. Test backend build (if backend was modified)
       Command: `npm run build` in `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system`
       Expected: NestJS backend compiles successfully
       Note: Backend should NOT require modification for Phase 2. Only run if changes were made.
       Verify: Run command if applicable, or mark as N/A

- [ ] 30. Test frontend build (if frontend was modified)
       Command: `npm run build` in `c:\Users\Merry Apple Edano\OneDrive\Desktop\another\energy-monitoring-system\frontend`
       Expected: Vite frontend builds successfully
       Note: Frontend should NOT require modification for Phase 2. Only run if changes were made.
       Verify: Run command if applicable, or mark as N/A

## Architecture Decisions

### Decision 1: Admin-only authentication in Phase 2

**Rationale**: The backend enforces that admin roles (SYSTEM_ADMIN, SUPER_ADMIN) MUST use access code authentication. The email/password endpoint explicitly blocks admin roles. Therefore, the mobile app Phase 2 will implement ONLY access code login for administrators. Public user login (if needed) can be added in a future phase, but the primary mobile app use case is administrator access.

### Decision 2: Use expo-secure-store, not AsyncStorage

**Rationale**: JWTs are sensitive credentials. `expo-secure-store` provides hardware-backed encryption on iOS (Keychain) and Android (Keystore), whereas AsyncStorage is plain-text. This matches security best practices.

### Decision 3: No refresh token implementation

**Rationale**: The backend does not implement refresh tokens. JWT expiration is 7 days. If a refresh token mechanism is needed in the future, it must be implemented backend-first.

### Decision 4: Follow web frontend API client pattern

**Rationale**: The web frontend uses axios with interceptors, centralized service layer, and typed responses. The mobile app will follow the same pattern for consistency, making it easier for developers familiar with the web frontend to understand the mobile code.

### Decision 5: Context API for auth state (not Redux)

**Rationale**: Phase 1 mobile app has no state management library. React Context is sufficient for auth state (user, token, isAuthenticated), and avoids adding Redux dependency. If global state complexity grows in Phase 3+, Redux can be added then.

### Decision 6: File-based routing with Expo Router (no React Navigation components)

**Rationale**: Phase 1 already uses Expo Router. Auth navigation (redirect to login, redirect to dashboard) will be handled via `router.push()` and `router.replace()` from `expo-router`, not React Navigation's imperative API.

## Gaps and Concerns

### Gap 1: HTTPS in production

**Concern**: The backend must be served over HTTPS in production. Sending JWT tokens over HTTP is insecure. The mobile app will send credentials to `EXPO_PUBLIC_API_BASE_URL`. If this is HTTP in production, credentials are vulnerable to interception.

**Mitigation**: Document in plan that production deployment requires HTTPS backend. No code changes needed in mobile app, but deployment guide must emphasize this.

### Gap 2: CORS configuration for mobile

**Concern**: Mobile apps don't send an Origin header the same way browsers do. The backend's CORS configuration (`CORS_ORIGIN=http://localhost:5173`) is for the web frontend. Mobile HTTP requests from axios may have different origin behavior.

**Mitigation**: Test mobile API calls during manual testing. If CORS errors occur, backend CORS config may need to allow mobile origins or be more permissive. This is a backend configuration concern, not a mobile code issue.

### Gap 3: JWT expiration handling

**Concern**: Backend JWT expires in 7 days. The mobile app will store the JWT in secure storage. If the user opens the app after 7 days, the token will be expired. The axios response interceptor will catch the 401 error and clear the token, forcing re-login. This is acceptable behavior, but there's no proactive expiration check.

**Mitigation**: No code changes needed. Document this behavior: users must re-login after 7 days of inactivity. A future enhancement could decode the JWT and check `exp` claim before making API calls.

### Gap 4: No biometric authentication in Phase 2

**Concern**: The user request mentions "biometric authentication" as a Phase 2 feature in some docs, but the backend has no biometric support. Biometric auth would be a client-side convenience (use fingerprint/FaceID to unlock stored JWT), not a backend authentication method.

**Mitigation**: Exclude biometric auth from Phase 2 scope. It can be added in Phase 3 as a local device security feature (use expo-local-authentication to gate access to the stored JWT).

### Gap 5: Session timeout (10-minute inactivity)

**Concern**: The backend tracks `lastActivityAt` for admin users and mentions a 10-minute inactivity timeout. However, the JWT itself has a 7-day expiration. It's unclear if the backend enforces the 10-minute timeout on API calls.

**Mitigation**: If the backend enforces inactivity timeout, 401 errors will be caught by the mobile app's axios interceptor and handled (token cleared, redirect to login). No special mobile code is needed unless the backend requires periodic "keep-alive" pings, which is not evident from the explored code.

### Gap 6: No automated tests in Phase 2

**Concern**: The plan includes only manual testing. Setting up Jest or React Native Testing Library for automated tests would require additional dependencies and configuration.

**Mitigation**: Manual testing is sufficient for Phase 2 validation. Automated testing can be added in a future phase once the test framework is set up project-wide.

## Summary

This plan implements Phase 2 mobile authentication using the backend's access code login endpoint. It reuses the web frontend's API client pattern (axios + interceptors + service layer), stores JWTs securely with expo-secure-store, and protects admin routes with a context-based auth guard. The implementation is grounded in the actual backend contract discovered during exploration and does not introduce new authentication mechanisms or backend changes.

**Total Steps**: 30 (including installation, implementation, testing, and verification)

**No backend changes required**: The existing `POST /auth/admin/access-code` endpoint and JWT strategy are sufficient.

**No web frontend changes required**: Web and mobile are independent clients of the same backend.

**Dependencies added**: `expo-secure-store`, `axios`

**New directories**: `mobile/src/types/`, `mobile/src/constants/`, `mobile/src/api/`, `mobile/src/utils/`, `mobile/src/contexts/`, `mobile/src/components/`, `mobile/src/hooks/`

**Modified files**: `mobile/app/_layout.tsx`, `mobile/app/index.tsx`, `mobile/app/(admin)/index.tsx`, `mobile/app/(admin)/_layout.tsx`, `mobile/package.json`, `mobile/.env`

**New files**: 15+ TypeScript files for types, services, context, components, hooks, and one new route (`(admin)/dashboard.tsx`)
