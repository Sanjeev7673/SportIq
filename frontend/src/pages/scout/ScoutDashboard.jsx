import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { scoutService } from '../../services/scoutService';
import { DEFAULT_SPORTS } from '../../utils/constants';
import { getImageUrl, getPotentialBadgeColor, getScoreColor } from '../../utils/formatters';
import {
  Search,
  Bookmark,
  BookmarkCheck,
  Scale,
  Eye,
  User
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import ShortlistModal from '../../components/scout/ShortlistModal';
import Modal from '../../components/common/Modal';
import TalentRadarChart from '../../components/charts/TalentRadarChart';

export const ScoutDashboard = () => {
  const [prospects, setProspects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [sport, setSport] = useState('');
  const [minTalentScore, setMinTalentScore] = useState(70);

  // Shortlist action state
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [submittingShortlist, setSubmittingShortlist] = useState(false);

  // Performance inspection state
  const [inspectPlayer, setInspectPlayer] = useState(null);
  const [playerHistory, setPlayerHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (sport) params.sport = sport;
      if (minTalentScore) params.min_talent_score = Number(minTalentScore);

      const res = await scoutService.searchTalent(params);
      setProspects(res.players || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, [sport, minTalentScore]);

  const handleShortlistSubmit = async (notes) => {
    if (!targetPlayer) return;
    setSubmittingShortlist(true);
    try {
      if (targetPlayer.is_shortlisted && targetPlayer.shortlist_id) {
        await scoutService.removeFromShortlist(targetPlayer.shortlist_id);
      } else {
        await scoutService.addToShortlist({
          player_id: targetPlayer.id,
          notes
        });
      }
      setTargetPlayer(null);
      await fetchProspects();
    } catch (err) {
      alert(err.message || 'Failed to update shortlist');
    } finally {
      setSubmittingShortlist(false);
    }
  };

  const handleInspect = async (player) => {
    setInspectPlayer(player);
    setLoadingHistory(true);
    try {
      const res = await scoutService.getPlayerPerformance(player.id);
      setPlayerHistory(res);
    } catch (e) {
      setPlayerHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const columns = [
    {
      header: 'Prospect',
      key: 'name',
      render: (p) => {
        const photoUrl = getImageUrl(p.profile_image);
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#0B1220] border border-[#1E293B] flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {photoUrl ? (
                <img src={photoUrl} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#2563EB]">{p.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <span className="font-bold text-[#F8FAFC] block">{p.name}</span>
              <span className="text-[10px] text-[#94A3B8]">{p.age || '--'} yrs • {p.sport}</span>
            </div>
          </div>
        );
      }
    },
    { header: 'Position', key: 'position' },
    {
      header: 'AI Talent Rating',
      key: 'latest_talent_score',
      render: (p) => (
        <span className={`font-bold font-display text-sm ${getScoreColor(p.latest_talent_score || 0)}`}>
          {p.latest_talent_score ? Math.round(p.latest_talent_score) : '--'}
        </span>
      )
    },
    {
      header: 'Potential Level',
      key: 'latest_potential_level',
      render: (p) => p.latest_potential_level ? (
        <Badge variant="primary" size="sm" className={getPotentialBadgeColor(p.latest_potential_level)}>
          {p.latest_potential_level}
        </Badge>
      ) : <span className="text-[#94A3B8] text-xs">Unranked</span>
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (p) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleInspect(p)}
            className="p-1.5 text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#06B6D4]/10 rounded-lg transition-colors cursor-pointer"
            title="Inspect Metrics"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTargetPlayer(p)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              p.is_shortlisted
                ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                : 'text-[#94A3B8] hover:text-[#F59E0B] hover:bg-[#111C2E] border-[#1E293B]'
            }`}
            title={p.is_shortlisted ? 'Bookmarked in Shortlist' : 'Add to Shortlist'}
          >
            {p.is_shortlisted ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      )
    }
  ];

  const inspectPhoto = getImageUrl(inspectPlayer?.profile_image);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">Scout Intelligence Hub</h1>
          <p className="text-xs text-[#94A3B8]">Discover elite talent using AI thresholds, benchmark prospects, and manage shortlists</p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/coach/compare">
            <Button variant="secondary" size="sm" icon={Scale}>Compare Prospects</Button>
          </Link>
          <Link to="/scout/shortlist">
            <Button variant="primary" size="sm" icon={Bookmark}>View Shortlist</Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-[#111C2E] border-[#1E293B]">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="sm:col-span-2">
            <Input
              placeholder="Search prospects by name..."
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select
            options={DEFAULT_SPORTS}
            placeholder="All Sports"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
          />

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#94A3B8] mb-1">
              <span>Min AI Talent Index:</span>
              <span className="text-[#06B6D4] font-bold">{minTalentScore} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={minTalentScore}
              onChange={(e) => setMinTalentScore(Number(e.target.value))}
              className="w-full accent-[#2563EB] bg-[#0B1220] h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </Card>

      {/* Prospects Table */}
      <Card title={`Qualified Prospects (${total})`}>
        {loading ? (
          <Loader message="Filtering high-potential prospects..." className="py-12" />
        ) : prospects.length > 0 ? (
          <Table columns={columns} data={prospects} />
        ) : (
          <EmptyState
            title="No Prospects Match Threshold"
            description="Lower the minimum AI talent index slider or select a different sport."
          />
        )}
      </Card>

      {/* Shortlist Modal */}
      <ShortlistModal
        isOpen={!!targetPlayer}
        onClose={() => setTargetPlayer(null)}
        onSubmit={handleShortlistSubmit}
        playerName={targetPlayer?.name}
        loading={submittingShortlist}
      />

      {/* Inspect Modal */}
      <Modal
        isOpen={!!inspectPlayer}
        onClose={() => setInspectPlayer(null)}
        title={`${inspectPlayer?.name || 'Athlete'} — Scouting Breakdown`}
        subtitle={`${inspectPlayer?.sport} • ${inspectPlayer?.position}`}
        maxWidth="max-w-2xl"
      >
        {loadingHistory ? (
          <Loader message="Loading prospect performance history..." className="py-12" />
        ) : playerHistory ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-[#0B1220] border border-[#1E293B]">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#111C2E] border border-[#2563EB]/40 flex items-center justify-center shrink-0">
                {inspectPhoto ? (
                  <img src={inspectPhoto} alt={inspectPlayer?.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-[#2563EB]" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-[#F8FAFC] text-sm">{inspectPlayer?.name}</h4>
                <p className="text-xs text-[#94A3B8]">{inspectPlayer?.sport} • {inspectPlayer?.position} • {inspectPlayer?.age} yrs</p>
              </div>
            </div>

            <TalentRadarChart
              speed={playerHistory.summary?.avg_speed || 60}
              stamina={playerHistory.summary?.avg_stamina || 60}
              strength={playerHistory.summary?.avg_strength || 60}
              agility={playerHistory.summary?.avg_agility || 60}
              accuracy={playerHistory.summary?.avg_accuracy || 60}
              height={240}
            />
          </div>
        ) : (
          <p className="text-xs text-[#94A3B8] text-center py-6">No performance logs recorded yet.</p>
        )}
      </Modal>
    </div>
  );
};
export default ScoutDashboard;
