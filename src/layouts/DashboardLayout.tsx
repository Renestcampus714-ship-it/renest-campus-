import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ArrowLeftRight,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Package,
  PlusCircle,
  Store,
  UserCircle,
} from 'lucide-react';
import { MainLayout } from './MainLayout';

const sidebarLinks = [
  { to: '/buyer-dashboard', label: 'Buyer Dashboard', icon: LayoutDashboard },
  { to: '/seller-dashboard', label: 'Seller Dashboard', icon: Store },
  { to: '/my-listings', label: 'My Listings', icon: Package },
  { to: '/enquiries', label: 'My Enquiries', icon: MessageSquare },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/favourites', label: 'Favourites', icon: Heart },
  { to: '/sell', label: 'Sell an Item', icon: PlusCircle },
  { to: '/profile', label: 'Profile', icon: UserCircle },
] as const;

export function DashboardLayout({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Workspace sidebar */}
          <aside className="lg:w-60 shrink-0">
            <nav
              aria-label="Workspace navigation"
              className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
            >
              {sidebarLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `inline-flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                        isActive
                          ? 'bg-[#174C3C] text-[#F8F7F2]'
                          : 'border border-transparent text-[#525C58] hover:bg-[#EDE9DF] hover:text-[#242B29]'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>

          {/* Main dashboard content */}
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#DDD7C9] pb-5 sm:flex-row sm:items-end">
              <div>
                <h1 className="font-display text-2xl font-bold text-[#242B29] sm:text-3xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-[#525C58]">{subtitle}</p>
                )}
              </div>
              {action && <div className="shrink-0">{action}</div>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
