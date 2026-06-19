import { useState, useEffect } from 'react';
import { Wallet, BedDouble, CalendarCheck, TrendingUp, Loader2, Utensils, Wrench, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch('http://localhost:5000/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await res.json();

        const maintRes = await fetch('http://localhost:5000/api/maintenance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const maintData = await maintRes.json();
        
        // Calculate stats
        const activeListings = (profileData.myListings?.length || 0) + (profileData.myMesses?.length || 0);
        const upcomingBookings = profileData.inboundBookings?.filter(b => b.status === 'PENDING').length || 0;
        const activeMaintenance = Array.isArray(maintData) ? maintData.filter(t => t.status !== 'RESOLVED').length : 0;
        const totalRevenue = profileData.monthlyStats?.reduce((sum, s) => sum + s.revenue, 0) || 0;
        const confirmedBookings = profileData.inboundBookings?.filter(b => b.status === 'CONFIRMED').length || 0;

        setData({
          stats: [
            { name: 'Total Listings', stat: activeListings.toString(), icon: BedDouble, trend: 'Properties & Mess' },
            { name: 'Pending Requests', stat: upcomingBookings.toString(), icon: CalendarCheck, trend: 'Requires approval', alert: upcomingBookings > 0 },
            { name: 'Active Maintenance', stat: activeMaintenance.toString(), icon: Wrench, trend: 'Issues reported', alert: activeMaintenance > 0 },
            { name: 'Total Revenue', stat: `₹${totalRevenue.toLocaleString()}`, icon: Wallet, trend: 'Lifetime earnings' },
          ],
          recentReservations: profileData.inboundBookings?.slice(0, 5) || [],
          monthlyStats: profileData.monthlyStats || [],
          activeMaintenance,
          upcomingBookings
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

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

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#3e3633] to-[#241e1c] text-white rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Welcome Back, Landlord!</h1>
          <p className="text-zinc-300 font-medium text-lg leading-relaxed">
            Monitor your occupancy, check monthly earnings, and respond to incoming requests from your tenants.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.stats.map((item, idx) => (
          <motion.div 
            key={item.name} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className={`bg-surface p-6 rounded-[2rem] border shadow-xl relative overflow-hidden group hover:border-primary/20 transition-all ${item.alert ? 'ring-2 ring-amber-500/20 border-amber-500/30' : 'border-white/10'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-black text-taupe uppercase tracking-widest">{item.name}</p>
                <p className="text-3xl font-black text-primary mt-2">{item.stat}</p>
              </div>
              <div className={`p-4 rounded-2xl group-hover:bg-primary transition-colors duration-300 ${item.alert ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400' : 'bg-primary/5 text-primary'}`}>
                <item.icon className="h-6 w-6 group-hover:text-background transition-colors duration-300" />
              </div>
            </div>
            <div className="mt-5 flex items-center text-[10px] font-black uppercase tracking-widest text-taupe">
               <span className={item.alert ? 'text-amber-500 dark:text-amber-400 font-bold' : 'text-accent'}>{item.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Center (Quick Alerts) */}
      {(data?.upcomingBookings > 0 || data?.activeMaintenance > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-primary rounded-[2rem] p-6 sm:p-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-amber-800 dark:text-amber-200 text-lg">Action Required</h3>
              <p className="text-amber-700/95 dark:text-amber-300/90 font-medium text-sm mt-0.5">
                You have {data.upcomingBookings} pending booking requests and {data.activeMaintenance} active maintenance requests waiting for review.
              </p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            {data.upcomingBookings > 0 && (
              <Link 
                to="/host/reservations" 
                className="flex-1 md:flex-none text-center bg-amber-600 text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-amber-700 transition-colors shadow-md shadow-amber-600/10"
              >
                Review Bookings
              </Link>
            )}
            {data.activeMaintenance > 0 && (
              <Link 
                to="/host/maintenance" 
                className="flex-1 md:flex-none text-center bg-surface border border-white/10 text-primary px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-background transition-colors"
              >
                View Tickets
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Revenue chart and Activity list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* Left 2 Columns: Monthly Revenue Breakdown */}
        <div className="lg:col-span-2 bg-surface p-8 sm:p-10 rounded-[3rem] border border-border shadow-2xl flex flex-col justify-between lg:h-[450px]">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-primary mb-1">Portfolio Revenue</h2>
                <p className="text-taupe text-sm font-bold">Month-over-month financial progress.</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-xl text-xs font-black uppercase tracking-widest">
                <TrendingUp className="w-4 h-4" /> Live Tracking
              </div>
            </div>
          </div>
     
          <div className="h-56 flex items-end gap-2 md:gap-4 pt-8">
            {data?.monthlyStats.map((stat, idx) => {
              const maxRevenue = Math.max(...data.monthlyStats.map(s => s.revenue), 1);
              const height = (stat.revenue / maxRevenue) * 100;
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end">
                  <div className="relative w-full flex flex-col items-center justify-end h-full">
                     {/* Tooltip */}
                     <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 bg-primary text-background px-3 py-2 rounded-xl text-[10px] font-black whitespace-nowrap z-10 pointer-events-none shadow-xl border border-border">
                        ₹{stat.revenue.toLocaleString('en-IN')}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-primary" />
                     </div>
                     
                     {/* Bar */}
                     <div 
                        className="w-full bg-accent/30 rounded-t-xl group-hover:bg-accent transition-all duration-500 cursor-help relative overflow-hidden" 
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

        {/* Right 1 Column: Recent Activity */}
        <div className="bg-surface rounded-[2.5rem] border border-border shadow-2xl overflow-hidden flex flex-col lg:h-[450px]">
          <div className="p-8 border-b border-border flex justify-between items-center bg-background/20">
              <h3 className="text-xl font-black text-primary">Recent Bookings</h3>
              <Link to="/host/reservations" className="text-xs text-accent font-bold hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
          </div>
          <div className="p-6 flex-1 overflow-y-auto space-y-3.5 custom-scrollbar">
              {data?.recentReservations.length > 0 ? (
                data.recentReservations.map((res) => (
                  <div key={res.id} className="flex items-center justify-between p-4 bg-background/40 hover:bg-background/80 rounded-2xl border border-border transition-all hover:scale-[1.01] hover:shadow-md duration-300">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-surface border border-border rounded-xl flex items-center justify-center shadow-sm shrink-0">
                        {res.type === 'ROOM' ? <BedDouble className="w-5 h-5 text-accent" /> : <Utensils className="w-5 h-5 text-accent" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-primary truncate text-sm">{res.room?.title || res.room?.name}</p>
                        <p className="text-[10px] text-taupe font-black uppercase truncate mt-0.5">Tenant: {res.tenant?.name}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3 flex flex-col items-end">
                      <p className="font-black text-primary text-sm">₹{res.totalPrice?.toLocaleString()}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider mt-1 ${
                        res.status === 'CONFIRMED' 
                          ? 'bg-green-500/10 text-green-500 dark:bg-green-500/20' 
                          : 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20'
                      }`}>
                        {res.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                    <CalendarCheck className="w-12 h-12 text-taupe/40 mb-4 animate-bounce" />
                    <div className="text-primary font-bold text-sm">No recent activity.</div>
                    <p className="text-taupe text-xs mt-1 max-w-[200px]">New requests will appear here once submitted.</p>
                </div>
              )}
          </div>
        </div>

      </div>

    </div>
  );
}
