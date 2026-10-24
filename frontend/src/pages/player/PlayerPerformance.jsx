import React, { useState, useEffect } from 'react';
import { playerService } from '../../services/playerService';
import { performanceService } from '../../services/performanceService';
import { aiService } from '../../services/aiService';
import { Plus, Trash2, TrendingUp, Video, RefreshCw, WifiOff, CheckCircle2, Clock } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import PerformanceTrendChart from '../../components/charts/PerformanceTrendChart';
import PerformanceLogModal from '../../components/player/PerformanceLogModal';
import { offlineQueue } from '../../utils/offlineQueue';
import {
  formatDate,
  getSourceTypeDetails,
  getVerificationStatusDetails,
  getConfidenceColor,
  getImageUrl
} from '../../utils/formatters';

export const PlayerPerformance = () => {
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Offline queue state
  const [offlineCount, setOfflineCount] = useState(offlineQueue.getQueue().length);
  const [isSyncing, setIsSyncing] = useState(false);

  // Video Evidence Preview Modal
  const [videoModalUrl, setVideoModalUrl] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const prof = await playerService.getMyProfile();
      setProfile(prof);

      if (prof?.id) {
        const [histData, statsData] = await Promise.all([
          performanceService.getPlayerHistory(prof.id),
          performanceService.getPlayerStats(prof.id)
        ]);
        setRecords(histData?.records || []);
        setStats(statsData);
      }
      setOfflineCount(offlineQueue.getQueue().length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-sync when back online
    const handleOnline = async () => {
      if (offlineQueue.getQueue().length > 0) {
        await handleSyncOfflineQueue();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const handleAddLog = async (data) => {
    setSubmitting(true);
    try {
      const record = await performanceService.addRecord(data);
      if (profile?.id && record?.id) {
        await aiService.predictTalent({
          ...data,
          age: profile.age || 20,
          sport: profile.sport,
          position: profile.position || 'Forward',
          player_id: profile.id,
          performance_id: record.id
        });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to add record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncOfflineQueue = async () => {
    setIsSyncing(true);
    try {
      const res = await offlineQueue.syncQueue(async (item) => {
        const record = await performanceService.addRecord(item);
        if (profile?.id && record?.id) {
          await aiService.predictTalent({
            ...item,
            age: profile.age || 20,
            sport: profile.sport,
            position: profile.position || 'Forward',
            player_id: profile.id,
            performance_id: record.id
          });
        }
      });
      alert(`Synchronized ${res.syncedCount} offline performance logs successfully!`);
      await loadData();
    } catch (err) {
      alert('Error during offline sync: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this performance record?')) return;
    try {
      await performanceService.deleteRecord(recordId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete record');
    }
  };

  if (loading) {
    return <Loader message="Loading performance history..." className="py-24" />;
  }

  const tableColumns = [
    {
      header: 'Assessment Date',
      key: 'assessment_date',
      render: (r) => (
        <div>
          <span className="font-semibold text-[#F8FAFC] block">{formatDate(r.assessment_date)}</span>
          {r.field_test_protocol && (
            <span className="text-[10px] text-[#22C55E] block">{r.field_test_protocol}</span>
          )}
        </div>
      )
    },
    {
      header: 'Data Source',
      key: 'source_type',
      render: (r) => {
        const src = getSourceTypeDetails(r.source_type);
        return (
          <Badge variant="primary" size="sm" className={src.badgeColor}>
            <span className="mr-1">{src.icon}</span> {src.label}
          </Badge>
        );
      }
    },
    {
      header: 'Data Confidence',
      key: 'data_confidence_score',
      render: (r) => {
        const score = r.data_confidence_score || 65.0;
        const colorClass = getConfidenceColor(score);
        return (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
            {score.toFixed(0)}%
          </span>
        );
      }
    },
    {
      header: 'Verification',
      key: 'verification_status',
      render: (r) => {
        const ver = getVerificationStatusDetails(r.verification_status);
        return (
          <Badge variant="primary" size="sm" className={ver.badgeColor}>
            {ver.isVerified ? (
              <CheckCircle2 className="w-3 h-3 mr-1 text-[#22C55E] inline" />
            ) : (
              <Clock className="w-3 h-3 mr-1 text-[#F59E0B] inline" />
            )}
            {ver.label}
          </Badge>
        );
      }
    },
    {
      header: 'Evidence',
      key: 'evidence_url',
      render: (r) => {
        if (r.evidence_url) {
          return (
            <Button
              onClick={() => setVideoModalUrl(getImageUrl(r.evidence_url))}
              variant="secondary"
              size="sm"
              icon={Video}
              className="text-[#06B6D4] border-[#06B6D4]/30"
            >
              View Proof
            </Button>
          );
        }
        return <span className="text-[#94A3B8] text-xs italic">No file</span>;
      }
    },
    { header: 'Speed', key: 'speed', render: (r) => <span className="text-[#06B6D4] font-bold">{r.speed}</span> },
    { header: 'Stamina', key: 'stamina', render: (r) => <span className="text-[#22C55E] font-bold">{r.stamina}</span> },
    { header: 'Strength', key: 'strength', render: (r) => <span className="text-[#F59E0B] font-bold">{r.strength}</span> },
    { header: 'Agility', key: 'agility', render: (r) => <span className="text-[#2563EB] font-bold">{r.agility}</span> },
    { header: 'Accuracy', key: 'accuracy', render: (r) => <span className="text-[#06B6D4] font-bold">{r.accuracy}</span> },
    {
      header: 'Actions',
      key: 'actions',
      render: (r) => (
        <button
          onClick={() => handleDeleteRecord(r.id)}
          className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors cursor-pointer"
          title="Delete Record"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">Performance & Evidence Tracking</h1>
          <p className="text-xs text-[#94A3B8]">Multi-source performance logging (field tests, smartphones, coach trials, wearables) with verifiable proof</p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} variant="primary" size="sm" icon={Plus}>
          Log Assessment
        </Button>
      </div>

      {/* Offline Storage Queue Banner */}
      {offlineCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-5 h-5 text-[#F59E0B] shrink-0" />
            <div>
              <span className="text-xs font-bold text-[#F59E0B] block">
                {offlineCount} Pending Offline {offlineCount === 1 ? 'Log' : 'Logs'} Stored Locally
              </span>
              <span className="text-[11px] text-[#94A3B8]">
                Logged while in rural/disconnected environment. Ready to synchronize with cloud AI.
              </span>
            </div>
          </div>

          <Button
            onClick={handleSyncOfflineQueue}
            variant="primary"
            size="sm"
            loading={isSyncing}
            icon={RefreshCw}
          >
            Sync {offlineCount} Records Now
          </Button>
        </div>
      )}

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <Card className="p-4 text-center">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Speed Avg</span>
          <span className="text-2xl font-extrabold text-[#06B6D4] font-display">{stats?.avg_speed || '--'}</span>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Stamina Avg</span>
          <span className="text-2xl font-extrabold text-[#22C55E] font-display">{stats?.avg_stamina || '--'}</span>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Strength Avg</span>
          <span className="text-2xl font-extrabold text-[#F59E0B] font-display">{stats?.avg_strength || '--'}</span>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Agility Avg</span>
          <span className="text-2xl font-extrabold text-[#2563EB] font-display">{stats?.avg_agility || '--'}</span>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Accuracy Avg</span>
          <span className="text-2xl font-extrabold text-[#06B6D4] font-display">{stats?.avg_accuracy || '--'}</span>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">Avg Confidence</span>
          <span className="text-2xl font-extrabold text-[#06B6D4] font-display">
            {stats?.avg_data_confidence_score ? `${stats.avg_data_confidence_score}%` : '--'}
          </span>
        </Card>
      </div>

      {/* Progression Trend Chart */}
      <Card title="Progression Over Time" subtitle="Visualizing metric fluctuations across sessions" icon={TrendingUp}>
        <PerformanceTrendChart records={records} height={280} />
      </Card>

      {/* History Table */}
      <Card title="Multi-Source Assessment History" subtitle="Chronological list of all verified entries with evidence status">
        {records.length > 0 ? (
          <Table columns={tableColumns} data={records} />
        ) : (
          <EmptyState
            title="No Performance Logs Found"
            description="Start by logging your first match or field test assessment."
            actionLabel="Log Assessment"
            onAction={() => setIsModalOpen(true)}
          />
        )}
      </Card>

      {/* Performance Log Modal */}
      <PerformanceLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddLog}
        loading={submitting}
      />

      {/* Video Evidence Player Modal */}
      <Modal
        isOpen={!!videoModalUrl}
        onClose={() => setVideoModalUrl(null)}
        title="Field Test Video Evidence"
        subtitle="Verifiable proof captured for athletic measurement"
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
              Close Video Proof
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PlayerPerformance;
