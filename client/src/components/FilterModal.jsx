import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, SlidersHorizontal } from 'lucide-react';

const COMMON_AMENITIES = ['Wi-Fi', 'AC', 'Laundry', 'Security', 'Food', 'Parking', 'Gym', 'Study Room'];

export default function FilterModal({ isOpen, onClose, initialFilters, onApply }) {
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice || 30000);
  const [minRating, setMinRating] = useState(initialFilters.minRating || 0);
  const [minReviews, setMinReviews] = useState(initialFilters.minReviews || 0);
  const [selectedAmenities, setSelectedAmenities] = useState(initialFilters.amenities || []);

  useEffect(() => {
    if (isOpen) {
      setMaxPrice(initialFilters.maxPrice || 30000);
      setMinRating(initialFilters.minRating || 0);
      setMinReviews(initialFilters.minReviews || 0);
      setSelectedAmenities(initialFilters.amenities || []);
    }
  }, [isOpen, initialFilters]);

  if (!isOpen) return null;

  const handleToggleAmenity = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleApply = () => {
    onApply({
      maxPrice,
      minRating,
      minReviews,
      amenities: selectedAmenities
    });
    onClose();
  };

  const handleClear = () => {
    setMaxPrice(30000);
    setMinRating(0);
    setMinReviews(0);
    setSelectedAmenities([]);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-end sm:items-center sm:justify-center">
      {/* Drawer on mobile, Modal on Desktop */}
      <div className="bg-surface h-full w-full sm:h-auto sm:rounded-2xl sm:max-w-md sm:w-full p-6 relative shadow-2xl overflow-y-auto transform transition-all flex flex-col">
        
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold text-primary">Filter Options</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-white/5 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto pb-4">
          
          {/* Price Range */}
          <div>
            <label className="block text-sm font-bold text-primary mb-4">
              Max Price: <span className="text-accent text-lg">₹{maxPrice.toLocaleString('en-IN')}</span> / month
            </label>
            <input 
               type="range" min="3000" max="40000" step="500" 
               value={maxPrice} onChange={e => setMaxPrice(parseInt(e.target.value))} 
               className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-accent" 
            />
            <div className="flex justify-between text-xs text-taupe mt-2 font-medium">
               <span>₹3,000</span>
               <span>₹40,000</span>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-bold text-primary mb-3">Minimum Rating</label>
            <div className="grid grid-cols-5 gap-2">
               {[1, 2, 3, 4, 5].map(rating => (
                 <button 
                    key={rating}
                    onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                    className={`py-2 rounded-lg text-sm font-bold transition-colors ${minRating === rating ? 'bg-accent text-white' : 'bg-gray-100 dark:bg-background text-taupe hover:bg-gray-200 dark:hover:bg-white/5'}`}
                 >
                    {rating}★
                 </button>
               ))}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <label className="block text-sm font-bold text-primary mb-2">Minimum Reviews</label>
             <input 
               type="number" min="0" max="500"
               value={minReviews || ''} onChange={e => setMinReviews(parseInt(e.target.value) || 0)} 
               placeholder="e.g. 50"
               className="w-full px-4 py-3 bg-gray-50 dark:bg-background border border-white/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent text-primary"
             />
          </div>

          {/* Amenities */}
          <div>
            <label className="block text-sm font-bold text-primary mb-3">Required Amenities</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {COMMON_AMENITIES.map(amenity => (
                 <button 
                   key={amenity}
                   onClick={() => handleToggleAmenity(amenity)}
                   className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${selectedAmenities.includes(amenity) ? 'bg-primary text-background' : 'bg-taupe-light/20 text-primary hover:bg-taupe-light/40'}`}
                 >
                   {amenity}
                 </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex gap-4 mt-auto sm:mt-4">
           <button onClick={handleClear} className="w-1/3 py-3 font-bold text-taupe hover:text-primary">Clear All</button>
           <button onClick={handleApply} className="w-2/3 bg-primary hover:bg-black text-background font-bold py-3 rounded-lg transition-colors">Apply Filters</button>
        </div>

      </div>
    </div>,
    document.body
  );
}
