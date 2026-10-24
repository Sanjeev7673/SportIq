import React, { useState, useEffect } from 'react';
import { coachService } from '../../services/coachService';
import { Scale, Check, User } from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import ComparisonRadarChart from '../../components/charts/ComparisonRadarChart';
import { getPotentialBadgeColor, getScoreColor, getImageUrl } from '../../utils/formatters';

export const PlayerComparison = () => {
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        const res = await coachService.listSquadPlayers({ limit: 50 });
        const list = res.players || [];
        setAllPlayers(list);
        if (list.length >= 2) {
          const initialIds = [list[0].id, list[1].id];
          setSelectedIds(initialIds);
          runComparison(initialIds);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadPlayers();
  }, []);

  const runComparison = async (ids) => {
    if (ids.length < 2) return;
    try {
      setComparing(true);
      const res = await coachService.comparePlayers(ids);
      setComparisonData(res.comparison || []);
    } catch (err) {
      alert(err.message || 'Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  const togglePlayerSelection = (id) => {
    let updated;
    if (selectedIds.includes(id)) {
      if (selectedIds.length <= 2) {
        alert('Please select at least 2 athletes for side-by-side comparison.');
        return;
      }
      updated = selectedIds.filter(item => item !== id);
    } else {
      if (selectedIds.length >= 5) {
        alert('You can compare a maximum of 5 athletes simultaneously.');
        return;
      }
      updated = [...selectedIds, id];
    }
    setSelectedIds(updated);
    runComparison(updated);
  };

  if (loading) {
    return <Loader message="Loading athletes for comparison matrix..." className="py-24" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">Athlete Head-to-Head Comparison</h1>
          <p className="text-xs text-[#94A3B8]">Compare 2 to 5 athletes side-by-side across physical metrics & AI talent indexes</p>
        </div>

        <Badge variant="primary">
          {selectedIds.length} / 5 Selected
        </Badge>
      </div>

      {/* Selectable Athletes Pill Bar */}
      <Card title="Select Athletes to Compare" subtitle="Click on an athlete to add or remove from comparison matrix">
        <div className="flex flex-wrap gap-2">
          {allPlayers.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            const photoUrl = getImageUrl(p.profile_image);
            return (
              <button
                key={p.id}
                onClick={() => togglePlayerSelection(p.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#2563EB] text-[#F8FAFC] border-[#2563EB] shadow-sm'
                    : 'bg-[#0B1220] text-[#94A3B8] border-[#1E293B] hover:text-[#F8FAFC] hover:border-[#2563EB]/40'
                }`}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt={p.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                ) : isSelected ? (
                  <Check className="w-3.5 h-3.5 text-[#F8FAFC] shrink-0" />
                ) : (
                  <User className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                )}
                <span>{p.name}</span>
                <span className="text-[10px] text-[#94A3B8] font-normal">({p.sport})</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Comparison Grid: Radar Overlay + Metrics Matrix */}
      {comparisonData.length >= 2 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radar Overlay */}
          <Card title="Multi-Athlete Radar Overlay" subtitle="Comparison of all 5 physical pillars" className="lg:col-span-1">
            <ComparisonRadarChart players={comparisonData} height={320} />
          </Card>

          {/* Matrix Table */}
          <Card title="Detailed Attribute Comparison Matrix" subtitle="Side-by-side metric averages & AI scores" className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] text-[#94A3B8] uppercase font-semibold">
                    <th className="py-3 px-3">Metric / Pillar</th>
                    {comparisonData.map((p) => {
                      const photoUrl = getImageUrl(p.profile_image);
                      return (
                        <th key={p.id} className="py-3 px-3 text-[#F8FAFC] font-bold">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-lg overflow-hidden bg-[#0B1220] border border-[#1E293B] flex items-center justify-center shrink-0">
                              {photoUrl ? (
                                <img src={photoUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-[#06B6D4] font-bold">{p.name.charAt(0)}</span>
                              )}
                            </div>
                            <span>{p.name}</span>
                          </div>
                          <span className="block text-[10px] text-[#94A3B8] font-normal">{p.sport} • {p.position}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] text-[#F8FAFC]">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#94A3B8]">AI Talent Score</td>
                    {comparisonData.map((p) => (
                      <td key={p.id} className={`py-2.5 px-3 font-extrabold text-sm ${getScoreColor(p.latest_talent_score || 0)}`}>
                        {p.latest_talent_score ? Math.round(p.latest_talent_score) : '--'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#94A3B8]">Potential Level</td>
                    {comparisonData.map((p) => (
                      <td key={p.id} className="py-2.5 px-3">
                        {p.latest_potential_level ? (
                          <Badge variant="primary" size="sm" className={getPotentialBadgeColor(p.latest_potential_level)}>
                            {p.latest_potential_level}
                          </Badge>
                        ) : '--'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#94A3B8]">Speed (Avg)</td>
                    {comparisonData.map((p) => (
                      <td key={p.id} className="py-2.5 px-3 font-bold text-[#06B6D4]">
                        {p.avg_speed || '--'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#94A3B8]">Stamina (Avg)</td>
                    {comparisonData.map((p) => (
                      <td key={p.id} className="py-2.5 px-3 font-bold text-[#22C55E]">
                        {p.avg_stamina || '--'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#94A3B8]">Strength (Avg)</td>
                    {comparisonData.map((p) => (
                      <td key={p.id} className="py-2.5 px-3 font-bold text-[#F59E0B]">
                        {p.avg_strength || '--'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#94A3B8]">Agility (Avg)</td>
                    {comparisonData.map((p) => (
                      <td key={p.id} className="py-2.5 px-3 font-bold text-[#2563EB]">
                        {p.avg_agility || '--'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#94A3B8]">Accuracy (Avg)</td>
                    {comparisonData.map((p) => (
                      <td key={p.id} className="py-2.5 px-3 font-bold text-[#06B6D4]">
                        {p.avg_accuracy || '--'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-[#94A3B8]">Age / Experience</td>
                    {comparisonData.map((p) => (
                      <td key={p.id} className="py-2.5 px-3 text-[#94A3B8]">
                        {p.age || '--'} yrs • {p.experience || 0} yrs exp
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={Scale}
          title="Select at Least 2 Athletes"
          description="Click on athlete cards above to begin comparison."
        />
      )}
    </div>
  );
};
export default PlayerComparison;
