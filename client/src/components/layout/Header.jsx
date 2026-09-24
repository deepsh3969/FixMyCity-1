import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Breadcrumbs, Avatar } from '../UI';
import { Bell, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react';

function Header({ title, breadcrumbs, actions }) {
  const { user, logout } = useAuth();
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login', { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('app-search', { detail: searchQuery.trim() }));
  };

  const openComplaint = (complaintId) => {
    if (!complaintId || !user) return;
    navigate(`/${user.role}/complaint/${complaintId}`);
    setNotifOpen(false);
  };

  const settingsPath = user?.role === 'municipal' ? '/municipal/settings' : null;

  return (
    <header className="h-16 bg-[var(--panel)] backdrop-blur-xl border-b border-[var(--border-subtle)] flex items-center justify-between px-4 lg:px-8 z-30">
      <div className="lg:hidden flex items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
          className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      <div className="flex-1 lg:max-w-xl mx-auto lg:mx-0 lg:ml-8">
        <Breadcrumbs items={breadcrumbs} />
        {title && <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="hidden lg:block relative">
          <div className="relative">
            <input
              type="search"
              placeholder="Search complaints, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:border-[var(--accent-cyan)] transition-all"
              aria-label="Search complaints"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Submit search">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent-red)] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg shadow-xl py-1 z-[var(--z-floating)] animate-slide-down">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-[var(--accent-cyan)] hover:text-[var(--accent-cyan)] font-medium">Mark all read</button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-[var(--text-muted)]">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <button
                        key={notif._id}
                        onClick={() => {
                          markAsRead(notif._id);
                          if (notif.relatedComplaintId) openComplaint(notif.relatedComplaintId);
                          else setNotifOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-[var(--bg-card-hover)] transition-colors border-b border-[var(--border-subtle)] last:border-b-0 ${!notif.isRead ? 'bg-[var(--accent-cyan-dim)]' : ''}`}
                      >
                        <p className="font-medium text-sm text-[var(--text-primary)]">{notif.title}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{notif.message}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-card-hover)] transition-colors"
              aria-label="User menu"
            >
              <Avatar name={user?.name} size="sm" status="online" />
              <span className="hidden lg:block font-medium text-[var(--text-primary)]">{user?.name}</span>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] lg:hidden" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg shadow-xl py-1 z-[var(--z-floating)] animate-slide-down">
                <div className="px-4 py-2 border-b border-[var(--border-subtle)]">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{user?.name}</p>
                  <p className="text-xs text-[var(--text-muted)] capitalize">{user?.role}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate(`/${user.role}/dashboard`);
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] flex items-center gap-3"
                  >
                    <User className="w-4 h-4" /> Dashboard
                  </button>
                  {settingsPath && (
                    <button
                      onClick={() => {
                        navigate(settingsPath);
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] flex items-center gap-3"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                  )}
                  <hr className="my-1 border-[var(--border-subtle)]" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-[var(--accent-red)] hover:bg-[var(--accent-red-dim)] flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export default Header;
