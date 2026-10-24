import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Eye,
  AlertCircle,
  FileEdit
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';

export const EventVerificationPage = () => {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState('APPROVE');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadPendingEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.adminGetPendingEvents();
      setPendingEvents(data || []);
    } catch (err) {
      console.error('Failed to load pending events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingEvents();
  }, []);

  const openReviewModal = (event, defaultAction = 'APPROVE') => {
    setSelectedEvent(event);
    setReviewAction(defaultAction);
    setAdminNotes(defaultAction === 'APPROVE' ? 'Verified and certified by SportIQ Admin.' : '');
    setReviewModalOpen(true);
  };

  const handleExecuteReview = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setProcessing(true);
    try {
      if (reviewAction === 'APPROVE') {
        await eventService.adminApproveEvent(selectedEvent.id);
      } else if (reviewAction === 'REJECT') {
        await eventService.adminRejectEvent(selectedEvent.id, adminNotes);
      } else if (reviewAction === 'REQUEST_CHANGES') {
        await eventService.adminRequestChanges(selectedEvent.id, adminNotes);
      }

      setPendingEvents(prev => prev.filter(ev => ev.id !== selectedEvent.id));
      setReviewModalOpen(false);
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <Loader message="Loading event verification queue..." className="py-24" />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Event Verification Pipeline
            </h1>
            <Badge variant="primary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
              {pendingEvents.length} Pending Review
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authenticate organizer-submitted tournaments and circulars before publishing to the public Event Hub.
          </p>
        </div>

        <Link to="/admin/events">
          <Button variant="secondary" size="sm">All Sports Events</Button>
        </Link>
      </div>

      {pendingEvents.length > 0 ? (
        <div className="space-y-4">
          {pendingEvents.map(event => (
            <Card
              key={event.id}
              className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 shadow-sm transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white">{event.title}</span>
                    <Badge variant="primary" size="sm">{event.sport}</Badge>
                    <Badge variant="secondary" size="sm">{event.competition_level}</Badge>
                    <Badge variant="primary" size="sm" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                      Pending Verification
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <div className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span className="truncate">{event.organizer_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      <span>Starts {new Date(event.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{event.city}, {event.state}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Deadline: {new Date(event.registration_deadline).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {event.source_url && (
                    <div className="pt-1">
                      <a
                        href={event.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                      >
                        <span>Inspect Official Source / Circular PDF</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Verification Actions */}
                <div className="flex flex-wrap lg:flex-col items-stretch gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 border-emerald-600"
                    onClick={() => openReviewModal(event, 'APPROVE')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Approve & Publish</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    onClick={() => openReviewModal(event, 'REQUEST_CHANGES')}
                  >
                    <FileEdit className="w-3.5 h-3.5 mr-1" />
                    <span>Request Changes</span>
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    className="text-xs"
                    onClick={() => openReviewModal(event, 'REJECT')}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    <span>Reject</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Verification Queue Clean</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All submitted sports events have been reviewed. New organizer submissions will appear here for verification.
          </p>
        </Card>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={
          reviewAction === 'APPROVE'
            ? 'Approve & Publish Event'
            : reviewAction === 'REJECT'
            ? 'Reject Event Submission'
            : 'Request Changes from Organizer'
        }
      >
        <form onSubmit={handleExecuteReview} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px]">Event Title</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedEvent?.title}</span>
            <span className="text-slate-500 block mt-0.5">{selectedEvent?.organizer_name} • {selectedEvent?.city}, {selectedEvent?.state}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Admin Verification Note / Feedback
            </label>
            <textarea
              rows={3}
              required={reviewAction !== 'APPROVE'}
              placeholder={
                reviewAction === 'APPROVE'
                  ? 'Optional verification certificate note...'
                  : 'Specify reason for rejection or required changes...'
              }
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={reviewAction === 'APPROVE' ? 'primary' : 'danger'}
              size="sm"
              loading={processing}
            >
              Confirm {reviewAction === 'APPROVE' ? 'Approval' : reviewAction === 'REJECT' ? 'Rejection' : 'Change Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventVerificationPage;
