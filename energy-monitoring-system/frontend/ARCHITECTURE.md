# Frontend Architecture Documentation

## Overview

This document describes the frontend architecture for the **Energy Monitoring System**. The frontend is built with modern React best practices following Clean Architecture and SOLID principles.

---

## Tech Stack

- **React 19** - UI library
- **TypeScript 6** - Type safety
- **Vite 8** - Build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **React Router v7** - Client-side routing
- **TanStack Query v5** - Server state management
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication (to be implemented)
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Recharts** - Data visualization
- **Lucide React** - Icon library

---

## Project Structure

```
src/
├── api/                    # API Layer
│   ├── client.ts          # Axios instance with JWT interceptors
│   ├── constants.ts       # API endpoint constants and query keys
│   └── services/          # API service modules
│       ├── auth.service.ts
│       ├── sensor.service.ts
│       ├── health.service.ts
│       └── index.ts
│
├── components/            # Reusable UI Components
│   ├── ui/               # shadcn/ui primitives (to be added)
│   ├── layout/           # Layout-specific components
│   ├── charts/           # Chart wrappers
│   └── common/           # Generic reusable components
│       ├── LoadingSpinner.tsx
│       └── ErrorBoundary.tsx
│
├── features/             # Feature Modules (Feature-First Architecture)
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       └── NotFoundPage.tsx
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── pages/
│   │       ├── DashboardPage.tsx
│   │       └── HealthCheckPage.tsx
│   ├── sensors/
│   ├── energy/
│   ├── analytics/
│   └── reports/
│
├── hooks/               # Global Custom Hooks
│
├── contexts/            # React Context Providers
│   ├── AuthContext.tsx # Authentication state
│   └── SocketContext.tsx # Socket.IO connection
│
├── layouts/             # Page Layout Templates
│   ├── AuthLayout.tsx  # Public pages (Login)
│   └── DashboardLayout.tsx # Protected pages (Sidebar + Header)
│
├── routes/              # Routing Configuration
│   ├── index.tsx       # Route definitions
│   ├── ProtectedRoute.tsx # Auth guard
│   └── routes.config.ts # Route constants
│
├── lib/                 # Utilities & Helpers
│   ├── utils.ts        # General utilities (cn, formatters)
│   └── constants.ts    # App-wide constants
│
├── types/               # TypeScript Definitions
│   ├── api.types.ts
│   ├── auth.types.ts
│   ├── sensor.types.ts
│   ├── energy.types.ts
│   └── index.ts
│
├── styles/              # Global Styles
│   └── index.css       # Tailwind CSS v4 configuration
│
├── App.tsx              # Root component with providers
└── main.tsx             # Application entry point
```

---

## Architectural Decisions

### 1. **Feature-First Architecture**

Each feature (auth, dashboard, sensors, etc.) is organized in its own directory with:
- `components/` - Feature-specific UI components
- `hooks/` - Feature-specific custom hooks
- `pages/` - Top-level page components

**Rationale:**
- **Scalability**: Easy to add new features without restructuring
- **Maintainability**: Related code is co-located
- **Team collaboration**: Different developers can work on different features independently

---

### 2. **Separation of Concerns**

The architecture clearly separates:
- **API Layer** (`api/`): HTTP communication and data fetching
- **Business Logic** (`hooks/`): Custom hooks for state and side effects
- **Presentation** (`components/`): UI components
- **Routing** (`routes/`): Navigation configuration
- **State Management** (`contexts/`): Global application state

**Rationale:**
- **Testability**: Each layer can be tested independently
- **Reusability**: Components and hooks can be reused across features
- **Maintainability**: Changes to one layer don't affect others

---

### 3. **Authentication Architecture**

#### Token Storage
- JWT token stored in `localStorage`
- User object stored in `AuthContext`
- Token attached to every API request via Axios interceptor

#### Auth Flow
1. User submits login credentials
2. Backend returns JWT + user object
3. Store token in localStorage
4. Store user in AuthContext
5. Redirect to dashboard
6. All API calls include `Authorization: Bearer {token}` header

#### Token Validation
- On app load, check if token exists in localStorage
- Fetch user profile to validate token
- If 401 error, clear token and redirect to login

#### Protected Routes
- `ProtectedRoute` component wraps authenticated pages
- Checks `isAuthenticated` from AuthContext
- Redirects to `/login` if not authenticated
- Shows loading spinner while checking auth state

**Rationale:**
- **Security**: Token never exposed in URL or cookies
- **Persistence**: User stays logged in across browser sessions
- **Centralized logic**: All auth logic in one place (AuthContext)

---

### 4. **API Layer Design**

#### Axios Client Configuration
```typescript
// Request Interceptor: Attach JWT token
config.headers.Authorization = `Bearer ${token}`

// Response Interceptor: Handle errors globally
if (401) clearAuth() && redirect to /login
if (403) show error toast
if (500) show error toast
```

#### Service Modules
- One service file per domain (auth, sensors, energy, etc.)
- Each service exports functions for API operations
- Services use the centralized Axios client
- No direct API calls in components

**Rationale:**
- **DRY principle**: No duplicate token-attaching code
- **Global error handling**: Consistent error UX
- **Maintainability**: API changes only affect service files
- **Testability**: Services can be mocked in tests

---

### 5. **State Management Strategy**

#### React Context
- **Purpose**: Global app-wide state that changes infrequently
- **Examples**: Auth state, Socket connection, Theme
- **Why**: Built-in React feature, no extra dependencies

#### TanStack Query
- **Purpose**: Server state (data from API)
- **Examples**: Sensors, energy readings, analytics
- **Features**:
  - Automatic caching
  - Background refetching
  - Optimistic updates
  - Loading and error states
  - Query invalidation
- **Why**: Industry standard for server state management

#### Local Component State
- **Purpose**: Ephemeral UI state
- **Examples**: Form inputs, modal visibility, dropdowns
- **Why**: No need for global state

**Rationale:**
- **Right tool for the job**: Each state type has appropriate management
- **Performance**: Only relevant data triggers re-renders
- **Developer experience**: Clear patterns for state management

---

### 6. **Routing Architecture**

#### Route Structure
```
/ → Redirect to /dashboard
/login → Public (AuthLayout)
/dashboard → Protected (DashboardLayout)
/sensors → Protected
/energy → Protected
/analytics → Protected
/reports → Protected
/404 → Public
```

#### Route Protection
- `ProtectedRoute` HOC wraps authenticated pages
- Checks `isAuthenticated` from AuthContext
- Preserves intended destination for post-login redirect

**Rationale:**
- **Security**: Unauthorized users can't access protected pages
- **User experience**: Automatic redirects, no manual navigation
- **Maintainability**: Protection logic in one place

---

### 7. **Layout System**

#### AuthLayout (Public Pages)
- Centered content
- Clean, minimal design
- Logo and branding
- No navigation

#### DashboardLayout (Protected Pages)
- Sidebar navigation
- Header with user menu
- Main content area
- Logout button

**Rationale:**
- **Consistency**: All pages of same type look similar
- **Reusability**: Layout changes propagate automatically
- **Responsive**: Works on desktop, tablet, mobile

---

### 8. **Design System (Tailwind CSS v4)**

#### Color Palette
- **Primary (Deep Navy)**: `#0A2947` - Headers, primary actions
- **Secondary (Energy Green)**: `#22C55E` - Success states, energy metrics
- **Accent (Amber)**: `#F59E0B` - Warnings, highlights
- **Neutral (Gray)**: Background, text, borders

#### Typography
- **Font**: Inter (Google Fonts)
- **Scale**: Clear hierarchy for headings and body text

#### Components
- **Cards**: White background, subtle shadow, rounded corners
- **Buttons**: Primary (solid), secondary (outline), ghost
- **Inputs**: Border with focus states
- **Tables**: Striped rows, hover states

**Rationale:**
- **Professional appearance**: Suitable for engineering capstone
- **Accessibility**: Sufficient color contrast
- **Consistency**: Unified visual language

---

### 9. **Error Handling**

#### Global Error Boundary
- Catches unhandled JavaScript errors
- Displays user-friendly error message
- Provides "Try Again" button

#### API Errors
- Handled in Axios response interceptor
- 401: Clear auth and redirect to login
- 403/404/500: Log error to console (toast notifications to be added)

**Rationale:**
- **User experience**: App doesn't crash, users see helpful messages
- **Debugging**: Errors logged for developers
- **Recovery**: Users can try again without refreshing

---

### 10. **TypeScript Configuration**

#### Strict Type Safety
- `noUnusedLocals` and `noUnusedParameters` enabled
- `verbatimModuleSyntax` enforced
- Path aliases: `@/` maps to `src/`

#### Type Organization
- Centralized type definitions in `types/`
- One file per domain (auth, sensor, energy, etc.)
- Re-exported through `types/index.ts`

**Rationale:**
- **Type safety**: Catch errors at compile time
- **Autocomplete**: Better developer experience
- **Maintainability**: Types document the codebase

---

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_NAME=Energy Monitoring System
VITE_APP_VERSION=1.0.0
```

---

## Development Workflow

### Start Development Server
```bash
npm run dev
```
Access at: http://localhost:5173

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## Testing Backend Connectivity

Visit: http://localhost:5173/health

This page:
- ✅ Tests connection to backend API
- ✅ Displays backend health status
- ✅ Shows database connectivity
- ✅ Verifies Axios configuration
- ✅ Confirms TanStack Query setup

---

## Next Steps (Phase 3: Authentication)

1. Implement Login Page UI
2. Integrate login form with backend
3. Add form validation with Zod
4. Add error toast notifications
5. Test full authentication flow

---

## Code Quality Standards

- ✅ **TypeScript**: Strict mode enabled
- ✅ **ESLint**: Code linting
- ✅ **Clean Architecture**: Separation of concerns
- ✅ **SOLID Principles**: Single responsibility per module
- ✅ **DRY**: No code duplication
- ✅ **Reusability**: Components and hooks designed for reuse

---

## Performance Optimizations

- Code splitting with React lazy loading (to be added)
- Memoization of expensive computations (to be added)
- Virtual scrolling for large lists (to be added)
- Image optimization (to be added)
- Bundle size optimization

---

## Security Measures

- ✅ JWT token in localStorage (not in cookies or URL)
- ✅ Automatic token expiration handling
- ✅ Protected routes with auth guards
- ✅ Axios interceptors for token refresh
- ✅ No sensitive data in component props

---

## Documentation Standards

All components include:
- JSDoc comments
- Type definitions
- Usage examples (where applicable)

---

**Architecture Status**: ✅ **Foundation Complete**

The frontend architecture is production-ready for feature development. All core infrastructure is in place:
- ✅ Routing
- ✅ Authentication
- ✅ API layer
- ✅ State management
- ✅ Layouts
- ✅ Design system
- ✅ Error handling

**Ready to proceed to Phase 3: Feature Implementation**
