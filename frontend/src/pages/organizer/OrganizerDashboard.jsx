import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import {
  Calendar,
  Plus,
  Clock,
  ShieldCheck
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';

export const OrganizerDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [profData, eventsData] = await Promise.all([
          eventService.organizerGetProfile(),
          eventService.organizerGetEvents()
        ]);
        setProfile(profData);
        setEvents(eventsData || []);
      } catch (err) {
        console.error('Failed to load organizer dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) {
    return <Loader message="Loading organizer portal..." className="py-24" />;
  }

  const publishedCount = events.filter(e => e.status === 'PUBLISHED').length;
  const pendingCount = events.filter(e => e.status === 'PENDING_REVIEW').length;
  const totalViews = events.reduce((acc, e) => acc + (e.views_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Verification Status Banner */}
      {profile?.verification_status === 'PENDING' && (
        <div className="p-4 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-start gap-3 text-[#F59E0B]">
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">Organization Verification in Progress</p>
            <p className="text-[#94A3B8]">
              Your organization account is currently under review by SportIQ administrators. You can create and submit events, which will be verified and published once your credentials are confirmed.
            </p>
          </div>
        </div>
      )}

      {profile?.verification_status === 'VERIFIED' && (
        <div className="p-4 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-between text-[#22C55E]">
          <div className="flex items-center gap-2 text-xs font-bold">
            <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
            <span>Verified Sports Organizer / Academy</span>
          </div>
          <Link to="/organizer/events/new">
            <Button variant="primary" size="sm" icon={Plus}>+ Submit New Event</Button>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">
            {profile?.organization_name || 'Organizer Workspace'}
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Host tournaments, championships, trials and manage event registrations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/organizer/events">
            <Button variant="secondary" size="sm">My Events</Button>
          </Link>
          <Link to="/organizer/events/new">
            <Button variant="primary" size="sm" icon={Plus}>Create Event</Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">Total Events</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#F8FAFC] font-display">{events.length}</span>
            <span className="text-xs text-[#94A3B8]">Listings</span>
          </div>
        </Card>

        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">Published & Live</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#22C55E] font-display">{publishedCount}</span>
            <span className="text-xs text-[#94A3B8]">Active</span>
          </div>
        </Card>

        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">Pending Review</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#F59E0B] font-display">{pendingCount}</span>
            <span className="text-xs text-[#94A3B8]">In queue</span>
          </div>
        </Card>

        <Card className="bg-[#111C2E] border-[#1E293B]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] block mb-1">Athlete Discoveries</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#06B6D4] font-display">{totalViews}</span>
            <span className="text-xs text-[#94A3B8]">Views</span>
          </div>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card title="Recent Event Submissions" icon={Calendar}>
        {events.length > 0 ? (
          <div className="space-y-3">
            {events.slice(0, 5).map(e => (
              <div
                key={e.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0B1220] border border-[#1E293B]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F8FAFC]">{e.title}</span>
                    <Badge variant={e.status === 'PUBLISHED' ? 'success' : e.status === 'PENDING_REVIEW' ? 'warning' : 'default'} size="sm">
                      {e.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-[#94A3B8] mt-0.5 block">
                    {e.sport} • {e.city}, {e.state} • Starts {new Date(e.start_date).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link to={`/events/${e.id}`}>
                    <Button variant="secondary" size="sm" className="text-xs">Preview</Button>
                  </Link>
                  <Link to={`/organizer/events/${e.id}/edit`}>
                    <Button variant="primary" size="sm" className="text-xs">Edit</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center space-y-3 bg-[#0B1220] rounded-xl border border-[#1E293B]">
            <Calendar className="w-10 h-10 text-[#94A3B8] mx-auto" />
            <h3 className="text-sm font-bold text-[#F8FAFC]">No events created yet</h3>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
              Get started by submitting your tournament, selection trial, or championship to reach athletes across India.
            </p>
            <Link to="/organizer/events/new">
              <Button variant="primary" size="sm" icon={Plus}>Create Your First Event</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default OrganizerDashboard;
