import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { scoutService } from '../../services/scoutService';
import { getImageUrl, formatDate } from '../../utils/formatters';
import { Bookmark, Edit3, Trash2, Scale } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import ShortlistModal from '../../components/scout/ShortlistModal';

export const ShortlistedPlayers = () => {
  const [shortlist, setShortlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [savingNote, setSavingNote] = useState(false);

  const loadShortlist = async () => {
    try {
      setLoading(true);
      const data = await scoutService.getShortlist();
      setShortlist(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShortlist();
  }, []);

  const handleUpdateNotes = async (notes) => {
    if (!editingItem) return;
    setSavingNote(true);
    try {
      await scoutService.updateShortlistNotes(editingItem.id, { notes });
      setEditingItem(null);
      await loadShortlist();
    } catch (err) {
      alert(err.message || 'Failed to update notes');
    } finally {
      setSavingNote(false);
    }
  };

  const handleRemove = async (itemId) => {
    if (!window.confirm('Remove this athlete from your shortlist?')) return;
    try {
      await scoutService.removeFromShortlist(itemId);
      await loadShortlist();
    } catch (err) {
      alert(err.message || 'Failed to remove from shortlist');
    }
  };

  if (loading) {
    return <Loader message="Loading scout shortlist..." className="py-24" />;
  }

  const columns = [
    {
      header: 'Prospect',
      key: 'player_name',
      render: (item) => {
        const photoUrl = getImageUrl(item.player_profile_image || item.profile_image);
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#0B1220] border border-[#1E293B] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {photoUrl ? (
                <img src={photoUrl} alt={item.player_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#2563EB]">{item.player_name?.charAt(0) || 'P'}</span>
              )}
            </div>
            <div>
              <span className="font-bold text-[#F8FAFC] block">{item.player_name}</span>
              <span className="text-[10px] text-[#94A3B8]">{item.player_sport} • {item.player_position}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Scouting Evaluation Notes',
      key: 'notes',
      render: (item) => (
        <span className="text-xs text-[#94A3B8] italic max-w-md truncate block">
          "{item.notes || 'No notes added yet'}"
        </span>
      )
    },
    {
      header: 'Bookmarked On',
      key: 'created_at',
      render: (item) => <span className="text-[#94A3B8] text-xs">{formatDate(item.created_at)}</span>
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingItem(item)}
            className="p-1.5 text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#06B6D4]/10 rounded-lg transition-colors cursor-pointer"
            title="Edit Scouting Notes"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleRemove(item.id)}
            className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors cursor-pointer"
            title="Remove from Shortlist"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">Scout Shortlist Portfolio</h1>
          <p className="text-xs text-[#94A3B8]">Track prospective recruits and attach private scouting intelligence</p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/coach/compare">
            <Button variant="secondary" size="sm" icon={Scale}>Compare Shortlisted</Button>
          </Link>
          <Link to="/scout/dashboard">
            <Button variant="primary" size="sm">Search More Talent</Button>
          </Link>
        </div>
      </div>

      <Card title={`Bookmarked Prospects (${shortlist.length})`}>
        {shortlist.length > 0 ? (
          <Table columns={columns} data={shortlist} />
        ) : (
          <EmptyState
            icon={Bookmark}
            title="Your Shortlist is Empty"
            description="Explore the talent discovery hub and bookmark high-potential athletes."
            actionLabel="Discover Athletes"
            onAction={() => window.location.href = '/scout/dashboard'}
          />
        )}
      </Card>

      {/* Edit Notes Modal */}
      <ShortlistModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSubmit={handleUpdateNotes}
        playerName={editingItem?.player_name}
        initialNotes={editingItem?.notes}
        loading={savingNote}
      />
    </div>
  );
};
export default ShortlistedPlayers;
