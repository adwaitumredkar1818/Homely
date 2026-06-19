import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, 
  Calendar, 
  MapPin, 
  Plus, 
  MessageSquare, 
  Users, 
  Zap, 
  Clock, 
  ChevronRight, 
  Search,
  Sparkles,
  Info,
  Trophy,
  Coffee,
  BookOpen,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../utils/api';

export default function Hub() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, noticesRes] = await Promise.all([
          fetch(`${API_URL}/api/hub/events`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/hub/notices`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (eventsRes.ok) setEvents(await eventsRes.json());
        if (noticesRes.ok) setNotices(await noticesRes.json());
      } catch (error) {
        console.error('Failed to fetch hub data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchData();
  }, [token]);

  const handleRSVP = async (eventId) => {
    try {
      const res = await fetch(`${API_URL}/api/hub/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Refresh events
        const updatedRes = await fetch(`${API_URL}/api/hub/events`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (updatedRes.ok) setEvents(await updatedRes.json());
      }
    } catch (error) {
      console.error('RSVP failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[calc(100vh-80px)]">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-taupe font-black uppercase tracking-[0.4em] text-[10px]">Loading Your Ecosystem...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Hub Header */}
        <div className="bg-surface rounded-[3rem] p-10 md:p-16 shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[150px] -mr-64 -mt-64 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -ml-48 -mb-48" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="max-w-2xl">
               <div className="inline-flex items-center gap-3 px-4 py-2 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-widest border border-accent/20 mb-6">
                 <Sparkles className="w-4 h-4" /> The Quantum Hub
               </div>
               <h1 className="text-6xl md:text-7xl font-black text-primary tracking-tighter mb-6">
                 Your Living <span className="text-accent italic">Ecosystem</span>
               </h1>
               <p className="text-lg text-taupe font-medium max-w-xl">
                 Connect with your neighbors, discover local events, and stay updated with everything happening in your vicinity.
               </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
               <div className="p-8 bg-background/50 backdrop-blur-xl rounded-[2.5rem] border border-white/10 text-center">
                 <p className="text-4xl font-black text-primary">12</p>
                 <p className="text-[10px] font-black text-taupe uppercase tracking-widest mt-1">Live Events</p>
               </div>
               <div className="p-8 bg-background/50 backdrop-blur-xl rounded-[2.5rem] border border-white/10 text-center">
                 <p className="text-4xl font-black text-accent">85</p>
                 <p className="text-[10px] font-black text-taupe uppercase tracking-widest mt-1">Members Near</p>
               </div>
            </div>
          </div>
        </div>

        {/* Navigation & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex bg-surface p-2 rounded-[2rem] border border-white/10 w-full md:w-auto">
              <button 
                onClick={() => setActiveTab('events')}
                className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'events' ? 'bg-primary text-background shadow-lg' : 'text-taupe hover:text-primary'}`}
              >
                Events
              </button>
              <button 
                onClick={() => setActiveTab('board')}
                className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'board' ? 'bg-primary text-background shadow-lg' : 'text-taupe hover:text-primary'}`}
              >
                Notice Board
              </button>
           </div>

           <div className="relative w-full md:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
              <input 
                type="text" 
                placeholder="Search events or news..."
                className="w-full pl-14 pr-6 py-5 bg-surface border border-white/10 rounded-full focus:ring-2 focus:ring-accent outline-none text-primary font-bold"
              />
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           {/* Left/Main Column */}
           <div className="lg:col-span-2 space-y-8">
              {activeTab === 'events' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {events.map((event, idx) => (
                     <motion.div 
                       key={event.id}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.1 }}
                       className="group bg-surface rounded-[3rem] overflow-hidden border border-white/10 hover:border-accent/30 transition-all shadow-xl"
                     >
                       <div className="h-48 bg-primary/5 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent z-10" />
                          <div className="absolute top-6 left-6 z-20 flex gap-2">
                             <span className="px-3 py-1 bg-accent text-background text-[9px] font-black uppercase tracking-widest rounded-lg">
                               {event.category}
                             </span>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:scale-110 transition-transform duration-700">
                             {event.category === 'STUDY' ? <BookOpen className="w-32 h-32 text-primary" /> : <Trophy className="w-32 h-32 text-primary" />}
                          </div>
                       </div>
                       
                       <div className="p-8 -mt-12 relative z-20">
                          <h3 className="text-2xl font-black text-primary tracking-tighter mb-2 group-hover:text-accent transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-taupe text-sm font-medium mb-6 line-clamp-2">
                            {event.desc}
                          </p>
                          
                          <div className="space-y-3 mb-8">
                             <div className="flex items-center gap-3 text-[10px] font-black text-taupe uppercase tracking-widest">
                                <Calendar className="w-4 h-4 text-accent" /> {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                             </div>
                             <div className="flex items-center gap-3 text-[10px] font-black text-taupe uppercase tracking-widest">
                                <MapPin className="w-4 h-4 text-accent" /> {event.location}
                             </div>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-white/5">
                             <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                   {event.attendees.slice(0, 3).map((attendee, i) => (
                                     <div key={attendee.id} className="w-6 h-6 rounded-full bg-primary/20 border-2 border-surface flex items-center justify-center text-[8px] font-black text-primary">
                                       {attendee.name.charAt(0)}
                                     </div>
                                   ))}
                                </div>
                                <p className="text-[9px] font-black text-taupe uppercase tracking-widest">
                                  {event.attendees.length} attending
                                </p>
                             </div>
                             <button 
                               onClick={() => handleRSVP(event.id)}
                               disabled={event.attendees.some(a => a.id === user.id)}
                               className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                 event.attendees.some(a => a.id === user.id) 
                                 ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default' 
                                 : 'bg-primary/5 text-primary hover:bg-primary hover:text-background'
                               }`}
                             >
                                {event.attendees.some(a => a.id === user.id) ? 'RSVP Confirmed' : 'RSVP Now'}
                             </button>
                          </div>
                       </div>
                     </motion.div>
                   ))}

                   <button className="border-2 border-dashed border-white/10 rounded-[3rem] p-12 flex flex-col items-center justify-center gap-4 hover:border-accent/30 hover:bg-accent/5 transition-all group">
                      <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center group-hover:bg-accent group-hover:text-background transition-all">
                         <Plus className="w-8 h-8" />
                      </div>
                      <p className="text-[10px] font-black text-taupe uppercase tracking-[0.3em]">Host an Event</p>
                   </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                   {notices.map((notice, idx) => (
                     <motion.div 
                       key={notice.id}
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: idx * 0.1 }}
                       className="p-8 bg-surface rounded-[2.5rem] border border-white/10 flex items-start gap-6 group hover:bg-primary/5 transition-all"
                     >
                       <div className={`p-4 rounded-2xl ${
                         notice.type === 'UPDATE' ? 'bg-green-500/10 text-green-500' : 
                         notice.type === 'ALERT' ? 'bg-red-500/10 text-red-500' : 'bg-accent/10 text-accent'
                       }`}>
                          {notice.type === 'UPDATE' ? <Zap className="w-6 h-6" /> : <Megaphone className="w-6 h-6" />}
                       </div>
                       <div className="flex-1">
                          <p className="text-lg font-bold text-primary mb-1">{notice.content}</p>
                          <div className="flex items-center gap-4">
                             <span className="text-[10px] font-black text-taupe uppercase tracking-widest flex items-center gap-1.5">
                                <Clock className="w-3 h-3" /> {new Date(notice.createdAt).toLocaleDateString() === new Date().toLocaleDateString() ? 'Today' : 'Recently'}
                             </span>
                             <span className="text-[10px] font-black text-taupe uppercase tracking-widest">• {notice.type}</span>
                             <span className="text-[10px] font-black text-accent uppercase tracking-widest ml-auto">{notice.author?.name}</span>
                          </div>
                       </div>
                       <button className="opacity-0 group-hover:opacity-100 p-2 text-taupe hover:text-primary transition-all">
                          <ChevronRight className="w-6 h-6" />
                       </button>
                     </motion.div>
                   ))}
                </div>
              )}
           </div>

           {/* Sidebar */}
           <div className="space-y-8">
              <div className="bg-surface rounded-[2.5rem] p-8 border border-white/10 shadow-xl">
                 <h3 className="text-xl font-black text-primary tracking-tighter mb-6 flex items-center gap-3">
                    <Users className="w-5 h-5 text-accent" /> Active Neighbors
                 </h3>
                 <div className="space-y-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-primary/5 transition-all cursor-pointer">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary">
                               {i === 1 ? 'JD' : i === 2 ? 'AS' : i === 3 ? 'MK' : 'RK'}
                            </div>
                            <div>
                               <p className="text-xs font-black text-primary">User {i}</p>
                               <p className="text-[9px] font-black text-taupe uppercase tracking-widest">Active 5m ago</p>
                            </div>
                         </div>
                         <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    ))}
                 </div>
                 <button className="w-full mt-6 py-4 bg-primary/5 text-primary rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-background transition-all">
                    View Community
                 </button>
              </div>

              <div className="bg-accent rounded-[2.5rem] p-8 border border-white/10 shadow-xl text-background relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Coffee className="w-20 h-20" />
                 </div>
                 <h3 className="text-xl font-black tracking-tighter mb-2 relative z-10">Hostel Perks</h3>
                 <p className="text-xs font-medium opacity-80 mb-6 relative z-10">Show your student ID at "Cafe Central" for 20% off!</p>
                 <button className="px-6 py-3 bg-background text-primary rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all relative z-10">
                    Get Coupon
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
