import { Link } from 'react-router-dom';
import { Utensils, MapPin, Star } from 'lucide-react';

export default function MessCard({ mess }) {
  // Use our high-quality local mess images (pool of 12)
  const defaultImage = `/assets/messes/mess_${(mess.id % 12) + 1}.png`;

  return (
    <Link 
      to={`/mess/${mess.id}`}
      className="flex flex-col gap-4 border border-white/10 rounded-2xl p-4 bg-surface hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
    >
      <div className="w-full h-48 rounded-xl overflow-hidden relative shrink-0">
        {mess.isVerified && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-accent/90 backdrop-blur-md text-background text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5 border border-white/20">
             <div className="w-2 h-2 bg-primary rounded-full animate-pulse" /> Verified
          </div>
        )}
        <img 
          src={mess.image || defaultImage} 
          alt={mess.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3 px-3 py-1 bg-accent/90 backdrop-blur-md rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
           <Utensils className="w-3 h-3" />
           {mess.type || 'BOTH'}
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-lg text-white text-[10px] font-bold flex items-center gap-1">
           <Star className="w-2.5 h-2.5 fill-accent text-accent" />
           {mess.rating || '4.5'}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-taupe flex items-center gap-1">
               <MapPin className="w-3 h-3" /> {mess.location}
            </span>
          </div>
          <h3 className="text-xl font-bold text-primary mb-3 line-clamp-1 group-hover:text-accent transition-colors duration-300 capitalize">{mess.name}</h3>
          <p className="text-sm text-taupe mb-4 line-clamp-2 leading-relaxed">
             {mess.description || 'Quality homemade food served fresh daily.'}
          </p>
        </div>
        
        <div className="flex items-end justify-between pt-4 border-t border-white/5">
          <div className="text-sm text-gray-500">
            <span className="text-xl font-bold text-accent mr-1">₹{mess.price?.toLocaleString('en-IN') || '3,000'}</span>
            / month
          </div>
          <div className="px-4 py-2 bg-primary text-background rounded-lg text-xs font-bold transition-all hover:bg-black">
             Join Mess
          </div>
        </div>
      </div>
    </Link>
  );
}
