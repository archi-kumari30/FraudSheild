import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Home,
  ShieldCheck,
  Shield,
  LayoutDashboard,
  Wallet,
  Send,
  Users,
  History,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import DepositModal from '../components/customer/DepositModal';
import AlertDrawer from '../components/customer/AlertDrawer';

const CustomerLayout = () => {
  const { user, wallet, logout } = useAuth();
  const { unreadCount } = useAlerts();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/wallet', label: 'Wallet', icon: Wallet },
    { to: '/send-money', label: 'Send Money', icon: Send },
    { to: '/beneficiaries', label: 'Beneficiaries', icon: Users },
    { to: '/transactions', label: 'Transactions', icon: History },
    {
      to: '/alerts',
      label: 'Security Alerts',
      icon: Bell,
      badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : null
    },
    { to: '/security', label: 'Security Dashboard', icon: ShieldCheck },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <div className="min-h-screen bg-[#EDF6F1] text-[#17211D] flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FAFCFA] text-[#17211D] sticky top-0 z-40 border-b border-[#D4E2DC]">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#285C4D] text-white flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-semibold text-[#17211D] tracking-tight">FraudShield</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAlertDrawerOpen(true)}
            className="relative p-2 rounded-lg text-[#5A6E65] hover:text-[#17211D] hover:bg-[#EDF6F1]"
            aria-label="Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#B65D59] text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-[#5A6E65] hover:text-[#17211D] hover:bg-[#EDF6F1]"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Left Sidebar */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 w-64 bg-[#FAFCFA] border-r border-[#D4E2DC] text-[#17211D] flex flex-col justify-between transition-transform duration-200 md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Logo Header */}
          <div className="p-5 border-b border-[#D4E2DC] flex items-center justify-between bg-[#F4F8F5]">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#285C4D] text-white flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-base text-[#17211D] tracking-tight block">
                  FraudShield
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#285C4D] block">
                  Customer Portal
                </span>
              </div>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-[#5A6E65] hover:text-[#17211D]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Wallet Balance Snapshot */}
          <div className="p-4 mx-3 my-3 rounded-lg bg-[#EDF6F1] border border-[#D4E2DC]">
            <div className="flex items-center justify-between text-[11px] text-[#5A6E65] font-medium">
              <span>Available Balance</span>
              <button
                onClick={() => setIsDepositOpen(true)}
                className="text-[#285C4D] hover:text-[#1d453a] font-semibold flex items-center gap-1 text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Deposit</span>
              </button>
            </div>
            <div className="text-xl font-bold text-[#17211D] mt-1 font-mono">
              {formatINR(wallet?.availableBalance)}
            </div>

            {wallet?.heldBalance > 0 && (
              <div className="mt-2.5 pt-2 border-t border-[#D4E2DC] flex items-center justify-between text-[11px]">
                <span className="text-[#946625] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Held in Escrow:
                </span>
                <span className="font-semibold text-[#946625] font-mono">
                  {formatINR(wallet?.heldBalance)}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#EAF3EF] text-[#285C4D] font-semibold border-l-2 border-[#285C4D]'
                      : 'text-[#5A6E65] hover:text-[#17211D] hover:bg-[#EDF6F1]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#285C4D]' : 'text-[#5A6E65]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF4EB] text-[#946625] border border-[#EAD7BA]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Logout Footer */}
          <div className="p-4 border-t border-[#D4E2DC] bg-[#F4F8F5]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-[#DCEBE4] text-[#285C4D] flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-[#17211D] truncate">
                    {user?.name || 'Customer Account'}
                  </div>
                  <div className="text-[10px] text-[#5A6E65] truncate font-mono">
                    {user?.email}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-[#5A6E65] hover:text-[#8C3E3A] hover:bg-[#FBF0EF] transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Reusable Deposit Modal */}
      <DepositModal isOpen={isDepositOpen} onClose={() => setIsDepositOpen(false)} />

      {/* Alerts Drawer */}
      <AlertDrawer isOpen={isAlertDrawerOpen} onClose={() => setIsAlertDrawerOpen(false)} />
    </div>
  );
};

export default CustomerLayout;
