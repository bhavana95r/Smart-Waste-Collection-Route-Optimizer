import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Leaf, LogOut, Menu, Sun, Moon, Bell } from 'lucide-react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Bins from './pages/Bins';
import Vehicles from './pages/Vehicles';
import RouteOptimizer from './pages/RouteOptimizer';
import DriverPortal from './pages/DriverPortal';
import Settings from './pages/Settings';
import api from './services/api';

// Create Contexts
export const AuthContext = createContext(null);
export const ThemeContext = createContext(null);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'Driver' ? '/driver' : '/dashboard'} replace />;
  }
  
  return children;
};

// Sidebar Navigation Links based on Roles
const Sidebar = ({ isOpen, toggle }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  
  if (!user) return null;

  const links = user.role === 'Driver' 
    ? [
        { path: '/driver', label: 'My Route Task' },
        { path: '/settings', label: 'Settings' }
      ]
    : [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/bins', label: 'Smart Bins' },
        { path: '/vehicles', label: 'Fleet Management' },
        { path: '/optimize', label: 'Route Optimizer' },
        { path: '/settings', label: 'Settings' }
      ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex h-16 items-center border-b border-slate-200 dark:border-slate-800 px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
          <Leaf className="h-6 w-6" />
          <span>Smart Waste</span>
        </Link>
      </div>
      
      <div className="flex flex-col h-[calc(100%-4rem)] justify-between p-4">
        <nav className="space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="flex items-center gap-3 px-4 py-2 mb-3">
            <div className="h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white uppercase">
              {user.name[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Authenticate user on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          // Load notifications if authenticated and not Driver
          if (res.data.role !== 'Driver') {
            fetchNotifications();
          }
        } catch (e) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Sync theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    if (userData.role !== 'Driver') {
      fetchNotifications();
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchNotifications }}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <Router>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            {user && <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />}
            
            <div className={`${user ? 'md:pl-64' : ''}`}>
              {/* Header bar if user is logged in */}
              {user && (
                <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-6">
                  <button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  
                  <div className="flex-1 md:flex-none"></div>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={toggleTheme}
                      className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    </button>
                    
                    {user.role !== 'Driver' && (
                      <div className="relative">
                        <button 
                          onClick={() => setShowNotifications(!showNotifications)}
                          className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Bell className="h-5 w-5" />
                          {notifications.some(n => !n.is_read) && (
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                          )}
                        </button>
                        
                        {showNotifications && (
                          <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-xl z-50">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2">Notifications</h4>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {notifications.length === 0 ? (
                                <p className="text-xs text-slate-400 text-center py-4">No alerts found</p>
                              ) : (
                                notifications.map(n => (
                                  <div key={n.id} className={`p-2 rounded-lg text-xs border ${n.is_read ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200'}`}>
                                    <p className="font-medium">{n.message}</p>
                                    <span className="text-[10px] text-slate-400 block mt-1">
                                      {new Date(n.created_at).toLocaleTimeString()}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </header>
              )}
              
              <main className={`${user ? 'p-6' : ''}`}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={user ? <Navigate to={user.role === 'Driver' ? '/driver' : '/dashboard'} replace /> : <Landing />} />
                  <Route path="/login" element={user ? <Navigate to={user.role === 'Driver' ? '/driver' : '/dashboard'} replace /> : <Login />} />
                  <Route path="/signup" element={user ? <Navigate to={user.role === 'Driver' ? '/driver' : '/dashboard'} replace /> : <Signup />} />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/bins" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
                      <Bins />
                    </ProtectedRoute>
                  } />
                  <Route path="/vehicles" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
                      <Vehicles />
                    </ProtectedRoute>
                  } />
                  <Route path="/optimize" element={
                    <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
                      <RouteOptimizer />
                    </ProtectedRoute>
                  } />
                  <Route path="/driver" element={
                    <ProtectedRoute allowedRoles={['Driver']}>
                      <DriverPortal />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  
                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}
