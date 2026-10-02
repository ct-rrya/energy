import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Key,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react';
import { adminManagementService, type Administrator } from '@/api/services/admin-management.service';
import { CreateAdminModal } from '../components/CreateAdminModal';
import { AccessCodeDisplayModal } from '../components/AccessCodeDisplayModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Admin Management Page
 *
 * SUPER_ADMIN interface for managing administrator accounts.
 *
 * Features:
 * - List all administrators
 * - Create new administrators
 * - Reset access codes
 * - Activate/deactivate accounts
 * - Delete administrators
 * - View statistics
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

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [accessCodeData, setAccessCodeData] = useState<{
    code: string;
    adminName: string;
  } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'reset' | 'delete' | 'deactivate' | 'activate';
    admin: Administrator;
  } | null>(null);

  // Queries
  const { data: adminsData, isLoading } = useQuery({
    queryKey: ['administrators'],
    queryFn: () => adminManagementService.listAdministrators(),
  });

  const { data: statsData } = useQuery({
    queryKey: ['administrator-stats'],
    queryFn: () => adminManagementService.getStatistics(),
  });

  // Mutations
  const resetCodeMutation = useMutation({
    mutationFn: (id: string) => adminManagementService.resetAccessCode(id),
    onSuccess: (response, adminId) => {
      const admin = administrators.find((a) => a.id === adminId);
      setAccessCodeData({
        code: response.data.accessCode,
        adminName: admin?.name || 'Administrator',
      });
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

  // Data
  const administrators = adminsData?.data?.administrators || [];
  const stats = statsData?.data?.stats;

  // Filtered administrators
  const filteredAdmins = administrators.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handlers
  const handleCreateSuccess = (code: string, adminName: string) => {
    setShowCreateModal(false);
    setAccessCodeData({ code, adminName });
    queryClient.invalidateQueries({ queryKey: ['administrators'] });
    queryClient.invalidateQueries({ queryKey: ['administrator-stats'] });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === 'reset') {
      resetCodeMutation.mutate(confirmAction.admin.id);
    } else if (confirmAction.type === 'delete') {
      deleteAdminMutation.mutate(confirmAction.admin.id);
    } else if (confirmAction.type === 'activate') {
      updateStatusMutation.mutate({
        id: confirmAction.admin.id,
        isActive: true,
      });
    } else if (confirmAction.type === 'deactivate') {
      updateStatusMutation.mutate({
        id: confirmAction.admin.id,
        isActive: false,
      });
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'SUPER_ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
          <ShieldCheck className="w-3 h-3" />
          SUPER ADMIN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
        <Shield className="w-3 h-3" />
        SYSTEM ADMIN
        </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
        <XCircle className="w-3 h-3" />
        Inactive
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                Administrator Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage System Administrator accounts and access codes
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5" />
              Add Administrator
            </button>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Administrators</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total}
                    </p>
                  </div>
                  <Users className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Super Admins</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.SUPER_ADMIN}
                    </p>
                  </div>
                  <ShieldCheck className="w-10 h-10 text-purple-500 opacity-20" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">System Admins</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {stats.SYSTEM_ADMIN}
                    </p>
                  </div>
                  <Shield className="w-10 h-10 text-blue-500 opacity-20" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Administrator Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600 mt-4">Loading administrators...</p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No administrators found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {admin.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {admin.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(admin.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(admin.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {admin.lastLoginAt
                          ? new Date(admin.lastLoginAt).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              setConfirmAction({ type: 'reset', admin })
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                            title="Reset Access Code"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmAction({
                                type: admin.isActive ? 'deactivate' : 'activate',
                                admin,
                              })
                            }
                            className={`p-2 rounded transition-colors duration-200 ${
                              admin.isActive
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={
                              admin.isActive
                                ? 'Deactivate Account'
                                : 'Activate Account'
                            }
                          >
                            {admin.isActive ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              setConfirmAction({ type: 'delete', admin })
                            }
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                            title="Delete Administrator"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {accessCodeData && (
        <AccessCodeDisplayModal
          accessCode={accessCodeData.code}
          administratorName={accessCodeData.adminName}
          onClose={() => setAccessCodeData(null)}
        />
      )}

      {confirmAction && (
        <ConfirmationModal
          type={confirmAction.type}
          administrator={confirmAction.admin}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
          isLoading={
            resetCodeMutation.isPending ||
            updateStatusMutation.isPending ||
            deleteAdminMutation.isPending
          }
        />
      )}
    </div>
  );
}
