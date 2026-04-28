import { useState } from 'react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { Utensils, Home } from 'lucide-react';

export default function Map({ rooms }) {
  const [selectedEntity, setSelectedEntity] = useState(null);

  const initialCenter = rooms.length > 0 
    ? { lat: rooms[0].lat, lng: rooms[0].lng } 
    : { lat: 18.5204, lng: 73.8567 };

  const allMesses = rooms.reduce((acc, room) => {
    if (room.messes && Array.isArray(room.messes)) {
      return [...acc, ...room.messes.map(m => ({ ...m, roomId: room.id }))];
    }
    return acc;
  }, []);

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        defaultZoom={15}
        defaultCenter={initialCenter}
        mapId="DEMO_MAP_ID"
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        className="w-full h-full rounded-2xl z-0"
      >
        {rooms.map((room) => (
          <AdvancedMarker
            key={`room-${room.id}`}
            position={{ lat: room.lat, lng: room.lng }}
            onClick={() => setSelectedEntity({ ...room, type: 'room' })}
          >
             <div className="w-8 h-8 bg-primary border-2 border-white rounded-full flex items-center justify-center shadow-lg">
                <Home className="w-4 h-4 text-white" />
             </div>
          </AdvancedMarker>
        ))}

        {allMesses.map((mess, idx) => (
          <AdvancedMarker
            key={`mess-${idx}`}
            position={{ lat: mess.lat, lng: mess.lng }}
            onClick={() => setSelectedEntity({ ...mess, type: 'mess' })}
          >
             <div className="bg-accent p-1.5 rounded-full border-2 border-white shadow-lg transform hover:scale-110 transition-transform">
                <Utensils className="w-3.5 h-3.5 text-white" />
             </div>
          </AdvancedMarker>
        ))}

        {selectedEntity && (
          <InfoWindow
            position={{ lat: selectedEntity.lat, lng: selectedEntity.lng }}
            onCloseClick={() => setSelectedEntity(null)}
          >
            {selectedEntity.type === 'room' ? (
              <div className="flex flex-col -m-2 pb-2 w-48 font-sans">
                 <img src={selectedEntity.image || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'} className="w-full h-24 object-cover" alt={selectedEntity.title} />
                 <div className="px-3 pt-2 font-semibold text-gray-800 leading-tight">{selectedEntity.title || 'Property'}</div>
                 <div className="px-3 pb-1 text-sm text-gray-500">{selectedEntity.location}</div>
                 <div className="px-3 font-bold text-accent">₹{selectedEntity.price?.toLocaleString('en-IN')} <span className="text-xs text-gray-500 font-normal">/ month</span></div>
              </div>
            ) : (
              <div className="px-3 py-2 font-sans">
                 <div className="font-bold text-primary flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-accent" />
                    {selectedEntity.name}
                 </div>
                 <div className="text-xs text-gray-500 mt-1">Nearby Dining Service</div>
              </div>
            )}
          </InfoWindow>
        )}
      </GoogleMap>
    </APIProvider>
  );
}
