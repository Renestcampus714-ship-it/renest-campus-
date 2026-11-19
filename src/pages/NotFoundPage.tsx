import { Link } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';

export function NotFoundPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <p className="font-mono text-sm font-semibold text-[#2F8065]">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#242B29]">
          Page Not Found
        </h1>
        <p className="mt-3 text-sm text-[#525C58]">
          The ReNest Campus page you requested does not exist or may have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-lg bg-[#174C3C] px-5 py-2.5 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065]"
          >
            Back to Home
          </Link>
          <Link
            to="/marketplace"
            className="rounded-lg border border-[#174C3C] bg-white px-5 py-2.5 text-sm font-semibold text-[#174C3C] hover:bg-[#EDE9DF]"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
