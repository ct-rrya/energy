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
  SlidersHorizontal,
} from 'lucide-react';
import { auditService, type AuditLogItem } from '@/api/services/audit.service';
import {
  HourRangeSelector,
  type HourRange,
} from '@/components/common/HourRangeSelector';
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

  // Admin-only verification (any authenticated admin may view audit logs)
  if (!user) {
    navigate('/dashboard');
    return null;
  }

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Authentication' | 'Reports' | 'Milestones' | 'Diagnostics'>('all');
  const [resultFilter, setResultFilter] = useState<'all' | 'SUCCESS' | 'FAILED' | 'DENIED'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'hourly' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [hourRange, setHourRange] = useState<HourRange | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const activeExtraFilterCount =
    (resultFilter !== 'all' ? 1 : 0) +
    (dateRange !== 'all' ? 1 : 0) +
    (hourRange ? 1 : 0);

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
    if (dateRange === 'hourly') {
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      return { startDateISO: oneHourAgo.toISOString(), endDateISO: now.toISOString() };
    }
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
      categoryFilter,
      resultFilter,
      startDateISO,
      endDateISO,
      hourRange?.startHour ?? 'all',
      hourRange?.endHour ?? 'all',
    ],
    queryFn: () =>
      auditService.getLogs({
        limit: pageSize,
        skip: (page - 1) * pageSize,
        search: searchTerm || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        result: resultFilter !== 'all' ? resultFilter : undefined,
        startDate: startDateISO,
        endDate: endDateISO,
        ...(hourRange
          ? { startHour: hourRange.startHour, endHour: hourRange.endHour }
          : {}),
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
  }, [searchTerm, categoryFilter, resultFilter, startDateISO, endDateISO]);

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
    { value: 'hourly', label: 'Past Hour (Hourly)' },
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
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--t,#E4F7EA)]">
            Logs
          </h1>
          <p className="text-xs sm:text-sm text-[var(--mu,#87A993)] mt-1 max-w-2xl">
            Permanent record of administrator sign-ins, report exports, milestone changes, and tile diagnostics · All times in <strong className="text-[var(--t)]">Asia/Manila (PHT)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh logs"
            title="Refresh logs"
            className="inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full sm:rounded-lg text-xs font-semibold border border-[var(--line)] bg-transparent text-[var(--t)] hover:bg-[var(--soft)] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            aria-label="Export CSV"
            title="Export CSV"
            className="inline-flex items-center justify-center gap-1.5 w-9 h-9 sm:w-auto sm:h-auto sm:px-3.5 sm:py-1.5 rounded-full sm:rounded-lg text-xs font-bold bg-[#19D46A] hover:opacity-90 text-[#0D1B14] transition-opacity cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            <Download size={14} strokeWidth={2.4} className={isExporting ? 'animate-bounce' : ''} />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Connected Record-Folder Tabs + Neutral Sheet */}
      <div>
        <div className="flex items-end justify-between gap-3">
          <div
            className="flex flex-nowrap overflow-x-auto items-end gap-1 max-w-full no-scrollbar"
            role="tablist"
            aria-label="Log categories"
          >
            {(
              [
                { id: 'all', label: 'All Activity', count: counts.all ?? total },
                { id: 'Authentication', label: 'Authentication', count: counts.authentication },
                { id: 'Reports', label: 'Reports', count: counts.reports },
                { id: 'Milestones', label: 'Milestones', count: counts.milestones },
                { id: 'Diagnostics', label: 'Diagnostics', count: counts.diagnostics },
              ] as const
            ).map((tab) => {
              const isActive = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setCategoryFilter(tab.id);
                    setPage(1);
                  }}
                  className={`relative px-3 sm:px-3.5 py-2 text-xs font-semibold rounded-t-xl border-t border-x transition-all cursor-pointer whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[var(--card-bg)] text-[var(--t)] border-[var(--line)] -mb-px z-10 pb-2.5'
                      : 'bg-transparent text-[var(--mu)] border-transparent hover:text-[var(--t)] hover:bg-[var(--card-bg)]/50'
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute top-0 left-3 right-3 h-[2.5px] rounded-b-full bg-[var(--acc)]"
                      aria-hidden="true"
                    />
                  )}
                  <span>{tab.label}</span>
                  <span className="text-[11px] opacity-75 tabular-nums">{tab.count}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:block text-xs text-[var(--mu)] mb-1.5 shrink-0">
            Showing <strong className="text-[var(--t)]">{logs.length}</strong> of{' '}
            <strong className="text-[var(--t)]">{total}</strong> records
          </div>
        </div>

        {/* Folder Sheet: Filter Bar + Direct Table */}
        <section className="rounded-b-2xl rounded-tr-2xl border border-[var(--line)] bg-[var(--card-bg)] overflow-hidden">
          {/* Flush Filter Bar (compact collapsible drawer on mobile, 4-col inline on desktop) */}
          <div className="relative z-30 p-3 sm:px-5 sm:py-3.5 border-b border-[var(--line)] flex flex-col md:grid md:grid-cols-4 gap-2.5 md:items-center">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mu)]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search event, admin, target..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--line)] bg-transparent text-[var(--t)] placeholder:text-[var(--mu)]/70 focus:outline-none focus:border-[var(--acc)]"
                />
              </div>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen((prev) => !prev)}
                aria-expanded={mobileFiltersOpen}
                className={`md:hidden inline-flex items-center gap-1.5 h-[32px] px-2.5 rounded-lg border text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                  mobileFiltersOpen || activeExtraFilterCount > 0
                    ? 'border-[var(--acc)] text-[var(--acc)] bg-[var(--acc)]/10'
                    : 'border-[var(--line)] text-[var(--mu)]'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>Filters</span>
                {activeExtraFilterCount > 0 && (
                  <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[var(--acc)] text-[#04210f] text-[10px] font-bold inline-flex items-center justify-center">
                    {activeExtraFilterCount}
                  </span>
                )}
              </button>
            </div>

            <div className={`${mobileFiltersOpen ? 'grid' : 'hidden'} md:contents grid-cols-2 gap-2`}>
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

              <div className="col-span-2 md:col-span-1">
                <HourRangeSelector
                  value={hourRange}
                  onChange={(next) => {
                    setHourRange(next);
                    setPage(1);
                  }}
                  label="Hours"
                />
              </div>
            </div>
          </div>

          {/* Custom Date Pickers when 'custom' is active */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-3 px-5 py-2.5 border-b border-[var(--line)] text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[var(--mu)]">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg border border-[var(--line)] bg-transparent text-[var(--t)]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--mu)]">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg border border-[var(--line)] bg-transparent text-[var(--t)]"
                />
              </div>
            </div>
          )}

          {/* Direct Table */}
          <div className="relative z-0 overflow-hidden">
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
          <>
          {/* Mobile Flat List View (< md) — no sideways table scrolling */}
          <div className="md:hidden divide-y divide-[var(--line)]">
            {logs.map((log) => {
              const normalizedResult = (log.result || '').toUpperCase();
              const isSuccess = normalizedResult === 'SUCCESS';
              const isFailed =
                normalizedResult === 'FAILED' ||
                normalizedResult === 'FAILURE' ||
                normalizedResult === 'DENIED';
              const { datePart, timePart } = formatManilaDateParts(log.timestamp);
              const eventTitle = formatEventTitle(log);
              const adminDisplayName = log.administratorName || 'Admin';

              return (
                <button
                  key={log.id || (log as any)._id}
                  type="button"
                  onClick={() => setSelectedLog(log)}
                  className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                    isFailed ? 'bg-rose-500/5' : 'hover:bg-[var(--soft)]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13.5px] font-semibold text-[var(--t)] leading-snug min-w-0">
                      {eventTitle}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        isSuccess
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
                          : 'bg-rose-500/15 text-rose-500 border border-rose-500/25'
                      }`}
                    >
                      {isSuccess ? <Check size={10} strokeWidth={2.5} /> : <X size={10} strokeWidth={2.5} />}
                      <span>{isSuccess ? 'Success' : 'Failed'}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[11.5px] text-[var(--mu)]">
                    <span className="truncate">
                      <span className="text-[var(--t)]/85 font-medium">{adminDisplayName}</span>
                      {' · '}
                      {datePart}, {timePart}
                    </span>
                    <ChevronRight size={14} className="shrink-0 opacity-60" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop Table View (md+) */}
          <div className="hidden md:block overflow-x-auto">
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

                  const adminDisplayName = log.administratorName || 'Admin';
                  const initial = (adminDisplayName?.[0] || 'A').toUpperCase();

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
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30"
                          >
                            {initial}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--t,#E4F7EA)]">
                              {adminDisplayName}
                            </div>
                            <div className="text-[11px] text-[var(--mu,#87A993)]">
                              Admin
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
          </>
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
        </section>
      </div>

      {/* Details Modal (Flat, zero nested cards) */}
      {selectedLog && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] overflow-y-auto bg-black/60 p-4 sm:p-6"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
          onClick={() => setSelectedLog(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="min-h-full flex items-center justify-center">
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl my-8 rounded-xl border border-[var(--line)] bg-white dark:bg-[#131916] text-[var(--t)] overflow-hidden flex flex-col"
            >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] shrink-0">
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-sm text-[var(--t)]">Audit Event Details</h3>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[var(--mu)]">
                  · {formatCategorySubtitle(selectedLog)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    selectedLog.result?.toUpperCase() === 'SUCCESS'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : selectedLog.result?.toUpperCase() === 'DENIED'
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'bg-rose-500/15 text-rose-500'
                  }`}
                >
                  {selectedLog.result?.toUpperCase() || 'SUCCESS'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-[var(--mu)] hover:text-[var(--t)] hover:bg-[var(--soft)] transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Modal Body (Flat hairline-divided sections) */}
            <div className="px-5 py-4 divide-y divide-[var(--line)] max-h-[75vh] overflow-y-auto text-xs">
              {/* Event Action */}
              <div className="pb-3.5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--mu)]">Event Action</div>
                <div className="font-bold text-base text-[var(--t)] mt-0.5">
                  {formatEventTitle(selectedLog)}
                </div>
              </div>

              {/* Who & When */}
              <div className="grid grid-cols-2 gap-4 py-3.5">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--mu)]">
                    <Clock size={12} className="text-[var(--acc)]" />
                    <span>When Performed</span>
                  </div>
                  <div className="font-medium text-xs text-[var(--t)] mt-1">
                    {formatManilaDateParts(selectedLog.timestamp).datePart}
                  </div>
                  <div className="text-[11px] text-[var(--mu)]">
                    {formatManilaDateParts(selectedLog.timestamp).timePart}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-[var(--mu)]">
                    <Shield size={12} className="text-[var(--acc)]" />
                    <span>Who Performed</span>
                  </div>
                  <div className="font-semibold text-xs text-[var(--t)] mt-1">
                    {selectedLog.administratorName || 'Admin'}
                  </div>
                  <div className="text-[10px] font-bold text-[var(--acc)] uppercase">
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
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--mu)] block">
                      Operation Details
                    </span>

                    <div className="divide-y divide-[var(--line)]">
                      {details.month && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[var(--mu)]">Target Month</span>
                          <span className="font-semibold text-[var(--t)]">{String(details.month)}</span>
                        </div>
                      )}

                      {(details.oldValue !== undefined || details.newValue !== undefined) && (
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-[var(--mu)]">Target Change</span>
                          <span className="font-semibold text-[var(--t)] tabular-nums">
                            {details.oldValue !== undefined && details.oldValue !== null ? String(details.oldValue) : 'None'}
                            {' → '}
                            <strong className="text-[var(--acc)]">{String(details.newValue)}</strong>
                          </span>
                        </div>
                      )}

                      {details.reportName && (
                        <div className="flex items-start justify-between py-2 gap-2">
                          <span className="text-[var(--mu)] shrink-0">Report File</span>
                          <span className="text-xs text-[var(--t)] font-medium text-right break-all">
                            {String(details.reportName)}
                          </span>
                        </div>
                      )}
                      {details.format && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[var(--mu)]">Format</span>
                          <span className="text-xs uppercase font-bold text-[var(--acc)]">
                            {String(details.format)}
                          </span>
                        </div>
                      )}
                      {details.dateRange && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[var(--mu)]">Date Range</span>
                          <span className="text-[var(--t)] font-medium">{String(details.dateRange)}</span>
                        </div>
                      )}

                      {details.tilesChecked !== undefined && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[var(--mu)]">Tiles Checked / Flagged</span>
                          <span className="font-semibold text-[var(--t)] tabular-nums">
                            {String(details.tilesChecked)} checked ·{' '}
                            <span className={Number(details.flaggedTiles) > 0 ? 'text-rose-500' : 'text-[var(--acc)]'}>
                              {String(details.flaggedTiles ?? 0)} flagged
                            </span>
                          </span>
                        </div>
                      )}
                      {details.result && typeof details.result === 'string' && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[var(--mu)]">Verdict</span>
                          <span className="font-semibold text-[var(--t)]">{details.result}</span>
                        </div>
                      )}
                      {details.actualEnergyWh !== undefined && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[var(--mu)]">Energy Output</span>
                          <span className="font-bold text-[var(--acc)]">{String(details.actualEnergyWh)} Wh</span>
                        </div>
                      )}
                      {details.performancePercentage !== undefined && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[var(--mu)]">Performance</span>
                          <span className="font-bold text-[var(--acc)]">{String(details.performancePercentage)}%</span>
                        </div>
                      )}

                      {details.method && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[var(--mu)]">Auth Method</span>
                          <span className="text-xs uppercase font-semibold text-[var(--t)]">{String(details.method)}</span>
                        </div>
                      )}
                      {details.reason && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-[var(--mu)]">Session Reason</span>
                          <span className="text-xs text-[var(--t)] font-medium">{String(details.reason)}</span>
                        </div>
                      )}

                      {weeklyTargetsEntries && weeklyTargetsEntries.length > 0 && (
                        <div className="py-2">
                          <span className="text-[10px] uppercase font-bold text-[var(--mu)] block mb-1.5">
                            Weekly Targets Breakdown
                          </span>
                          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                            {weeklyTargetsEntries.map(([week, val]) => (
                              <div key={week} className="text-xs">
                                <span className="text-[10px] text-[var(--mu)] uppercase mr-1">{week}:</span>
                                <span className="font-semibold text-[var(--acc)] tabular-nums">{String(val)} mWh</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2.5 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowRawJson((prev) => !prev)}
                          className="text-[11px] text-[var(--mu)] hover:text-[var(--acc)] underline cursor-pointer"
                        >
                          {showRawJson ? 'Hide raw JSON audit metadata' : 'View raw JSON metadata'}
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyJson}
                          className="inline-flex items-center gap-1 text-[11px] text-[var(--mu)] hover:text-[var(--acc)] px-2 py-1 rounded hover:bg-[var(--soft)] transition-colors cursor-pointer"
                        >
                          {copied ? <Check size={12} className="text-[var(--acc)]" /> : <Copy size={12} />}
                          <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                        </button>
                      </div>

                      {showRawJson && (
                        <pre className="mt-2 p-3 rounded-lg bg-[var(--soft)] text-[var(--mu)] font-mono text-[10px] overflow-x-auto">
                          {JSON.stringify(selectedLog, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-[var(--line)] flex items-center justify-between shrink-0">
              <span className="text-[10px] text-[var(--mu)] truncate max-w-[280px]">
                Event ID: {selectedLog.id || (selectedLog as any)._id}
              </span>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#19D46A] hover:opacity-90 text-[#0D1B14] transition-opacity cursor-pointer"
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
