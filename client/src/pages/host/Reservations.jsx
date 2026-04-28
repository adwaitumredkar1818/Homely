import { useState, useEffect } from 'react';
import { Calendar, MapPin, User, CheckCircle2, XCircle, Clock, Loader2, Search, Filter, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, CONFIRMED, CANCELLED
  const [search, setSearch] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReservations();
  }, [token]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/user/profile', {
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
      const res = await fetch(`http://localhost:5000/api/host/reservations/${type}/${id}/status`, {
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
      r.room?.title?.toLowerCase().includes(search.toLowerCase()) || 
      r.tenant?.name?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
      <p className="text-taupe font-bold">Loading reservations...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-bold text-primary mb-2">Reservations</h1>
           <p className="text-taupe font-medium">Manage incoming booking requests for your properties.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-taupe" />
              <input 
                type="text"
                placeholder="Search tenant or property..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent/50 outline-none transition-all text-sm font-medium"
              />
           </div>
           
           <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
              {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === f ? 'bg-primary text-white shadow-md' : 'text-taupe hover:text-primary'}`}
                >
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Reservations List */}
      {filteredReservations.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
           {filteredReservations.map((res) => (
             <div 
               key={`${res.id}-${res.type}`}
               className="bg-white rounded-[2rem] border border-gray-200 p-6 flex flex-col lg:flex-row gap-8 hover:shadow-xl transition-all group"
             >
                {/* Property Preview */}
                <div className="w-full lg:w-48 h-32 rounded-2xl bg-gray-100 overflow-hidden shrink-0 relative">
                   <img 
                     src={res.room?.images?.[0]?.url || (res.type === 'ROOM' ? `/assets/rooms/student_room_1.png` : `/assets/messes/mess_1.png`)} 
                     className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                     alt="" 
                   />
                   <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase">
                      {res.type}
                   </div>
                </div>

                {/* Details */}
                <div className="flex-1 space-y-4">
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="text-xl font-bold text-primary mb-1 capitalize">{res.room?.title || res.room?.name}</h3>
                         <div className="flex items-center gap-3 text-sm font-semibold text-taupe">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {res.room?.location}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="flex items-center gap-1 text-accent"><Clock className="w-3.5 h-3.5" /> Requested {new Date(res.createdAt).toLocaleDateString()}</span>
                         </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        res.status === 'CONFIRMED' ? 'bg-green-500/10 text-green-500' : 
                        res.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500' : 
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                         {res.status}
                      </div>
                   </div>

                   <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-50">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-primary">
                            {res.tenant?.name?.charAt(0)}
                         </div>
                         <div>
                            <p className="text-xs font-bold text-taupe uppercase tracking-wider">Tenant</p>
                            <p className="font-bold text-primary">{res.tenant?.name}</p>
                         </div>
                      </div>
                      
                      <div>
                         <p className="text-xs font-bold text-taupe uppercase tracking-wider">Plan / Period</p>
                         <p className="font-bold text-primary">{res.type === 'ROOM' ? 'Monthly Rent' : (res.type || 'Monthly')}</p>
                      </div>

                      <div>
                         <p className="text-xs font-bold text-taupe uppercase tracking-wider">Total Amount</p>
                         <p className="font-bold text-accent text-lg">₹{res.totalPrice?.toLocaleString()}</p>
                      </div>
                   </div>
                </div>

                {/* Actions */}
                <div className="lg:w-48 flex flex-row lg:flex-col gap-3 justify-end shrink-0">
                   {res.status === 'PENDING' ? (
                     <>
                        <button 
                          onClick={() => handleStatusUpdate(res.id, res.type, 'CONFIRMED')}
                          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-blue-500/10"
                        >
                           <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(res.id, res.type, 'CANCELLED')}
                          className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-500 py-3 rounded-xl font-bold hover:bg-red-50 transition-all"
                        >
                           <XCircle className="w-4 h-4" /> Reject
                        </button>
                     </>
                   ) : (
                     <button 
                       onClick={() => navigate('/host/inbox')} // Placeholder for chat
                       className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                     >
                        <Mail className="w-4 h-4" /> Contact Tenant
                     </button>
                   )}
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-300">
           <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-6" />
           <h3 className="text-2xl font-bold text-primary mb-2">No Reservations Found</h3>
           <p className="text-taupe font-medium max-w-sm mx-auto">We couldn't find any reservation requests matching your current filters.</p>
        </div>
      )}
    </div>
  );
}
