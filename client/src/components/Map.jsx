import { useState, useEffect } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Utensils, Home, School, Navigation, Coffee, BookOpen, HeartPulse, MapPin } from 'lucide-react';

export default function Map({ rooms, collegeLocation }) {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showEssentials, setShowEssentials] = useState(false);

  const initialCenter = collegeLocation 
    ? { lat: collegeLocation.lat, lng: collegeLocation.lng }
    : (rooms.length > 0 ? { lat: rooms[0].lat, lng: rooms[0].lng } : { lat: 18.5204, lng: 73.8567 });

  const essentials = [
    { id: 'e1', name: '24/7 Library', lat: initialCenter.lat + 0.005, lng: initialCenter.lng + 0.003, type: 'library', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'e2', name: 'Late Night Maggi Point', lat: initialCenter.lat - 0.004, lng: initialCenter.lng + 0.006, type: 'food', icon: <Coffee className="w-4 h-4" /> },
    { id: 'e3', name: 'City Hospital', lat: initialCenter.lat + 0.008, lng: initialCenter.lng - 0.002, type: 'health', icon: <HeartPulse className="w-4 h-4" /> },
  ];

  return (
    <div className="relative w-full h-full">
      {/* Essentials Toggle */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2">
        <button 
          onClick={() => setShowEssentials(!showEssentials)}
          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl transition-all ${
            showEssentials ? 'bg-accent text-background scale-105' : 'bg-surface/80 backdrop-blur-md text-primary border border-white/10'
          }`}
        >
          <MapPin className="w-4 h-4" /> {showEssentials ? 'Hide Essentials' : 'Student Essentials'}
        </button>
      </div>

      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          defaultZoom={collegeLocation ? 14 : 15}
          defaultCenter={initialCenter}
          mapId="DEMO_MAP_ID"
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          className="w-full h-full rounded-[2rem] overflow-hidden"
        >
          {/* College Marker */}
          {collegeLocation && (
            <AdvancedMarker
              position={{ lat: collegeLocation.lat, lng: collegeLocation.lng }}
            >
              <div className="flex flex-col items-center">
                <div className="bg-primary p-2 rounded-full border-4 border-white shadow-2xl animate-bounce">
                  <School className="w-6 h-6 text-background" />
                </div>
                <div className="mt-1 px-3 py-1 bg-primary text-background text-[10px] font-black rounded-lg shadow-lg uppercase tracking-widest">
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
                  <div className="w-10 h-10 bg-white border-2 border-primary rounded-full flex items-center justify-center shadow-xl group-hover:bg-primary group-hover:scale-110 transition-all duration-300 cursor-pointer">
                    <Home className="w-5 h-5 text-zinc-800 group-hover:text-background" />
                  </div>
                  {room.distanceToCollege && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-accent text-background text-[8px] font-black px-2 py-0.5 rounded-full shadow-md">
                      {room.distanceToCollege} km
                    </div>
                  )}
              </div>
            </AdvancedMarker>
          ))}

          {showEssentials && essentials.map((item) => (
            <AdvancedMarker
              key={item.id}
              position={{ lat: item.lat, lng: item.lng }}
              onClick={() => setSelectedEntity({ ...item, type: 'essential' })}
            >
              <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
                <div className={`p-2 rounded-xl shadow-xl border-2 border-white ${
                  item.type === 'food' ? 'bg-orange-500' : 
                  item.type === 'library' ? 'bg-indigo-500' : 'bg-red-500'
                }`}>
                  {item.icon}
                </div>
                <div className="mt-1 px-2 py-0.5 bg-background text-primary text-[8px] font-black rounded shadow uppercase tracking-widest border border-white/10">
                  {item.name}
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {selectedEntity && (
            <InfoWindow
              position={{ lat: selectedEntity.lat, lng: selectedEntity.lng }}
              onCloseClick={() => setSelectedEntity(null)}
            >
              <div className="flex flex-col -m-2 pb-2 w-56 font-sans">
                {selectedEntity.type !== 'essential' && (
                  <div className="h-28 overflow-hidden">
                    <img 
                      src={selectedEntity.image || (selectedEntity.type === 'room' ? `/assets/rooms/student_room_${(selectedEntity.id % 15) + 1}.png` : `/assets/messes/mess_${(selectedEntity.id % 5) + 1}.png`)} 
                      className="w-full h-full object-cover" 
                      alt="" 
                    />
                  </div>
                )}
                <div className="px-4 pt-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        selectedEntity.type === 'room' ? 'bg-primary/10 text-primary' : 
                        selectedEntity.type === 'essential' ? 'bg-accent/10 text-accent' : 'bg-accent/10 text-accent'
                      }`}>
                          {selectedEntity.type}
                      </span>
                      {selectedEntity.isVerified && <span className="text-[8px] font-black text-green-500">VERIFIED</span>}
                    </div>
                    <div className="font-bold text-gray-800 leading-tight mb-1 truncate">{selectedEntity.title || selectedEntity.name}</div>
                    <div className="flex items-center justify-between mt-2">
                      {selectedEntity.price && <div className="font-black text-primary text-lg">₹{selectedEntity.price?.toLocaleString()}</div>}
                      {selectedEntity.type !== 'essential' ? (
                        <button 
                          onClick={() => window.open(selectedEntity.type === 'room' ? `/room/${selectedEntity.id}` : `/home`, '_blank')}
                          className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1"
                        >
                          View Details <Navigation className="w-3 h-3" />
                        </button>
                      ) : (
                        <p className="text-[9px] font-medium text-taupe">Student Recommendation</p>
                      )}
                    </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </APIProvider>
    </div>
  );
}
