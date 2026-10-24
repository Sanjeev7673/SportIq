import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  MapPin,
  Clock,
  Award,
  Building,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { DEFAULT_SPORTS, EVENT_TYPES, COMPETITION_LEVELS, INDIAN_STATES } from '../../utils/constants';

export const CreateEditEventPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    sport: DEFAULT_SPORTS[0],
    event_type: EVENT_TYPES[0],
    description: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    start_time: '08:30 AM',
    end_time: '06:00 PM',
    venue: '',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    country: 'India',
    age_min: '',
    age_max: '',
    gender: 'All',
    competition_level: 'District',
    entry_fee: 'Free',
    prize_details: '',
    eligibility: '',
    organizer_name: user?.name || '',
    contact_email: user?.email || '',
    contact_phone: user?.phone_number || '',
    registration_url: '',
    source_url: '',
    poster_url: '',
    save_as_draft: false
  });

  useEffect(() => {
    if (isEditMode) {
      const loadEventData = async () => {
        try {
          setLoading(true);
          const data = await eventService.organizerGetEvent(id);
          setFormData({
            title: data.title || '',
            sport: data.sport || DEFAULT_SPORTS[0],
            event_type: data.event_type || EVENT_TYPES[0],
            description: data.description || '',
            start_date: data.start_date || '',
            end_date: data.end_date || '',
            registration_deadline: data.registration_deadline || '',
            start_time: data.start_time || '08:30 AM',
            end_time: data.end_time || '06:00 PM',
            venue: data.venue || '',
            city: data.city || '',
            state: data.state || 'Tamil Nadu',
            country: data.country || 'India',
            age_min: data.age_min ?? '',
            age_max: data.age_max ?? '',
            gender: data.gender || 'All',
            competition_level: data.competition_level || 'District',
            entry_fee: data.entry_fee || '',
            prize_details: data.prize_details || '',
            eligibility: data.eligibility || '',
            organizer_name: data.organizer_name || '',
            contact_email: data.contact_email || '',
            contact_phone: data.contact_phone || '',
            registration_url: data.registration_url || '',
            source_url: data.source_url || '',
            poster_url: data.poster_url || '',
            save_as_draft: data.status === 'DRAFT'
          });
        } catch (err) {
          setError(err.message || 'Failed to load event for editing');
        } finally {
          setLoading(false);
        }
      };
      loadEventData();
    }
  }, [id, isEditMode]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e, asDraft = false) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.title.trim()) {
      setError('Please provide an Event Title.');
      return;
    }
    if (!formData.venue.trim() || !formData.city.trim()) {
      setError('Please provide venue and city location details.');
      return;
    }
    if (!formData.start_date || !formData.end_date || !formData.registration_deadline) {
      setError('Please complete start date, end date, and registration deadline.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        age_min: formData.age_min ? parseInt(formData.age_min) : null,
        age_max: formData.age_max ? parseInt(formData.age_max) : null,
        save_as_draft: asDraft
      };

      if (isEditMode) {
        if (user?.role === 'ADMIN') {
          await eventService.adminUpdateEvent(id, payload);
        } else {
          await eventService.organizerUpdateEvent(id, payload);
        }
        setSuccessMessage('Event updated successfully.');
      } else {
        if (user?.role === 'ADMIN') {
          await eventService.adminCreateEvent(payload);
          setSuccessMessage('Event created and published as verified!');
        } else {
          await eventService.organizerCreateEvent(payload);
          setSuccessMessage('Your event has been submitted and is waiting for SportIQ admin verification.');
        }
      }

      setTimeout(() => {
        if (user?.role === 'ADMIN') {
          navigate('/admin/events');
        } else {
          navigate('/organizer/events');
        }
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading event details..." className="py-24" />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Return link */}
      <div>
        <Link
          to={user?.role === 'ADMIN' ? '/admin/events' : '/organizer/events'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#06B6D4] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events List</span>
        </Link>
      </div>

      <div className="pb-2 border-b border-[#1E293B]">
        <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">
          {isEditMode ? 'Edit Sports Event' : 'Host / Submit New Sports Event'}
        </h1>
        <p className="text-xs text-[#94A3B8]">
          {user?.role === 'ADMIN'
            ? 'Administrator direct event publishing and catalog management.'
            : 'Submitted events are reviewed and verified by SportIQ administrators before public publication.'}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center gap-2 text-xs font-semibold text-[#EF4444]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center gap-2 text-xs font-semibold text-[#22C55E]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Basic Information */}
        <Card title="1. Basic Information" icon={Calendar}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Event Title"
                placeholder="e.g. Coimbatore District Badminton Championship 2026"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Sport Discipline
              </label>
              <select
                value={formData.sport}
                onChange={(e) => handleChange('sport', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#2563EB]"
              >
                {DEFAULT_SPORTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Event Type
              </label>
              <select
                value={formData.event_type}
                onChange={(e) => handleChange('event_type', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#2563EB]"
              >
                {EVENT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Competition Level
              </label>
              <select
                value={formData.competition_level}
                onChange={(e) => handleChange('competition_level', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#2563EB]"
              >
                {COMPETITION_LEVELS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Gender Eligibility
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="All">All (Men & Women / Open)</option>
                <option value="Male">Male Only</option>
                <option value="Female">Female Only</option>
                <option value="Co-ed">Co-ed / Mixed</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                Detailed Event Description
              </label>
              <textarea
                rows={3}
                required
                placeholder="Provide complete details regarding match format, draws, categories, rules, and timetable..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </Card>

        {/* Schedule & Dates */}
        <Card title="2. Dates & Timings" icon={Clock}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => handleChange('start_date', e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={formData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
            />
            <Input
              label="Registration Deadline"
              type="date"
              required
              value={formData.registration_deadline}
              onChange={(e) => handleChange('registration_deadline', e.target.value)}
            />
            <Input
              label="Daily Start Time"
              placeholder="e.g. 08:30 AM"
              value={formData.start_time}
              onChange={(e) => handleChange('start_time', e.target.value)}
            />
            <Input
              label="Daily End Time"
              placeholder="e.g. 06:30 PM"
              value={formData.end_time}
              onChange={(e) => handleChange('end_time', e.target.value)}
            />
          </div>
        </Card>

        {/* Venue & Location */}
        <Card title="3. Venue & Location" icon={MapPin}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Stadium / Arena Venue"
                placeholder="e.g. Nehru Indoor Stadium, VOC Park Grounds"
                required
                value={formData.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
              />
            </div>
            <Input
              label="City"
              placeholder="e.g. Coimbatore"
              required
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                State
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#2563EB]"
              >
                {INDIAN_STATES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Eligibility & Criteria */}
        <Card title="4. Eligibility & Prizes" icon={Award}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimum Age (Optional)"
              type="number"
              placeholder="e.g. 15"
              value={formData.age_min}
              onChange={(e) => handleChange('age_min', e.target.value)}
            />
            <Input
              label="Maximum Age (Optional)"
              type="number"
              placeholder="e.g. 25"
              value={formData.age_max}
              onChange={(e) => handleChange('age_max', e.target.value)}
            />
            <Input
              label="Entry Fee"
              placeholder="e.g. ₹500 / Entry or Free"
              value={formData.entry_fee}
              onChange={(e) => handleChange('entry_fee', e.target.value)}
            />
            <Input
              label="Prize Details / Awards"
              placeholder="e.g. ₹75,000 Cash Prize + State Medals"
              value={formData.prize_details}
              onChange={(e) => handleChange('prize_details', e.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                label="Eligibility / Qualification Requirements"
                placeholder="e.g. Registered district players with valid BAI/State ID."
                value={formData.eligibility}
                onChange={(e) => handleChange('eligibility', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Organizer Credentials & Registration Link */}
        <Card title="5. Organizer Credentials & Official Registration URL" icon={Building}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Host Organization Name"
              required
              value={formData.organizer_name}
              onChange={(e) => handleChange('organizer_name', e.target.value)}
            />
            <Input
              label="Official Contact Email"
              type="email"
              required
              value={formData.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
            />
            <Input
              label="Official Contact Phone"
              required
              value={formData.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
            />
            <div className="sm:col-span-2">
              <Input
                label="Official Tournament Registration URL"
                placeholder="https://association.org/register/event-2026"
                value={formData.registration_url}
                onChange={(e) => handleChange('registration_url', e.target.value)}
              />
              <p className="text-[11px] text-[#94A3B8] mt-1">
                Athletes clicking <strong>Register Now</strong> on the Event Hub will be redirected to this official external URL.
              </p>
            </div>
            <div className="sm:col-span-2">
              <Input
                label="Official Circular / Source Link (Optional)"
                placeholder="https://association.org/circulars/event-2026.pdf"
                value={formData.source_url}
                onChange={(e) => handleChange('source_url', e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Submission Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#1E293B]">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={(e) => handleSubmit(e, true)}
            disabled={submitting}
          >
            Save as Draft
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitting}
            className="w-full sm:w-auto"
          >
            {user?.role === 'ADMIN'
              ? (isEditMode ? 'Save & Update Event' : 'Publish Verified Event')
              : 'Submit Event for Admin Verification'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditEventPage;
