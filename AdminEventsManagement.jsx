import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';

export const AdminEventsManagement = () => {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = { limit: 100 };
      if (statusFilter) params.status_filter = statusFilter;
      if (search.trim()) params.search = search.trim();

      const data = await eventService.adminGetEvents(params);
      setEvents(data?.events || []);
      setTotal(data?.total || 0);
    } catch (err) {
      console.error('Failed to load admin events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadEvents();
  };

  const handleCancelEvent = async (eventId) => {
    if (!window.confirm('Mark this event as CANCELLED?')) return;
    try {
      setCancellingId(eventId);
      await eventService.adminCancelEvent(eventId);
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, status: 'CANCELLED' } : ev));
    } catch (err) {
      alert(err.message || 'Failed to cancel event');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="primary" size="sm" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">🟢 Published</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="primary" size="sm" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">🟡 Pending Review</Badge>;
      case 'CHANGES_REQUESTED':
        return <Badge variant="primary" size="sm" className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30">Changes Requested</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" size="sm">🔴 Rejected</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="sm">⚠ Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary" size="sm">⚪ Expired</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Sports Events Management
            </h1>
            <Badge variant="primary" size="sm">{total} Events</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Catalog governance, direct publication, and multi-status monitoring across all sporting disciplines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/events/verification">
            <Button variant="secondary" size="sm" icon={ShieldCheck}>Verification Queue</Button>
          </Link>
          <Link to="/admin/events/new">
            <Button variant="primary" size="sm" icon={Plus}>+ Direct Add Event</Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search event title, organizer, sport, or city..."
              value={search}
              onChange={(e) => setSearchQuery ? setSearchQuery(e.target.value) : setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="CHANGES_REQUESTED">Changes Requested</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <Button type="submit" variant="secondary" size="sm">Search</Button>
        </form>
      </Card>

      {/* Events Table */}
      {loading ? (
        <Loader message="Loading events catalog..." className="py-24" />
      ) : events.length > 0 ? (
        <Card className="overflow-x-auto p-0 border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Event & Location</th>
                <th className="py-3.5 px-4">Sport & Level</th>
                <th className="py-3.5 px-4">Organizer</th>
                <th className="py-3.5 px-4">Dates</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Views</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-white block">{e.title}</span>
                    <span className="text-[11px] text-slate-400 block">{e.venue}, {e.city}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{e.sport}</span>
                    <span className="text-[11px] text-slate-400">{e.competition_level} • {e.event_type}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {e.organizer_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {new Date(e.start_date).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(e.status)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-cyan-600 dark:text-cyan-400">
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
        <Card className="p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No sports events found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No events match the selected criteria or status filter.
          </p>
        </Card>
      )}
    </div>
  );
};

export default AdminEventsManagement;
