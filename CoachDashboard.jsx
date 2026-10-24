import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { coachService } from '../../services/coachService';
import { playerService } from '../../services/playerService';
import { performanceService } from '../../services/performanceService';
import { aiService } from '../../services/aiService';
import { videoAnalysisService } from '../../services/videoAnalysisService';
import {
  getImageUrl,
  getPotentialBadgeColor,
  getPerformanceStatusBadgeColor,
  getScoreColor,
  getConfidenceColor,
  getSourceTypeDetails,
  getVerificationStatusDetails,
  formatDate
} from '../../utils/formatters';
import {
  Scale,
  Search,
  ArrowRight,
  BrainCircuit,
  Eye,
  Activity,
  User,
  Video,
  CheckCircle2,
  Play
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Table from '../../components/common/Table';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import RecommendationModal from '../../components/coach/RecommendationModal';
import TalentRadarChart from '../../components/charts/TalentRadarChart';

export const CoachDashboard = () => {
  const [players, setPlayers] = useState([]);
  const [totalSquad, setTotalSquad] = useState(0);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drill Assignment Modal
  const [drillTargetPlayer, setDrillTargetPlayer] = useState(null);
  const [submittingRec, setSubmittingRec] = useState(false);

  // Player Details & Talent Inspection Modal
  const [inspectPlayer, setInspectPlayer] = useState(null);
  const [playerDetail, setPlayerDetail] = useState(null);
  const [playerPerformance, setPlayerPerformance] = useState(null);
  const [playerAI, setPlayerAI] = useState(null);
  const [playerVideos, setPlayerVideos] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Video & Verification
  const [videoModalUrl, setVideoModalUrl] = useState(null);
  const [videoModalTitle, setVideoModalTitle] = useState('Video Player');
  const [verifyingRecordId, setVerifyingRecordId] = useState(null);

  const loadCoachData = async () => {
    try {
      setLoading(true);
      const [playersData, recsData] = await Promise.all([
        coachService.listSquadPlayers({ limit: 10 }).catch(() => ({ total: 0, players: [] })),
        coachService.getMyRecommendations().catch(() => [])
      ]);
      setPlayers(playersData.players || []);
      setTotalSquad(playersData.total || 0);
      setRecommendations(recsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoachData();
  }, []);

  const handleInspectPlayer = async (player) => {
    setInspectPlayer(player);
    setLoadingDetail(true);
    try {
      const [detailRes, perfRes, aiRes, videosRes] = await Promise.all([
        playerService.getPlayerById(player.id).catch(() => null),
        coachService.getPlayerPerformance(player.id).catch(() => null),
        aiService.getLatestPlayerAI(player.id).catch(() => null),
        videoAnalysisService.getPlayerAssessments(player.id).catch(() => ({ assessments: [] })),
      ]);
      setPlayerDetail(detailRes);
      setPlayerPerformance(perfRes);
      setPlayerAI(aiRes);
      setPlayerVideos(videosRes?.assessments || []);
    } catch (e) {
      console.error('Error fetching player inspection:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleVerifyRecord = async (recordId) => {
    setVerifyingRecordId(recordId);
    try {
      await performanceService.verifyRecord(recordId, {
        verification_status: 'COACH_VERIFIED',
        verification_notes: 'Coach certified and verified trial metrics & physical execution.'
      });
      alert('Record verified and certified successfully!');
      if (inspectPlayer) {
        const perfRes = await coachService.getPlayerPerformance(inspectPlayer.id).catch(() => null);
        setPlayerPerformance(perfRes);
      }
    } catch (err) {
      alert(err.message || 'Failed to verify record');
    } finally {
      setVerifyingRecordId(null);
    }
  };

  const handleCreateRecommendation = async (data) => {
    if (!drillTargetPlayer) return;
    setSubmittingRec(true);
    try {
      await coachService.createRecommendation({
        ...data,
        player_id: drillTargetPlayer.id
      });
      alert('Training drill recommendation assigned successfully!');
      setDrillTargetPlayer(null);
      await loadCoachData();
    } catch (err) {
      alert(err.message || 'Failed to assign recommendation');
    } finally {
      setSubmittingRec(false);
    }
  };

  if (loading) {
    return <Loader message="Loading coach portal..." className="py-24" />;
  }

  const playerColumns = [
    {
      header: 'Player',
      key: 'name',
      render: (p) => {
        const playerName = p.name || p.user?.name || 'Athlete';
        const playerEmail = p.email || p.user?.email || '';
        const photoUrl = getImageUrl(p.profile_image);

        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0B1220] border border-[#1E293B] flex items-center justify-center shrink-0 shadow-sm">
              {photoUrl ? (
                <img src={photoUrl} alt={playerName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#2563EB]/10 text-[#2563EB] font-bold text-sm">
                  {playerName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <span className="font-bold text-[#F8FAFC] block text-sm">{playerName}</span>
              <span className="text-[11px] text-[#94A3B8]">{playerEmail}</span>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Sport & Position',
      key: 'sport',
      render: (p) => (
        <div>
          <span className="text-[#F8FAFC] font-medium block text-xs">{p.sport}</span>
          <span className="text-[11px] text-[#94A3B8]">{p.position || 'Standard'}</span>
        </div>
      )
    },
    {
      header: 'Performance Status',
      key: 'performance_status',
      render: (p) => {
        const statusText = p.performance_status || (p.latest_talent_score ? 'AI Analyzed' : (p.performance_records_count > 0 ? 'Evaluated' : 'Not Evaluated'));
        return (
          <Badge variant="primary" size="sm" className={getPerformanceStatusBadgeColor(statusText)}>
            {statusText}
          </Badge>
        );
      }
    },
    {
      header: 'AI Talent Score',
      key: 'latest_talent_score',
      render: (p) => {
        if (p.latest_talent_score !== null && p.latest_talent_score !== undefined) {
          return (
            <div className="flex items-baseline gap-1">
              <span className={`font-extrabold font-display text-sm ${getScoreColor(p.latest_talent_score)}`}>
                {Math.round(p.latest_talent_score)}
              </span>
              <span className="text-[10px] text-[#94A3B8]">/ 100</span>
            </div>
          );
        }
        return <span className="text-[#94A3B8] text-xs italic">Not analyzed</span>;
      }
    },
    {
      header: 'Potential Rating',
      key: 'latest_potential_level',
      render: (p) => {
        if (p.latest_potential_level) {
          return (
            <Badge variant="primary" size="sm" className={getPotentialBadgeColor(p.latest_potential_level)}>
              {p.latest_potential_level}
            </Badge>
          );
        }
        return <span className="text-[#94A3B8] text-xs italic">Not analyzed</span>;
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (p) => (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleInspectPlayer(p)}
            variant="secondary"
            size="sm"
            icon={Eye}
          >
            Inspect
          </Button>
          <Button
            onClick={() => setDrillTargetPlayer(p)}
            variant="ghost"
            size="sm"
          >
            Assign Drill
          </Button>
        </div>
      )
    }
  ];

  const inspectPhotoUrl = getImageUrl(inspectPlayer?.profile_image);
  const inspectPlayerName = inspectPlayer?.name || inspectPlayer?.user?.name || 'Athlete';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">Coach Control Center</h1>
          <p className="text-xs text-[#94A3B8]">Manage squad athletes, review AI talent ratings, verify field trials, and assign targeted drills</p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/coach/compare">
            <Button variant="secondary" size="sm" icon={Scale}>
              Compare Athletes
            </Button>
          </Link>
          <Link to="/coach/players">
            <Button variant="primary" size="sm" icon={Search}>
              Discover Talent
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">Squad Athletes</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#F8FAFC] font-display">{totalSquad}</span>
            <span className="text-xs text-[#94A3B8]">Registered</span>
          </div>
        </Card>

        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">Active Workout Protocols</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#06B6D4] font-display">
              {recommendations.filter(r => r.status === 'ACTIVE').length}
            </span>
            <span className="text-xs text-[#94A3B8]">In Progress</span>
          </div>
        </Card>

        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">Total Recommendations</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#2563EB] font-display">
              {recommendations.length}
            </span>
            <span className="text-xs text-[#94A3B8]">Assigned</span>
          </div>
        </Card>
      </div>

      {/* Squad Table */}
      <Card
        title="Squad Roster Snapshot"
        subtitle="Verified athletes registered in the system"
        action={
          <Link to="/coach/players" className="text-xs text-[#06B6D4] hover:text-[#06B6D4]/80 font-semibold inline-flex items-center gap-1">
            View All Squad <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        <Table columns={playerColumns} data={players} />
      </Card>

      {/* Comprehensive Player Inspection Modal */}
      <Modal
        isOpen={!!inspectPlayer}
        onClose={() => setInspectPlayer(null)}
        title={`${inspectPlayerName} — Athlete Talent Breakdown`}
        subtitle={`${inspectPlayer?.sport} • ${inspectPlayer?.position || 'Standard'}`}
        maxWidth="max-w-4xl"
      >
        {loadingDetail ? (
          <Loader message="Fetching player metrics & AI intelligence..." className="py-16" />
        ) : (
          <div className="space-y-6">
            {/* Header Identity Banner */}
            <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] flex flex-col sm:flex-row items-center gap-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#111C2E] border-2 border-[#06B6D4]/40 flex items-center justify-center shrink-0 shadow-sm">
                {inspectPhotoUrl ? (
                  <img src={inspectPhotoUrl} alt={inspectPlayerName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-[#06B6D4]" />
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-[#F8FAFC]">{inspectPlayerName}</h3>
                  <Badge variant="primary" size="sm">{inspectPlayer?.sport}</Badge>
                  <Badge
                    variant="primary"
                    size="sm"
                    className={getPerformanceStatusBadgeColor(inspectPlayer?.performance_status || (playerAI ? 'AI Analyzed' : (playerPerformance?.summary?.total_matches_played > 0 ? 'Evaluated' : 'Not Evaluated')))}
                  >
                    {inspectPlayer?.performance_status || (playerAI ? 'AI Analyzed' : (playerPerformance?.summary?.total_matches_played > 0 ? 'Evaluated' : 'Not Evaluated'))}
                  </Badge>
                </div>
                <p className="text-xs text-[#94A3B8]">
                  Position: <strong className="text-[#F8FAFC]">{inspectPlayer?.position || 'N/A'}</strong> •
                  Age: <strong className="text-[#F8FAFC]">{inspectPlayer?.age || '--'} yrs</strong> •
                  Experience: <strong className="text-[#F8FAFC]">{inspectPlayer?.experience || 0} yrs</strong> •
                  Height: <strong className="text-[#F8FAFC]">{inspectPlayer?.height ? `${inspectPlayer.height} cm` : '--'}</strong> •
                  Weight: <strong className="text-[#F8FAFC]">{inspectPlayer?.weight ? `${inspectPlayer.weight} kg` : '--'}</strong>
                </p>
                {inspectPlayer?.achievements && (
                  <p className="text-xs text-[#F59E0B] pt-1 italic">
                    🏆 {inspectPlayer.achievements}
                  </p>
                )}
              </div>

              <div className="text-center sm:text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-0.5">AI Talent Index</span>
                <div className="flex items-baseline justify-center sm:justify-end gap-1">
                  <span className={`text-3xl font-extrabold font-display ${getScoreColor(playerAI?.talent_score || 0)}`}>
                    {playerAI?.talent_score ? Math.round(playerAI.talent_score) : '--'}
                  </span>
                  <span className="text-xs text-[#94A3B8]">/ 100</span>
                </div>
                {playerAI?.potential_level ? (
                  <Badge variant="primary" size="sm" className={`mt-1 ${getPotentialBadgeColor(playerAI.potential_level)}`}>
                    {playerAI.potential_level} Potential
                  </Badge>
                ) : (
                  <span className="text-xs text-[#94A3B8] italic block mt-1">Not analyzed yet</span>
                )}
              </div>
            </div>

            {/* Performance Statistics Grid */}
            {playerPerformance?.summary?.total_matches_played > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">Speed</span>
                    <strong className="text-[#06B6D4] text-lg font-display">{playerPerformance.summary.avg_speed}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">Stamina</span>
                    <strong className="text-[#22C55E] text-lg font-display">{playerPerformance.summary.avg_stamina}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">Strength</span>
                    <strong className="text-[#F59E0B] text-lg font-display">{playerPerformance.summary.avg_strength}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">Agility</span>
                    <strong className="text-[#2563EB] text-lg font-display">{playerPerformance.summary.avg_agility}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">Accuracy</span>
                    <strong className="text-[#06B6D4] text-lg font-display">{playerPerformance.summary.avg_accuracy}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">Confidence</span>
                    <strong className="text-[#22C55E] text-lg font-display">
                      {playerPerformance.summary.avg_data_confidence_score ? `${playerPerformance.summary.avg_data_confidence_score}%` : '--'}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Radar Chart */}
                  <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
                    <h4 className="text-xs font-bold text-[#F8FAFC] mb-2 uppercase tracking-wider">5-Pillar Athletic Radar</h4>
                    <TalentRadarChart
                      speed={playerPerformance.summary.avg_speed}
                      stamina={playerPerformance.summary.avg_stamina}
                      strength={playerPerformance.summary.avg_strength}
                      agility={playerPerformance.summary.avg_agility}
                      accuracy={playerPerformance.summary.avg_accuracy}
                      height={220}
                    />
                  </div>

                  {/* AI Analysis Cards */}
                  <div className="space-y-3">
                    {playerAI ? (
                      <>
                        <div className="p-3 rounded-xl bg-[#0B1220] border border-[#22C55E]/30">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#22C55E] block mb-1">Key Strengths</span>
                          <p className="text-xs text-[#F8FAFC]">{playerAI.strengths || 'Balanced overall physical output'}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#0B1220] border border-[#F59E0B]/30">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#F59E0B] block mb-1">Growth Bottlenecks</span>
                          <p className="text-xs text-[#F8FAFC]">{playerAI.weaknesses || 'Focus on conditioning stability'}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-[#0B1220] border border-[#06B6D4]/30">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#06B6D4] block mb-1">AI Recommendation</span>
                          <p className="text-xs text-[#F8FAFC] leading-relaxed">{playerAI.recommendations}</p>
                        </div>
                      </>
                    ) : (
                      <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] text-center flex flex-col items-center justify-center h-full">
                        <BrainCircuit className="w-8 h-8 text-[#94A3B8] mb-2" />
                        <h5 className="text-xs font-bold text-[#F8FAFC] mb-1">Not Analyzed Yet</h5>
                        <p className="text-xs text-[#94A3B8]">AI analysis has not been generated for this athlete yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence & Verification Records */}
                {playerPerformance?.records?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#1E293B]">
                    <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">Multi-Source Verification History</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {playerPerformance.records.map((rec) => {
                        const src = getSourceTypeDetails(rec.source_type);
                        const ver = getVerificationStatusDetails(rec.verification_status);
                        const conf = rec.data_confidence_score || 65.0;

                        return (
                          <div key={rec.id} className="p-2.5 rounded-xl bg-[#0B1220] border border-[#1E293B] flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#F8FAFC]">{formatDate(rec.assessment_date)}</span>
                              <Badge variant="primary" size="sm" className={src.badgeColor}>
                                {src.icon} {src.label}
                              </Badge>
                              <Badge variant="primary" size="sm" className={ver.badgeColor}>
                                {ver.label}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`font-bold px-2 py-0.5 rounded-full border text-[11px] ${getConfidenceColor(conf)}`}>
                                {conf.toFixed(0)}% Conf
                              </span>

                              {rec.evidence_url && (
                                <Button
                                  onClick={() => setVideoModalUrl(getImageUrl(rec.evidence_url))}
                                  variant="secondary"
                                  size="sm"
                                  icon={Video}
                                  className="text-[#06B6D4] border-[#06B6D4]/30 text-[11px] py-1"
                                >
                                  Watch Proof
                                </Button>
                              )}

                              {!ver.isVerified && (
                                <Button
                                  onClick={() => handleVerifyRecord(rec.id)}
                                  variant="primary"
                                  size="sm"
                                  loading={verifyingRecordId === rec.id}
                                  icon={CheckCircle2}
                                  className="text-[11px] py-1"
                                >
                                  Certify & Verify
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Daily AI Video Assessments */}
                <div className="space-y-2 pt-2 border-t border-[#1E293B]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-[#06B6D4]" /> Daily AI Video Assessments ({playerVideos.length})
                    </h4>
                    <span className="text-[10px] text-[#06B6D4] font-semibold">Smartphone Biomechanical Vision</span>
                  </div>

                  {playerVideos.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {playerVideos.map((vid) => {
                        const score = vid.analysis_result?.overall_score;
                        const conf = vid.analysis_result?.analysis_confidence;
                        const isVerified = vid.status === 'VERIFIED';
                        const isRejected = vid.status === 'REJECTED' || vid.validation_status === 'REJECTED';

                        return (
                          <div key={vid.id} className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B] space-y-2 text-xs">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#F8FAFC]">{formatDate(vid.uploaded_at)}</span>
                                <Badge variant="ai" size="sm">
                                  {vid.sport} • {vid.assessment_type}
                                </Badge>
                                {isVerified ? (
                                  <Badge variant="success" size="sm">
                                    ✓ Coach Certified
                                  </Badge>
                                ) : isRejected ? (
                                  <Badge variant="danger" size="sm">
                                    ✕ Rejected
                                  </Badge>
                                ) : (
                                  <Badge variant="warning" size="sm">
                                    Pending Verification
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {score ? (
                                  <span className={`font-extrabold text-sm ${getScoreColor(score)}`}>
                                    {Math.round(score)}/100
                                  </span>
                                ) : null}

                                {conf ? (
                                  <span className={`font-bold px-2 py-0.5 rounded-full border text-[11px] ${getConfidenceColor(conf)}`}>
                                    {conf.toFixed(0)}% Conf
                                  </span>
                                ) : null}

                                <Button
                                  onClick={() => {
                                    setVideoModalTitle(`${vid.sport} • ${vid.assessment_type} — Daily Video Analysis`);
                                    setVideoModalUrl(getImageUrl(vid.video_url));
                                  }}
                                  variant="secondary"
                                  size="sm"
                                  icon={Play}
                                  className="text-[#06B6D4] border-[#06B6D4]/30 text-[11px] py-1"
                                >
                                  Watch
                                </Button>
                              </div>
                            </div>

                            {/* Coach Verification Controls */}
                            {!isVerified && !isRejected && (
                              <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#1E293B]">
                                <Button
                                  onClick={async () => {
                                    const reason = prompt('Please enter rejection reason:');
                                    if (!reason) return;
                                    try {
                                      await videoAnalysisService.rejectAssessment(vid.id, reason);
                                      if (inspectPlayer) handleInspectPlayer(inspectPlayer);
                                    } catch (e) {
                                      alert(e.message || 'Failed to reject assessment');
                                    }
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="text-[#EF4444] hover:text-[#EF4444]/80 text-[11px] py-0.5"
                                >
                                  ✕ Reject
                                </Button>
                                <Button
                                  onClick={async () => {
                                    try {
                                      await videoAnalysisService.verifyAssessment(vid.id, 'Verified by Coach');
                                      alert('Assessment certified & verified! It is now locked as permanent immutable evidence.');
                                      if (inspectPlayer) handleInspectPlayer(inspectPlayer);
                                    } catch (e) {
                                      alert(e.message || 'Failed to verify assessment');
                                    }
                                  }}
                                  variant="primary"
                                  size="sm"
                                  icon={CheckCircle2}
                                  className="text-[11px] py-0.5 bg-[#22C55E] hover:bg-[#22C55E]/80 border-[#22C55E]/40"
                                >
                                  ✓ Certify & Lock Evidence
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#94A3B8] italic">No video assessments uploaded yet by this athlete.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#0B1220] border border-[#1E293B] text-center">
                <Activity className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
                <h4 className="text-sm font-bold text-[#F8FAFC] mb-1">No Performance Data</h4>
                <p className="text-xs text-[#94A3B8] mb-4">No performance records or match sessions have been logged yet for this athlete.</p>
                <Button
                  onClick={() => {
                    setInspectPlayer(null);
                    setDrillTargetPlayer(inspectPlayer);
                  }}
                  variant="primary"
                  size="sm"
                >
                  Assign Initial Training Drill
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Recommendation Assignment Modal */}
      <RecommendationModal
        isOpen={!!drillTargetPlayer}
        onClose={() => setDrillTargetPlayer(null)}
        onSubmit={handleCreateRecommendation}
        playerName={drillTargetPlayer?.name || drillTargetPlayer?.user?.name}
        loading={submittingRec}
      />

      {/* Video Modal */}
      <Modal
        isOpen={!!videoModalUrl}
        onClose={() => setVideoModalUrl(null)}
        title="Field Test Video Proof"
        subtitle="Review physical performance evidence captured via smartphone"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden bg-black border border-[#1E293B]">
            {videoModalUrl && (
              <video src={videoModalUrl} controls autoPlay className="w-full max-h-[450px] object-contain" />
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setVideoModalUrl(null)}>
              Close Video
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default CoachDashboard;
