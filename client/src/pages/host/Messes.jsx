import { useState, useEffect } from 'react';
import { Edit, Trash2, Search, Loader2, Plus, Utensils, MapPin, IndianRupee, Trash, Image as ImageIcon, Save, X } from 'lucide-react';
import { APIProvider, Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useAuth } from '../../context/AuthContext';

export default function Messes() {
  const { token } = useAuth();
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMess, setEditingMess] = useState(null); // null when not editing/creating
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [messImages, setMessImages] = useState([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    location: '',
    type: 'VEG',
    lat: 18.5204,
    lng: 73.8567
  });

  useEffect(() => {
    fetchMesses();
  }, [token]);

  const fetchMesses = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.myMesses) {
        setMesses(data.myMesses);
      }
    } catch (err) {
      console.error('Failed to fetch messes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingMess(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      location: '',
      type: 'VEG',
      lat: 18.5204,
      lng: 73.8567
    });
    setMessImages([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mess) => {
    setEditingMess(mess);
    setFormData({
      name: mess.name || '',
      description: mess.description || '',
      price: mess.price || '',
      location: mess.location || '',
      type: mess.type || 'VEG',
      lat: mess.lat || 18.5204,
      lng: mess.lng || 73.8567
    });
    setMessImages(mess.images ? mess.images.map(img => img.url) : []);
    setIsModalOpen(true);
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
        setMessImages(prev => [...prev, ...data.urls]);
      } else {
        alert(data.error || 'Failed to upload images');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (urlToRemove) => {
    setMessImages(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = editingMess 
      ? `http://localhost:5000/api/messes/${editingMess.id}` 
      : 'http://localhost:5000/api/messes';
    const method = editingMess ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images: messImages
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchMesses();
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/messes/${deleteConfirmId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        fetchMesses();
        setDeleteConfirmId(null);
      } else {
        alert(data.error || 'Failed to delete mess listing');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setDeleting(false);
    }
  };

  if (loading && messes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
        <p className="text-taupe font-bold text-lg">Loading your messes...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Mess Operations</h1>
          <p className="text-taupe font-semibold mt-2">Manage subscription dining, menus, veg/non-veg configurations.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-primary text-background px-8 py-4 rounded-2xl font-black shadow-2xl shadow-primary/20 hover:bg-accent hover:text-background transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <span className="text-xl">+</span> List New Mess
        </button>
      </div>

      {/* Mess List Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {messes.map((mess) => {
          const imageObj = mess.images && mess.images[0];
          const image = imageObj ? imageObj.url : null;
          const defaultImage = `/assets/messes/mess_${((mess.id || 0) % 12) + 1}.png`;

          return (
            <div key={mess.id} className="bg-surface rounded-[2.5rem] border border-border overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col group">
              <div className="aspect-[4/3] w-full relative overflow-hidden">
                <img 
                  src={image || defaultImage} 
                  alt={mess.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-accent/90 backdrop-blur-md text-background text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg border border-accent/20">
                  {mess.type}
                </div>
              </div>
              
              <div className="p-7 flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-primary capitalize tracking-tight line-clamp-1">{mess.name}</h3>
                  <div className="flex items-center gap-1 text-xs font-bold text-taupe mt-1">
                    <MapPin className="w-3.5 h-3.5 text-accent" />
                    <span>{mess.location}</span>
                  </div>
                  <p className="text-sm font-medium text-primary-light/75 line-clamp-2 mt-4">
                    {mess.description || 'Quality homemade dining served daily.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <div>
                    <span className="block text-[10px] font-black text-taupe uppercase tracking-widest">Monthly Rate</span>
                    <span className="text-2xl font-black text-primary">₹{mess.price.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleOpenEdit(mess)}
                      className="p-3 text-taupe hover:text-accent hover:bg-background border border-transparent hover:border-border rounded-xl transition-all shadow-sm"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(mess.id)}
                      className="p-3 text-taupe hover:text-red-500 hover:bg-background border border-transparent hover:border-red-500/20 rounded-xl transition-all shadow-sm"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {messes.length === 0 && (
          <div className="col-span-full text-center py-24 bg-surface/30 rounded-[3rem] border border-border">
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl border border-border">
              <Utensils className="w-12 h-12 text-taupe/40" />
            </div>
            <h3 className="text-3xl font-black text-primary mb-4">No Mess Listings Yet</h3>
            <p className="text-taupe font-medium max-w-sm mx-auto leading-relaxed">
              Start operations by creating your first meal listing. Make it Veg, Non-Veg, or Mixed.
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md overflow-y-auto p-4 animate-in fade-in duration-300">
          <div className="bg-surface border border-border p-8 sm:p-10 rounded-[3rem] max-w-3xl w-full shadow-2xl space-y-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar my-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-primary">
                  {editingMess ? 'Edit Mess Listing' : 'List a New Mess'}
                </h3>
                <p className="text-taupe text-sm font-semibold mt-1">Configure menu items, location and subscription pricing.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 text-taupe hover:text-primary hover:bg-background rounded-full transition-all border border-transparent hover:border-border"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-2 ml-1">Mess Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-background/50 border border-border rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary placeholder-taupe/40" 
                    placeholder="Ex. Annapurna Dining Hall" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-2 ml-1">Dining Plan Rate (₹ / Month)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-background/50 border border-border rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary placeholder-taupe/40" 
                    placeholder="3000" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-2 ml-1">Description / Signature Menu</label>
                  <textarea 
                    rows="3" 
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-background/50 border border-border rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary placeholder-taupe/40 resize-none" 
                    placeholder="List typical menu items (Ex: Roti, Paneer Sabzi, Dal, Rice, Salad)..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-2 ml-1">Neighborhood / Area</label>
                  <input 
                    type="text" 
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-background/50 border border-border rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary placeholder-taupe/40" 
                    placeholder="Ex. Katraj, Pune" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-2 ml-1">Cuisine / Diet Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-background/50 border border-border rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-primary"
                  >
                    <option value="VEG">VEG</option>
                    <option value="NON_VEG">NON VEG</option>
                    <option value="BOTH">VEG & NON VEG</option>
                  </select>
                </div>

                {/* Map location picker */}
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-black text-taupe uppercase tracking-widest mb-1 ml-1">Pin Dining Location</label>
                  <div className="w-full h-48 bg-background rounded-3xl overflow-hidden relative border border-border">
                    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                      <GoogleMap
                        key={`${formData.lat}-${formData.lng}`}
                        defaultZoom={13}
                        defaultCenter={{ lat: formData.lat, lng: formData.lng }}
                        onClick={handleMapClick}
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        className="w-full h-full"
                      >
                        <AdvancedMarker position={{ lat: formData.lat, lng: formData.lng }}>
                          <div className="w-8 h-8 bg-accent border-2 border-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <MapPin className="w-4 h-4 text-white" />
                          </div>
                        </AdvancedMarker>
                      </GoogleMap>
                    </APIProvider>
                  </div>
                </div>

                {/* Images Upload */}
                <div className="md:col-span-2 space-y-4">
                  <label className="block text-xs font-black text-taupe uppercase tracking-widest ml-1">Mess Photos</label>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                    {messImages.map((url, index) => (
                      <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-border group bg-background flex items-center justify-center">
                        <img src={url} alt={`Mess ${index + 1}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md hover:bg-red-600"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <label className="flex flex-col items-center justify-center aspect-video rounded-xl border border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer bg-background/30 group">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-accent animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-5 h-5 text-taupe group-hover:text-primary transition-colors" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-taupe group-hover:text-primary mt-1">Upload</span>
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
              </div>

              <div className="flex items-center justify-end gap-6 pt-6 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="text-taupe font-bold hover:text-primary transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="flex items-center gap-3 px-8 py-4 bg-primary text-background font-black rounded-2xl hover:bg-accent hover:text-background transition-all shadow-xl disabled:opacity-50 hover:scale-105 active:scale-95"
                >
                  <Save className="w-5 h-5" />
                  Save Dining Hall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface border border-border p-8 rounded-[2.5rem] max-w-md w-full mx-4 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-primary">Remove Mess?</h3>
              <p className="text-taupe text-sm font-semibold">
                Are you sure you want to permanently delete this mess listing? Subscribed student profiles will disconnect from it.
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="flex-1 py-4 bg-background border border-border hover:border-primary/20 text-primary font-bold rounded-2xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Removing...
                  </>
                ) : (
                  'Remove'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
