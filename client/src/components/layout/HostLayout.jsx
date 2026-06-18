import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building, PlusSquare, Inbox, Calendar, LogOut, User, LayoutDashboard, ChevronDown, Wrench, Bell, AlertCircle, CheckCircle2, MessageSquare, Sun, Moon, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import API_URL from '../../utils/api';

export default function HostLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (token) {
      // Fetch maintenance tickets for notifications
      fetch(`${API_URL}/api/maintenance`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          const tickets = data || [];
          setPendingCount(tickets.filter(t => t.status === 'PENDING').length);
          // Build notification items from maintenance tickets
          const maintNotifs = tickets.slice(0, 5).map(t => ({
            id: `maint-${t.id}`,
            rawId: t.id,
            type: 'maintenance',
            title: t.title,
            subtitle: `${t.status} • ${t.priority} priority`,
            time: t.createdAt,
            status: t.status,
            link: '/host/maintenance'
          }));
          setNotifications(prev => [...maintNotifs, ...prev.filter(n => n.type !== 'maintenance')]);
        })
        .catch(() => {});

      // Fetch recent bookings for notifications
      fetch(`${API_URL}/api/user/profile`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          const bookingNotifs = (data.inboundBookings || []).slice(0, 3).map(b => ({
            id: `book-${b.id}`,
            rawId: b.id,
            type: 'booking',
            title: `${b.tenant?.name || 'A tenant'} booked ${b.room?.title || 'a property'}`,
            subtitle: `₹${b.totalPrice?.toLocaleString()} • ${b.status}`,
            time: b.createdAt,
            status: b.status,
            link: '/host/reservations'
          }));
          setNotifications(prev => [...prev.filter(n => n.type !== 'booking'), ...bookingNotifs]);
        })
        .catch(() => {});
    }
  }, [token]);

  const navigation = [
    { name: 'Dashboard', href: '/host', icon: Home },
    { name: 'My Properties', href: '/host/properties', icon: Building },
    { name: 'Add Listing', href: '/host/properties/new', icon: PlusSquare },
    { name: 'Reservations', href: '/host/reservations', icon: Calendar },
    { name: 'Inbox', href: '/host/inbox', icon: Inbox },
    { name: 'Maintenance', href: '/host/maintenance', icon: Wrench },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="flex flex-col bg-background min-h-screen font-sans text-primary">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-[100] h-24 bg-surface/80 backdrop-blur-2xl border-b border-white/10 px-8 flex items-center justify-between shadow-2xl">
        {/* Brand Section */}
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="xl:hidden p-3 bg-primary/5 rounded-2xl text-taupe hover:text-primary transition-all"
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link to="/host" className="flex items-center gap-3 group">
            <div className="p-3 bg-accent/10 rounded-2xl group-hover:bg-accent transition-all duration-500 shadow-lg shadow-accent/5">
              <Building className="h-6 w-6 text-accent group-hover:text-background transition-colors" />
            </div>
            <div className="hidden lg:block">
              <span className="font-black text-xl tracking-tighter block leading-none">LANDLORD</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-taupe opacity-50">PRO PORTAL</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center bg-primary/5 p-1.5 rounded-2xl border border-white/5 ml-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href === '#' ? location.pathname : item.href}
                  className={`flex items-center px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isActive
                      ? 'bg-primary text-background shadow-xl'
                      : 'text-taupe hover:text-primary hover:bg-white/5'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowDropdown(false); }}
              className={`relative p-4 rounded-2xl transition-all border ${
                showNotifications ? 'bg-primary text-background border-primary' : 'bg-surface border-white/10 text-taupe hover:border-accent/30'
              }`}
            >
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-4 border-surface animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                <div className="absolute right-0 mt-6 w-[28rem] bg-surface rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 z-50 animate-in fade-in slide-in-from-top-4 overflow-hidden">
                  <div className="p-8 border-b border-white/5 flex justify-between items-center bg-primary/5">
                    <div>
                      <h3 className="font-black text-primary text-lg">System Alerts</h3>
                      <p className="text-[10px] font-black text-taupe uppercase tracking-widest opacity-50">Pulse Monitoring</p>
                    </div>
                    <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-black uppercase rounded-full">
                       {notifications.length} Active
                    </span>
                  </div>
                  <div className="max-h-[32rem] overflow-y-auto p-4 space-y-2">
                    {notifications.length > 0 ? notifications
                      .sort((a, b) => new Date(b.time) - new Date(a.time))
                      .map(notif => (
                       <Link
                         key={notif.id}
                         to={notif.link}
                         state={{ highlightId: notif.rawId }}
                         onClick={() => setShowNotifications(false)}
                         className="flex items-start gap-4 px-6 py-5 hover:bg-primary/5 rounded-3xl transition-all border border-transparent hover:border-white/5 group/notif"
                       >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg ${
                          notif.type === 'maintenance'
                            ? notif.status === 'PENDING' ? 'bg-red-500 text-white' : notif.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {notif.type === 'maintenance'
                            ? <Wrench className="w-5 h-5" />
                            : <Calendar className="w-5 h-5" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-primary mb-1 group-hover/notif:text-accent transition-colors">{notif.title}</p>
                          <p className="text-xs text-taupe font-bold opacity-60 uppercase tracking-wide">{notif.subtitle}</p>
                          <p className="text-[10px] text-taupe font-black mt-2 opacity-40 uppercase tracking-widest">{timeAgo(notif.time)}</p>
                        </div>
                       </Link>
                    )) : (
                       <div className="p-20 text-center">
                         <Bell className="w-12 h-12 text-taupe/20 mx-auto mb-6" />
                         <p className="text-sm text-taupe font-black uppercase tracking-widest">Awaiting activity...</p>
                       </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center gap-4 p-2 pr-6 rounded-2xl transition-all border ${
                showDropdown ? 'bg-primary text-background border-primary' : 'bg-surface border-white/10 text-primary hover:border-accent/30'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-background font-black shadow-lg shadow-accent/20 overflow-hidden">
                {user?.name?.charAt(0) || 'H'}
              </div>
              <div className="hidden sm:block text-left">
                 <p className={`text-xs font-black tracking-tight leading-none mb-1 ${showDropdown ? 'text-background' : 'text-primary'}`}>{user?.name}</p>
                 <p className={`text-[10px] font-black uppercase tracking-widest opacity-50 ${showDropdown ? 'text-background' : 'text-taupe'}`}>{user?.role}</p>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180 text-background' : 'text-taupe'}`} />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                <div className="absolute right-0 mt-6 w-72 bg-surface rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 p-4 z-50 animate-in fade-in slide-in-from-top-4">
                  <div className="px-6 py-6 border-b border-white/5 mb-2">
                     <p className="text-xl font-black text-primary tracking-tighter truncate">{user?.name}</p>
                     <p className="text-[10px] font-black text-taupe uppercase tracking-widest truncate opacity-50">{user?.email}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <Link 
                      to="/profile" 
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-taupe hover:bg-primary/5 hover:text-primary rounded-2xl transition-all"
                    >
                      <User className="w-4 h-4" /> Profile Details
                    </Link>
                    
                    <Link 
                      to="/host" 
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-4 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-taupe hover:bg-primary/5 hover:text-primary rounded-2xl transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Admin Console
                    </Link>

                    <div className="flex items-center justify-between px-6 py-4 bg-primary/5 rounded-2xl mt-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-taupe">Appearance</span>
                      <button
                        onClick={toggleTheme}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 ${theme === 'dark' ? 'bg-accent' : 'bg-primary/10'}`}
                      >
                        <span className={`flex items-center justify-center h-5 w-5 transform rounded-full bg-background shadow-lg transition-transform duration-500 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}>
                          {theme === 'light' ? <Sun className="w-3 h-3 text-amber-500" /> : <Moon className="w-3 h-3 text-accent" />}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-4 px-6 py-5 text-red-500 bg-red-500/5 hover:bg-red-500 text-[10px] font-black uppercase tracking-widest hover:text-white rounded-3xl transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Terminate Session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="xl:hidden fixed inset-0 z-[90] animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-background/60 backdrop-blur-md" onClick={() => setShowMobileMenu(false)} />
           <nav className="absolute top-24 left-4 right-4 bg-surface rounded-[2.5rem] border border-white/10 shadow-2xl p-6 space-y-2 animate-in slide-in-from-top-4 duration-500">
              <div className="px-6 py-4 border-b border-white/5 mb-4">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Portal Navigation</p>
              </div>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href === '#' ? location.pathname : item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-4 px-8 py-5 rounded-3xl text-xs font-black uppercase tracking-widest transition-all ${
                      isActive
                        ? 'bg-primary text-background shadow-xl'
                        : 'text-taupe hover:bg-primary/5 hover:text-primary'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                )
              })}
           </nav>
        </div>
      )}
      
      {/* Scrollable Content Pane */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
