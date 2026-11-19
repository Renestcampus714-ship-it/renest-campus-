import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const { firebaseUser, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLogout = async () => {
    setAccountOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
      isActive
        ? 'text-[#174C3C] border-b-2 border-[#174C3C]'
        : 'text-[#525C58] hover:text-[#242B29]'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#174C3C] text-[#F8F7F2]'
        : 'text-[#242B29] hover:bg-[#EDE9DF]'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[#DDD7C9] bg-[#F8F7F2]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-element brand wordmark */}
        <Link
          to="/"
          className="font-display text-xl font-bold tracking-tight text-[#174C3C] whitespace-nowrap shrink-0"
        >
          ReNest Campus
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6"
        >
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/marketplace" className={navLinkClass}>
            Marketplace
          </NavLink>
          <NavLink to="/sell" className={navLinkClass}>
            Sell an Item
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            My Dashboard
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
        </nav>

        {/* Zone 3: Single primary action or account menu */}
        <div className="flex items-center gap-3 shrink-0">
          {!firebaseUser ? (
            <Link
              to="/login"
              className="hidden md:inline-flex items-center justify-center rounded-lg bg-[#174C3C] px-4 py-2 text-xs font-semibold text-[#F8F7F2] hover:bg-[#2F8065] transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </Link>
          ) : (
            <div className="relative hidden md:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 rounded-lg border border-[#D4CEC0] bg-white px-3.5 py-2 text-xs font-semibold text-[#242B29] hover:border-[#174C3C] transition-colors whitespace-nowrap shrink-0"
              >
                <span className="max-w-[130px] truncate">
                  {profile?.fullName || firebaseUser.displayName || 'Account'}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#525C58]" aria-hidden="true" />
              </button>

              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-[#DDD7C9] bg-white py-1.5 shadow-lg"
                >
                  <Link
                    role="menuitem"
                    to="/dashboard"
                    onClick={() => setAccountOpen(false)}
                    className="block px-4 py-2 text-sm text-[#242B29] hover:bg-[#EDE9DF]"
                  >
                    My Dashboard
                  </Link>
                  <Link
                    role="menuitem"
                    to="/my-listings"
                    onClick={() => setAccountOpen(false)}
                    className="block px-4 py-2 text-sm text-[#242B29] hover:bg-[#EDE9DF]"
                  >
                    My Listings
                  </Link>
                  <Link
                    role="menuitem"
                    to="/enquiries"
                    onClick={() => setAccountOpen(false)}
                    className="block px-4 py-2 text-sm text-[#242B29] hover:bg-[#EDE9DF]"
                  >
                    My Enquiries
                  </Link>
                  <Link
                    role="menuitem"
                    to="/transactions"
                    onClick={() => setAccountOpen(false)}
                    className="block px-4 py-2 text-sm text-[#242B29] hover:bg-[#EDE9DF]"
                  >
                    Transactions
                  </Link>
                  <Link
                    role="menuitem"
                    to="/favourites"
                    onClick={() => setAccountOpen(false)}
                    className="block px-4 py-2 text-sm text-[#242B29] hover:bg-[#EDE9DF]"
                  >
                    Favourites
                  </Link>
                  <Link
                    role="menuitem"
                    to="/profile"
                    onClick={() => setAccountOpen(false)}
                    className="block px-4 py-2 text-sm text-[#242B29] hover:bg-[#EDE9DF]"
                  >
                    Profile
                  </Link>
                  <div className="my-1 border-t border-[#EDE9DF]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#DDD7C9] bg-white text-[#242B29] md:hidden"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Responsive mobile drawer */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-[#DDD7C9] bg-[#F8F7F2] px-4 py-4 md:hidden"
        >
          <div className="space-y-1">
            <NavLink to="/" end onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
              Home
            </NavLink>
            <NavLink to="/marketplace" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
              Marketplace
            </NavLink>
            <NavLink to="/sell" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
              Sell an Item
            </NavLink>
            <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
              My Dashboard
            </NavLink>
            {firebaseUser && (
              <>
                <NavLink to="/my-listings" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
                  My Listings
                </NavLink>
                <NavLink to="/enquiries" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
                  My Enquiries
                </NavLink>
                <NavLink to="/transactions" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
                  Transactions
                </NavLink>
                <NavLink to="/favourites" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
                  Favourites
                </NavLink>
                <NavLink to="/profile" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
                  Profile
                </NavLink>
              </>
            )}
            <NavLink to="/about" onClick={() => setMobileOpen(false)} className={mobileLinkClass}>
              About ReNest
            </NavLink>
          </div>

          <div className="mt-4 border-t border-[#DDD7C9] pt-4 flex flex-col gap-2">
            {firebaseUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg border border-[#174C3C] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#174C3C]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-[#174C3C] px-4 py-2.5 text-center text-sm font-semibold text-[#F8F7F2]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
