import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building, PlusSquare, Inbox, Calendar, LogOut, User, LayoutDashboard, ChevronDown, Wrench, Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const ThemeSlider = ({ theme, toggleTheme }) => (
  <div className="flex items-center justify-between px-4 py-3 bg-primary/5 dark:bg-white/5 rounded-xl mt-2 mx-4 mb-2 group">
    <span className="text-sm font-bold text-primary dark:text-zinc-300">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
    <button 
      onClick={toggleTheme}
      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner border border-white/10 ${theme === 'dark' ? 'bg-indigo-900' : 'bg-gray-200'}`}
    >
      <div className="absolute flex w-full justify-between px-2 pointer-events-none">
        <Sun className="w-4 h-4 text-amber-500/20" />
        <Moon className="w-4 h-4 text-indigo-400/20" />
      </div>
      <span
        className={`flex items-center justify-center h-6 w-6 transform rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-300 z-10 ${theme === 'dark' ? 'translate-x-9 bg-indigo-50' : 'translate-x-1'}`}
      >
        {theme === 'light' ? (
          <Sun className="w-4 h-4 text-amber-500 fill-amber-500 drop-shadow-sm animate-in zoom-in-50 duration-300" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600 drop-shadow-sm animate-in zoom-in-50 duration-300" />
        )}
      </span>
    </button>
  </div>
);

export default function HostLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);

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

  return (
    <div className="flex bg-background min-h-screen font-sans text-primary transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-68 m-4 mr-0 bg-surface border border-white/10 rounded-[2.5rem] shadow-xl hidden md:flex flex-col overflow-hidden">
        <div className="h-24 flex items-center px-8 border-b border-white/5 bg-background/30">
          <Building className="h-7 w-7 text-accent mr-3" />
          <span className="font-black text-lg tracking-tight text-primary uppercase">Landlord Hub</span>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href === '#' ? location.pathname : item.href}
                className={`flex items-center px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-primary text-background shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'text-taupe hover:bg-background/50 hover:text-primary'
                }`}
              >
                <item.icon className={`h-5 w-5 mr-3.5 ${isActive ? 'text-background' : 'text-taupe'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-24 bg-background/80 backdrop-blur-md flex items-center justify-between px-8 z-[100] border-b border-white/10">
          <h2 className="text-2xl font-black text-primary uppercase tracking-wider">
             {navigation.find(n => n.href === location.pathname)?.name || 'Landlord Dashboard'}
          </h2>
          
          <div className="flex items-center gap-4">
             {/* Profile Dropdown */}
             <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-2 border border-white/10 rounded-full hover:shadow-md transition-all bg-surface"
                >
                  <Menu className="w-5 h-5 text-taupe ml-1" />
                  {user ? (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-background text-xs font-bold mr-1">
                      {user.name?.charAt(0) || 'U'}
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-taupe/20 rounded-full flex items-center justify-center text-primary mr-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </button>

                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-64 bg-surface rounded-2xl shadow-2xl border border-white/10 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-5 py-3 border-b border-white/5 mb-2">
                         <p className="font-bold text-primary truncate">{user?.name}</p>
                         <p className="text-xs text-taupe truncate">{user?.email}</p>
                      </div>
                      
                      <Link 
                        to="/profile" 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-5 py-3 text-primary hover:bg-background/50 transition-colors font-semibold"
                      >
                        <User className="w-4 h-4" /> Personal Profile
                      </Link>
                      
                      <Link 
                        to="/host" 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-5 py-3 text-primary hover:bg-background/50 transition-colors font-semibold"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Landlord Dashboard
                      </Link>

                      <div className="border-t border-white/5 mt-1 pt-1">
                        <p className="px-5 py-1 text-[10px] uppercase font-bold text-taupe tracking-wider">Appearance</p>
                        <ThemeSlider theme={theme} toggleTheme={toggleTheme} />
                      </div>

                      <div className="border-t border-white/5 mt-1 pt-2">
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-5 py-3 text-red-500 hover:bg-red-500/10 transition-colors font-bold text-left"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
             </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6 md:p-8">
           <Outlet />
        </div>
      </main>
    </div>
  );
}
