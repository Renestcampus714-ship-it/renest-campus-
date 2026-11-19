import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBuyerMetrics,
  computeSellerMetrics,
  filterAndSortListings,
  formatInr,
  validateImageFile,
} from './marketplaceLogic';
import type { Enquiry, Listing, MarketplaceFilterState, TransactionRecord } from '../types/marketplace';

const baseListings: Listing[] = [
  {
    listingId: 'l1',
    sellerId: 's1',
    sellerName: 'Aarav Sharma',
    sellerCollege: 'DBS Global University',
    sellerAccountStatus: 'Email Verified',
    title: 'Wooden Study Desk & Chair',
    description: 'Compact wooden desk with smooth drawers, great for hostel rooms.',
    category: 'Study tables and furniture',
    price: 2200,
    condition: 'Like New',
    images: [],
    location: 'Selaqui Hostel & PG Cluster',
    availabilityStatus: 'Available',
    listingStatus: 'Active',
    createdAt: '2026-11-10T10:00:00Z',
    updatedAt: '2026-11-10T10:00:00Z',
  },
  {
    listingId: 'l2',
    sellerId: 's1',
    sellerName: 'Aarav Sharma',
    sellerCollege: 'DBS Global University',
    sellerAccountStatus: 'Email Verified',
    title: 'Prestige Electric Kettle 1.5L',
    description: 'Clean stainless steel electric kettle used for one semester.',
    category: 'Electronics and appliances',
    price: 650,
    condition: 'Good',
    images: [],
    location: 'Prem Nagar',
    availabilityStatus: 'Reserved',
    listingStatus: 'Active',
    createdAt: '2026-11-12T10:00:00Z',
    updatedAt: '2026-11-12T10:00:00Z',
  },
  {
    listingId: 'l3',
    sellerId: 's2',
    sellerName: 'Diya Negi',
    sellerCollege: 'DBS Global University',
    sellerAccountStatus: 'Registered User',
    title: 'MBA Semester 1 Textbook Set',
    description: 'Complete set of Managerial Economics and Accounting books.',
    category: 'Books and academic materials',
    price: 900,
    condition: 'Good',
    images: [],
    location: 'DBS Global University Campus (Selaqui)',
    availabilityStatus: 'Sold',
    listingStatus: 'Active',
    createdAt: '2026-11-14T10:00:00Z',
    updatedAt: '2026-11-14T10:00:00Z',
  },
  {
    listingId: 'l4',
    sellerId: 's1',
    sellerName: 'Aarav Sharma',
    sellerCollege: 'DBS Global University',
    sellerAccountStatus: 'Email Verified',
    title: 'Removed Old Lamp',
    description: 'This item was removed by seller.',
    category: 'Hostel accessories',
    price: 300,
    condition: 'Fair',
    images: [],
    location: 'Prem Nagar',
    availabilityStatus: 'Removed',
    listingStatus: 'Removed',
    createdAt: '2026-11-15T10:00:00Z',
    updatedAt: '2026-11-15T10:00:00Z',
  },
];

const defaultFilters: MarketplaceFilterState = {
  search: '',
  category: 'All',
  condition: 'All',
  location: '',
  minPrice: '',
  maxPrice: '',
  availability: 'ActiveOnly',
  sortBy: 'newest',
};

test('filterAndSortListings excludes Removed listings and sorts by newest', () => {
  const result = filterAndSortListings(baseListings, defaultFilters);
  assert.deepEqual(
    result.map((r) => r.listingId),
    ['l3', 'l2', 'l1']
  );
});

test('filterAndSortListings filters by search text, price range, and AvailableOnly', () => {
  const result = filterAndSortListings(baseListings, {
    ...defaultFilters,
    search: 'desk',
    minPrice: '1000',
    maxPrice: '3000',
    availability: 'AvailableOnly',
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].listingId, 'l1');
});

test('filterAndSortListings sorts by lowest and highest price', () => {
  const asc = filterAndSortListings(baseListings, { ...defaultFilters, sortBy: 'price_asc' });
  assert.deepEqual(asc.map((l) => l.price), [650, 900, 2200]);

  const desc = filterAndSortListings(baseListings, { ...defaultFilters, sortBy: 'price_desc' });
  assert.deepEqual(desc.map((l) => l.price), [2200, 900, 650]);
});

test('computeSellerMetrics and computeBuyerMetrics calculate exact database counts', () => {
  const enquiries: Enquiry[] = [
    {
      enquiryId: 'e1',
      listingId: 'l1',
      listingTitle: 'Wooden Study Desk & Chair',
      listingPrice: 2200,
      buyerId: 'b1',
      buyerName: 'Rohan',
      sellerId: 's1',
      sellerName: 'Aarav',
      message: 'Is it still available?',
      enquiryStatus: 'Pending',
      createdAt: '2026-11-12T10:00:00Z',
      updatedAt: '2026-11-12T10:00:00Z',
    },
    {
      enquiryId: 'e2',
      listingId: 'l2',
      listingTitle: 'Prestige Electric Kettle 1.5L',
      listingPrice: 650,
      buyerId: 'b1',
      buyerName: 'Rohan',
      sellerId: 's1',
      sellerName: 'Aarav',
      message: 'Can pick up tomorrow.',
      enquiryStatus: 'Accepted',
      createdAt: '2026-11-13T10:00:00Z',
      updatedAt: '2026-11-13T10:00:00Z',
    },
  ];

  const transactions: TransactionRecord[] = [
    {
      transactionId: 't1',
      listingId: 'l2',
      enquiryId: 'e2',
      buyerId: 'b1',
      buyerName: 'Rohan',
      sellerId: 's1',
      sellerName: 'Aarav',
      itemTitle: 'Prestige Electric Kettle 1.5L',
      itemPrice: 650,
      serviceFee: 40,
      transactionStatus: 'Handover Scheduled',
      handoverLocation: 'DBS Main Gate',
      createdAt: '2026-11-13T12:00:00Z',
      updatedAt: '2026-11-13T12:00:00Z',
    },
  ];

  const sellerListings = baseListings.filter((l) => l.sellerId === 's1');
  const sellerStats = computeSellerMetrics(sellerListings, enquiries, transactions);
  assert.equal(sellerStats.totalListings, 2);
  assert.equal(sellerStats.activeListings, 1);
  assert.equal(sellerStats.reservedListings, 1);
  assert.equal(sellerStats.soldListings, 0);
  assert.equal(sellerStats.totalEnquiriesReceived, 2);
  assert.equal(sellerStats.pendingEnquiries, 1);

  const buyerStats = computeBuyerMetrics(['l1', 'l2'], enquiries, transactions);
  assert.equal(buyerStats.totalFavourites, 2);
  assert.equal(buyerStats.activeEnquiries, 2);
  assert.equal(buyerStats.pendingResponses, 1);
  assert.equal(buyerStats.activeTransactions, 1);
});

test('validateImageFile rejects unsupported types, oversized files, and excess count', () => {
  assert.equal(
    validateImageFile({ type: 'image/jpeg', size: 1024 * 500, name: 'desk.jpg' }, 0).valid,
    true
  );
  assert.equal(
    validateImageFile({ type: 'application/pdf', size: 1024, name: 'doc.pdf' }, 0).valid,
    false
  );
  assert.equal(
    validateImageFile({ type: 'image/png', size: 6 * 1024 * 1024, name: 'huge.png' }, 0).valid,
    false
  );
  assert.equal(
    validateImageFile({ type: 'image/webp', size: 1024, name: 'sixth.webp' }, 5).valid,
    false
  );
});

test('formatInr formats Indian Rupee currency cleanly', () => {
  assert.equal(formatInr(2200), '₹2,200');
  assert.equal(formatInr(0), '₹0');
});
