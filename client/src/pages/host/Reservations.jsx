import { useState, useEffect } from 'react';
import { Calendar, MapPin, User, CheckCircle2, XCircle, Clock, Loader2, Search, Filter, Mail, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API_URL from '../../utils/api';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, CONFIRMED, CANCELLED
  const [search, setSearch] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const highlightId = location.state?.highlightId;

  useEffect(() => {
    fetchReservations();
  }, [token]);

  useEffect(() => {
    if (highlightId && !loading) {
      const el = document.getElementById(`reservation-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId, loading]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.inboundBookings) {
        setReservations(data.inboundBookings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, type, status) => {
    try {
      const res = await fetch(`${API_URL}/api/host/reservations/${type}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setReservations(prev => prev.map(r => r.id === id && r.type === type ? { ...r, status } : r));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredReservations = reservations
    .filter(r => filter === 'ALL' || r.status === filter)
    .filter(r => 
      (r.room?.title || r.room?.name || '').toLowerCase().includes(search.toLowerCase()) || 
      (r.tenant?.name || '').toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
      <p className="text-taupe font-bold">Loading reservations...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-4 sm:p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight mb-2">Bookings Feed</h1>
          <p className="text-taupe font-bold flex items-center gap-2">
             <Calendar className="w-4 h-4 text-accent" />
             Track and manage your upcoming tenant stays and mess subscriptions.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-surface p-6 rounded-[2.5rem] border border-white/10 shadow-xl">
         <div className="flex bg-background p-1.5 rounded-2xl w-full md:w-auto shadow-inner border border-white/5">
            {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${filter === f ? 'bg-primary text-background shadow-lg' : 'text-taupe hover:text-primary'}`}
              >
                {f}
              </button>
            ))}
         </div>
         <div className="relative w-full md:w-96 group/search">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-taupe group-focus-within/search:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="Search by tenant or property..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-background border border-white/10 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-accent/5 focus:border-accent/30 outline-none transition-all text-primary placeholder:opacity-50"
            />
         </div>
      </div>

      {/* Reservations Grid */}
      {filteredReservations.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
           {filteredReservations.map((res, idx) => (
             <div 
               key={`${res.id}-${res.type}`}
               id={`reservation-${res.id}`}
               className={`bg-surface rounded-[3rem] border transition-all group flex flex-col lg:flex-row gap-8 p-8 relative overflow-hidden ${
                  highlightId === res.id 
                    ? 'border-accent shadow-2xl shadow-accent/20 ring-2 ring-accent/30' 
                    : 'border-white/10 hover:shadow-2xl hover:border-accent/10'
                }`}
               style={{ transitionDelay: `${idx * 50}ms` }}
             >
                {/* Visual Accent */}
                {highlightId === res.id && (
                   <div className="absolute top-0 right-0 p-4">
                      <div className="px-3 py-1 bg-accent text-background text-[10px] font-black uppercase rounded-full shadow-lg animate-bounce">
                         Newly Highlighted
                      </div>
                   </div>
                )}

                {/* Property Preview */}
                <div className="w-full lg:w-64 h-44 rounded-[2rem] bg-primary/5 overflow-hidden shrink-0 relative border border-white/5">
                   <img 
                     src={res.room?.images?.[0]?.url || (res.type === 'ROOM' ? `/assets/rooms/student_room_1.png` : `/assets/messes/mess_1.png`)} 
                     className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]" 
                     alt="" 
                   />
                   <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-xl text-[10px] font-black text-white uppercase tracking-widest border border-white/10">
                      {res.type}
                   </div>
                </div>

                {/* Information Cluster */}
                <div className="flex-1 space-y-6">
                   <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div>
                         <h3 className="text-2xl font-black text-primary mb-2 group-hover:text-accent transition-colors capitalize">{res.room?.title || res.room?.name}</h3>
                         <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-taupe">
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-accent" /> {res.room?.location}</span>
                            <span className="w-1 h-1 bg-white/10 rounded-full" />
                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-accent" /> Requested {new Date(res.createdAt).toLocaleDateString()}</span>
                         </div>
                      </div>
                      <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                        res.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        res.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                         {res.status}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-white/5">
                      <div className="space-y-1.5">
                         <p className="text-[10px] font-black text-taupe uppercase tracking-widest opacity-50">Tenant</p>
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                               <User className="w-3 h-3 text-primary" />
                            </div>
                            <p className="font-black text-primary text-sm">{res.tenant?.name}</p>
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <p className="text-[10px] font-black text-taupe uppercase tracking-widest opacity-50">Plan / Period</p>
                         <p className="font-black text-primary text-sm">{res.type === 'ROOM' ? 'Monthly Residence' : 'Full Board'}</p>
                      </div>
                      <div className="space-y-1.5">
                         <p className="text-[10px] font-black text-taupe uppercase tracking-widest opacity-50">Value</p>
                         <p className="text-xl font-black text-accent tracking-tighter">₹{res.totalPrice?.toLocaleString()}</p>
                      </div>
                   </div>

                   {/* Strategic Actions */}
                   <div className="flex flex-wrap gap-3">
                      {res.status === 'PENDING' ? (
                        <>
                           <button 
                             onClick={() => handleStatusUpdate(res.id, res.type, 'CONFIRMED')}
                             className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-primary text-background font-black py-4 rounded-2xl hover:bg-black hover:text-white transition-all shadow-xl shadow-primary/10"
                           >
                              <CheckCircle2 className="w-4 h-4" /> Approve Stay
                           </button>
                           <button 
                             onClick={() => handleStatusUpdate(res.id, res.type, 'CANCELLED')}
                             className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-surface text-primary border border-white/10 font-black py-4 rounded-2xl hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
                           >
                              <XCircle className="w-4 h-4" /> Reject
                           </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-4">
                           <Link to="/host/inbox" className="flex items-center gap-2 px-6 py-3 bg-primary/5 text-primary border border-white/5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 transition-all">
                              <Mail className="w-4 h-4" /> Message Tenant
                           </Link>
                           {res.status === 'CONFIRMED' && (
                             <button className="flex items-center gap-2 px-6 py-3 bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 rounded-xl font-black text-[10px] uppercase tracking-widest">
                                <CheckCircle2 className="w-4 h-4" /> Stay Verified
                             </button>
                           )}
                        </div>
                      )}
                   </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-surface rounded-[3rem] border border-white/10 border-dashed">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8">
               <Calendar className="w-10 h-10 text-taupe/20" />
            </div>
            <h3 className="text-3xl font-black text-primary mb-4">No Booking Activity</h3>
            <p className="text-taupe font-medium max-w-sm mx-auto leading-relaxed">
               Requests and confirmed stays will appear here in chronological order.
            </p>
        </div>
      )}
    </div>
  );
}
