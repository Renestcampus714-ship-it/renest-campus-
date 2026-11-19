import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { DashboardSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { subscribeSellerEnquiries } from '../services/enquiryService';
import {
  deleteListing,
  subscribeSellerListings,
  updateListingAvailability,
} from '../services/listingService';
import { subscribeSellerTransactions } from '../services/transactionService';
import type {
  AvailabilityStatus,
  Enquiry,
  Listing,
  TransactionRecord,
} from '../types/marketplace';
import { computeSellerMetrics, formatInr, formatShortDate } from '../utils/marketplaceLogic';

export function SellerDashboardPage() {
  const { firebaseUser, profile } = useAuth();
  const { showToast } = useToast();

  const [listings, setListings] = useState<Listing[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    let done = 0;
    const markDone = () => {
      done += 1;
      if (done >= 2) setLoading(false);
    };

    const unsubListings = subscribeSellerListings(firebaseUser.uid, (data) => {
      setListings(data);
      markDone();
    });
    const unsubEnq = subscribeSellerEnquiries(firebaseUser.uid, (data) => {
      setEnquiries(data);
      markDone();
    });
    const unsubTx = subscribeSellerTransactions(firebaseUser.uid, setTransactions);

    return () => {
      unsubListings();
      unsubEnq();
      unsubTx();
    };
  }, [firebaseUser]);

  const metrics = useMemo(
    () => computeSellerMetrics(listings, enquiries, transactions),
    [listings, enquiries, transactions]
  );

  const handleStatusChange = async (listingId: string, status: AvailabilityStatus) => {
    try {
      await updateListingAvailability(listingId, status);
      showToast('Status updated', 'success', `Listing marked as ${status}.`);
    } catch (error) {
      showToast(
        'Status update failed',
        'error',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  const handleDelete = async (listing: Listing) => {
    try {
      await deleteListing(listing.listingId);
      showToast('Listing deleted', 'success', `"${listing.title}" was removed.`);
    } catch (error) {
      showToast(
        'Could not delete listing',
        'error',
        error instanceof Error ? error.message : undefined
      );
    }
  };

  return (
    <DashboardLayout
      title="Seller Dashboard"
      subtitle={`Manage listings, buyer enquiries, and campus handovers for ${profile?.fullName || 'your account'}.`}
      action={
        <div className="flex flex-wrap gap-2">
          <Link
            to="/buyer-dashboard"
            className="rounded-lg border border-[#D4CEC0] bg-white px-4 py-2 text-xs font-semibold text-[#242B29] hover:bg-[#EDE9DF] whitespace-nowrap"
          >
            Switch to Buyer View
          </Link>
          <Link
            to="/sell"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#174C3C] px-4 py-2 text-xs font-semibold text-[#F8F7F2] hover:bg-[#2F8065] whitespace-nowrap"
          >
            <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Post New Item
          </Link>
        </div>
      }
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-8">
          {/* Seller KPI Strip */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-[#DDD7C9] bg-white p-4">
              <p className="text-xs text-[#525C58]">Total Listings</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-[#242B29] tabular-nums">
                {metrics.totalListings}
              </p>
            </div>
            <div className="rounded-xl border border-[#DDD7C9] bg-white p-4">
              <p className="text-xs text-[#525C58]">Active</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-[#174C3C] tabular-nums">
                {metrics.activeListings}
              </p>
            </div>
            <div className="rounded-xl border border-[#DDD7C9] bg-white p-4">
              <p className="text-xs text-[#525C58]">Reserved</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-amber-800 tabular-nums">
                {metrics.reservedListings}
              </p>
            </div>
            <div className="rounded-xl border border-[#DDD7C9] bg-white p-4">
              <p className="text-xs text-[#525C58]">Sold</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-[#242B29] tabular-nums">
                {metrics.soldListings}
              </p>
            </div>
            <div className="rounded-xl border border-[#DDD7C9] bg-white p-4">
              <p className="text-xs text-[#525C58]">Enquiries</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-[#242B29] tabular-nums">
                {metrics.totalEnquiriesReceived}
              </p>
            </div>
            <div className="rounded-xl border border-[#DDD7C9] bg-white p-4">
              <p className="text-xs text-[#525C58]">Pending Enquiries</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-[#174C3C] tabular-nums">
                {metrics.pendingEnquiries}
              </p>
            </div>
          </div>

          {/* Listing Management Table */}
          <section className="overflow-hidden rounded-xl border border-[#DDD7C9] bg-white">
            <div className="flex items-center justify-between border-b border-[#EDE9DF] px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-[#242B29]">
                Listing Management
              </h2>
              <Link
                to="/my-listings"
                className="text-xs font-semibold text-[#174C3C] hover:underline"
              >
                Open full inventory
              </Link>
            </div>

            {listings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-[#525C58]">
                  You have not posted any listings yet.
                </p>
                <Link
                  to="/sell"
                  className="mt-4 inline-flex rounded-lg bg-[#174C3C] px-4 py-2 text-xs font-semibold text-[#F8F7F2]"
                >
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#EDE9DF] bg-[#F8F7F2] text-xs font-semibold text-[#525C58]">
                    <tr>
                      <th className="px-6 py-3">Item</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Listed</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDE9DF]">
                    {listings.slice(0, 8).map((item) => (
                      <tr key={item.listingId} className="hover:bg-[#F8F7F2]/60">
                        <td className="px-6 py-3.5">
                          <Link
                            to={`/listing/${item.listingId}`}
                            className="font-semibold text-[#242B29] hover:text-[#174C3C]"
                          >
                            {item.title}
                          </Link>
                          <p className="text-xs text-[#525C58]">{item.category}</p>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-[#174C3C] tabular-nums whitespace-nowrap">
                          {formatInr(item.price)}
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            aria-label={`Change status for ${item.title}`}
                            value={item.availabilityStatus}
                            onChange={(e) =>
                              handleStatusChange(
                                item.listingId,
                                e.target.value as AvailabilityStatus
                              )
                            }
                            className="rounded-md border border-[#D4CEC0] bg-[#F8F7F2] px-2.5 py-1 text-xs font-medium text-[#242B29]"
                          >
                            <option value="Available">Available</option>
                            <option value="Reserved">Reserved</option>
                            <option value="Sold">Sold</option>
                            <option value="Transferred">Transferred</option>
                          </select>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#525C58] whitespace-nowrap">
                          {formatShortDate(item.createdAt)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              to={`/edit-listing/${item.listingId}`}
                              aria-label={`Edit ${item.title}`}
                              className="rounded-md border border-[#D4CEC0] p-1.5 text-[#242B29] hover:bg-[#EDE9DF]"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              aria-label={`Delete ${item.title}`}
                              className="rounded-md border border-red-200 p-1.5 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent Incoming Enquiries */}
          <section className="rounded-xl border border-[#DDD7C9] bg-white p-6">
            <div className="flex items-center justify-between border-b border-[#EDE9DF] pb-3">
              <h2 className="font-display text-lg font-semibold text-[#242B29]">
                Recent Buyer Enquiries
              </h2>
              <Link
                to="/enquiries"
                className="text-xs font-semibold text-[#174C3C] hover:underline"
              >
                Manage enquiries
              </Link>
            </div>
            {enquiries.length === 0 ? (
              <p className="mt-4 text-sm text-[#525C58]">
                No buyer enquiries received yet.
              </p>
            ) : (
              <ul className="divide-y divide-[#EDE9DF]">
                {enquiries.slice(0, 4).map((enq) => (
                  <li key={enq.enquiryId} className="flex flex-col justify-between gap-2 py-3.5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-semibold text-[#242B29]">
                        {enq.buyerName} <span className="font-normal text-[#525C58]">enquired on</span>{' '}
                        {enq.listingTitle}
                      </p>
                      <p className="mt-0.5 text-xs text-[#525C58] line-clamp-1">
                        &ldquo;{enq.message}&rdquo;
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#174C3C] shrink-0">
                      {enq.enquiryStatus}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
