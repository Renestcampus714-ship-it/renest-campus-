import { Link } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import type { Listing } from '../types/marketplace';
import { formatInr, formatShortDate } from '../utils/marketplaceLogic';
import { ListingImage } from './ProductArtwork';

interface ListingCardProps {
  listing: Listing;
  isFavourite?: boolean;
  onToggleFavourite?: (listingId: string) => void;
}

export function ListingCard({
  listing,
  isFavourite = false,
  onToggleFavourite,
}: ListingCardProps) {
  const statusTextColor =
    listing.availabilityStatus === 'Available'
      ? 'text-[#174C3C]'
      : listing.availabilityStatus === 'Reserved'
      ? 'text-amber-800'
      : 'text-[#525C58]';

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-[#DDD7C9] bg-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EDE9DF]">
        <Link to={`/listing/${listing.listingId}`} className="block h-full w-full">
          <ListingImage
            src={listing.images[0]}
            alt={listing.title}
            category={listing.category}
            className="transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>
        {onToggleFavourite && (
          <button
            type="button"
            onClick={() => onToggleFavourite(listing.listingId)}
            aria-label={
              isFavourite
                ? `Remove ${listing.title} from favourites`
                : `Save ${listing.title} to favourites`
            }
            className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
              isFavourite
                ? 'border-[#174C3C] bg-[#174C3C] text-[#F8F7F2]'
                : 'border-[#DDD7C9] bg-white/95 text-[#242B29] hover:border-[#174C3C] hover:text-[#174C3C]'
            }`}
          >
            <Heart
              className="h-4 w-4"
              fill={isFavourite ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-[#525C58]">
          <span className="truncate font-medium">{listing.category}</span>
          <span className={`shrink-0 font-semibold ${statusTextColor}`}>
            {listing.availabilityStatus}
          </span>
        </div>

        <Link
          to={`/listing/${listing.listingId}`}
          className="mt-1.5 font-display text-base font-semibold text-[#242B29] line-clamp-1 hover:text-[#174C3C] transition-colors"
        >
          {listing.title}
        </Link>

        <div className="mt-2 flex items-baseline justify-between gap-2">
          <span className="font-mono text-lg font-semibold text-[#174C3C] tabular-nums">
            {formatInr(listing.price)}
          </span>
          <span className="text-xs text-[#525C58]">{listing.condition}</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#525C58]">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#2F8065]" aria-hidden="true" />
          <span className="truncate">{listing.location}</span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#525C58]">
          <span className="truncate font-medium text-[#242B29]">{listing.sellerName}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{listing.sellerAccountStatus}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{formatShortDate(listing.createdAt)}</span>
        </div>

        <div className="mt-4 pt-3 border-t border-[#EDE9DF]">
          <Link
            to={`/listing/${listing.listingId}`}
            className="inline-flex w-full items-center justify-center rounded-lg border border-[#174C3C] px-4 py-2 text-xs font-semibold text-[#174C3C] hover:bg-[#174C3C] hover:text-[#F8F7F2] transition-colors whitespace-nowrap"
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
