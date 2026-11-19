import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Check } from 'lucide-react';
import { ListingCard } from '../components/ListingCard';
import { DashboardSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { subscribeBuyerEnquiries } from '../services/enquiryService';
import { fetchListingsByIds, subscribeActiveListings } from '../services/listingService';
import {
  markNotificationRead,
  subscribeUserNotifications,
} from '../services/notificationAndReportService';
import { subscribeBuyerTransactions } from '../services/transactionService';
import type {
  AppNotification,
  Enquiry,
  Listing,
  TransactionRecord,
} from '../types/marketplace';
import { computeBuyerMetrics, formatShortDate } from '../utils/marketplaceLogic';

export function BuyerDashboardPage() {
  const { firebaseUser, profile, toggleFavourite } = useAuth();
  const { showToast } = useToast();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Listing[]>([]);
  const [recommended, setRecommended] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    let activeCount = 0;
    const markDone = () => {
      activeCount += 1;
      if (activeCount >= 2) setLoading(false);
    };

    const unsubEnq = subscribeBuyerEnquiries(firebaseUser.uid, (data) => {
      setEnquiries(data);
      markDone();
    });
    const unsubTx = subscribeBuyerTransactions(firebaseUser.uid, (data) => {
      setTransactions(data);
      markDone();
    });
    const unsubNotif = subscribeUserNotifications(firebaseUser.uid, setNotifications);
    const unsubListings = subscribeActiveListings((items) => {
      const available = items.filter(
        (item) =>
          item.availabilityStatus === 'Available' && item.sellerId !== firebaseUser.uid
      );
      setRecommended(available.slice(0, 3));
    });

    return () => {
      unsubEnq();
      unsubTx();
      unsubNotif();
      unsubListings();
    };
  }, [firebaseUser]);

  useEffect(() => {
    const ids = profile?.recentlyViewedIds || [];
    if (ids.length === 0) {
      setRecentlyViewed([]);
      return;
    }
    fetchListingsByIds(ids.slice(0, 3))
      .then(setRecentlyViewed)
      .catch(() => setRecentlyViewed([]));
  }, [profile?.recentlyViewedIds]);

  const favouriteIds = profile?.favouriteIds || [];
  const metrics = useMemo(
    () => computeBuyerMetrics(favouriteIds, enquiries, transactions),
    [favouriteIds, enquiries, transactions]
  );

  const handleMarkRead = async (notificationId: string) => {
    try {
      await markNotificationRead(notificationId);
    } catch (err) {
      showToast('Could not update notification', 'error', err instanceof Error ? err.message : undefined);
    }
  };

  return (
    <DashboardLayout
      title={`Welcome back, ${profile?.fullName || 'Student'}`}
      subtitle="Track your saved items, active seller enquiries, and upcoming campus handovers."
      action={
        <div className="flex flex-wrap gap-2">
          <Link
            to="/seller-dashboard"
            className="rounded-lg border border-[#D4CEC0] bg-white px-4 py-2 text-xs font-semibold text-[#242B29] hover:bg-[#EDE9DF] whitespace-nowrap"
          >
            Switch to Seller View
          </Link>
          <Link
            to="/marketplace"
            className="rounded-lg bg-[#174C3C] px-4 py-2 text-xs font-semibold text-[#F8F7F2] hover:bg-[#2F8065] whitespace-nowrap"
          >
            Browse Marketplace
          </Link>
        </div>
      }
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-[#DDD7C9] bg-white p-5">
              <p className="text-xs font-medium text-[#525C58]">Favourite Items</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#174C3C] tabular-nums">
                {metrics.totalFavourites}
              </p>
            </div>
            <div className="rounded-xl border border-[#DDD7C9] bg-white p-5">
              <p className="text-xs font-medium text-[#525C58]">Active Enquiries</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#242B29] tabular-nums">
                {metrics.activeEnquiries}
              </p>
            </div>
            <div className="rounded-xl border border-[#DDD7C9] bg-white p-5">
              <p className="text-xs font-medium text-[#525C58]">Pending Responses</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#242B29] tabular-nums">
                {metrics.pendingResponses}
              </p>
            </div>
            <div className="rounded-xl border border-[#DDD7C9] bg-white p-5">
              <p className="text-xs font-medium text-[#525C58]">Active Handovers</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#174C3C] tabular-nums">
                {metrics.activeTransactions}
              </p>
            </div>
          </div>

          {/* Recent Activity / Notifications */}
          <section className="rounded-xl border border-[#DDD7C9] bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#EDE9DF] pb-3">
              <h2 className="font-display text-lg font-semibold text-[#242B29]">
                Recent Activity
              </h2>
              <Link
                to="/enquiries"
                className="text-xs font-semibold text-[#174C3C] hover:underline"
              >
                View all enquiries
              </Link>
            </div>

            {notifications.length === 0 && enquiries.length === 0 ? (
              <p className="mt-4 text-sm text-[#525C58]">
                No recent buyer activity yet. Browse the marketplace to save items or message sellers.
              </p>
            ) : (
              <ul className="divide-y divide-[#EDE9DF]">
                {notifications.slice(0, 5).map((note) => (
                  <li key={note.notificationId} className="flex items-start justify-between gap-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#174C3C]" aria-hidden="true" />
                      <div>
                        <p className={`text-sm ${note.isRead ? 'text-[#525C58]' : 'font-semibold text-[#242B29]'}`}>
                          {note.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[#525C58]">{note.message}</p>
                        <p className="mt-1 text-xs text-[#78827E]">
                          {formatShortDate(note.createdAt)}
                        </p>
                      </div>
                    </div>
                    {!note.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(note.notificationId)}
                        className="inline-flex items-center gap-1 rounded-md border border-[#D4CEC0] px-2.5 py-1 text-xs font-medium text-[#242B29] hover:bg-[#EDE9DF] shrink-0"
                      >
                        <Check className="h-3 w-3" aria-hidden="true" />
                        Mark read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recently Viewed */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-[#242B29]">
                Recently Viewed Listings
              </h2>
              <Link
                to="/favourites"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#174C3C] hover:underline"
              >
                Saved favourites ({metrics.totalFavourites})
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            {recentlyViewed.length === 0 ? (
              <div className="rounded-xl border border-[#DDD7C9] bg-white p-6 text-sm text-[#525C58]">
                Items you inspect in the marketplace will appear here for quick reference.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recentlyViewed.map((item) => (
                  <ListingCard
                    key={item.listingId}
                    listing={item}
                    isFavourite={favouriteIds.includes(item.listingId)}
                    onToggleFavourite={toggleFavourite}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Recommended Available Items */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-[#242B29]">
                Available Near Campus
              </h2>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#174C3C] hover:underline"
              >
                Explore all
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            {recommended.length === 0 ? (
              <div className="rounded-xl border border-[#DDD7C9] bg-white p-6 text-sm text-[#525C58]">
                No other available items are listed right now. Check back soon or list an item yourself.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recommended.map((item) => (
                  <ListingCard
                    key={item.listingId}
                    listing={item}
                    isFavourite={favouriteIds.includes(item.listingId)}
                    onToggleFavourite={toggleFavourite}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
