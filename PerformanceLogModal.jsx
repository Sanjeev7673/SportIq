import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Select from '../common/Select';
import { Activity, Video, Upload, CheckCircle2, Wifi, WifiOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { performanceService } from '../../services/performanceService';
import { offlineQueue } from '../../utils/offlineQueue';

const FIELD_TEST_PRESETS = [
  { value: '30m Sprint', label: '⏱️ 30m Sprint (Speed / Acceleration)' },
  { value: 'Beep Test (Multi-Stage)', label: '🏃 Beep Test / Yo-Yo (Stamina / VO2 Max)' },
  { value: 'Standing Long Jump', label: '🦘 Standing Long Jump (Lower Body Explosiveness)' },
  { value: 'Illinois Agility Drill', label: '⚡ Illinois Agility Test (Change of Direction)' },
  { value: 'Target Accuracy Drill', label: '🎯 Standardized Precision Shooting / Serving' },
];

const SOURCE_OPTIONS = [
  { value: 'STANDARDIZED_FIELD_TEST', label: '⏱️ Standardized Field Test (Recommended for Rural/Field)' },
  { value: 'SMARTPHONE_DERIVED', label: '📱 Smartphone Sensor / Camera Timing' },
  { value: 'COACH_VERIFIED', label: '📋 Coach Certified Physical Trial' },
  { value: 'WEARABLE_DEVICE', label: '⌚ Optional Wearable / Smartwatch' },
  { value: 'SELF_REPORTED_MANUAL', label: '✍️ Self-Reported Entry (Unverified)' },
];

export const PerformanceLogModal = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    speed: 80,
    stamina: 80,
    strength: 80,
    agility: 80,
    accuracy: 80,
    matches_played: 1,
    assessment_date: new Date().toISOString().split('T')[0],
    source_type: 'STANDARDIZED_FIELD_TEST',
    field_test_protocol: '30m Sprint',
    evidence_url: '',
    verification_notes: ''
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [evidencePreview, setEvidencePreview] = useState(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: ['speed', 'stamina', 'strength', 'agility', 'accuracy', 'matches_played'].includes(field)
        ? Number(val)
        : val
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError('');
    setEvidenceFile(file);

    // Create local object URL for preview
    const previewUrl = URL.createObjectURL(file);
    setEvidencePreview(previewUrl);

    if (isOnline) {
      setUploadingEvidence(true);
      try {
        const res = await performanceService.uploadEvidence(file);
        setFormData((prev) => ({ ...prev, evidence_url: res.data?.evidence_url || res.evidence_url }));
      } catch (err) {
        setUploadError(err.message || 'Failed to upload evidence file');
      } finally {
        setUploadingEvidence(false);
      }
    }
  };

  const calculateEstimatedConfidence = () => {
    let base = 50;
    if (formData.source_type === 'COACH_VERIFIED') base = 92;
    else if (formData.source_type === 'WEARABLE_DEVICE') base = 82;
    else if (formData.source_type === 'SMARTPHONE_DERIVED') base = 75;
    else if (formData.source_type === 'STANDARDIZED_FIELD_TEST') base = 68;
    else if (formData.source_type === 'SELF_REPORTED_MANUAL') base = 40;

    if (formData.evidence_url || evidenceFile) {
      if (formData.source_type === 'STANDARDIZED_FIELD_TEST') base += 20;
      else if (formData.source_type === 'SELF_REPORTED_MANUAL') base += 25;
      else base += 10;
    }
    if (formData.field_test_protocol) base += 5;
    return Math.min(Math.round(base), 98);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isOnline) {
      // Offline fallback: save to offlineQueue
      offlineQueue.addLog(formData);
      alert('Offline Mode Active: Performance log saved locally. It will automatically sync when you reconnect to the internet.');
      onClose();
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      // If network fails during submit, queue offline
      offlineQueue.addLog(formData);
      alert('Network unavailable: Session saved locally and queued for synchronization.');
      onClose();
    }
  };

  const estConfidence = calculateEstimatedConfidence();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Performance Assessment"
      subtitle="Device-inclusive performance logging with multi-source evidence verification"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Connectivity Banner */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
          isOnline
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            <span>
              {isOnline
                ? 'Online Mode: Real-time validation & AI assessment'
                : 'Offline Mode (Rural/Field): Data will be safely stored on your device and synced when connected'}
            </span>
          </div>
        </div>

        {/* Data Source Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Performance Data Source
          </label>
          <Select
            options={SOURCE_OPTIONS}
            value={formData.source_type}
            onChange={(e) => handleChange('source_type', e.target.value)}
          />
        </div>

        {/* Standardized Field Test Protocol Selection */}
        {formData.source_type === 'STANDARDIZED_FIELD_TEST' && (
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Standardized Field Protocol Preset
            </label>
            <Select
              options={FIELD_TEST_PRESETS}
              value={formData.field_test_protocol}
              onChange={(e) => handleChange('field_test_protocol', e.target.value)}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-1">
              Standard field test protocols use stopwatches, cones, and marked distances available at any sports ground.
            </p>
          </div>
        )}

        {/* Physical Metric Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Input
            label="Speed (0 - 100)"
            type="number"
            min="0"
            max="100"
            required
            value={formData.speed}
            onChange={(e) => handleChange('speed', e.target.value)}
          />
          <Input
            label="Stamina (0 - 100)"
            type="number"
            min="0"
            max="100"
            required
            value={formData.stamina}
            onChange={(e) => handleChange('stamina', e.target.value)}
          />
          <Input
            label="Strength (0 - 100)"
            type="number"
            min="0"
            max="100"
            required
            value={formData.strength}
            onChange={(e) => handleChange('strength', e.target.value)}
          />
          <Input
            label="Agility (0 - 100)"
            type="number"
            min="0"
            max="100"
            required
            value={formData.agility}
            onChange={(e) => handleChange('agility', e.target.value)}
          />
          <Input
            label="Accuracy (0 - 100)"
            type="number"
            min="0"
            max="100"
            required
            value={formData.accuracy}
            onChange={(e) => handleChange('accuracy', e.target.value)}
          />
          <Input
            label="Matches / Sessions"
            type="number"
            min="0"
            required
            value={formData.matches_played}
            onChange={(e) => handleChange('matches_played', e.target.value)}
          />
        </div>

        {/* Video / Evidence Upload Section */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Attach Smartphone Video Proof
            </span>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">Boosts Data Confidence by +20%</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 text-xs font-semibold cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              {uploadingEvidence ? 'Uploading Video...' : 'Select Video / Photo Proof'}
              <input
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploadingEvidence}
              />
            </label>

            {evidenceFile && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {evidenceFile.name} ({(evidenceFile.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            )}
          </div>

          {uploadError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
            </p>
          )}

          {evidencePreview && evidenceFile?.type?.startsWith('video/') && (
            <div className="mt-2 rounded-xl overflow-hidden max-h-36 border border-slate-300 dark:border-slate-800 bg-black">
              <video src={evidencePreview} controls className="w-full h-36 object-cover" />
            </div>
          )}
        </div>

        {/* Assessment Date & Verification Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Assessment Date"
            type="date"
            required
            value={formData.assessment_date}
            onChange={(e) => handleChange('assessment_date', e.target.value)}
          />
          <Input
            label="Field Notes / Protocol Details"
            placeholder="e.g., Grass field, dry weather, hand timing"
            value={formData.verification_notes}
            onChange={(e) => handleChange('verification_notes', e.target.value)}
          />
        </div>

        {/* Estimated Data Confidence Preview Card */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Projected Data Confidence</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Calculated via data source and evidence verification</span>
            </div>
          </div>
          <span className={`text-base font-extrabold font-display px-3 py-1 rounded-xl border ${
            estConfidence >= 85
              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
              : estConfidence >= 70
              ? 'text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
              : 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
          }`}>
            {estConfidence}%
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading || uploadingEvidence}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={loading || uploadingEvidence}
            icon={Activity}
          >
            {isOnline ? 'Submit & Run AI Assessment' : 'Save Locally to Offline Queue'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PerformanceLogModal;
