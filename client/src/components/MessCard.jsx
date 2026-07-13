import { Link } from 'react-router-dom';
import { Utensils, MapPin, Star } from 'lucide-react';

export default function MessCard({ mess }) {
  const defaultImage = `/assets/messes/mess_${((mess.id || 0) % 12) + 1}.png`;

  return (
    <Link 
      to={`/mess/${mess.id}`}
      className="group relative flex flex-col glass-card rounded-[2.5rem] overflow-hidden transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] hover:-translate-y-2 active:scale-95 border-white/5 hover:border-white/20"
    >
      <div className="aspect-[4/3] w-full relative overflow-hidden">
        {mess.isVerified && (
          <div className="absolute top-5 left-5 z-20 px-3.5 py-2 bg-background/80 backdrop-blur-xl text-primary text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-2xl flex items-center gap-2 border border-white/10">
             <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(var(--color-accent),0.5)]" /> 
             Verified
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-60 z-10 transition-opacity duration-700 group-hover:opacity-40" />
        <img 
          src={mess.image || defaultImage} 
          alt={mess.name}
          className="w-full h-full object-cover transition-transform duration-[1.5s] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-110"
        />
        
        <div className="absolute top-5 right-5 z-20 flex flex-col gap-2">
          <div className="px-3 py-1.5 bg-accent/90 backdrop-blur-md rounded-xl text-background text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl border border-accent/20">
             <Utensils className="w-3 h-3" />
             {mess.type || 'BOTH'}
          </div>
          <div className="px-3 py-1.5 bg-background/80 backdrop-blur-md rounded-xl text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl border border-white/10 ml-auto">
             <Star className="w-3 h-3 fill-accent text-accent" />
             {mess.rating || '4.5'}
          </div>
        </div>

        {/* Price Tag Overlay */}
        <div className="absolute bottom-6 left-6 z-20">
          <div className="flex flex-col">
            <span className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Monthly Plan</span>
            <span className="text-2xl font-black text-white tracking-tighter">₹{(mess.price || 3000).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Distance Badge */}
        {mess.distanceToCollege && (
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl border border-white/10 transition-transform duration-700 group-hover:scale-110">
            <MapPin className="w-3 h-3 text-accent" />
            {mess.distanceToCollege} KM
          </div>
        )}
      </div>
      
      <div className="p-7 flex-1 flex flex-col">
        <h3 className="text-2xl font-black text-primary tracking-tighter leading-none group-hover:text-accent transition-colors duration-500 line-clamp-1 mb-4 capitalize">{mess.name}</h3>
        
        <p className="text-taupe text-[11px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-accent/60" />
          {mess.location}
        </p>

        <p className="text-primary/60 text-sm font-medium leading-relaxed line-clamp-2 mb-8">
           {mess.description || 'Quality homemade food served fresh daily.'}
        </p>

        <div className="mt-auto flex items-center justify-between">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
               <Utensils className="w-4 h-4 text-accent" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-taupe">Daily Meals</span>
           </div>
           <div className="px-6 py-3 bg-primary text-background rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-accent shadow-lg">
              View Menu
           </div>
        </div>
      </div>
    </Link>
  );
}
