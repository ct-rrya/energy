import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { auditService } from '@/api/services/audit.service';

const ROUTE_PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'EcoStep Central Dashboard',
  '/central': 'EcoStep Central Dashboard',
  '/analytics': 'Historical Analytics & Trends',
  '/milestones': 'Energy Milestones',
  '/energy': 'Energy Monitoring',
  '/reports': 'Reports & Ledger',
  '/admin/diagnostics': 'Hardware Diagnostics & Calibration',
  '/settings': 'System Settings & Hardware Pairing',
  '/admin-management': 'Administrator Management',
  '/admin/logs': 'Super Admin Audit Logs',
  '/sensors/monitoring': 'Sensor Monitoring',
  '/alerts': 'System Alerts',
  '/profile': 'Admin Profile',
};

export function useAuditPageView() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const lastLoggedPathRef = useRef<string | null>(null);
  const lastLoggedTimeRef = useRef<number>(0);

  useEffect(() => {
    // Only log page views for authenticated administrators
    if (!isAuthenticated || !user) return;
    const role = user.role;
    if (role !== 'SUPER_ADMIN' && role !== 'SYSTEM_ADMIN' && role !== 'admin') return;

    const path = location.pathname;
    const now = Date.now();

    // Debounce duplicate tracking within 10 seconds for same path
    if (lastLoggedPathRef.current === path && now - lastLoggedTimeRef.current < 10000) {
      return;
    }

    lastLoggedPathRef.current = path;
    lastLoggedTimeRef.current = now;

    const pageName = ROUTE_PAGE_NAMES[path] || `Page: ${path}`;
    auditService.recordPageView(pageName, path).catch(() => {
      // Non-blocking
    });
  }, [location.pathname, isAuthenticated, user]);
}

