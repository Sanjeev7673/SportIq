import React, { useState, useEffect } from 'react';
import { coachService } from '../../services/coachService';
import { ClipboardList, Plus, Trash2, CheckCircle, Archive } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { formatDate } from '../../utils/formatters';

export const TrainingRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    player_id: '',
    title: '',
    description: '',
    focus_areas: '',
    status: 'ACTIVE'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [recs, squad] = await Promise.all([
        coachService.getMyRecommendations(),
        coachService.listSquadPlayers({ limit: 100 })
      ]);
      setRecommendations(recs || []);
      setPlayers(squad.players || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.player_id) {
      alert('Please select an athlete.');
      return;
    }
    setSubmitting(true);
    try {
      await coachService.createRecommendation({
        ...formData,
        player_id: Number(formData.player_id)
      });
      setIsModalOpen(false);
      setFormData({ player_id: '', title: '', description: '', focus_areas: '', status: 'ACTIVE' });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to create recommendation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (recId, newStatus) => {
    try {
      await coachService.updateRecommendation(recId, { status: newStatus });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (recId) => {
    if (!window.confirm('Delete this recommendation?')) return;
    try {
      await coachService.deleteRecommendation(recId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete recommendation');
    }
  };

  if (loading) {
    return <Loader message="Loading training recommendations..." className="py-24" />;
  }

  const columns = [
    {
      header: 'Program Title',
      key: 'title',
      render: (r) => (
        <div>
          <span className="font-bold text-[#F8FAFC] block">{r.title}</span>
          <span className="text-[10px] text-[#06B6D4] font-medium">Focus: {r.focus_areas || 'General'}</span>
        </div>
      )
    },
    {
      header: 'Assigned Athlete',
      key: 'player_name',
      render: (r) => <span className="text-[#F8FAFC] font-semibold">{r.player_name || `Player #${r.player_id}`}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => {
        let variant = 'primary';
        if (r.status === 'COMPLETED') variant = 'success';
        if (r.status === 'ARCHIVED') variant = 'default';
        return <Badge variant={variant} size="sm">{r.status}</Badge>;
      }
    },
    {
      header: 'Created On',
      key: 'created_at',
      render: (r) => <span className="text-[#94A3B8] text-xs">{formatDate(r.created_at)}</span>
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.status === 'ACTIVE' && (
            <button
              onClick={() => handleStatusChange(r.id, 'COMPLETED')}
              className="p-1.5 text-[#22C55E] hover:bg-[#22C55E]/10 rounded-lg transition-colors cursor-pointer"
              title="Mark as Completed"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {r.status !== 'ARCHIVED' && (
            <button
              onClick={() => handleStatusChange(r.id, 'ARCHIVED')}
              className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C2E] rounded-lg transition-colors cursor-pointer"
              title="Archive"
            >
              <Archive className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(r.id)}
            className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const playerOptions = players.map(p => ({
    value: p.id,
    label: `${p.name} (${p.sport} - ${p.position || 'Athlete'})`
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">Training Recommendations</h1>
          <p className="text-xs text-[#94A3B8]">Design and assign structured workout regimens and skill development drills</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm" icon={Plus}>
          New Recommendation
        </Button>
      </div>

      <Card title={`Authoring Programs (${recommendations.length})`}>
        {recommendations.length > 0 ? (
          <Table columns={columns} data={recommendations} />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No Training Programs Prescribed"
            description="Create your first tailored training recommendation for squad athletes."
            actionLabel="New Recommendation"
            onAction={() => setIsModalOpen(true)}
          />
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Prescribe Training Regimen"
        subtitle="Specify target athlete and developmental protocol"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Target Athlete"
            options={playerOptions}
            placeholder="Select an athlete..."
            required
            value={formData.player_id}
            onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
          />

          <Input
            label="Program Title"
            placeholder="e.g. Explosive First-Step & Deceleration Routine"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <Input
            label="Focus Areas"
            placeholder="e.g. Agility, Stamina, Core Strength"
            value={formData.focus_areas}
            onChange={(e) => setFormData({ ...formData, focus_areas: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Workout Instructions & Progression
            </label>
            <textarea
              rows={4}
              required
              className="block w-full rounded-xl bg-[#0B1220] border border-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-sm p-3.5"
              placeholder="Outline specific drills, set counts, rest intervals, and target milestones..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>Assign Program</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default TrainingRecommendations;
