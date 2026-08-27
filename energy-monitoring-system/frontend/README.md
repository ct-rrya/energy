# Energy Monitoring System - Frontend

React + TypeScript + Vite frontend for the Smart Footstep Energy Harvesting Monitoring System.

---

## 📋 Prerequisites

- Node.js v18 or higher
- npm or yarn
- Backend API running at http://localhost:3000

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update if needed:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### 3. Start Backend Server (in another terminal)

```bash
cd ../
npm run start:dev
```

### 4. Start Development Server

```bash
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## 🧪 Testing Backend Connectivity

Before proceeding, verify backend connection:

1. Start the backend server
2. Visit: **http://localhost:5173/health**
3. You should see: ✅ **Connected Successfully**

---

## 📁 Project Structure

```
src/
├── api/                # API client and services
├── components/         # Reusable UI components
├── features/           # Feature modules (auth, dashboard, sensors)
├── hooks/              # Custom React hooks
├── contexts/           # React contexts (Auth, Socket)
├── layouts/            # Page layouts
├── routes/             # Routing configuration
├── lib/                # Utilities and helpers
├── types/              # TypeScript definitions
└── styles/             # Global styles (Tailwind CSS v4)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🎨 Tech Stack

- **React 19** - UI library
- **TypeScript 6** - Type safety
- **Vite 8** - Build tool
- **Tailwind CSS v4** - Styling
- **React Router v7** - Routing
- **TanStack Query v5** - Server state management
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Recharts** - Charts
- **Lucide React** - Icons

---

## 🔐 Authentication

### Current Status

- ✅ Auth context configured
- ✅ Protected routes setup
- ✅ JWT interceptors configured
- ⏳ Login page (Phase 3)

### Login Flow (When Implemented)

1. User enters credentials on `/login`
2. POST to `/api/auth/login`
3. Backend returns JWT + user object
4. Token stored in localStorage
5. User redirected to `/dashboard`
6. All API calls include `Authorization: Bearer {token}`

---

## 🗺️ Routes

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ | Redirects to `/dashboard` |
| `/health` | ✅ | Backend connectivity test |
| `/login` | ⏳ | Login page (Phase 3) |
| `/dashboard` | ✅ | Main dashboard (protected) |
| `/sensors` | ⏳ | Sensor management (Phase 4) |
| `/energy` | ⏳ | Energy monitoring (Phase 5) |
| `/analytics` | ⏳ | Analytics dashboard (Phase 6) |
| `/reports` | ⏳ | Report generation (Phase 7) |
| `/404` | ✅ | Not found page |

---

## 🎨 Design System

### Color Palette

- **Primary (Deep Navy)**: `#0A2947` - Headers, primary actions
- **Secondary (Energy Green)**: `#22C55E` - Success, energy metrics
- **Accent (Amber)**: `#F59E0B` - Warnings, highlights
- **Neutral**: Gray scale for backgrounds and text

### Typography

- **Font**: Inter (Google Fonts)
- **Weights**: 300 (light) to 900 (black)

### Components

All components use Tailwind CSS v4 utility classes with custom theme tokens defined in `src/index.css`.

---

## 📦 Project Status

### ✅ Phase 1 & 2: Frontend Architecture (COMPLETED)

- ✅ Project setup with Vite + React + TypeScript
- ✅ Tailwind CSS v4 configuration
- ✅ Folder structure
- ✅ Routing configuration
- ✅ Auth context
- ✅ Protected routes
- ✅ API client with JWT interceptors
- ✅ API services (auth, sensors, health)
- ✅ Layout components (Auth, Dashboard)
- ✅ Global components (Loading, ErrorBoundary)
- ✅ TypeScript types
- ✅ Utility functions
- ✅ Design system
- ✅ Build verification

### 🔄 Phase 3: Authentication (NEXT)

- ⏳ Login page UI
- ⏳ Login form with React Hook Form
- ⏳ Form validation with Zod
- ⏳ Error toast notifications
- ⏳ Full authentication flow testing

---

## 🧩 API Integration

### Backend Endpoints

The frontend integrates with these backend endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/login` | POST | User login |
| `/api/users/profile` | GET | Get user profile |
| `/api/sensors` | GET | List sensors |
| `/api/sensors` | POST | Create sensor |
| `/api/sensors/:id` | GET | Get sensor |
| `/api/sensors/:id` | PATCH | Update sensor |
| `/api/sensors/:id` | DELETE | Delete sensor |

### API Services

All API calls go through service modules:

```typescript
import { authService, sensorService } from '@/api/services';

// Example: Login
const response = await authService.login({ email, password });

// Example: Get sensors
const sensors = await sensorService.getAll();
```

---

## 🔧 Development Guidelines

### Component Structure

```tsx
import type { ReactNode } from 'react';

interface MyComponentProps {
  children: ReactNode;
  title: string;
}

export function MyComponent({ children, title }: MyComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
}
```

### API Service Structure

```typescript
import apiClient from '../client';
import type { ApiResponse } from '@/types';

export const myService = {
  getAll: async (): Promise<ApiResponse<Item[]>> => {
    const response = await apiClient.get('/items');
    return response.data;
  },
};
```

### Custom Hook Structure

```typescript
import { useQuery } from '@tanstack/react-query';
import { myService } from '@/api/services';

export function useMyData() {
  return useQuery({
    queryKey: ['myData'],
    queryFn: myService.getAll,
  });
}
```

---

## 🐛 Troubleshooting

### Backend Connection Failed

**Problem**: Health check page shows ❌ Connection Failed

**Solution**:
1. Make sure backend is running: `npm run start:dev` (in backend directory)
2. Verify backend is accessible: http://localhost:3000/api/health
3. Check CORS configuration in backend

### Build Errors

**Problem**: TypeScript errors during build

**Solution**:
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear build cache: `rm -rf dist && npm run build`
3. Check TypeScript version: `npx tsc --version`

### Tailwind Styles Not Working

**Problem**: Tailwind classes don't apply

**Solution**:
1. Verify `@import "tailwindcss";` is at top of `src/index.css`
2. Check PostCSS config: `postcss.config.js` should use `@tailwindcss/postcss`
3. Restart dev server

---

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture documentation
- [Backend README](../README.md) - Backend documentation
- [API Standards](../API-STANDARDS.md) - API conventions

---

## 🤝 Contributing

This is an undergraduate capstone project. Development follows a structured phase-by-phase approach.

---

## 📄 License

Educational use only - Undergraduate Capstone Project

---

## 👨‍💻 Author

Undergraduate Capstone Project - Smart Footstep Energy Harvesting System

---

**Status**: ✅ **Phase 2 Complete - Ready for Phase 3**

The frontend foundation is production-ready. All architectural components are in place and verified. Ready to begin feature implementation.
