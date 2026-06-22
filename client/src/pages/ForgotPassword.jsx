import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Key, Shield, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [demoToken, setDemoToken] = useState(''); // Holds the token returned by the server for easy testing
  
  const [step, setStep] = useState(1); // 1: Email, 2: Token & Password
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDemoToken(data.token);
        setStep(2);
        setSuccess('A recovery token has been generated below for demo testing.');
      } else {
        setError(data.error || 'Failed to request password reset');
      }
    } catch (err) {
      console.error(err);
      setError('Network error requesting recovery token.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      } else {
        setError(data.error || 'Password reset failed');
      }
    } catch (err) {
      console.error(err);
      setError('Network error resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-surface rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-border z-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        
        <Link 
          to="/auth" 
          className="inline-flex items-center gap-2 text-taupe hover:text-primary mb-8 font-bold transition-all text-xs uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-primary tracking-tight mb-2">Reset Password</h2>
          <p className="text-taupe font-medium text-sm">
            {step === 1 
              ? 'Enter your email address and we will generate a recovery token.' 
              : 'Enter the recovery token and set your new password.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl text-xs mb-6 font-bold border border-red-500/20">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 text-green-500 p-4 rounded-2xl text-xs mb-6 font-bold border border-green-500/20 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestToken} className="space-y-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase text-taupe tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
                <input 
                  type="email" 
                  required
                  placeholder="name@example.com"
                  className="w-full bg-background border border-white/10 rounded-xl pl-12 pr-4 py-4 text-primary outline-none focus:ring-2 focus:ring-accent/50 text-sm font-semibold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-4 bg-primary text-background font-bold rounded-2xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get Recovery Token'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            {demoToken && (
              <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl text-center">
                <span className="block text-[10px] font-black uppercase text-taupe tracking-wider mb-1">Demo Verification Token</span>
                <span className="text-2xl font-black text-accent tracking-widest">{demoToken}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-taupe tracking-wider">Verification Token</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
                  <input 
                    type="text" 
                    required
                    placeholder="Enter 6-digit token"
                    className="w-full bg-background border border-white/10 rounded-xl pl-12 pr-4 py-4 text-primary outline-none focus:ring-2 focus:ring-accent/50 text-sm font-semibold"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase text-taupe tracking-wider">New Password</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe" />
                  <input 
                    type="password" 
                    required
                    placeholder="Min 6 characters"
                    className="w-full bg-background border border-white/10 rounded-xl pl-12 pr-4 py-4 text-primary outline-none focus:ring-2 focus:ring-accent/50 text-sm font-semibold"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token || !newPassword}
              className="w-full py-4 bg-primary text-background font-bold rounded-2xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
