import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Users, 
  PieChart, 
  History, 
  TrendingUp,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../utils/api';

export default function Finance() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState({ moneyIOwe: [], moneyOwedToMe: [], recentPayments: [] });
  const [loading, setLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [roommates, setRoommates] = useState([]);
  
  // New Expense State
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'UTILITIES',
    description: '',
    splitWith: [] // Array of userIds
  });

  useEffect(() => {
    fetchSummary();
    fetchRoommates();
  }, [token]);

  const fetchSummary = async () => {
    try {
      const res = await fetch(`${API_URL}/api/financial-summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSummary(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoommates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/roommates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRoommates(data.filter(r => r.id !== user.id).slice(0, 5));
      } else {
        setRoommates([]);
      }
    } catch (err) {
      console.error(err);
      setRoommates([]);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      const splitAmount = parseFloat(newExpense.amount) / (newExpense.splitWith.length + 1);
      const payload = {
        ...newExpense,
        splitWith: newExpense.splitWith.map(id => ({ userId: id, amount: splitAmount }))
      };

      const res = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsExpenseModalOpen(false);
        fetchSummary();
        setNewExpense({ title: '', amount: '', category: 'UTILITIES', description: '', splitWith: [] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const settleSplit = async (splitId) => {
    try {
      const res = await fetch(`${API_URL}/api/splits/${splitId}/settle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ provider: 'UPI', reference: 'TRANS_' + Math.random().toString(36).substring(7).toUpperCase() })
      });
      if (res.ok) fetchSummary();
    } catch (err) {
      console.error(err);
    }
  };

  const totalOwe = (summary.moneyIOwe || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalDue = (summary.moneyOwedToMe || []).reduce((acc, curr) => {
    return acc + (curr.splits || []).reduce((sAcc, sCurr) => sAcc + (sCurr.amount || 0), 0);
  }, 0);

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[calc(100vh-80px)]">
      <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center animate-pulse border border-white/5 shadow-2xl">
         <Wallet className="w-10 h-10 text-accent animate-bounce" />
      </div>
      <p className="mt-8 text-taupe font-black uppercase tracking-[0.4em] animate-pulse">Syncing Ledger...</p>
    </div>
  );

  return (
    <div className="flex-1 bg-background p-4 sm:p-6 lg:p-12 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
          <div className="flex-1">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                   <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-primary tracking-tighter">Finance Hub</h1>
             </div>
             <p className="text-taupe font-medium text-lg max-w-xl">Transparent rent management and effortless roommate expense splitting.</p>
          </div>
          
          <button 
            onClick={() => setIsExpenseModalOpen(true)}
            className="group flex items-center gap-3 bg-primary text-background px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent transition-all shadow-2xl relative overflow-hidden"
          >
             <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> 
             Split New Expense
             <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
           <div className="bg-surface border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                 <ArrowDownLeft className="w-32 h-32 text-red-500" />
              </div>
              <p className="text-[10px] font-black text-taupe uppercase tracking-widest mb-2">Total You Owe</p>
              <h3 className="text-5xl font-black text-primary tracking-tighter mb-6">₹{totalOwe.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-red-500 bg-red-500/10 w-fit px-4 py-2 rounded-full text-[10px] font-black uppercase">
                 <AlertCircle className="w-3 h-3" /> Pay Soon
              </div>
           </div>

           <div className="bg-surface border border-white/5 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                 <ArrowUpRight className="w-32 h-32 text-green-500" />
              </div>
              <p className="text-[10px] font-black text-taupe uppercase tracking-widest mb-2">Money Owed to You</p>
              <h3 className="text-5xl font-black text-primary tracking-tighter mb-6">₹{totalDue.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-green-500 bg-green-500/10 w-fit px-4 py-2 rounded-full text-[10px] font-black uppercase">
                 <CheckCircle2 className="w-3 h-3" /> Collecting
              </div>
           </div>

           <div className="bg-accent/10 border border-accent/20 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                 <Sparkles className="w-32 h-32 text-accent" />
              </div>
              <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-2">Smart Saving Tip</p>
              <h3 className="text-xl font-bold text-primary leading-tight mb-6 italic">"Electricity is 20% higher this month. Consider shared AC hours."</h3>
              <button className="text-[10px] font-black text-accent uppercase border-b-2 border-accent pb-1">View Analytics</button>
           </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-12">
           
           {/* Left Column: Money I Owe */}
           <div className="flex-1">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-2xl font-black text-primary tracking-tight flex items-center gap-3">
                    <History className="w-6 h-6 text-accent" /> Pending Settlements
                 </h2>
                 <button className="text-[10px] font-black text-taupe uppercase tracking-widest flex items-center gap-2 hover:text-primary transition-colors">
                    Filter <Filter className="w-3 h-3" />
                 </button>
              </div>

              <div className="space-y-6">
                 {summary.moneyIOwe.length > 0 ? summary.moneyIOwe.map((split) => (
                    <div key={split.id} className="bg-surface border border-white/5 p-8 rounded-3xl group hover:border-accent/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                       <div className="flex gap-6">
                          <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center text-3xl font-black text-accent shadow-xl">
                             {split.expense.payer.name.charAt(0)}
                          </div>
                          <div>
                             <h4 className="text-lg font-bold text-primary mb-1">{split.expense.title}</h4>
                             <p className="text-taupe text-sm mb-2">Paid by <span className="text-primary font-bold">{split.expense.payer.name}</span></p>
                             <div className="flex gap-3">
                                <span className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase text-taupe tracking-widest">{split.expense.category}</span>
                                <span className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black uppercase text-taupe tracking-widest">{new Date(split.expense.date).toLocaleDateString()}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                          <div className="text-right">
                             <p className="text-[10px] font-black text-taupe uppercase tracking-widest mb-1">Your Share</p>
                             <h3 className="text-3xl font-black text-primary tracking-tighter">₹{split.amount.toLocaleString()}</h3>
                          </div>
                          <button 
                            onClick={() => settleSplit(split.id)}
                            className="px-6 py-3 bg-white/5 border border-white/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-background transition-all whitespace-nowrap"
                          >
                             Settle Now
                          </button>
                       </div>
                    </div>
                 )) : (
                    <div className="py-20 text-center bg-surface border border-dashed border-white/10 rounded-[3rem]">
                       <CheckCircle2 className="w-12 h-12 text-green-500/20 mx-auto mb-4" />
                       <p className="text-taupe font-black uppercase tracking-[0.2em] text-xs">All caught up! No pending debts.</p>
                    </div>
                 )}
              </div>
           </div>

           {/* Right Column: Recent Activity & Roommates */}
           <div className="lg:w-[450px] space-y-12">
              
              {/* Money Owed to Me */}
              <div className="bg-surface border border-white/5 p-10 rounded-[3rem] shadow-2xl">
                 <h3 className="text-xl font-black text-primary tracking-tight mb-8">Receivables</h3>
                 <div className="space-y-6">
                    {summary.moneyOwedToMe.slice(0, 3).map((expense) => (
                       <div key={expense.id} className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <p className="text-primary font-bold">{expense.title}</p>
                                <p className="text-[10px] text-taupe font-medium uppercase tracking-widest">{new Date(expense.date).toLocaleDateString()}</p>
                             </div>
                             <p className="text-accent font-black">₹{expense.amount}</p>
                          </div>
                          <div className="space-y-3">
                             {expense.splits.map(split => (
                                <div key={split.id} className="flex justify-between items-center text-sm">
                                   <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-[10px] font-black text-taupe">
                                         {split.user.name.charAt(0)}
                                      </div>
                                      <span className="text-taupe font-medium">{split.user.name}</span>
                                   </div>
                                   <span className="font-black text-primary">₹{split.amount}</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    ))}
                    {summary.moneyOwedToMe.length === 0 && (
                       <p className="text-center text-taupe text-sm italic py-8">No active receivables.</p>
                    )}
                 </div>
              </div>

              {/* Quick Roommate Select for splitting */}
              <div className="bg-primary/5 border border-white/5 p-10 rounded-[3rem]">
                 <h3 className="text-xl font-black text-primary tracking-tight mb-8">Recent Roommates</h3>
                 <div className="flex flex-wrap gap-4">
                    {roommates.map((rm) => (
                       <div key={rm.id} className="flex flex-col items-center gap-2 group cursor-pointer">
                          <div className="w-14 h-14 bg-surface border border-white/10 rounded-2xl flex items-center justify-center text-xl font-black text-accent group-hover:scale-110 transition-transform shadow-xl">
                             {rm.name.charAt(0)}
                          </div>
                          <span className="text-[10px] font-black uppercase text-taupe tracking-widest">{rm.name.split(' ')[0]}</span>
                       </div>
                    ))}
                    <button className="w-14 h-14 border border-dashed border-white/20 rounded-2xl flex items-center justify-center text-taupe hover:text-accent hover:border-accent transition-all">
                       <Plus className="w-6 h-6" />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Modal: New Expense */}
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl" onClick={() => setIsExpenseModalOpen(false)}></div>
             <div className="relative bg-surface border border-white/10 w-full max-w-2xl rounded-[3rem] p-12 shadow-[0_100px_150px_-50px_rgba(0,0,0,1)] animate-bloom">
                <h2 className="text-3xl font-black text-primary tracking-tighter mb-10 flex items-center gap-4">
                   <PieChart className="w-8 h-8 text-accent" /> Split Bill
                </h2>
                
                <form onSubmit={handleCreateExpense} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-taupe uppercase tracking-widest ml-4">Title</label>
                         <input 
                           type="text" 
                           placeholder="Ex: Electricity Bill Feb"
                           value={newExpense.title}
                           onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
                           required
                           className="w-full bg-background border border-white/5 rounded-2xl p-6 text-primary outline-none focus:ring-2 focus:ring-accent/30"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-taupe uppercase tracking-widest ml-4">Total Amount (₹)</label>
                         <input 
                           type="number" 
                           placeholder="0.00"
                           value={newExpense.amount}
                           onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                           required
                           className="w-full bg-background border border-white/5 rounded-2xl p-6 text-primary outline-none focus:ring-2 focus:ring-accent/30 font-black text-xl"
                         />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-taupe uppercase tracking-widest ml-4">Split With</label>
                      <div className="flex flex-wrap gap-4">
                         {roommates.map((rm) => (
                            <button
                              key={rm.id}
                              type="button"
                              onClick={() => {
                                 const exists = newExpense.splitWith.includes(rm.id);
                                 if (exists) setNewExpense({...newExpense, splitWith: newExpense.splitWith.filter(id => id !== rm.id)});
                                 else setNewExpense({...newExpense, splitWith: [...newExpense.splitWith, rm.id]});
                              }}
                              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${newExpense.splitWith.includes(rm.id) ? 'bg-accent text-background shadow-xl' : 'bg-background text-taupe border border-white/5 hover:border-accent/30'}`}
                            >
                               {rm.name}
                            </button>
                         ))}
                      </div>
                      <p className="text-[10px] text-taupe italic ml-4">Bill will be split equally between you and selected roommates.</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                      <button 
                        type="button" 
                        onClick={() => setIsExpenseModalOpen(false)}
                        className="w-full py-6 border border-white/10 text-taupe rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                      >
                         Cancel
                      </button>
                      <button 
                        type="submit"
                        className="w-full py-6 bg-primary text-background rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-2xl"
                      >
                         Confirm Split
                      </button>
                   </div>
                </form>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
