import { useState } from 'react';
import { CreditCard, ShieldCheck, Loader2, X, Users } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, amount, itemTitle, onConfirm }) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [emails, setEmails] = useState('');
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState('input'); // 'input', 'processing', 'success'

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvv || !name) return;

    setStep('processing');
    setProcessing(true);

    const roommateEmails = isShared 
      ? emails.split(',').map(em => em.trim()).filter(Boolean)
      : [];

    setTimeout(() => {
      setProcessing(false);
      setStep('success');
      onConfirm(roommateEmails);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-surface border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        {step !== 'processing' && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-taupe hover:text-primary hover:bg-white/5 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {step === 'input' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-accent/10 border border-accent/20 rounded-xl text-accent">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-primary tracking-tight">Checkout</h3>
                <p className="text-xs text-taupe font-bold uppercase tracking-wider">{itemTitle}</p>
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-2xl border border-white/5 flex justify-between items-center">
              <span className="text-xs font-bold text-taupe uppercase tracking-wider">Amount Due</span>
              <span className="text-xl font-black text-primary">₹{amount.toLocaleString('en-IN')}</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-taupe tracking-wider">Name on Card</label>
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-accent/50 text-sm font-semibold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-taupe tracking-wider">Card Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="•••• •••• •••• ••••"
                  maxLength={19}
                  className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-accent/50 text-sm font-semibold"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-taupe tracking-wider">Expiry Date</label>
                  <input 
                    type="text" 
                    required
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-accent/50 text-sm font-semibold text-center"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-taupe tracking-wider">CVV</label>
                  <input 
                    type="password" 
                    required
                    placeholder="•••"
                    maxLength={3}
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-accent/50 text-sm font-semibold text-center"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Shared Booking Toggle */}
            <div className="pt-4 border-t border-white/5 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-background text-accent focus:ring-accent"
                />
                <span className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-accent" /> Shared Group Booking
                </span>
              </label>

              {isShared && (
                <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-[10px] font-black uppercase text-taupe tracking-wider">Roommate Emails (comma separated)</label>
                  <input 
                    type="text"
                    placeholder="email1@college.edu, email2@college.edu"
                    className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-primary outline-none focus:ring-2 focus:ring-accent/50 text-xs font-semibold"
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                  />
                  <p className="text-[9px] text-taupe font-medium">Roommates will receive an invite. Booking confirms once everyone accepts.</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-primary text-background font-bold rounded-2xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              Pay ₹{amount.toLocaleString('en-IN')}
            </button>
          </form>
        )}

        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-accent animate-spin" />
            <h3 className="text-xl font-bold text-primary">Processing Transaction</h3>
            <p className="text-taupe text-sm">Please do not refresh or close this modal...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-primary tracking-tight">Payment Verified</h3>
              <p className="text-taupe text-sm">Your booking reservation has been successfully locked in.</p>
            </div>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-primary text-background font-bold rounded-xl shadow-lg hover:bg-black transition-all"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
