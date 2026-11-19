import type { Timestamp } from 'firebase/firestore';

export type AccommodationType =
  | 'Hostel'
  | 'PG'
  | 'Rented Accommodation'
  | 'Other';

export type AccountStatus = 'Registered User' | 'Email Verified';

export type MarketplaceCategory =
  | 'Study tables and furniture'
  | 'Electronics and appliances'
  | 'Books and academic materials'
  | 'Storage and room essentials'
  | 'Kitchen essentials'
  | 'Hostel accessories'
  | 'Other student essentials';

export type ItemCondition =
  | 'Brand New'
  | 'Like New'
  | 'Good'
  | 'Fair'
  | 'Needs Repair';

export type AvailabilityStatus =
  | 'Available'
  | 'Reserved'
  | 'Sold'
  | 'Transferred'
  | 'Removed';

export type ListingStatus = 'Active' | 'Removed';

export type EnquiryStatus =
  | 'Pending'
  | 'Responded'
  | 'Accepted'
  | 'Declined'
  | 'Closed';

export type TransactionStatus =
  | 'Requested'
  | 'Accepted'
  | 'Handover Scheduled'
  | 'Completed'
  | 'Cancelled';

export type NotificationType = 'enquiry' | 'transaction' | 'listing' | 'system';

export type ReportReason =
  | 'Inappropriate content'
  | 'Misleading description'
  | 'Prohibited item'
  | 'Suspected spam'
  | 'Unavailable item';

export type ReportStatus = 'Open' | 'Under Review' | 'Resolved';

export type TimestampLike = Timestamp | Date | { seconds: number; nanoseconds?: number } | string | null | undefined;

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  collegeName: string;
  accommodationType: AccommodationType;
  phone?: string;
  photoURL?: string;
  emailVerified: boolean;
  accountStatus: AccountStatus;
  favouriteIds: string[];
  recentlyViewedIds: string[];
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface Listing {
  listingId: string;
  sellerId: string;
  sellerName: string;
  sellerCollege: string;
  sellerAccountStatus: AccountStatus;
  title: string;
  description: string;
  category: MarketplaceCategory;
  price: number;
  condition: ItemCondition;
  images: string[];
  location: string;
  availabilityStatus: AvailabilityStatus;
  listingStatus: ListingStatus;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface Enquiry {
  enquiryId: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  message: string;
  sellerReply?: string;
  preferredHandoverLocation?: string;
  enquiryStatus: EnquiryStatus;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface TransactionRecord {
  transactionId: string;
  listingId: string;
  enquiryId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  itemTitle: string;
  itemPrice: number;
  serviceFee: number;
  transactionStatus: TransactionStatus;
  handoverLocation: string;
  handoverWindow?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface AppNotification {
  notificationId: string;
  userId: string;
  actorId: string;
  title: string;
  message: string;
  type: NotificationType;
  linkPath?: string;
  isRead: boolean;
  createdAt: TimestampLike;
}

export interface ListingReport {
  reportId: string;
  listingId: string;
  reportedBy: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  createdAt: TimestampLike;
}

export interface CategoryMeta {
  categoryId: string;
  name: MarketplaceCategory;
  description: string;
  displayOrder: number;
}

export type SortOption = 'newest' | 'price_asc' | 'price_desc';

export interface MarketplaceFilterState {
  search: string;
  category: MarketplaceCategory | 'All';
  condition: ItemCondition | 'All';
  location: string;
  minPrice: string;
  maxPrice: string;
  availability: 'ActiveOnly' | 'AvailableOnly';
  sortBy: SortOption;
}
