import { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, MapPin, Star, Settings, ChevronRight, LogOut, Loader2, Building2, Utensils, LayoutDashboard, PlusCircle, MessageSquare, Heart, Wrench, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Profile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const isHost = user?.role === 'HOST';

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        const tickRes = await fetch('http://localhost:5000/api/maintenance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const tickData = await tickRes.json();

        if (res.ok) {
          setProfileData(data);
          setTickets(tickData || []);
        } else {
          setError(data.error || 'Failed to load profile');
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[calc(100vh-80px)]">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-taupe font-bold animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 bg-background">
        <div className="bg-red-500/10 text-red-500 p-6 rounded-3xl border border-red-500/20 max-w-md text-center">
          <p className="text-lg font-bold mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex-1 bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Profile Header */}
        <div className="bg-surface rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center text-background text-5xl font-bold shadow-2xl border-4 border-white/10">
              {user?.name?.charAt(0) || 'U'}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-primary">{user?.name}</h1>
                <span className="inline-flex items-center px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold tracking-wider uppercase">
                  <Shield className="w-3 h-3 mr-1" /> {user?.role}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 text-taupe font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {user?.email}
                </div>
                <div className="hidden sm:block w-1 h-1 bg-taupe/30 rounded-full" />
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Member since 2026
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {isHost && (
                <Link 
                  to="/host" 
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-accent text-background rounded-2xl transition-all font-bold shadow-lg shadow-accent/20 hover:scale-105"
                >
                  <LayoutDashboard className="w-4 h-4" /> Landlord Dashboard
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-bold border border-red-500/20"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Stats & Menu */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="bg-surface rounded-3xl p-6 shadow-lg border border-white/10">
              <h3 className="text-lg font-bold text-primary mb-6">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-background rounded-2xl border border-white/5">
                  <p className="text-2xl font-bold text-accent">
                    {isHost ? (profileData?.myListings?.length || 0) : (profileData?.myBookings?.length || 0)}
                  </p>
                  <p className="text-xs font-bold text-taupe uppercase tracking-wider">
                    {isHost ? 'Listings' : 'Bookings'}
                  </p>
                </div>
                <div className="p-4 bg-background rounded-2xl border border-white/5">
                  <p className="text-2xl font-bold text-primary">
                    {isHost ? (profileData?.inboundBookings?.length || 0) : (profileData?.wishlist?.length || 0)}
                  </p>
                  <p className="text-xs font-bold text-taupe uppercase tracking-wider">
                    {isHost ? 'Reservations' : 'Wishlist'}
                  </p>
                </div>
                {isHost && (
                  <div className="p-4 bg-background rounded-2xl border border-white/5 col-span-2">
                    <p className="text-2xl font-bold text-green-500">
                      ₹{(profileData?.monthlyStats?.reduce((sum, s) => sum + s.revenue, 0) || 0).toLocaleString()}
                    </p>
                    <p className="text-xs font-bold text-taupe uppercase tracking-wider">
                      Total Revenue
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Menu */}
            <div className="bg-surface rounded-3xl overflow-hidden shadow-lg border border-white/10">
              <button className="w-full flex items-center justify-between px-6 py-4 text-primary hover:bg-accent/5 transition-colors font-bold text-left border-b border-white/5">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-taupe" /> Personal Info
                </div>
                <ChevronRight className="w-4 h-4 text-taupe" />
              </button>
              <button 
                onClick={() => navigate('/inbox')}
                className="w-full flex items-center justify-between px-6 py-4 text-primary hover:bg-accent/5 transition-colors font-bold text-left border-b border-white/5"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-taupe" /> Inbox
                </div>
                <ChevronRight className="w-4 h-4 text-taupe" />
              </button>
              <button className="w-full flex items-center justify-between px-6 py-4 text-primary hover:bg-accent/5 transition-colors font-bold text-left border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-taupe" /> Account Settings
                </div>
                <ChevronRight className="w-4 h-4 text-taupe" />
              </button>
              <button className="w-full flex items-center justify-between px-6 py-4 text-primary hover:bg-accent/5 transition-colors font-bold text-left">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-taupe" /> Security & Privacy
                </div>
                <ChevronRight className="w-4 h-4 text-taupe" />
              </button>
            </div>
          </div>

          {/* Right Column: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-surface rounded-3xl p-8 shadow-lg border border-white/10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-primary">
                  {isHost ? 'Manage My Properties' : 'My Current Bookings'}
                </h3>
                <button 
                  onClick={() => navigate(isHost ? '/host/properties' : '/profile')}
                  className="text-accent font-bold text-sm hover:underline"
                >
                  {isHost ? 'View All Listings' : 'View History'}
                </button>
              </div>

              {/* HOST VIEW: Show Listings & Messes */}
              {isHost && (
                <div className="space-y-8">
                  {/* Property Listings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-taupe uppercase tracking-widest px-1">My Property Listings</h4>
                    {profileData?.myListings?.length > 0 ? (
                      profileData.myListings.map((listing) => (
                        <div 
                          key={listing.id}
                          className="group flex flex-col sm:flex-row gap-6 p-6 bg-background rounded-[2rem] border border-white/5 hover:border-accent/30 transition-all hover:shadow-xl"
                        >
                          <div className="w-full sm:w-32 h-32 rounded-2xl bg-primary/10 overflow-hidden">
                             <img src={listing.images?.[0]?.url || `/assets/rooms/student_room_${(listing.id % 15) + 1}.png`} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-xl font-bold text-primary group-hover:text-accent transition-colors">{listing.title}</h4>
                              <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-black uppercase">{listing.isBooked ? 'OCCUPIED' : 'ACTIVE'}</span>
                            </div>
                            <p className="text-sm text-taupe mb-4 flex items-center gap-1.5 font-medium">
                              <MapPin className="w-3.5 h-3.5" /> {listing.location}
                            </p>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                               <div className="text-lg font-bold text-primary">₹{listing.price?.toLocaleString()}</div>
                               <button 
                                 onClick={() => navigate('/host/properties')}
                                 className="text-xs font-bold bg-primary text-background px-4 py-2 rounded-xl hover:bg-accent transition-colors"
                               >
                                 Manage Listing
                               </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 px-4 bg-background rounded-3xl border border-dashed border-white/10">
                        <p className="text-taupe font-bold text-sm">No properties listed yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Mess Listings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-taupe uppercase tracking-widest px-1">My Mess Listings</h4>
                    {profileData?.myMesses?.length > 0 ? (
                      profileData.myMesses.map((mess) => (
                        <div 
                          key={mess.id}
                          className="group flex flex-col sm:flex-row gap-6 p-6 bg-background rounded-[2rem] border border-white/5 hover:border-accent/30 transition-all hover:shadow-xl"
                        >
                          <div className="w-full sm:w-32 h-32 rounded-2xl bg-primary/10 overflow-hidden">
                             <img src={mess.images?.[0]?.url || `/assets/messes/mess_${(mess.id % 5) + 1}.png`} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-xl font-bold text-primary group-hover:text-accent transition-colors">{mess.name}</h4>
                              <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-black uppercase">ACTIVE</span>
                            </div>
                            <p className="text-sm text-taupe mb-4 flex items-center gap-1.5 font-medium">
                              <MapPin className="w-3.5 h-3.5" /> {mess.location}
                            </p>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                               <div className="text-lg font-bold text-primary">₹{mess.price?.toLocaleString()}</div>
                               <button 
                                 onClick={() => navigate('/home')}
                                 className="text-xs font-bold bg-primary text-background px-4 py-2 rounded-xl hover:bg-accent transition-colors"
                               >
                                 View Public Page
                               </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 px-4 bg-background rounded-3xl border border-dashed border-white/10">
                        <p className="text-taupe font-bold text-sm">No messes listed yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SHARED/TENANT VIEW: Show Bookings (Show for both roles now) */}
              <div className={`space-y-4 ${isHost ? 'mt-12 pt-12 border-t border-white/10' : ''}`}>
                {isHost && <h3 className="text-2xl font-bold text-primary mb-8">My Personal Bookings</h3>}
                <div className="space-y-4">
                  {profileData?.myBookings?.length > 0 ? (
                    profileData.myBookings.map((booking) => (
                      <div 
                        key={booking.id}
                        className="group flex flex-col sm:flex-row gap-6 p-6 bg-background rounded-[2rem] border border-white/5 hover:border-accent/30 transition-all hover:shadow-xl"
                      >
                        <div className="w-full sm:w-32 h-32 rounded-2xl bg-primary/10 overflow-hidden relative">
                           {booking.room?.images?.[0] ? (
                              <img src={booking.room.images[0].url} className="w-full h-full object-cover" alt="" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                 {booking.type === 'ROOM' ? <Building2 className="w-8 h-8 text-taupe" /> : <Utensils className="w-8 h-8 text-taupe" />}
                              </div>
                           )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-xl font-bold text-primary group-hover:text-accent transition-colors">{booking.room?.title || booking.room?.name}</h4>
                            <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-lg text-[10px] font-black uppercase">{booking.status}</span>
                          </div>
                          <p className="text-sm text-taupe mb-4 flex items-center gap-1.5 font-medium">
                            <MapPin className="w-3.5 h-3.5" /> {booking.room?.location}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t border-white/5">
                             <div className="text-lg font-bold text-primary">₹{booking.totalPrice?.toLocaleString()}</div>
                             <div className="flex gap-2">
                               {booking.type === 'ROOM' && booking.status === 'CONFIRMED' && (
                                 <button 
                                   onClick={() => { setSelectedRoomId(booking.roomId); setIsReportModalOpen(true); }}
                                   className="text-xs font-bold bg-red-500/10 text-red-500 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1"
                                 >
                                   <AlertCircle className="w-3 h-3" /> Report Issue
                                 </button>
                               )}
                               <button 
                                 onClick={() => navigate(booking.type === 'ROOM' ? `/room/${booking.roomId}` : `/home`)}
                                 className="text-xs font-bold bg-primary text-background px-4 py-2 rounded-xl hover:bg-accent transition-colors"
                               >
                                 View Details
                               </button>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 px-4 bg-background rounded-3xl border border-dashed border-white/10">
                      <div className="w-20 h-20 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10 text-accent/30" />
                      </div>
                      <h4 className="text-xl font-bold text-primary mb-2">No Active Bookings</h4>
                      <p className="text-taupe mb-8 max-w-xs mx-auto font-medium">You haven't booked any hostels or mess services yet. Start exploring now!</p>
                      <button 
                        onClick={() => navigate('/home')}
                        className="px-8 py-3 bg-accent text-background rounded-2xl font-bold shadow-lg shadow-accent/20 hover:scale-105 transition-transform"
                      >
                        Browse Hostels
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance Requests Section */}
              <div className="mt-12 pt-12 border-t border-white/10">
                 <h3 className="text-2xl font-bold text-primary mb-8 flex items-center gap-2">
                   <Wrench className="w-6 h-6 text-accent" /> My Maintenance Requests
                 </h3>
                 {tickets.length > 0 ? (
                   <div className="space-y-4">
                     {tickets.map(ticket => (
                       <div key={ticket.id} className="p-6 bg-background rounded-3xl border border-white/5">
                         <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-primary text-lg">{ticket.title}</h4>
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-600' : 
                             ticket.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                           }`}>
                             {ticket.status}
                           </span>
                         </div>
                         <p className="text-sm text-taupe mb-4">{ticket.description}</p>
                         {ticket.hostResponse && (
                           <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                             <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Landlord Response</p>
                             <p className="text-sm text-taupe font-medium">{ticket.hostResponse}</p>
                           </div>
                         )}
                         <div className="mt-4 text-xs text-taupe font-bold flex justify-between">
                           <span>{ticket.room?.title}</span>
                           <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-8 bg-background rounded-3xl border border-dashed border-white/10">
                     <p className="text-taupe font-bold text-sm">You haven't reported any issues.</p>
                   </div>
                 )}
              </div>

              {/* Wishlist Section */}
              <div className="mt-12 pt-12 border-t border-white/10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-primary">Saved for Later</h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-taupe uppercase tracking-widest">
                      <Heart className="w-4 h-4 text-red-500 fill-current" /> {profileData?.wishlist?.length || 0} items
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {profileData?.wishlist?.length > 0 ? (
                      profileData.wishlist.map((item) => {
                        const target = item.room || item.mess;
                        const type = item.room ? 'room' : 'mess';
                        return (
                          <Link 
                            key={item.id}
                            to={type === 'room' ? `/room/${target.id}` : `/home`}
                            className="group bg-background rounded-[2rem] border border-white/5 overflow-hidden hover:border-accent/30 transition-all hover:shadow-2xl"
                          >
                            <div className="aspect-video relative overflow-hidden">
                               <img 
                                 src={target.images?.[0]?.url || (type === 'room' ? `/assets/rooms/student_room_${(target.id % 15) + 1}.png` : `/assets/messes/mess_${(target.id % 5) + 1}.png`)} 
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                 alt="" 
                               />
                               <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md p-2 rounded-full text-red-500 shadow-lg">
                                  <Heart className="w-4 h-4 fill-current" />
                               </div>
                            </div>
                            <div className="p-6">
                               <h4 className="text-lg font-bold text-primary mb-1 group-hover:text-accent transition-colors truncate">{target.title || target.name}</h4>
                               <p className="text-xs text-taupe mb-4 flex items-center gap-1 font-medium truncate">
                                 <MapPin className="w-3 h-3" /> {target.location}
                               </p>
                               <div className="flex items-center justify-between">
                                  <span className="text-primary font-bold">₹{target.price?.toLocaleString()}</span>
                                  <span className="text-[10px] font-black uppercase text-taupe px-2 py-1 bg-surface rounded-lg">{type}</span>
                               </div>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <div className="sm:col-span-2 text-center py-12 bg-background rounded-3xl border border-dashed border-white/10">
                        <p className="text-taupe font-bold text-sm">Your wishlist is empty. Start saving your favorite places!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
      </div>
    </div>
  </div>

  {/* Report Issue Modal */}
  {isReportModalOpen && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 p-6">
        <h2 className="text-xl font-black text-primary mb-6 flex items-center gap-2">
          <AlertCircle className="w-6 h-6 text-red-500" /> Report an Issue
        </h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          await fetch('http://localhost:5000/api/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              roomId: selectedRoomId,
              title: formData.get('title'),
              description: formData.get('description'),
              priority: formData.get('priority')
            })
          });
          setIsReportModalOpen(false);
          // Refresh tickets locally
          const tickRes = await fetch('http://localhost:5000/api/maintenance', { headers: { 'Authorization': `Bearer ${token}` } });
          setTickets(await tickRes.json());
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-primary mb-2">Issue Title</label>
            <input name="title" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none text-primary" placeholder="e.g. Broken AC" />
          </div>
          <div>
            <label className="block text-sm font-bold text-primary mb-2">Description</label>
            <textarea name="description" required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none text-primary min-h-[100px]" placeholder="Details of the issue..."></textarea>
          </div>
          <div>
            <label className="block text-sm font-bold text-primary mb-2">Priority</label>
            <select name="priority" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent outline-none text-primary">
              <option value="LOW">Low - Not urgent</option>
              <option value="MEDIUM">Medium - Needs attention soon</option>
              <option value="HIGH">High - Urgent/Emergency</option>
            </select>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setIsReportModalOpen(false)} className="w-1/2 py-3 font-bold text-taupe hover:text-primary">Cancel</button>
            <button type="submit" className="w-1/2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors">Submit Ticket</button>
          </div>
        </form>
      </div>
    </div>
  )}
  </>
  );
}
