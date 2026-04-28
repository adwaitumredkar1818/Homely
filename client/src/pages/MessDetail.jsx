import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Heart, Share, ChevronLeft, Utensils, MapPin, Clock, Shield, Calendar, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import Map from '../components/Map';
import { useAuth } from '../context/AuthContext';

export default function MessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    fetch(`http://localhost:5000/api/messes/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setMess(data);
          setIsSubscribed(data.isSubscribed);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/auth', { state: { from: window.location.pathname } });
      return;
    }

    setIsSubscribing(true);
    try {
      const res = await fetch(`http://localhost:5000/api/messes/${id}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'MONTHLY', price: mess.price })
      });
      const data = await res.json();
      if (data.success) {
        setIsSubscribed(true);
      } else {
        alert(data.error || 'Failed to subscribe.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubscribing(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background py-20">
      <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
      <p className="text-taupe font-bold">Loading mess details...</p>
    </div>
  );

  if (!mess) return (
    <div className="text-center py-20 flex flex-col items-center">
      <div className="text-2xl font-bold text-primary mb-4">Mess listing not found</div>
      <Link to="/home" className="text-accent hover:underline font-semibold">Return to Home</Link>
    </div>
  );

  // Fallback images if needed
  const getMessImage = (idx) => `/assets/messes/mess_${((mess.id + idx) % 12) + 1}.png`;

  const galleryImages = [
    mess.image || getMessImage(0),
    getMessImage(1),
    getMessImage(2),
    getMessImage(3),
    getMessImage(4)
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header Info */}
      <div className="mb-6">
        <Link to="/home" className="inline-flex items-center text-sm font-medium text-taupe hover:text-primary mb-4 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to messes
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2 capitalize">{mess.name}</h1>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors border border-white/10">
              <Share className="w-4 h-4" /> Share
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-white/5 px-3 py-1.5 rounded-lg transition-colors border border-white/10">
              <Heart className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
        <div className="flex items-center text-sm font-medium mt-4">
          <Star className="w-4 h-4 fill-current text-accent mr-1" />
          <span className="mr-1">{mess.rating}</span>
          <span className="text-taupe underline mr-4 cursor-pointer hover:text-primary">{mess.reviewCount} reviews</span>
          <span className="text-taupe/30 mx-2">•</span>
          <span className="text-taupe underline cursor-pointer hover:text-primary flex items-center gap-1">
             <MapPin className="w-3.5 h-3.5" /> {mess.location}
          </span>
          <span className="text-taupe/30 mx-2">•</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${mess.type === 'VEG' ? 'bg-green-500/10 text-green-500' : (mess.type === 'NON_VEG' ? 'bg-red-500/10 text-red-500' : 'bg-accent/10 text-accent')}`}>
            {mess.type} Only
          </span>
        </div>
      </div>

      {/* Image Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[400px] sm:h-[500px] mb-12 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
        <div className="md:col-span-2 md:row-span-2 relative group hover:opacity-90 cursor-pointer transition-opacity">
          <img src={galleryImages[0]} className="w-full h-full object-cover" alt="Main" />
        </div>
        <div className="hidden md:block relative group hover:opacity-90 cursor-pointer transition-opacity">
          <img src={galleryImages[1]} className="w-full h-full object-cover" alt="Mess 1" />
        </div>
        <div className="hidden md:block relative group hover:opacity-90 cursor-pointer transition-opacity">
          <img src={galleryImages[2]} className="w-full h-full object-cover" alt="Mess 2" />
        </div>
        <div className="hidden md:block relative group hover:opacity-90 cursor-pointer transition-opacity">
          <img src={galleryImages[3]} className="w-full h-full object-cover" alt="Mess 3" />
        </div>
        <div className="hidden md:block relative group hover:opacity-90 cursor-pointer transition-opacity">
          <img src={galleryImages[4]} className="w-full h-full object-cover" alt="Mess 4" />
        </div>
      </div>

      {/* Main Content & Subscription Panel */}
      <div className="flex flex-col lg:flex-row gap-12 relative">
        
        {/* Left Column (Details) */}
        <div className="flex-1 space-y-12">
          <div className="pb-8 border-b border-white/10">
            <h2 className="text-2xl font-bold text-primary mb-4">About this Mess</h2>
            <p className="text-taupe leading-relaxed text-lg">
              {mess.description}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-white/10">
            <div className="flex gap-4">
              <Shield className="w-8 h-8 text-accent shrink-0" />
              <div>
                <h3 className="font-bold text-lg text-primary">FSSAI Certified</h3>
                <p className="text-taupe text-sm">Strict hygiene standards and regular safety inspections.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Clock className="w-8 h-8 text-accent shrink-0" />
              <div>
                <h3 className="font-bold text-lg text-primary">Flexible Timings</h3>
                <p className="text-taupe text-sm">Breakfast, Lunch, and Dinner served at convenient hours.</p>
              </div>
            </div>
          </div>

          <div className="py-8 border-b border-white/10">
             <h2 className="text-2xl font-bold text-primary mb-8 flex items-center gap-3">
               <Utensils className="w-6 h-6 text-accent" /> Weekly Specialty Menu
             </h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { day: 'Monday', dish: 'Paneer Butter Masala & Dal Tadka' },
                  { day: 'Tuesday', dish: 'Veg Pulao & Raita' },
                  { day: 'Wednesday', dish: 'Malai Kofta & Jeera Rice' },
                  { day: 'Thursday', dish: 'Aloo Gobi & Mix Veg' },
                  { day: 'Friday', dish: 'Special Maharashtrian Thali' },
                  { day: 'Sunday', dish: 'Royal Veg Biryani & Sweet' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-white/5 group hover:border-accent/30 transition-all">
                    <div>
                       <p className="text-[10px] font-black uppercase text-accent mb-0.5">{item.day}</p>
                       <p className="font-bold text-primary">{item.dish}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
             </div>
          </div>
          
          <div className="py-8">
             <h2 className="text-2xl font-bold text-primary mb-6">Location</h2>
             <div className="w-full h-[400px] bg-surface rounded-[2.5rem] relative overflow-hidden shadow-inner border border-white/10">
                <Map rooms={[{ ...mess, title: mess.name }]} />
             </div>
          </div>
        </div>

        {/* Right Column (Subscription Widget) */}
        <div className="w-full lg:w-[35%]">
          <div className="sticky top-28 bg-surface border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-16 -mt-16" />
             
             <div className="relative z-10">
               <div className="flex items-end justify-between mb-8">
                 <div>
                    <span className="text-3xl font-bold text-primary">₹{mess.price.toLocaleString('en-IN')}</span>
                    <span className="text-taupe font-medium"> / month</span>
                 </div>
                 <div className="flex items-center text-sm font-bold bg-accent/10 text-accent px-3 py-1 rounded-full">
                   <Star className="w-3.5 h-3.5 fill-current mr-1" />
                   <span>{mess.rating}</span>
                 </div>
               </div>
               
               <div className="space-y-4 mb-8">
                  <div className="p-4 bg-background rounded-2xl border border-white/5">
                     <div className="text-[10px] font-black uppercase text-accent mb-1">Plan Type</div>
                     <div className="text-primary font-bold">Standard Monthly Subscription</div>
                  </div>
                  <div className="p-4 bg-background rounded-2xl border border-white/5 flex items-center justify-between">
                     <div>
                        <div className="text-[10px] font-black uppercase text-accent mb-1">Meals Included</div>
                        <div className="text-primary font-bold">Lunch & Dinner</div>
                     </div>
                     <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
               </div>

               {isSubscribed ? (
                 <div className="w-full bg-green-500 text-background font-bold py-4 rounded-2xl text-center mb-6 text-lg shadow-lg flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Subscribed
                 </div>
               ) : (
                 <button 
                   onClick={handleSubscribe} 
                   disabled={isSubscribing}
                   className="w-full bg-primary hover:bg-accent text-background font-bold py-4 rounded-2xl transition-all mb-4 text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                    {isSubscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Subscribe Now'}
                 </button>
               )}

               <button 
                  onClick={() => {
                    if (!user) {
                      navigate('/auth', { state: { from: window.location.pathname } });
                      return;
                    }
                    navigate('/inbox', { state: { userId: mess.hostId } });
                  }}
                  className="w-full flex items-center justify-center gap-2 border-2 border-primary text-primary font-bold py-3 rounded-2xl hover:bg-primary hover:text-background transition-all mb-6 text-lg cursor-pointer"
                >
                   <MessageSquare className="w-5 h-5" /> Chat with Owner
                </button>

               <div className="space-y-4 border-t border-white/5 pt-6">
                 <div className="flex justify-between text-taupe font-medium">
                   <span>Basic Monthly Rate</span>
                   <span>₹{mess.price.toLocaleString('en-IN')}</span>
                 </div>
                 <div className="flex justify-between text-taupe font-medium">
                   <span>Registration Fee</span>
                   <span className="text-green-500">Free</span>
                 </div>
                 <div className="flex justify-between text-taupe font-medium">
                   <span>Trial Period (3 Days)</span>
                   <span>₹499</span>
                 </div>
                 <div className="flex justify-between font-bold text-xl text-primary pt-4 border-t border-white/5">
                    <span>Payable Now</span>
                    <span>₹{isSubscribed ? '0' : mess.price.toLocaleString('en-IN')}</span>
                 </div>
               </div>

               <div className="mt-8 flex items-center gap-3 p-4 bg-accent/5 rounded-2xl border border-accent/10">
                  <Shield className="w-5 h-5 text-accent" />
                  <p className="text-[10px] text-taupe font-bold leading-tight">
                    Your subscription is protected by our Quality Guarantee. Cancel anytime if not satisfied.
                  </p>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-20 pt-16 border-t border-white/10">
        <h2 className="text-3xl font-bold text-primary mb-12 flex items-center gap-3">
          <Star className="w-8 h-8 fill-accent text-accent" /> {mess.rating} · {mess.reviewCount} Reviews
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {mess.reviews && mess.reviews.map((rev) => (
            <div key={rev.id} className="space-y-4 p-6 bg-surface rounded-3xl border border-white/5 relative group hover:border-accent/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center font-bold text-background text-xl">
                  {rev.user.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-primary">{rev.user.name}</div>
                  <div className="text-xs text-taupe font-medium">{new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div>
                </div>
                <div className="ml-auto flex gap-1">
                   {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.round(rev.overallRating) ? 'fill-accent text-accent' : 'text-taupe/20'}`} />
                   ))}
                </div>
              </div>
              <p className="text-primary leading-relaxed">{rev.comment}</p>
            </div>
          ))}
          {(!mess.reviews || mess.reviews.length === 0) && (
             <div className="md:col-span-2 text-center py-12 bg-surface rounded-3xl border border-dashed border-white/10">
                <p className="text-taupe font-bold">No reviews yet. Be the first to share your experience!</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
