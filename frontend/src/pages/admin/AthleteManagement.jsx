import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  User,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Power,
  Trophy,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';

export const AthleteManagement = () => {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const loadAthletes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      const data = await adminService.listAthletes(params);
      setAthletes(data || []);
    } catch (err) {
      console.error('Failed to load athletes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAthletes();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadAthletes();
  };

  const handleToggleStatus = async (userId, currentActive) => {
    try {
      setTogglingId(userId);
      const updated = await adminService.toggleUserStatus(userId, !currentActive);
      setAthletes(prev => prev.map(a => a.user_id === userId ? { ...a, is_active: updated.is_active } : a));
    } catch (err) {
      alert(err.message || 'Failed to update athlete status');
    } finally {
      setTogglingId(null);
    }
  };

  const openViewModal = (athlete) => {
    setSelectedAthlete(athlete);
    setViewModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Athlete Management
            </h1>
            <Badge variant="primary" size="sm" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
              {athletes.length} Athletes
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Inspect athlete profiles, discipline taxonomy, and account active states across India.
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
              placeholder="Search athlete by name, sport, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>
      </Card>

      {/* Athletes Table */}
      {loading ? (
        <Loader message="Loading athlete profiles..." className="py-24" />
      ) : athletes.length > 0 ? (
        <Card className="overflow-x-auto p-0 border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Athlete Name</th>
                <th className="py-3.5 px-4">Sport & Role</th>
                <th className="py-3.5 px-4">Age / Gender</th>
                <th className="py-3.5 px-4">Profile State</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {athletes.map((a) => (
                <tr key={a.user_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {a.name}
                    <span className="text-[11px] text-slate-400 block font-normal">{a.email || a.phone_number}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{a.sport}</span>
                    <span className="text-[11px] text-slate-400">{a.position || 'General Athlete'}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {a.age ? `${a.age} yrs` : 'N/A'} • {a.gender || 'All'}
                  </td>
                  <td className="py-3.5 px-4">
                    {a.profile_completed ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Completed ✓</span>
                    ) : (
                      <span className="text-amber-500 font-semibold text-[11px]">Pending Info</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {a.is_active ? (
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
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs p-1.5"
                      title="View Athlete Details"
                      onClick={() => openViewModal(a)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant={a.is_active ? 'danger' : 'primary'}
                      size="sm"
                      className={`text-xs py-1 px-2.5 ${a.is_active ? 'bg-rose-500/10 text-rose-600 border-rose-500/30' : 'bg-emerald-600 text-white'}`}
                      disabled={togglingId === a.user_id}
                      onClick={() => handleToggleStatus(a.user_id, a.is_active)}
                    >
                      <Power className="w-3.5 h-3.5 mr-1" />
                      <span>{a.is_active ? 'Deactivate' : 'Activate'}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-12 text-center space-y-3">
          <User className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No athletes found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No athletes match your current search criteria.
          </p>
        </Card>
      )}

      {/* View Athlete Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Athlete Athletic Profile"
      >
        {selectedAthlete && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Athlete Name</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedAthlete.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Sport Discipline</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{selectedAthlete.sport}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Position / Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAthlete.position || 'General'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Age & Gender</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAthlete.age || 'N/A'} yrs • {selectedAthlete.gender || 'All'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Experience Level</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAthlete.experience} years</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAthlete.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Account Status</span>
                <span className={`font-bold ${selectedAthlete.is_active ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedAthlete.is_active ? 'Active' : 'Deactivated'}
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

export default AthleteManagement;
