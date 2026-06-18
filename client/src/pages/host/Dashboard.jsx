import { useState, useEffect } from 'react';
import { Wallet, BedDouble, CalendarCheck, TrendingUp, Loader2, Utensils, Wrench, PlusSquare, MessageSquare, BarChart3, ArrowUpRight, Users, User, Star, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import API_URL from '../../utils/api';

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketCount, setTicketCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, ticketRes] = await Promise.all([
          fetch(`${API_URL}/api/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/maintenance`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const profileData = await profileRes.json();
        const tickets = await ticketRes.json();

        const pendingTickets = (tickets || []).filter(t => t.status === 'PENDING').length;
        setTicketCount(pendingTickets);
        
        // Calculate stats
        const activeListings = (profileData.myListings?.length || 0) + (profileData.myMesses?.length || 0);
        const pendingBookings = profileData.inboundBookings?.filter(b => b.status === 'PENDING').length || 0;
        const confirmedBookings = profileData.inboundBookings?.filter(b => b.status === 'CONFIRMED').length || 0;
        const totalRevenue = profileData.monthlyStats?.reduce((sum, s) => sum + s.revenue, 0) || 0;

        // Average rating across all properties
        const allListings = [...(profileData.myListings || []), ...(profileData.myMesses || [])];
        const ratingsArray = allListings
          .filter(l => l.reviews?.length > 0)
          .map(l => l.reviews.reduce((acc, r) => acc + r.overallRating, 0) / l.reviews.length);
        const avgRating = ratingsArray.length > 0
          ? (ratingsArray.reduce((a, b) => a + b, 0) / ratingsArray.length).toFixed(1)
          : '—';

        // Occupancy
        const totalProperties = profileData.myListings?.length || 0;
        const bookedProperties = profileData.myListings?.filter(r => r.isBooked).length || 0;
        const occupancyRate = totalProperties > 0 ? Math.round((bookedProperties / totalProperties) * 100) : 0;

        setData({
          stats: [
            { name: 'Total Revenue', stat: `₹${totalRevenue.toLocaleString()}`, icon: Wallet, trend: `${confirmedBookings} confirmed`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { name: 'Active Listings', stat: activeListings.toString(), icon: BedDouble, trend: 'Properties & Mess', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { name: 'Occupancy Rate', stat: `${occupancyRate}%`, icon: Users, trend: `${bookedProperties}/${totalProperties} booked`, color: 'text-violet-500', bg: 'bg-violet-500/10' },
            { name: 'Avg. Rating', stat: avgRating, icon: Star, trend: `${ratingsArray.length} reviewed`, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          ],
          recentReservations: profileData.inboundBookings?.slice(0, 5) || [],
          monthlyStats: profileData.monthlyStats || [],
          pendingBookings,
          properties: profileData.myListings || []
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchDashboardData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-taupe font-bold animate-pulse">Analyzing your performance...</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...(data?.monthlyStats?.map(s => s.revenue) || [1]), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-4 sm:p-6 lg:p-10">
      
      {/* Welcome & Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight mb-2">
            Welcome back, <span className="text-accent underline decoration-4 underline-offset-8 decoration-accent/30">{data?.properties[0]?.host?.name?.split(' ')[0] || 'Host'}</span>
          </h1>
          <p className="text-taupe font-bold flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-accent" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link to="/host/properties/new" className="group relative inline-flex items-center gap-3 px-8 py-4 bg-primary text-background font-black rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20">
            <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <PlusSquare className="w-5 h-5 relative z-10" /> 
            <span className="relative z-10">Add New Listing</span>
          </Link>
        </div>
      </div>



      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
        {data?.stats.map((item, idx) => (
          <div 
            key={item.name} 
            className="group relative bg-surface p-8 rounded-[2.5rem] border border-white/10 shadow-xl overflow-hidden hover:border-accent/20 transition-all"
            style={{ transitionDelay: `${idx * 100}ms` }}
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
              <item.icon className="w-24 h-24 rotate-[-15deg]" />
            </div>
            
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 ${item.bg} rounded-3xl group-hover:scale-110 transition-transform duration-500`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div className="flex flex-col items-end">
                 <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${item.bg} ${item.color}`}>
                    Live
                 </span>
              </div>
            </div>
            
            <p className="text-xs font-black text-taupe uppercase tracking-[0.2em] mb-1">{item.name}</p>
            <p className="text-4xl font-black text-primary tracking-tighter">{item.stat}</p>
            
            <div className="mt-6 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
               <span className="text-[10px] font-bold text-taupe/60 uppercase tracking-widest">{item.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Chart Column */}
        <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
          <div className="bg-surface rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden group">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-primary/5">
              <div>
                <h3 className="text-2xl font-black text-primary flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-accent" /> Financial Growth
                </h3>
                <p className="text-xs font-bold text-taupe uppercase tracking-widest mt-1 opacity-60">Cumulative monthly revenue analysis</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-black text-taupe">
                    <div className="w-3 h-3 rounded-sm bg-accent/20 border border-accent/30" /> Forecast
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-black text-primary">
                    <div className="w-3 h-3 rounded-sm bg-accent shadow-lg shadow-accent/20" /> Actual
                 </div>
              </div>
            </div>
            
            <div className="p-10">
              <div className="flex items-end gap-3 md:gap-6 h-[250px] pt-10">
                {data?.monthlyStats?.map((month, i) => {
                  const barHeight = maxRevenue > 0 ? Math.round((month.revenue / maxRevenue) * 220) : 0;
                  const isCurrentMonth = i === new Date().getMonth();
                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center justify-end h-full group/bar cursor-pointer relative">
                      <div className="absolute -top-12 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 pointer-events-none translate-y-2 group-hover/bar:translate-y-0 z-10">
                        <div className="bg-primary text-background text-[10px] font-black px-3 py-2 rounded-xl shadow-2xl border border-white/10 whitespace-nowrap">
                           ₹{month.revenue?.toLocaleString()}
                        </div>
                        <div className="w-2 h-2 bg-primary rotate-45 mx-auto -mt-1 border-r border-b border-white/10" />
                      </div>

                      <div
                        className={`w-full max-w-[48px] rounded-t-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                          isCurrentMonth
                            ? 'shadow-[0_20px_50px_rgba(16,185,129,0.3)]'
                            : month.revenue > 0
                              ? 'group-hover/bar:opacity-80'
                              : ''
                        }`}
                        style={{
                          height: `${Math.max(barHeight, 8)}px`,
                          background: isCurrentMonth
                            ? 'linear-gradient(to top, #059669, #10b981)'
                            : month.revenue > 0
                              ? 'linear-gradient(to top, var(--primary), var(--accent))'
                              : 'rgba(255, 255, 255, 0.05)'
                        }}
                      ></div>
                      
                      <span className={`text-[11px] font-black mt-4 transition-colors tracking-tighter ${isCurrentMonth ? 'text-emerald-500' : 'text-taupe'}`}>
                        {month.month.substring(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity Mini-Section */}
          <div className="bg-surface rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-primary/5">
                <h3 className="text-xl font-black text-primary">Live Activity Feed</h3>
                <Link to="/host/reservations" className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-accent">
                   Stream all activity <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Link>
            </div>
            <div className="p-8 space-y-4">
                {data?.recentReservations.length > 0 ? data.recentReservations.map((res) => (
                  <div key={res.id} className="flex items-center justify-between p-5 bg-primary/5 rounded-[2rem] border border-white/5 hover:border-accent/20 transition-all group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center shadow-lg border border-white/5 group-hover:scale-110 transition-transform">
                        {res.type === 'ROOM' ? <BedDouble className="w-6 h-6 text-primary" /> : <Utensils className="w-6 h-6 text-accent" />}
                      </div>
                     <div>
                        <p className="font-black text-primary text-lg leading-tight mb-1">{res.room?.title || res.room?.name}</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-taupe">
                           <User className="w-3 h-3" /> {res.tenant?.name}
                           <span className="w-1 h-1 bg-white/10 rounded-full" />
                           <span>Requested {new Date(res.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-primary">₹{res.totalPrice?.toLocaleString()}</p>
                      <div className="flex items-center justify-end gap-1.5 mt-1">
                         <div className={`w-1.5 h-1.5 rounded-full ${res.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-amber-500'}`} />
                         <p className={`text-[10px] font-black uppercase tracking-widest ${res.status === 'CONFIRMED' ? 'text-green-500' : 'text-amber-500'}`}>
                           {res.status}
                         </p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                     <Clock className="w-12 h-12 text-taupe/20 mx-auto mb-4" />
                     <p className="text-taupe font-bold">Waiting for new activity...</p>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Sidebar / Health Column */}
        <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000 delay-400">
          <div className="bg-surface rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden h-fit sticky top-28">
            <div className="p-8 border-b border-white/5 bg-primary/5">
              <h3 className="text-xl font-black text-primary flex items-center gap-3">
                 <AlertCircle className="w-5 h-5 text-accent" /> Portfolio Health
              </h3>
            </div>
            <div className="p-8 space-y-6">
              {data?.properties?.length > 0 ? (
                <>
                  <div className="space-y-5">
                    {data.properties.slice(0, 5).map(prop => (
                      <div key={prop.id} className="flex items-center gap-4 group">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-primary/10 flex-shrink-0 border border-white/10">
                          <img 
                            src={prop.images?.[0]?.url || `/assets/rooms/student_room_${(prop.id % 15) + 1}.png`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            alt="" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-primary truncate group-hover:text-accent transition-colors">{prop.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                             <div className={`w-2 h-2 rounded-full ${prop.isBooked ? 'bg-green-500' : 'bg-gray-400'}`} />
                             <span className="text-[10px] font-bold text-taupe uppercase tracking-widest">
                                {prop.isBooked ? 'Optimized' : 'Needs attention'}
                             </span>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="text-xs font-black text-primary">₹{(prop.totalRevenue || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link to="/host/properties" className="block w-full py-4 bg-primary/5 border border-white/5 rounded-2xl text-center text-xs font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-background transition-all">
                     Manage All Properties
                  </Link>
                </>
              ) : (
                <div className="text-center py-12">
                   <PlusSquare className="w-10 h-10 text-taupe/20 mx-auto mb-4" />
                   <p className="text-sm font-bold text-taupe">No properties listed yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Insights Card */}
          <div className="bg-accent rounded-[3rem] p-8 text-background shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-150 transition-transform duration-1000">
                <TrendingUp className="w-32 h-32 rotate-[-15deg]" />
             </div>
             <h4 className="text-2xl font-black mb-4 relative z-10">Revenue Goal</h4>
             <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-end mb-1">
                   <span className="text-xs font-bold uppercase tracking-widest opacity-80">Progress</span>
                   <span className="text-2xl font-black">78%</span>
                </div>
                <div className="w-full h-3 bg-background/20 rounded-full overflow-hidden border border-white/10">
                   <div className="h-full bg-background w-[78%] rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                </div>
                <p className="text-xs font-bold leading-relaxed opacity-70">
                   You're on track to hit your ₹200k milestone this quarter. Keep up the high occupancy rate!
                </p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
