import { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  MessageSquare, 
  Loader2, 
  Sparkles, 
  Search, 
  ChevronRight, 
  Hash, 
  Check, 
  X, 
  SlidersHorizontal,
  Zap,
  Moon,
  Sun,
  Flame,
  Heart,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_URL from '../utils/api';

const TraitBadge = ({ icon: Icon, label, color }) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${color} transition-all duration-500 hover:scale-105 cursor-default group`}>
    <Icon className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </div>
);

export default function Roommates() {
  const { token, user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); 

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch(`${API_URL}/api/matchmaking/roommates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setMatches(data);
        } else {
          setError(data.error || 'Failed to fetch matches');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchMatches();
  }, [token]);

  const filteredMatches = matches.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.college.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterMode === 'ALL' || 
                          (filterMode === 'VEG' && m.lifestyle.veg) ||
                          (filterMode === 'SMOKER_FRIENDLY' && !m.lifestyle.smoking);
    return matchesSearch && matchesFilter;
  });

  if (user?.role === 'HOST') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[calc(100vh-80px)] p-8">
        <div className="bg-surface p-12 rounded-[4rem] border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] text-center max-w-lg animate-bloom">
          <div className="w-24 h-24 bg-accent/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-accent/20">
             <ShieldCheck className="w-12 h-12 text-accent" />
          </div>
          <h2 className="text-4xl font-black text-primary tracking-tighter mb-4 leading-none">Host Access Only? Not quite.</h2>
          <p className="text-taupe font-medium mb-10 text-lg">Matchmaking is a sacred student journey. As a host, your mission is to provide the canvas for these connections.</p>
          <Link to="/host" className="inline-block px-12 py-6 bg-primary text-background rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-accent hover:scale-105 transition-all shadow-2xl">
            Return to Command Center
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[calc(100vh-80px)]">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Zap className="w-10 h-10 text-accent animate-pulse" />
          </div>
          <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-accent animate-bounce" />
        </div>
        <div className="mt-12 text-center">
           <p className="text-2xl font-black text-primary tracking-tighter mb-2">Synchronizing Vibes</p>
           <p className="text-taupe font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Running AI Matchmaker Protocol...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Cinematic Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-accent/10 text-accent rounded-full text-[11px] font-black uppercase tracking-[0.3em] mb-10 border border-accent/20 shadow-lg animate-in slide-in-from-left duration-700">
              <Zap className="w-4 h-4 fill-current" />
              Quantum Matching Active
            </div>
            <h1 className="text-7xl md:text-9xl font-black text-primary tracking-tighter leading-[0.85] mb-10 animate-in slide-in-from-left duration-1000 delay-100">
              Living <br />
              <span className="text-accent italic relative">
                Together
                <div className="absolute -bottom-4 left-0 w-full h-4 bg-accent/10 -rotate-2" />
              </span>
            </h1>
            <p className="text-2xl text-taupe font-medium max-w-xl leading-relaxed animate-in slide-in-from-left duration-1000 delay-200">
              We've analyzed millions of data points to find your perfect lifestyle harmony. Discover peers who share your rhythm.
            </p>
          </div>
          
          <div className="flex flex-col gap-6 w-full md:w-auto animate-in slide-in-from-right duration-1000 delay-300">
             <div className="px-10 py-8 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-[3.5rem] flex items-center gap-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center text-accent text-4xl font-black relative z-10 shadow-2xl">
                  {filteredMatches.length}
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-taupe mb-2">Matches Found</p>
                  <p className="text-2xl font-black text-primary">High Accuracy</p>
                </div>
             </div>
          </div>
        </div>

        {/* Action Bar: Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-8 mb-20 animate-in slide-in-from-bottom duration-1000 delay-400">
          <div className="flex-1 relative group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-taupe group-hover:text-accent transition-all duration-500" />
            <input 
              type="text"
              placeholder="Search by name, college, or vibe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-20 pr-10 py-8 bg-surface/50 backdrop-blur-md border border-white/10 rounded-[2.5rem] focus:ring-4 focus:ring-accent/20 outline-none text-primary text-xl font-bold transition-all shadow-2xl hover:shadow-accent/5 placeholder:text-taupe/40"
            />
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[
              { id: 'ALL', label: 'All Vibes', icon: SlidersHorizontal },
              { id: 'VEG', label: 'Vegetarian', icon: Flame },
              { id: 'SMOKER_FRIENDLY', label: 'Clean Air', icon: Moon },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setFilterMode(filter.id)}
                className={`px-10 py-6 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all flex items-center gap-4 border-2 ${
                  filterMode === filter.id 
                  ? 'bg-primary text-background border-primary shadow-2xl shadow-primary/30 scale-105' 
                  : 'bg-surface/50 text-taupe border-white/5 hover:border-accent/30 hover:bg-surface'
                }`}
              >
                <filter.icon className="w-5 h-5" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-10 rounded-[3rem] text-center mb-16 flex items-center justify-center gap-6 animate-bloom">
            <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center text-white font-black">!</div>
            <p className="text-red-500 text-xl font-black">{error}</p>
          </div>
        )}

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredMatches.map((match, index) => (
            <div 
              key={match.id}
              style={{ animationDelay: `${index * 100}ms` }}
              className="group bg-surface/40 backdrop-blur-xl rounded-[4rem] border border-white/10 hover:border-accent/30 transition-all duration-1000 shadow-2xl hover:shadow-[0_80px_120px_-30px_rgba(0,0,0,0.6)] overflow-hidden relative flex flex-col animate-bloom"
            >
              {/* Card Header Gradient */}
              <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              
              <div className="p-12 relative z-10 flex-1 flex flex-col">
                
                {/* Match Score Indicator */}
                <div className="absolute top-12 right-12 text-right">
                   <div className="inline-flex flex-col items-end">
                      <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-1">Harmony Score</p>
                      <h4 className="text-5xl font-black text-primary tracking-tighter leading-none">{match.compatibility}<span className="text-accent">%</span></h4>
                   </div>
                </div>

                <div className="flex flex-col items-start gap-8 mb-12">
                  <div className="relative group/avatar">
                    <div className="w-28 h-28 bg-primary rounded-[3rem] flex items-center justify-center text-background text-4xl font-black shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] transform group-hover/avatar:rotate-12 transition-all duration-700">
                      {match.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent rounded-2xl flex items-center justify-center shadow-2xl border-4 border-surface group-hover/avatar:scale-110 transition-all">
                       <Check className="w-5 h-5 text-background stroke-[4]" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-4xl font-black text-primary tracking-tighter mb-2 group-hover:text-accent transition-colors duration-500">{match.name}</h3>
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full border border-white/5 w-fit">
                       <ShieldCheck className="w-4 h-4 text-accent" />
                       <span className="text-[10px] font-black text-taupe uppercase tracking-widest">{match.college}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-background/40 backdrop-blur-md rounded-[2.5rem] p-8 mb-10 border border-white/5 relative overflow-hidden group/bio">
                   <div className="absolute top-4 right-4 opacity-10">
                      <Heart className="w-8 h-8 text-accent" />
                   </div>
                   <p className="text-primary/70 text-lg font-medium leading-relaxed italic relative z-10 line-clamp-3">
                    "{match.bio}"
                   </p>
                </div>

                {/* Match Strengths Breakdown */}
                {match.insights && match.insights.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-accent/20" />
                       <span className="text-[9px] font-black text-accent uppercase tracking-[0.4em] whitespace-nowrap">Why You Match</span>
                       <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-accent/20" />
                    </div>
                    <div className="flex flex-wrap gap-3">
                       {match.insights.map((insight, idx) => (
                         <div key={idx} className="flex items-center gap-2.5 px-5 py-2.5 bg-accent/5 border border-accent/10 rounded-2xl group/insight hover:bg-accent/10 transition-colors">
                            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{insight}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Vibe Grid */}
                <div className="grid grid-cols-2 gap-4 mb-12">
                   <TraitBadge 
                     icon={Sun} 
                     label={match.lifestyle.study} 
                     color="bg-blue-500/5 text-blue-500 border-blue-500/10" 
                   />
                   <TraitBadge 
                     icon={Moon} 
                     label={match.lifestyle.social} 
                     color="bg-purple-500/5 text-purple-500 border-purple-500/10" 
                   />
                   {match.lifestyle.veg && (
                     <TraitBadge 
                       icon={Flame} 
                       label="Vegetarian" 
                       color="bg-green-500/5 text-green-500 border-green-500/10" 
                     />
                   )}
                   {!match.lifestyle.smoking && (
                     <TraitBadge 
                       icon={ShieldCheck} 
                       label="Non-Smoker" 
                       color="bg-indigo-500/5 text-indigo-500 border-indigo-500/10" 
                     />
                   )}
                </div>

                {/* Actions */}
                <div className="mt-auto pt-10 border-t border-white/5 flex gap-4">
                  <Link 
                    to={`/inbox`} 
                    state={{ userId: match.id }}
                    className="flex-1 group/btn relative overflow-hidden px-8 py-6 bg-primary text-background rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] text-center transition-all shadow-2xl hover:bg-accent hover:scale-105"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                       Connect <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                  </Link>
                  <button className="w-20 h-20 flex items-center justify-center bg-surface border border-white/10 text-primary rounded-[2rem] hover:bg-primary/10 transition-all group/info">
                    <Info className="w-7 h-7 group-hover/info:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredMatches.length === 0 && !isLoading && (
            <div className="col-span-full py-40 text-center animate-bloom">
              <div className="w-32 h-32 bg-surface rounded-[3.5rem] flex items-center justify-center mx-auto mb-12 border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] relative">
                <Search className="w-16 h-16 text-taupe/20" />
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-accent rounded-2xl flex items-center justify-center animate-bounce shadow-xl">
                   <Sparkles className="w-6 h-6 text-background" />
                </div>
              </div>
              <h2 className="text-5xl font-black text-primary tracking-tighter mb-6 leading-tight">No Vibe Matches <br />In This Frequency</h2>
              <p className="text-taupe max-w-xl mx-auto text-xl font-medium leading-relaxed mb-12">We couldn't find anyone matching those exact criteria. Try adjusting your filters to broaden your search.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                 <button 
                   onClick={() => setFilterMode('ALL')}
                   className="px-12 py-6 bg-surface border border-white/10 text-primary rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary/5 transition-all"
                 >
                   Reset Filters
                 </button>
                 <Link to="/profile" className="px-12 py-6 bg-accent text-background rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl shadow-accent/20 flex items-center gap-4">
                   Update Your Vibe <ChevronRight className="w-4 h-4" />
                 </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
