import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import {
  Calendar,
  MapPin,
  Search,
  ShieldCheck,
  Bookmark,
  Sparkles,
  ChevronRight,
  Clock,
  Users,
  Compass,
  AlertCircle,
  Plus
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { DEFAULT_SPORTS, EVENT_TYPES, COMPETITION_LEVELS, INDIAN_STATES } from '../../utils/constants';

export const EventHubPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);

  // Active Discovery Tab: 'upcoming', 'near_me', 'recommended', 'saved'
  const [activeTab, setActiveTab] = useState('upcoming');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  // Bookmarking Action State
  const [bookmarkingId, setBookmarkingId] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        tab: activeTab,
        page: 1,
        limit: 50
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedSport) params.sport = selectedSport;
      if (selectedEventType) params.event_type = selectedEventType;
      if (selectedLevel) params.competition_level = selectedLevel;
      if (selectedState) params.state = selectedState;
      if (selectedCity) params.city = selectedCity;
      if (selectedGender) params.gender = selectedGender;

      const data = await eventService.getEvents(params);
      if (data) {
        setEvents(data.events || []);
        setTotalEvents(data.total || 0);
      } else {
        setEvents([]);
        setTotalEvents(0);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeTab, selectedSport, selectedEventType, selectedLevel, selectedState, selectedCity, selectedGender]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleToggleBookmark = async (e, eventId, isSaved) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    setBookmarkingId(eventId);
    try {
      if (isSaved) {
        await eventService.unsaveEvent(eventId);
      } else {
        await eventService.saveEvent(eventId);
      }
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, is_saved: !isSaved } : ev));
    } catch (err) {
      alert(err.message || 'Unable to update bookmark');
    } finally {
      setBookmarkingId(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport('');
    setSelectedEventType('');
    setSelectedLevel('');
    setSelectedState('');
    setSelectedCity('');
    setSelectedGender('');
    setActiveTab('upcoming');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#111C2E] border border-[#1E293B] text-white">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/30 text-xs font-bold uppercase tracking-wider">
              Sports Opportunities
            </span>
            {user?.role === 'ORGANIZER' && (
              <Link to="/organizer/events/new">
                <span className="px-3 py-1 rounded-full bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold flex items-center gap-1 hover:bg-[#22C55E]/30 transition-all">
                  <Plus className="w-3.5 h-3.5" /> + Host Event
                </span>
              </Link>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight uppercase text-[#F8FAFC]">
            SPORTIQ EVENT HUB
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] font-medium leading-relaxed">
            Discover upcoming tournaments, championships, trials and sports opportunities verified by official federations and academies.
          </p>
        </div>
      </div>

      {/* Discovery Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E293B] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'bg-[#2563EB] text-[#F8FAFC] shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C2E]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Upcoming Events</span>
          </button>

          <button
            onClick={() => setActiveTab('near_me')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'near_me'
                ? 'bg-[#2563EB] text-[#F8FAFC] shadow-sm'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C2E]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Near Me</span>
          </button>

          {user && (
            <>
              <button
                onClick={() => setActiveTab('recommended')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'recommended'
                    ? 'bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/40 shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C2E]'
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#06B6D4]" />
                <span>Recommended</span>
              </button>

              <button
                onClick={() => setActiveTab('saved')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'saved'
                    ? 'bg-[#2563EB] text-[#F8FAFC] shadow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111C2E]'
                }`}
              >
                <Bookmark className="w-4 h-4 text-[#F59E0B]" />
                <span>Saved Events</span>
              </button>
            </>
          )}
        </div>

        <span className="text-xs font-semibold text-[#94A3B8]">
          Showing <strong className="text-[#F8FAFC]">{events.length}</strong> of <strong className="text-[#F8FAFC]">{totalEvents}</strong> events
        </span>
      </div>

      {/* Search & Multi-Filter Controls */}
      <Card className="p-4 sm:p-5 bg-[#111C2E] border-[#1E293B] space-y-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search tournaments, championship titles, city, venue, or organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs sm:text-sm text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-[#2563EB] transition-all"
            />
          </div>
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
        </form>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1">
          {/* Sport Filter */}
          <div>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full p-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">All Sports</option>
              {DEFAULT_SPORTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Event Type Filter */}
          <div>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full p-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">All Event Types</option>
              {EVENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full p-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">All Levels</option>
              {COMPETITION_LEVELS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full p-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">All States</option>
              {INDIAN_STATES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* City / Near Me Quick Selector */}
          <div>
            <input
              type="text"
              placeholder="Filter City (e.g. Coimbatore)"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full p-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-medium text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Clear Button */}
          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={clearFilters}
              className="w-full text-xs"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Events Grid / List */}
      {loading ? (
        <Loader message="Loading verified sports opportunities..." className="py-24" />
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {events.map((event) => {
            const formattedDate = new Date(event.start_date).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
            const deadlineFormatted = new Date(event.registration_deadline).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <Card
                key={event.id}
                className="p-5 sm:p-6 bg-[#111C2E] border-[#1E293B] hover:border-[#2563EB]/50 shadow-sm transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Badges & Bookmark Star */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="ai" size="sm">
                        {event.sport}
                      </Badge>
                      <Badge variant="primary" size="sm">
                        {event.event_type}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {event.competition_level}
                      </Badge>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(e, event.id, event.is_saved)}
                      disabled={bookmarkingId === event.id}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        event.is_saved
                          ? 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]'
                          : 'border-[#1E293B] text-[#94A3B8] hover:text-[#F59E0B] hover:border-[#F59E0B]/40'
                      }`}
                      title={event.is_saved ? 'Remove Bookmark' : 'Save Event'}
                    >
                      <Bookmark className={`w-4 h-4 ${event.is_saved ? 'fill-[#F59E0B]' : ''}`} />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <Link to={`/events/${event.id}`}>
                      <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC] hover:text-[#06B6D4] transition-colors font-display">
                        {event.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-[#94A3B8] line-clamp-2 mt-1 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Key Metadata Matrix */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#94A3B8] pt-1 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                      <span className="truncate">{event.city}, {event.state}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                      <span>Eligibility: {event.age_min ? `${event.age_min}–${event.age_max || 'Any'} yrs` : 'All ages'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                      <span>Deadline: {deadlineFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Strip */}
                <div className="pt-4 mt-4 border-t border-[#1E293B] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[#22C55E] text-xs font-bold">
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    <span>🟢 Verified Event</span>
                  </div>

                  <Link to={`/events/${event.id}`}>
                    <Button variant="primary" size="sm" className="text-xs inline-flex items-center gap-1">
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center space-y-3 bg-[#111C2E] border-[#1E293B]">
          <AlertCircle className="w-10 h-10 text-[#94A3B8] mx-auto" />
          <h3 className="text-base font-bold text-[#F8FAFC] font-display">No verified sports events found</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            Try adjusting your search query, sport discipline, or location filters.
          </p>
          <div className="pt-2">
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Reset All Filters
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EventHubPage;
