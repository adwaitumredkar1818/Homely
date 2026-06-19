import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, Clock, Wrench } from 'lucide-react';

export default function Maintenance() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [token]);

  async function fetchTickets() {
    try {
      const res = await fetch('http://localhost:5000/api/maintenance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await fetch(`http://localhost:5000/api/maintenance/${selectedTicket.id}`, {
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 sm:p-6 lg:p-8">
      <div className="bg-surface rounded-[2.5rem] border border-border shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-border flex justify-between items-center bg-background/30">
          <h3 className="text-xl font-black text-primary flex items-center gap-2">
            <Wrench className="w-6 h-6 text-accent" />
            Maintenance Tickets
          </h3>
        </div>

        <div className="p-8">
          {tickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  onClick={() => openTicket(ticket)}
                  className="bg-surface rounded-2xl border border-border p-6 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-primary/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      ticket.priority === 'HIGH' ? 'bg-red-500/10 text-red-500' : 
                      ticket.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {ticket.priority} PRIORITY
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${
                      ticket.status === 'RESOLVED' ? 'text-green-500' : 
                      ticket.status === 'IN_PROGRESS' ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {ticket.status === 'RESOLVED' ? <CheckCircle2 className="w-3 h-3" /> : 
                       ticket.status === 'IN_PROGRESS' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {ticket.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-primary mb-2 line-clamp-1">{ticket.title}</h4>
                  <p className="text-sm text-taupe line-clamp-2 mb-4">{ticket.description}</p>
                  
                  <div className="flex justify-between items-center text-xs text-taupe font-medium border-t border-border pt-4 mt-auto">
                     <span>{ticket.room?.title || 'Unknown Property'}</span>
                     <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
                <Wrench className="w-16 h-16 text-taupe/40 mx-auto mb-6" />
                <div className="text-taupe font-bold text-lg">No maintenance requests.</div>
                <p className="text-taupe/60 text-sm mt-1">Everything is running smoothly!</p>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-surface rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
              <div className="p-6 border-b border-border flex justify-between items-center">
                 <h2 className="text-xl font-black text-primary">Ticket #{selectedTicket.id}</h2>
                 <button onClick={() => setSelectedTicket(null)} className="text-taupe hover:text-primary p-2">✕</button>
              </div>
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                 <div>
                    <h3 className="font-bold text-primary text-lg mb-1">{selectedTicket.title}</h3>
                    <p className="text-sm text-taupe mb-4">{selectedTicket.description}</p>
                    {selectedTicket.imageUrl && (
                      <img src={selectedTicket.imageUrl} alt="Issue" className="w-full h-48 object-cover rounded-xl mb-4" />
                    )}
                 </div>

                 <div className="bg-background/50 p-4 rounded-xl text-sm border border-border space-y-2">
                    <p><span className="font-bold text-primary">Property:</span> {selectedTicket.room?.title}</p>
                    <p><span className="font-bold text-primary">Tenant:</span> {selectedTicket.user?.name} ({selectedTicket.user?.email})</p>
                    <p><span className="font-bold text-primary">Reported:</span> {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                 </div>

                 <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-primary mb-2">Update Status</label>
                      <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-accent focus:border-accent text-primary font-medium"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-primary mb-2">Your Response (Optional)</label>
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Let the tenant know what's happening..."
                        className="w-full p-4 bg-background border border-border rounded-xl min-h-[100px] focus:ring-2 focus:ring-accent focus:border-accent resize-none text-primary"
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      disabled={updating}
                      className="w-full py-4 bg-primary text-background font-bold rounded-xl hover:bg-accent hover:text-background transition-colors disabled:opacity-70 flex justify-center items-center"
                    >
                      {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Ticket'}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
