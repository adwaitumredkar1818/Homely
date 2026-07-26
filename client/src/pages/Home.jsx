import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoomCard from '../components/RoomCard';
import MessCard from '../components/MessCard'; // Added
import FilterModal from '../components/FilterModal';
import Map from '../components/Map';
import { SlidersHorizontal, Home as House, Utensils, MapPin, Users, X, Building2, MessageSquare } from 'lucide-react'; 

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('rooms'); // 'rooms' or 'messes'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [messes, setMesses] = useState([]);
  const { user, token } = useAuth();
  const [roommates, setRoommates] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (user?.role === 'HOST') {
      navigate('/host');
    }
  }, [user, navigate]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    const qParams = new URLSearchParams(searchParams);
    const endpoint = activeMode === 'rooms' ? 'rooms' : activeMode === 'messes' ? 'messes' : 'roommates';

    if (viewMode === 'list') {
      qParams.set('page', '1');
      qParams.set('limit', '8');
    }

    fetch(`http://localhost:5000/api/${endpoint}?${qParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (viewMode === 'list') {
          if (activeMode === 'rooms') {
            setRooms(data.rooms || []);
            setHasMore(data.hasMore || false);
          } else if (activeMode === 'messes') {
            setMesses(data.messes || []);
            setHasMore(data.hasMore || false);
          } else {
            setRoommates(Array.isArray(data) ? data : []);
            setHasMore(false);
          }
        } else {
          if (activeMode === 'rooms') {
            setRooms(Array.isArray(data) ? data : (data.rooms || []));
          } else if (activeMode === 'messes') {
            setMesses(Array.isArray(data) ? data : (data.messes || []));
          } else {
            setRoommates(Array.isArray(data) ? data : []);
          }
          setHasMore(false);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(`Failed to fetch ${activeMode}:`, err);
        setLoading(false);
      });
  }, [searchParams, activeMode, viewMode]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const qParams = new URLSearchParams(searchParams);
    qParams.set('page', nextPage.toString());
    qParams.set('limit', '8');
    const endpoint = activeMode === 'rooms' ? 'rooms' : activeMode === 'messes' ? 'messes' : 'roommates';

    fetch(`http://localhost:5000/api/${endpoint}?${qParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        if (activeMode === 'rooms') {
          setRooms(prev => [...prev, ...(data.rooms || [])]);
        } else if (activeMode === 'messes') {
          setMesses(prev => [...prev, ...(data.messes || [])]);
        }
        setHasMore(data.hasMore || false);
        setPage(nextPage);
        setLoadingMore(false);
      })
      .catch(err => {
        console.error('Failed to load more:', err);
        setLoadingMore(false);
      });
  };

  const handleApplyFilters = (filters) => {
    const currentSearch = searchParams.get('search') || '';
    const newParams = { 
      maxPrice: filters.maxPrice.toString(),
      minRating: filters.minRating.toString(),
      minReviews: filters.minReviews.toString()
    };
    if (currentSearch) newParams.search = currentSearch;
    if (filters.amenities.length > 0) newParams.amenities = filters.amenities.join(',');
    
    // Proximity Filters
    if (filters.college !== 'None') {
      newParams.college = filters.college;
      newParams.collegeLat = filters.collegeLocation.lat.toString();
      newParams.collegeLng = filters.collegeLocation.lng.toString();
      newParams.maxDistance = filters.maxDistance.toString();
    }

    setSearchParams(newParams);
  };

  const currentFilters = {
    maxPrice: parseInt(searchParams.get('maxPrice')) || 30000,
    minRating: parseInt(searchParams.get('minRating')) || 0,
    minReviews: parseInt(searchParams.get('minReviews')) || 0,
    amenities: searchParams.get('amenities') ? searchParams.get('amenities').split(',') : [],
    college: searchParams.get('college') || 'None',
    maxDistance: parseFloat(searchParams.get('maxDistance')) || 5
  };

  const handleMessagePoster = async (posterId) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ participantId: posterId })
      });
      const data = await res.json();
      if (res.ok) {
        navigate(`/inbox?chat=${data.id}`);
      } else {
        alert(data.error || 'Failed to start chat');
      }
    } catch {
      alert('Network error. Failed to start chat.');
    }
  };

  return (
    <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8">
      
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-primary tracking-tight">
            {activeMode === 'rooms' ? 'Over 1,000 rooms available' : activeMode === 'messes' ? 'Discover the Best Nearby Dining' : 'Student Notice Board: Find Roommates'}
          </h1>
          
          {/* Discovery Toggle with sliding pill */}
          <div className="relative flex bg-surface p-1.5 rounded-2xl border border-white/10 w-fit mb-6 overflow-hidden shadow-inner">
            {/* Sliding Pill Background */}
            <div 
              className={`absolute top-1.5 bottom-1.5 w-[calc(33.33%-6px)] bg-primary rounded-xl transition-all duration-[600ms] cubic-bezier(0.76, 0, 0.24, 1) shadow-lg ${
                activeMode === 'rooms' ? 'left-1.5' : 
                activeMode === 'messes' ? 'left-[calc(33.33%+3px)]' : 
                'left-[calc(66.66%+3px)]'
              }`}
            ></div>
            
            <button 
              onClick={() => setActiveMode('rooms')}
              className={`relative z-10 flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors duration-500 ${activeMode === 'rooms' ? 'text-background' : 'text-taupe hover:text-primary'}`}
            >
              <House className={`w-4 h-4 transition-transform duration-[600ms] cubic-bezier(0.76, 0, 0.24, 1) ${activeMode === 'rooms' ? 'scale-110' : 'scale-100'}`} /> 
              Hostels
            </button>
            <button 
              onClick={() => setActiveMode('messes')}
              className={`relative z-10 flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors duration-500 ${activeMode === 'messes' ? 'text-background' : 'text-taupe hover:text-primary'}`}
            >
              <Utensils className={`w-4 h-4 transition-transform duration-[600ms] cubic-bezier(0.76, 0, 0.24, 1) ${activeMode === 'messes' ? 'scale-110' : 'scale-100'}`} /> 
              Messes
            </button>
            <button 
              onClick={() => setActiveMode('roommates')}
              className={`relative z-10 flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors duration-500 ${activeMode === 'roommates' ? 'text-background' : 'text-taupe hover:text-primary'}`}
            >
              <Users className={`w-4 h-4 transition-transform duration-[600ms] cubic-bezier(0.76, 0, 0.24, 1) ${activeMode === 'roommates' ? 'scale-110' : 'scale-100'}`} /> 
              Notice Board
            </button>
          </div>
          
          <p className="text-primary-light text-lg font-medium">
            {activeMode === 'rooms' 
              ? 'Find the perfect place to stay securely and comfortably.' 
              : activeMode === 'messes'
                ? 'Quality homemade meals delivered to your doorstep or available for dine-in.'
                : 'Connect with compatible students in active flatshares and shared listings.'}
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-primary text-background rounded-xl font-bold shadow-lg hover:bg-accent transition-all"
          >
            {viewMode === 'list' ? (
              <><MapPin className="w-5 h-5" /> Show Map</>
            ) : (
              <><SlidersHorizontal className="w-5 h-5" /> Show List</>
            )}
          </button>
          
          <button 
             onClick={() => setIsFilterModalOpen(true)}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-surface border border-gray-200 dark:border-white/10 rounded-xl shadow-sm hover:shadow-md hover:border-accent transition-all text-primary font-bold"
          >
            <SlidersHorizontal className="w-5 h-5 text-accent" />
            Filters
          </button>
        </div>
      </div>

      <FilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
        initialFilters={currentFilters}
        onApply={handleApplyFilters}
        activeMode={activeMode}
      />
      
      {viewMode === 'list' ? (
        (activeMode === 'rooms' ? rooms : messes).length === 0 && !loading ? (
          <div className="flex flex-col justify-center items-center h-64 text-center">
             <p className="text-2xl text-primary font-bold mb-2">No {activeMode} found</p>
             <p className="text-gray-500">Try adjusting your search location or term to find more options.</p>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 transition-opacity duration-500`}>
              {activeMode === 'rooms' 
                ? rooms.map((room, idx) => (
                    <div key={`${room.id}-${activeMode}`} style={{ animationDelay: `${idx * 40}ms` }} className="animate-bloom">
                      <RoomCard room={room} />
                    </div>
                  ))
                : activeMode === 'messes'
                ? messes.map((mess, idx) => (
                    <div key={`${mess.id}-${activeMode}`} style={{ animationDelay: `${idx * 40}ms` }} className="animate-bloom">
                      <MessCard mess={mess} />
                    </div>
                  ))
                : roommates.map((item, idx) => (
                    <div key={`${item.id}-${activeMode}`} style={{ animationDelay: `${idx * 40}ms` }} className="animate-bloom">
                      <div className="group bg-surface rounded-[2rem] p-6 shadow-xl border border-white/10 hover:border-accent/30 transition-all flex flex-col justify-between h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/15 px-3 py-1.5 rounded-xl">
                              Roommate Request
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-taupe font-bold">
                              {item.moveInDate ? new Date(item.moveInDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Immediate'}
                            </span>
                          </div>
                          
                          <h4 className="text-xl font-bold text-primary mb-2 line-clamp-1 group-hover:text-accent transition-colors duration-300">
                            {item.title}
                          </h4>
                          
                          <p className="text-xs text-taupe font-bold mb-4 line-clamp-1 uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-accent" /> {item.location}
                          </p>

                          <p className="text-sm text-primary/60 font-medium line-clamp-3 mb-6">
                            {item.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-6">
                            {item.studyPreference && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-background px-2.5 py-1.5 rounded-lg border border-white/5 text-primary-light">
                                📚 {item.studyPreference}
                              </span>
                            )}
                            {item.socialPreference && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-background px-2.5 py-1.5 rounded-lg border border-white/5 text-primary-light">
                                🤝 {item.socialPreference}
                              </span>
                            )}
                            {item.isVegetarian && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-background px-2.5 py-1.5 rounded-lg border border-white/5 text-green-500">
                                🥗 Vegetarian
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                          <div>
                            <span className="block text-[8px] font-black uppercase tracking-widest text-taupe">Max Share</span>
                            <span className="text-lg font-black text-primary">₹{item.budget?.toLocaleString()}/mo</span>
                          </div>
                          <button 
                            onClick={() => setSelectedListing(item)}
                            className="px-5 py-2.5 bg-primary hover:bg-accent text-background font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>
            {hasMore && (
              <div className="flex justify-center mt-12 mb-6">
                <button 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3.5 bg-primary text-background hover:bg-black hover:text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More Listings'}
                </button>
              </div>
            )}
          </>
        )
      ) : (
        <div className="w-full h-[600px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative">
           <Map 
             rooms={activeMode === 'rooms' ? rooms : messes.map(m => ({ ...m, title: m.name }))} 
             collegeLocation={currentFilters.college !== 'None' ? { 
               lat: parseFloat(searchParams.get('collegeLat')), 
               lng: parseFloat(searchParams.get('collegeLng')),
               name: searchParams.get('college')
             } : null}
           />
        </div>
      )}

      {/* Roommate Details Overlay Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 border border-white/10 flex flex-col max-h-[95vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/5">
              <h3 className="text-xl font-black text-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" /> Roommate Advertisement Notice
              </h3>
              <button 
                onClick={() => setSelectedListing(null)}
                className="p-1.5 bg-background hover:bg-white/5 rounded-full text-taupe transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Profile Intro */}
              <div className="flex flex-col sm:flex-row gap-4 p-5 bg-background/50 rounded-2xl border border-white/5 items-start sm:items-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-background font-bold text-2xl shrink-0">
                  {selectedListing.poster.name.charAt(0)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-black text-primary leading-none">{selectedListing.poster.name}</h4>
                    {selectedListing.poster.isVerified && (
                      <span className="px-2.5 py-0.5 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-wider">Verified Student</span>
                    )}
                  </div>
                  <p className="text-xs text-accent font-bold uppercase tracking-wider">{selectedListing.poster.college || 'Verified Student'}</p>
                  <p className="text-sm text-taupe font-semibold italic">"{selectedListing.poster.bio || 'No public bio set.'}"</p>
                </div>
              </div>

              {/* Compatibility Summaries */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-black text-accent uppercase tracking-widest">Habit Details</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-background rounded-2xl border border-white/5 text-center space-y-1">
                    <span className="text-[9px] font-black text-taupe uppercase tracking-wider block">Study Preference</span>
                    <span className="text-xs font-bold text-primary">{selectedListing.studyPreference || 'Flexible'}</span>
                  </div>
                  <div className="p-4 bg-background rounded-2xl border border-white/5 text-center space-y-1">
                    <span className="text-[9px] font-black text-taupe uppercase tracking-wider block">Social Vibe</span>
                    <span className="text-xs font-bold text-primary">{selectedListing.socialPreference || 'Balanced'}</span>
                  </div>
                  <div className="p-4 bg-background rounded-2xl border border-white/5 text-center space-y-1">
                    <span className="text-[9px] font-black text-taupe uppercase tracking-wider block">Cleanliness</span>
                    <span className="text-xs font-bold text-primary">{selectedListing.cleanlinessLevel}/5 Index</span>
                  </div>
                  <div className="p-4 bg-background rounded-2xl border border-white/5 text-center space-y-1">
                    <span className="text-[9px] font-black text-taupe uppercase tracking-wider block">Diet Preference</span>
                    <span className="text-xs font-bold text-primary">{selectedListing.isVegetarian ? 'Vegetarian' : 'Flexible'}</span>
                  </div>
                </div>
              </div>

              {/* Linked Room Details */}
              {selectedListing.room && (
                <div className="space-y-3">
                  <h5 className="text-[10px] font-black text-accent uppercase tracking-widest">Booked Room Info</h5>
                  <div className="flex flex-col sm:flex-row gap-6 p-4 bg-background rounded-2xl border border-white/5">
                    <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-white/5 shrink-0">
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
                        <h4 className="font-bold text-primary text-base leading-tight">{selectedListing.room.title}</h4>
                        <p className="text-xs text-taupe flex items-center gap-1 mt-1 font-medium"><MapPin className="w-3.5 h-3.5 text-accent" /> {selectedListing.room.location}</p>
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                        <span className="text-xs font-bold text-primary">Budget Share: <span className="text-accent text-sm font-black">₹{selectedListing.budget}/mo</span></span>
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
              )}

              {/* Message introduction */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-black text-accent uppercase tracking-widest">Description</h5>
                <p className="text-sm text-taupe font-semibold leading-relaxed p-4 bg-background rounded-2xl border border-white/5">
                  {selectedListing.description}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-background flex gap-4">
              <button 
                onClick={() => setSelectedListing(null)}
                className="w-1/2 py-3 bg-white/5 hover:bg-white/10 text-primary font-bold rounded-2xl transition-all text-center"
              >
                Back to Notice Board
              </button>
              {user && selectedListing.posterId === user.id ? (
                <button 
                  onClick={() => { setSelectedListing(null); navigate('/profile?tab=roommateAd'); }}
                  className="w-1/2 py-3 bg-accent hover:bg-accent-hover text-white dark:text-background font-bold rounded-2xl transition-all text-center"
                >
                  Manage My Ad
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
    </div>
  );
}
