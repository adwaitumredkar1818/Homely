import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoomCard from '../components/RoomCard';
import MessCard from '../components/MessCard'; // Added
import FilterModal from '../components/FilterModal';
import Map from '../components/Map';
import { SlidersHorizontal, Home as House, Utensils, MapPin, Sparkles } from 'lucide-react'; 
import API_URL from '../utils/api';

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('rooms'); // 'rooms' or 'messes'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [messes, setMesses] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'HOST') {
      navigate('/host');
    }
  }, [user, navigate]);

  useEffect(() => {
    setLoading(true);
    const qParams = new URLSearchParams(searchParams).toString();
    const endpoint = activeMode === 'rooms' ? 'rooms' : 'messes';

    fetch(`${API_URL}/api/${endpoint}?${qParams}`)
      .then(res => res.json())
      .then(data => {
        if (activeMode === 'rooms') setRooms(data);
        else setMesses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(`Failed to fetch ${activeMode}:`, err);
        setLoading(false);
      });
  }, [searchParams, activeMode]);

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

  return (
    <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8">
      
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-primary tracking-tight">
            {activeMode === 'rooms' ? 'Over 1,000 rooms available' : 'Discover the Best Nearby Dining'}
          </h1>
          
          {user?.role !== 'HOST' && (
            <div className="mb-12 mt-8 bg-surface p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group hover:border-accent/20 transition-all duration-700 shadow-xl">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                  <Sparkles className="w-32 h-32 text-accent" />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="text-center md:text-left">
                     <h3 className="text-2xl font-black text-primary tracking-tighter mb-1">Roommates make life <span className="text-accent italic">better</span>.</h3>
                     <p className="text-sm text-taupe font-medium max-w-lg">Our AI Matchmaker finds students with your exact vibe and study habits.</p>
                  </div>
                  <Link to="/roommates" className="px-8 py-4 bg-primary text-background rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-accent transition-all shadow-xl shadow-primary/10 whitespace-nowrap">
                     Try Matchmaker
                  </Link>
               </div>
            </div>
          )}
          {/* Discovery Toggle with sliding pill */}
          <div className="relative flex bg-surface p-1.5 rounded-2xl border border-white/10 w-fit mb-6 overflow-hidden shadow-inner">
            {/* Sliding Pill Background */}
            <div 
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-primary rounded-xl transition-all duration-[600ms] cubic-bezier(0.76, 0, 0.24, 1) shadow-lg ${activeMode === 'rooms' ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}
            ></div>
            
            <button 
              onClick={() => setActiveMode('rooms')}
              className={`relative z-10 flex items-center gap-3 px-8 py-2.5 rounded-xl text-sm font-bold transition-colors duration-500 ${activeMode === 'rooms' ? 'text-background' : 'text-taupe hover:text-primary'}`}
            >
              <House className={`w-4 h-4 transition-transform duration-[600ms] cubic-bezier(0.76, 0, 0.24, 1) ${activeMode === 'rooms' ? 'scale-110' : 'scale-100'}`} /> 
              Hostels
            </button>
            <button 
              onClick={() => setActiveMode('messes')}
              className={`relative z-10 flex items-center gap-3 px-8 py-2.5 rounded-xl text-sm font-bold transition-colors duration-500 ${activeMode === 'messes' ? 'text-background' : 'text-taupe hover:text-primary'}`}
            >
              <Utensils className={`w-4 h-4 transition-transform duration-[600ms] cubic-bezier(0.76, 0, 0.24, 1) ${activeMode === 'messes' ? 'scale-110' : 'scale-100'}`} /> 
              Messes
            </button>
          </div>
          
          <p className="text-primary-light text-lg font-medium">
            {activeMode === 'rooms' 
              ? 'Find the perfect place to stay securely and comfortably.' 
              : 'Quality homemade meals delivered to your doorstep or available for dine-in.'}
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-primary text-background rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
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
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 transition-opacity duration-500`}>
            {activeMode === 'rooms' 
              ? rooms.map((room, idx) => (
                  <div key={`${room.id}-${activeMode}`} style={{ animationDelay: `${idx * 40}ms` }} className="animate-bloom">
                    <RoomCard room={room} />
                  </div>
                ))
              : messes.map((mess, idx) => (
                  <div key={`${mess.id}-${activeMode}`} style={{ animationDelay: `${idx * 40}ms` }} className="animate-bloom">
                    <MessCard mess={mess} />
                  </div>
                ))
            }
          </div>
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

    </div>
  );
}
