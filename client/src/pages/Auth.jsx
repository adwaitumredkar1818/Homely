import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('TENANT');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // // Redirect if already logged in based on role
  // useEffect(() => {
  //   if (user) {
  //     navigate(user.role === 'HOST' ? '/host' : '/home');
  //   }
  // }, [user, navigate]);

  const from = location.state?.from || '/home';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { email: formData.email, password: formData.password }
      : { ...formData, role };

    try {
      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          login(data.user, data.token);
          const redirectPath = data.user.role === 'HOST' ? '/host' : from;
          navigate(redirectPath, { replace: true });
        }, 1500);
      } else {
        setError(data.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Network error. Our servers might be sleeping. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-surface rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/10 z-10">
        
        {/* Left Side: Branding/Visual */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-primary dark:bg-zinc-900 relative">
          <div className="z-10">
            <Link to="/home" className="inline-flex items-center gap-2 text-background font-bold text-xl mb-12 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary rotate-3">H</div>
              Homely
            </Link>
            <h1 className="text-5xl font-bold text-background leading-[1.1] mb-6">
              Find your perfect <br /> <span className="text-accent underline decoration-4 underline-offset-8">student home</span>
            </h1>
            <p className="text-background/70 text-lg max-w-md leading-relaxed">
              Join thousands of students and hosts in India's most trusted marketplace for hostels and dining services.
            </p>
          </div>

          <div className="z-10 grid grid-cols-2 gap-6">
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-3xl font-bold text-background mb-1">10k+</p>
              <p className="text-sm text-background/50 font-medium">Verified Listings</p>
            </div>
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <p className="text-3xl font-bold text-background mb-1">24/7</p>
              <p className="text-sm text-background/50 font-medium">Host Support</p>
            </div>
          </div>

          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        </div>

        {/* Right Side: Form */}
        <div className="p-8 sm:p-16 flex flex-col justify-center">
          <Link to="/home" className="lg:hidden inline-flex items-center text-taupe hover:text-primary mb-8 font-bold transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back Home
          </Link>

          <div className="mb-10">
            <h2 className="text-4xl font-bold text-primary mb-3">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-taupe font-medium">
              {isLogin 
                ? "Enter your credentials to access your dashboard" 
                : "Fill in your details to get started with Homely"}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl text-sm mb-8 font-bold border border-red-500/20 animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-2">Success!</h3>
              <p className="text-taupe">Redirecting you to your destination...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="group">
                  <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2 ml-1 group-focus-within:text-accent transition-colors">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    className="w-full px-6 py-4 bg-background border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none text-primary font-medium transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              <div className="group">
                <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2 ml-1 group-focus-within:text-accent transition-colors">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="w-full px-6 py-4 bg-background border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none text-primary font-medium transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="group">
                <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-2 ml-1 group-focus-within:text-accent transition-colors">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-6 py-4 bg-background border border-white/10 rounded-2xl focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none text-primary font-medium transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {!isLogin && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-taupe uppercase tracking-widest mb-4 ml-1">I want to...</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('TENANT')}
                      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all group ${role === 'TENANT' ? 'border-accent bg-accent/5' : 'border-white/5 bg-background hover:border-white/10'}`}
                    >
                      <User className={`w-6 h-6 ${role === 'TENANT' ? 'text-accent' : 'text-taupe'}`} />
                      <span className={`text-sm font-bold ${role === 'TENANT' ? 'text-primary' : 'text-taupe'}`}>Find Rooms</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('HOST')}
                      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all group ${role === 'HOST' ? 'border-accent bg-accent/5' : 'border-white/5 bg-background hover:border-white/10'}`}
                    >
                      <ShieldCheck className={`w-6 h-6 ${role === 'HOST' ? 'text-accent' : 'text-taupe'}`} />
                      <span className={`text-sm font-bold ${role === 'HOST' ? 'text-primary' : 'text-taupe'}`}>List / Host</span>
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-primary hover:bg-black text-background font-bold py-5 rounded-2xl transition-all shadow-xl hover:shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing you in...
                  </>
                ) : (
                  isLogin ? 'Sign In to Homely' : 'Create My Account'
                )}
              </button>
            </form>
          )}

          {!isSuccess && (
            <div className="mt-12 text-center font-medium">
              <span className="text-taupe">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-accent font-bold hover:underline ml-1"
              >
                {isLogin ? 'Register now' : 'Login here'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
