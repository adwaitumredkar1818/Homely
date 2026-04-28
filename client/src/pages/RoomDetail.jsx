import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Star, Heart, Share, ChevronLeft, Wifi, Car, Coffee, Wind, Tv, Shield, Utensils, MessageCircle } from 'lucide-react';
import Map from '../components/Map';
import { useAuth } from '../context/AuthContext';

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
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetch(`http://localhost:5000/api/rooms/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setRoom(data);
          // Check if user has already reviewed
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
  }, [id, user]);

  if (loading) return <div className="text-center py-20 animate-pulse text-xl font-bold text-primary">Loading property details from server...</div>;
  if (!room) return (
    <div className="text-center py-20 flex flex-col items-center">
      <div className="text-2xl font-bold text-primary mb-4">Property not found</div>
      <Link to="/" className="text-accent hover:underline font-semibold">Return to Home</Link>
    </div>
  );

  const handleBooking = async () => {
    if (!user) {
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
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

  // Use our restored high-quality modern student room images (pool of 15)
  const getHostelImage = (idx) => `/assets/rooms/student_room_${((room.id + idx) % 15) + 1}.png`;

  const galleryImages = [
    room.image || getHostelImage(0),
    getHostelImage(1),
    getHostelImage(2),
    getHostelImage(3),
    getHostelImage(4),
    getHostelImage(5)
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header Info */}
      <div className="mb-6">
        <Link to="/home" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to search
        </Link>
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">{room.title}</h1>
          {room.isVerified && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/20 text-accent rounded-full text-[10px] font-black uppercase tracking-widest border border-accent/30">
              <Shield className="w-3.5 h-3.5" /> Verified
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center text-sm font-medium">
            <Star className="w-4 h-4 fill-current text-gray-800 mr-1" />
            <span className="mr-1">{room.rating}</span>
            <span className="text-gray-500 underline mr-4 cursor-pointer hover:text-gray-800">{room.reviewCount} reviews</span>
            <span className="text-gray-300 mx-2">•</span>
            <span className="text-gray-500 underline cursor-pointer hover:text-gray-800">{room.location}</span>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
              <Share className="w-4 h-4" /> Share
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
              <Heart className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      </div>

      {/* Image Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[400px] sm:h-[500px] mb-12 rounded-2xl overflow-hidden">
        <div className="md:col-span-2 md:row-span-2 relative group hover:opacity-90 cursor-pointer transition-opacity">
          <img src={galleryImages[0]} className="w-full h-full object-cover" alt="Main" />
        </div>
        <div className="hidden md:block relative group hover:opacity-90 cursor-pointer transition-opacity">
          <img src={galleryImages[1]} className="w-full h-full object-cover" alt="Room 1" />
        </div>
        <div className="hidden md:block relative group hover:opacity-90 cursor-pointer transition-opacity">
          <img src={galleryImages[2]} className="w-full h-full object-cover" alt="Room 2" />
        </div>
        <div className="hidden md:block relative group hover:opacity-90 cursor-pointer transition-opacity">
          <img src={galleryImages[3]} className="w-full h-full object-cover" alt="Room 3" />
        </div>
        <div className="hidden md:block relative group hover:opacity-90 cursor-pointer transition-opacity">
          <img src={galleryImages[4]} className="w-full h-full object-cover" alt="Room 4" />
        </div>
      </div>

      {/* Main Content & Booking Panel */}
      <div className="flex flex-col lg:flex-row gap-12 relative">
        
        {/* Left Column (Details) */}
        <div className="flex-1">
          <div className="pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-semibold mb-2">Hosted by {room.host?.name || 'Verified Host'}</h2>
            <p className="text-gray-500">2 guests · 1 bedroom · 1 bed · 1 private bath</p>
          </div>
          
          <div className="py-8 border-b border-gray-200 space-y-6">
            <div className="flex gap-4">
              <Shield className="w-6 h-6 text-gray-400 shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">{room.isVerified ? 'Premium Verification' : 'Verified Host'}</h3>
                <p className="text-gray-500 text-sm">{room.isVerified ? 'This host has completed rigorous background and property checks.' : 'Identity verified through student portal.'}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Star className="w-6 h-6 text-gray-400 shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Highly Rated</h3>
                <p className="text-gray-500 text-sm">Recent guests gave this home a 5-star rating.</p>
              </div>
            </div>
          </div>

          <div className="py-8 border-b border-gray-200">
             <h2 className="text-2xl font-semibold mb-6">What this place offers</h2>
              <div className="grid grid-cols-2 gap-y-4">
                {(room.amenities || []).includes('Wi-Fi') && <div className="flex items-center gap-3"><Wifi className="w-6 h-6 text-taupe" /> <span>Fast Wi-Fi</span></div>}
                {(room.amenities || []).includes('Air Conditioning') && <div className="flex items-center gap-3"><Wind className="w-6 h-6 text-taupe" /> <span>Air Conditioning</span></div>}
                {(room.amenities || []).includes('Kitchen') && <div className="flex items-center gap-3"><Coffee className="w-6 h-6 text-taupe" /> <span>Full Kitchen</span></div>}
                <div className="flex items-center gap-3"><Tv className="w-6 h-6 text-taupe" /> <span>Smart TV</span></div>
                <div className="flex items-center gap-3"><Car className="w-6 h-6 text-taupe" /> <span>Free parking</span></div>
              </div>
             <button className="mt-8 px-6 py-3 border border-primary font-semibold rounded-lg hover:bg-white/5 transition-colors cursor-pointer">Show all amenities</button>
          </div>

          {room.messes && room.messes.length > 0 && (
            <div className="py-8 border-b border-gray-200">
              <h2 className="text-2xl font-semibold mb-6">Nearby Food & Mess</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {room.messes.map((mess, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-white/5 hover:border-accent/30 transition-all group">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent group-hover:text-background transition-colors">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-primary">{mess.name || mess}</p>
                      <p className="text-xs text-taupe">~{(idx + 1) * 200}m away • Veg & Non-Veg</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="py-8 border-b border-gray-200">
             <h2 className="text-2xl font-semibold mb-6">Where you'll be</h2>
             <div className="w-full h-[400px] bg-gray-100 rounded-2xl relative overflow-hidden shadow-inner border border-taupe-light/30">
                <Map rooms={[room]} />
             </div>
          </div>
        </div>

        {/* Right Column (Booking Widget) */}
        <div className="w-full lg:w-[32%] relative">
          <div className="sticky top-28 bg-surface border border-white/10 rounded-2xl p-6 shadow-xl">
             <div className="flex items-end justify-between mb-6">
               <div>
                  <span className="text-2xl font-bold text-primary">₹{room.price.toLocaleString('en-IN')}</span>
                  <span className="text-taupe"> / month</span>
               </div>
               <div className="flex items-center text-sm font-medium">
                 <Star className="w-3 h-3 fill-current text-primary mr-1" />
                 <span>{room.rating}</span>
               </div>
             </div>
             
             <div className="border border-white/10 rounded-lg overflow-hidden mb-4">
                <div className="p-3 hover:bg-white/5 cursor-pointer transition-colors">
                   <div className="text-[10px] font-bold uppercase text-primary">Guests</div>
                   <div className="text-sm text-taupe">1 guest</div>
                </div>
             </div>

             {isBooked ? (
               <div className="w-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 font-bold py-3 rounded-lg text-center mb-4 text-lg">
                  Booking Confirmed!
               </div>
             ) : (
               <button onClick={handleBooking} className="w-full bg-accent hover:bg-black text-white font-bold py-3 rounded-lg transition-colors mb-4 text-lg cursor-pointer">
                  Book a meeting
               </button>
             )}

             <button 
                onClick={() => {
                  if (!user) {
                    navigate('/auth', { state: { from: location.pathname } });
                    return;
                  }
                  navigate('/inbox', { state: { userId: room.hostId } });
                }}
                className="w-full flex items-center justify-center gap-2 border-2 border-primary text-primary font-bold py-3 rounded-lg hover:bg-primary hover:text-background transition-all mb-4 text-lg cursor-pointer"
              >
                 <MessageCircle className="w-5 h-5" /> Chat with Host
              </button>

             <div className="text-center text-sm text-taupe mb-6">You won't be charged yet</div>

             <div className="space-y-3 border-b border-white/10 pb-4 mb-4">
               <div className="flex justify-between text-taupe">
                 <span>1 Month Base Rent</span>
                 <span>₹{room.price.toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between text-taupe">
                 <span>Security Deposit</span>
                 <span>₹{(room.price * 2).toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between text-taupe">
                 <span>Maintenance Fee</span>
                 <span>₹800</span>
               </div>
             </div>
             
             <div className="flex justify-between font-bold text-lg text-primary">
                 <span>Total Move-in Cost</span>
                 <span>₹{((room.price * 3) + 800).toLocaleString('en-IN')}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Ratings & Reviews Section */}
      <div className="mt-16 pt-12 border-t border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-2 text-2xl font-bold mb-8">
          <Star className="w-6 h-6 fill-current text-primary" />
          {room.rating} · {room.reviewCount} reviews
        </div>

        {/* Categories Breakdown */}
        {room.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-4 mb-12">
            {Object.entries(room.stats).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="text-taupe capitalize">{key}</div>
                <div className="flex items-center gap-3 w-1/2">
                  <div className="flex-1 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(val / 5) * 100}%` }}></div>
                  </div>
                  <span className="text-xs font-bold w-6">{val}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Form Toggle */}
        {canReview && !reviewSuccess && (
          <div className="mb-12">
            {!isReviewOpen ? (
              <button onClick={() => setIsReviewOpen(true)} className="px-6 py-3 bg-surface border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-colors">
                Write a review
              </button>
            ) : (
              <div className="bg-surface p-8 rounded-3xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="text-xl font-bold mb-6">How was your stay?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                  {['cleanliness', 'accuracy', 'communication', 'location', 'value'].map(cat => (
                    <div key={cat}>
                      <label className="block text-sm font-bold text-taupe capitalize mb-2">{cat}</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button 
                            key={star} 
                            onClick={() => setReviewData({...reviewData, [cat]: star})}
                            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${reviewData[cat] >= star ? 'bg-primary text-background' : 'bg-white/5 text-taupe hover:bg-white/10'}`}
                          >
                            <Star className={`w-5 h-5 ${reviewData[cat] >= star ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-primary outline-none focus:ring-2 focus:ring-primary mb-6"
                  placeholder="Share your experience (optional)"
                  rows="4"
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                ></textarea>
                
                <div className="mb-6">
                  <label className="block text-sm font-bold text-taupe mb-2">Add a photo (optional URL)</label>
                  <input 
                    type="text" 
                    placeholder="Enter image URL (e.g. from Google Drive or Cloudinary)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-primary text-sm"
                    value={reviewData.imageUrl || ''}
                    onChange={(e) => setReviewData({...reviewData, imageUrl: e.target.value})}
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={async () => {
                      const res = await fetch(`http://localhost:5000/api/rooms/${id}/reviews`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(reviewData)
                      });
                      const data = await res.json();
                      if (data.success) {
                        setReviewSuccess(true);
                        setIsReviewOpen(false);
                      } else alert(data.error);
                    }}
                    className="px-8 py-3 bg-primary text-background font-bold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Submit Review
                  </button>
                  <button onClick={() => setIsReviewOpen(false)} className="px-8 py-3 text-taupe font-bold">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {reviewSuccess && (
          <div className="mb-12 p-6 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-bold flex items-center gap-3">
             <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">✓</div>
             Thank you for your review! It has been posted.
          </div>
        )}

        {/* Existing Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {room.reviews && room.reviews.map((rev) => (
            <div key={rev.id} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                  {rev.user.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold">{rev.user.name}</div>
                  <div className="text-sm text-taupe">{new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              <p className="text-primary leading-relaxed">{rev.comment}</p>
              
              {rev.imageUrl && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 max-w-sm">
                  <img src={rev.imageUrl} alt="Review" className="w-full h-48 object-cover hover:scale-105 transition-transform cursor-pointer" />
                </div>
              )}
              
              {rev.hostResponse && (
                <div className="ml-8 mt-4 p-4 bg-primary/5 border-l-4 border-primary rounded-r-xl">
                  <div className="text-sm font-bold text-primary mb-1 underline">Response from host</div>
                  <p className="text-sm text-primary leading-relaxed italic">{rev.hostResponse}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
