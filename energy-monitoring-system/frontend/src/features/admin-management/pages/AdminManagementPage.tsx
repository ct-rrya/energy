import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Key,
  Lock,
  MoreVertical,
  Search,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Check,
  Trash2,
} from 'lucide-react';
import { adminManagementService, type Administrator } from '@/api/services/admin-management.service';
import { CreateAdminModal } from '../components/CreateAdminModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { AccessCodeDisplayModal } from '../components/AccessCodeDisplayModal';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Format timestamp into Manila Date & Time strings (Asia/Manila, UTC+8)
 */
function formatManilaDateTime(dateString?: string): { datePart: string; timePart: string } {
  if (!dateString) return { datePart: '—', timePart: '' };
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { datePart: '—', timePart: '' };
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
      hour12: true,
    }).format(d);
    return { datePart, timePart };
  } catch {
    return { datePart: '—', timePart: '' };
  }
}

/**
 * Admin Management Page
 * Redesigned to match the EcoStep Administrators design specification in DM Sans font.
 */
export default function AdminManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect if not SUPER_ADMIN
  if (user?.role !== 'SUPER_ADMIN') {
    navigate('/dashboard');
    return null;
  }

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SUPER_ADMIN' | 'SYSTEM_ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAccessCodeData, setNewAccessCodeData] = useState<{ code: string; adminName: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'reset' | 'delete' | 'deactivate' | 'activate';
    admin: Administrator;
  } | null>(null);
  const [activeMenuAdminId, setActiveMenuAdminId] = useState<string | null>(null);

  // Close status dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close 3-dot row menus on click outside
  useEffect(() => {
    function handleWindowClick() {
      setActiveMenuAdminId(null);
    }
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, []);

  // Fetch Administrators Query
  const { data: adminsData, isLoading, refetch } = useQuery({
    queryKey: ['administrators'],
    queryFn: () => adminManagementService.listAdministrators(),
  });

  // Fetch Statistics Query
  const { data: statsData } = useQuery({
    queryKey: ['administrator-stats'],
    queryFn: () => adminManagementService.getStatistics(),
  });

  // Mutations
  const resetCodeMutation = useMutation({
    mutationFn: (id: string) => adminManagementService.resetAccessCode(id),
    onSuccess: (response: any, id) => {
      const admin = administrators.find((a) => a.id === id);
      const code = response?.data?.accessCode || response?.accessCode;
      if (code && admin) {
        setNewAccessCodeData({ code, adminName: admin.name });
      }
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ['administrators'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminManagementService.updateStatus(id, { isActive }),
    onSuccess: () => {
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ['administrators'] });
      queryClient.invalidateQueries({ queryKey: ['administrator-stats'] });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: (id: string) => adminManagementService.deleteAdministrator(id),
    onSuccess: () => {
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ['administrators'] });
      queryClient.invalidateQueries({ queryKey: ['administrator-stats'] });
    },
  });

  const administrators: Administrator[] = adminsData?.data?.administrators || [];
  const stats = statsData?.data?.stats || {
    total: administrators.length,
    SUPER_ADMIN: administrators.filter((a) => a.role === 'SUPER_ADMIN').length,
    SYSTEM_ADMIN: administrators.filter((a) => a.role === 'SYSTEM_ADMIN').length,
  };

  // Filtered Administrators
  const filteredAdmins = useMemo(() => {
    return administrators.filter((admin) => {
      const matchesSearch =
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === 'ALL' || admin.role === roleFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && admin.isActive) ||
        (statusFilter === 'INACTIVE' && !admin.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [administrators, searchQuery, roleFilter, statusFilter]);

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'reset') {
      resetCodeMutation.mutate(confirmAction.admin.id);
    } else if (confirmAction.type === 'delete') {
      deleteAdminMutation.mutate(confirmAction.admin.id);
    } else if (confirmAction.type === 'activate') {
      updateStatusMutation.mutate({ id: confirmAction.admin.id, isActive: true });
    } else if (confirmAction.type === 'deactivate') {
      updateStatusMutation.mutate({ id: confirmAction.admin.id, isActive: false });
    }
  };

  return (
    <div
      className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-[1450px] mx-auto w-full text-[var(--t,#E4F7EA)]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--t,#E4F7EA)]">
            Administrators
          </h1>
          <p className="text-xs sm:text-sm text-[var(--mu,#87A993)] mt-1">
            Manage administrator accounts, roles and access codes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[#10B981] hover:bg-[#059669] text-white shadow-sm transition-all cursor-pointer"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add administrator</span>
        </button>
      </div>

      {/* 3 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Administrators */}
        <div className="rounded-2xl p-4 sm:p-5 border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] flex items-start justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mu,#87A993)]">
              Total Administrators
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[var(--t,#E4F7EA)] my-0.5">
              {stats.total}
            </div>
            <span className="text-xs text-[var(--mu,#87A993)]">All active</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
            <Users size={17} />
          </div>
        </div>

        {/* Super Admins */}
        <div className="rounded-2xl p-4 sm:p-5 border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] flex items-start justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mu,#87A993)]">
              Super Admins
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 my-0.5">
              {stats.SUPER_ADMIN}
            </div>
            <span className="text-xs text-[var(--mu,#87A993)]">Manage admins and logs</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <ShieldCheck size={17} />
          </div>
        </div>

        {/* System Admins */}
        <div className="rounded-2xl p-4 sm:p-5 border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] flex items-start justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--mu,#87A993)]">
              System Admins
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#10B981] my-0.5">
              {stats.SYSTEM_ADMIN}
            </div>
            <span className="text-xs text-[var(--mu,#87A993)]">Day-to-day operations</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981]">
            <Shield size={17} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--mu,#87A993)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-full border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] placeholder:text-[var(--mu,#87A993)]/60 focus:outline-hidden focus:ring-1 focus:ring-[#10B981]"
          />
        </div>

        {/* Role Pills & Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* All */}
          <button
            type="button"
            onClick={() => setRoleFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              roleFilter === 'ALL'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] hover:border-[#10B981]/40'
            }`}
          >
            All {stats.total}
          </button>

          {/* Super Admin */}
          <button
            type="button"
            onClick={() => setRoleFilter('SUPER_ADMIN')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              roleFilter === 'SUPER_ADMIN'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] hover:border-[#10B981]/40'
            }`}
          >
            Super admin {stats.SUPER_ADMIN}
          </button>

          {/* System Admin */}
          <button
            type="button"
            onClick={() => setRoleFilter('SYSTEM_ADMIN')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              roleFilter === 'SYSTEM_ADMIN'
                ? 'bg-[#10B981] text-white shadow-xs'
                : 'border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] hover:border-[#10B981]/40'
            }`}
          >
            System admin {stats.SYSTEM_ADMIN}
          </button>

          {/* Status Dropdown */}
          <div ref={statusDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] text-[var(--t,#E4F7EA)] hover:border-[#10B981]/40 transition-colors cursor-pointer"
            >
              <span>
                {statusFilter === 'ALL'
                  ? 'All statuses'
                  : statusFilter === 'ACTIVE'
                  ? 'Active'
                  : 'Inactive'}
              </span>
              <ChevronDown size={13} className={`text-[var(--mu,#87A993)] transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute right-0 mt-1 py-1 w-32 z-50 rounded-xl border border-[var(--line,rgba(255,255,255,0.15))] bg-[var(--panel,#12241A)] shadow-xl text-xs">
                {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatusFilter(s);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors cursor-pointer ${
                      statusFilter === s
                        ? 'bg-[#10B981]/15 text-[#10B981] font-semibold'
                        : 'text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.06))]'
                    }`}
                  >
                    <span>{s === 'ALL' ? 'All statuses' : s === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                    {statusFilter === s && <Check size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-[var(--line,rgba(255,255,255,0.1))] bg-[var(--panel,#12241A)] overflow-hidden shadow-xs min-h-[240px]">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-xs text-[var(--mu,#87A993)]">
            <span className="animate-spin text-[#10B981]">↻</span>
            <span>Loading administrator records...</span>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--mu,#87A993)]">
            No administrator accounts match your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--line,rgba(255,255,255,0.1))] text-[11px] font-bold uppercase tracking-wider text-[var(--mu,#87A993)] bg-[var(--soft,rgba(255,255,255,0.02))]">
                  <th className="py-3.5 px-5 whitespace-nowrap">Administrator</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Role</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Status</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Last Sign-in (PHT)</th>
                  <th className="py-3.5 px-5 whitespace-nowrap">Access Code</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line,rgba(255,255,255,0.08))]">
                {filteredAdmins.map((admin, index) => {
                  const currentUserId = (user as any)?.id || (user as any)?._id;
                  const isCurrentSuper =
                    currentUserId === admin.id || user?.email === admin.email;
                  const isSuper = admin.role === 'SUPER_ADMIN';
                  const displayName = isSuper ? 'Ecostep Super' : admin.name;
                  const initial = (displayName?.[0] || 'E').toUpperCase();
                  const { datePart, timePart } = formatManilaDateTime(admin.lastLoginAt);
                  const isNearBottom = index > 0 && index >= filteredAdmins.length - 2;

                  return (
                    <tr
                      key={admin.id}
                      className={`transition-colors ${
                        isCurrentSuper
                          ? 'bg-amber-400/5 hover:bg-amber-400/10'
                          : 'hover:bg-[var(--soft,rgba(255,255,255,0.03))]'
                      }`}
                    >
                      {/* Administrator (Avatar + Name + Badge 'You' + Email) */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSuper
                                ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                                : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
                            }`}
                          >
                            {initial}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-semibold text-[var(--t,#E4F7EA)]">
                              <span>{displayName}</span>
                              {isCurrentSuper && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[var(--soft,rgba(255,255,255,0.1))] text-[var(--mu,#87A993)] border border-[var(--line,rgba(255,255,255,0.15))]">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[var(--mu,#87A993)]">
                              {admin.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isSuper
                              ? 'bg-amber-400/15 text-amber-400 border border-amber-400/25'
                              : 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25'
                          }`}
                        >
                          {isSuper ? 'Super admin' : 'System admin'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              admin.isActive ? 'bg-[#10B981]' : 'bg-rose-500'
                            }`}
                          />
                          <span className={admin.isActive ? 'text-[var(--t,#E4F7EA)]' : 'text-rose-400'}>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {/* Last Sign-in (PHT) */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="text-[var(--t,#E4F7EA)] font-medium">{datePart}</div>
                        {timePart && (
                          <div className="text-[11px] text-[var(--mu,#87A993)]">{timePart}</div>
                        )}
                      </td>

                      {/* Access Code */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-[var(--mu,#87A993)] bg-[var(--soft,rgba(255,255,255,0.04))] border border-[var(--line,rgba(255,255,255,0.08))]">
                            <Lock size={12} />
                            <span>Protected</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmAction({ type: 'reset', admin })}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[var(--t,#E4F7EA)] border border-[var(--line,rgba(255,255,255,0.15))] bg-[var(--soft,rgba(255,255,255,0.03))] hover:border-[#10B981] hover:text-[#10B981] transition-colors cursor-pointer"
                          >
                            <Key size={12} />
                            <span>Reset</span>
                          </button>
                        )}
                      </td>

                      {/* 3-dot Actions menu */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-right">
                        <div className="relative inline-block text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuAdminId(activeMenuAdminId === admin.id ? null : admin.id);
                            }}
                            className="p-1 rounded-lg text-[var(--mu,#87A993)] hover:text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.08))] transition-colors cursor-pointer"
                          >
                            <MoreVertical size={15} />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuAdminId === admin.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute right-0 ${
                                isNearBottom ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                              } w-48 z-50 rounded-xl border border-[var(--line,rgba(255,255,255,0.18))] bg-[var(--panel,#12241A)] shadow-2xl py-1 text-left text-xs animate-in fade-in zoom-in-95 duration-100`}
                            >
                              {/* Super admin self account -> CANNOT DELETE OWN ACCOUNT */}
                              {isCurrentSuper ? (
                                <div className="px-3 py-2 text-[11px] text-[var(--mu,#87A993)] italic">
                                  Cannot delete or modify own account
                                </div>
                              ) : isSuper ? (
                                <div className="px-3 py-2 text-[11px] text-[var(--mu,#87A993)] italic">
                                  Super admin account is protected
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuAdminId(null);
                                      setConfirmAction({ type: 'reset', admin });
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.08))] cursor-pointer"
                                  >
                                    <Key size={13} className="text-[#10B981]" />
                                    <span>Reset access code</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuAdminId(null);
                                      setConfirmAction({
                                        type: admin.isActive ? 'deactivate' : 'activate',
                                        admin,
                                      });
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-[var(--t,#E4F7EA)] hover:bg-[var(--soft,rgba(255,255,255,0.08))] cursor-pointer"
                                  >
                                    {admin.isActive ? (
                                      <>
                                        <XCircle size={13} className="text-amber-400" />
                                        <span>Deactivate account</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 size={13} className="text-[#10B981]" />
                                        <span>Activate account</span>
                                      </>
                                    )}
                                  </button>

                                  <div className="my-1 border-t border-[var(--line,rgba(255,255,255,0.08))]" />

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuAdminId(null);
                                      setConfirmAction({ type: 'delete', admin });
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 cursor-pointer font-medium"
                                  >
                                    <Trash2 size={13} className="text-rose-400" />
                                    <span>Delete administrator</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Protected Note matching screenshot */}
      <div className="flex items-start gap-2 text-xs text-[var(--mu,#87A993)] px-1">
        <span className="text-[#10B981] font-bold">ⓘ</span>
        <span>
          Super admin accounts are protected: they can't be deactivated, reset, or duplicated. A super-admin cannot create another super-admin. Every change you make here is recorded in Logs.
        </span>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}

      {confirmAction && (
        <ConfirmationModal
          type={confirmAction.type}
          administrator={confirmAction.admin}
          isLoading={
            resetCodeMutation.isPending ||
            updateStatusMutation.isPending ||
            deleteAdminMutation.isPending
          }
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {newAccessCodeData && (
        <AccessCodeDisplayModal
          accessCode={newAccessCodeData.code}
          administratorName={newAccessCodeData.adminName}
          onClose={() => setNewAccessCodeData(null)}
        />
      )}
    </div>
  );
}
