import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import BrandLogo from '../BrandLogo';
import { 
  LayoutDashboard, 
  MapPin, 
  AlertTriangle, 
  Users, 
  Hammer, 
  BarChart3, 
  Map, 
  Shield, 
  Settings, 
  Bell, 
  LogOut, 
  User, 
  Menu, 
  X, 
  ChevronLeft,
  Building2,
  ClipboardList,
  Target,
  Beaker,
  Car
} from 'lucide-react';
import { Button, Avatar } from '../UI';

const navigationConfig = {
  citizen: [
    { path: '/citizen/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['citizen'] },
    { path: '/citizen/report', label: 'Report Pothole', icon: AlertTriangle, roles: ['citizen'] },
    { path: '/citizen/map', label: 'Map View', icon: Map, roles: ['citizen'] },
    { path: '/citizen/history', label: 'History', icon: ClipboardList, roles: ['citizen'] },
    { path: '/citizen/roadmap', label: 'AI Road Monitoring', icon: Car, roles: ['citizen'] },
  ],
  municipal: [
    { path: '/municipal/dashboard', label: 'Command Center', icon: LayoutDashboard, roles: ['municipal'] },
    { path: '/municipal/complaints', label: 'All Complaints', icon: ClipboardList, roles: ['municipal'] },
    { path: '/municipal/map', label: 'City Map', icon: Map, roles: ['municipal'] },
    { path: '/municipal/verification', label: 'Verification Center', icon: Target, roles: ['municipal'] },
    { path: '/municipal/verification-lab', label: 'Verification Lab', icon: Beaker, roles: ['municipal'] },
    { path: '/municipal/roadmap', label: 'AI Road Monitoring', icon: Car, roles: ['municipal'] },
    { path: '/municipal/analytics', label: 'Analytics', icon: BarChart3, roles: ['municipal'] },
    { path: '/municipal/contractors', label: 'Contractors', icon: Users, roles: ['municipal'] },
    { path: '/municipal/settings', label: 'Settings', icon: Settings, roles: ['municipal'] },
  ],
  contractor: [
    { path: '/contractor/dashboard', label: 'My Assignments', icon: LayoutDashboard, roles: ['contractor'] },
    { path: '/contractor/active', label: 'Active Repairs', icon: Hammer, roles: ['contractor'] },
    { path: '/contractor/submitted', label: 'Submitted', icon: ClipboardList, roles: ['contractor'] },
    { path: '/contractor/verified', label: 'Verified', icon: Shield, roles: ['contractor'] },
    { path: '/contractor/roadmap', label: 'AI Road Monitoring', icon: Car, roles: ['contractor'] },
  ],
};

const roleLabels = {
  citizen: 'Citizen',
  municipal: 'TMC Ward Officer',
  contractor: 'Lead Contractor',
};

const roleIcons = {
  citizen: User,
  municipal: Building2,
  contractor: Hammer,
};

function Sidebar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = navigationConfig[user?.role]?.filter(item => item.roles.includes(user.role)) || [];
  const RoleIcon = roleIcons[user?.role] || User;
  const roleLabel = roleLabels[user?.role] || 'User';

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setCollapsed(false);
    }
  }, []);

  useEffect(() => {
    const onToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener('toggle-sidebar', onToggle);
    return () => window.removeEventListener('toggle-sidebar', onToggle);
  }, []);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  const isActive = (path) => {
    if (path === '/municipal/dashboard' || path === '/citizen/dashboard' || path === '/contractor/dashboard') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-white border-r border-slate-200
          transition-all duration-300 ease-out flex flex-col
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200">
          {!collapsed && (
            <NavLink to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
              <BrandLogo variant="md" />
              <span className="font-bold text-lg text-slate-900">FixMyCity</span>
            </NavLink>
          )}
          {collapsed && (
            <NavLink to="/" className="flex items-center justify-center" onClick={() => setMobileOpen(false)}>
              <BrandLogo variant="md" />
            </NavLink>
          )}
          <button
            className={`lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors ${collapsed ? 'hidden' : ''}`}
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Main menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 transition-all duration-200
                  ${active
                    ? 'bg-cyan-50 text-cyan-700 font-semibold border-r-4 border-cyan-600 -mx-3 px-6 rounded-none'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg border border-transparent'
                  }
                  ${collapsed ? 'justify-center px-2 -mx-3' : ''}
                `}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span className="font-medium truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-slate-200">
            <div className="flex items-center gap-3 px-3 py-3 bg-slate-50 border border-slate-200 rounded-lg">
              <Avatar
                name={user?.name}
                size="md"
                status="online"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{roleLabels[user?.role] || user?.role}</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="absolute bottom-4 left-0 right-0 px-3">
            <button
              onClick={handleLogout}
              className="w-full p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5 mx-auto" />
            </button>
          </div>
        )}
      </aside>

      {mobileOpen && (
        <button
          className="fixed bottom-6 right-6 lg:hidden z-50"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        >
          <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-xl flex items-center justify-center">
            <X className="w-6 h-6 text-slate-600" />
          </div>
        </button>
      )}
    </>
  );
}

export default Sidebar;