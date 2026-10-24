import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { coachService } from '../../services/coachService';
import {
  Calendar,
  MapPin,
  Clock,
  Award,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  ExternalLink,
  Bookmark,
  Share2,
  Send,
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';

export const EventDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  // Recommend Modal State
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [recMessage, setRecMessage] = useState('');
  const [submittingRec, setSubmittingRec] = useState(false);
  const [recSuccess, setRecSuccess] = useState('');

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await eventService.getEventDetails(id);
      setEvent(data);
    } catch (err) {
      setError(err.message || 'Unable to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
  }, [id]);

  const handleToggleBookmark = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (event.is_saved) {
        await eventService.unsaveEvent(event.id);
        setEvent(prev => ({ ...prev, is_saved: false }));
      } else {
        await eventService.saveEvent(event.id);
        setEvent(prev => ({ ...prev, is_saved: true }));
      }
    } catch (err) {
      alert(err.message || 'Unable to update bookmark');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleOpenRecommendModal = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setRecommendModalOpen(true);
    setRecSuccess('');
    try {
      const data = await coachService.getPlayers({ limit: 100 });
      const playerList = data?.players || [];
      setPlayers(playerList);
      if (playerList.length > 0) {
        setSelectedPlayerId(playerList[0].id);
      }
    } catch (err) {
      console.error('Failed to load squad athletes:', err);
    }
  };

  const handleSendRecommendation = async (e) => {
    e.preventDefault();
    if (!selectedPlayerId) return;

    try {
      setSubmittingRec(true);
      await eventService.recommendEvent(event.id, {
        player_id: parseInt(selectedPlayerId),
        message: recMessage.trim() || `Recommended for your ${event.sport} training and competition calendar.`
      });
      setRecSuccess('Event recommended to athlete successfully!');
      setTimeout(() => {
        setRecommendModalOpen(false);
        setRecSuccess('');
      }, 1800);
    } catch (err) {
      alert(err.message || 'Failed to send recommendation');
    } finally {
      setSubmittingRec(false);
    }
  };

  if (loading) {
    return <Loader message="Loading tournament details..." className="py-24" />;
  }

  if (error || !event) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto" />
        <h2 className="text-xl font-bold text-[#F8FAFC]">Event Not Found</h2>
        <p className="text-xs text-[#94A3B8]">{error || 'This event may have been removed or does not exist.'}</p>
        <Link to="/events">
          <Button variant="secondary" size="sm">Back to Event Hub</Button>
        </Link>
      </div>
    );
  }

  const startDateFormatted = new Date(event.start_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const endDateFormatted = new Date(event.end_date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const deadlineFormatted = new Date(event.registration_deadline).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb / Return */}
      <div className="flex items-center justify-between">
        <Link to="/events" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#06B6D4] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Event Hub</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShare}
            className="text-xs flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedShare ? 'Link Copied!' : 'Share'}</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleToggleBookmark}
            className={`text-xs flex items-center gap-1.5 ${event.is_saved ? 'border-[#F59E0B]/50 text-[#F59E0B] bg-[#F59E0B]/10' : ''}`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${event.is_saved ? 'fill-[#F59E0B]' : ''}`} />
            <span>{event.is_saved ? 'Saved ✓' : 'Save Event'}</span>
          </Button>

          {(user?.role === 'COACH' || user?.role === 'ADMIN') && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenRecommendModal}
              className="text-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Recommend to Player</span>
            </Button>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="p-6 sm:p-8 bg-[#111C2E] border-[#1E293B] space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="ai" className="font-bold">
            {event.sport}
          </Badge>
          <Badge variant="primary" className="font-semibold">
            {event.event_type}
          </Badge>
          <Badge variant="default" className="font-semibold">
            {event.competition_level}
          </Badge>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold ml-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>🟢 Verified Event</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] font-display tracking-tight leading-tight">
          {event.title}
        </h1>

        <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
          {event.description}
        </p>

        {/* Action Call to Action */}
        <div className="pt-4 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <Clock className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span>Registration Closes: <strong className="text-[#F8FAFC]">{deadlineFormatted}</strong></span>
          </div>

          {event.registration_url ? (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto text-sm font-bold flex items-center justify-center gap-2"
              >
                <span>Register Now (Official Portal)</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          ) : (
            <div className="text-xs font-semibold text-[#94A3B8] p-2 rounded-xl bg-[#0B1220]">
              Registration information unavailable
            </div>
          )}
        </div>
      </Card>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Columns: Schedule, Venue, Eligibility, Prizes */}
        <div className="md:col-span-2 space-y-6">
          {/* Schedule & Timing */}
          <Card title="Event Schedule & Timings" icon={Calendar}>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-2 border-b border-[#1E293B]">
                <span className="text-[#94A3B8]">Start Date</span>
                <span className="font-semibold text-[#F8FAFC]">{startDateFormatted}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1E293B]">
                <span className="text-[#94A3B8]">End Date</span>
                <span className="font-semibold text-[#F8FAFC]">{endDateFormatted}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1E293B]">
                <span className="text-[#94A3B8]">Daily Timings</span>
                <span className="font-semibold text-[#F8FAFC]">
                  {event.start_time || '09:00 AM'} – {event.end_time || '06:00 PM'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#94A3B8]">Registration Deadline</span>
                <span className="font-bold text-[#F59E0B]">{deadlineFormatted}</span>
              </div>
            </div>
          </Card>

          {/* Venue & Location */}
          <Card title="Venue & Location" icon={MapPin}>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                <span className="text-xs text-[#94A3B8] block mb-1">Stadium / Facility Venue</span>
                <span className="font-bold text-[#F8FAFC] text-base block">{event.venue}</span>
                <span className="text-xs text-[#94A3B8] block mt-0.5">
                  {event.city}, {event.state}, {event.country}
                </span>
              </div>
            </div>
          </Card>

          {/* Eligibility & Criteria */}
          <Card title="Eligibility & Requirements" icon={Users}>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                  <span className="text-xs text-[#94A3B8] block">Age Category</span>
                  <span className="font-bold text-[#F8FAFC]">
                    {event.age_min ? `${event.age_min}–${event.age_max || 'Open'} years` : 'Open to all ages'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B]">
                  <span className="text-xs text-[#94A3B8] block">Gender Eligibility</span>
                  <span className="font-bold text-[#F8FAFC]">{event.gender}</span>
                </div>
              </div>

              {event.eligibility && (
                <div className="pt-2">
                  <span className="text-xs text-[#94A3B8] block mb-1">Specific Qualification Criteria</span>
                  <p className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs text-[#F8FAFC] leading-relaxed font-medium">
                    {event.eligibility}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Financial & Prizes */}
          <Card title="Prizes & Entry Fee" icon={Award}>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between py-2 border-b border-[#1E293B]">
                <span className="text-[#94A3B8]">Entry Registration Fee</span>
                <span className="font-bold text-[#22C55E]">{event.entry_fee || 'Free Entry'}</span>
              </div>
              {event.prize_details && (
                <div className="py-2">
                  <span className="text-[#94A3B8] block mb-1">Awards & Purse Details</span>
                  <span className="font-bold text-[#06B6D4]">{event.prize_details}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Organizer Info, Verification & Source Links */}
        <div className="space-y-6">
          {/* Organizer Credentials */}
          <Card title="Organizer Details" icon={Building}>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#94A3B8] block text-[11px]">Host Organization</span>
                <span className="font-bold text-[#F8FAFC] text-sm block">{event.organizer_name}</span>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[#F8FAFC]">
                <Mail className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                <a href={`mailto:${event.contact_email}`} className="hover:underline truncate">{event.contact_email}</a>
              </div>

              <div className="flex items-center gap-2 text-[#F8FAFC]">
                <Phone className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                <a href={`tel:${event.contact_phone}`} className="hover:underline">{event.contact_phone}</a>
              </div>
            </div>
          </Card>

          {/* Verification Certificate */}
          <Card title="SportIQ Verification" icon={ShieldCheck}>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#22C55E] font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified SportIQ Listing</span>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                This event has been authenticated against official association circulars and verified by SportIQ Platform Administrators.
              </p>

              {event.source_url && (
                <div className="pt-2">
                  <a
                    href={event.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#06B6D4] hover:underline font-semibold text-[11px]"
                  >
                    <span>View Official Circular / Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Coach Recommend Modal */}
      <Modal
        isOpen={recommendModalOpen}
        onClose={() => setRecommendModalOpen(false)}
        title="Recommend Event to Athlete"
      >
        {recSuccess ? (
          <div className="p-6 text-center space-y-2 text-[#22C55E]">
            <CheckCircle2 className="w-10 h-10 mx-auto" />
            <p className="text-sm font-bold">{recSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handleSendRecommendation} className="space-y-4">
            <p className="text-xs text-[#94A3B8]">
              Select an athlete from your squad to recommend <strong>{event.title}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Select Athlete
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#2563EB]"
              >
                {players.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.user?.name} ({p.sport} - {p.position || 'Athlete'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Coach Note / Recommendation Advice
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Focus on match endurance and trial speed. Good tournament for ranking points."
                value={recMessage}
                onChange={(e) => setRecMessage(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setRecommendModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={submittingRec}>
                Send Recommendation
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default EventDetailPage;
