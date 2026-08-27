import type { ReactNode } from 'react';

/**
 * Auth Layout Props
 */
interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Auth Layout Component
 * Split-screen layout for authentication pages
 * Left: Branding and mission | Right: Authentication form
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {children}
    </div>
  );
}
