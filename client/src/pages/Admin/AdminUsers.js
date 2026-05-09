import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  User,
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  UserCheck, 
  UserX, 
  Calendar,
  Download,
  RefreshCw,
  Shield,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  GraduationCap,
  TrendingUp
} from 'lucide-react';
import api from '../../utils/axiosConfig';
import useCustomToast from '../../utils/customToast';
import ConfirmationModal from '../../components/Modal/ConfirmationModal';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useCustomToast();
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    studentId: '',
    institute: '',
    phoneNumber: '',
    department: '',
    gender: '',
    role: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    verified: 0,
    newThisMonth: 0
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 20,
        ...(activeSearchTerm && { search: activeSearchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(roleFilter && { role: roleFilter })
      };

      const response = await api.get('/api/admin/users', { params });
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      
      toast.fetchError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, roleFilter, activeSearchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/users/stats');
      setStats(response.data);
    } catch (error) {
      
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
    fetchUsers();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      switch (action) {
        case 'activate':
          await api.put(`/api/admin/users/${userId}/status`, { status: 'active' });
          toast.updateSuccess('user status');
          break;
        case 'deactivate':
          await api.put(`/api/admin/users/${userId}/status`, { status: 'inactive' });
          toast.updateSuccess('user status');
          break;
        case 'verify':
          await api.put(`/api/admin/users/${userId}/verify`);
          toast.updateSuccess('user verification');
          break;
        case 'delete':
          const userToDelete = users.find(user => user._id === userId);
          if (userToDelete) {
            setUserToDelete(userToDelete);
            setShowDeleteModal(true);
          }
          break;
        case 'view':
          const userToView = users.find(user => user._id === userId);
          if (userToView) {
            setViewingUser(userToView);
            setShowViewModal(true);
          }
          break;
        case 'edit':
          const userToEdit = users.find(user => user._id === userId);
          if (userToEdit) {
            setEditingUser(userToEdit);
            setEditForm({
              name: userToEdit.name || '',
              email: userToEdit.email || '',
              studentId: userToEdit.studentId || '',
              institute: userToEdit.institute || '',
              phoneNumber: userToEdit.phoneNumber || '',
              department: userToEdit.department || '',
              gender: userToEdit.gender || '',
              role: userToEdit.role || ''
            });
            setShowEditModal(true);
          }
          break;
        default:
          break;
      }
      fetchUsers();
      fetchStats();
    } catch (error) {
      
      toast.updateError('action');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select users first');
      return;
    }

    try {
      await api.post('/api/admin/users/bulk-action', {
        userIds: selectedUsers,
        action: action
      });
      toast.updateSuccess(`bulk ${action}`);
      setSelectedUsers([]);
      fetchUsers();
      fetchStats();
    } catch (error) {
      
      toast.updateError('bulk action');
    }
  };

  const updateUser = async () => {
    try {
      if (!editingUser) return;
      
      await api.put(`/api/admin/users/${editingUser._id}`, editForm);
      toast.updateSuccess('user');
      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      
      toast.updateError('user');
    }
  };

  const exportUsers = async () => {
    try {
      const response = await api.get('/api/admin/users/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users-export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Users exported successfully');
    } catch (error) {
      
      toast.error('Failed to export users');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      await api.delete(`/api/admin/users/${userToDelete._id}`);
      toast.deleteSuccess('user');
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers(); // Refresh the users list
    } catch (error) {
      
      toast.deleteError('user');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (user) => {
    if (!user.isActive) return 'text-red-400 bg-red-400/20';
    if (user.isEmailVerified && user.isFaceVerified) return 'text-green-400 bg-green-400/20';
    if (user.isEmailVerified) return 'text-yellow-400 bg-yellow-400/20';
    return 'text-gray-400 bg-gray-400/20';
  };

  const getStatusText = (user) => {
    if (!user.isActive) return 'Inactive';
    if (user.isEmailVerified && user.isFaceVerified) return 'Verified';
    if (user.isEmailVerified) return 'Email Verified';
    return 'Unverified';
  };

  const getStatusIcon = (user) => {
    if (!user.isActive) return <XCircle className="h-4 w-4" />;
    if (user.isEmailVerified && user.isFaceVerified) return <CheckCircle className="h-4 w-4" />;
    if (user.isEmailVerified) return <Clock className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 p-6 rounded-xl">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
              <p className="text-gray-400">Manage and monitor user accounts</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={exportUsers}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={fetchUsers}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <Users className="h-12 w-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-3xl font-bold text-white">{stats.active}</p>
              </div>
              <UserCheck className="h-12 w-12 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Verified</p>
                <p className="text-3xl font-bold text-white">{stats.verified}</p>
              </div>
              <ShieldCheck className="h-12 w-12 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">New This Month</p>
                <p className="text-3xl font-bold text-white">{stats.newThisMonth}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-700 mb-8">
          <div className="flex flex-col space-y-4">
            {/* Search and Filters Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name... (Press Enter to search)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-20 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {searchTerm && (
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setActiveSearchTerm('');
                          fetchUsers();
                        }}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                        title="Clear search"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={handleSearch}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      title="Search"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters Button */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors ${
                    showFilters 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                  <span className="sm:hidden">Filter</span>
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                  >
                    <option value="">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="email_verified">Email Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-200"
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('');
                      setRoleFilter('');
                      setCurrentPage(1);
                    }}
                    className="w-full bg-gray-600 hover:bg-gray-500 text-white px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  <UserCheck className="h-3 w-3" />
                  <span>Activate</span>
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  <UserX className="h-3 w-3" />
                  <span>Deactivate</span>
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Results Info */}
        {(searchTerm || statusFilter || roleFilter) && (
          <div className="bg-cyan-900/20 border border-cyan-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-cyan-400" />
                <span className="text-cyan-300 text-sm">
                  Showing {users.length} user{users.length !== 1 ? 's' : ''}
                  {searchTerm && ` matching "${searchTerm}"`}
                  {statusFilter && ` with ${statusFilter} status`}
                  {roleFilter && ` with ${roleFilter} role`}
                </span>
              </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveSearchTerm('');
                  setStatusFilter('');
                  setRoleFilter('');
                  setCurrentPage(1);
                  fetchUsers();
                }}
                className="text-cyan-400 hover:text-cyan-300 text-sm underline"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(users.map(user => user._id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
                    />
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-sm font-medium text-gray-300">User</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-sm font-medium text-gray-300 hidden lg:table-cell">Institute</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-sm font-medium text-gray-300 hidden md:table-cell">Joined</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-sm font-medium text-gray-300 hidden xl:table-cell">Last Login</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user._id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
                      />
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-semibold">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">{user.name}</p>
                          <p className="text-gray-400 text-xs sm:text-sm truncate">{user.email}</p>
                          <p className="text-gray-500 text-xs">ID: {user.studentId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user)}`}>
                        {getStatusIcon(user)}
                        <span className="hidden sm:inline">{getStatusText(user)}</span>
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300 truncate">{user.institute}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">{formatDate(user.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 hidden xl:table-cell">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleUserAction(user._id, 'view')}
                          className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUserAction(user._id, 'edit')}
                          className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {user.isActive ? (
                          <button
                            onClick={() => handleUserAction(user._id, 'deactivate')}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                            title="Deactivate User"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction(user._id, 'activate')}
                            className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                            title="Activate User"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleUserAction(user._id, 'delete')}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">
                  Showing page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 bg-cyan-600 text-white rounded">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View User Details Modal */}
        {showViewModal && viewingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">User Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                      <p className="text-white">{viewingUser.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                      <p className="text-white">{viewingUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Student ID</label>
                      <p className="text-white">{viewingUser.studentId || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Institute</label>
                      <p className="text-white">{viewingUser.institute || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                      <p className="text-white">{viewingUser.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                      <p className="text-white">{viewingUser.department || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                      <p className="text-white">{viewingUser.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        viewingUser.role === 'admin' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {viewingUser.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Account Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Account Status</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        viewingUser.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Email Verified</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        viewingUser.isEmailVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingUser.isEmailVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Face Verified</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        viewingUser.isFaceVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {viewingUser.isFaceVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Registration Date</span>
                      <span className="text-white">{formatDate(viewingUser.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Last Updated</span>
                      <span className="text-white">{formatDate(viewingUser.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-700 rounded-lg p-6 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
                      <p className="text-white">{viewingUser.dateOfBirth ? formatDate(viewingUser.dateOfBirth) : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Interests</label>
                      <p className="text-white">
                        {viewingUser.interests && viewingUser.interests.length > 0 
                          ? viewingUser.interests.join(', ') 
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Edit User</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Student ID</label>
                  <input
                    type="text"
                    value={editForm.studentId}
                    onChange={(e) => setEditForm({...editForm, studentId: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Institute</label>
                  <input
                    type="text"
                    value={editForm.institute}
                    onChange={(e) => setEditForm({...editForm, institute: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateUser}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  Update User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete User"
          message={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </div>
  );
};

export default AdminUsers;
