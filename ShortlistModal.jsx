import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Bookmark } from 'lucide-react';

export const ShortlistModal = ({
  isOpen,
  onClose,
  onSubmit,
  playerName = 'Athlete',
  initialNotes = '',
  loading = false,
}) => {
  const [notes, setNotes] = useState(initialNotes);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(notes);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Shortlist ${playerName}`}
      subtitle="Add confidential scouting evaluations and recruitment notes"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            Scout Evaluation & Notes
          </label>
          <textarea
            rows={4}
            className="block w-full rounded-xl bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm p-3.5 shadow-sm"
            placeholder="e.g. Exceptional spatial awareness and work rate. Follow up in regional finals."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading} icon={Bookmark}>
            Save to Shortlist
          </Button>
        </div>
      </form>
    </Modal>
  );
};
export default ShortlistModal;
