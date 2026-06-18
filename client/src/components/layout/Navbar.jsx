import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Menu, User, LogOut, LayoutDashboard, Moon, Sun, MessageSquare, Sparkles, CreditCard } from 'lucide-react';
import CreatePropertyModal from '../CreatePropertyModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const ThemeSlider = ({ theme, toggleTheme }) => (
  <div className="flex items-center justify-between px-4 py-3 bg-primary/5 dark:bg-white/5 rounded-xl mt-2 mx-4 mb-2 group">
    <span className="text-sm font-bold text-primary">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
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

export default function Navbar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      navigate(`/home?search=${e.target.value}`);
      setShowDropdown(false);
    }
  };

  return (
    <nav className="bg-surface/95 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <Link to={user?.role === 'HOST' ? '/host' : '/home'} className="flex items-center overflow-visible pl-4" onClick={() => setShowDropdown(false)}>
            <img 
              src={theme === 'dark' ? '/logo-white.png' : '/logo.png'} 
              alt="Homely Logo" 
              className="h-20 w-auto object-contain scale-[1.5] md:scale-[2.0] origin-left transition-all duration-300 hover:scale-[1.6] md:hover:scale-[2.1]" 
            />
          </Link>

          {/* Search bar placeholder (desktop) */}
          {user?.role !== 'HOST' && (
            <div className="hidden md:flex flex-1 max-w-md mx-8 transition-transform hover:scale-[1.02]">
              <div className="relative w-full shadow-sm rounded-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-taupe" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 border border-white/10 rounded-full leading-5 bg-background placeholder-taupe font-medium focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-300 shadow-sm hover:shadow-md text-primary"
                  placeholder="Search locations or rooms..."
                  onKeyDown={handleSearch}
                />
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {user?.role === 'HOST' ? (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-primary font-bold hover:text-accent transition-colors px-4 pb-0.5"
              >
                List property
              </button>
            ) : user ? (
              <div className="flex items-center gap-4">
                <Link 
                  to="/roommates"
                  className="text-primary font-bold hover:text-accent transition-colors px-2 pb-0.5 flex items-center gap-2"
                >
                  Roommates <Sparkles className="w-4 h-4 text-accent" />
                </Link>
                <Link 
                  to="/finance"
                  className="text-primary font-bold hover:text-accent transition-colors px-2 pb-0.5 flex items-center gap-2"
                >
                  Finance <CreditCard className="w-4 h-4 text-accent" />
                </Link>
              </div>
            ) : null}

            <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-2 border border-white/10 rounded-full hover:shadow-md transition-all bg-background"
              >
                <Menu className="w-5 h-5 text-taupe ml-1" />
                {user ? (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-background text-xs font-bold">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-taupe/20 rounded-full flex items-center justify-center text-primary">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-64 bg-surface rounded-2xl shadow-2xl border border-white/10 py-3 z-[150] animate-in fade-in slide-in-from-top-2">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-white/5 mb-2">
                         <p className="font-bold text-primary truncate">{user.name}</p>
                         <p className="text-xs text-taupe truncate">{user.email}</p>
                      </div>
                      <Link 
                        to="/profile" 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 text-primary hover:bg-white/5 transition-colors font-medium text-left"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link 
                        to="/inbox" 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 text-primary hover:bg-white/5 transition-colors font-medium text-left"
                      >
                        <MessageSquare className="w-4 h-4" /> Inbox
                      </Link>
                    </>
                  ) : (
                    <div className="px-2 mb-2">
                      <Link 
                        to="/auth" 
                        onClick={() => setShowDropdown(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-primary hover:bg-white/5 transition-colors font-bold rounded-xl"
                      >
                        <User className="w-4 h-4" /> Sign In / Register
                      </Link>
                    </div>
                  )}

                  <div className="border-t border-white/10 mt-1 pt-1">
                    <p className="px-4 py-1 text-[10px] uppercase font-bold text-taupe tracking-wider">Appearance</p>
                    <ThemeSlider theme={theme} toggleTheme={toggleTheme} />
                  </div>

                  {user && (
                    <button 
                      onClick={() => { logout(); setShowDropdown(false); navigate('/'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 transition-colors font-bold mt-1 border-t border-white/10 pt-3 text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-2">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-3 bg-background border border-white/10 rounded-full text-primary"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {showDropdown && (
        <div className="md:hidden bg-surface border-t border-white/10 py-4 w-full">
           <div className="px-4 space-y-4">
              {user ? (
                <div className="flex items-center gap-3 mb-6 p-4 bg-white/5 rounded-2xl">
                   <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-background font-bold text-xl">
                      {user.name.charAt(0)}
                   </div>
                   <div>
                      <p className="font-bold text-primary">{user.name}</p>
                      <button onClick={() => { navigate('/profile'); setShowDropdown(false); }} className="text-xs text-accent font-bold">View Profile</button>
                   </div>
                </div>
              ) : (
                <Link 
                  to="/auth" 
                  onClick={() => setShowDropdown(false)}
                  className="w-full block text-center py-4 bg-primary text-background font-bold rounded-2xl shadow-lg"
                >
                  Sign In / Register
                </Link>
              )}
              
              <div className="py-2">
                 <p className="text-[10px] uppercase font-bold text-taupe mb-2 ml-2">Appearance</p>
                 <ThemeSlider theme={theme} toggleTheme={toggleTheme} />
              </div>

              {user && (
                 <button 
                   onClick={() => { logout(); setShowDropdown(false); navigate('/'); }}
                   className="w-full py-4 text-red-500 font-bold border border-white/10 rounded-2xl"
                 >
                   Sign Out
                 </button>
              )}
           </div>
        </div>
      )}

      <CreatePropertyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </nav>
  );
}
