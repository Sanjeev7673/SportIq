import React, { useState, useEffect } from 'react';
import { playerService } from '../../services/playerService';
import { performanceService } from '../../services/performanceService';
import { aiService } from '../../services/aiService';
import {
  BrainCircuit,
  ShieldAlert,
  CheckCircle2,
  Lightbulb,
  History,
  ShieldCheck,
  Award
} from 'lucide-react';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import TalentRadarChart from '../../components/charts/TalentRadarChart';
import { getPotentialBadgeColor, getScoreColor, getConfidenceColor, formatDate } from '../../utils/formatters';

export const AIAnalysisPage = () => {
  const [profile, setProfile] = useState(null);
  const [latestAI, setLatestAI] = useState(null);
  const [historyAI, setHistoryAI] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAI = async () => {
      try {
        setLoading(true);
        const prof = await playerService.getMyProfile();
        setProfile(prof);

        if (prof?.id) {
          const [aiData, aiHist, statsData] = await Promise.all([
            aiService.getLatestPlayerAI(prof.id).catch(() => null),
            aiService.getPlayerAIHistory(prof.id).catch(() => []),
            performanceService.getPlayerStats(prof.id).catch(() => null)
          ]);
          setLatestAI(aiData);
          setHistoryAI(aiHist);
          setStats(statsData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadAI();
  }, []);

  if (loading) {
    return <Loader message="Running AI talent neural analysis..." className="py-24" />;
  }

  if (!latestAI) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <EmptyState
          icon={BrainCircuit}
          title="No AI Analysis Available"
          description="Log at least one performance session in the Performance section to generate your comprehensive AI talent projection."
        />
      </div>
    );
  }

  const dataConf = latestAI.data_confidence_score || (stats?.avg_data_confidence_score || 70.0);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">AI Talent Intelligence</h1>
          <Badge variant="ai" size="sm">Model {latestAI.model_version || 'v1.0'}</Badge>
        </div>
        <p className="text-xs text-[#94A3B8]">Position-weighted neural evaluation, transparent evidence confidence, and developmental insights</p>
      </div>

      {/* Device-Inclusive Equity Banner */}
      <div className="p-4 rounded-2xl bg-[#111C2E] border border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-[#06B6D4] shrink-0" />
          <span className="text-[#94A3B8]">
            <strong className="text-[#F8FAFC]">Device-Inclusive & Equitable Scoring:</strong> Talent Index measures pure athletic capability across field tests, smartphone measurements, and video proof without requiring expensive wearable devices.
          </span>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 text-[11px] font-semibold">
          Equal Opportunity Standard
        </span>
      </div>

      {/* Dual Score Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#111C2E] border-[#1E293B] md:col-span-1 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#06B6D4] block mb-2">Projected AI Talent Index</span>
            <div className="flex items-baseline gap-2 mb-3">
              <span className={`text-5xl font-extrabold font-display ${getScoreColor(latestAI.talent_score)}`}>
                {Math.round(latestAI.talent_score)}
              </span>
              <span className="text-sm text-[#94A3B8]">/ 100</span>
            </div>
            <Badge variant="primary" size="lg" className={getPotentialBadgeColor(latestAI.potential_level)}>
              {latestAI.potential_level} Potential
            </Badge>
          </div>

          {/* Data Confidence Indicator */}
          <div className="p-3.5 rounded-xl bg-[#0B1220] border border-[#1E293B] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8] flex items-center gap-1.5 font-bold uppercase text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#06B6D4]" /> Evidence Confidence
              </span>
              <span className={`font-bold px-2 py-0.5 rounded-full border text-xs ${getConfidenceColor(dataConf)}`}>
                {dataConf.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-[#06B6D4]"
                style={{ width: `${Math.min(Math.max(dataConf, 10), 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-[#94A3B8] block">
              Confidence score reflects proof quality, protocol consistency, and coach attestations.
            </span>
          </div>
        </Card>

        {/* Radar */}
        <Card title="5-Pillar Position Radar" subtitle="Calculated based on your specific playing role" className="md:col-span-2">
          <TalentRadarChart
            speed={stats?.avg_speed || 70}
            stamina={stats?.avg_stamina || 70}
            strength={stats?.avg_strength || 70}
            agility={stats?.avg_agility || 70}
            accuracy={stats?.avg_accuracy || 70}
            height={260}
          />
        </Card>
      </div>

      {/* Strengths & Weaknesses Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card title="Identified Core Strengths" icon={CheckCircle2}>
          <div className="p-4 rounded-xl bg-[#0B1220] border border-[#22C55E]/30">
            <span className="text-xs font-bold text-[#22C55E] uppercase tracking-wider block mb-2">Competitive Advantages</span>
            <p className="text-sm font-semibold text-[#F8FAFC] mb-2">{latestAI.strengths}</p>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              These metrics exceed target percentiles for {profile?.sport} ({profile?.position}). Continue leveraging these attributes in competitive fixtures.
            </p>
          </div>
        </Card>

        {/* Weaknesses */}
        <Card title="Targeted Areas for Improvement" icon={ShieldAlert}>
          <div className="p-4 rounded-xl bg-[#0B1220] border border-[#F59E0B]/30">
            <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider block mb-2">Growth Bottlenecks</span>
            <p className="text-sm font-semibold text-[#F8FAFC] mb-2">{latestAI.weaknesses}</p>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Targeting these specific metrics will directly elevate your overall talent score and matchday impact.
            </p>
          </div>
        </Card>
      </div>

      {/* Automated Training Recommendations */}
      <Card title="Automated AI Development Protocol" icon={Lightbulb}>
        <div className="p-5 rounded-xl bg-[#0B1220] border border-[#06B6D4]/30">
          <span className="text-xs font-bold uppercase tracking-wider text-[#06B6D4] block mb-2">Prescribed Workout Routine</span>
          <p className="text-sm text-[#F8FAFC] leading-relaxed">{latestAI.recommendations}</p>
        </div>
      </Card>

      {/* History Timeline */}
      {historyAI.length > 1 && (
        <Card title="AI Evaluation Timeline" icon={History} subtitle="Evolution of talent scores across assessment cycles">
          <div className="space-y-2">
            {historyAI.map((item, idx) => (
              <div key={item.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#94A3B8] font-mono">#{historyAI.length - idx}</span>
                  <span className="text-xs text-[#F8FAFC] font-semibold">{formatDate(item.created_at)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[#94A3B8]">Score: <strong className="text-[#F8FAFC]">{item.talent_score}</strong></span>
                  <Badge variant="primary" size="sm" className={getPotentialBadgeColor(item.potential_level)}>
                    {item.potential_level}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
export default AIAnalysisPage;
