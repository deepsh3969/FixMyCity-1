import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BrandLogo from '../BrandLogo';
import { Button } from '../UI';

export function DashboardLayout({ title, breadcrumbs, actions, children }) {
  return (
    <div className="min-h-screen flex bg-transparent">
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
    <div className="min-h-screen flex flex-col bg-transparent">
      <header className="h-16 bg-[var(--panel)] backdrop-blur-xl border-b border-[var(--border-subtle)] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
        <NavLink to="/" className="flex items-center gap-2 group">
          <BrandLogo variant="md" />
          <span className="font-bold text-lg text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors">FixMyCity</span>
        </NavLink>
        <div className="flex items-center gap-4">
          <NavLink to="/login" className="text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors font-medium">Login</NavLink>
          <NavLink to="/register?role=citizen">
            <Button size="sm" className="btn-glow">Report a Pothole</Button>
          </NavLink>
        </div>
      </header>
      <main className="flex-1">{children ?? <Outlet />}</main>
      <footer className="py-8 border-t border-[var(--border-subtle)] bg-[var(--panel)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 text-center text-[var(--text-muted)] text-sm">
          FixMyCity &copy; 2026 — AI-Powered Proof-of-Repair Verification for Smart Cities
        </div>
      </footer>
    </div>
  );
}