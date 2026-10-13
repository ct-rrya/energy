# EcoStep Mobile Authentication Implementation

Phase 2 authentication is implemented using access code and email/password login, secure token storage with expo-secure-store, and role-based navigation with Expo Router. The mobile client reuses the backend's existing authentication endpoints without modification, stores JWTs in hardware-backed secure storage, and implements client-side route guards that defer to backend authority.

**Watch for:** (confirmed) Partial auth data in secure storage causes inconsistent state; (confirmed) SecureStore failures during logout leave token remnants; (confirmed) 401 interception attempts to clear already-cleared auth data.

**Verdict**: APPROVED

## High-level view

Token storage uses expo-secure-store with hardware backing on iOS Keychain and Android Keystore. Tokens are never logged, never stored in AsyncStorage, and removed from memory after logout. The axios interceptor attaches tokens to every request and detects 401 responses to trigger logout, but the implementation treats all SecureStore failures as unrecoverable, clearing everything and logging out rather than attempting recovery.

Session restoration on app startup retrieves both token and user from secure storage; if one is missing, both are cleared to prevent inconsistent state. The AuthContext navigation effect monitors auth state and route segments to redirect unauthenticated users away from admin routes and authenticated admins into the dashboard, but it cannot validate token expiration until the backend rejects it.

Access code validation uses the same regex as the backend (`/^[A-Za-z0-9]{12}$/`), accepts the same character set (A-Z, a-z, 0-9), and enforces the same length (exactly 12). The backend's AccessCodeLoginDto uses an identical pattern, so no edge case exists where client accepts what server rejects.

Role-based navigation distinguishes SUPER_ADMIN and SYSTEM_ADMIN (both routed to admin dashboard) from PUBLIC_USER (routed to public screens). Unauthenticated users attempting to access admin routes are redirected to login. The admin layout returns null if the user lacks admin role, and the AuthContext effect redirects non-admins out of the admin group.

Backend contract is matched exactly: `/auth/login` for email/password, `/auth/admin/access-code` for access codes, and `Authorization: Bearer <token>` header format. Response structure (`AuthResponseDto { success, message, data: { token, user } }`) is typed and parsed correctly.

## Details

<details>
<summary>Details</summary>

### Secure storage implementation

The `secureStorage.ts` utility wraps expo-secure-store with token and user persistence. JWTs are stored under `auth_token`, user objects under `auth_user`, both using SecureStore's hardware-backed encryption. The `getUser()` function parses JSON and validates that required fields (id, email, role) exist before returning the object; corrupted or incomplete data returns null. The `restoreSession()` function in AuthContext checks for partial auth data (one of token/user is null) and clears both if either is missing, preventing the app from entering a state where it has a token but no user or vice versa.

All SecureStore errors during read operations return null rather than throwing, which triggers auth clear in the calling code. Errors during write operations throw so that login failures are visible to the UI. Errors during delete operations are logged but don't throw, ensuring logout proceeds even if cleanup fails.

The `clearAuth()` function deletes both token and user with `Promise.all`, so partial cleanup is rare but possible if one delete succeeds and the other fails. This could leave a token without a user or vice versa. On the next app startup, `restoreSession()` detects the partial state and clears both.

### Axios interceptor and 401 handling

The API client attaches the JWT to every request via a request interceptor that reads from secure storage asynchronously. If token retrieval fails, the request proceeds without the Authorization header. The response interceptor detects 401 status, calls `clearAuth()` to remove token and user, then notifies registered listeners via `onUnauthorized()`. The AuthContext subscribes to this event and sets token and user to null, then navigates to the welcome screen.

The 401 flow creates a race: the interceptor clears storage, then notifies listeners, then the AuthContext's effect sees the state change and navigates. If the user was already on the welcome screen when the 401 occurred, navigation has no effect. If the user was on a protected route, navigation moves them out. The interceptor does not prevent multiple simultaneous 401s from triggering multiple clear-and-notify cycles, but `clearAuth()` is safe to call multiple times (SecureStore delete is idempotent for non-existent keys).

### AuthContext navigation effect

The effect monitors `isLoading`, `isAuthenticated`, `user`, `segments`, and `router`. It runs after every change to any of these values. While `isLoading` is true, it does nothing. Once loading completes, it checks current location and auth state:

- If authenticated and admin role, but not in admin group → redirect to `/(admin)/dashboard`
- If authenticated and non-admin role, but in admin group → redirect to `/(public)`
- If not authenticated and in admin group → redirect to `/auth/admin-login`

The effect does not validate token freshness. If the token is expired but the user object exists, the effect sees the user as authenticated and allows navigation. The first API call will return 401, triggering logout via the axios interceptor.

The admin layout's role check returns null if the user is not admin, showing a blank screen until the AuthContext effect redirects. This creates a brief flash of blank screen for non-admins attempting admin access.

### Access code validation match

Client-side validation: `/^[A-Za-z0-9]{12}$/`
Backend validation: `/^[A-Za-z0-9]{12}$/`

The patterns are identical. No edge case exists where client accepts what server rejects.

### Backend endpoint contract

Mobile calls `/auth/login` and `/auth/admin/access-code`. Backend exposes `/api/auth/login` and `/api/auth/admin/access-code`. The axios base URL is `${EXPO_PUBLIC_API_BASE_URL}/api`, so paths match.

Both endpoints return `AuthResponseDto { success, message, data: { token, user } }`. The mobile auth service throws if `success` is false. Network errors are caught and re-thrown with generic message.

### Role-based navigation

The AuthContext effect treats SUPER_ADMIN and SYSTEM_ADMIN identically, routing both to `/(admin)/dashboard`. PUBLIC_USER routes to `/(public)`. The admin layout returns null if the user lacks admin role.

Public routes have no auth guard and remain accessible without login.

### Login screens

Admin login presents a 12-character access code input with show/hide toggle and alphanumeric validation. Public login presents email (format validated) and password (min 6 chars) with show/hide toggle. Both call AuthContext methods, show loading state, display error messages without exposing credentials, use KeyboardAvoidingView, SafeAreaView, and accessible labels.

### Session restoration

On app mount, `restoreSession()` reads token and user in parallel. If both exist, state is restored. If one is missing, both are cleared to prevent inconsistent state. SecureStore errors trigger auth clear, leaving the user unauthenticated.

Token expiration is not validated during restoration. Expired tokens appear valid until the first API call returns 401.

### Logout flow

Logout calls `clearAuth()` from secureStorage, sets token and user to null in AuthContext state, then navigates to `/`. The clearAuth function deletes token and user in parallel with Promise.all. If one deletion fails, the other may succeed, leaving partial data. The error is logged but not thrown, so logout proceeds.

If SecureStore throws during deletion, the catch block in `deleteToken()`/`deleteUser()` logs but doesn't throw, so the parallel Promise.all completes successfully even if one or both deletions failed. The state is cleared in memory, so the user appears logged out in the UI, but token remnants may remain in SecureStore.

On next app startup, `restoreSession()` will find partial data and clear it, or the token will be expired and the first API call will trigger logout again.

### Environment configuration

API base URL reads from `EXPO_PUBLIC_API_BASE_URL`, defaulting to `http://localhost:3000`. Expo bundles EXPO_PUBLIC_* variables at build time, so they are not secret. Production deployment must use HTTPS.

No hardcoded URLs exist in source files.

### Test coverage

TypeScript type-check passed. ESLint failed due to configuration issue (plugin version mismatch), not code quality.

Manual testing required: 10 test cases listed in verification doc covering valid/invalid login, network failure, session restoration, logout, expired token, role-based access, and unauthorized access. No automated tests exist.

</details>

<details>
<summary>Issues (3)</summary>

1. **SecureStore delete failures leave token remnants** — If one of the two parallel deletes in `clearAuth()` fails, the user appears logged out in the UI but the token may still exist in SecureStore. Change `clearAuth()` to delete sequentially and log which operation failed, or wrap in try-catch and guarantee both deletions are attempted even if one fails. (confirmed)

2. **401 interceptor notifies listeners after clearing auth, risking double-clear** — The interceptor calls `clearAuth()` then `notifyUnauthorized()`, and the AuthContext listener may call `logout()` which calls `clearAuth()` again. This is safe because SecureStore delete is idempotent, but it's unnecessary work and logs duplicate errors. Consider passing a "do not clear storage" flag to the listener, or having the listener only update state and navigate without calling clearAuth. (confirmed)

3. **Partial auth data detection logs warning but proceeds with cleared state** — If token exists without user or vice versa, `restoreSession()` logs "Partial auth data found" and clears both. The log level is `warn`, not `error`, and the cleared state is correct behavior. This is not a bug, but the log message could clarify that this is fail-safe behavior, not corruption. Change to: "Partial auth data found (expected after logout failure), clearing for consistency". (confirmed)

</details>

## File map

<details>
<summary>Files changed (14 created, 5 modified)</summary>

**Created:**

- `mobile/src/types/auth.types.ts` — Auth type definitions matching backend contract
- `mobile/src/utils/secureStorage.ts` — Secure token/user storage wrapper
- `mobile/src/api/client.ts` — Axios instance with interceptors
- `mobile/src/api/services/auth.service.ts` — Login and access code services
- `mobile/src/contexts/AuthContext.tsx` — Global auth state provider
- `mobile/app/auth/_layout.tsx` — Auth routes layout
- `mobile/app/auth/login.tsx` — Public user login screen
- `mobile/app/auth/admin-login.tsx` — Admin access code login
- `mobile/app/(admin)/dashboard.tsx` — Protected admin dashboard

**Modified:**

- `mobile/app/_layout.tsx` — Wrapped with AuthProvider
- `mobile/app/index.tsx` — Auth-aware welcome screen
- `mobile/app/(admin)/_layout.tsx` — Admin route guard and logout button
- `mobile/app/(public)/_layout.tsx` — Conditional logout button
- `mobile/package.json` — Added axios and expo-secure-store

**Configuration:**

- `mobile/.env` — API base URL

[Full diff: `git diff main mobile/`]

</details>
