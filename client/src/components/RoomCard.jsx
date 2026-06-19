import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';

export default function RoomCard({ room }) {
  const defaultImage = `/assets/rooms/student_room_${(room.id % 15) + 1}.png`;
  
  return (
    <Link to={`/room/${room.id}`} className="flex flex-col gap-4 border border-white/10 rounded-2xl p-4 bg-surface hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
      <div className="w-full h-64 rounded-xl overflow-hidden relative shrink-0">
        {room.isVerified && (
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-primary/90 backdrop-blur-md text-background text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5 border border-white/20">
             <div className="w-2 h-2 bg-accent rounded-full animate-pulse" /> Verified
          </div>
        )}
        <img 
          src={room.image || defaultImage} 
          alt={room.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-md rounded-full text-primary-light hover:text-accent hover:bg-white hover:shadow-lg transition-all duration-300">
          <Heart className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-taupe">{room.location}</span>
              {room.distanceToCollege && (
                <span className="text-xs font-bold text-accent">{room.distanceToCollege} km to campus</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-accent text-accent" />
              <span className="text-sm font-bold text-primary">{room.rating}</span>
              <span className="text-sm text-taupe w-8">({room.reviews})</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-primary mb-3 line-clamp-1 group-hover:text-accent transition-colors duration-300">{room.title}</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {room.amenities.map(amenity => (
               <span key={amenity} className="text-xs px-2.5 py-1 bg-taupe-light/20 text-primary-light font-medium rounded-md">
                 {amenity}
               </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div className="text-sm text-gray-500">
            <span className="text-xl font-bold text-primary mr-1">₹{room.price.toLocaleString('en-IN')}</span>
            / month
          </div>
        </div>
      </div>
    </Link>
  );
}
