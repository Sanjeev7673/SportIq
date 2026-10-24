import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { ClipboardCheck } from 'lucide-react';

export const RecommendationModal = ({
  isOpen,
  onClose,
  onSubmit,
  playerName = 'Athlete',
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    focus_areas: '',
    status: 'ACTIVE'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Create Recommendation for ${playerName}`}
      subtitle="Define a targeted drill or training regimen"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Program / Drill Title"
          placeholder="e.g. High-Intensity Agility & First Touch Routine"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />

        <Input
          label="Focus Areas"
          placeholder="e.g. Agility, Stamina, Acceleration"
          value={formData.focus_areas}
          onChange={(e) => setFormData({ ...formData, focus_areas: e.target.value })}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Detailed Workout Instructions
          </label>
          <textarea
            rows={4}
            required
            className="block w-full rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm p-3.5 shadow-sm"
            placeholder="Specify sets, reps, intensity levels, and progression milestones..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading} icon={ClipboardCheck}>
            Save Recommendation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
export default RecommendationModal;
