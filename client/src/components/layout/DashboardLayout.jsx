import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BrandLogo from '../BrandLogo';
import { Button } from '../UI';

export function DashboardLayout({ title, breadcrumbs, actions, children }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header title={title} breadcrumbs={breadcrumbs} actions={actions} />
        <main className="flex-1 p-4 lg:p-6 xl:p-8 overflow-auto">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}

export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
        <NavLink to="/" className="flex items-center gap-2">
          <BrandLogo variant="md" />
          <span className="font-bold text-lg text-slate-900">FixMyCity</span>
        </NavLink>
        <div className="flex items-center gap-4">
          <NavLink to="/login" className="text-slate-600 hover:text-slate-900 transition-colors font-medium">Login</NavLink>
          <NavLink to="/register?role=citizen">
            <Button size="sm">Report a Pothole</Button>
          </NavLink>
        </div>
      </header>
      <main className="flex-1">{children ?? <Outlet />}</main>
      <footer className="py-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          FixMyCity &copy; 2026 — AI-Powered Proof-of-Repair Verification for Smart Cities
        </div>
      </footer>
    </div>
  );
}