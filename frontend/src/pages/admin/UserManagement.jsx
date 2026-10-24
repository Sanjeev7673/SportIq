import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  Trash2,
  Power,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { getRoleBadgeColor } from '../../utils/formatters';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (roleFilter) params.role = roleFilter;
      if (search.trim()) params.search = search.trim();

      const data = await adminService.listUsers(params);
      setUsers(data?.users || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleToggleStatus = async (userId, currentActive) => {
    try {
      setTogglingId(userId);
      const updated = await adminService.toggleUserStatus(userId, !currentActive);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: updated.is_active } : u));
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setTogglingId(null);
    }
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
              User Governance & Access
            </h1>
            <Badge variant="primary" size="sm">{total} Registered Accounts</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control user authorization, activate/deactivate accounts, and inspect registration details.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by full name, email address, or mobile number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Account Roles</option>
            <option value="PLAYER">Athletes (Player)</option>
            <option value="COACH">Coaches / Trainers</option>
            <option value="SCOUT">Scouts / Recruiters</option>
            <option value="ORGANIZER">Tournament Organizers</option>
            <option value="ADMIN">Platform Administrators</option>
          </select>

          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>
      </Card>

      {/* Users Table */}
      {loading ? (
        <Loader message="Loading registered users..." className="py-24" />
      ) : users.length > 0 ? (
        <Card className="overflow-x-auto p-0 border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">User Name</th>
                <th className="py-3.5 px-4">Email / Phone</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {u.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    {u.email || u.phone_number || 'No contact'}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="primary" size="sm" className={getRoleBadgeColor(u.role)}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Deactivated</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs p-1.5"
                      title="View User Details"
                      onClick={() => openViewModal(u)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant={u.is_active ? 'danger' : 'primary'}
                      size="sm"
                      className={`text-xs py-1 px-2.5 ${u.is_active ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : 'bg-emerald-600 text-white'}`}
                      title={u.is_active ? 'Deactivate User' : 'Activate User'}
                      disabled={togglingId === u.id}
                      onClick={() => handleToggleStatus(u.id, u.is_active)}
                    >
                      <Power className="w-3.5 h-3.5 mr-1" />
                      <span>{u.is_active ? 'Deactivate' : 'Activate'}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-12 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No users found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No accounts match the current filter or search keyword.
          </p>
        </Card>
      )}

      {/* View User Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="User Account Details"
      >
        {selectedUser && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Full Name</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedUser.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Email Address</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedUser.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Phone Number</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedUser.phone_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account Role</span>
                <Badge variant="primary" size="sm" className={getRoleBadgeColor(selectedUser.role)}>
                  {selectedUser.role}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account Status</span>
                <span className={`font-bold ${selectedUser.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedUser.is_active ? 'Active' : 'Deactivated'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Registered On</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
