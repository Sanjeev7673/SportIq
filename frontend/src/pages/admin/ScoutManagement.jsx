import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Power,
  Mail,
  Phone,
  Bookmark,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';

export const ScoutManagement = () => {
  const [scouts, setScouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedScout, setSelectedScout] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadScouts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      const data = await adminService.listScouts(params);
      setScouts(data || []);
    } catch (err) {
      console.error('Failed to load scouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScouts();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadScouts();
  };

  const handleToggleStatus = async (userId, currentActive) => {
    try {
      setTogglingId(userId);
      const updated = await adminService.toggleUserStatus(userId, !currentActive);
      setScouts(prev => prev.map(s => s.user_id === userId ? { ...s, is_active: updated.is_active } : s));
    } catch (err) {
      alert(err.message || 'Failed to update scout status');
    } finally {
      setTogglingId(null);
    }
  };

  const openViewModal = (scout) => {
    setSelectedScout(scout);
    setViewModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Scout & Recruiter Management
            </h1>
            <Badge variant="primary" size="sm" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30">
              {scouts.length} Scouts
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor talent recruiters, agency affiliations, and athlete discovery activities.
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
              placeholder="Search scout by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>
      </Card>

      {/* Scouts Table */}
      {loading ? (
        <Loader message="Loading scout accounts..." className="py-24" />
      ) : scouts.length > 0 ? (
        <Card className="overflow-x-auto p-0 border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Scout Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Recruitment Agency</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {scouts.map((s) => (
                <tr key={s.user_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {s.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                    {s.email || s.phone_number || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {s.organization}
                  </td>
                  <td className="py-3.5 px-4">
                    {s.is_active ? (
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
                    {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs p-1.5"
                      title="View Scout Details"
                      onClick={() => openViewModal(s)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant={s.is_active ? 'danger' : 'primary'}
                      size="sm"
                      className={`text-xs py-1 px-2.5 ${s.is_active ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : 'bg-emerald-600 text-white'}`}
                      disabled={togglingId === s.user_id}
                      onClick={() => handleToggleStatus(s.user_id, s.is_active)}
                    >
                      <Power className="w-3.5 h-3.5 mr-1" />
                      <span>{s.is_active ? 'Deactivate' : 'Activate'}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-12 text-center space-y-3">
          <Search className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No scouts found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No registered scout accounts match your search query.
          </p>
        </Card>
      )}

      {/* View Scout Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Scout Profile & Talent Shortlists"
      >
        {selectedScout && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Scout Full Name</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedScout.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Email Address</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedScout.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Agency / Club</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedScout.organization}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Shortlisted Prospects</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{selectedScout.shortlists_count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account Status</span>
                <span className={`font-bold ${selectedScout.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedScout.is_active ? 'Active' : 'Deactivated'}
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

export default ScoutManagement;
