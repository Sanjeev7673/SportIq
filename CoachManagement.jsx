import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Power,
  Mail,
  Phone,
  Building,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';

export const CoachManagement = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadCoaches = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      const data = await adminService.listCoaches(params);
      setCoaches(data || []);
    } catch (err) {
      console.error('Failed to load coaches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoaches();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadCoaches();
  };

  const handleToggleStatus = async (userId, currentActive) => {
    try {
      setTogglingId(userId);
      const updated = await adminService.toggleUserStatus(userId, !currentActive);
      setCoaches(prev => prev.map(c => c.user_id === userId ? { ...c, is_active: updated.is_active } : c));
    } catch (err) {
      alert(err.message || 'Failed to update coach status');
    } finally {
      setTogglingId(null);
    }
  };

  const openViewModal = (coach) => {
    setSelectedCoach(coach);
    setViewModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Coach & Trainer Management
            </h1>
            <Badge variant="primary" size="sm" className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30">
              {coaches.length} Coaches
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Oversee coaching credentials, trainer verifications, and athlete recommendation logs.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search coach by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>
      </Card>

      {/* Coaches Table */}
      {loading ? (
        <Loader message="Loading coach accounts..." className="py-24" />
      ) : coaches.length > 0 ? (
        <Card className="overflow-x-auto p-0 border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Coach Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Affiliated Academy</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {coaches.map((c) => (
                <tr key={c.user_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {c.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    {c.email || c.phone_number || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {c.organization}
                  </td>
                  <td className="py-3.5 px-4">
                    {c.is_active ? (
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
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs p-1.5"
                      title="View Coach Details"
                      onClick={() => openViewModal(c)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant={c.is_active ? 'danger' : 'primary'}
                      size="sm"
                      className={`text-xs py-1 px-2.5 ${c.is_active ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : 'bg-emerald-600 text-white'}`}
                      disabled={togglingId === c.user_id}
                      onClick={() => handleToggleStatus(c.user_id, c.is_active)}
                    >
                      <Power className="w-3.5 h-3.5 mr-1" />
                      <span>{c.is_active ? 'Deactivate' : 'Activate'}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-12 text-center space-y-3">
          <ClipboardList className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No coach accounts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No registered coaches match the current search query.
          </p>
        </Card>
      )}

      {/* View Coach Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Coach Profile & Organization"
      >
        {selectedCoach && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Coach Full Name</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedCoach.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Email Address</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedCoach.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Organization / Academy</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedCoach.organization}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Recommendations Issued</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{selectedCoach.recommendations_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account Status</span>
                <span className={`font-bold ${selectedCoach.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedCoach.is_active ? 'Active' : 'Deactivated'}
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

export default CoachManagement;
