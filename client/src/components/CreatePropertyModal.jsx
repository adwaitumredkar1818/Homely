import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Box, Camera, Sparkles, MapPin, IndianRupee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../utils/api';

export default function CreatePropertyModal({ isOpen, onClose }) {
  const { token } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [listingType, setListingType] = useState('hostel'); // 'hostel' or 'mess'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    amenities: '',
    messes: '',
    type: 'VEG' // For Mess
  });
  
  const [images, setImages] = useState([{ url: '', isPanorama: false }]);

  const addImageField = () => setImages([...images, { url: '', isPanorama: false }]);
  const removeImageField = (index) => setImages(images.filter((_, i) => i !== index));
  const updateImage = (index, field, value) => {
    const newImages = [...images];
    newImages[index][field] = value;
    setImages(newImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let endpoint = listingType === 'hostel' ? `${API_URL}/api/rooms` : `${API_URL}/api/messes`;
      
      const payload = listingType === 'hostel' ? {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        location: formData.location,
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a),
        messes: formData.messes.split(',').map(m => m.trim()).filter(m => m),
        images: images.filter(img => img.url)
      } : {
        name: formData.title,
        description: formData.description,
        price: formData.price,
        location: formData.location,
        type: formData.type,
        images: images.filter(img => img.url)
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
           onClose();
           window.location.reload(); 
        }, 1500);
      } else {
        alert(data.error || 'Failed to list property');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="bg-surface rounded-[2.5rem] w-full max-w-[42rem] p-10 relative shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-y-auto border border-white/10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] pointer-events-none rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none rounded-full -ml-32 -mb-32" />

        <button onClick={onClose} className="absolute top-8 right-8 text-taupe hover:text-primary p-3 rounded-full hover:bg-white/5 transition-all z-20">
          <X className="w-6 h-6" />
        </button>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-accent/20">
            <Sparkles className="w-3 h-3" />
            Evolution Phase 2: Immersive Listing
          </div>
          <h2 className="text-4xl font-black text-primary tracking-tighter mb-2 leading-none">Expand your <span className="text-accent italic">empire</span>.</h2>
          <p className="text-taupe font-medium mb-10">Define your property with high-fidelity visuals and 360° virtual tours.</p>
          
          {isSuccess ? (
            <div className="bg-green-500/10 text-green-500 p-12 rounded-[2rem] text-center font-black border border-green-500/20 animate-in flip-in-x duration-700">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl mb-2">Property Published!</h3>
              <p className="opacity-80">Synchronizing with the Homely ecosystem...</p>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Type Selector */}
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-inner">
              <button 
                type="button"
                onClick={() => setListingType('hostel')}
                className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${listingType === 'hostel' ? 'bg-primary text-background shadow-xl scale-100' : 'text-taupe hover:text-primary scale-95'}`}
              >
                Hostel / Student PG
              </button>
              <button 
                type="button"
                onClick={() => setListingType('mess')}
                className={`flex-1 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${listingType === 'mess' ? 'bg-primary text-background shadow-xl scale-100' : 'text-taupe hover:text-primary scale-95'}`}
              >
                Mess / Dining Hall
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="group">
                <label className="block text-[10px] font-black text-taupe uppercase tracking-[0.2em] mb-3 transition-colors group-focus-within:text-accent">Title / Listing Name</label>
                <div className="relative">
                  <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/40" />
                  <input type="text" required onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent/50 outline-none text-primary font-bold transition-all shadow-xl" placeholder={listingType === 'hostel' ? "e.g. Royal Heritage PG" : "e.g. Grandma's Kitchen"} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-[10px] font-black text-taupe uppercase tracking-[0.2em] mb-3 group-focus-within:text-accent">Location / Area</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/40" />
                    <input type="text" required onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent/50 outline-none text-primary font-bold transition-all shadow-xl" placeholder="e.g. Koregaon Park" />
                  </div>
                </div>
                <div className="group">
                  <label className="block text-[10px] font-black text-taupe uppercase tracking-[0.2em] mb-3 group-focus-within:text-accent">Monthly Fee</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe/40" />
                    <input type="number" required onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent/50 outline-none text-primary font-bold transition-all shadow-xl" placeholder="9500" />
                  </div>
                </div>
              </div>

              {listingType === 'mess' && (
                <div className="group">
                  <label className="block text-[10px] font-black text-taupe uppercase tracking-[0.2em] mb-3 group-focus-within:text-accent">Dietary Category</label>
                  <select 
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-accent/50 outline-none text-primary font-bold appearance-none cursor-pointer shadow-xl"
                  >
                    <option value="VEG">Vegetarian Specialist</option>
                    <option value="NON_VEG">Non-Vegetarian Focused</option>
                    <option value="BOTH">Universal (Veg & Non-Veg)</option>
                  </select>
                </div>
              )}

              <div className="group">
                <label className="block text-[10px] font-black text-taupe uppercase tracking-[0.2em] mb-3 group-focus-within:text-accent">Description & Vision</label>
                <textarea required onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:ring-2 focus:ring-accent/50 outline-none text-primary font-bold transition-all shadow-xl min-h-[120px]" placeholder="Tell tenants about the vibe, security, and food quality..."></textarea>
              </div>

              {/* VR / Image Gallery Section */}
              <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-inner">
                <div className="flex items-center justify-between mb-6">
                  <label className="text-[10px] font-black text-taupe uppercase tracking-[0.3em] flex items-center gap-2">
                    <Camera className="w-4 h-4 text-accent" /> Media Gallery & VR Tours
                  </label>
                  <button 
                    type="button" 
                    onClick={addImageField}
                    className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-accent hover:text-background transition-all"
                  >
                    <Plus className="w-3 h-3" /> Add Image
                  </button>
                </div>

                <div className="space-y-4">
                  {images.map((img, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-4 items-center animate-in slide-in-from-right-4 duration-300">
                      <div className="flex-1 w-full relative">
                        <input 
                          type="text" 
                          value={img.url}
                          onChange={(e) => updateImage(index, 'url', e.target.value)}
                          placeholder="Image URL (Unsplash or direct link)"
                          className="w-full bg-surface border border-white/10 rounded-xl py-3 px-4 outline-none text-primary text-sm font-bold shadow-xl"
                        />
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <label className="flex items-center gap-3 cursor-pointer group">
                           <input 
                             type="checkbox" 
                             className="hidden"
                             checked={img.isPanorama}
                             onChange={(e) => updateImage(index, 'isPanorama', e.target.checked)}
                           />
                           <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${img.isPanorama ? 'bg-accent shadow-[0_0_15px_rgba(255,107,0,0.5)]' : 'bg-white/10'}`}>
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${img.isPanorama ? 'left-7' : 'left-1'}`} />
                           </div>
                           <span className={`text-[9px] font-black uppercase tracking-widest ${img.isPanorama ? 'text-accent' : 'text-taupe'}`}>360° VR</span>
                        </label>
                        {images.length > 1 && (
                          <button onClick={() => removeImageField(index)} className="p-2 text-red-500/50 hover:text-red-500 transition-colors">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-[9px] text-taupe font-medium leading-relaxed italic opacity-60">
                   Tip: Toggle <span className="text-accent font-black">360° VR</span> for panoramic images to enable interactive virtual tours for students.
                </p>
              </div>

              {listingType === 'hostel' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-[10px] font-black text-taupe uppercase tracking-[0.2em] mb-3 group-focus-within:text-accent">Amenities</label>
                    <input type="text" onChange={(e) => setFormData({...formData, amenities: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-accent/50 outline-none text-primary font-bold shadow-xl" placeholder="WiFi, Gym, AC..." />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-black text-taupe uppercase tracking-[0.2em] mb-3 group-focus-within:text-accent">Nearby Messes</label>
                    <input type="text" onChange={(e) => setFormData({...formData, messes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-accent/50 outline-none text-primary font-bold shadow-xl" placeholder="Annapurna, Sai..." />
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="group w-full bg-primary text-background font-black py-5 rounded-2xl transition-all hover:bg-accent hover:shadow-2xl hover:shadow-accent/20 mt-8 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {isLoading ? (
                <span className="animate-pulse">Analyzing & Publishing...</span>
              ) : (
                <>
                   List {listingType === 'hostel' ? 'Property' : 'Mess'} Now
                </>
              )}
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </button>
          </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
