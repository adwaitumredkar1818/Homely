import { useState, useEffect } from 'react';
import { 
  Megaphone, 
  ShoppingBag, 
  BookOpen, 
  Calendar, 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  MoreHorizontal,
  Image as ImageIcon,
  Send,
  MessageCircle,
  Heart,
  Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../utils/api';

export default function CampusPulse() {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isPosting, setIsPosting] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'GENERAL', imageUrl: '' });

  const categories = [
    { id: 'ALL', label: 'All Updates', icon: Sparkles },
    { id: 'MARKETPLACE', label: 'Marketplace', icon: ShoppingBag },
    { id: 'EVENT', label: 'Events', icon: Calendar },
    { id: 'STUDY_GROUP', label: 'Study Hub', icon: BookOpen },
    { id: 'LOST_FOUND', label: 'Lost & Found', icon: Search }
  ];

  useEffect(() => {
    fetchPosts();
  }, [token]);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bulletin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPosts(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setIsPosting(true);
    try {
      const res = await fetch(`${API_URL}/api/bulletin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPost)
      });
      if (res.ok) {
        setNewPost({ title: '', content: '', category: 'GENERAL', imageUrl: '' });
        fetchPosts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const filteredPosts = activeCategory === 'ALL' 
    ? posts 
    : posts.filter(p => p.category === activeCategory);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[calc(100vh-80px)]">
      <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center animate-pulse border border-white/5 shadow-2xl">
         <Megaphone className="w-10 h-10 text-accent animate-bounce" />
      </div>
      <p className="mt-8 text-taupe font-black uppercase tracking-[0.4em] animate-pulse">Scanning Campus Waves...</p>
    </div>
  );

  return (
    <div className="flex-1 bg-background min-h-[calc(100vh-80px)] overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        
        {/* Cinematic Social Header */}
        <div className="mb-16 text-center">
           <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-accent/10 text-accent rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-6 border border-accent/20">
              <Sparkles className="w-4 h-4" /> Campus Network Active
           </div>
           <h1 className="text-6xl md:text-7xl font-black text-primary tracking-tighter mb-6">Campus <span className="text-accent italic">Pulse</span></h1>
           <p className="text-xl text-taupe font-medium max-w-2xl mx-auto leading-relaxed">
             The heartbeat of your student community. Trade books, organize hackathons, and discover local student-approved gems.
           </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
           
           {/* Left Column: Feed & Creation */}
           <div className="flex-1 space-y-12">
              
              {/* Quick Post Box */}
              <div className="bg-surface border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-background font-black text-xl">
                       {user?.name?.charAt(0) || '?'}
                    </div>
                    <p className="text-primary font-bold">What's happening on campus, {user?.name?.split(' ')[0] || 'Student'}?</p>
                 </div>
                 
                 <form onSubmit={handleCreatePost} className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Catchy Headline..."
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                      required
                      className="w-full bg-background border border-white/5 rounded-2xl px-6 py-4 text-primary outline-none focus:ring-2 focus:ring-accent/30 font-bold"
                    />
                    <textarea 
                      placeholder="Share the details..."
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                      required
                      className="w-full bg-background border border-white/5 rounded-2xl px-6 py-4 text-primary outline-none focus:ring-2 focus:ring-accent/30 min-h-[120px]"
                    />
                    
                    <div className="flex flex-col md:flex-row gap-4">
                       <select 
                         value={newPost.category}
                         onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                         className="bg-background border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-taupe outline-none"
                       >
                          <option value="GENERAL">General</option>
                          <option value="MARKETPLACE">Marketplace</option>
                          <option value="EVENT">Event</option>
                          <option value="STUDY_GROUP">Study Hub</option>
                          <option value="LOST_FOUND">Lost & Found</option>
                       </select>
                       <div className="flex-1 relative">
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-taupe" />
                          <input 
                            type="text" 
                            placeholder="Image URL (optional)"
                            value={newPost.imageUrl}
                            onChange={(e) => setNewPost({...newPost, imageUrl: e.target.value})}
                            className="w-full bg-background border border-white/5 rounded-xl pl-12 pr-4 py-2 text-xs text-primary outline-none"
                          />
                       </div>
                       <button 
                         type="submit" 
                         disabled={isPosting}
                         className="bg-primary text-background px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all flex items-center gap-2 shadow-lg"
                       >
                          {isPosting ? 'Broadcasting...' : <><Send className="w-3.5 h-3.5" /> Broadcast</>}
                       </button>
                    </div>
                 </form>
              </div>

              {/* Feed Filter */}
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                 {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border transition-all whitespace-nowrap ${
                        activeCategory === cat.id 
                        ? 'bg-accent text-background border-accent shadow-xl shadow-accent/20' 
                        : 'bg-surface text-taupe border-white/5 hover:border-accent/30'
                      }`}
                    >
                       <cat.icon className="w-4 h-4" /> {cat.label}
                    </button>
                 ))}
              </div>

              {/* Feed Items */}
              <div className="space-y-8">
                 {filteredPosts.map((post) => (
                    <div key={post.id} className="bg-surface border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl group">
                       {post.imageUrl && (
                          <div className="h-[350px] overflow-hidden relative">
                             <img 
                               src={post.imageUrl} 
                               onError={(e) => e.target.style.display = 'none'} 
                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                               alt="Post" 
                             />
                             <div className="absolute top-6 left-6 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-white/10">
                                {post.category}
                             </div>
                          </div>
                       )}
                       <div className="p-10">
                          <div className="flex justify-between items-start mb-6">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center font-black text-accent text-lg border border-white/5">
                                   {post.user.name.charAt(0)}
                                </div>
                                <div>
                                   <p className="font-black text-primary tracking-tight text-xl mb-1">{post.title}</p>
                                   <p className="text-[10px] font-black text-taupe uppercase tracking-widest flex items-center gap-2">
                                      {post.user.name} <span className="opacity-30">•</span> {new Date(post.createdAt).toLocaleDateString()}
                                   </p>
                                </div>
                             </div>
                             <button className="text-taupe hover:text-primary transition-colors">
                                <MoreHorizontal className="w-6 h-6" />
                             </button>
                          </div>
                          <p className="text-primary/80 font-medium leading-relaxed text-lg mb-8">
                             {post.content}
                          </p>
                          <div className="flex items-center justify-between pt-8 border-t border-white/5">
                             <div className="flex items-center gap-8">
                                <button className="flex items-center gap-2 text-taupe hover:text-red-500 transition-colors group/btn">
                                   <Heart className="w-5 h-5 group-hover/btn:fill-current" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Appreciate</span>
                                </button>
                                <button className="flex items-center gap-2 text-taupe hover:text-accent transition-colors">
                                   <MessageCircle className="w-5 h-5" />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Connect</span>
                                </button>
                             </div>
                             <button className="text-taupe hover:text-primary transition-colors">
                                <Share2 className="w-5 h-5" />
                             </button>
                          </div>
                       </div>
                    </div>
                 ))}
                 {filteredPosts.length === 0 && (
                    <div className="py-32 text-center bg-surface border border-dashed border-white/10 rounded-[3rem]">
                       <Megaphone className="w-16 h-16 text-taupe/20 mx-auto mb-6" />
                       <p className="text-taupe font-black uppercase tracking-[0.3em] text-xs">The campus is quiet... start a ripple!</p>
                    </div>
                 )}
              </div>
           </div>

           {/* Right Column: Community Highlights */}
           <div className="lg:w-[400px] space-y-12">
              
              {/* Discovery Card */}
              <div className="bg-accent/10 border border-accent/20 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                    <MapPin className="w-32 h-32 text-accent" />
                 </div>
                 <h3 className="text-xl font-black text-primary tracking-tight mb-8 relative z-10">Student Gems</h3>
                 <div className="space-y-6 relative z-10">
                    {[
                      { name: 'Late Night Maggi Point', desc: 'Best place for 2 AM hunger strikes. Try the Peri-Peri Maggi.', dist: '0.4 km' },
                      { name: 'Xerox & Prints Hub', desc: 'Fastest service, special student discounts on bulk notes.', dist: '0.2 km' },
                      { name: 'Campus Park', desc: 'Quiet spot for meditation or outdoor group study.', dist: '1.2 km' }
                    ].map((gem, i) => (
                       <div key={i} className="bg-surface/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 group/item hover:bg-surface transition-all cursor-pointer">
                          <div className="flex justify-between items-start mb-2">
                             <p className="font-bold text-primary group-hover/item:text-accent transition-colors">{gem.name}</p>
                             <span className="text-[9px] font-black text-accent">{gem.dist}</span>
                          </div>
                          <p className="text-xs text-taupe leading-relaxed">{gem.desc}</p>
                       </div>
                    ))}
                 </div>
                 <button className="w-full mt-10 py-4 bg-primary text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all">
                    Recommend a Spot
                 </button>
              </div>

              {/* Trending Topics */}
              <div className="bg-surface border border-white/5 p-10 rounded-[3rem] shadow-2xl">
                 <h3 className="text-xl font-black text-primary tracking-tight mb-8">Trending Campus Vibes</h3>
                 <div className="flex flex-wrap gap-3">
                    {['#ExamSzn', '#Hackathon24', '#HostelLife', '#LateNightStudying', '#FoodieCampus'].map(tag => (
                       <span key={tag} className="px-4 py-2 bg-background border border-white/5 rounded-full text-[10px] font-black text-taupe hover:text-accent hover:border-accent/30 cursor-pointer transition-all">
                          {tag}
                       </span>
                    ))}
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
