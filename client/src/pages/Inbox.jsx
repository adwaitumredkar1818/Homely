import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Search, User, Loader2, MessageSquare, Clock, ShieldCheck, ChevronLeft, Phone, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const { user, token } = useAuth();
  const location = useLocation();
  const socketRef = useRef();
  const messagesEndRef = useRef(null);

  // Initial load
  useEffect(() => {
    const initInbox = async () => {
      await fetchConversations();
      
      const initialUserId = location.state?.userId;
      if (initialUserId) {
        try {
          const res = await fetch(`http://localhost:5000/api/user/${initialUserId}`, {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const otherUser = await res.json();
          if (otherUser && !otherUser.error) {
            // Check if this user is already in our conversations
            // If not, we might want to "virtualize" a conversation entry
            selectConversation(otherUser);
          }
        } catch (err) {
          console.error('Failed to fetch initial user:', err);
        }
      }
    };

    if (user?.id && token) {
      initInbox();
      
      // Socket setup
      socketRef.current = io('http://localhost:5000');
      socketRef.current.emit('join', `user_${user.id}`);
      
      socketRef.current.on('new_message', (message) => {
        // We'll handle message updates in a separate effect that has access to the latest selectedUser
        fetchConversations();
      });

      return () => {
        if (socketRef.current) socketRef.current.disconnect();
      };
    }
  }, [user?.id, token]); // Only run on mount or when user/token changes

  // Handle incoming messages for real-time update in current chat
  useEffect(() => {
    if (!socketRef.current) return;

    const handleNewMessage = (message) => {
      if (selectedUser && (message.senderId === selectedUser.id || message.receiverId === selectedUser.id)) {
        setMessages(prev => {
          // Prevent duplicates (e.g. if we sent it and also received it via socket)
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    socketRef.current.off('new_message');
    socketRef.current.on('new_message', handleNewMessage);
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/messages/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    setMsgLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/messages/${otherUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setMsgLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const content = newMessage;
    setNewMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        fetchConversations(); // Refresh sidebar to show last message
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectConversation = (otherUser) => {
    setSelectedUser(otherUser);
    fetchMessages(otherUser.id);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full">
      <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
      <p className="text-taupe font-bold">Loading your messages...</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-160px)] flex bg-white rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Sidebar: Conversations List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-gray-50/30 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-10">
           <h2 className="text-2xl font-black text-primary mb-6">Inbox</h2>
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-taupe group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-accent/10 focus:border-accent/30 outline-none transition-all"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
           {/* If we have a selectedUser who is NOT in the conversation list, show them at the top */}
           {selectedUser && !conversations.find(c => c.user.id === selectedUser.id) && (
              <button 
                onClick={() => selectConversation(selectedUser)}
                className="w-full p-4 rounded-2xl flex gap-4 transition-all duration-300 relative group bg-primary text-white shadow-xl shadow-primary/20 ring-1 ring-white/10"
              >
                 <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0 border border-white/20">
                    <span className="text-lg font-black text-white">{selectedUser.name.charAt(0)}</span>
                 </div>
                 <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-start mb-1">
                       <p className="font-bold truncate pr-2">{selectedUser.name}</p>
                       <span className="text-[10px] font-bold shrink-0 text-white/60">Now</span>
                    </div>
                    <p className="text-xs truncate font-medium text-white/80 italic">Start a new conversation...</p>
                 </div>
              </button>
           )}

           {conversations.length > 0 ? conversations.map((conv) => (
             <button 
               key={conv.user.id}
               onClick={() => selectConversation(conv.user)}
               className={`w-full p-4 rounded-2xl flex gap-4 transition-all duration-300 relative group ${selectedUser?.id === conv.user.id ? 'bg-primary text-white shadow-xl shadow-primary/20 ring-1 ring-white/10' : 'hover:bg-white hover:shadow-lg hover:shadow-gray-200/50'}`}
             >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0 border border-white/20">
                   <span className={`text-lg font-black ${selectedUser?.id === conv.user.id ? 'text-white' : 'text-accent'}`}>{conv.user.name.charAt(0)}</span>
                </div>
                <div className="flex-1 text-left min-w-0">
                   <div className="flex justify-between items-start mb-1">
                      <p className="font-bold truncate pr-2">{conv.user.name}</p>
                      <span className={`text-[10px] font-bold shrink-0 ${selectedUser?.id === conv.user.id ? 'text-white/60' : 'text-taupe'}`}>
                         {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </div>
                   <p className={`text-xs truncate font-medium ${selectedUser?.id === conv.user.id ? 'text-white/80' : 'text-taupe'}`}>
                      {conv.lastMessage.content}
                   </p>
                </div>
                {selectedUser?.id === conv.user.id && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-l-full" />
                )}
             </button>
           )) : !selectedUser && (
             <div className="text-center py-12 px-6">
                <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-sm font-bold text-taupe">No conversations yet.</p>
             </div>
           )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={`flex-1 flex flex-col bg-white ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
         {selectedUser ? (
           <>
             {/* Chat Header */}
             <div className="h-20 px-8 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                   <button onClick={() => setSelectedUser(null)} className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <ChevronLeft className="w-6 h-6 text-primary" />
                   </button>
                   <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-md">
                      {selectedUser.name.charAt(0)}
                   </div>
                   <div>
                      <h3 className="font-black text-primary text-lg leading-tight">{selectedUser.name}</h3>
                      <div className="flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                         <p className="text-[10px] font-bold text-taupe uppercase tracking-widest">{selectedUser.role} · Active Now</p>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <button className="p-2.5 text-taupe hover:text-accent hover:bg-accent/5 rounded-xl transition-all"><Phone className="w-5 h-5" /></button>
                   <button className="p-2.5 text-taupe hover:text-accent hover:bg-accent/5 rounded-xl transition-all"><Search className="w-5 h-5" /></button>
                   <button className="p-2.5 text-taupe hover:text-accent hover:bg-accent/5 rounded-xl transition-all"><MoreVertical className="w-5 h-5" /></button>
                </div>
             </div>

             {/* Messages Area */}
             <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/20">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-full">
                     <Loader2 className="w-8 h-8 text-accent animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="text-center py-8">
                       <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-100 rounded-full text-[10px] font-black text-taupe uppercase tracking-wider shadow-sm">
                          <Clock className="w-3 h-3" /> Chat encryption active
                       </div>
                    </div>
                    {messages.length > 0 ? messages.map((msg, idx) => {
                      const isMe = msg.senderId === user.id;
                      return (
                        <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                           <div className={`max-w-[75%] sm:max-w-[60%] p-5 rounded-3xl text-sm font-medium shadow-lg relative ${isMe ? 'bg-primary text-white rounded-br-none shadow-primary/20' : 'bg-white text-primary border border-gray-100 rounded-bl-none shadow-gray-200/30'}`}>
                              {msg.content}
                              <p className={`text-[10px] mt-2 font-bold opacity-50 ${isMe ? 'text-white text-right' : 'text-taupe'}`}>
                                 {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                           </div>
                        </div>
                      );
                    }) : (
                      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-accent/5 rounded-2xl flex items-center justify-center mb-4">
                           <MessageSquare className="w-8 h-8 text-accent/30" />
                        </div>
                        <h4 className="text-lg font-bold text-primary">Start of something new</h4>
                        <p className="text-xs text-taupe max-w-[200px] mx-auto">Send your first message to {selectedUser.name} to begin your conversation.</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
             </div>

             {/* Input Area */}
             <div className="p-6 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex gap-4 p-2 bg-gray-50 rounded-[2rem] border border-gray-100 focus-within:border-accent/30 focus-within:ring-4 focus-within:ring-accent/5 transition-all">
                   <input 
                     type="text" 
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                     placeholder="Type your message here..." 
                     className="flex-1 bg-transparent px-4 py-3 outline-none text-sm font-medium text-primary"
                   />
                   <button 
                     disabled={!newMessage.trim()}
                     className="p-3 bg-primary text-white rounded-full hover:bg-accent transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95"
                   >
                      <Send className="w-5 h-5" />
                   </button>
                </form>
             </div>
           </>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50/10">
              <div className="w-24 h-24 bg-accent/5 rounded-full flex items-center justify-center mb-8 relative">
                 <MessageSquare className="w-12 h-12 text-accent/20" />
                 <div className="absolute top-0 right-0 w-6 h-6 bg-accent border-4 border-white rounded-full animate-pulse" />
              </div>
              <h3 className="text-3xl font-black text-primary mb-4 tracking-tight">Your Communication Hub</h3>
              <p className="text-taupe font-medium max-w-sm mx-auto leading-relaxed">
                 Select a tenant or property owner from the list on the left to start coordinating bookings and inquiries.
              </p>
              <div className="mt-12 flex items-center gap-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <span className="text-[10px] font-black text-taupe uppercase tracking-widest">End-to-End Encrypted</span>
                 </div>
                 <div className="w-px h-4 bg-gray-200" />
                 <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    <span className="text-[10px] font-black text-taupe uppercase tracking-widest">Real-time Responses</span>
                 </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
}
