import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Wallet, Bell, LogOut, User, Users, History, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import AlertDrawer from '../customer/AlertDrawer';

const Navbar = () => {
  const { user, wallet, logout, isAdmin } = useAuth();
  const { unreadCount } = useAlerts();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = isAdmin
    ? [
        { to: '/admin/reviews', label: 'Review Queue', icon: AlertCircle },
        { to: '/admin/audit-logs', label: 'Audit Trail', icon: History }
      ]
    : [
        { to: '/dashboard', label: 'Overview', icon: Wallet },
        { to: '/beneficiaries', label: 'Beneficiaries', icon: Users },
        { to: '/transactions', label: 'Transactions', icon: History }
      ];

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link to={isAdmin ? '/admin/reviews' : '/dashboard'} className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-750 bg-clip-text text-transparent">
                    Fraud<span className="text-indigo-600">Shield</span>
                  </span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {isAdmin ? 'Analyst Portal' : 'Customer Portal'}
                  </span>
                </div>
              </Link>

              {/* Navigation Tabs */}
              {user && (
                <nav className="hidden md:flex items-center gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.to;
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            {/* Right Header Elements */}
            {user && (
              <div className="flex items-center gap-3">
                {/* Live Balance Chip (Customer Only) */}
                {!isAdmin && wallet && (
                  <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                    <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Available:</span>
                    <span className="text-emerald-600 font-bold">
                      {formatINR(wallet.availableBalance)}
                    </span>
                  </div>
                )}

                {/* Notifications Bell (Customer Only) */}
                {!isAdmin && (
                  <button
                    onClick={() => setIsAlertDrawerOpen(true)}
                    className="relative p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                    aria-label="View security alerts"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                )}

                {/* User Identity Chip */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out alert drawer */}
      {!isAdmin && (
        <AlertDrawer
          isOpen={isAlertDrawerOpen}
          onClose={() => setIsAlertDrawerOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
