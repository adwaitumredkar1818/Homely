import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import RoomDetail from './pages/RoomDetail';
import MessDetail from './pages/MessDetail';
import HostLayout from './components/layout/HostLayout';
import Dashboard from './pages/host/Dashboard';
import Properties from './pages/host/Properties';
import CreateProperty from './pages/host/CreateProperty';
import Reservations from './pages/host/Reservations';
import Inbox from './pages/Inbox';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Maintenance from './pages/host/Maintenance';

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Route */}
        <Route path="/" element={<Auth />} />
        <Route path="/auth" element={<Auth />} />

        {/* Public Routes - Includes Navbar */}
        <Route element={<PublicLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/room/:id" element={<RoomDetail />} />
          <Route path="/mess/:id" element={<MessDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/inbox" element={<Inbox />} />
        </Route>

        {/* Host Routes - Sidebar Admin Layout */}
        <Route path="/host" element={<HostLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="properties" element={<Properties />} />
          <Route path="properties/new" element={<CreateProperty />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="maintenance" element={<Maintenance />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
