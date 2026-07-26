import { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, MapPin, Star, Settings, ChevronRight, LogOut, Loader2, Building2, Utensils, LayoutDashboard, PlusCircle, MessageSquare, Heart, Wrench, AlertCircle, CheckCircle2, Clock, Sparkles, BookOpen, Users, Cigarette, Leaf } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState('bookings');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [personalForm, setPersonalForm] = useState({
    name: '',
    bio: '',
    college: '',
    studyPreference: '',
    socialPreference: '',
    cleanlinessLevel: 3,
    isSmoking: false,
    isVegetarian: false
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [securityForm, setSecurityForm] = useState({
    profileVisibility: 'PUBLIC',
    emailAlerts: true,
    pushNotifications: true
  });

  // Roommate Ad States
  const [roommateAd, setRoommateAd] = useState(null);
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adBudget, setAdBudget] = useState('');
  const [adMoveIn, setAdMoveIn] = useState('');
  const [studyPref, setStudyPref] = useState('Quiet Study');
  const [socialPref, setSocialPref] = useState('Balanced');
  const [cleanliness, setCleanliness] = useState(3);
  const [isSmoking, setIsSmoking] = useState(false);
  const [isVeg, setIsVeg] = useState(false);
  const [isAdSubmitting, setIsAdSubmitting] = useState(false);

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

          // Fetch roommate ad
          const roommateRes = await fetch('http://localhost:5000/api/roommates');
          if (roommateRes.ok) {
            const allAds = await roommateRes.json();
            const userAd = allAds.find(ad => ad.posterId === data.user.id);
            if (userAd) {
              setRoommateAd(userAd);
              setAdTitle(userAd.title || '');
              setAdDesc(userAd.description || '');
              setAdBudget(userAd.budget || '');
              setAdMoveIn(userAd.moveInDate ? new Date(userAd.moveInDate).toISOString().split('T')[0] : '');
              setStudyPref(userAd.studyPreference || 'Quiet Study');
              setSocialPref(userAd.socialPreference || 'Balanced');
              setCleanliness(userAd.cleanlinessLevel || 3);
              setIsSmoking(userAd.isSmoking || false);
              setIsVeg(userAd.isVegetarian || false);
            }
          }
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

  useEffect(() => {
    if (profileData?.user) {
      setPersonalForm({
        name: profileData.user.name || '',
        bio: profileData.user.bio || '',
        college: profileData.user.college || '',
        studyPreference: profileData.user.studyPreference || '',
        socialPreference: profileData.user.socialPreference || '',
        cleanlinessLevel: profileData.user.cleanlinessLevel || 3,
        isSmoking: profileData.user.isSmoking || false,
        isVegetarian: profileData.user.isVegetarian || false
      });
    }
  }, [profileData]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLeaveRoom = async (bookingId) => {
    if (!window.confirm('Are you sure you want to leave this room and cancel your booking?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh profile data
        const profileRes = await fetch('http://localhost:5000/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const freshData = await profileRes.json();
          setProfileData(freshData);
        }
      } else {
        alert(data.error || 'Failed to leave room');
      }
    } catch (err) {
      alert('Network error. Failed to leave room.');
    }
  };

  const handleLeaveMess = async (subId) => {
    if (!window.confirm('Are you sure you want to cancel your tiffin subscription to this mess?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/messes/subscriptions/${subId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh profile data
        const profileRes = await fetch('http://localhost:5000/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (profileRes.ok) {
          const freshData = await profileRes.json();
          setProfileData(freshData);
        }
      } else {
        alert(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      alert('Network error. Failed to cancel subscription.');
    }
  };

  const handlePublishRoommateAd = async (e) => {
    e.preventDefault();
    setIsAdSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    const payload = {
      title: adTitle,
      description: adDesc,
      budget: parseFloat(adBudget),
      moveInDate: adMoveIn,
      studyPreference: studyPref,
      socialPreference: socialPref,
      cleanlinessLevel: parseInt(cleanliness),
      isSmoking,
      isVegetarian: isVeg
    };

    try {
      const url = roommateAd 
        ? `http://localhost:5000/api/roommates/${roommateAd.id}`
        : 'http://localhost:5000/api/roommates';
      const method = roommateAd ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setRoommateAd(data);
        setSuccessMessage(roommateAd ? 'Roommate ad updated successfully!' : 'Roommate ad published successfully!');
      } else {
        setErrorMessage(data.error || 'Failed to save roommate ad.');
      }
    } catch (err) {
      setErrorMessage('Network error. Failed to save roommate ad.');
    } finally {
      setIsAdSubmitting(false);
    }
  };

  const handleDeleteRoommateAd = async () => {
    if (!roommateAd) return;
    if (!window.confirm('Are you sure you want to delete your roommate ad?')) return;
    setIsAdSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch(`http://localhost:5000/api/roommates/${roommateAd.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setRoommateAd(null);
        setAdTitle('');
        setAdDesc('');
        setAdBudget('');
        setAdMoveIn('');
        setStudyPref('Quiet Study');
        setSocialPref('Balanced');
        setCleanliness(3);
        setIsSmoking(false);
        setIsVeg(false);
        setSuccessMessage('Roommate ad deleted successfully!');
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to delete roommate ad.');
      }
    } catch (err) {
      setErrorMessage('Network error. Failed to delete roommate ad.');
    } finally {
      setIsAdSubmitting(false);
    }
  };

  useEffect(() => {
    const savedSecurity = localStorage.getItem('securitySettings');
    if (savedSecurity) {
      setSecurityForm(JSON.parse(savedSecurity));
    }
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(personalForm)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Profile updated successfully!');
        setProfileData(prev => ({
          ...prev,
          user: {
            ...prev.user,
            ...data.user
          }
        }));
      } else {
        setErrorMessage(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setErrorMessage(data.error || 'Failed to change password');
      }
    } catch (err) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSecurity = (e) => {
    e.preventDefault();
    setSuccessMessage('Security and privacy settings updated!');
    localStorage.setItem('securitySettings', JSON.stringify(securityForm));
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
                {profileData?.user?.isVerified ? (
                  <span className="inline-flex items-center px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold tracking-wider uppercase">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Verified User
                  </span>
                ) : (
                  <Link 
                    to="/verification"
                    className="inline-flex items-center px-3 py-1 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-full text-xs font-bold tracking-wider uppercase transition-colors"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" /> Get Verified
                  </Link>
                )}
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
              <button 
                onClick={() => { setActiveTab('bookings'); setSuccessMessage(''); setErrorMessage(''); }}
                className={`w-full flex items-center justify-between px-6 py-4 transition-colors font-bold text-left border-b border-white/5 ${activeTab === 'bookings' ? 'bg-primary text-background' : 'text-primary hover:bg-accent/5'}`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className={`w-5 h-5 ${activeTab === 'bookings' ? 'text-background' : 'text-taupe'}`} /> {isHost ? 'Landlord Listings' : 'My Bookings'}
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'bookings' ? 'text-background' : 'text-taupe'}`} />
              </button>
              {user?.role !== 'HOST' && (
                <button 
                  onClick={() => { setActiveTab('roommateAd'); setSuccessMessage(''); setErrorMessage(''); }}
                  className={`w-full flex items-center justify-between px-6 py-4 transition-colors font-bold text-left border-b border-white/5 ${activeTab === 'roommateAd' ? 'bg-primary text-background' : 'text-primary hover:bg-accent/5'}`}
                >
                  <div className="flex items-center gap-3">
                    <Users className={`w-5 h-5 ${activeTab === 'roommateAd' ? 'text-background' : 'text-taupe'}`} /> Roommate Ad
                  </div>
                  <ChevronRight className={`w-4 h-4 ${activeTab === 'roommateAd' ? 'text-background' : 'text-taupe'}`} />
                </button>
              )}
              <button 
                onClick={() => { setActiveTab('personal'); setSuccessMessage(''); setErrorMessage(''); }}
                className={`w-full flex items-center justify-between px-6 py-4 transition-colors font-bold text-left border-b border-white/5 ${activeTab === 'personal' ? 'bg-primary text-background' : 'text-primary hover:bg-accent/5'}`}
              >
                <div className="flex items-center gap-3">
                  <User className={`w-5 h-5 ${activeTab === 'personal' ? 'text-background' : 'text-taupe'}`} /> Personal Info
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'personal' ? 'text-background' : 'text-taupe'}`} />
              </button>
              <button 
                onClick={() => { setActiveTab('account'); setSuccessMessage(''); setErrorMessage(''); }}
                className={`w-full flex items-center justify-between px-6 py-4 transition-colors font-bold text-left border-b border-white/5 ${activeTab === 'account' ? 'bg-primary text-background' : 'text-primary hover:bg-accent/5'}`}
              >
                <div className="flex items-center gap-3">
                  <Settings className={`w-5 h-5 ${activeTab === 'account' ? 'text-background' : 'text-taupe'}`} /> Account Settings
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'account' ? 'text-background' : 'text-taupe'}`} />
              </button>
              <button 
                onClick={() => { setActiveTab('security'); setSuccessMessage(''); setErrorMessage(''); }}
                className={`w-full flex items-center justify-between px-6 py-4 transition-colors font-bold text-left ${activeTab === 'security' ? 'bg-primary text-background' : 'text-primary hover:bg-accent/5'}`}
              >
                <div className="flex items-center gap-3">
                  <Shield className={`w-5 h-5 ${activeTab === 'security' ? 'text-background' : 'text-taupe'}`} /> Security & Privacy
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === 'security' ? 'text-background' : 'text-taupe'}`} />
              </button>
            </div>
          </div>
          {/* Right Column: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {successMessage && (
              <div className="bg-green-500/10 text-green-500 p-6 rounded-3xl border border-green-500/20 shadow-lg animate-in fade-in">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-500/10 text-red-500 p-6 rounded-3xl border border-red-500/20 shadow-lg animate-in fade-in">
                {errorMessage}
              </div>
            )}

            {activeTab === 'bookings' && (
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
                                   <>
                                   <button 
                                     onClick={() => { setSelectedRoomId(booking.roomId); setIsReportModalOpen(true); }}
                                     className="text-xs font-bold bg-red-500/10 text-red-500 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-colors flex items-center gap-1"
                                   >
                                     <AlertCircle className="w-3 h-3" /> Report Issue
                                   </button>
                                   <button 
                                      onClick={() => setActiveTab('roommateAd')}
                                      className="text-xs font-bold bg-accent/15 text-accent px-4 py-2 rounded-xl hover:bg-accent hover:text-background transition-colors flex items-center gap-1"
                                    >
                                      <Users className="w-3 h-3" /> Find Roommate
                                    </button>
                                   </>
                                 )}
                                 {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                                   booking.type === 'ROOM' ? (
                                     <button 
                                       onClick={() => handleLeaveRoom(booking.id)}
                                       className="text-xs font-bold bg-red-500/10 text-red-500 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                     >
                                       Leave Room
                                     </button>
                                   ) : (
                                     <button 
                                       onClick={() => handleLeaveMess(booking.id)}
                                       className="text-xs font-bold bg-red-500/10 text-red-500 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                     >
                                       Cancel Subscription
                                     </button>
                                   )
                                 )}
                                 <button 
                                   onClick={() => navigate(booking.type === 'ROOM' ? `/room/${booking.roomId}` : `/mess/${booking.roomId}`)}
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
                              to={type === 'room' ? `/room/${target.id}` : `/mess/${target.id}`}
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
            )}

            {activeTab === 'personal' && (
              <div className="bg-surface rounded-3xl p-8 sm:p-10 shadow-lg border border-white/10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
                  <div>
                    <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                      <User className="w-6 h-6 text-accent" /> Personal Information
                    </h3>
                    <p className="text-taupe text-sm mt-1">Update your roommate preferences and student verification details.</p>
                  </div>
                  <div className="px-4 py-2 bg-accent/10 border border-accent/25 rounded-full text-xs font-bold text-accent inline-flex items-center gap-1.5 self-start sm:self-center">
                    <Sparkles className="w-3.5 h-3.5" /> Roommate Matching Active
                  </div>
                </div>
                
                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  {/* Basic Info Section */}
                  <div className="space-y-6">
                    <h4 className="text-xs font-bold text-accent uppercase tracking-widest">Basic Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-taupe uppercase tracking-widest">Full Name</label>
                        <input 
                          type="text" 
                          required 
                          value={personalForm.name}
                          onChange={e => setPersonalForm({...personalForm, name: e.target.value})}
                          className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:border-accent outline-none text-primary font-medium transition-all hover:bg-background/80"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-taupe uppercase tracking-widest">College / University</label>
                        <input 
                          type="text" 
                          value={personalForm.college}
                          onChange={e => setPersonalForm({...personalForm, college: e.target.value})}
                          className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:border-accent outline-none text-primary font-medium transition-all hover:bg-background/80"
                          placeholder="e.g. Pune University"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-taupe uppercase tracking-widest">Biography</label>
                      <textarea 
                        value={personalForm.bio}
                        onChange={e => setPersonalForm({...personalForm, bio: e.target.value})}
                        className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:border-accent outline-none text-primary font-medium min-h-[120px] transition-all hover:bg-background/80"
                        placeholder="Share a bit about your daily routine, hobbies, and what you look for in roommates..."
                      />
                    </div>
                  </div>

                  {/* Roommate Matching Preferences */}
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-xs font-bold text-accent uppercase tracking-widest">Roommate Matching Preferences</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-taupe uppercase tracking-widest flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-taupe" /> Study Preference
                        </label>
                        <select 
                          value={personalForm.studyPreference}
                          onChange={e => setPersonalForm({...personalForm, studyPreference: e.target.value})}
                          className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:border-accent outline-none text-primary font-bold transition-all hover:bg-background/80"
                        >
                          <option value="">Select Option</option>
                          <option value="Quiet Study">Quiet Study - Likes silent focus</option>
                          <option value="Group Study">Group Study - Enjoys learning with peers</option>
                          <option value="Flexible">Flexible - Adapts easily</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-taupe uppercase tracking-widest flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-taupe" /> Social Vibe
                        </label>
                        <select 
                          value={personalForm.socialPreference}
                          onChange={e => setPersonalForm({...personalForm, socialPreference: e.target.value})}
                          className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:border-accent outline-none text-primary font-bold transition-all hover:bg-background/80"
                        >
                          <option value="">Select Option</option>
                          <option value="Introvert">Introvert - Prefers peace & personal space</option>
                          <option value="Extrovert">Extrovert - Social butterfly, likes parties</option>
                          <option value="Balanced">Balanced - Likes both social time & quiet time</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4 p-6 bg-background/30 rounded-3xl border border-white/5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-taupe uppercase tracking-widest flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-accent" /> Cleanliness Index
                        </label>
                        <span className="px-3 py-1 bg-accent/15 text-accent rounded-full text-xs font-bold uppercase tracking-wider">
                          {personalForm.cleanlinessLevel === 1 && 'Casual'}
                          {personalForm.cleanlinessLevel === 2 && 'Moderate'}
                          {personalForm.cleanlinessLevel === 3 && 'Average'}
                          {personalForm.cleanlinessLevel === 4 && 'Clean'}
                          {personalForm.cleanlinessLevel === 5 && 'Spick & Span'}
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        value={personalForm.cleanlinessLevel}
                        onChange={e => setPersonalForm({...personalForm, cleanlinessLevel: parseInt(e.target.value)})}
                        className="w-full accent-accent bg-background h-2 rounded-lg cursor-pointer transition-all"
                      />
                      <div className="flex justify-between text-[10px] text-taupe font-black uppercase tracking-wider">
                        <span>Level 1</span>
                        <span>Level 3</span>
                        <span>Level 5</span>
                      </div>
                    </div>

                    {/* Styled Premium Toggle buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setPersonalForm({...personalForm, isSmoking: !personalForm.isSmoking})}
                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all text-left ${personalForm.isSmoking ? 'bg-accent/5 border-accent/30 shadow-lg shadow-accent/5' : 'bg-background/40 border-white/10 hover:border-white/20'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${personalForm.isSmoking ? 'bg-accent/20 text-accent' : 'bg-white/5 text-taupe'}`}>
                            <Cigarette className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-primary">Smoking Friendly</span>
                            <span className="text-[10px] text-taupe font-medium">Allows smoking in personal room</span>
                          </div>
                        </div>
                        <div className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1 ${personalForm.isSmoking ? 'bg-accent' : 'bg-zinc-800'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${personalForm.isSmoking ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setPersonalForm({...personalForm, isVegetarian: !personalForm.isVegetarian})}
                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all text-left ${personalForm.isVegetarian ? 'bg-green-500/5 border-green-500/30 shadow-lg shadow-green-500/5' : 'bg-background/40 border-white/10 hover:border-white/20'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${personalForm.isVegetarian ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-taupe'}`}>
                            <Leaf className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-primary">Vegetarian Preference</span>
                            <span className="text-[10px] text-taupe font-medium">Prefers veg roommates / meals</span>
                          </div>
                        </div>
                        <div className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1 ${personalForm.isVegetarian ? 'bg-green-500' : 'bg-zinc-800'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${personalForm.isVegetarian ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-8 py-4 bg-primary text-background hover:bg-accent font-bold rounded-2xl transition-all shadow-lg hover:shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="bg-surface rounded-3xl p-8 sm:p-10 shadow-lg border border-white/10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="pb-6 border-b border-white/5">
                  <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Settings className="w-6 h-6 text-accent" /> Account Settings
                  </h3>
                  <p className="text-taupe text-sm mt-1">Manage password credentials and account access settings.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-taupe uppercase tracking-widest">Current Password</label>
                    <input 
                      type="password" 
                      required 
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:border-accent outline-none text-primary font-medium transition-all hover:bg-background/80"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-taupe uppercase tracking-widest">New Password</label>
                      <input 
                        type="password" 
                        required 
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:border-accent outline-none text-primary font-medium transition-all hover:bg-background/80"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-taupe uppercase tracking-widest">Confirm New Password</label>
                      <input 
                        type="password" 
                        required 
                        value={passwordForm.confirmPassword}
                        onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                        className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent focus:border-accent outline-none text-primary font-medium transition-all hover:bg-background/80"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-8 py-4 bg-primary text-background hover:bg-accent font-bold rounded-2xl transition-all shadow-lg hover:shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-surface rounded-3xl p-8 sm:p-10 shadow-lg border border-white/10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="pb-6 border-b border-white/5">
                  <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Shield className="w-6 h-6 text-accent" /> Security & Privacy
                  </h3>
                  <p className="text-taupe text-sm mt-1">Control public visibility and notification updates.</p>
                </div>

                <form onSubmit={handleUpdateSecurity} className="space-y-8">
                  {/* Visibility Selection Cards */}
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-taupe uppercase tracking-widest">Profile Visibility</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { value: 'PUBLIC', label: 'Public Profile', desc: 'Visible to all registered students & landlords.' },
                        { value: 'STUDENTS', label: 'Students Only', desc: 'Only verified student tenants can view details.' },
                        { value: 'PRIVATE', label: 'Strict Private', desc: 'Only visible to roommates you explicitly accept.' }
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setSecurityForm({...securityForm, profileVisibility: item.value})}
                          className={`p-5 rounded-2xl border text-left flex flex-col justify-between gap-4 transition-all ${securityForm.profileVisibility === item.value ? 'bg-accent/5 border-accent shadow-lg shadow-accent/5' : 'bg-background/40 border-white/10 hover:border-white/20'}`}
                        >
                          <div>
                            <span className="block text-sm font-bold text-primary">{item.label}</span>
                            <span className="block text-xs text-taupe mt-1 font-medium leading-relaxed">{item.desc}</span>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${securityForm.profileVisibility === item.value ? 'border-accent text-accent' : 'border-taupe/40'}`}>
                            {securityForm.profileVisibility === item.value && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notification Toggle Buttons */}
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <h4 className="text-xs font-bold text-accent uppercase tracking-widest">Notification Alerts</h4>
                    
                    <button 
                      type="button"
                      onClick={() => setSecurityForm({...securityForm, emailAlerts: !securityForm.emailAlerts})}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left ${securityForm.emailAlerts ? 'bg-accent/5 border-accent/30 shadow-lg shadow-accent/5' : 'bg-background/40 border-white/10 hover:border-white/20'}`}
                    >
                      <div>
                        <span className="block text-sm font-bold text-primary">Email Notifications</span>
                        <span className="text-xs text-taupe font-medium mt-1 block">Receive booking confirmation receipts and invoices.</span>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1 ${securityForm.emailAlerts ? 'bg-accent' : 'bg-zinc-800'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${securityForm.emailAlerts ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setSecurityForm({...securityForm, pushNotifications: !securityForm.pushNotifications})}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left ${securityForm.pushNotifications ? 'bg-accent/5 border-accent/30 shadow-lg shadow-accent/5' : 'bg-background/40 border-white/10 hover:border-white/20'}`}
                    >
                      <div>
                        <span className="block text-sm font-bold text-primary">Push Alerts</span>
                        <span className="text-xs text-taupe font-medium mt-1 block">Real-time updates on chat messages and maintenance requests.</span>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1 ${securityForm.pushNotifications ? 'bg-accent' : 'bg-zinc-800'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${securityForm.pushNotifications ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-end">
                    <button 
                      type="submit" 
                      className="px-8 py-4 bg-primary text-background hover:bg-accent font-bold rounded-2xl transition-all shadow-lg hover:shadow-accent/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Save Preferences
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'roommateAd' && (
              <div className="bg-surface rounded-3xl p-8 shadow-lg border border-white/10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-primary animate-bloom">
                    Manage Roommate Advertisement
                  </h3>
                  {roommateAd && (
                    <button 
                      type="button"
                      onClick={handleDeleteRoommateAd}
                      className="text-red-500 font-bold text-sm hover:underline"
                    >
                      Delete Advertisement
                    </button>
                  )}
                </div>

                {!profileData?.bookings?.some(b => b.type === 'ROOM' && b.status === 'CONFIRMED') ? (
                  <div className="p-8 bg-amber-500/10 text-amber-500 rounded-3xl border border-amber-500/20 text-center">
                    <p className="font-bold text-lg mb-2">Not Eligible</p>
                    <p className="text-sm">You must have an active confirmed room booking to publish a roommate advertisement.</p>
                  </div>
                ) : (
                  <form onSubmit={handlePublishRoommateAd} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-taupe uppercase tracking-widest">Ad Title</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Friendly student looking for a neat roommate"
                          value={adTitle}
                          onChange={(e) => setAdTitle(e.target.value)}
                          className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-accent font-semibold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-taupe uppercase tracking-widest">Monthly Budget Share (₹)</label>
                          <input 
                            type="number"
                            required
                            placeholder="₹"
                            value={adBudget}
                            onChange={(e) => setAdBudget(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-accent font-semibold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-taupe uppercase tracking-widest">Move-in Date</label>
                          <input 
                            type="date"
                            required
                            value={adMoveIn}
                            onChange={(e) => setAdMoveIn(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-accent font-semibold cursor-pointer"
                            onKeyDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              try {
                                e.target.showPicker();
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-taupe uppercase tracking-widest">Description</label>
                      <textarea 
                        required
                        rows={4}
                        placeholder="Tell others about yourself, your routines, hobbies, and what you are looking for in a flatmate."
                        value={adDesc}
                        onChange={(e) => setAdDesc(e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-accent font-semibold"
                      />
                    </div>

                    <div className="border-t border-white/5 pt-6">
                      <h4 className="text-sm font-black text-primary uppercase tracking-widest mb-4">Habit Preferences</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-taupe uppercase tracking-widest">Study Style</label>
                          <select 
                            value={studyPref}
                            onChange={(e) => setStudyPref(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-accent font-semibold"
                          >
                            <option>Quiet Study</option>
                            <option>Group Study</option>
                            <option>Flexible</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-taupe uppercase tracking-widest">Social Vibe</label>
                          <select 
                            value={socialPref}
                            onChange={(e) => setSocialPref(e.target.value)}
                            className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-accent font-semibold"
                          >
                            <option>Introvert</option>
                            <option>Extrovert</option>
                            <option>Balanced</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-taupe uppercase tracking-widest">Cleanliness (1-5)</label>
                          <input 
                            type="range"
                            min={1}
                            max={5}
                            value={cleanliness}
                            onChange={(e) => setCleanliness(parseInt(e.target.value))}
                            className="w-full accent-accent py-3"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6 border-t border-white/5 pt-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={isSmoking}
                          onChange={(e) => setIsSmoking(e.target.checked)}
                          className="w-5 h-5 rounded border-white/10 text-accent focus:ring-accent bg-background"
                        />
                        <span className="text-xs font-black text-taupe uppercase tracking-widest">Smoking Allowed</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={isVeg}
                          onChange={(e) => setIsVeg(e.target.checked)}
                          className="w-5 h-5 rounded border-white/10 text-accent focus:ring-accent bg-background"
                        />
                        <span className="text-xs font-black text-taupe uppercase tracking-widest">Vegetarian Only</span>
                      </label>
                    </div>

                    <button 
                      type="submit"
                      disabled={isAdSubmitting}
                      className="w-full py-4 bg-primary text-background hover:bg-accent font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                      {isAdSubmitting ? 'Saving...' : (roommateAd ? 'Update Ad' : 'Publish Ad')}
                    </button>
                  </form>
                )}
              </div>
            )}
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
