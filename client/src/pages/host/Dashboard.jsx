import { Wallet, BedDouble, CalendarCheck, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { name: 'Active Listings', stat: '4', icon: BedDouble, trend: '+1' },
    { name: 'Upcoming Bookings', stat: '12', icon: CalendarCheck, trend: '+3' },
    { name: 'Monthly Revenue', stat: '₹4,280', icon: Wallet, trend: '+12%' },
    { name: 'Profile Views', stat: '840', icon: TrendingUp, trend: '+24%' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div key={item.name} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-gray-500">{item.name}</p>
                <p className="text-3xl font-bold text-primary mt-2">{item.stat}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-accent transition-colors duration-300">
                <item.icon className="h-6 w-6 text-accent group-hover:text-white transition-colors duration-300" />
              </div>
            </div>
            <div className="mt-5 flex items-center text-sm">
               <span className="text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">{item.trend}</span>
               <span className="text-gray-400 font-medium ml-2">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity/Bookings Block */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-primary">Recent Booking Requests</h3>
            <button className="text-sm text-accent font-semibold hover:underline">View all</button>
        </div>
        <div className="p-6 text-center py-16">
            <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <div className="text-gray-500 font-medium">You currently have no new pending requests.</div>
        </div>
      </div>
    </div>
  );
}
