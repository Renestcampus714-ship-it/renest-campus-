import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { ListingCard } from '../components/ListingCard';
import { ListingGridSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { fetchListingsByIds } from '../services/listingService';
import type { Listing } from '../types/marketplace';

export function FavouritesPage() {
  const { profile, toggleFavourite } = useAuth();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const favouriteIds = profile?.favouriteIds || [];

  useEffect(() => {
    if (favouriteIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchListingsByIds(favouriteIds)
      .then((fetched) => {
        if (!cancelled) {
          setItems(fetched);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [favouriteIds]);

  return (
    <DashboardLayout
      title="Saved Favourites"
      subtitle="Shortlist room essentials you want to compare or pick up before move-in."
    >
      {loading ? (
        <ListingGridSkeleton count={3} />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-[#DDD7C9] bg-white p-10 text-center">
          <Heart className="mx-auto h-8 w-8 text-[#525C58]" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl font-semibold text-[#242B29]">
            No favourite items saved yet
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[#525C58]">
            Click the heart button on any listing card or product page to save it here.
          </p>
          <Link
            to="/marketplace"
            className="mt-5 inline-flex rounded-lg bg-[#174C3C] px-5 py-2.5 text-sm font-semibold text-[#F8F7F2]"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ListingCard
              key={item.listingId}
              listing={item}
              isFavourite={favouriteIds.includes(item.listingId)}
              onToggleFavourite={toggleFavourite}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
