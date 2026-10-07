import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Home,
  Shield,
  LayoutDashboard,
  History,
  AlertTriangle,
  Bell,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Scale
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingDisputesCount, setPendingDisputesCount] = useState(0);

  useEffect(() => {
    axiosClient
      .get('/admin/reviews')
      .then((res) => {
        if (res.success && Array.isArray(res.data?.reviews)) {
          setPendingCount(res.data.reviews.length);
        }
      })
      .catch((err) => console.warn('Could not fetch review count:', err.message));

    axiosClient
      .get('/admin/disputes')
      .then((res) => {
        if (res.success && Array.isArray(res.data?.disputes)) {
          const actionable = res.data.disputes.filter((d) =>
            ['OPEN', 'RECIPIENT_RESPONDED'].includes(d.status)
          );
          setPendingDisputesCount(actionable.length);
        }
      })
      .catch((err) => console.warn('Could not fetch dispute count:', err.message));
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/transactions', label: 'Transactions', icon: History },
    {
      to: '/admin/reviews',
      label: 'Review Queue',
      icon: AlertTriangle,
      badge: pendingCount > 0 ? pendingCount : null
    },
    {
      to: '/admin/disputes',
      label: 'Disputes Queue',
      icon: Scale,
      badge: pendingDisputesCount > 0 ? pendingDisputesCount : null
    },
    { to: '/admin/alerts', label: 'Fraud Alerts', icon: Bell },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
    { to: '/admin/settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#EDF6F1] text-[#17211D] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FAFCFA] text-[#17211D] sticky top-0 z-40 border-b border-[#D4E2DC]">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#285C4D] text-white flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-[#17211D] text-sm tracking-tight block">FraudShield</span>
            <span className="text-[10px] text-[#285C4D] uppercase font-bold tracking-wider">Operations Console</span>
          </div>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg text-[#5A6E65] hover:text-[#17211D] hover:bg-[#EDF6F1]"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Admin Operations Sidebar */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 w-64 bg-[#FAFCFA] border-r border-[#D4E2DC] text-[#17211D] flex flex-col justify-between transition-transform duration-200 md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Operational Badge */}
          <div className="p-5 border-b border-[#D4E2DC] flex items-center justify-between bg-[#F4F8F5]">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#285C4D] text-white flex items-center justify-center shadow-xs">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-base text-[#17211D] tracking-tight block">
                  FraudShield
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#285C4D] block">
                  Fraud Operations
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

          {/* Review Queue Alert Callout */}
          <div className="p-3.5 mx-3 my-3 rounded-lg bg-[#FAF4EB] border border-[#EAD7BA]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#946625] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#C89445]" />
                Review Queue
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C89445] text-white">
                {pendingCount} Pending
              </span>
            </div>
            <p className="text-[11px] text-[#946625]/80 mt-1">
              Transactions flagged for manual human determination.
            </p>
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

          {/* Admin Profile Footer */}
          <div className="p-4 border-t border-[#D4E2DC] bg-[#F4F8F5]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-[#285C4D] text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                  {user?.name ? user.name.charAt(0) : 'A'}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-[#17211D] truncate">
                    {user?.name || 'Security Analyst'}
                  </div>
                  <div className="text-[10px] text-[#285C4D] font-bold uppercase tracking-wider">
                    Role: {user?.role || 'admin'}
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
    </div>
  );
};

export default AdminLayout;
