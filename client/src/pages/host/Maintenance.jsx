import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, Clock, Wrench, XCircle } from 'lucide-react';
import API_URL from '../../utils/api';

export default function Maintenance() {
  const { token } = useAuth();
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [token]);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/maintenance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTickets(data);
      
      // Auto-select ticket if highlighted from state
      if (location.state?.highlightId) {
        const ticketToHighlight = data.find(t => t.id === location.state.highlightId);
        if (ticketToHighlight) {
          setSelectedTicket(ticketToHighlight);
          setStatus(ticketToHighlight.status);
          setResponse(ticketToHighlight.hostResponse || '');
        }
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/maintenance/${selectedTicket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, hostResponse: response })
      });
      
      if (res.ok) {
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (error) {
      console.error('Failed to update ticket:', error);
    } finally {
      setUpdating(false);
    }
  };

  const openTicket = (ticket) => {
    setSelectedTicket(ticket);
    setResponse(ticket.hostResponse || '');
    setStatus(ticket.status);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
        <p className="text-taupe font-bold">Loading maintenance requests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-4 sm:p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight mb-2">Service Desk</h1>
          <p className="text-taupe font-bold flex items-center gap-2">
             <Wrench className="w-4 h-4 text-accent" />
             Resolving infrastructure issues and maintaining quality of life.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden group">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-primary/5">
          <h3 className="text-2xl font-black text-primary flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-accent" /> Active Tickets
          </h3>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-taupe px-3 py-1 bg-background rounded-full border border-white/5">
                {tickets.length} Total
             </span>
          </div>
        </div>

        <div className="p-10">
          {tickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tickets.map((ticket, idx) => (
                <div 
                  key={ticket.id} 
                  onClick={() => openTicket(ticket)}
                  className="bg-surface rounded-3xl border border-white/10 p-8 shadow-sm hover:shadow-2xl cursor-pointer transition-all hover:border-accent/20 group/card relative overflow-hidden flex flex-col"
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      ticket.priority === 'HIGH' ? 'bg-red-500/10 text-red-500' : 
                      ticket.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                    }`}>
                      {ticket.priority} Priority
                    </span>
                    <div className={`p-2 rounded-lg ${
                      ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500' : 
                      ticket.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {ticket.status === 'RESOLVED' ? <CheckCircle2 className="w-4 h-4" /> : 
                       ticket.status === 'IN_PROGRESS' ? <Clock className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                  </div>

                  <h4 className="text-xl font-black text-primary mb-3 group-hover/card:text-accent transition-colors line-clamp-1">{ticket.title}</h4>
                  <p className="text-sm text-taupe font-medium line-clamp-3 mb-8 opacity-70">{ticket.description}</p>
                  
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-taupe/60 border-t border-white/5 pt-6 mt-auto">
                     <span className="truncate max-w-[120px]">{ticket.room?.title || 'Unknown Property'}</span>
                     <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-50" /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="absolute bottom-0 left-0 h-1 bg-accent w-0 group-hover/card:w-full transition-all duration-700" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
                <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8">
                   <Wrench className="w-10 h-10 text-taupe/20" />
                </div>
                <h3 className="text-3xl font-black text-primary mb-3">Clear Skies</h3>
                <p className="text-taupe font-bold">No active maintenance requests found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-surface rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 border border-white/10">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-primary/5">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">Ticket Reference</p>
                    <h2 className="text-2xl font-black text-primary">#ST-{selectedTicket.id.substring(0, 8)}</h2>
                 </div>
                 <button onClick={() => setSelectedTicket(null)} className="w-12 h-12 flex items-center justify-center bg-background rounded-2xl text-taupe hover:text-primary transition-colors border border-white/5">
                    <XCircle className="w-6 h-6" />
                 </button>
              </div>
              
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                 <div>
                    <h3 className="text-2xl font-black text-primary mb-3">{selectedTicket.title}</h3>
                    <p className="text-base text-taupe leading-relaxed font-medium">{selectedTicket.description}</p>
                 </div>

                 {selectedTicket.imageUrl && (
                    <div className="rounded-[2rem] overflow-hidden border border-white/10 shadow-lg">
                       <img src={selectedTicket.imageUrl} alt="Issue" className="w-full h-auto" />
                    </div>
                 )}

                 <div className="p-6 bg-primary/5 rounded-3xl border border-white/5 flex flex-wrap items-center justify-between gap-6">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-taupe uppercase tracking-widest opacity-60">Reported By</p>
                       <p className="font-black text-primary">{selectedTicket.tenant?.name || 'Anonymous'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-taupe uppercase tracking-widest opacity-60">Property</p>
                       <p className="font-black text-primary truncate max-w-[200px]">{selectedTicket.room?.title || 'Main Complex'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-taupe uppercase tracking-widest opacity-60">Report Date</p>
                       <p className="font-black text-primary">{new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                    </div>
                 </div>

                 <form onSubmit={handleUpdate} className="space-y-6 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-xs font-black text-taupe uppercase tracking-widest ml-1">Status Update</label>
                          <select 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full p-4 bg-background border border-white/10 rounded-2xl font-bold focus:ring-4 focus:ring-accent/5 outline-none text-primary"
                          >
                            <option value="PENDING">Pending Approval</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-black text-taupe uppercase tracking-widest ml-1">Priority Confirmation</label>
                          <div className={`p-4 bg-background border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 ${
                             selectedTicket.priority === 'HIGH' ? 'text-red-500' : 'text-primary'
                          }`}>
                             <AlertCircle className="w-4 h-4" /> {selectedTicket.priority}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-xs font-black text-taupe uppercase tracking-widest ml-1">Internal Notes / Response</label>
                       <textarea 
                         className="w-full p-6 bg-background border border-white/10 rounded-3xl min-h-[120px] font-medium focus:ring-4 focus:ring-accent/5 outline-none text-primary placeholder:opacity-50"
                         placeholder="Detail the actions taken or provide a response to the tenant..."
                         value={response}
                         onChange={(e) => setResponse(e.target.value)}
                       />
                    </div>

                    <div className="flex gap-4">
                       <button 
                         type="button"
                         onClick={() => setSelectedTicket(null)}
                         className="flex-1 py-4 bg-surface border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-primary hover:bg-white/5 transition-all"
                       >
                          Discard
                       </button>
                       <button 
                         type="submit" 
                         disabled={updating}
                         className="flex-[2] py-4 bg-primary text-background rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                       >
                          {updating ? 'Synchronizing...' : 'Commit Changes'}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
