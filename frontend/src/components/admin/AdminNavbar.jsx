import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, ShieldAlert, History, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminNavbar = ({ queueCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/admin/reviews', label: 'Review Queue', icon: ShieldAlert, count: queueCount },
    { to: '/admin/audit-logs', label: 'Audit Trail', icon: History }
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/admin/reviews" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-900/40">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-black text-white">
                  Fraud<span className="text-rose-500">Shield</span>
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-rose-300">
                  Security Operations Center
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {typeof link.count === 'number' && link.count > 0 && (
                      <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                        {link.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Admin Profile */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold text-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-200">{user?.name || 'Administrator'}</p>
                <p className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">
                  Analyst Role
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Sign out of Analyst Portal"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
