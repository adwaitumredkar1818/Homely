import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../../utils/api';
import { Wifi, Car, Coffee, Wind, Tv, Shield, Utensils, Check, Plus, Loader2, MapPin } from 'lucide-react';
import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useAuth } from '../../context/AuthContext';

const AMENITY_OPTIONS = [
  { id: 'Wi-Fi', icon: Wifi },
  { id: 'Air Conditioning', icon: Wind },
  { id: 'Kitchen', icon: Coffee },
  { id: 'Free parking', icon: Car },
  { id: 'TV', icon: Tv },
  { id: 'Security', icon: Shield },
  { id: 'Mess Service', icon: Utensils },
];

export default function CreateProperty() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    lat: 18.5204,
    lng: 73.8567,
    amenities: [],
    type: 'ROOM'
  });

  const toggleAmenity = (id) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter(a => a !== id)
        : [...prev.amenities, id]
    }));
  };

  const handleMapClick = (e) => {
    if (e.detail.latLng) {
      setFormData(prev => ({
        ...prev,
        lat: e.detail.latLng.lat,
        lng: e.detail.latLng.lng
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = formData.type === 'ROOM' ? '/api/rooms' : '/api/messes';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        navigate('/host/properties');
      } else {
        alert(data.error || 'Failed to create listing');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-primary tracking-tight">List a New Property</h1>
        <p className="text-taupe font-semibold mt-2">Share your space with the student community and start earning.</p>
      </div>

      <div className="bg-surface rounded-[2.5rem] border border-white/10 shadow-2xl p-8 sm:p-12">
        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Basic Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-black">01</div>
               <h3 className="text-xl font-bold text-primary">Basic Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-2 ml-1">Listing Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-primary/5 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary placeholder-taupe/40" 
                  placeholder="Ex. Modern Student Studio near Pune University" 
                />
              </div>
              <div>
                <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-2 ml-1">Description</label>
                <textarea 
                  rows="4" 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-primary/5 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary placeholder-taupe/40 resize-none" 
                  placeholder="Describe what makes your space unique..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Location & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 flex items-center gap-3">
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-black">02</div>
               <h3 className="text-xl font-bold text-primary">Location & Pricing</h3>
            </div>
            <div>
              <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-2 ml-1">Price per Month (₹)</label>
              <input 
                type="number" 
                required
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full bg-primary/5 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary placeholder-taupe/40" 
                placeholder="0.00" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-2 ml-1">Area / Neighborhood</label>
              <input 
                type="text" 
                required
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full bg-primary/5 border-none rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary placeholder-taupe/40" 
                placeholder="Ex. Deccan Gymkhana" 
              />
            </div>
            
            {/* Map Picker */}
            <div className="md:col-span-2">
               <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-2 ml-1">Pin Exact Location on Map</label>
               <div className="w-full h-64 bg-primary/10 rounded-3xl overflow-hidden relative border-4 border-white/5">
                  <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                      defaultZoom={13}
                      defaultCenter={{ lat: 18.5204, lng: 73.8567 }}
                      mapId="PROPERTY_PICKER_MAP"
                      onClick={handleMapClick}
                      gestureHandling={'greedy'}
                      disableDefaultUI={true}
                      className="w-full h-full"
                    >
                      <AdvancedMarker position={{ lat: formData.lat, lng: formData.lng }}>
                         <div className="w-10 h-10 bg-accent border-4 border-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                            <MapPin className="w-5 h-5 text-white" />
                         </div>
                      </AdvancedMarker>
                    </GoogleMap>
                  </APIProvider>
                  <div className="absolute bottom-4 left-4 right-4 bg-surface/90 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-lg text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                     Click anywhere on the map to set exact property pin
                  </div>
               </div>
               <div className="mt-3 flex gap-4 text-[10px] font-bold text-taupe">
                  <span>LAT: {formData.lat.toFixed(4)}</span>
                  <span>LNG: {formData.lng.toFixed(4)}</span>
               </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-black">03</div>
               <h3 className="text-xl font-bold text-primary">Amenities</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {AMENITY_OPTIONS.map((amenity) => {
                const isSelected = formData.amenities.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => toggleAmenity(amenity.id)}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300 group relative ${isSelected ? 'bg-primary border-primary shadow-xl shadow-primary/20 scale-105' : 'bg-surface border-white/5 hover:border-primary/30 hover:bg-primary/5'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-primary/5 text-taupe group-hover:bg-primary/10 group-hover:text-primary'}`}>
                      <amenity.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest text-center ${isSelected ? 'text-white' : 'text-taupe'}`}>
                      {amenity.id}
                    </span>
                    {isSelected && (
                       <div className="absolute top-2 right-2 w-5 h-5 bg-white dark:bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                       </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-6 pt-8 border-t border-white/10">
            <button 
              type="button" 
              onClick={() => navigate('/host/properties')}
              className="text-taupe font-bold hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-3 px-10 py-5 bg-primary text-white dark:text-background font-black rounded-3xl hover:bg-black transition-all shadow-2xl shadow-primary/30 disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Publishing...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" /> Publish Listing
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
