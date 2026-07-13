import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Car, Coffee, Wind, Tv, Shield, Utensils, Check, Plus, Loader2, MapPin, Trash2, Image as ImageIcon } from 'lucide-react';
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
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    lat: 18.5204,
    lng: 73.8567,
    amenities: []
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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);

    const formDataUpload = new FormData();
    files.forEach(file => formDataUpload.append('images', file));

    try {
      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });
      const data = await res.json();
      if (data.success) {
        setImages(prev => [...prev, ...data.urls]);
      } else {
        alert(data.error || 'Failed to upload images');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (urlToRemove) => {
    setImages(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images: images
        })
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

      <div className="bg-surface rounded-[2.5rem] border border-border shadow-2xl p-8 sm:p-12">
        <form onSubmit={handleSubmit} className="space-y-12">
          
          {/* Basic Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-background text-xs font-black">01</div>
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
                  className="w-full bg-background/50 border border-border rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary placeholder-taupe/40" 
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
                  className="w-full bg-background/50 border border-border rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary placeholder-taupe/40 resize-none" 
                  placeholder="Describe what makes your space unique..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Location & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 flex items-center gap-3">
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-background text-xs font-black">02</div>
               <h3 className="text-xl font-bold text-primary">Location & Pricing</h3>
            </div>
            <div>
              <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-2 ml-1">Price per Month (₹)</label>
              <input 
                type="number" 
                required
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full bg-background/50 border border-border rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary placeholder-taupe/40" 
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
                className="w-full bg-background/50 border border-border rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary placeholder-taupe/40" 
                placeholder="Ex. Deccan Gymkhana" 
              />
            </div>
            
            {/* Map Picker */}
            <div className="md:col-span-2">
               <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-2 ml-1">Pin Exact Location on Map</label>
             <div className="w-full h-64 bg-background rounded-3xl overflow-hidden relative border-4 border-border">
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
                  <div className="absolute bottom-4 left-4 right-4 bg-surface/90 backdrop-blur-md p-3 rounded-2xl border border-border shadow-lg text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
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

          {/* Photo Gallery (Upload) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-background text-xs font-black">03</div>
              <h3 className="text-xl font-bold text-primary">Photos Gallery</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((url, index) => (
                <div key={index} className="relative aspect-video rounded-2xl overflow-hidden border border-border group bg-background flex items-center justify-center">
                  <img src={url} alt={`Listing upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <label className="flex flex-col items-center justify-center aspect-video rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer bg-background/30 group">
                {uploading ? (
                  <>
                    <Loader2 className="w-6 h-6 text-accent animate-spin mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-taupe">Uploading...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-taupe group-hover:text-primary transition-colors mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-taupe group-hover:text-primary transition-colors">Add Photo</span>
                  </>
                )}
                <input 
                  type="file" 
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
               <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-background text-xs font-black">04</div>
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
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all duration-300 group ${isSelected ? 'bg-primary border-primary text-background shadow-xl shadow-primary/20 scale-105' : 'bg-surface border-border hover:border-primary/30 hover:bg-background/50'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? 'bg-background/20 text-background' : 'bg-background text-taupe group-hover:bg-primary/5 group-hover:text-primary'}`}>
                      <amenity.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest text-center ${isSelected ? 'text-background' : 'text-taupe'}`}>
                      {amenity.id}
                    </span>
                    {isSelected && (
                       <div className="absolute top-2 right-2 w-5 h-5 bg-background rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                       </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-6 pt-8 border-t border-border">
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
              className="flex items-center gap-3 px-10 py-5 bg-primary text-background font-black rounded-3xl hover:bg-accent hover:text-background transition-all shadow-2xl shadow-primary/30 disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 hover:shadow-accent/20"
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
