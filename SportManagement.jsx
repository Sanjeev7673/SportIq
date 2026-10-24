import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Trophy, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/formatters';

export const SportManagement = () => {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const loadSports = async () => {
    try {
      setLoading(true);
      const data = await adminService.listSports();
      setSports(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSports();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.createSport(formData);
      setIsModalOpen(false);
      setFormData({ name: '', description: '' });
      await loadSports();
    } catch (err) {
      alert(err.message || 'Failed to create sport');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sportId) => {
    if (!window.confirm('Delete this sport from the catalog?')) return;
    try {
      await adminService.deleteSport(sportId);
      await loadSports();
    } catch (err) {
      alert(err.message || 'Failed to delete sport');
    }
  };

  if (loading) {
    return <Loader message="Loading sports taxonomy catalog..." className="py-24" />;
  }

  const columns = [
    {
      header: 'Sport Discipline',
      key: 'name',
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</span>
        </div>
      )
    },
    {
      header: 'Discipline Description',
      key: 'description',
      render: (s) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 max-w-lg truncate block">
          {s.description || 'No description provided'}
        </span>
      )
    },
    {
      header: 'Registered Date',
      key: 'created_at',
      render: (s) => <span className="text-slate-500 dark:text-slate-400 text-xs">{formatDate(s.created_at)}</span>
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (s) => (
        <button
          onClick={() => handleDelete(s.id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          title="Delete Sport"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">Sport Taxonomy Catalog</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure recognized sports disciplines, evaluation weight presets, and categories</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm" icon={Plus}>
          Add Sport
        </Button>
      </div>

      <Card title={`Active Sports in Catalog (${sports.length})`}>
        {sports.length > 0 ? (
          <Table columns={columns} data={sports} />
        ) : (
          <EmptyState
            icon={Trophy}
            title="No Sports Cataloged"
            description="Add recognized sporting disciplines to enable athlete registration."
            actionLabel="Add Sport"
            onAction={() => setIsModalOpen(true)}
          />
        )}
      </Card>

      {/* Create Sport Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Sport Discipline"
        subtitle="Catalog a new sport for athlete evaluations"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Sport Name"
            placeholder="e.g. Volleyball"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description & Evaluation Criteria
            </label>
            <textarea
              rows={3}
              required
              className="block w-full rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm p-3.5 shadow-sm"
              placeholder="e.g. Fast-paced court sport emphasizing vertical spike speed, agility, and defensive reflexes."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Add to Catalog
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default SportManagement;
