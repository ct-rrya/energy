# Frontend Quick Start Guide

## 🚀 Get Running in 3 Minutes

### 1. Install & Start (First Time)

```bash
# Install dependencies
npm install

# Start backend (in separate terminal)
cd ..
npm run start:dev

# Start frontend (back in frontend directory)
cd frontend
npm run dev
```

**Frontend**: http://localhost:5173
**Backend**: http://localhost:3000

### 2. Test Connection

Visit: http://localhost:5173/health

You should see: ✅ **Connected Successfully**

---

## 📂 Where to Find Things

| What | Where |
|------|-------|
| **Add new page** | `src/features/{feature}/pages/` |
| **Add new component** | `src/components/common/` |
| **Add new API call** | `src/api/services/` |
| **Add new route** | `src/routes/index.tsx` |
| **Add new type** | `src/types/` |
| **Update styles** | `src/index.css` (Tailwind v4) |

---

## 🎯 Common Tasks

### Create a New Page

1. Create file in `src/features/{feature}/pages/MyPage.tsx`
2. Add route in `src/routes/index.tsx`
3. Add to sidebar in `src/layouts/DashboardLayout.tsx`

Example:
```tsx
// src/features/myfeature/pages/MyPage.tsx
export function MyPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-primary-500">My Page</h1>
    </div>
  );
}
```

### Make an API Call

1. Add endpoint to `src/api/constants.ts`
2. Create service function in `src/api/services/`
3. Use TanStack Query in component

Example:
```tsx
import { useQuery } from '@tanstack/react-query';
import { myService } from '@/api/services';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['myData'],
    queryFn: myService.getData,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.message}</div>;
}
```

### Add a New Type

```tsx
// src/types/myfeature.types.ts
export interface MyEntity {
  _id: string;
  name: string;
  createdAt: string;
}

// Export in src/types/index.ts
export * from './myfeature.types';
```

---

## 🔑 Key Concepts

### Authentication

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Route

```tsx
// Wrap any route that requires authentication
<Route
  path="/protected"
  element={
    <ProtectedRoute>
      <MyProtectedPage />
    </ProtectedRoute>
  }
/>
```

### API Service

```tsx
// src/api/services/my.service.ts
import apiClient from '../client';
import type { ApiResponse, MyEntity } from '@/types';

export const myService = {
  getAll: async (): Promise<ApiResponse<MyEntity[]>> => {
    const response = await apiClient.get('/my-endpoint');
    return response.data;
  },
};
```

### TanStack Query

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query (GET)
const { data } = useQuery({
  queryKey: ['items'],
  queryFn: itemService.getAll,
});

// Mutation (POST/PATCH/DELETE)
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: itemService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
  },
});
```

---

## 🎨 Styling (Tailwind CSS v4)

### Colors

```tsx
// Primary (Deep Navy)
<div className="bg-primary-500 text-white">

// Secondary (Energy Green)
<div className="bg-secondary-500 text-white">

// Accent (Amber)
<div className="bg-accent-500 text-white">

// Neutral
<div className="bg-neutral-100 text-neutral-900">
```

### Common Patterns

```tsx
// Card
<div className="rounded-card bg-white p-6 shadow-card">

// Button
<button className="rounded-lg bg-primary-500 px-6 py-2 font-medium text-white hover:bg-primary-600">

// Input
<input className="w-full rounded-lg border border-neutral-200 px-4 py-2 focus:border-primary-500 focus:outline-none">
```

---

## 🛠️ Development Commands

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 🐛 Troubleshooting

### "Cannot find module '@/...'"

**Fix**: Restart dev server after changing imports

### Backend connection failed

**Fix**: Make sure backend is running at http://localhost:3000

```bash
cd ..
npm run start:dev
```

### Tailwind classes not working

**Fix**: Make sure `@import "tailwindcss";` is at top of `src/index.css`

### TypeScript errors

**Fix**: Check `tsconfig.app.json` and restart VS Code

---

## 📁 Project Structure Cheat Sheet

```
src/
├── api/              → API calls (Axios + services)
├── components/       → Reusable UI components
├── features/         → Feature modules (auth, dashboard, sensors)
├── contexts/         → React contexts (Auth, Socket)
├── layouts/          → Page layouts (Auth, Dashboard)
├── routes/           → Routing configuration
├── lib/              → Utilities (cn, formatters)
├── types/            → TypeScript types
└── index.css         → Tailwind v4 config
```

---

## 🔗 Useful Links

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/overview)
- [React Router](https://reactrouter.com/en/main)

---

## 💡 Pro Tips

1. **Use path aliases**: Import with `@/` instead of `../../../`
2. **Keep components small**: One responsibility per component
3. **Extract custom hooks**: Reuse logic across components
4. **Use TypeScript**: Let the compiler catch bugs
5. **Follow the architecture**: Look at existing files for patterns

---

**Need help?** Check [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed docs.

**Ready to build!** 🚀
