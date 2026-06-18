import { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Building2, Building, Search, Filter, Loader2, PlusCircle, PlusSquare, TrendingUp, IndianRupee, Activity, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../utils/api';

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, BOOKED, FREE
  const { token } = useAuth();

  useEffect(() => {
    fetchMyProperties();
  }, [token]);

  const fetchMyProperties = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.myListings) {
        setProperties(data.myListings);
      }
      if (data.monthlyStats) {
        setMonthlyStats(data.monthlyStats);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(p => {
    if (filter === 'ALL') return true;
    if (filter === 'BOOKED') return p.isBooked;
    if (filter === 'FREE') return !p.isBooked;
    return true;
  });

  const totalRevenue = properties.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
  const occupancyRate = properties.length > 0 
    ? Math.round((properties.filter(p => p.isBooked).length / properties.length) * 100) 
    : 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64">
      <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
      <p className="text-taupe font-bold text-lg">Loading your insights...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-4 sm:p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight mb-2">My Inventory</h1>
          <p className="text-taupe font-bold flex items-center gap-2">
             <Building className="w-4 h-4 text-accent" />
             Managing {properties.length} active listings across the platform.
          </p>
        </div>
        <Link 
          to="/host/properties/new" 
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-primary text-background font-black rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20"
        >
          <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <PlusSquare className="w-5 h-5 relative z-10" /> 
          <span className="relative z-10">Create New Listing</span>
        </Link>
      </div>

      {/* Strategic Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-surface p-8 rounded-[2.5rem] border border-white/10 shadow-xl flex items-center gap-6 group hover:border-accent/20 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
               <IndianRupee className="w-20 h-20" />
            </div>
            <div className="w-16 h-16 bg-green-500/10 rounded-3xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform duration-500 shadow-inner">
               <IndianRupee className="w-8 h-8" />
            </div>
            <div>
               <p className="text-xs font-black text-taupe uppercase tracking-[0.2em] mb-1">Total Assets</p>
               <h3 className="text-3xl font-black text-primary tracking-tighter">₹{totalRevenue.toLocaleString('en-IN')}</h3>
            </div>
         </div>

         <div className="bg-surface p-8 rounded-[2.5rem] border border-white/10 shadow-xl flex items-center gap-6 group hover:border-accent/20 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
               <Activity className="w-20 h-20" />
            </div>
            <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-500 shadow-inner">
               <Activity className="w-8 h-8" />
            </div>
            <div>
               <p className="text-xs font-black text-taupe uppercase tracking-[0.2em] mb-1">Occupancy</p>
               <h3 className="text-3xl font-black text-primary tracking-tighter">{occupancyRate}%</h3>
            </div>
         </div>

         <div className="bg-surface p-8 rounded-[2.5rem] border border-white/10 shadow-xl flex items-center gap-6 group hover:border-accent/20 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
               <TrendingUp className="w-20 h-20" />
            </div>
            <div className="w-16 h-16 bg-purple-500/10 rounded-3xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform duration-500 shadow-inner">
               <TrendingUp className="w-8 h-8" />
            </div>
            <div>
               <p className="text-xs font-black text-taupe uppercase tracking-[0.2em] mb-1">Scale</p>
               <h3 className="text-3xl font-black text-primary tracking-tighter">{properties.length} Units</h3>
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-surface rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden group">
        
        {/* Toolbar */}
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-primary/5">
           <div className="flex bg-background p-1.5 rounded-2xl w-full md:w-auto shadow-inner border border-white/5">
              {['ALL', 'BOOKED', 'FREE'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${filter === f ? 'bg-primary text-background shadow-lg' : 'text-taupe hover:text-primary'}`}
                >
                  {f}
                </button>
              ))}
           </div>
           <div className="relative w-full md:w-96 group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-taupe group-focus-within/search:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Find a specific property..." 
                className="w-full pl-12 pr-4 py-4 bg-background border border-white/10 rounded-[1.5rem] text-sm font-bold focus:ring-4 focus:ring-accent/5 focus:border-accent/30 outline-none transition-all text-primary placeholder:opacity-50"
              />
           </div>
        </div>

        {/* Property Table */}
        {filteredProperties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black text-taupe uppercase tracking-[0.25em]">
                  <th className="p-10 pl-12">Asset Identity</th>
                  <th className="p-10">Status</th>
                  <th className="p-10">Yield / Mo</th>
                  <th className="p-10">Lifetime Value</th>
                  <th className="p-10 text-right pr-12">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProperties.map((room) => (
                  <tr key={room.id} className="hover:bg-primary/5 transition-all group/row">
                    <td className="p-10 pl-12">
                      <div className="flex items-center gap-6">
                        <div className="w-28 h-18 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-lg relative group/img">
                          <img 
                            src={room.image || `/assets/rooms/student_room_${(room.id % 15) + 1}.png`} 
                            alt={room.title} 
                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000" 
                          />
                          <div className="absolute inset-0 bg-black/10 group-hover/img:bg-transparent transition-colors" />
                        </div>
                        <div>
                          <span className="block font-black text-primary text-xl leading-tight group-hover/row:text-accent transition-colors">{room.title}</span>
                          <span className="text-[10px] font-black text-taupe uppercase tracking-[0.2em] mt-1.5 block opacity-50">ID: RF-{room.id}992</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-10">
                      {room.isBooked ? (
                        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/10">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                          Full
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/10">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                          Ready
                        </span>
                      )}
                    </td>
                    <td className="p-10">
                       <span className="text-2xl font-black text-primary tracking-tighter">₹{room.price.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="p-10">
                       <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-accent/10 rounded-xl text-accent border border-accent/20">
                             <TrendingUp className="w-4 h-4" />
                          </div>
                          <span className="text-xl font-black text-primary tracking-tighter">₹{(room.totalRevenue || 0).toLocaleString('en-IN')}</span>
                       </div>
                    </td>
                    <td className="p-10 pr-12 text-right">
                      <div className="flex justify-end gap-3 opacity-20 group-hover/row:opacity-100 transition-all duration-500 translate-x-4 group-hover/row:translate-x-0">
                        <Link to={`/room/${room.id}`} className="p-4 text-taupe hover:text-accent hover:bg-accent/5 border border-white/5 hover:border-accent/20 rounded-2xl transition-all shadow-sm">
                           <Eye className="w-5 h-5" />
                        </Link>
                        <button className="p-4 text-taupe hover:text-primary hover:bg-primary/5 border border-white/5 hover:border-primary/20 rounded-2xl transition-all shadow-sm">
                           <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center">
             <h3 className="text-2xl font-black text-primary mb-2">No properties found</h3>
             <p className="text-taupe font-medium">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}
