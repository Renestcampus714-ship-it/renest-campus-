import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { ListingImage } from '../components/ProductArtwork';
import { DashboardSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import {
  deleteListing,
  subscribeSellerListings,
  updateListingAvailability,
} from '../services/listingService';
import type { AvailabilityStatus, Listing } from '../types/marketplace';
import { formatInr, formatShortDate } from '../utils/marketplaceLogic';

export function MyListingsPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | AvailabilityStatus>('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = subscribeSellerListings(firebaseUser.uid, (data) => {
      setListings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [firebaseUser]);

  const filtered = listings.filter(
    (item) => statusFilter === 'All' || item.availabilityStatus === statusFilter
  );

  const handleStatusChange = async (listingId: string, nextStatus: AvailabilityStatus) => {
    try {
      await updateListingAvailability(
        listingId,
        nextStatus,
        nextStatus === 'Removed' ? 'Removed' : 'Active'
      );
      showToast('Availability updated', 'success', `Item marked as ${nextStatus}.`);
    } catch (error) {
      showToast('Update failed', 'error', error instanceof Error ? error.message : undefined);
    }
  };

  const handleConfirmDelete = async (listing: Listing) => {
    try {
      await deleteListing(listing.listingId);
      setConfirmDeleteId(null);
      showToast('Listing deleted', 'success', `"${listing.title}" removed from Firestore.`);
    } catch (error) {
      showToast('Delete failed', 'error', error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <DashboardLayout
      title="My Listings"
      subtitle="View, edit, mark reserved or sold, and manage your posted items."
      action={
        <Link
          to="/sell"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#174C3C] px-4 py-2 text-xs font-semibold text-[#F8F7F2] hover:bg-[#2F8065] whitespace-nowrap"
        >
          <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Post New Item
        </Link>
      }
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {(['All', 'Available', 'Reserved', 'Sold', 'Transferred'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-[#174C3C] text-[#F8F7F2]'
                    : 'border border-[#DDD7C9] bg-white text-[#525C58] hover:text-[#242B29]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-[#DDD7C9] bg-white p-10 text-center">
              <p className="text-sm text-[#525C58]">
                {listings.length === 0
                  ? 'You have not posted any items yet.'
                  : `No listings with status "${statusFilter}".`}
              </p>
              <Link
                to="/sell"
                className="mt-4 inline-flex rounded-lg bg-[#174C3C] px-5 py-2.5 text-sm font-semibold text-[#F8F7F2]"
              >
                Sell an Item
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((item) => (
                <div
                  key={item.listingId}
                  className="flex flex-col gap-4 rounded-xl border border-[#DDD7C9] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <Link
                      to={`/listing/${item.listingId}`}
                      className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-[#EDE9DF]"
                    >
                      <ListingImage
                        src={item.images[0]}
                        alt={item.title}
                        category={item.category}
                      />
                    </Link>
                    <div className="min-w-0">
                      <Link
                        to={`/listing/${item.listingId}`}
                        className="font-display text-base font-semibold text-[#242B29] hover:text-[#174C3C]"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-[#525C58]">
                        {item.category} · {item.condition} · {item.location}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs">
                        <span className="font-mono text-sm font-bold text-[#174C3C] tabular-nums">
                          {formatInr(item.price)}
                        </span>
                        <span className="text-[#525C58]">
                          Listed {formatShortDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <select
                      aria-label={`Availability status for ${item.title}`}
                      value={item.availabilityStatus}
                      onChange={(e) =>
                        handleStatusChange(
                          item.listingId,
                          e.target.value as AvailabilityStatus
                        )
                      }
                      className="rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3 py-2 text-xs font-semibold text-[#242B29]"
                    >
                      <option value="Available">Available</option>
                      <option value="Reserved">Reserved</option>
                      <option value="Sold">Sold</option>
                      <option value="Transferred">Transferred</option>
                    </select>

                    <Link
                      to={`/edit-listing/${item.listingId}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#D4CEC0] bg-white px-3 py-2 text-xs font-semibold text-[#242B29] hover:bg-[#EDE9DF]"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      Edit
                    </Link>

                    {confirmDeleteId === item.listingId ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(item)}
                          className="rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-[#D4CEC0] bg-white px-2.5 py-2 text-xs font-medium text-[#525C58]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.listingId)}
                        aria-label={`Delete ${item.title}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
