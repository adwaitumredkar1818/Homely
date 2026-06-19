import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CreatePropertyModal({ isOpen, onClose }) {
  const { token } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let endpoint = listingType === 'hostel' ? 'http://localhost:5000/api/rooms' : 'http://localhost:5000/api/messes';
      
      const payload = listingType === 'hostel' ? {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        location: formData.location,
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a),
        messes: formData.messes.split(',').map(m => m.trim()).filter(m => m)
      } : {
        name: formData.title,
        description: formData.description,
        price: formData.price,
        location: formData.location,
        type: formData.type
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
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="bg-surface rounded-3xl w-full max-w-[34rem] p-8 relative shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto border border-white/10 animate-in fade-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 text-taupe hover:text-primary p-2 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-3xl font-bold text-primary mb-2">Create New Listing</h2>
        <p className="text-taupe text-sm mb-8">Share your property or dining service with the community.</p>
        
        {isSuccess ? (
          <div className="bg-green-500/10 text-green-500 p-8 rounded-2xl text-center font-bold border border-green-500/20 animate-in flip-in-x duration-500">
            <div className="text-4xl mb-2">🎉</div>
            Listing Live! Refreshing marketplace...
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Toggle Switch */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              type="button"
              onClick={() => setListingType('hostel')}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${listingType === 'hostel' ? 'bg-primary text-background shadow-lg' : 'text-taupe hover:text-primary'}`}
            >
              Hostel / PG
            </button>
            <button 
              type="button"
              onClick={() => setListingType('mess')}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${listingType === 'mess' ? 'bg-primary text-background shadow-lg' : 'text-taupe hover:text-primary'}`}
            >
              Mess / Dining
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">Title / Name</label>
              <input type="text" required onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none text-primary transition-all" placeholder={listingType === 'hostel' ? "e.g. Luxury IT PG" : "e.g. Annapurna Mess"} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">Location</label>
                <input type="text" required onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none text-primary transition-all" placeholder="e.g. Wakad" />
              </div>
              <div>
                <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">Monthly Price (₹)</label>
                <input type="number" required onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none text-primary transition-all" placeholder="5000" />
              </div>
            </div>

            {listingType === 'mess' && (
              <div>
                <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">Dietary Type</label>
                <select 
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none text-primary appearance-none"
                >
                  <option value="VEG">Vegetarian Only</option>
                  <option value="NON_VEG">Non-Vegetarian Only</option>
                  <option value="BOTH">Both (Veg & Non-Veg)</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">Description</label>
              <textarea required onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none text-primary transition-all" placeholder="Describe the quality and services..." rows="3"></textarea>
            </div>

            {listingType === 'hostel' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">Amenities (Comma separated)</label>
                  <input type="text" onChange={(e) => setFormData({...formData, amenities: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none text-primary transition-all" placeholder="WiFi, AC, Laundry" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2">Nearby Messes (Comma separated)</label>
                  <input type="text" onChange={(e) => setFormData({...formData, messes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-primary outline-none text-primary transition-all" placeholder="Sai Mess, Annapurna" />
                </div>
              </>
            ) : null}
          </div>

          <button type="submit" className="w-full bg-primary text-background font-bold py-4 rounded-xl transition-all hover:bg-black hover:shadow-xl shadow-primary/20 mt-4 active:scale-95">
            List {listingType === 'hostel' ? 'Property' : 'Mess'} Now
          </button>
        </form>
        )}
      </div>
    </div>,
    document.body
  );
}
