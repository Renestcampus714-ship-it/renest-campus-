import type {
  AccommodationType,
  CategoryMeta,
  ItemCondition,
  MarketplaceCategory,
  ReportReason,
} from '../types/marketplace';

export const MVP_SERVICE_FEE_INR = 40;

export const VALIDATION_LIMITS = {
  idMaxLength: 128,
  idPattern: /^[a-zA-Z0-9_-]+$/,
  fullNameMin: 2,
  fullNameMax: 100,
  emailMin: 5,
  emailMax: 150,
  collegeNameMin: 2,
  collegeNameMax: 150,
  phoneMax: 20,
  photoUrlMax: 500,
  titleMin: 3,
  titleMax: 120,
  descriptionMin: 10,
  descriptionMax: 2000,
  locationMin: 2,
  locationMax: 120,
  maxPrice: 500000,
  maxImagesPerListing: 5,
  maxImageSizeBytes: 5 * 1024 * 1024,
  messageMin: 3,
  messageMax: 1000,
  handoverLocationMin: 2,
  handoverLocationMax: 150,
  handoverWindowMax: 120,
  reportDescriptionMin: 5,
  reportDescriptionMax: 1000,
  maxFavourites: 100,
  maxRecentlyViewed: 20,
} as const;

export const MARKETPLACE_CATEGORIES: readonly CategoryMeta[] = [
  {
    categoryId: 'study-furniture',
    name: 'Study tables and furniture',
    description: 'Foldable desks, study chairs, bedside tables, and lamps.',
    displayOrder: 1,
  },
  {
    categoryId: 'electronics-appliances',
    name: 'Electronics and appliances',
    description: 'Electric kettles, induction cooktops, fans, monitors, and audio.',
    displayOrder: 2,
  },
  {
    categoryId: 'books-academic',
    name: 'Books and academic materials',
    description: 'MBA, BBA, B.Tech textbooks, calculators, and reference notes.',
    displayOrder: 3,
  },
  {
    categoryId: 'storage-essentials',
    name: 'Storage and room essentials',
    description: 'Wardrobe organizers, racks, laundry hampers, and bedding.',
    displayOrder: 4,
  },
  {
    categoryId: 'kitchen-essentials',
    name: 'Kitchen essentials',
    description: 'Tiffins, cookware, flasks, induction-safe pans, and utensils.',
    displayOrder: 5,
  },
  {
    categoryId: 'hostel-accessories',
    name: 'Hostel accessories',
    description: 'Extension boards, study lights, locks, buckets, and mirrors.',
    displayOrder: 6,
  },
  {
    categoryId: 'other-essentials',
    name: 'Other student essentials',
    description: 'Bicycles, umbrellas, backpacks, and move-out room bundles.',
    displayOrder: 7,
  },
] as const;

export const CATEGORY_NAMES: readonly MarketplaceCategory[] = MARKETPLACE_CATEGORIES.map(
  (c) => c.name
);

export const ITEM_CONDITIONS: readonly ItemCondition[] = [
  'Brand New',
  'Like New',
  'Good',
  'Fair',
  'Needs Repair',
] as const;

export const ACCOMMODATION_TYPES: readonly AccommodationType[] = [
  'Hostel',
  'PG',
  'Rented Accommodation',
  'Other',
] as const;

export const DEHRADUN_LOCATIONS: readonly string[] = [
  'DBS Global University Campus (Selaqui)',
  'Selaqui Hostel & PG Cluster',
  'Prem Nagar',
  'Sudhowala',
  'Bidholi',
  'Nanda Ki Chowki',
  'Pondha',
  'Rajpur Road / Jakhan',
  'Other Dehradun Location',
] as const;

export const REPORT_REASONS: readonly ReportReason[] = [
  'Inappropriate content',
  'Misleading description',
  'Prohibited item',
  'Suspected spam',
  'Unavailable item',
] as const;

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;
