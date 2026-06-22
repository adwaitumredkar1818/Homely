import { useState, useEffect } from 'react';
import RoomCard from './RoomCard';
import MessCard from './MessCard';
import { Sparkles, Loader2 } from 'lucide-react';

export default function SimilarListings({ type, id }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/${type}/${id}/recommendations`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecommendations(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch recommendations:', err);
        setLoading(false);
      });
  }, [type, id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-16 pt-12 border-t border-white/10 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-accent/10 border border-accent/20 rounded-xl text-accent">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-primary tracking-tight">Similar Listings</h3>
          <p className="text-xs text-taupe font-semibold uppercase tracking-wider">Handpicked options based on proximity and price</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((item) => (
          <div key={item.id} className="animate-bloom">
            {type === 'rooms' ? (
              <RoomCard room={item} />
            ) : (
              <MessCard mess={item} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
