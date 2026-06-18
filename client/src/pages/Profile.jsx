import { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, MapPin, Star, Settings, ChevronRight, LogOut, Loader2, Building2, Utensils, LayoutDashboard, PlusCircle, MessageSquare, Heart, Wrench, AlertCircle, CheckCircle2, Clock, Sparkles, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../utils/api';

export default function Profile() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  
  // Lifestyle States
  const [lifestyle, setLifestyle] = useState({
    bio: '',
    college: '',
    studyPreference: 'NEUTRAL',
    cleanlinessLevel: 3,
    socialPreference: 'NEUTRAL',
    isSmoking: false,
    isVegetarian: false
  });

  const isHost = user?.role === 'HOST';

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        const tickRes = await fetch(`${API_URL}/api/maintenance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const tickData = await tickRes.json();

        if (res.ok) {
          setProfileData(data);
          setTickets(tickData || []);
          // Sync lifestyle data
          if (data.user) {
            setLifestyle({
              bio: data.user.bio || '',
              college: data.user.college || '',
              studyPreference: data.user.studyPreference || 'NEUTRAL',
              cleanlinessLevel: data.user.cleanlinessLevel || 3,
              socialPreference: data.user.socialPreference || 'NEUTRAL',
              isSmoking: data.user.isSmoking || false,
              isVegetarian: data.user.isVegetarian || false
            });
          }
        } else {
          setError(data.error || 'Failed to load profile');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(lifestyle)
      });
      if (res.ok) {
        // Success feedback
        const updated = await res.json();
        setProfileData(prev => ({ ...prev, user: updated.user }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

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

  return (
    <div className="flex-1 bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Profile Header */}
        <div className="bg-surface rounded-[3rem] p-8 sm:p-12 shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -mr-48 -mt-48" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-40 h-40 bg-primary rounded-[2.5rem] flex items-center justify-center text-background text-6xl font-black shadow-2xl border-4 border-white/10 transform rotate-3">
              {user?.name?.charAt(0) || 'U'}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h2 className="text-5xl font-black text-primary tracking-tighter">{user?.name}</h2>
                <div className="flex gap-2 justify-center">
                  <span className="px-4 py-1.5 bg-accent/10 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest border border-accent/20">
                    {user?.role}
                  </span>
                  {profileData?.user?.isVerified && (
                    <span className="px-4 py-1.5 bg-green-500/10 text-green-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-500/20 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
              <p className="text-lg text-taupe font-medium mb-8 max-w-lg">{lifestyle.bio || "No bio set yet. Tell potential roommates about yourself!"}</p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-primary/5 rounded-2xl border border-white/5 text-center">
                   <p className="text-2xl font-black text-primary">{isHost ? (profileData?.myListings?.length || 0) : (profileData?.myBookings?.length || 0)}</p>
                   <p className="text-[10px] font-black text-taupe uppercase tracking-widest">{isHost ? 'Listings' : 'Bookings'}</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-2xl border border-white/5 text-center">
                   <p className="text-2xl font-black text-primary">{profileData?.user?.wishlist?.length || 0}</p>
                   <p className="text-[10px] font-black text-taupe uppercase tracking-widest">Wishlist</p>
                </div>
                {isHost && (
                  <div className="p-4 bg-primary/5 rounded-2xl border border-white/5 text-center col-span-2">
                    <p className="text-2xl font-black text-green-500">₹{(profileData?.monthlyStats?.reduce((sum, s) => sum + s.revenue, 0) || 0).toLocaleString()}</p>
                    <p className="text-[10px] font-black text-taupe uppercase tracking-widest">Total Revenue</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-surface rounded-[2.5rem] overflow-hidden shadow-xl border border-white/10 p-4">
              <div className="px-6 py-4 mb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Account Menu</p>
              </div>
              <div className="space-y-1">
                <button className="w-full flex items-center justify-between px-6 py-5 text-primary bg-primary/5 rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest">
                  <div className="flex items-center gap-4">
                    <User className="w-5 h-5 text-accent" /> Personal Info
                  </div>
                  <ChevronRight className="w-4 h-4 text-taupe" />
                </button>
                <button onClick={() => navigate('/inbox')} className="w-full flex items-center justify-between px-6 py-5 text-taupe hover:text-primary hover:bg-primary/5 rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest">
                  <div className="flex items-center gap-4">
                    <MessageSquare className="w-5 h-5" /> Inbox
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
                {!isHost && (
                  <button onClick={() => navigate('/roommates')} className="w-full flex items-center justify-between px-6 py-5 text-taupe hover:text-primary hover:bg-primary/5 rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest group">
                    <div className="flex items-center gap-4">
                      <Sparkles className="w-5 h-5 group-hover:text-accent transition-colors" /> Roommate Finder
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                <button className="w-full flex items-center justify-between px-6 py-5 text-taupe hover:text-primary hover:bg-primary/5 rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest">
                  <div className="flex items-center gap-4">
                    <Settings className="w-5 h-5" /> Settings
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-5 text-red-500 bg-red-500/5 hover:bg-red-500 hover:text-white rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest mt-6">
                  <LogOut className="w-5 h-5" /> Terminate Session
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Lifestyle & AI Matching Section (Only for Tenants) */}
            {!isHost && (
              <div className="bg-surface rounded-[2.5rem] p-10 shadow-xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Sparkles className="w-32 h-32 text-accent" />
                </div>
                
                <div className="mb-10">
                  <h3 className="text-3xl font-black text-primary tracking-tighter mb-2">Lifestyle & Matching</h3>
                  <p className="text-sm text-taupe font-medium">Fine-tune your preferences to find the perfect roommate.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-taupe px-1">College / University</label>
                      <input 
                        type="text" 
                        value={lifestyle.college}
                        onChange={(e) => setLifestyle({...lifestyle, college: e.target.value})}
                        className="w-full px-6 py-4 bg-background border border-white/5 rounded-2xl focus:ring-2 focus:ring-accent outline-none text-primary font-bold"
                        placeholder="e.g. Pune University"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-taupe px-1">Study Preference</label>
                      <select 
                        value={lifestyle.studyPreference}
                        onChange={(e) => setLifestyle({...lifestyle, studyPreference: e.target.value})}
                        className="w-full px-6 py-4 bg-background border border-white/5 rounded-2xl focus:ring-2 focus:ring-accent outline-none text-primary font-bold appearance-none"
                      >
                        <option value="MORNING">Early Bird (Morning)</option>
                        <option value="NIGHT">Night Owl (Late Night)</option>
                        <option value="NEUTRAL">Flexible / Neutral</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-taupe px-1">Social Style</label>
                      <select 
                        value={lifestyle.socialPreference}
                        onChange={(e) => setLifestyle({...lifestyle, socialPreference: e.target.value})}
                        className="w-full px-6 py-4 bg-background border border-white/5 rounded-2xl focus:ring-2 focus:ring-accent outline-none text-primary font-bold appearance-none"
                      >
                        <option value="INTROVERT">Introvert (Quiet Vibe)</option>
                        <option value="EXTROVERT">Extrovert (Social Vibe)</option>
                        <option value="NEUTRAL">In-Between</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-taupe px-1">Cleanliness Level ({lifestyle.cleanlinessLevel}/5)</label>
                      <input 
                        type="range" min="1" max="5" step="1"
                        value={lifestyle.cleanlinessLevel}
                        onChange={(e) => setLifestyle({...lifestyle, cleanlinessLevel: parseInt(e.target.value)})}
                        className="w-full h-12 accent-accent cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-taupe px-1">Short Bio</label>
                    <textarea 
                      value={lifestyle.bio}
                      onChange={(e) => setLifestyle({...lifestyle, bio: e.target.value})}
                      className="w-full px-6 py-4 bg-background border border-white/5 rounded-2xl focus:ring-2 focus:ring-accent outline-none text-primary font-bold h-32 resize-none"
                      placeholder="Tell potential roommates about your hobbies, vibe, and expectations..."
                    />
                  </div>

                  <div className="flex flex-wrap gap-8">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={lifestyle.isSmoking}
                        onChange={(e) => setLifestyle({...lifestyle, isSmoking: e.target.checked})}
                        className="w-6 h-6 rounded-lg border-2 border-white/10 bg-background checked:bg-accent transition-all cursor-pointer"
                      />
                      <span className="text-xs font-black text-primary uppercase tracking-widest group-hover:text-accent transition-colors">I Smoke</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={lifestyle.isVegetarian}
                        onChange={(e) => setLifestyle({...lifestyle, isVegetarian: e.target.checked})}
                        className="w-6 h-6 rounded-lg border-2 border-white/10 bg-background checked:bg-accent transition-all cursor-pointer"
                      />
                      <span className="text-xs font-black text-primary uppercase tracking-widest group-hover:text-accent transition-colors">Vegetarian</span>
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-3 px-8 py-5 bg-primary text-background rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent transition-all shadow-xl disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Sync Lifestyle Data
                  </button>
                </form>
              </div>
            )}

            {/* Bookings / Management Section */}
            <div className="bg-surface rounded-[2.5rem] p-10 shadow-xl border border-white/10">
               <div className="flex items-center justify-between mb-10">
                 <h3 className="text-3xl font-black text-primary tracking-tighter">
                   {isHost ? 'Inventory Management' : 'Live Bookings'}
                 </h3>
                 <Link to={isHost ? "/host/properties" : "/home"} className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                    {isHost ? 'Manage All' : 'Discover More'} <ChevronRight className="w-4 h-4" />
                 </Link>
               </div>
               
               <div className="space-y-4">
                  {isHost ? (
                    profileData?.myListings?.slice(0, 3).map(listing => (
                      <div key={listing.id} className="p-6 bg-background rounded-3xl border border-white/5 flex items-center gap-6 group hover:border-accent/30 transition-all">
                         <div className="w-20 h-20 rounded-2xl bg-primary/5 overflow-hidden flex-shrink-0">
                            <img src={listing.images?.[0]?.url || `/assets/rooms/student_room_${(listing.id % 15) + 1}.png`} className="w-full h-full object-cover" alt="" />
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-black text-primary mb-1">{listing.title}</p>
                            <p className="text-[10px] font-black text-taupe uppercase tracking-widest">{listing.location}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black text-primary">₹{listing.price.toLocaleString()}</p>
                            <p className={`text-[9px] font-black uppercase tracking-widest ${listing.isBooked ? 'text-red-500' : 'text-green-500'}`}>
                               {listing.isBooked ? 'Occupied' : 'Active'}
                            </p>
                         </div>
                      </div>
                    ))
                  ) : (
                    profileData?.myBookings?.slice(0, 3).map(booking => (
                      <div key={booking.id} className="p-6 bg-background rounded-3xl border border-white/5 flex items-center gap-6 group hover:border-accent/30 transition-all">
                         <div className="w-20 h-20 rounded-2xl bg-primary/5 overflow-hidden flex-shrink-0">
                            <img src={booking.room?.images?.[0]?.url || `/assets/rooms/student_room_${(booking.roomId % 15) + 1}.png`} className="w-full h-full object-cover" alt="" />
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-black text-primary mb-1">{booking.room?.title}</p>
                            <p className="text-[10px] font-black text-taupe uppercase tracking-widest">{booking.status} • {new Date(booking.createdAt).toLocaleDateString()}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black text-primary">₹{booking.totalPrice.toLocaleString()}</p>
                            <p className="text-[10px] font-black text-accent uppercase tracking-widest">{booking.type}</p>
                         </div>
                      </div>
                    ))
                  )}
                  {((isHost ? profileData?.myListings?.length : profileData?.myBookings?.length) || 0) === 0 && (
                    <div className="text-center py-20 bg-background rounded-3xl border border-dashed border-white/10">
                       <p className="text-taupe font-black text-[10px] uppercase tracking-[0.2em]">No records found</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
