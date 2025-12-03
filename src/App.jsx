// App.js - Updated
import React, { useState, useEffect } from 'react';
import { BarChart3, BookOpen, LogOut, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import KnowledgeBase from './components/KnowledgeBase';
import Login from './pages/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('tasks'); // 'tasks' or 'knowledge'

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userData = {
        id: payload.id || payload.sub,
        first_name: payload.first_name || '',
        last_name: payload.last_name || '',
        email: payload.email || '',
        username: payload.username || '',
        role: payload.role || 'user'
      };
      setIsAuthenticated(true);
      setUser(userData);
    } catch (error) {
      console.error('Token parsing failed:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('tasks');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Navigation Header Component
  const NavigationHeader = () => (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setCurrentView('tasks')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  currentView === 'tasks'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">TaskFlow</span>
              </button>
              <button
                onClick={() => setCurrentView('knowledge')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  currentView === 'knowledge'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Knowledge Base</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* User Profile Section - Desktop */}
            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user.first_name[0]}{user.last_name[0]}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-slate-900">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
            )}

            {/* User Profile Section - Mobile */}
            {isAuthenticated && (
              <div className="sm:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user.first_name[0]}{user.last_name[0]}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView('tasks')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-sm"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  // If not authenticated and trying to access tasks, show login
  if (!isAuthenticated && currentView === 'tasks') {
    return <Login onLogin={handleLogin} />;
  }

  // Main content based on current view
  const renderContent = () => {
    if (currentView === 'knowledge') {
      return <KnowledgeBase user={user} onNavigateToLogin={() => setCurrentView('tasks')} />;
    }

    // Task views (authenticated users only)
    if (user?.role === 'co-admin' || user?.role === 'root-admin' || user?.role === 'admin') {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    } else {
      return <Dashboard user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="App">
      <NavigationHeader />
      {renderContent()}
    </div>
  );
}

export default App;
