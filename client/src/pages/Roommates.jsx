import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, Search, SlidersHorizontal, MapPin, Calendar, Heart, 
  Sparkles, BookOpen, Users, Cigarette, Leaf, Shield, 
  MessageSquare, Loader2, PlusCircle, X, ChevronRight,
  Info, CheckCircle2, AlertCircle, Building2
} from 'lucide-react';

export default function Roommates() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // State for Browse listings
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    maxBudget: '',
    studyPreference: '',
    socialPreference: '',
    isVegetarian: '',
    isSmoking: ''
  });

  // State for Listing Detail Modal
  const [selectedListing, setSelectedListing] = useState(null);

  // State for Create/Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [checkingBooking, setCheckingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [existingListing, setExistingListing] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    budget: '',
    moveInDate: '',
    studyPreference: '',
    socialPreference: '',
    cleanlinessLevel: 3,
    isSmoking: false,
    isVegetarian: false
  });

  // Load listings on mount and when filters change
  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (filters.location) qParams.set('location', filters.location);
      if (filters.maxBudget) qParams.set('maxBudget', filters.maxBudget);
      if (filters.studyPreference) qParams.set('studyPreference', filters.studyPreference);
      if (filters.socialPreference) qParams.set('socialPreference', filters.socialPreference);
      if (filters.isVegetarian !== '') qParams.set('isVegetarian', filters.isVegetarian);
      if (filters.isSmoking !== '') qParams.set('isSmoking', filters.isSmoking);

      const res = await fetch(`http://localhost:5000/api/roommates?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (err) {
      console.error('Failed to fetch roommate listings', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if tenant has confirmed booking before showing form modal
  const handleOpenPostModal = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setCheckingBooking(true);
    setBookingError('');
    setExistingListing(null);
    setIsFormModalOpen(true);

    try {
      // 1. Fetch user profile to get confirmed booking details
      const profileRes = await fetch('http://localhost:5000/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (profileRes.ok) {
        const profile = await profileRes.json();
        // Look for room bookings
        const activeRoomBooking = profile.myBookings?.find(
          b => b.type === 'ROOM' && b.status === 'CONFIRMED'
        );

        if (!activeRoomBooking) {
          setBookingError('You need an active confirmed room booking to post a roommate listing. Please book a hostel room first.');
          setCheckingBooking(false);
          return;
        }

        setConfirmedBooking(activeRoomBooking);

        // Pre-fill form from user profile preferences
        const me = profile.user;
        setForm({
          title: '',
          description: '',
          budget: '',
          moveInDate: new Date().toISOString().split('T')[0],
          studyPreference: me.studyPreference || '',
          socialPreference: me.socialPreference || '',
          cleanlinessLevel: me.cleanlinessLevel || 3,
          isSmoking: me.isSmoking || false,
          isVegetarian: me.isVegetarian || false
        });

        // 2. Check if user already has an active listing
        const roommateRes = await fetch('http://localhost:5000/api/roommates');
        if (roommateRes.ok) {
          const allListings = await roommateRes.json();
          const mine = allListings.find(l => l.posterId === user.id);
          if (mine) {
            setExistingListing(mine);
            // Pre-fill existing data for editing
            setForm({
              id: mine.id,
              title: mine.title,
              description: mine.description,
              budget: mine.budget,
              moveInDate: mine.moveInDate.split('T')[0],
              studyPreference: mine.studyPreference || '',
              socialPreference: mine.socialPreference || '',
              cleanlinessLevel: mine.cleanlinessLevel || 3,
              isSmoking: mine.isSmoking || false,
              isVegetarian: mine.isVegetarian || false
            });
          }
        }
      } else {
        setBookingError('Could not verify booking status. Please try logging in again.');
      }
    } catch (err) {
      setBookingError('Network error checking booking status.');
    } finally {
      setCheckingBooking(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setFormSubmitting(true);

    try {
      const url = existingListing 
        ? `http://localhost:5000/api/roommates/${existingListing.id}`
        : 'http://localhost:5000/api/roommates';
      
      const method = existingListing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(existingListing ? 'Listing updated successfully!' : 'Listing posted successfully!');
        fetchListings();
        setTimeout(() => {
          setIsFormModalOpen(false);
        }, 1500);
      } else {
        setFormError(data.error || 'Failed to submit listing');
      }
    } catch (err) {
      setFormError('Network error submitting listing details.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete your roommate listing?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/roommates/${listingId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setIsFormModalOpen(false);
        fetchListings();
        alert('Listing removed successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete listing');
      }
    } catch (err) {
      alert('Network error. Failed to delete listing.');
    }
  };

  const handleMessagePoster = (posterId) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSelectedListing(null);
    navigate('/inbox', { state: { userId: posterId } });
  };

  return (
    <div className="flex-1 bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="bg-surface rounded-[2.5rem] p-8 sm:p-12 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2 max-w-2xl">
              <h1 className="text-4xl font-extrabold text-primary tracking-tight">Find Compatible Flatmates</h1>
              <p className="text-taupe text-base font-medium">
                Browse student listings who have already booked rooms and are looking for roommates to share the rent and vibe.
              </p>
            </div>
            {user?.role !== 'HOST' && (
              <button
                onClick={handleOpenPostModal}
                className="flex items-center gap-2 px-6 py-4 bg-accent hover:bg-accent-hover text-white dark:text-background rounded-2xl transition-all font-bold shadow-lg shadow-accent/20 hover:scale-105"
              >
                <PlusCircle className="w-5 h-5" /> Post Roommate Request
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Column */}
          <div className="lg:col-span-1 bg-surface rounded-3xl p-6 shadow-lg border border-white/10 h-fit space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-accent" /> Search Filters
              </h3>
              <button 
                onClick={() => setFilters({
                  location: '',
                  maxBudget: '',
                  studyPreference: '',
                  socialPreference: '',
                  isVegetarian: '',
                  isSmoking: ''
                })}
                className="text-xs font-bold text-taupe hover:text-accent"
              >
                Clear All
              </button>
            </div>

            {/* Location Input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-taupe tracking-wider">Target Location</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-taupe" />
                <input 
                  type="text" 
                  value={filters.location}
                  onChange={e => setFilters({...filters, location: e.target.value})}
                  placeholder="Search areas..."
                  className="w-full pl-9 pr-4 py-3 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-accent outline-none text-primary font-medium text-sm"
                />
              </div>
            </div>

            {/* Max Budget */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-taupe tracking-wider">Max Budget (₹)</label>
              <input 
                type="number" 
                value={filters.maxBudget}
                onChange={e => setFilters({...filters, maxBudget: e.target.value})}
                placeholder="e.g. 5000"
                className="w-full px-4 py-3 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-accent outline-none text-primary font-medium text-sm"
              />
            </div>

            {/* Study Preference */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-taupe tracking-wider">Study Vibe</label>
              <select 
                value={filters.studyPreference}
                onChange={e => setFilters({...filters, studyPreference: e.target.value})}
                className="w-full p-3 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-accent outline-none text-primary font-bold text-sm"
              >
                <option value="">Any Style</option>
                <option value="Quiet Study">Quiet Study</option>
                <option value="Group Study">Group Study</option>
                <option value="Flexible">Flexible</option>
              </select>
            </div>

            {/* Social Vibe */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase text-taupe tracking-wider">Social Vibe</label>
              <select 
                value={filters.socialPreference}
                onChange={e => setFilters({...filters, socialPreference: e.target.value})}
                className="w-full p-3 bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-accent outline-none text-primary font-bold text-sm"
              >
                <option value="">Any Vibe</option>
                <option value="Introvert">Introvert</option>
                <option value="Extrovert">Extrovert</option>
                <option value="Balanced">Balanced</option>
              </select>
            </div>

            {/* Toggle Veg / Smoking */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <label className="flex items-center justify-between p-3 bg-background/50 border border-white/5 rounded-xl cursor-pointer hover:border-white/20 select-none">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-green-500" /> Veg Only</span>
                <input 
                  type="checkbox" 
                  checked={filters.isVegetarian === 'true'}
                  onChange={e => setFilters({...filters, isVegetarian: e.target.checked ? 'true' : ''})}
                  className="w-4 h-4 accent-accent"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-background/50 border border-white/5 rounded-xl cursor-pointer hover:border-white/20 select-none">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5"><Cigarette className="w-3.5 h-3.5 text-accent" /> Smoking Okay</span>
                <input 
                  type="checkbox" 
                  checked={filters.isSmoking === 'true'}
                  onChange={e => setFilters({...filters, isSmoking: e.target.checked ? 'true' : ''})}
                  className="w-4 h-4 accent-accent"
                />
              </label>
            </div>
          </div>

          {/* Listings Column */}
          <div className="lg:col-span-3 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-3xl border border-white/10">
                <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
                <p className="text-taupe font-bold">Scanning listing directory...</p>
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map(item => (
                  <div 
                    key={item.id} 
                    className="group bg-surface rounded-3xl p-6 shadow-md border border-white/10 hover:border-accent/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Poster Details */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-background font-bold text-xl shadow-md border border-white/10">
                          {item.poster.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-primary text-base truncate">{item.poster.name}</span>
                            {item.poster.isVerified && (
                              <CheckCircle2 className="w-4 h-4 text-green-500 fill-current" />
                            )}
                          </div>
                          <span className="text-xs text-taupe truncate block font-medium">{item.poster.college || 'Verified Student'}</span>
                        </div>
                      </div>

                      {/* Listing Info */}
                      <h4 className="text-lg font-bold text-primary mb-2 line-clamp-1 group-hover:text-accent transition-colors">{item.title}</h4>
                      <p className="text-sm text-taupe line-clamp-3 mb-6 font-medium leading-relaxed">{item.description}</p>

                      {/* Info Chips */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="text-[10px] font-black uppercase bg-accent/15 text-accent px-2.5 py-1 rounded-lg">Budget: ₹{item.budget}/mo</span>
                        {item.studyPreference && (
                          <span className="text-[10px] font-black uppercase bg-white/5 text-taupe px-2.5 py-1 rounded-lg flex items-center gap-1"><BookOpen className="w-3 h-3" /> {item.studyPreference}</span>
                        )}
                        {item.socialPreference && (
                          <span className="text-[10px] font-black uppercase bg-white/5 text-taupe px-2.5 py-1 rounded-lg flex items-center gap-1"><Users className="w-3 h-3" /> {item.socialPreference}</span>
                        )}
                        {item.isVegetarian && (
                          <span className="text-[10px] font-black uppercase bg-green-500/10 text-green-500 px-2.5 py-1 rounded-lg flex items-center gap-1"><Leaf className="w-3 h-3" /> Veg</span>
                        )}
                        {item.isSmoking && (
                          <span className="text-[10px] font-black uppercase bg-accent/10 text-accent px-2.5 py-1 rounded-lg flex items-center gap-1"><Cigarette className="w-3 h-3" /> Smoking Friendly</span>
                        )}
                      </div>
                    </div>

                    {/* Room Attachment Snippet & Action Button */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs text-taupe font-semibold">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-accent" /> {item.room.location}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Join {new Date(item.moveInDate).toLocaleDateString(undefined, {month: 'short', year: '2-digit'})}</span>
                      </div>
                      <button 
                        onClick={() => setSelectedListing(item)}
                        className="w-full py-3 bg-primary text-background hover:bg-accent font-bold rounded-2xl transition-all shadow-md text-sm flex items-center justify-center gap-1.5"
                      >
                        View Profile & Room <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-white/10">
                <Info className="w-12 h-12 text-taupe/40 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-primary mb-2">No Roommate Listings Found</h4>
                <p className="text-taupe max-w-sm mx-auto mb-8 font-medium">Try broadening your search filters or write your own request to advertise your booked room!</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 border border-white/10 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-primary">Roommate Listing Details</h3>
              <button 
                onClick={() => setSelectedListing(null)}
                className="p-1.5 bg-background hover:bg-white/5 rounded-full text-taupe transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8">
              {/* Profile Block */}
              <div className="flex flex-col sm:flex-row gap-6 p-6 bg-background rounded-2xl border border-white/5">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-background font-black text-3xl shadow-lg border-2 border-white/10">
                  {selectedListing.poster.name.charAt(0)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-black text-primary">{selectedListing.poster.name}</h4>
                    {selectedListing.poster.isVerified && (
                      <span className="px-2.5 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-wider">Verified Student</span>
                    )}
                  </div>
                  <p className="text-sm text-accent font-bold">{selectedListing.poster.college || 'Verified Student User'}</p>
                  <p className="text-sm text-taupe font-medium leading-relaxed italic">"{selectedListing.poster.bio || 'No public bio set.'}"</p>
                </div>
              </div>

              {/* Preferences Summary */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-accent uppercase tracking-widest">Roommate Compatibility Summary</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-background rounded-2xl border border-white/5 text-center space-y-1">
                    <span className="text-[10px] font-black text-taupe uppercase tracking-wider block">Study Preference</span>
                    <span className="text-sm font-bold text-primary">{selectedListing.studyPreference || 'Flexible'}</span>
                  </div>
                  <div className="p-4 bg-background rounded-2xl border border-white/5 text-center space-y-1">
                    <span className="text-[10px] font-black text-taupe uppercase tracking-wider block">Social Vibe</span>
                    <span className="text-sm font-bold text-primary">{selectedListing.socialPreference || 'Balanced'}</span>
                  </div>
                  <div className="p-4 bg-background rounded-2xl border border-white/5 text-center space-y-1">
                    <span className="text-[10px] font-black text-taupe uppercase tracking-wider block">Cleanliness</span>
                    <span className="text-sm font-bold text-primary">{selectedListing.cleanlinessLevel}/5 Index</span>
                  </div>
                  <div className="p-4 bg-background rounded-2xl border border-white/5 text-center space-y-1">
                    <span className="text-[10px] font-black text-taupe uppercase tracking-wider block">Diet Preference</span>
                    <span className="text-sm font-bold text-primary">{selectedListing.isVegetarian ? 'Vegetarian' : 'Flexible'}</span>
                  </div>
                </div>
              </div>

              {/* Room Attachment Details */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-accent uppercase tracking-widest">Booked Room Details</h5>
                <div className="flex flex-col sm:flex-row gap-6 p-4 bg-background rounded-2xl border border-white/5">
                  <div className="w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-white/5">
                    {selectedListing.room.images?.[0] ? (
                      <img src={selectedListing.room.images[0].url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-taupe" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="font-bold text-primary text-lg">{selectedListing.room.title}</h4>
                      <p className="text-xs text-taupe flex items-center gap-1.5 mt-1 font-medium"><MapPin className="w-3.5 h-3.5" /> {selectedListing.room.location}</p>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                      <span className="text-sm font-bold text-primary">Shared budget share: <span className="text-accent text-lg font-black">₹{selectedListing.budget}/mo</span></span>
                      <button 
                        onClick={() => {
                          setSelectedListing(null);
                          navigate(`/room/${selectedListing.roomId}`);
                        }}
                        className="text-xs font-bold text-accent hover:underline"
                      >
                        View Full Room Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio / Description */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-accent uppercase tracking-widest">Introduction from Poster</h5>
                <p className="text-sm text-taupe font-medium leading-relaxed p-4 bg-background rounded-2xl border border-white/5">
                  {selectedListing.description}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-white/5 bg-background flex gap-4">
              <button 
                onClick={() => setSelectedListing(null)}
                className="w-1/2 py-3 bg-white/5 hover:bg-white/10 text-primary font-bold rounded-2xl transition-all text-center"
              >
                Back to Listings
              </button>
              {user && selectedListing.posterId === user.id ? (
                <button 
                  onClick={() => { setSelectedListing(null); handleOpenPostModal(); }}
                  className="w-1/2 py-3 bg-accent hover:bg-accent-hover text-white dark:text-background font-bold rounded-2xl transition-all text-center"
                >
                  Edit My Listing
                </button>
              ) : (
                <button 
                  onClick={() => handleMessagePoster(selectedListing.posterId)}
                  className="w-1/2 py-3 bg-accent hover:bg-accent-hover text-white dark:text-background font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> Message {selectedListing.poster.name.split(' ')[0]}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 border border-white/10 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-primary">
                {checkingBooking ? 'Verifying Booking...' : existingListing ? 'Manage Roommate Request' : 'Post Roommate Request'}
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 bg-background hover:bg-white/5 rounded-full text-taupe transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {checkingBooking ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
                <p className="text-taupe font-bold">Checking confirmed booking status...</p>
              </div>
            ) : bookingError ? (
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-primary">Eligibility Notice</h4>
                <p className="text-sm text-taupe max-w-xs mx-auto font-medium leading-relaxed">{bookingError}</p>
                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => setIsFormModalOpen(false)}
                    className="w-1/2 py-3 bg-white/5 text-primary font-bold rounded-xl"
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={() => { setIsFormModalOpen(false); navigate('/home'); }}
                    className="w-1/2 py-3 bg-accent text-background font-bold rounded-xl"
                  >
                    Browse Hostels
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto flex flex-col">
                <div className="p-6 space-y-6">
                  {formError && (
                    <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/25 text-sm font-bold">
                      {formError}
                    </div>
                  )}
                  {successMessage && (
                    <div className="bg-green-500/10 text-green-500 p-4 rounded-xl border border-green-500/25 text-sm font-bold">
                      {successMessage}
                    </div>
                  )}

                  {/* Linked Room Notice */}
                  <div className="p-4 bg-background/50 rounded-2xl border border-white/5 flex items-center gap-3">
                    <div className="p-2.5 bg-accent/15 text-accent rounded-xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-taupe uppercase tracking-wider">Auto-attached Room Booking</span>
                      <span className="block text-sm font-bold text-primary">{confirmedBooking?.room?.title} ({confirmedBooking?.room?.location})</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-taupe uppercase tracking-widest">Listing Title</label>
                    <input 
                      type="text" 
                      required 
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                      placeholder="e.g. Need quiet flatmate to share double room in Kothrud"
                      className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent outline-none text-primary font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-taupe uppercase tracking-widest">Introduction Message</label>
                    <textarea 
                      required 
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                      placeholder="Introduce yourself, mention clean/diet routines, rules for guests, study/sleep routines etc..."
                      className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent outline-none text-primary font-medium min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-taupe uppercase tracking-widest">Monthly Rent Share (₹)</label>
                      <input 
                        type="number" 
                        required 
                        value={form.budget}
                        onChange={e => setForm({...form, budget: e.target.value})}
                        placeholder="e.g. 4000"
                        className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent outline-none text-primary font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-taupe uppercase tracking-widest">Preferred Move-In</label>
                      <input 
                        type="date" 
                        required 
                        value={form.moveInDate}
                        onChange={e => setForm({...form, moveInDate: e.target.value})}
                        className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent outline-none text-primary font-medium"
                      />
                    </div>
                  </div>

                  {/* Roommate matching preferences override */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-bold text-accent uppercase tracking-widest">Roommate Preferences for this listing</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-taupe uppercase tracking-widest">Study Vibe</label>
                        <select 
                          value={form.studyPreference}
                          onChange={e => setForm({...form, studyPreference: e.target.value})}
                          className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent outline-none text-primary font-bold"
                        >
                          <option value="">Select Option</option>
                          <option value="Quiet Study">Quiet Study</option>
                          <option value="Group Study">Group Study</option>
                          <option value="Flexible">Flexible</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-taupe uppercase tracking-widest">Social Vibe</label>
                        <select 
                          value={form.socialPreference}
                          onChange={e => setForm({...form, socialPreference: e.target.value})}
                          className="w-full p-4 bg-background/50 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent outline-none text-primary font-bold"
                        >
                          <option value="">Select Option</option>
                          <option value="Introvert">Introvert</option>
                          <option value="Extrovert">Extrovert</option>
                          <option value="Balanced">Balanced</option>
                        </select>
                      </div>
                    </div>

                    {/* Styled Premium Toggle buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setForm({...form, isSmoking: !form.isSmoking})}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${form.isSmoking ? 'bg-accent/5 border-accent/30' : 'bg-background/40 border-white/10'}`}
                      >
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5"><Cigarette className="w-4 h-4 text-accent" /> Smoking Allowed</span>
                        <div className={`w-8 h-5 rounded-full transition-all relative flex items-center px-0.5 ${form.isSmoking ? 'bg-accent' : 'bg-zinc-800'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all transform ${form.isSmoking ? 'translate-x-3.5' : 'translate-x-0'}`} />
                        </div>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setForm({...form, isVegetarian: !form.isVegetarian})}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${form.isVegetarian ? 'bg-green-500/5 border-green-500/30' : 'bg-background/40 border-white/10'}`}
                      >
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5"><Leaf className="w-4 h-4 text-green-500" /> Vegetarian Preferred</span>
                        <div className={`w-8 h-5 rounded-full transition-all relative flex items-center px-0.5 ${form.isVegetarian ? 'bg-green-500' : 'bg-zinc-800'}`}>
                          <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all transform ${form.isVegetarian ? 'translate-x-3.5' : 'translate-x-0'}`} />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="p-6 border-t border-white/5 bg-background flex gap-4">
                  {existingListing && (
                    <button 
                      type="button" 
                      onClick={() => handleDeleteListing(existingListing.id)}
                      className="w-1/3 py-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-2xl transition-all"
                    >
                      Delete Listing
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={formSubmitting}
                    className="flex-1 py-4 bg-primary text-background hover:bg-accent font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {existingListing ? 'Save Updates' : 'Publish Listing'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
