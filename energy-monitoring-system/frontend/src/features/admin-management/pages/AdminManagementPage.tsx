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
  Mail,
} from 'lucide-react';
import { adminManagementService, type Administrator } from '@/api/services/admin-management.service';
import { CreateAdminModal } from '../components/CreateAdminModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme } = useTheme();

  // Redirect if not SUPER_ADMIN
  if (user?.role !== 'SUPER_ADMIN') {
    navigate('/dashboard');
    return null;
  }

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
    onSuccess: (response) => {
      setSuccessMessage(response.data.message);
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ['administrators'] });
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
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

  // Debug logging
  console.log('=== ADMIN LIST DEBUG ===');
  console.log('adminsData:', adminsData);
  console.log('adminsData?.data:', adminsData?.data);
  console.log('adminsData?.data?.administrators:', adminsData?.data?.administrators);
  console.log('administrators:', administrators);
  console.log('administrators.length:', administrators.length);
  console.log('========================');

  // Filtered administrators
  const filteredAdmins = administrators.filter(
    (admin: any) =>
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handlers
  const handleCreateSuccess = (message: string) => {
    setShowCreateModal(false);
    setSuccessMessage(message);
    queryClient.invalidateQueries({ queryKey: ['administrators'] });
    queryClient.invalidateQueries({ queryKey: ['administrator-stats'] });
    // Auto-hide success message after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000);
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
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
          theme === 'dark' 
            ? 'bg-purple-900/30 text-purple-300' 
            : 'bg-purple-100 text-purple-800'
        }`}>
          <ShieldCheck className="w-3 h-3" />
          SUPER ADMIN
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
        theme === 'dark' 
          ? 'bg-blue-900/30 text-blue-300' 
          : 'bg-blue-100 text-blue-800'
      }`}>
        <Shield className="w-3 h-3" />
        SYSTEM ADMIN
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
          theme === 'dark' 
            ? 'bg-green-900/30 text-green-300' 
            : 'bg-green-100 text-green-800'
        }`}>
          <CheckCircle className="w-3 h-3" />
          Active
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
        theme === 'dark' 
          ? 'bg-red-900/30 text-red-300' 
          : 'bg-red-100 text-red-800'
      }`}>
        <XCircle className="w-3 h-3" />
        Inactive
      </span>
    );
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-[#0B0D12]' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`text-3xl font-bold flex items-center gap-3 ${
                theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
              }`}>
                <Users className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                Administrator Management
              </h1>
              <p className={theme === 'dark' ? 'text-gray-400 mt-1' : 'text-gray-600 mt-1'}>
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
              <div className={`rounded-lg p-4 shadow ${
                theme === 'dark' 
                  ? 'bg-[#1A1D2E] border border-gray-800' 
                  : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Administrators
                    </p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                      {stats.total}
                    </p>
                  </div>
                  <Users className={`w-10 h-10 opacity-20 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
              </div>
              <div className={`rounded-lg p-4 shadow ${
                theme === 'dark' 
                  ? 'bg-[#1A1D2E] border border-gray-800' 
                  : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Super Admins
                    </p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-purple-300' : 'text-purple-900'}`}>
                      {stats.SUPER_ADMIN}
                    </p>
                  </div>
                  <ShieldCheck className={`w-10 h-10 opacity-20 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-500'}`} />
                </div>
              </div>
              <div className={`rounded-lg p-4 shadow ${
                theme === 'dark' 
                  ? 'bg-[#1A1D2E] border border-gray-800' 
                  : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      System Admins
                    </p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                      {stats.SYSTEM_ADMIN}
                    </p>
                  </div>
                  <Shield className={`w-10 h-10 opacity-20 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                theme === 'dark'
                  ? 'bg-[#1A1D2E] border-gray-700 text-gray-200 placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Administrator Table */}
        <div className={`rounded-lg shadow overflow-hidden ${
          theme === 'dark' 
            ? 'bg-[#1A1D2E] border border-gray-800' 
            : 'bg-white border border-gray-200'
        }`}>
          {isLoading ? (
            <div className="p-12 text-center">
              <div className={`inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${
                theme === 'dark' ? 'border-blue-400' : 'border-blue-600'
              }`}></div>
              <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading administrators...
              </p>
            </div>
          ) : filteredAdmins.length === 0 ? (
            <div className="p-12 text-center">
              <Users className={`w-16 h-16 mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                No administrators found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`border-b ${
                  theme === 'dark' 
                    ? 'bg-[#0F1218] border-gray-800' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Name
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Email
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Role
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Last Login
                    </th>
                    <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  theme === 'dark' 
                    ? 'bg-[#1A1D2E] divide-gray-800' 
                    : 'bg-white divide-gray-200'
                }`}>
                  {filteredAdmins.map((admin: any) => (
                    <tr key={admin.id} className={theme === 'dark' ? 'hover:bg-[#0F1218]' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
                          {admin.name}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {admin.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(admin.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(admin.isActive)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
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
                            className={`p-2 rounded transition-colors duration-200 ${
                              theme === 'dark'
                                ? 'text-blue-400 hover:bg-blue-900/30'
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
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
                                ? theme === 'dark'
                                  ? 'text-amber-400 hover:bg-amber-900/30'
                                  : 'text-amber-600 hover:bg-amber-50'
                                : theme === 'dark'
                                  ? 'text-green-400 hover:bg-green-900/30'
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
                            className={`p-2 rounded transition-colors duration-200 ${
                              theme === 'dark'
                                ? 'text-red-400 hover:bg-red-900/30'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
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

      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
          <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-start gap-3">
            <Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Success!</p>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
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
