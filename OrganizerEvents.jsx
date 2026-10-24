import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';

export const OrganizerEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventService.organizerGetEvents();
      setEvents(data || []);
    } catch (err) {
      console.error('Failed to load organizer events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCancelEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to mark this event as CANCELLED?')) return;

    try {
      setCancellingId(eventId);
      await eventService.organizerCancelEvent(eventId);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'CANCELLED' } : e));
    } catch (err) {
      alert(err.message || 'Failed to cancel event');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success" size="sm">🟢 Published</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="warning" size="sm">🟡 Pending Review</Badge>;
      case 'CHANGES_REQUESTED':
        return <Badge variant="primary" size="sm">Changes Requested</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" size="sm">🔴 Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="sm">⚠ Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge variant="default" size="sm">⚪ Expired</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  if (loading) {
    return <Loader message="Loading your submitted events..." className="py-24" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">
            My Sports Events
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Manage your tournament listings, track verification status, and monitor athlete views.
          </p>
        </div>

        <Link to="/organizer/events/new">
          <Button variant="primary" size="sm" icon={Plus}>+ Create New Event</Button>
        </Link>
      </div>

      {events.length > 0 ? (
        <Card className="overflow-x-auto p-0 border-[#1E293B]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1E293B] bg-[#0B1220] text-[#94A3B8] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Event Details</th>
                <th className="py-3.5 px-4">Sport & Level</th>
                <th className="py-3.5 px-4">Event Dates</th>
                <th className="py-3.5 px-4">Reg. Deadline</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Views</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-[#0B1220]/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#F8FAFC] block">{e.title}</span>
                    <span className="text-[11px] text-[#94A3B8] block">{e.venue}, {e.city}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-[#F8FAFC] block">{e.sport}</span>
                    <span className="text-[11px] text-[#94A3B8]">{e.competition_level}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#F8FAFC] font-medium">
                    {new Date(e.start_date).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-[#F8FAFC] font-medium">
                    {new Date(e.registration_deadline).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(e.status)}
                    {e.admin_notes && (
                      <span className="text-[10px] text-[#94A3B8] block mt-1 max-w-xs truncate" title={e.admin_notes}>
                        Note: {e.admin_notes}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#06B6D4]">
                    {e.views_count || 0}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Link to={`/events/${e.id}`}>
                      <Button variant="secondary" size="sm" className="text-xs p-1.5" title="Preview Event">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Link to={`/organizer/events/${e.id}/edit`}>
                      <Button variant="primary" size="sm" className="text-xs p-1.5" title="Edit Event">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    {e.status !== 'CANCELLED' && (
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-xs p-1.5"
                        title="Cancel Event"
                        disabled={cancellingId === e.id}
                        onClick={() => handleCancelEvent(e.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-12 text-center space-y-3 bg-[#111C2E] border-[#1E293B]">
          <Calendar className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h3 className="text-base font-bold text-[#F8FAFC]">No sports events registered</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            Create your first tournament listing to start accepting athlete inquiries and discovery.
          </p>
          <div className="pt-2">
            <Link to="/organizer/events/new">
              <Button variant="primary" size="sm" icon={Plus}>Create Event</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OrganizerEvents;
