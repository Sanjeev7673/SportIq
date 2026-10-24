import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { eventService } from '../../services/eventService';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Calendar,
  MapPin,
  Building,
  Award,
  Users,
  FileText,
  ArrowLeft,
  Check,
  AlertCircle,
  FileEdit
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';

export const EventReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('APPROVE');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getEvent(id);
      setEvent(data);
    } catch (err) {
      setError(err.message || 'Unable to load event details for review');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id]);

  const openActionModal = (type) => {
    setActionType(type);
    setAdminNotes(type === 'APPROVE' ? 'Verified against official association circular and certified by SportIQ Admin.' : '');
    setActionModalOpen(true);
  };

  const handleExecuteAction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (actionType === 'APPROVE') {
        await eventService.adminApproveEvent(id);
        setActionSuccess('Event approved and published to the public Event Hub!');
      } else if (actionType === 'REJECT') {
        await eventService.adminRejectEvent(id, adminNotes);
        setActionSuccess('Event submission rejected.');
      } else if (actionType === 'REQUEST_CHANGES') {
        await eventService.adminRequestChanges(id, adminNotes);
        setActionSuccess('Changes requested from organizer.');
      }

      setTimeout(() => {
        navigate('/admin/events/verification');
      }, 1800);
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading event details for verification..." className="py-24" />;
  }

  if (error || !event) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Event Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'This event may have been deleted.'}</p>
        <Link to="/admin/events/verification">
          <Button variant="secondary" size="sm">Back to Verification Queue</Button>
        </Link>
      </div>
    );
  }

  const startDateFormatted = new Date(event.start_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const endDateFormatted = new Date(event.end_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const deadlineFormatted = new Date(event.registration_deadline).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back Link */}
      <div>
        <Link
          to="/admin/events/verification"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Event Verification Queue</span>
        </Link>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header Banner */}
      <Card className="p-6 sm:p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary" className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30 font-bold">
              {event.sport}
            </Badge>
            <Badge variant="secondary" className="font-semibold">
              {event.event_type}
            </Badge>
            <Badge variant="primary" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 font-semibold">
              {event.competition_level}
            </Badge>
          </div>

          <Badge variant="primary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-bold">
            Status: {event.status}
          </Badge>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
          {event.title}
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {event.description}
        </p>

        {/* Verification Action Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Submitted by: <strong className="text-slate-900 dark:text-white">{event.organizer_name}</strong>
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-500 border-emerald-600 font-bold text-xs"
              onClick={() => openActionModal('APPROVE')}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              <span>[ ✓ Approve & Publish ]</span>
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="font-bold text-xs"
              onClick={() => openActionModal('REQUEST_CHANGES')}
            >
              <FileEdit className="w-4 h-4 mr-1.5" />
              <span>[ Request Changes ]</span>
            </Button>

            <Button
              variant="danger"
              size="md"
              className="font-bold text-xs"
              onClick={() => openActionModal('REJECT')}
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              <span>[ ✕ Reject ]</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Verification Inspection Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Schedule, Location, Eligibility */}
        <div className="md:col-span-2 space-y-6">
          <Card title="✓ Schedule & Timings Inspection" icon={Calendar}>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Tournament Dates</span>
                <span className="font-semibold text-slate-900 dark:text-white">{startDateFormatted} — {endDateFormatted}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Daily Timing</span>
                <span className="font-semibold text-slate-900 dark:text-white">{event.start_time || '08:30 AM'} to {event.end_time || '06:00 PM'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Registration Deadline</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{deadlineFormatted}</span>
              </div>
            </div>
          </Card>

          <Card title="✓ Venue & Location Verification" icon={MapPin}>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-400 block mb-0.5">Stadium Facility</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm block">{event.venue}</span>
              <span className="text-slate-600 dark:text-slate-300 block mt-0.5">{event.city}, {event.state}, {event.country}</span>
            </div>
          </Card>

          <Card title="✓ Eligibility & Awards" icon={Users}>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">Age Eligibility</span>
                  <span className="font-bold text-slate-900 dark:text-white">{event.age_min ? `${event.age_min}–${event.age_max || 'Open'} yrs` : 'All ages'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block">Gender Eligibility</span>
                  <span className="font-bold text-slate-900 dark:text-white">{event.gender}</span>
                </div>
              </div>

              {event.eligibility && (
                <div>
                  <span className="text-slate-400 block mb-1">Eligibility Criteria</span>
                  <p className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {event.eligibility}
                  </p>
                </div>
              )}

              <div className="flex justify-between py-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Entry Fee:</span>
                <span className="font-bold text-emerald-600">{event.entry_fee || 'Free'}</span>
              </div>

              {event.prize_details && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Prize Details:</span>
                  <span className="font-bold text-purple-600">{event.prize_details}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Organizer & External Link Authentications */}
        <div className="space-y-6">
          <Card title="✓ Organizer Credentials" icon={Building}>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Organization Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{event.organizer_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Contact Email</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{event.contact_email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{event.contact_phone}</span>
              </div>
            </div>
          </Card>

          <Card title="✓ Links & Source Circular" icon={ShieldCheck}>
            <div className="space-y-3 text-xs">
              {event.registration_url ? (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Official Registration Link</span>
                  <a
                    href={event.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                  >
                    <span>Test Registration Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <span className="text-slate-400">No external registration link provided.</span>
              )}

              {event.source_url && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[11px] mb-1">Official Circular PDF</span>
                  <a
                    href={event.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline font-bold"
                  >
                    <span>Inspect Official Source Circular</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Action Execution Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={
          actionType === 'APPROVE' ? 'Approve & Publish Sports Event' :
          actionType === 'REJECT' ? 'Reject Event Submission' :
          'Request Changes from Organizer'
        }
      >
        <form onSubmit={handleExecuteAction} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Admin Verification Note
            </label>
            <textarea
              rows={3}
              required={actionType !== 'APPROVE'}
              placeholder="Specify verification confirmation or required modification details..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setActionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={actionType === 'APPROVE' ? 'primary' : 'danger'}
              size="sm"
              loading={submitting}
            >
              Confirm {actionType === 'APPROVE' ? 'Publication' : actionType === 'REJECT' ? 'Rejection' : 'Change Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventReviewPage;
