import { ALLOWED_IMAGE_MIME_TYPES, VALIDATION_LIMITS } from '../constants/marketplace';
import type {
  Enquiry,
  Listing,
  MarketplaceFilterState,
  TimestampLike,
  TransactionRecord,
} from '../types/marketplace';

export function formatInr(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.max(0, amount));
}

export function toMillis(ts: TimestampLike): number {
  if (!ts) return 0;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof ts === 'object' && 'toMillis' in ts && typeof ts.toMillis === 'function') {
    return ts.toMillis();
  }
  if (typeof ts === 'object' && 'seconds' in ts && typeof ts.seconds === 'number') {
    return ts.seconds * 1000;
  }
  return 0;
}

export function formatShortDate(ts: TimestampLike): string {
  const ms = toMillis(ts);
  if (!ms) return 'Just now';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(ms));
}

export function filterAndSortListings(
  listings: readonly Listing[],
  filters: MarketplaceFilterState
): Listing[] {
  const queryText = filters.search.trim().toLowerCase();
  const locationText = filters.location.trim().toLowerCase();
  const minPrice = filters.minPrice !== '' ? Number(filters.minPrice) : null;
  const maxPrice = filters.maxPrice !== '' ? Number(filters.maxPrice) : null;

  const filtered = listings.filter((item) => {
    if (item.listingStatus !== 'Active') return false;
    if (item.availabilityStatus === 'Removed') return false;
    if (filters.availability === 'AvailableOnly' && item.availabilityStatus !== 'Available') {
      return false;
    }

    if (queryText) {
      const haystack = `${item.title} ${item.description} ${item.category} ${item.location} ${item.sellerCollege}`.toLowerCase();
      if (!haystack.includes(queryText)) return false;
    }

    if (filters.category !== 'All' && item.category !== filters.category) {
      return false;
    }

    if (filters.condition !== 'All' && item.condition !== filters.condition) {
      return false;
    }

    if (locationText && !item.location.toLowerCase().includes(locationText)) {
      return false;
    }

    if (minPrice !== null && Number.isFinite(minPrice) && item.price < minPrice) {
      return false;
    }

    if (maxPrice !== null && Number.isFinite(maxPrice) && item.price > maxPrice) {
      return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    if (filters.sortBy === 'price_asc') return a.price - b.price;
    if (filters.sortBy === 'price_desc') return b.price - a.price;
    return toMillis(b.createdAt) - toMillis(a.createdAt);
  });
}

export interface BuyerDashboardMetrics {
  totalFavourites: number;
  activeEnquiries: number;
  pendingResponses: number;
  activeTransactions: number;
}

export interface SellerDashboardMetrics {
  totalListings: number;
  activeListings: number;
  reservedListings: number;
  soldListings: number;
  totalEnquiriesReceived: number;
  pendingEnquiries: number;
  completedTransactions: number;
}

export function computeBuyerMetrics(
  favouriteIds: readonly string[],
  sentEnquiries: readonly Enquiry[],
  buyerTransactions: readonly TransactionRecord[]
): BuyerDashboardMetrics {
  const activeEnquiries = sentEnquiries.filter(
    (e) => e.enquiryStatus !== 'Closed' && e.enquiryStatus !== 'Declined'
  ).length;
  const pendingResponses = sentEnquiries.filter(
    (e) => e.enquiryStatus === 'Pending'
  ).length;
  const activeTransactions = buyerTransactions.filter(
    (t) => t.transactionStatus !== 'Completed' && t.transactionStatus !== 'Cancelled'
  ).length;

  return {
    totalFavourites: favouriteIds.length,
    activeEnquiries,
    pendingResponses,
    activeTransactions,
  };
}

export function computeSellerMetrics(
  sellerListings: readonly Listing[],
  receivedEnquiries: readonly Enquiry[],
  sellerTransactions: readonly TransactionRecord[]
): SellerDashboardMetrics {
  const nonRemoved = sellerListings.filter((l) => l.listingStatus !== 'Removed');
  return {
    totalListings: nonRemoved.length,
    activeListings: nonRemoved.filter(
      (l) => l.listingStatus === 'Active' && l.availabilityStatus === 'Available'
    ).length,
    reservedListings: nonRemoved.filter((l) => l.availabilityStatus === 'Reserved').length,
    soldListings: nonRemoved.filter(
      (l) => l.availabilityStatus === 'Sold' || l.availabilityStatus === 'Transferred'
    ).length,
    totalEnquiriesReceived: receivedEnquiries.length,
    pendingEnquiries: receivedEnquiries.filter((e) => e.enquiryStatus === 'Pending').length,
    completedTransactions: sellerTransactions.filter(
      (t) => t.transactionStatus === 'Completed'
    ).length,
  };
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(
  file: { type: string; size: number; name: string },
  currentCount: number
): ImageValidationResult {
  if (currentCount >= VALIDATION_LIMITS.maxImagesPerListing) {
    return {
      valid: false,
      error: `You can upload at most ${VALIDATION_LIMITS.maxImagesPerListing} photos per listing.`,
    };
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: `"${file.name}" is not a supported image format. Use JPG, PNG, or WebP.`,
    };
  }

  if (file.size > VALIDATION_LIMITS.maxImageSizeBytes) {
    return {
      valid: false,
      error: `"${file.name}" exceeds the 5 MB image size limit.`,
    };
  }

  return { valid: true };
}

export function sanitizeString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}
