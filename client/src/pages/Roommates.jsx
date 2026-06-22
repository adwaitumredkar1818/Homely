import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Sparkles, 
  Search, 
  MapPin, 
  CheckCircle2, 
  UserPlus, 
  Loader2, 
  GraduationCap, 
  Check, 
  X, 
  Send,
  Coffee,
  Radar as RadarIcon,
  MessageSquare
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import API_URL from '../utils/api';
import VibeQuiz from '../components/VibeQuiz';
import { useNavigate } from 'react-router-dom';

export default function Roommates() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('discover'); // discover, requests
  const [myVibe, setMyVibe] = useState(null);
  const [roommates, setRoommates] = useState([]);
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [selectedRoommate, setSelectedRoommate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingVibe, setIsSavingVibe] = useState(false);
  const [needsQuiz, setNeedsQuiz] = useState(false);
  const [vibeScoreMap, setVibeScoreMap] = useState({});

  const fetchRoommateData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch current user vibe
      const vibeRes = await fetch(`${API_URL}/api/roommates/vibe`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vibeData = await vibeRes.json();
      
      if (!vibeData || !vibeData.college) {
        setNeedsQuiz(true);
        setMyVibe(vibeData || {});
      } else {
        setMyVibe(vibeData);
        setNeedsQuiz(false);

        // 2. Fetch discovered roommates
        const discoverRes = await fetch(`${API_URL}/api/roommates/discover`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const discoverData = await discoverRes.json();
        setRoommates(discoverData);

        // Set default selected roommate for radar chart preview
        if (discoverData.length > 0) {
          setSelectedRoommate(discoverData[0]);
        }
      }

      // 3. Fetch roommate requests
      const reqRes = await fetch(`${API_URL}/api/roommates/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const reqData = await reqRes.json();
      setRequests(reqData);

    } catch (error) {
      console.error('Failed to load roommates data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRoommateData();
    }
  }, [token]);

  const handleSaveVibe = async (formData) => {
    setIsSavingVibe(true);
    try {
      const res = await fetch(`${API_URL}/api/roommates/vibe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await fetchRoommateData();
      }
    } catch (err) {
      console.error('Failed to save vibe details:', err);
    } finally {
      setIsSavingVibe(false);
    }
  };

  const handleSendRequest = async (roommateId) => {
    try {
      const res = await fetch(`${API_URL}/api/roommates/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiverId: roommateId })
      });
      if (res.ok) {
        // Refresh requests
        const reqRes = await fetch(`${API_URL}/api/roommates/requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setRequests(await reqRes.json());
      }
    } catch (err) {
      console.error('Failed to send request:', err);
    }
  };

  const handleRespondRequest = async (requestId, status) => {
    try {
      const res = await fetch(`${API_URL}/api/roommates/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        // Refresh requests & roommates
        await fetchRoommateData();
      }
    } catch (err) {
      console.error('Failed to respond to request:', err);
    }
  };

  // Convert study / social preference into numeric scores for radar charts
  const getVibePoints = (val, type) => {
    if (type === 'study') {
      return val === 'MORNING' ? 100 : val === 'NIGHT' ? 80 : 50;
    }
    if (type === 'social') {
      return val === 'EXTROVERT' ? 100 : val === 'INTROVERT' ? 20 : 60;
    }
    return 50;
  };

  const getRadarData = () => {
    if (!myVibe || !selectedRoommate) return [];
    return [
      { 
        subject: 'Study Habit', 
        You: getVibePoints(myVibe.studyPreference, 'study'), 
        Peer: getVibePoints(selectedRoommate.studyPreference, 'study') 
      },
      { 
        subject: 'Social Battery', 
        You: getVibePoints(myVibe.socialPreference, 'social'), 
        Peer: getVibePoints(selectedRoommate.socialPreference, 'social') 
      },
      { 
        subject: 'Cleanliness', 
        You: (myVibe.cleanlinessLevel || 3) * 20, 
        Peer: (selectedRoommate.cleanlinessLevel || 3) * 20 
      },
      { 
        subject: 'Smoking Diet', 
        You: (myVibe.isSmoking === selectedRoommate.isSmoking ? 100 : 30), 
        Peer: 100 
      },
      { 
        subject: 'Diet Match', 
        You: (myVibe.isVegetarian === selectedRoommate.isVegetarian ? 100 : 40), 
        Peer: 100 
      }
    ];
  };

  const filteredRoommates = roommates.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.college && r.college.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRequestStatus = (peerId) => {
    const sent = requests.sent.find(s => s.receiver?.id === peerId);
    if (sent) return { text: sent.status, isSent: true };
    const rec = requests.received.find(r => r.sender?.id === peerId);
    if (rec) return { text: rec.status, isReceived: true, reqId: rec.id };
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[calc(100vh-80px)]">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-taupe font-bold tracking-[0.2em] uppercase text-xs">Syncing Quantum Roommates...</p>
      </div>
    );
  }

  if (needsQuiz) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="text-center mb-10">
          <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-4xl font-black text-primary tracking-tight">Vibe Profile Required</h2>
          <p className="text-taupe text-sm max-w-md mx-auto mt-2">
            Complete the vibe check quiz first to compare compatibility and discover ideal roommates.
          </p>
        </div>
        <VibeQuiz 
          initialData={myVibe || { college: '', studyPreference: 'NEUTRAL', socialPreference: 'NEUTRAL', cleanlinessLevel: 3, isSmoking: false, isVegetarian: false, bio: '' }}
          onSave={handleSaveVibe}
          isSaving={isSavingVibe}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Hero */}
        <div className="bg-surface rounded-[3rem] p-10 md:p-16 shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -mr-32 -mt-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-wider mb-6 border border-accent/20">
                <Sparkles className="w-3.5 h-3.5" /> Tenant Matchmaker
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-primary tracking-tighter mb-4">
                Roommate <span className="text-accent italic">Compatibility</span>
              </h1>
              <p className="text-taupe max-w-xl font-medium">
                Compare vibe preferences, match habits, and team up with fellow students to book rooms together.
              </p>
            </div>
            
            <div className="flex bg-background/50 p-2 rounded-[2rem] border border-white/10">
              <button 
                onClick={() => setActiveTab('discover')}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'discover' ? 'bg-primary text-background' : 'text-taupe'}`}
              >
                Discover
              </button>
              <button 
                onClick={() => setActiveTab('requests')}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'requests' ? 'bg-primary text-background' : 'text-taupe'}`}
              >
                Requests
                {requests.received.filter(r => r.status === 'PENDING').length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-background rounded-full text-[8px] font-black flex items-center justify-center">
                    {requests.received.filter(r => r.status === 'PENDING').length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'discover' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left side: Discover Roommates */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-taupe" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or college..."
                    className="w-full pl-14 pr-6 py-4 bg-surface border border-white/10 rounded-full focus:ring-2 focus:ring-accent outline-none text-primary font-medium"
                  />
                </div>
                <button 
                  onClick={() => setNeedsQuiz(true)}
                  className="px-6 py-4 bg-surface hover:bg-accent/10 border border-white/10 hover:border-accent/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary hover:text-accent transition-all shrink-0"
                >
                  Retake Quiz
                </button>
              </div>

              {filteredRoommates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredRoommates.map(roommate => {
                    const isSelected = selectedRoommate?.id === roommate.id;
                    const reqState = getRequestStatus(roommate.id);
                    
                    return (
                      <motion.div
                        key={roommate.id}
                        layoutId={`card-${roommate.id}`}
                        onClick={() => setSelectedRoommate(roommate)}
                        className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected 
                          ? 'bg-surface border-accent' 
                          : 'bg-surface border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center font-black text-primary text-lg">
                                {roommate.name.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-bold text-primary">{roommate.name}</h4>
                                  {roommate.isVerified && <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-500/10" />}
                                </div>
                                <p className="text-xs text-taupe font-bold flex items-center gap-1">
                                  <GraduationCap className="w-3.5 h-3.5" /> {roommate.college || 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="px-3 py-1.5 bg-accent/10 text-accent rounded-xl text-[10px] font-black tracking-widest uppercase">
                              {roommate.compatibility}% Vibe
                            </div>
                          </div>

                          <p className="text-xs text-taupe font-medium line-clamp-2">
                            {roommate.bio || 'Hey there! Let\'s team up and find an awesome hostel/mess near college.'}
                          </p>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <span className="px-2.5 py-1 bg-background/50 rounded-lg text-[9px] font-black uppercase text-taupe border border-white/5">
                              {roommate.studyPreference === 'MORNING' ? 'Early Bird' : roommate.studyPreference === 'NIGHT' ? 'Night Owl' : 'Flexible Study'}
                            </span>
                            <span className="px-2.5 py-1 bg-background/50 rounded-lg text-[9px] font-black uppercase text-taupe border border-white/5">
                              {roommate.socialPreference === 'EXTROVERT' ? 'Extrovert' : roommate.socialPreference === 'INTROVERT' ? 'Introvert' : 'Ambivert'}
                            </span>
                            <span className="px-2.5 py-1 bg-background/50 rounded-lg text-[9px] font-black uppercase text-taupe border border-white/5 font-black">
                              Cleanliness: {roommate.cleanlinessLevel}/5
                            </span>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-black text-taupe uppercase tracking-widest">
                            {roommate.isSmoking ? '🚬 Smoking OK' : '🚭 No Smoking'} • {roommate.isVegetarian ? '🥬 Veg Only' : '🍖 Non-Veg'}
                          </span>

                          {reqState ? (
                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                              reqState.text === 'ACCEPTED' 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-primary/5 text-taupe'
                            }`}>
                              {reqState.text === 'ACCEPTED' ? 'Connected' : 'Pending Request'}
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendRequest(roommate.id);
                              }}
                              className="px-4 py-2 bg-primary text-background rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-accent transition-colors flex items-center gap-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Connect
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-surface rounded-[2.5rem] border border-dashed border-white/10">
                  <Users className="w-12 h-12 text-taupe mx-auto mb-4" />
                  <p className="text-taupe font-bold">No matching roommates found.</p>
                </div>
              )}
            </div>

            {/* Right side: Vibe Radar Preview */}
            <div className="space-y-6">
              <div className="bg-surface rounded-[3rem] p-8 border border-white/10 shadow-xl sticky top-8">
                <h3 className="text-xl font-black text-primary tracking-tighter mb-6 flex items-center gap-2">
                  <RadarIcon className="w-5 h-5 text-accent" /> Vibe Radar Match
                </h3>

                {selectedRoommate ? (
                  <div className="space-y-8">
                    <div className="h-64 w-full flex justify-center items-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getRadarData()}>
                          <PolarGrid stroke="#ffffff10" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 9, fontWeight: 900 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                          <Radar name="You" dataKey="You" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                          <Radar name="Peer" dataKey="Peer" stroke="#CCFF00" fill="#CCFF00" fillOpacity={0.2} />
                          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 900 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-4 bg-background/50 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-taupe uppercase tracking-wider">Overall Match</span>
                        <span className="font-black text-accent">{selectedRoommate.compatibility}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="bg-accent h-full rounded-full" style={{ width: `${selectedRoommate.compatibility}%` }} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-black text-taupe uppercase tracking-wider mb-2">Compare Bio</h4>
                        <p className="text-xs text-primary font-medium p-4 bg-background/30 rounded-xl border border-white/5">
                          {selectedRoommate.bio || 'No custom bio provided.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-taupe text-center py-10 font-bold">Select a roommate card to visualize comparison.</p>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* Tab: Requests Dashboard */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Received Requests */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-primary tracking-tighter">Received Invites</h3>
              
              {requests.received.length > 0 ? (
                <div className="space-y-4">
                  {requests.received.map(req => (
                    <div key={req.id} className="p-6 bg-surface rounded-[2rem] border border-white/5 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-primary">{req.sender?.name}</h4>
                        <p className="text-xs text-taupe font-bold flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" /> {req.sender?.college || 'N/A'}
                        </p>
                      </div>
                      
                      {req.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleRespondRequest(req.id, 'ACCEPTED')}
                            className="p-3 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl transition-all"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRespondRequest(req.id, 'DECLINED')}
                            className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                          req.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {req.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-surface rounded-[2rem] border border-dashed border-white/10">
                  <p className="text-taupe font-bold text-sm">No incoming connection requests.</p>
                </div>
              )}
            </div>

            {/* Sent Requests */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-primary tracking-tighter">Sent Invites</h3>
              
              {requests.sent.length > 0 ? (
                <div className="space-y-4">
                  {requests.sent.map(req => (
                    <div key={req.id} className="p-6 bg-surface rounded-[2rem] border border-white/5 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-primary">{req.receiver?.name}</h4>
                        <p className="text-xs text-taupe font-bold flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" /> {req.receiver?.college || 'N/A'}
                        </p>
                      </div>
                      
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        req.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-500' : 'bg-primary/5 text-taupe'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-surface rounded-[2rem] border border-dashed border-white/10">
                  <p className="text-taupe font-bold text-sm">No sent invites yet.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
