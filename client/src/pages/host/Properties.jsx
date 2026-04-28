import { useState, useEffect } from 'react';
import { Edit, Trash2, Eye, Building2, Search, Filter, Loader2, PlusCircle, TrendingUp, IndianRupee, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
      const res = await fetch('http://localhost:5000/api/user/profile', {
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
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12 pb-20">
      
      {/* Header & Main Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Portfolio Performance</h1>
          <p className="text-taupe font-semibold mt-2">Track your earnings and manage property availability.</p>
        </div>
        <Link 
          to="/host/properties/new" 
          className="bg-primary text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-primary/20 hover:bg-black transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Add New Listing
        </Link>
      </div>

      {/* Revenue Tracker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl flex items-center gap-6 group hover:border-primary/20 transition-all">
            <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
               <IndianRupee className="w-8 h-8" />
            </div>
            <div>
               <p className="text-xs font-black text-taupe uppercase tracking-widest mb-1">Total Revenue</p>
               <h3 className="text-3xl font-black text-primary">₹{totalRevenue.toLocaleString('en-IN')}</h3>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl flex items-center gap-6 group hover:border-primary/20 transition-all">
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
               <Activity className="w-8 h-8" />
            </div>
            <div>
               <p className="text-xs font-black text-taupe uppercase tracking-widest mb-1">Occupancy Rate</p>
               <h3 className="text-3xl font-black text-primary">{occupancyRate}%</h3>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl flex items-center gap-6 group hover:border-primary/20 transition-all">
            <div className="w-16 h-16 bg-purple-50 rounded-3xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
               <TrendingUp className="w-8 h-8" />
            </div>
            <div>
               <p className="text-xs font-black text-taupe uppercase tracking-widest mb-1">Total Listings</p>
               <h3 className="text-3xl font-black text-primary">{properties.length}</h3>
            </div>
         </div>
      </div>

      {/* Monthly Revenue Breakdown (Chart) */}
      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-1000">
         <div className="flex justify-between items-end">
           <div>
             <h2 className="text-2xl font-black text-primary mb-1">Revenue Breakdown</h2>
             <p className="text-taupe text-sm font-bold">Month-over-month financial insights.</p>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-black uppercase tracking-widest">
             <TrendingUp className="w-4 h-4" />
             Growth Tracking
           </div>
         </div>
 
         <div className="h-64 flex items-end gap-2 md:gap-4 pt-10">
           {monthlyStats.map((stat, idx) => {
             const maxRevenue = Math.max(...monthlyStats.map(s => s.revenue), 1);
             const height = (stat.revenue / maxRevenue) * 100;
             
             return (
               <div key={idx} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                 <div className="relative w-full flex flex-col items-center justify-end h-full">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 bg-black text-white px-3 py-2 rounded-xl text-[10px] font-black whitespace-nowrap z-10 pointer-events-none shadow-xl">
                       ₹{stat.revenue.toLocaleString('en-IN')}
                       <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black" />
                    </div>
                    
                    {/* Bar */}
                    <div 
                       className="w-full bg-gray-50 rounded-t-xl group-hover:bg-primary transition-all duration-500 cursor-help relative overflow-hidden" 
                       style={{ height: `${height}%`, minHeight: stat.revenue > 0 ? '8px' : '2px' }}
                    >
                       <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                 </div>
                 <span className="text-[10px] font-black text-taupe group-hover:text-primary transition-colors">{stat.month}</span>
               </div>
             );
           })}
         </div>
       </div>

      {/* Availability Toggle & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/50 p-4 rounded-[2rem] border border-gray-100">
         <div className="flex bg-gray-100 p-1 rounded-2xl w-full md:w-auto">
            {['ALL', 'BOOKED', 'FREE'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all ${filter === f ? 'bg-primary text-white shadow-lg' : 'text-taupe hover:text-primary'}`}
              >
                {f}
              </button>
            ))}
         </div>
         <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-taupe" />
            <input 
              type="text" 
              placeholder="Quick search property..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
            />
         </div>
      </div>

      {/* Property Table */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden">
        {filteredProperties.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-taupe uppercase tracking-[0.2em]">
                  <th className="p-8 pl-10">Property Details</th>
                  <th className="p-8">Availability</th>
                  <th className="p-8">Price / Month</th>
                  <th className="p-8">Lifetime Revenue</th>
                  <th className="p-8 text-right pr-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProperties.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50/30 transition-all group animate-in fade-in duration-500">
                    <td className="p-8 pl-10 flex items-center gap-6">
                      <div className="w-24 h-16 rounded-2xl overflow-hidden shrink-0 border border-gray-100 shadow-sm relative">
                        <img 
                          src={room.image || `/assets/rooms/student_room_${(room.id % 15) + 1}.png`} 
                          alt={room.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-black/5" />
                      </div>
                      <div>
                        <span className="block font-black text-primary text-lg leading-tight group-hover:text-accent transition-colors">{room.title}</span>
                        <span className="text-[10px] font-bold text-taupe uppercase tracking-widest mt-1 block">ID: RF-{room.id}00</span>
                      </div>
                    </td>
                    <td className="p-8">
                      {room.isBooked ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/10">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                          Occupied
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-600 border border-green-500/10">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          Available
                        </span>
                      )}
                    </td>
                    <td className="p-8">
                       <span className="text-xl font-black text-primary">₹{room.price.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="p-8">
                       <div className="flex items-center gap-2">
                          <div className="p-2 bg-green-50 rounded-lg text-green-600">
                             <IndianRupee className="w-4 h-4" />
                          </div>
                          <span className="text-lg font-black text-primary">₹{(room.totalRevenue || 0).toLocaleString('en-IN')}</span>
                       </div>
                    </td>
                    <td className="p-8 pr-10 text-right">
                      <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Link to={`/room/${room.id}`} className="p-3 text-taupe hover:text-primary hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl transition-all shadow-sm">
                           <Eye className="w-5 h-5" />
                        </Link>
                        <button className="p-3 text-taupe hover:text-accent hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl transition-all shadow-sm">
                           <Edit className="w-5 h-5" />
                        </button>
                        <button className="p-3 text-taupe hover:text-red-500 hover:bg-white border border-transparent hover:border-red-50 rounded-2xl transition-all shadow-sm">
                           <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-24 bg-gray-50/20">
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Building2 className="w-12 h-12 text-gray-200" />
             </div>
             <h3 className="text-3xl font-black text-primary mb-4">No {filter.toLowerCase()} properties</h3>
             <p className="text-taupe font-medium max-w-sm mx-auto leading-relaxed">
                You don't have any properties that match the current "{filter}" filter.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}
