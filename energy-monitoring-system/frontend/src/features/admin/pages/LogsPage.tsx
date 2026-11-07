import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Clock,
  Check,
  ChevronDown,
  Copy,
  Shield,
} from 'lucide-react';
import { auditService, type AuditLogItem } from '@/api/services/audit.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Format timestamp into Manila date and time parts (Asia/Manila, UTC+8)
 */
function formatManilaDateParts(dateString: string): { datePart: string; timePart: string } {
  if (!dateString) return { datePart: '—', timePart: '' };
  try {
    const d = new Date(dateString);
    const datePart = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);
    return { datePart, timePart: `${timePart} PHT` };
  } catch {
    return { datePart: dateString, timePart: '' };
  }
}

/**
 * Human-readable event title formatter
 */
/**
 * Human-readable event title formatter matching EcoStep logs specification
 */
function formatEventTitle(log: AuditLogItem): string {
  const action = typeof log.action === 'string' ? log.action.toUpperCase() : '';
  const result = typeof log.result === 'string' ? log.result.toUpperCase() : '';

  if (action === 'LOGIN' && (result === 'FAILED' || result === 'FAILURE')) {
    return 'Sign-in attempt failed';
  }
  if (action === 'LOGIN') return 'Signed in';
  if (action === 'LOGOUT') return 'Signed out';
  if (action === 'SESSION_EXPIRED') return 'Session timed out';
  if (action === 'PAGE_VIEW') return 'Viewed a page';
  if (action === 'LIST_ADMINISTRATORS') return 'Listed administrators';
  if (action === 'CREATE_ADMIN_ACCOUNT') return 'Created administrator';
  if (action === 'DELETE_ADMIN_ACCOUNT') return 'Deleted administrator';
  if (action === 'RESET_ACCESS_CODE') return 'Reset access code';
  if (action === 'ACTIVATE_ADMIN_ACCOUNT') return 'Activated administrator';
  if (action === 'DEACTIVATE_ADMIN_ACCOUNT') return 'Deactivated administrator';
  if (action === 'GENERATE_REPORT' || action === 'REPORT_EXPORT' || action === 'EXPORT_REPORT') return 'Exported a report';
  if (action === 'EXPORT_CSV') return 'Exported CSV';
  if (action === 'UPDATE_MILESTONE_TARGETS') return 'Set milestone goal';
  if (action === 'LOCK_MILESTONE_TARGETS') return 'Locked milestone goal';
  if (action === 'COMPLETE_DAILY_DIAGNOSTIC' || action === 'RUN_DIAGNOSTIC_TEST') return 'Ran daily tile diagnostics';

  if (typeof log.event === 'string' && log.event.trim() !== '') {
    return log.event;
  }
  if (!action) return 'Audit Action';
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Normalized Category subtitle (e.g. PAGE_VIEW • Portal, LOGIN • Authentication)
 */
function formatCategorySubtitle(log: AuditLogItem): string {
  const act = typeof log.action === 'string' && log.action.trim() !== '' ? log.action.toUpperCase() : '';
  const cat = typeof log.category === 'string' && log.category.trim() !== '' ? log.category : '';
  const mod = typeof log.module === 'string' && log.module.trim() !== '' ? log.module : '';
  const mainCat = cat || mod || 'Authentication';

  if (act) {
    return `${act} • ${mainCat}`;
  }
  return mainCat;
}

/**
 * Custom Dark & Light Mode Select Dropdown Component
 * Completely replaces native OS selects to eliminate browser white popups in dark mode.
 */
interface CustomSelectOption {
  value: string;
  label: string;
  badge?: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  openUpward = false,
}: {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  openUpward?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative text-xs ${isOpen ? 'z-50' : 'z-10'} ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-full border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] hover:border-[#10B981]/50 focus:outline-hidden focus:ring-1 focus:ring-[#10B981] transition-all cursor-pointer font-medium"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder || 'Select...'}
        </span>
        <ChevronDown size={14} className={`text-[var(--mu,#87A993)] transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } py-1 z-[9999] rounded-2xl border border-[var(--line,rgba(255,255,255,0.18))] bg-[var(--panel,#12241A)] shadow-2xl shadow-black/90 max-h-56 overflow-y-auto`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#10B981]/15 text-[#10B981] font-semibold'
                    : 'text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.06))]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{option.label}</span>
                  {option.badge && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-[var(--soft,rgba(255,255,255,0.08))] text-[var(--mu,#87A993)]">
                      {option.badge}
                    </span>
                  )}
                </div>
                {isSelected && <Check size={13} className="text-[#10B981] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LogsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Strict role verification: Super Admin only
  if (user && user.role !== 'SUPER_ADMIN') {
    navigate('/dashboard');
    return null;
  }

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Authentication' | 'Reports' | 'Milestones' | 'Diagnostics'>('all');
  const [adminFilter, setAdminFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'SUCCESS' | 'FAILED' | 'DENIED'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Selected Log for Details Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close modal on Escape key and prevent background scroll
  useEffect(() => {
    if (!selectedLog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedLog(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedLog]);

  const handleCopyJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch administrator metadata for the admin dropdown & category counts
  const { data: metaData } = useQuery({
    queryKey: ['audit-meta'],
    queryFn: () => auditService.getMetadata(),
    staleTime: 60 * 1000,
  });

  // Calculate start & end ISO strings based on date range
  const { startDateISO, endDateISO } = useMemo(() => {
    const now = new Date();
    if (dateRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return { startDateISO: today.toISOString(), endDateISO: now.toISOString() };
    }
    if (dateRange === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDateISO: sevenDaysAgo.toISOString(), endDateISO: now.toISOString() };
    }
    if (dateRange === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDateISO: thirtyDaysAgo.toISOString(), endDateISO: now.toISOString() };
    }
    if (dateRange === 'custom') {
      return {
        startDateISO: customStartDate ? new Date(customStartDate).toISOString() : undefined,
        endDateISO: customEndDate ? new Date(customEndDate).toISOString() : undefined,
      };
    }
    return { startDateISO: undefined, endDateISO: undefined };
  }, [dateRange, customStartDate, customEndDate]);

  // Main Audit Logs Query
  const { data, refetch, isFetching, isLoading } = useQuery({
    queryKey: [
      'audit-logs',
      page,
      pageSize,
      searchTerm,
      adminFilter,
      categoryFilter,
      resultFilter,
      startDateISO,
      endDateISO,
    ],
    queryFn: () =>
      auditService.getLogs({
        limit: pageSize,
        skip: (page - 1) * pageSize,
        search: searchTerm || undefined,
        administratorId: adminFilter !== 'all' ? adminFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        result: resultFilter !== 'all' ? resultFilter : undefined,
        startDate: startDateISO,
        endDate: endDateISO,
      }),
    refetchOnWindowFocus: false,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Category counts from server
  const counts = data?.counts || metaData?.counts || {
    all: total,
    authentication: 0,
    reports: 0,
    milestones: 0,
    diagnostics: 0,
  };

  // Handle Export CSV (strictly without IP address)
  const handleExportCSV = useCallback(async () => {
    try {
      setIsExporting(true);
      const blob = await auditService.exportCsv({
        search: searchTerm || undefined,
        administratorId: adminFilter !== 'all' ? adminFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        result: resultFilter !== 'all' ? resultFilter : undefined,
        startDate: startDateISO,
        endDate: endDateISO,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ecostep-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export audit logs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [searchTerm, adminFilter, categoryFilter, resultFilter, startDateISO, endDateISO]);

  // Administrator Options for custom select (strictly deduplicated by identity)
  const adminOptions: CustomSelectOption[] = useMemo(() => {
    const list: CustomSelectOption[] = [{ value: 'all', label: 'All Administrators' }];
    const seen = new Set<string>();

    if (metaData?.administrators) {
      metaData.administrators.forEach((a) => {
        const id = a.administratorId || a.id;
        const role = (a.administratorRole || a.role || 'ADMIN').trim();
        const rawName = (a.administratorName || a.name || 'Administrator').trim();
        const name = role === 'SUPER_ADMIN' ? 'Ecostep Super' : rawName;
        const key = `${name.toLowerCase()}::${role.toUpperCase()}`;
        if (id && !seen.has(key)) {
          seen.add(key);
          list.push({
            value: id,
            label: name,
            badge: role === 'SUPER_ADMIN' ? 'SUPER' : 'ADMIN',
          });
        }
      });
    }

    // Fallback: also include administrators present in the currently loaded logs if not already listed
    logs.forEach((l) => {
      const id = l.administratorId;
      const role = (l.administratorRole || 'ADMIN').trim();
      const rawName = (l.administratorName || '').trim();
      const name = role === 'SUPER_ADMIN' ? 'Ecostep Super' : rawName;
      if (id && name) {
        const key = `${name.toLowerCase()}::${role.toUpperCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            value: id,
            label: name,
            badge: role === 'SUPER_ADMIN' ? 'SUPER' : 'ADMIN',
          });
        }
      }
    });

    return list;
  }, [metaData, logs]);

  // Result Options
  const resultOptions: CustomSelectOption[] = [
    { value: 'all', label: 'All Results' },
    { value: 'SUCCESS', label: 'Success' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'DENIED', label: 'Denied' },
  ];

  // Date Range Options
  const dateOptions: CustomSelectOption[] = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Past 7 Days' },
    { value: '30days', label: 'Past 30 Days' },
    { value: 'custom', label: 'Custom Range' },
  ];

  return (
    <div
      className="page flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1450px] mx-auto w-full"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header matching screenshot */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--t,#E4F7EA)]">
            Logs
          </h1>
          <p className="text-xs sm:text-sm text-[var(--mu,#87A993)] mt-1 max-w-2xl">
            A permanent record of administrator sign-ins, report exports, milestone goal changes and daily tile diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.06))] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-white transition-opacity cursor-pointer shadow-xs disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            <Download size={13} strokeWidth={2.4} className={isExporting ? 'animate-bounce' : ''} />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Timezone Context Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl border border-[var(--line,rgba(255,255,255,0.08))] bg-[var(--panel,#12241A)] text-xs text-[var(--mu,#87A993)]">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[#10B981]" />
          <span>
            All times are shown in <strong className="text-[var(--t,#E4F7EA)]">Asia/Manila (PHT, UTC+8)</strong>
          </span>
        </div>
        <div className="flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/15 text-amber-500 border border-amber-400/25">
          Viewing as super admin
        </div>
      </div>

      {/* Category Pills Selector Row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('all');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] border border-[var(--line,rgba(255,255,255,0.1))] hover:border-[#10B981]/40'
            }`}
          >
            <span>All activity</span>
            <span className="font-bold">{counts.all ?? total}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('Authentication');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              categoryFilter === 'Authentication'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] border border-[var(--line,rgba(255,255,255,0.1))] hover:border-[#10B981]/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Authentication</span>
            <span className="font-bold">{counts.authentication}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('Reports');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              categoryFilter === 'Reports'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] border border-[var(--line,rgba(255,255,255,0.1))] hover:border-[#10B981]/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Reports</span>
            <span className="font-bold">{counts.reports}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('Milestones');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              categoryFilter === 'Milestones'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] border border-[var(--line,rgba(255,255,255,0.1))] hover:border-[#10B981]/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>Milestones</span>
            <span className="font-bold">{counts.milestones}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryFilter('Diagnostics');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              categoryFilter === 'Diagnostics'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] border border-[var(--line,rgba(255,255,255,0.1))] hover:border-[#10B981]/40'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Diagnostics</span>
            <span className="font-bold">{counts.diagnostics}</span>
          </button>
        </div>

        <div className="text-xs text-[var(--mu,#87A993)] pt-1">
          Showing <strong className="text-[var(--t,#E4F7EA)]">{logs.length}</strong> of{' '}
          <strong className="text-[var(--t,#E4F7EA)]">{total}</strong> records · all administrators
        </div>
      </div>

      {/* Filter Bar with z-30 stacking context so popups float over the table */}
      <div className="relative z-30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mu,#87A993)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search administrator, event or target"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-full border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] placeholder:text-[var(--mu,#87A993)]/60 focus:outline-hidden focus:ring-1 focus:ring-[#10B981]"
          />
        </div>

        <CustomSelect
          value={adminFilter}
          onChange={(val) => {
            setAdminFilter(val);
            setPage(1);
          }}
          options={adminOptions}
          placeholder="All administrators"
        />

        <CustomSelect
          value={resultFilter}
          onChange={(val) => {
            setResultFilter(val as any);
            setPage(1);
          }}
          options={resultOptions}
          placeholder="All results"
        />

        <CustomSelect
          value={dateRange}
          onChange={(val) => {
            setDateRange(val as any);
            setPage(1);
          }}
          options={dateOptions}
          placeholder="All time"
        />
      </div>

      {/* Custom Date Pickers when 'custom' is active */}
      {dateRange === 'custom' && (
        <div className="relative z-20 flex items-center gap-3 p-3 rounded-2xl border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[var(--mu,#87A993)]">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-[var(--line,rgba(255,255,255,0.15))] bg-[var(--soft,rgba(255,255,255,0.04))] text-[var(--t,#E4F7EA)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--mu,#87A993)]">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => {
                setCustomEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded-lg border border-[var(--line,rgba(255,255,255,0.15))] bg-[var(--soft,rgba(255,255,255,0.04))] text-[var(--t,#E4F7EA)]"
            />
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="relative z-0 rounded-2xl border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-xs text-[var(--mu,#87A993)]">
            <RefreshCw size={20} className="animate-spin text-[#10B981]" />
            <span>Loading audit records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--mu,#87A993)]">
            No audit records match your current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--line,rgba(255,255,255,0.1))] text-[11px] font-bold uppercase tracking-wider text-[var(--mu,#87A993)] bg-[var(--soft,rgba(255,255,255,0.02))]">
                  <th className="py-3.5 px-5 whitespace-nowrap">When (PHT)</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Administrator</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Event</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Result</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line,rgba(255,255,255,0.08))]">
                {logs.map((log) => {
                  const normalizedResult = (log.result || '').toUpperCase();
                  const isSuccess = normalizedResult === 'SUCCESS';
                  const isFailed = normalizedResult === 'FAILED' || normalizedResult === 'FAILURE' || normalizedResult === 'DENIED';

                  const { datePart, timePart } = formatManilaDateParts(log.timestamp);
                  const eventTitle = formatEventTitle(log);
                  const categorySubtitle = formatCategorySubtitle(log);

                  const isSuper = log.administratorRole === 'SUPER_ADMIN';
                  const adminDisplayName = isSuper ? 'Ecostep Super' : (log.administratorName || 'Unknown Admin');
                  const initial = (adminDisplayName?.[0] || 'E').toUpperCase();

                  return (
                    <tr
                      key={log.id || (log as any)._id}
                      onClick={() => setSelectedLog(log)}
                      className={`transition-colors cursor-pointer group ${
                        isFailed
                          ? 'bg-rose-500/5 hover:bg-rose-500/10'
                          : 'hover:bg-[var(--soft,rgba(255,255,255,0.04))]'
                      }`}
                    >
                      {/* When (PHT) */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="font-semibold text-[var(--t,#E4F7EA)]">{datePart}</div>
                        <div className="text-[11px] text-[var(--mu,#87A993)]">{timePart}</div>
                      </td>

                      {/* Administrator */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSuper
                                ? 'bg-amber-400/20 text-amber-500 border border-amber-400/30'
                                : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                            }`}
                          >
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--t,#E4F7EA)]">
                              {adminDisplayName}
                            </div>
                            <div className="text-[11px] text-[var(--mu,#87A993)]">
                              {isSuper ? 'Super admin' : 'System admin'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Event */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="font-semibold text-[var(--t,#E4F7EA)]">
                          {eventTitle}
                        </div>
                        <div className="text-[11px] text-[var(--mu,#87A993)]">
                          {categorySubtitle}
                        </div>
                      </td>

                      {/* Result */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            isSuccess
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                              : 'bg-rose-500/15 text-rose-500 border border-rose-500/25'
                          }`}
                        >
                          {isSuccess ? <Check size={11} strokeWidth={2.5} /> : <X size={11} strokeWidth={2.5} />}
                          <span>{isSuccess ? 'Success' : 'Failed'}</span>
                        </span>
                      </td>

                      {/* Details View Button */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-[var(--line,rgba(255,255,255,0.15))] bg-[var(--soft,rgba(255,255,255,0.03))] text-[var(--t,#E4F7EA)] hover:border-[#10B981] hover:text-[#10B981] transition-colors cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--soft,rgba(255,255,255,0.02))] gap-3 text-xs text-[var(--mu,#87A993)]">
          <div>
            Showing <strong className="text-[var(--t,#E4F7EA)]">{total === 0 ? 0 : (page - 1) * pageSize + 1}</strong>–<strong className="text-[var(--t,#E4F7EA)]">{Math.min(page * pageSize, total)}</strong> of{' '}
            <strong className="text-[var(--t,#E4F7EA)]">{total}</strong>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-[var(--line,rgba(255,255,255,0.15))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] disabled:opacity-40 hover:bg-[var(--soft,rgba(255,255,255,0.08))] cursor-pointer"
            >
              <ChevronLeft size={14} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pageNum = page - 2 + i;
                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
              }
              const isActive = page === pageNum;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setPage(pageNum)}
                  className={`min-w-[28px] h-7 px-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#10B981] text-white shadow-xs'
                      : 'text-[var(--mu,#87A993)] hover:text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.08))]'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && page < totalPages - 2 && (
              <>
                <span className="px-1 text-[var(--mu,#87A993)]">…</span>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  className="min-w-[28px] h-7 px-2 rounded-full text-xs font-bold text-[var(--mu,#87A993)] hover:text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.08))] cursor-pointer"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-[var(--line,rgba(255,255,255,0.15))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] disabled:opacity-40 hover:bg-[var(--soft,rgba(255,255,255,0.08))] cursor-pointer"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] overflow-y-auto bg-black/80 backdrop-blur-sm p-4 sm:p-6"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
          onClick={() => setSelectedLog(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="min-h-full flex items-center justify-center">
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl my-8 rounded-2xl border border-[var(--line,rgba(255,255,255,0.12))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] shadow-2xl overflow-hidden flex flex-col"
            >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-5 border-b border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--soft,rgba(255,255,255,0.02))] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
                  {formatCategorySubtitle(selectedLog)}
                </span>
                <h3 className="font-bold text-sm text-[var(--t,#E4F7EA)]">Audit Event Details</h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedLog.result?.toUpperCase() === 'SUCCESS'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : selectedLog.result?.toUpperCase() === 'DENIED'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                  }`}
                >
                  {selectedLog.result?.toUpperCase() || 'SUCCESS'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-[var(--mu,#87A993)] hover:text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.08))] transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Event Title Banner */}
              <div className="p-3.5 rounded-xl bg-[var(--soft,rgba(255,255,255,0.03))] border border-[var(--line,rgba(255,255,255,0.08))]">
                <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--mu,#87A993)]">Event Action</div>
                <div className="font-bold text-base text-[var(--t,#E4F7EA)] mt-0.5">
                  {formatEventTitle(selectedLog)}
                </div>
              </div>

              {/* Who & When Overview Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--soft,rgba(255,255,255,0.03))] border border-[var(--line,rgba(255,255,255,0.08))]">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--mu,#87A993)]">
                    <Clock size={12} className="text-[#10B981]" />
                    <span>When Performed</span>
                  </div>
                  <div className="font-medium text-xs text-[var(--t,#E4F7EA)] mt-1">
                    {formatManilaDateParts(selectedLog.timestamp).datePart}
                  </div>
                  <div className="text-[11px] text-[var(--mu,#87A993)]">
                    {formatManilaDateParts(selectedLog.timestamp).timePart}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--soft,rgba(255,255,255,0.03))] border border-[var(--line,rgba(255,255,255,0.08))]">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--mu,#87A993)]">
                    <Shield size={12} className="text-[#10B981]" />
                    <span>Who Performed</span>
                  </div>
                  <div className="font-semibold text-xs text-[var(--t,#E4F7EA)] mt-1">
                    {selectedLog.administratorRole === 'SUPER_ADMIN'
                      ? 'Ecostep Super'
                      : (selectedLog.administratorName || 'Unknown Admin')}
                  </div>
                  <div className="text-[10px] font-bold text-[#10B981] uppercase">
                    {selectedLog.administratorRole || 'ADMIN'}
                  </div>
                </div>
              </div>

              {/* Failure Reason Banner */}
              {selectedLog.failureReason && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  <div className="font-bold text-[11px] mb-0.5 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="text-rose-400" />
                    <span>Failure Reason:</span>
                  </div>
                  <div className="text-xs">{selectedLog.failureReason}</div>
                </div>
              )}

              {/* Contextual Operation Details */}
              {(() => {
                const details = selectedLog.details && typeof selectedLog.details === 'object' && !Array.isArray(selectedLog.details)
                  ? selectedLog.details
                  : null;

                if (!details || Object.keys(details).length === 0) return null;

                const weeklyTargetsEntries = details.weeklyTargets && typeof details.weeklyTargets === 'object' && !Array.isArray(details.weeklyTargets)
                  ? Object.entries(details.weeklyTargets)
                  : null;

                return (
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--mu,#87A993)]">
                      Operation Details
                    </span>

                    <div className="p-3.5 rounded-xl bg-[var(--soft,rgba(255,255,255,0.03))] border border-[var(--line,rgba(255,255,255,0.08))] space-y-2.5">
                      {/* Milestone Target Month */}
                      {details.month && (
                        <div className="flex items-center justify-between py-1 border-b border-[var(--line,rgba(255,255,255,0.08))]">
                          <span className="text-[var(--mu,#87A993)]">Target Month:</span>
                          <span className="font-semibold text-[var(--t,#E4F7EA)] bg-[var(--soft,rgba(255,255,255,0.08))] px-2 py-0.5 rounded">
                            {String(details.month)}
                          </span>
                        </div>
                      )}

                      {/* Milestone Before & After values */}
                      {(details.oldValue !== undefined || details.newValue !== undefined) && (
                        <div className="p-2.5 rounded-lg bg-[var(--soft,rgba(255,255,255,0.02))] border border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-[var(--mu,#87A993)]">Previous Target</div>
                            <div className="font-medium text-[var(--mu,#87A993)]">
                              {details.oldValue !== undefined && details.oldValue !== null ? String(details.oldValue) : 'None'}
                            </div>
                          </div>
                          <div className="text-xs font-bold text-[#10B981]">→</div>
                          <div className="text-right">
                            <div className="text-[10px] text-[var(--mu,#87A993)]">New Target</div>
                            <div className="font-bold text-sm text-[#10B981]">
                              {String(details.newValue)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Report Specific Display */}
                      {details.reportName && (
                        <div className="flex items-start justify-between py-1 border-b border-[var(--line,rgba(255,255,255,0.08))] gap-2">
                          <span className="text-[var(--mu,#87A993)] shrink-0">Report File:</span>
                          <span className="text-xs text-[var(--t,#E4F7EA)] font-medium text-right break-all">
                            {String(details.reportName)}
                          </span>
                        </div>
                      )}
                      {details.format && (
                        <div className="flex items-center justify-between py-1 border-b border-[var(--line,rgba(255,255,255,0.08))]">
                          <span className="text-[var(--mu,#87A993)]">Format:</span>
                          <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                            {String(details.format)}
                          </span>
                        </div>
                      )}
                      {details.dateRange && (
                        <div className="flex items-center justify-between py-1 border-b border-[var(--line,rgba(255,255,255,0.08))]">
                          <span className="text-[var(--mu,#87A993)]">Date Range:</span>
                          <span className="text-[var(--t,#E4F7EA)] font-medium">{String(details.dateRange)}</span>
                        </div>
                      )}

                      {/* Diagnostics Specific Display */}
                      {details.tilesChecked !== undefined && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="p-2 rounded bg-[var(--soft,rgba(255,255,255,0.02))] border border-[var(--line,rgba(255,255,255,0.08))]">
                            <span className="text-[10px] text-[var(--mu,#87A993)]">Tiles Checked</span>
                            <div className="text-sm font-bold text-[var(--t,#E4F7EA)]">
                              {String(details.tilesChecked)}
                            </div>
                          </div>
                          <div className="p-2 rounded bg-[var(--soft,rgba(255,255,255,0.02))] border border-[var(--line,rgba(255,255,255,0.08))]">
                            <span className="text-[10px] text-[var(--mu,#87A993)]">Flagged Tiles</span>
                            <div className={`text-sm font-bold ${Number(details.flaggedTiles) > 0 ? 'text-rose-400' : 'text-[#10B981]'}`}>
                              {String(details.flaggedTiles ?? 0)}
                            </div>
                          </div>
                        </div>
                      )}
                      {details.result && typeof details.result === 'string' && (
                        <div className="flex items-center justify-between py-1 border-b border-[var(--line,rgba(255,255,255,0.08))]">
                          <span className="text-[var(--mu,#87A993)]">Verdict:</span>
                          <span className="font-semibold text-[var(--t,#E4F7EA)]">{details.result}</span>
                        </div>
                      )}
                      {details.actualEnergyWh !== undefined && (
                        <div className="flex items-center justify-between py-1 border-b border-[var(--line,rgba(255,255,255,0.08))]">
                          <span className="text-[var(--mu,#87A993)]">Energy Output:</span>
                          <span className="font-bold text-[#10B981]">{String(details.actualEnergyWh)} Wh</span>
                        </div>
                      )}
                      {details.performancePercentage !== undefined && (
                        <div className="flex items-center justify-between py-1 border-b border-[var(--line,rgba(255,255,255,0.08))]">
                          <span className="text-[var(--mu,#87A993)]">Performance:</span>
                          <span className="font-bold text-[#10B981]">{String(details.performancePercentage)}%</span>
                        </div>
                      )}

                      {/* Authentication Specific Display */}
                      {details.method && (
                        <div className="flex items-center justify-between py-1 border-b border-[var(--line,rgba(255,255,255,0.08))]">
                          <span className="text-[var(--mu,#87A993)]">Auth Method:</span>
                          <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-[var(--soft,rgba(255,255,255,0.08))] text-[var(--t,#E4F7EA)]">
                            {String(details.method)}
                          </span>
                        </div>
                      )}
                      {details.reason && (
                        <div className="flex items-center justify-between py-1 border-b border-[var(--line,rgba(255,255,255,0.08))]">
                          <span className="text-[var(--mu,#87A993)]">Session Reason:</span>
                          <span className="text-xs text-[var(--t,#E4F7EA)] font-medium">{String(details.reason)}</span>
                        </div>
                      )}

                      {/* Weekly Targets Breakdown */}
                      {weeklyTargetsEntries && weeklyTargetsEntries.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] uppercase font-bold text-[var(--mu,#87A993)] block mb-1.5">
                            Weekly Targets Breakdown:
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {weeklyTargetsEntries.map(([week, val]) => (
                              <div key={week} className="p-1.5 rounded bg-[var(--soft,rgba(255,255,255,0.02))] border border-[var(--line,rgba(255,255,255,0.08))] text-center">
                                <span className="text-[10px] text-[var(--mu,#87A993)] block uppercase">{week}</span>
                                <span className="text-[11px] font-bold text-[#10B981]">{String(val)} mWh</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Toggle raw JSON inspection with copy button */}
                      <div className="pt-2 border-t border-[var(--line,rgba(255,255,255,0.08))] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowRawJson((prev) => !prev)}
                          className="text-[11px] text-[var(--mu,#87A993)] hover:text-[#10B981] underline cursor-pointer"
                        >
                          {showRawJson ? 'Hide raw JSON audit metadata' : 'View raw JSON metadata'}
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyJson}
                          className="inline-flex items-center gap-1 text-[11px] text-[var(--mu,#87A993)] hover:text-[#10B981] px-2 py-1 rounded hover:bg-[var(--soft,rgba(255,255,255,0.06))] transition-colors cursor-pointer"
                        >
                          {copied ? <Check size={12} className="text-[#10B981]" /> : <Copy size={12} />}
                          <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                        </button>
                      </div>

                      {showRawJson && (
                        <pre className="mt-2 p-3 rounded-xl bg-[var(--soft,rgba(255,255,255,0.04))] text-[var(--mu,#87A993)] font-mono text-[10px] overflow-x-auto border border-[var(--line,rgba(255,255,255,0.1))]">
                          {JSON.stringify(selectedLog, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-5 border-t border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--soft,rgba(255,255,255,0.02))] flex items-center justify-between shrink-0">
              <span className="text-[10px] text-[var(--mu,#87A993)] truncate max-w-[280px]">
                Event ID: {selectedLog.id || (selectedLog as any)._id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-1.5 rounded-full text-xs font-bold bg-[#10B981] hover:bg-[#059669] text-white transition-opacity cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    )}
    </div>
  );
}
