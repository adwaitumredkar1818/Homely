import { useState, useEffect } from 'react';
import { Wallet, BedDouble, CalendarCheck, TrendingUp, Loader2, Utensils } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await res.json();
        
        // Calculate stats
        const activeListings = (profileData.myListings?.length || 0) + (profileData.myMesses?.length || 0);
        const upcomingBookings = profileData.inboundBookings?.filter(b => b.status === 'PENDING').length || 0;
        const totalRevenue = profileData.monthlyStats?.reduce((sum, s) => sum + s.revenue, 0) || 0;
        const confirmedBookings = profileData.inboundBookings?.filter(b => b.status === 'CONFIRMED').length || 0;

        setData({
          stats: [
            { name: 'Total Listings', stat: activeListings.toString(), icon: BedDouble, trend: 'Properties & Mess' },
            { name: 'Pending Requests', stat: upcomingBookings.toString(), icon: CalendarCheck, trend: 'Requires attention' },
            { name: 'Total Revenue', stat: `₹${totalRevenue.toLocaleString()}`, icon: Wallet, trend: 'Lifetime earnings' },
            { name: 'Confirmed Sales', stat: confirmedBookings.toString(), icon: TrendingUp, trend: 'Total success' },
          ],
          recentReservations: profileData.inboundBookings?.slice(0, 5) || []
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.stats.map((item) => (
          <div key={item.name} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl relative overflow-hidden group hover:border-primary/20 transition-all">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-black text-taupe uppercase tracking-widest">{item.name}</p>
                <p className="text-3xl font-black text-primary mt-2">{item.stat}</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-2xl group-hover:bg-primary transition-colors duration-300">
                <item.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors duration-300" />
              </div>
            </div>
            <div className="mt-5 flex items-center text-[10px] font-black uppercase tracking-widest text-taupe">
               <span className="text-accent">{item.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity/Bookings Block */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h3 className="text-xl font-black text-primary">Recent Activity</h3>
            <button className="text-sm text-accent font-bold hover:underline">View All Reservations</button>
        </div>
        <div className="p-8">
            {data?.recentReservations.length > 0 ? (
              <div className="space-y-4">
                {data.recentReservations.map((res) => (
                  <div key={res.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        {res.type === 'ROOM' ? <BedDouble className="w-6 h-6 text-primary" /> : <Utensils className="w-6 h-6 text-accent" />}
                      </div>
                      <div>
                        <p className="font-bold text-primary">{res.room?.title || res.room?.name}</p>
                        <p className="text-xs text-taupe font-medium">Tenant: {res.tenant?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">₹{res.totalPrice?.toLocaleString()}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${res.status === 'CONFIRMED' ? 'text-green-500' : 'text-amber-500'}`}>
                        {res.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                  <CalendarCheck className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                  <div className="text-taupe font-bold text-lg">No recent activity found.</div>
                  <p className="text-taupe/60 text-sm mt-1">New requests will appear here as soon as they arrive.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
