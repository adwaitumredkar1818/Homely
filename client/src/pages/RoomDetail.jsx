import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Star, Heart, Share, ChevronLeft, Wifi, Car, Coffee, Wind, Tv, Shield, Utensils, MessageCircle, View, Maximize, Navigation, Sparkles, MapPin, Camera } from 'lucide-react';
import Map from '../components/Map';
import { useAuth } from '../context/AuthContext';
import API_URL from '../utils/api';

export default function RoomDetail() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBooked, setIsBooked] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    cleanliness: 5, accuracy: 5, communication: 5, location: 5, value: 5, comment: ''
  });
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('photos'); // 'photos' or 'vr'
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch(`${API_URL}/api/rooms/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setRoom(data);
          if (user && data.reviews) {
            const hasAlreadyReviewed = data.reviews.some(r => r.userId === user.id);
            if (user.role === 'TENANT' && !hasAlreadyReviewed) {
              setCanReview(true);
            }
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    if (user && token) {
      fetch(`${API_URL}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const inWishlist = data.some(item => item.roomId === parseInt(id));
          setIsWishlisted(inWishlist);
        }
      });
    }
  }, [id, user, token]);

  const handleBooking = async () => {
    if (!user) {
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId: room.id, price: room.price })
      });
      const data = await res.json();
      if (data.success) {
        setIsBooked(true);
      } else {
        alert(data.error || 'Failed to book meeting.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId: room.id })
      });
      const data = await res.json();
      if (data.success) {
        setIsWishlisted(data.action === 'added');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Initialize Pannellum when VR tab is active
  useEffect(() => {
    const panorama = room?.images?.find(img => img.isPanorama);
    if (activeTab === 'vr' && panorama && window.pannellum) {
      // Small timeout to ensure the container is rendered
      setTimeout(() => {
        const viewerContainer = document.getElementById('panorama-viewer');
        if (viewerContainer) {
          window.pannellum.viewer('panorama-viewer', {
            type: 'equirectangular',
            panorama: panorama.url,
            autoLoad: true,
            title: room.title,
            author: "Homely Verified Host",
            compass: true,
            hfov: 110,
          });
        }
      }, 100);
    }
  }, [activeTab, room]);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[calc(100vh-80px)]">
      <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center animate-pulse border border-white/5 shadow-2xl">
         <Sparkles className="w-10 h-10 text-accent animate-spin-slow" />
      </div>
      <p className="mt-8 text-taupe font-black uppercase tracking-[0.4em] animate-pulse">Syncing Property Hub...</p>
    </div>
  );

  if (!room) return (
    <div className="text-center py-32 flex flex-col items-center bg-background min-h-screen">
      <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-red-500/20">
         <Shield className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-4xl font-black text-primary tracking-tighter mb-4">Property vanishing act.</h2>
      <p className="text-taupe font-medium max-w-md mx-auto mb-10">This listing might have been removed or moved to another dimension.</p>
      <Link to="/" className="px-10 py-5 bg-primary text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all">Return to Marketplace</Link>
    </div>
  );

  const getHostelImage = (idx) => `/assets/rooms/student_room_${((room.id + idx) % 15) + 1}.png`;

  const galleryImages = room.images && room.images.length > 0 
    ? room.images.map(img => img.url || getHostelImage(0))
    : [getHostelImage(0), getHostelImage(1), getHostelImage(2), getHostelImage(3), getHostelImage(4), getHostelImage(5)];

  const panorama = room.images?.find(img => img.isPanorama);

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
          <div className="flex-1">
            <Link to="/home" className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-taupe hover:text-accent mb-6 transition-all group">
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Return to search
            </Link>
            <div className="flex items-center gap-5 mb-4">
              <h1 className="text-5xl md:text-6xl font-black text-primary tracking-tighter leading-none">{room.title}</h1>
              {room.isVerified && (
                <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest border border-accent/20">
                  <Shield className="w-4 h-4" /> Verified
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="text-primary font-black">{room.rating}</span>
                <span className="text-taupe opacity-60 underline cursor-pointer hover:text-primary transition-colors">({room.reviewCount} reviews)</span>
              </div>
              <div className="w-1.5 h-1.5 bg-white/10 rounded-full" />
              <div className="flex items-center gap-2 text-taupe hover:text-primary transition-colors cursor-pointer underline decoration-white/20">
                <MapPin className="w-4 h-4" /> {room.location}
              </div>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-surface border border-white/5 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-white/5 transition-all shadow-xl">
              <Share className="w-4 h-4" /> Share
            </button>
            <button 
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${isWishlisted ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-surface border border-white/5 text-primary hover:bg-white/5'}`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} /> {isWishlisted ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Cinematic Media Hub (Tabbed) */}
        <div className="mb-16">
          <div className="flex gap-4 mb-6">
             <button 
               onClick={() => setActiveTab('photos')}
               className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${activeTab === 'photos' ? 'bg-primary text-background shadow-2xl' : 'bg-surface text-taupe border border-white/5 hover:border-accent/30'}`}
             >
                <Camera className="w-4 h-4" /> Gallery
             </button>
             {panorama && (
               <button 
                 onClick={() => setActiveTab('vr')}
                 className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 relative overflow-hidden group ${activeTab === 'vr' ? 'bg-accent text-background shadow-2xl' : 'bg-surface text-taupe border border-white/5 hover:border-accent/30'}`}
               >
                  <View className="w-4 h-4" /> 360° Virtual Tour
                  {activeTab !== 'vr' && <div className="absolute inset-0 bg-accent/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />}
                  <div className="absolute top-0 right-0 p-1">
                     <Sparkles className="w-2 h-2 animate-pulse" />
                  </div>
               </button>
             )}
          </div>

          <div className="relative group">
            {activeTab === 'photos' ? (
              <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-[450px] md:h-[650px] rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
                <div className="md:col-span-2 md:row-span-2 relative overflow-hidden group/img">
                  <img src={galleryImages[0]} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-1000" alt="Living Space Main" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-700" />
                </div>
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="hidden md:block relative overflow-hidden group/img">
                    <img src={galleryImages[idx]} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000" alt={`Room Detail ${idx}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-700" />
                  </div>
                ))}
                {/* Show All Button Overlay */}
                <button className="absolute bottom-10 right-10 px-8 py-4 bg-background/80 backdrop-blur-md text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-primary hover:text-background transition-all shadow-2xl">
                   View All 15 Photos
                </button>
              </div>
            ) : (
              <div className="h-[450px] md:h-[650px] rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 relative bg-surface">
                 <div id="panorama-viewer" className="w-full h-full" />
                 <div className="absolute top-8 left-8 z-20 pointer-events-none">
                    <div className="px-6 py-4 bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-4">
                       <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-background">
                          <Maximize className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-accent">Interactive</p>
                          <p className="text-sm font-black text-primary">360° Vision Active</p>
                       </div>
                    </div>
                 </div>
                 <div className="absolute bottom-8 right-8 z-20">
                    <button className="p-4 bg-background/60 backdrop-blur-md border border-white/10 rounded-2xl text-primary hover:bg-accent hover:text-background transition-all shadow-2xl">
                       <Navigation className="w-6 h-6" />
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row gap-20 relative">
          
          {/* Main Info Area */}
          <div className="flex-1">
            <div className="pb-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                <h2 className="text-4xl font-black text-primary tracking-tighter mb-2">Hosted by {room.host?.name || 'Verified Host'}</h2>
                <div className="flex items-center gap-4 text-taupe font-medium">
                   <span>2-3 Students</span>
                   <div className="w-1 h-1 bg-white/20 rounded-full" />
                   <span>Private Bedroom</span>
                   <div className="w-1 h-1 bg-white/20 rounded-full" />
                   <span>Shared Study Hub</span>
                </div>
              </div>
              <div className="w-20 h-20 bg-primary/5 border border-white/5 rounded-[2rem] flex items-center justify-center text-accent text-3xl font-black shadow-xl">
                 {room.host?.name?.charAt(0) || 'H'}
              </div>
            </div>

            {/* Features Row */}
            <div className="py-12 border-b border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="flex gap-6">
                  <div className="w-14 h-14 bg-surface border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                     <Shield className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                     <h4 className="text-lg font-black text-primary mb-1">Safety First</h4>
                     <p className="text-sm text-taupe leading-relaxed">Verified by Homely. Includes 24/7 security and fire safety compliance.</p>
                  </div>
               </div>
               <div className="flex gap-6">
                  <div className="w-14 h-14 bg-surface border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                     <Wifi className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                     <h4 className="text-lg font-black text-primary mb-1">Hyper-Connected</h4>
                     <p className="text-sm text-taupe leading-relaxed">Ultra-fast 200Mbps dedicated WiFi for lag-free study sessions and gaming.</p>
                  </div>
               </div>
            </div>

            {/* Description Area */}
            <div className="py-12 border-b border-white/5">
              <h3 className="text-[10px] font-black text-taupe uppercase tracking-[0.4em] mb-8">The Vision</h3>
              <p className="text-xl text-primary font-medium leading-relaxed mb-10 italic opacity-90">
                "{room.description}"
              </p>
              <button className="text-accent font-black uppercase tracking-widest text-[10px] border-b-2 border-accent pb-1 hover:opacity-70 transition-opacity">
                 Read Entire Philosophy
              </button>
            </div>

            {/* Amenities Grid */}
            <div className="py-12">
              <h3 className="text-[10px] font-black text-taupe uppercase tracking-[0.4em] mb-10">Amenities & Perks</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                {[
                  { icon: Wifi, label: 'High-speed WiFi' },
                  { icon: Car, label: 'Free parking' },
                  { icon: Coffee, label: 'Shared Kitchen' },
                  { icon: Wind, label: 'AC Units' },
                  { icon: Tv, label: 'Entertainment Zone' },
                  { icon: Utensils, label: 'Mess Included' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 group cursor-pointer">
                    <item.icon className="w-6 h-6 text-taupe group-hover:text-accent transition-colors" />
                    <span className="text-primary font-bold group-hover:translate-x-1 transition-transform">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:w-[450px]">
            <div className="sticky top-32 bg-surface border border-white/10 p-10 rounded-[3rem] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.5)]">
               <div className="flex justify-between items-end mb-10">
                  <div>
                     <p className="text-[10px] font-black text-taupe uppercase tracking-widest mb-1">Monthly Investment</p>
                     <h3 className="text-5xl font-black text-primary tracking-tighter">₹{room.price}</h3>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-black text-accent uppercase">Early Bird</p>
                     <p className="text-[10px] text-taupe">Save ₹500/mo</p>
                  </div>
               </div>

               <div className="space-y-6 mb-10">
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                     <div>
                        <p className="text-[9px] font-black text-taupe uppercase tracking-widest">Available From</p>
                        <p className="text-sm font-bold text-primary">Immediately</p>
                     </div>
                     <ChevronLeft className="w-5 h-5 text-taupe rotate-180" />
                  </div>
                  <div className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                     <div>
                        <p className="text-[9px] font-black text-taupe uppercase tracking-widest">Roommates Type</p>
                        <p className="text-sm font-bold text-primary">Students Only</p>
                     </div>
                     <ChevronLeft className="w-5 h-5 text-taupe rotate-180" />
                  </div>
               </div>

               <button 
                 onClick={handleBooking}
                 disabled={isBooked}
                 className={`w-full py-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl relative overflow-hidden group ${isBooked ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-primary text-background hover:bg-accent'}`}
               >
                  {isBooked ? '✓ Booking Request Sent' : 'Book a Virtual Tour'}
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
               </button>

               <button className="w-full mt-6 py-6 border border-white/10 text-primary rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all flex items-center justify-center gap-3">
                  <MessageCircle className="w-4 h-4 text-accent" /> Message Host
               </button>

               <p className="mt-8 text-center text-[10px] text-taupe font-medium uppercase tracking-widest opacity-60">
                  No credit card required today
               </p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-24 pt-24 border-t border-white/5">
           <h2 className="text-4xl font-black text-primary tracking-tighter mb-4">Location Context</h2>
           <p className="text-taupe font-medium mb-12 max-w-2xl">Find out how close you are to your college and the best dining spots in the city.</p>
           <div className="h-[500px] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl shadow-black/40 grayscale group hover:grayscale-0 transition-all duration-1000">
             <Map rooms={[{ ...room, type: 'ROOM' }]} />
           </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-32 pt-24 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
            <div>
               <h2 className="text-5xl font-black text-primary tracking-tighter mb-4 flex items-center gap-4">
                 <Star className="w-10 h-10 fill-accent text-accent" /> {room.rating}
               </h2>
               <p className="text-taupe font-bold uppercase tracking-widest text-[10px]">{room.reviewCount} Student Testimonials</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-12 gap-y-6 w-full md:w-auto">
               {[
                 { label: 'Cleanliness', val: 4.8 },
                 { label: 'Accuracy', val: 4.9 },
                 { label: 'Location', val: 4.7 }
               ].map((stat, i) => (
                 <div key={i} className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-taupe tracking-widest">{stat.label}</p>
                    <div className="flex items-center gap-3">
                       <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${(stat.val/5)*100}%` }} />
                       </div>
                       <span className="text-xs font-black text-primary">{stat.val}</span>
                    </div>
                 </div>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">
            {room.reviews && room.reviews.map((rev) => (
              <div key={rev.id} className="space-y-6 group">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-surface border border-white/10 rounded-2xl flex items-center justify-center font-black text-accent text-2xl shadow-xl">
                    {rev.user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xl font-black text-primary tracking-tight">{rev.user.name}</div>
                    <div className="text-[10px] text-taupe font-black uppercase tracking-widest">{new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
                <p className="text-primary font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                  "{rev.comment}"
                </p>
              </div>
            ))}
            {(!room.reviews || room.reviews.length === 0) && (
               <div className="md:col-span-2 py-20 bg-surface rounded-[3rem] border border-dashed border-white/10 text-center">
                  <p className="text-taupe font-black uppercase tracking-widest text-[10px]">No testimonials yet. Be the first to secure your legacy.</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
