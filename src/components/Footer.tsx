import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Footer() {
  const { firebaseUser } = useAuth();

  return (
    <footer className="border-t border-[#DDD7C9] bg-[#EDE9DF]/65 text-[#242B29]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="font-display text-lg font-bold text-[#174C3C]">
              ReNest Campus
            </Link>
            <p className="mt-2 max-w-md text-sm text-[#525C58] leading-relaxed">
              Buy Smart. Sell Easy. Reuse Together. Built for students moving into or out of
              hostels, PGs, and rented rooms around DBS Global University and Dehradun
              accommodation clusters.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-wide text-[#242B29]">
              Marketplace
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[#525C58]">
              <li>
                <Link to="/marketplace" className="hover:text-[#174C3C] transition-colors">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link to="/sell" className="hover:text-[#174C3C] transition-colors">
                  Sell an Item
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#174C3C] transition-colors">
                  About ReNest
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold tracking-wide text-[#242B29]">
              Student Account
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[#525C58]">
              {firebaseUser ? (
                <>
                  <li>
                    <Link to="/dashboard" className="hover:text-[#174C3C] transition-colors">
                      My Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/enquiries" className="hover:text-[#174C3C] transition-colors">
                      My Enquiries
                    </Link>
                  </li>
                  <li>
                    <Link to="/transactions" className="hover:text-[#174C3C] transition-colors">
                      Transactions
                    </Link>
                  </li>
                  <li>
                    <Link to="/profile" className="hover:text-[#174C3C] transition-colors">
                      Profile Settings
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" className="hover:text-[#174C3C] transition-colors">
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="hover:text-[#174C3C] transition-colors">
                      Create Account
                    </Link>
                  </li>
                  <li>
                    <Link to="/forgot-password" className="hover:text-[#174C3C] transition-colors">
                      Reset Password
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-[#D8D1C2] pt-6 text-xs text-[#525C58] sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} ReNest Campus · Entrepreneurship &amp; Innovation Capstone, DBS Global University.
          </p>
          <p>Dehradun, Uttarakhand · MVP Campus Circular Exchange</p>
        </div>
      </div>
    </footer>
  );
}
