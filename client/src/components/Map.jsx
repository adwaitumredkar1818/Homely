import { useState, useEffect } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Utensils, Home, School, Navigation } from 'lucide-react';

export default function Map({ rooms, collegeLocation }) {
  const [selectedEntity, setSelectedEntity] = useState(null);

  const initialCenter = collegeLocation 
    ? { lat: collegeLocation.lat, lng: collegeLocation.lng }
    : (rooms.length > 0 ? { lat: rooms[0].lat, lng: rooms[0].lng } : { lat: 18.5204, lng: 73.8567 });

  const allMesses = rooms.reduce((acc, room) => {
    if (room.messes && Array.isArray(room.messes)) {
      return [...acc, ...room.messes.map(m => ({ ...m, roomId: room.id }))];
    }
    return acc;
  }, []);

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        defaultZoom={collegeLocation ? 14 : 15}
        defaultCenter={initialCenter}
        mapId="DEMO_MAP_ID"
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        className="w-full h-full"
      >
        {/* College Marker */}
        {collegeLocation && (
          <AdvancedMarker
            position={{ lat: collegeLocation.lat, lng: collegeLocation.lng }}
          >
            <div className="flex flex-col items-center">
              <div className="bg-primary p-2 rounded-full border-4 border-white shadow-2xl animate-bounce">
                <School className="w-6 h-6 text-white" />
              </div>
              <div className="mt-1 px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg shadow-lg uppercase tracking-widest">
                {collegeLocation.name}
              </div>
            </div>
          </AdvancedMarker>
        )}

        {rooms.map((room) => (
          <AdvancedMarker
            key={`room-${room.id}`}
            position={{ lat: room.lat, lng: room.lng }}
            onClick={() => setSelectedEntity({ ...room, type: 'room' })}
          >
             <div className="group relative">
                <div className="w-10 h-10 bg-white border-2 border-primary rounded-full flex items-center justify-center shadow-xl group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                   <Home className="w-5 h-5 text-primary group-hover:text-white" />
                </div>
                {room.distanceToCollege && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-accent text-background text-[8px] font-black px-2 py-0.5 rounded-full shadow-md">
                    {room.distanceToCollege} km
                  </div>
                )}
             </div>
          </AdvancedMarker>
        ))}

        {selectedEntity && (
          <InfoWindow
            position={{ lat: selectedEntity.lat, lng: selectedEntity.lng }}
            onCloseClick={() => setSelectedEntity(null)}
          >
            <div className="flex flex-col -m-2 pb-2 w-56 font-sans">
               <div className="h-28 overflow-hidden">
                  <img 
                    src={selectedEntity.image || (selectedEntity.type === 'room' ? `/assets/rooms/student_room_${(selectedEntity.id % 15) + 1}.png` : `/assets/messes/mess_${(selectedEntity.id % 5) + 1}.png`)} 
                    className="w-full h-full object-cover" 
                    alt="" 
                  />
               </div>
               <div className="px-4 pt-3">
                  <div className="flex items-center gap-1.5 mb-1">
                     <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedEntity.type === 'room' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                        {selectedEntity.type}
                     </span>
                     {selectedEntity.isVerified && <span className="text-[8px] font-black text-green-500">VERIFIED</span>}
                  </div>
                  <div className="font-bold text-gray-800 leading-tight mb-1 truncate">{selectedEntity.title || selectedEntity.name}</div>
                  <div className="flex items-center justify-between mt-2">
                     <div className="font-black text-primary text-lg">₹{selectedEntity.price?.toLocaleString()}</div>
                     <button 
                        onClick={() => window.open(selectedEntity.type === 'room' ? `/room/${selectedEntity.id}` : `/home`, '_blank')}
                        className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                     >
                        View Details <Navigation className="w-3 h-3" />
                     </button>
                  </div>
               </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </APIProvider>
  );
}
