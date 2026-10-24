import React, { useState, useEffect } from 'react';
import { videoAnalysisService } from '../../services/videoAnalysisService';
import { playerService } from '../../services/playerService';
import {
  Video,
  Upload,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  AlertCircle,
  BrainCircuit,
  Activity,
  ShieldCheck,
  TrendingUp,
  Award,
  RefreshCw,
  Sparkles,
  Zap,
  Eye,
  Trash2,
  Lock
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Table from '../../components/common/Table';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import {
  formatDate,
  getScoreColor,
  getConfidenceColor,
  getImageUrl
} from '../../utils/formatters';

export const AIVideoAnalysis = () => {
  const [profile, setProfile] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState('Football');
  const [selectedType, setSelectedType] = useState('Sprint');
  const [notes, setNotes] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Inspection / Detail Modal State
  const [inspectAssessment, setInspectAssessment] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete Confirmation Modal State
  const [deleteTargetAssessment, setDeleteTargetAssessment] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [profRes, catalogRes, myAssessmentsRes] = await Promise.all([
        playerService.getMyProfile().catch(() => null),
        videoAnalysisService.getAssessmentCatalog().catch(() => []),
        videoAnalysisService.getMyAssessments().catch(() => ({ assessments: [], total: 0 })),
      ]);
      setProfile(profRes);
      setCatalog(catalogRes || []);
      setAssessments(myAssessmentsRes?.assessments || []);

      if (profRes?.sport) {
        setSelectedSport(profRes.sport);
      }
    } catch (err) {
      console.error('Error loading video assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentSportItem = catalog.find((c) => c.sport === selectedSport) || catalog[0];
  const typeOptions = currentSportItem
    ? currentSportItem.assessment_types.map((t) => ({ value: t.name, label: `${t.name} — ${t.description}` }))
    : [];

  useEffect(() => {
    if (typeOptions.length > 0 && !typeOptions.some((o) => o.value === selectedType)) {
      setSelectedType(typeOptions[0].value);
    }
  }, [selectedSport, catalog]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setUploadError('Video file exceeds the 100 MB size limit.');
      return;
    }

    setUploadError('');
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setUploadError('Please select a video file to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('sport', selectedSport);
      formData.append('assessment_type', selectedType);
      formData.append('file', videoFile);
      if (notes) formData.append('notes', notes);

      await videoAnalysisService.uploadVideoAssessment(formData, (percent) => {
        setUploadProgress(percent);
      });

      setIsUploadModalOpen(false);
      setVideoFile(null);
      setVideoPreviewUrl(null);
      setNotes('');
      await loadData();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload video assessment');
    } finally {
      setUploading(false);
    }
  };

  const handleInspect = async (item) => {
    setInspectAssessment(item);
    setLoadingDetail(true);
    try {
      const fullDetail = await videoAnalysisService.getAssessmentDetail(item.id);
      setInspectAssessment(fullDetail);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetAssessment) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await videoAnalysisService.deleteAssessment(deleteTargetAssessment.id);
      setDeleteTargetAssessment(null);
      await loadData();
    } catch (err) {
      setDeleteError(err.response?.data?.detail || err.message || 'Failed to delete assessment');
    } finally {
      setDeleting(false);
    }
  };

  const getVerificationStatusBadge = (r) => {
    if (r.status === 'VERIFIED') {
      return (
        <Badge variant="success" size="sm" className="font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Coach Verified
        </Badge>
      );
    }
    if (r.status === 'REJECTED' || r.validation_status === 'REJECTED') {
      return (
        <Badge variant="danger" size="sm" className="font-semibold flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Rejected
        </Badge>
      );
    }
    if (r.status === 'PENDING_VERIFICATION' || r.processing_status === 'COMPLETED') {
      return (
        <Badge variant="warning" size="sm" className="font-semibold flex items-center gap-1">
          <Clock className="w-3 h-3" /> Pending Review
        </Badge>
      );
    }
    return (
      <Badge variant="ai" size="sm" className="animate-pulse">
        {r.processing_status}
      </Badge>
    );
  };

  const validatedAssessments = assessments.filter((a) => a.validation_status === 'VALIDATED' && a.analysis_result?.overall_score);
  const completedCount = validatedAssessments.length;

  const avgPerformance = completedCount > 0
    ? Math.round(validatedAssessments.reduce((acc, curr) => acc + curr.analysis_result.overall_score, 0) / completedCount)
    : '--';

  const avgConfidence = completedCount > 0
    ? Math.round(validatedAssessments.reduce((acc, curr) => acc + curr.analysis_result.analysis_confidence, 0) / completedCount)
    : '--';

  const tableColumns = [
    {
      header: 'Assessment Date',
      key: 'uploaded_at',
      render: (r) => (
        <div>
          <span className="font-semibold text-[#F8FAFC] block">{formatDate(r.uploaded_at)}</span>
          <span className="text-[11px] text-[#94A3B8] truncate max-w-[140px] block">{r.original_filename}</span>
        </div>
      )
    },
    {
      header: 'Sport & Drill',
      key: 'assessment_type',
      render: (r) => (
        <div>
          <span className="font-bold text-[#06B6D4] block">{r.sport}</span>
          <span className="text-xs text-[#94A3B8]">{r.assessment_type}</span>
        </div>
      )
    },
    {
      header: 'Verification Status',
      key: 'status',
      render: (r) => getVerificationStatusBadge(r)
    },
    {
      header: 'Performance Score',
      key: 'overall_score',
      render: (r) => {
        if (r.validation_status === 'VALIDATED' && r.analysis_result?.overall_score) {
          const score = r.analysis_result.overall_score;
          return (
            <div className="flex items-baseline gap-1">
              <span className={`text-base font-extrabold font-display ${getScoreColor(score)}`}>
                {Math.round(score)}
              </span>
              <span className="text-[10px] text-[#94A3B8]">/ 100</span>
            </div>
          );
        }
        if (r.validation_status === 'REJECTED' || r.status === 'REJECTED') {
          return <span className="text-xs text-[#EF4444] font-semibold">Rejected (No Score)</span>;
        }
        if (r.validation_status === 'INSUFFICIENT_EVIDENCE') {
          return <span className="text-xs text-[#F59E0B] font-semibold">Insufficient Evidence</span>;
        }
        return <span className="text-xs text-[#94A3B8] italic">Validating...</span>;
      }
    },
    {
      header: 'Confidence',
      key: 'analysis_confidence',
      render: (r) => {
        if (r.analysis_result?.analysis_confidence) {
          const conf = r.analysis_result.analysis_confidence;
          return (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getConfidenceColor(conf)}`}>
              {conf.toFixed(0)}%
            </span>
          );
        }
        return <span className="text-xs text-[#94A3B8] italic">--</span>;
      }
    },
    {
      header: 'Actions',
      key: 'action',
      render: (r) => {
        const isVerified = r.status === 'VERIFIED';
        return (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handleInspect(r)}
              variant="secondary"
              size="sm"
              icon={r.validation_status === 'REJECTED' || r.status === 'REJECTED' ? AlertCircle : Play}
              className={r.validation_status === 'REJECTED' || r.status === 'REJECTED' ? 'text-[#EF4444] border-[#EF4444]/30 text-xs py-1' : 'text-[#06B6D4] border-[#06B6D4]/30 text-xs py-1'}
            >
              {r.validation_status === 'REJECTED' || r.status === 'REJECTED' ? 'Review' : 'Watch'}
            </Button>

            {isVerified ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-1 rounded-lg">
                <Lock className="w-3 h-3" /> Verified
              </span>
            ) : (
              <Button
                onClick={() => setDeleteTargetAssessment(r)}
                variant="ghost"
                size="sm"
                icon={Trash2}
                className="text-[#94A3B8] hover:text-[#EF4444] text-xs p-1.5 cursor-pointer"
                title="Delete unverified assessment"
              />
            )}
          </div>
        );
      }
    }
  ];

  if (loading) {
    return <Loader message="Loading AI video validation & assessment center..." className="py-24" />;
  }

  const isInvalid = inspectAssessment?.validation_status === 'REJECTED' || inspectAssessment?.validation_status === 'INSUFFICIENT_EVIDENCE' || inspectAssessment?.status === 'REJECTED';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight flex items-center gap-2.5">
            <Video className="w-6 h-6 text-[#06B6D4]" /> AI Video Performance Analysis
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Strict video validation gate, coach verification, and immutable evidence workflow
          </p>
        </div>

        <Button
          onClick={() => setIsUploadModalOpen(true)}
          variant="primary"
          size="sm"
          icon={Upload}
        >
          Upload Daily Assessment
        </Button>
      </div>

      {/* Fail-Safe & Immutability Principle Banner */}
      <div className="p-3.5 rounded-2xl bg-[#111C2E] border border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#06B6D4] shrink-0" />
          <span className="text-[#94A3B8]">
            <strong className="text-[#F8FAFC]">Evidence Immutability Policy:</strong> Athletes can edit or delete submissions <strong>only prior to coach verification</strong>. Once verified by a certified coach, the record becomes <strong>locked and immutable</strong> for talent scouting.
          </span>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 text-[11px] font-semibold flex items-center gap-1">
          <Lock className="w-3 h-3" /> Secure Evidence
        </span>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">Total Video Submissions</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#F8FAFC] font-display">{assessments.length}</span>
            <span className="text-xs text-[#94A3B8]">
              ({assessments.filter((a) => a.status === 'VERIFIED').length} Coach Verified)
            </span>
          </div>
        </Card>

        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">Avg Validated Performance</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#22C55E] font-display">{avgPerformance}</span>
            {avgPerformance !== '--' && <span className="text-xs text-[#94A3B8]">/ 100</span>}
          </div>
        </Card>

        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">Avg Analysis Confidence</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#06B6D4] font-display">
              {avgConfidence !== '--' ? `${avgConfidence}%` : '--'}
            </span>
            <span className="text-xs text-[#94A3B8]">Min Gate: 70%</span>
          </div>
        </Card>
      </div>

      {/* Assessment History Table */}
      <Card
        title="Daily Video Assessment History"
        subtitle="Chronological list of all uploaded training videos, verification status, and AI pros/cons breakdowns"
        action={
          <Button onClick={loadData} variant="ghost" size="sm" icon={RefreshCw}>
            Refresh
          </Button>
        }
      >
        {assessments.length > 0 ? (
          <Table columns={tableColumns} data={assessments} />
        ) : (
          <EmptyState
            icon={Video}
            title="No Video Assessments Found"
            description="Record and upload your first training drill video to receive AI biomechanical validation and coach verification."
            actionLabel="Upload Assessment Video"
            onAction={() => setIsUploadModalOpen(true)}
          />
        )}
      </Card>

      {/* Video Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Daily Video Assessment Upload"
        subtitle="Record or upload a smartphone training video for AI validation and biomechanical analysis"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#94A3B8]">Sport Discipline</label>
              <Select
                options={catalog.map((c) => ({ value: c.sport, label: c.sport }))}
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#94A3B8]">Assessment Drill Type</label>
              <Select
                options={typeOptions}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Video className="w-4 h-4 text-[#06B6D4]" /> Select Training Video (MP4, MOV, WEBM)
              </span>
              <span className="text-[10px] text-[#94A3B8]">Max size: 100 MB</span>
            </div>

            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30 text-xs font-bold cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              {videoFile ? `Selected: ${videoFile.name}` : 'Choose Video File from Device'}
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>

            {videoPreviewUrl && (
              <div className="rounded-xl overflow-hidden max-h-48 border border-[#1E293B] bg-black">
                <video src={videoPreviewUrl} controls className="w-full max-h-48 object-contain" />
              </div>
            )}
          </div>

          <Input
            label="Optional Training Notes"
            placeholder="e.g. Grass pitch, dry weather, testing lateral speed"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {uploadError && (
            <p className="text-xs text-[#EF4444] flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {uploadError}
            </p>
          )}

          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-[#F8FAFC]">
                <span>Uploading Video File...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#1E293B] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-[#06B6D4] transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <Button variant="secondary" size="sm" onClick={() => setIsUploadModalOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={uploading} icon={Upload}>
              Submit for AI Analysis
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTargetAssessment}
        onClose={() => setDeleteTargetAssessment(null)}
        title="Delete Assessment Submission?"
        subtitle="This action will permanently remove the uploaded video and its unverified AI analysis"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#111C2E] border border-[#EF4444]/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
            <div className="text-xs text-[#F8FAFC] space-y-1">
              <p className="font-semibold text-[#EF4444]">Are you sure you want to delete this assessment?</p>
              <p className="text-[#94A3B8]">
                {deleteTargetAssessment?.sport} • {deleteTargetAssessment?.assessment_type} ({deleteTargetAssessment?.original_filename})
              </p>
              <p className="text-[11px] text-[#94A3B8]">
                Your uploaded video file and unverified biomechanical results will be permanently removed from storage.
              </p>
            </div>
          </div>

          {deleteError && (
            <p className="text-xs text-[#EF4444] flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {deleteError}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1E293B]">
            <Button variant="secondary" size="sm" onClick={() => setDeleteTargetAssessment(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
              onClick={handleDeleteConfirm}
              icon={Trash2}
            >
              Delete Assessment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Inspection & AI Results Modal */}
      <Modal
        isOpen={!!inspectAssessment}
        onClose={() => setInspectAssessment(null)}
        title={`${inspectAssessment?.sport} • ${inspectAssessment?.assessment_type} — Video Performance Analysis`}
        subtitle={`Assessment ID: #${inspectAssessment?.id} • Logged ${formatDate(inspectAssessment?.uploaded_at)}`}
        maxWidth="max-w-4xl"
      >
        {loadingDetail ? (
          <Loader message="Loading video validation gates and AI biomechanical intelligence..." className="py-16" />
        ) : isInvalid ? (
          <div className="space-y-5">
            <div className="rounded-2xl overflow-hidden bg-black border border-[#1E293B] max-h-64">
              {inspectAssessment?.video_url && (
                <video
                  src={getImageUrl(inspectAssessment.video_url)}
                  controls
                  className="w-full h-64 object-contain"
                />
              )}
            </div>

            <div className="p-5 rounded-2xl bg-[#111C2E] border border-[#EF4444]/30 space-y-3">
              <div className="flex items-center gap-2.5 text-[#EF4444]">
                <XCircle className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">
                    {inspectAssessment?.status === 'REJECTED' && inspectAssessment?.rejection_reason
                      ? 'Assessment Rejected by Coach'
                      : inspectAssessment?.validation_status === 'INSUFFICIENT_EVIDENCE'
                      ? 'Insufficient Evidence for Reliable Analysis'
                      : 'Video Not Suitable for Reliable Analysis'}
                  </h3>
                  <span className="text-xs text-[#EF4444] font-medium">
                    Selected Target: <strong>{inspectAssessment?.sport} → {inspectAssessment?.assessment_type}</strong>
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0B1220] border border-[#EF4444]/20 text-xs text-[#F8FAFC] leading-relaxed">
                <strong className="text-[#EF4444] block mb-1">
                  {inspectAssessment?.status === 'REJECTED' && inspectAssessment?.rejection_reason ? 'Coach Rejection Feedback:' : 'Validation Failure Reason:'}
                </strong>
                {inspectAssessment?.rejection_reason || inspectAssessment?.validation_reason || 'The uploaded video did not pass the minimum video validation gates.'}
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1E293B] text-xs text-[#94A3B8]">
                <span className="font-bold text-[#F8FAFC] block">To ensure successful AI biomechanical analysis, please upload a video that:</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#94A3B8]">
                  <li className="flex items-center gap-1.5 text-[#22C55E]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Shows exactly one focal athlete
                  </li>
                  <li className="flex items-center gap-1.5 text-[#22C55E]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Shows complete body from head to toe
                  </li>
                  <li className="flex items-center gap-1.5 text-[#22C55E]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Has adequate natural or ground lighting
                  </li>
                  <li className="flex items-center gap-1.5 text-[#22C55E]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Uses a stable camera without excessive shake
                  </li>
                  <li className="flex items-center gap-1.5 text-[#22C55E]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Has duration of at least 3-5 seconds
                  </li>
                  <li className="flex items-center gap-1.5 text-[#22C55E]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Matches {inspectAssessment?.sport} {inspectAssessment?.assessment_type}
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
              <Button variant="secondary" size="sm" onClick={() => setInspectAssessment(null)}>
                Close
              </Button>

              <Button
                onClick={() => {
                  setSelectedSport(inspectAssessment.sport);
                  setSelectedType(inspectAssessment.assessment_type);
                  setInspectAssessment(null);
                  setIsUploadModalOpen(true);
                }}
                variant="primary"
                size="sm"
                icon={Upload}
              >
                Upload Correct Video
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Video Player & Score Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 rounded-2xl overflow-hidden bg-black border border-[#1E293B] max-h-72">
                {inspectAssessment?.video_url && (
                  <video
                    src={getImageUrl(inspectAssessment.video_url)}
                    controls
                    autoPlay
                    className="w-full h-72 object-contain"
                  />
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#111C2E] border border-[#1E293B] flex flex-col justify-between space-y-4 shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#94A3B8] block mb-1">
                    AI Performance Score
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-extrabold font-display ${getScoreColor(inspectAssessment?.analysis_result?.overall_score || 0)}`}>
                      {inspectAssessment?.analysis_result?.overall_score ? Math.round(inspectAssessment.analysis_result.overall_score) : '--'}
                    </span>
                    <span className="text-xs text-[#94A3B8]">/ 100</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#06B6D4]" /> Analysis Confidence
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded-full border text-xs ${getConfidenceColor(inspectAssessment?.analysis_result?.analysis_confidence || 85)}`}>
                      {inspectAssessment?.analysis_result?.analysis_confidence ? `${inspectAssessment.analysis_result.analysis_confidence}%` : '--'}
                    </span>
                  </div>
                  <div className="w-full bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-[#06B6D4]"
                      style={{ width: `${inspectAssessment?.analysis_result?.analysis_confidence || 80}%` }}
                    />
                  </div>
                </div>

                {inspectAssessment?.status === 'VERIFIED' ? (
                  <div className="p-2.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-[11px] text-[#22C55E] space-y-0.5">
                    <span className="font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Immutable Certified Evidence
                    </span>
                    <p className="text-[#94A3B8] text-[10px]">
                      Verified by certified coach on {formatDate(inspectAssessment.verified_at)}.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[11px] text-[#F59E0B]">
                    <span className="font-bold flex items-center gap-1 mb-0.5">
                      <Clock className="w-3.5 h-3.5" /> Pending Coach Verification
                    </span>
                    <p className="text-[#94A3B8] text-[10px]">
                      Editable and deletable until certified by your coach.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-Scores */}
            {inspectAssessment?.analysis_result && (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">Movement Score</span>
                  <strong className="text-[#06B6D4] text-xl font-display">
                    {inspectAssessment.analysis_result.movement_score}
                  </strong>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">Technique Score</span>
                  <strong className="text-[#22C55E] text-xl font-display">
                    {inspectAssessment.analysis_result.technique_score}
                  </strong>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                  <span className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">Consistency Score</span>
                  <strong className="text-[#2563EB] text-xl font-display">
                    {inspectAssessment.analysis_result.consistency_score}
                  </strong>
                </div>
              </div>
            )}

            {/* Observable Metrics */}
            {inspectAssessment?.analysis_result?.observable_metrics && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#06B6D4]" /> Observable Biomechanical Metrics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {inspectAssessment.analysis_result.observable_metrics.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-[#1E293B] bg-[#0B1220]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-[#F8FAFC]">{m.metric_name}</span>
                        {m.is_observable ? (
                          <Badge variant="ai" size="sm" className="text-[9px]">
                            {m.value} {m.unit}
                          </Badge>
                        ) : (
                          <span className="text-[9px] text-[#94A3B8] italic">Not from video</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#94A3B8] leading-tight">{m.status_note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structured Strengths */}
            {inspectAssessment?.analysis_result?.structured_strengths && inspectAssessment.analysis_result.structured_strengths.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#22C55E] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#22C55E]" /> Identified Strengths (Pros Analysis)
                </h4>
                <div className="space-y-3">
                  {inspectAssessment.analysis_result.structured_strengths.map((s, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#0B1220] border border-[#22C55E]/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center text-xs font-mono font-bold">
                            {idx + 1}
                          </span>
                          {s.name}
                        </span>
                        <Badge variant="success" size="sm" className="text-[10px]">
                          {s.evidence_level} Evidence
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="text-[#F8FAFC]">
                          <strong className="text-[#22C55E]">AI Observation: </strong>
                          {s.observation}
                        </p>
                        <p className="text-[#94A3B8] pt-1 border-t border-[#1E293B]">
                          <strong className="text-[#06B6D4]">Why it matters: </strong>
                          {s.why_it_matters}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structured Weaknesses */}
            {inspectAssessment?.analysis_result?.structured_weaknesses && inspectAssessment.analysis_result.structured_weaknesses.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#F59E0B]" /> Areas for Improvement (Cons & Drill Prescriptions)
                </h4>
                <div className="space-y-3">
                  {inspectAssessment.analysis_result.structured_weaknesses.map((w, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#0B1220] border border-[#F59E0B]/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center text-xs font-mono font-bold">
                            {idx + 1}
                          </span>
                          {w.area}
                        </span>
                        <Badge variant="warning" size="sm" className="text-[10px]">
                          {w.evidence_level} Priority
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="text-[#F8FAFC]">
                          <strong className="text-[#F59E0B]">AI Observation: </strong>
                          {w.observation}
                        </p>
                        <p className="text-[#94A3B8]">
                          <strong className="text-[#F8FAFC]">Why it matters: </strong>
                          {w.why_it_matters}
                        </p>
                        <div className="p-2.5 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#F8FAFC] text-[11px] flex items-start gap-1.5 mt-1.5">
                          <Zap className="w-3.5 h-3.5 text-[#06B6D4] shrink-0 mt-0.5" />
                          <span><strong>Actionable Drill Prescription:</strong> {w.recommendation}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-[#1E293B]">
              <Button variant="secondary" size="sm" onClick={() => setInspectAssessment(null)}>
                Close Assessment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AIVideoAnalysis;
