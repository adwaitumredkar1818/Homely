import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building, PlusSquare, Inbox, Calendar, LogOut, User, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function HostLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/host', icon: Home },
    { name: 'My Properties', href: '/host/properties', icon: Building },
    { name: 'Add Listing', href: '/host/properties/new', icon: PlusSquare },
    { name: 'Reservations', href: '/host/reservations', icon: Calendar },
    { name: 'Inbox', href: '/host/inbox', icon: Inbox },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex bg-[#f8fafc] min-h-screen font-sans text-primary">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-gray-200">
          <Building className="h-8 w-8 text-accent mr-2" />
          <span className="font-bold text-xl tracking-tight">Landlord Portal</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href === '#' ? location.pathname : item.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-accent text-white shadow-md shadow-blue-500/20'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
                }`}
              >
                <item.icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-[100]">
           <h2 className="text-xl font-bold capitalize">
             {navigation.find(n => n.href === location.pathname)?.name || 'Landlord Dashboard'}
           </h2>
           
           <div className="relative">
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 p-1.5 pr-3 hover:bg-gray-50 rounded-full transition-all border border-transparent hover:border-gray-100"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-sm ring-2 ring-white">
                  {user?.name?.charAt(0) || 'H'}
                </div>
                <div className="hidden sm:block text-left">
                   <p className="text-xs font-bold text-primary leading-none mb-1">{user?.name}</p>
                   <p className="text-[10px] text-gray-400 font-medium">{user?.role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDropdown(false)}
                  ></div>
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-5 py-3 border-b border-gray-50 mb-2">
                       <p className="font-bold text-primary truncate">{user?.name}</p>
                       <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    
                    <Link 
                      to="/profile" 
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-5 py-3 text-gray-600 hover:bg-gray-50 transition-colors font-semibold"
                    >
                      <User className="w-4 h-4" /> Personal Profile
                    </Link>
                    
                    <Link 
                      to="/host" 
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-5 py-3 text-gray-600 hover:bg-gray-50 transition-colors font-semibold"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Landlord Dashboard
                    </Link>

                    <div className="border-t border-gray-50 mt-1 pt-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-5 py-3 text-red-500 hover:bg-red-50 transition-colors font-bold text-left"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
           </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6 md:p-8">
           <Outlet />
        </div>
      </main>
    </div>
  );
}
