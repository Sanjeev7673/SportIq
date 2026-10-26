import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { playerService } from '../../services/playerService';
import { performanceService } from '../../services/performanceService';
import { aiService } from '../../services/aiService';
import { coachService } from '../../services/coachService';
import {
  Activity,
  BrainCircuit,
  Award,
  Plus,
  ClipboardList,
  User,
  Video
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import TalentRadarChart from '../../components/charts/TalentRadarChart';
import PerformanceTrendChart from '../../components/charts/PerformanceTrendChart';
import PerformanceLogModal from '../../components/player/PerformanceLogModal';
import { getPotentialBadgeColor, getScoreColor, getImageUrl } from '../../utils/formatters';

export const PlayerDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [latestAI, setLatestAI] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [submittingLog, setSubmittingLog] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const prof = await playerService.getMyProfile();
      setProfile(prof);

      if (prof?.id) {
        const [statsData, histData, recsData] = await Promise.all([
          performanceService.getPlayerStats(prof.id).catch(() => null),
          performanceService.getPlayerHistory(prof.id).catch(() => ({ records: [] })),
          coachService.getPlayerRecommendations(prof.id).catch(() => []),
        ]);

        setStats(statsData);
        setHistory(histData?.records || []);
        setRecommendations(recsData || []);

        try {
          const aiData = await aiService.getLatestPlayerAI(prof.id);
          setLatestAI(aiData);
        } catch (e) {
          setLatestAI(null);
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      // Keep demo preview independent of the unavailable backend.
      let savedProfile = null;
      try {
        savedProfile = JSON.parse(localStorage.getItem('sportiq_demo_profile') || 'null');
      } catch {
        localStorage.removeItem('sportiq_demo_profile');
      }
      const isLegacyPlaceholder = savedProfile &&
        savedProfile.sport === 'Athletics' &&
        /sprinter/i.test(savedProfile.position || '') &&
        Number(savedProfile.age) === 20 &&
        Number(savedProfile.height) === 185 &&
        Number(savedProfile.weight) === 70 &&
        Number(savedProfile.experience) === 5 &&
        /state level runner/i.test(savedProfile.achievements || '');
      if (isLegacyPlaceholder) {
        savedProfile = null;
        localStorage.removeItem('sportiq_demo_profile');
      }
      setProfile(savedProfile);
      setStats(null);
      setHistory([]);
      setLatestAI(null);
      setRecommendations([]);
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, []);

  const handleLogSubmit = async (data) => {
    setSubmittingLog(true);
    try {
      if (import.meta.env.VITE_DEMO_MODE === 'true') {
        const saved = JSON.parse(localStorage.getItem('sportiq_demo_performance') || '[]');
        const record = {
          ...data,
          id: `local-${Date.now()}`,
          assessment_date: new Date().toISOString(),
          source_type: 'USER_ENTERED',
          demo_only: true,
        };
        localStorage.setItem('sportiq_demo_performance', JSON.stringify([record, ...saved]));
        setHistory((current) => [record, ...current]);
        setIsLogModalOpen(false);
        return;
      }

      const record = await performanceService.addRecord(data);
      if (profile?.id && record?.id && profile?.age && profile?.sport) {
        await aiService.predictTalent({
          ...data,
          age: profile.age,
          sport: profile.sport,
          position: profile.position || undefined,
          player_id: profile.id,
          performance_id: record.id
        });
      }
      setIsLogModalOpen(false);
      await fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to submit log');
    } finally {
      setSubmittingLog(false);
    }
  };

  if (loading) {
    return <Loader message="Loading athlete intelligence dashboard..." size="lg" className="py-24" />;
  }

  if (!profile) {
    return (
      <div className="space-y-6 pb-8">
        <section className="relative overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-7 sm:p-10">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <Badge variant="primary" className="mb-4">ATHLETE ONBOARDING</Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">Build your performance profile.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">Your dashboard becomes meaningful when it is based on your own sport, measurements and training sessions. We will not fill it with made-up scores.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/player/profile"><Button variant="primary" size="md">Complete athlete profile</Button></Link>
              <Link to="/player/performance"><Button variant="secondary" size="md">View performance log</Button></Link>
            </div>
          </div>
        </section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{n:'01',title:'Add your details',copy:'Choose your sport, position and basic measurements.'},{n:'02',title:'Record a session',copy:'Enter a performance assessment or training result.'},{n:'03',title:'Unlock insights',copy:'Use your submitted evidence to build meaningful trends.'}].map(step => <Card key={step.n} className="p-5"><span className="text-xs font-mono text-red-500">{step.n} / START HERE</span><h3 className="mt-3 font-bold text-[var(--text-primary)]">{step.title}</h3><p className="mt-2 text-sm leading-5 text-[var(--text-secondary)]">{step.copy}</p></Card>)}
        </div>
      </div>
    );
  }

  const avatarUrl = getImageUrl(profile.profile_image);

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-4">
          {/* Avatar Thumbnail */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#111C2E] border-2 border-[#06B6D4]/40 flex items-center justify-center shrink-0 shadow-sm">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-[#06B6D4]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] font-display tracking-tight">
                Welcome back, {user?.name || 'Athlete'}
              </h1>
              <Badge variant="primary" className="text-[10px]">{profile.sport}</Badge>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Position: <span className="text-[#F8FAFC] font-semibold">{profile.position || 'Not specified'}</span> • Experience: <span className="text-[#F8FAFC] font-semibold">{profile.experience != null && profile.experience !== '' ? `${profile.experience} years` : 'Not specified'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/player/profile"><Button variant="secondary" size="sm" icon={User}>Edit Profile</Button></Link>
          <Link to="/player/video-analysis">
            <Button
              variant="secondary"
              size="sm"
              icon={Video}
              className="text-[#06B6D4] border-[#06B6D4]/30 hover:border-[#06B6D4]"
            >
              Video Assessment
            </Button>
          </Link>
          <Button
            onClick={() => setIsLogModalOpen(true)}
            variant="primary"
            size="sm"
            icon={Plus}
          >
            Log Session
          </Button>
        </div>
      </div>

      {/* KPI Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* AI Talent Score Card - Prominent Cyan Accent */}
        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">AI Talent Score</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-display ${getScoreColor(latestAI?.talent_score || 0)}`}>
              {latestAI?.talent_score ? Math.round(latestAI.talent_score) : '--'}
            </span>
            <span className="text-xs text-[#94A3B8]">/ 100</span>
          </div>
          {latestAI?.potential_level && (
            <Badge variant="primary" size="sm" className={`mt-2 ${getPotentialBadgeColor(latestAI.potential_level)}`}>
              {latestAI.potential_level} Potential
            </Badge>
          )}
        </Card>

        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">Avg Speed</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#F8FAFC] font-display">
              {stats?.avg_speed ? stats.avg_speed : '--'}
            </span>
            <span className="text-xs text-[#94A3B8]">Max: {stats?.max_speed || '--'}</span>
          </div>
        </Card>

        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">Total Matches</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#F8FAFC] font-display">
              {stats?.total_matches_played ?? '--'}
            </span>
            <span className="text-xs text-[#94A3B8]">Sessions</span>
          </div>
        </Card>
      </div>

      {/* Main Visuals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart */}
        <Card title="5-Pillar Athletic Radar" subtitle="Multi-factor performance breakdown" className="lg:col-span-1">
          {stats && [stats.avg_speed, stats.avg_stamina, stats.avg_strength, stats.avg_agility, stats.avg_accuracy].some((value) => value != null) ? (
            <TalentRadarChart speed={stats.avg_speed ?? 0} stamina={stats.avg_stamina ?? 0} strength={stats.avg_strength ?? 0} agility={stats.avg_agility ?? 0} accuracy={stats.avg_accuracy ?? 0} height={260} />
          ) : (
            <p className="py-16 text-center text-sm text-[var(--text-secondary)]">No verified performance metrics yet. Add a performance log to populate this chart.</p>
          )}
        </Card>

        {/* Progression Trend */}
        <Card title="Performance Progression" subtitle="Chronological performance trends" className="lg:col-span-2">
          {history.length > 0 ? <PerformanceTrendChart records={history} height={260} /> : <p className="py-16 text-center text-sm text-[var(--text-secondary)]">No performance history yet. Your trend will appear after you add a session.</p>}
        </Card>
      </div>

      {/* AI Insights & Coach Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Analysis Summary */}
        <Card title="AI Intelligence Summary" icon={BrainCircuit}>
          {latestAI ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[#111C2E] border border-[#22C55E]/30">
                <span className="text-xs font-bold uppercase tracking-wider text-[#22C55E] block mb-1">Key Strengths</span>
                <p className="text-xs text-[#F8FAFC]">{latestAI.strengths || 'Consistent high performance'}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#111C2E] border border-[#F59E0B]/30">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F59E0B] block mb-1">Growth Areas</span>
                <p className="text-xs text-[#F8FAFC]">{latestAI.weaknesses || 'Maintain current routine'}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/30">
                <span className="text-xs font-bold uppercase tracking-wider text-[#06B6D4] block mb-1">Development Tip</span>
                <p className="text-xs text-[#F8FAFC] leading-relaxed">{latestAI.recommendations}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#94A3B8] py-6 text-center">Log a performance session to generate your AI talent analysis.</p>
          )}
        </Card>

        {/* Coach Recommendations */}
        <Card title="Assigned Training Drills" icon={ClipboardList}>
          {recommendations.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-[#F8FAFC]">{rec.title}</h4>
                    <Badge variant="primary" size="sm">{rec.status}</Badge>
                  </div>
                  <p className="text-xs text-[#94A3B8] mb-1 leading-relaxed">{rec.description}</p>
                  <span className="text-[10px] text-[#94A3B8]/70">Coach: {rec.coach_name || 'Assigned Coach'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#94A3B8] py-6 text-center">No coach workout recommendations currently assigned.</p>
          )}
        </Card>
      </div>

      {/* Log Modal */}
      <PerformanceLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSubmit={handleLogSubmit}
        loading={submittingLog}
      />
    </div>
  );
};
export default PlayerDashboard;
