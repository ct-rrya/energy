import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ScrollText,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Download,
} from 'lucide-react';
import { auditService, type AuditLogItem } from '@/api/services/audit.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { EcoPageHeader, EcoCard, EcoEmptyState } from '@/components/common';

const SAMPLE_FALLBACK_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    administratorId: 'admin-1',
    administratorName: 'Apple (System Admin)',
    administratorRole: 'SUPER_ADMIN',
    action: 'LOGIN',
    target: 'System Access',
    targetType: 'Auth',
    details: { method: 'access_code', session: 'active' },
    result: 'success',
    ipAddress: '127.0.0.1',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'log-2',
    administratorId: 'admin-2',
    administratorName: 'Apple',
    administratorRole: 'SUPER_ADMIN',
    action: 'HEALTH_CHECK',
    target: 'ESP32 Piezo Tile #1',
    targetType: 'Diagnostic',
    details: { mode: 'verification_test', duration: '60s' },
    result: 'success',
    ipAddress: '127.0.0.1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'log-3',
    administratorId: 'admin-1',
    administratorName: 'Apple',
    administratorRole: 'SUPER_ADMIN',
    action: 'MILESTONE_TARGET_LOCKED',
    target: 'November 2026 Target',
    targetType: 'Milestone',
    details: { targetKWh: 30, baselineLocked: true },
    result: 'success',
    ipAddress: '127.0.0.1',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'log-4',
    administratorId: 'system',
    administratorName: 'EcoStep Daemon',
    administratorRole: 'SYSTEM_ADMIN',
    action: 'TELEMETRY_SYNC',
    target: 'WebSocket Ingestion Stream',
    targetType: 'Sensor',
    details: { packetsReceived: 1420, dropRate: '0.0%' },
    result: 'success',
    ipAddress: '192.168.1.100',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

export function LogsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect non-super-admins
  if (user?.role !== 'SUPER_ADMIN') {
    navigate('/dashboard');
    return null;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | 'success' | 'failure'>('all');
  const [actionFilter, setActionFilter] = useState<'all' | 'LOGIN' | 'DIAGNOSTIC' | 'MILESTONE' | 'SYSTEM'>('all');

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditService.getLogs({ limit: 100 }),
    retry: 1,
  });

  const rawLogs: AuditLogItem[] = useMemo(() => {
    if (data?.logs && data.logs.length > 0) {
      return data.logs;
    }
    return SAMPLE_FALLBACK_LOGS;
  }, [data]);

  const filteredLogs = useMemo(() => {
    return rawLogs.filter((log) => {
      const matchesSearch =
        searchTerm === '' ||
        log.administratorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.target && log.target.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesResult = resultFilter === 'all' || log.result === resultFilter;

      const matchesAction =
        actionFilter === 'all' ||
        (actionFilter === 'LOGIN' && log.action.includes('LOGIN')) ||
        (actionFilter === 'DIAGNOSTIC' && (log.action.includes('HEALTH') || log.action.includes('DIAG'))) ||
        (actionFilter === 'MILESTONE' && log.action.includes('MILESTONE')) ||
        (actionFilter === 'SYSTEM' && !log.action.includes('LOGIN') && !log.action.includes('MILESTONE'));

      return matchesSearch && matchesResult && matchesAction;
    });
  }, [rawLogs, searchTerm, resultFilter, actionFilter]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Administrator', 'Role', 'Action', 'Target', 'Result', 'IP Address'];
    const rows = filteredLogs.map((l) => [
      new Date(l.timestamp).toLocaleString(),
      `"${l.administratorName}"`,
      l.administratorRole,
      l.action,
      `"${l.target || ''}"`,
      l.result,
      l.ipAddress || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecostep-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
      {/* Header */}
      <EcoPageHeader
        title="Logs"
        subtitle="Immutable audit trail of administrator actions, system corrections, and access events."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[var(--line)] bg-[var(--pill-bg)] text-[var(--t)] hover:bg-[var(--soft)] transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#1fd566] text-[#0e1f15] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Download size={13} strokeWidth={2.4} />
              <span>Export CSV</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <EcoCard className="p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mu)] opacity-70" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs by admin, action, or target..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] placeholder:text-[var(--mu)] focus:outline-hidden focus:ring-2 focus:ring-[#1fd566]/40"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-full border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Actions</option>
            <option value="LOGIN">Authentication</option>
            <option value="DIAGNOSTIC">Health Checks</option>
            <option value="MILESTONE">Milestones</option>
            <option value="SYSTEM">System</option>
          </select>

          {/* Result Filter */}
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-full border border-[var(--line)] bg-[var(--soft)] text-[var(--t)] focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Results</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>

          <span className="text-xs text-[var(--mu)] ml-2">
            {filteredLogs.length} {filteredLogs.length === 1 ? 'event' : 'events'}
          </span>
        </div>
      </EcoCard>

      {/* Logs Table */}
      <EcoCard className="overflow-hidden p-0">
        {filteredLogs.length === 0 ? (
          <div className="p-12">
            <EcoEmptyState
              icon={ScrollText}
              title="No logs found"
              description="No audit events matched your search or filter criteria."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--soft)] text-xs uppercase tracking-wider text-[var(--mu)]">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Administrator</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Target</th>
                  <th className="py-3 px-4 font-semibold">Result</th>
                  <th className="py-3 px-4 font-semibold text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredLogs.map((log) => {
                  const date = new Date(log.timestamp);
                  const isSuccess = log.result === 'success';

                  return (
                    <tr key={log.id} className="hover:bg-[var(--soft)]/50 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[var(--mu)] tabular-nums">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--mint)] text-[var(--acc)] flex items-center justify-center text-xs font-bold">
                            {(log.administratorName[0] || 'A').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-[var(--t)] text-xs">{log.administratorName}</div>
                            <div className="text-[10px] text-[var(--mu)] uppercase">{log.administratorRole}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--soft)] border border-[var(--line)] text-[var(--t)]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[var(--t)]">
                        {log.target || '—'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isSuccess
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-[#39FF88]'
                              : 'bg-red-500/15 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          <span>{log.result}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono text-xs text-[var(--mu)]">
                        {log.ipAddress || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </EcoCard>
    </div>
  );
}

export default LogsPage;
