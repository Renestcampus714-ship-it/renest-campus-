import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { ListingCard } from '../components/ListingCard';
import { ListingGridSkeleton } from '../components/Skeletons';
import {
  CATEGORY_NAMES,
  DEHRADUN_LOCATIONS,
  ITEM_CONDITIONS,
} from '../constants/marketplace';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../layouts/MainLayout';
import { subscribeActiveListings } from '../services/listingService';
import type {
  ItemCondition,
  Listing,
  MarketplaceCategory,
  MarketplaceFilterState,
  SortOption,
} from '../types/marketplace';
import { filterAndSortListings } from '../utils/marketplaceLogic';

const initialFilters: MarketplaceFilterState = {
  search: '',
  category: 'All',
  condition: 'All',
  location: '',
  minPrice: '',
  maxPrice: '',
  availability: 'ActiveOnly',
  sortBy: 'newest',
};

export function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, toggleFavourite } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const paramCategory = searchParams.get('category');
  const [filters, setFilters] = useState<MarketplaceFilterState>(() => ({
    ...initialFilters,
    category:
      paramCategory && CATEGORY_NAMES.includes(paramCategory as MarketplaceCategory)
        ? (paramCategory as MarketplaceCategory)
        : 'All',
  }));

  useEffect(() => {
    if (
      paramCategory &&
      CATEGORY_NAMES.includes(paramCategory as MarketplaceCategory) &&
      filters.category !== paramCategory
    ) {
      setFilters((prev) => ({
        ...prev,
        category: paramCategory as MarketplaceCategory,
      }));
    }
  }, [paramCategory, filters.category]);

  useEffect(() => {
    const unsubscribe = subscribeActiveListings(
      (items) => {
        setListings(items);
        setLoading(false);
        setErrorMsg(null);
      },
      (err) => {
        setLoading(false);
        setErrorMsg(
          err instanceof Error ? err.message : 'Unable to load marketplace listings.'
        );
      }
    );
    return () => unsubscribe();
  }, []);

  const filteredListings = useMemo(
    () => filterAndSortListings(listings, filters),
    [listings, filters]
  );

  const handleClearFilters = () => {
    setFilters(initialFilters);
    if (searchParams.has('category')) {
      setSearchParams({});
    }
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.category !== 'All' ||
    filters.condition !== 'All' ||
    filters.location !== '' ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.availability !== 'ActiveOnly' ||
    filters.sortBy !== 'newest';

  const favouriteIds = profile?.favouriteIds || [];

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Page Heading */}
        <div className="flex flex-col justify-between gap-4 border-b border-[#DDD7C9] pb-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#242B29]">
              Campus Marketplace
            </h1>
            <p className="mt-1 text-sm text-[#525C58]">
              Browse second-hand study furniture, appliances, books, and hostel essentials across Dehradun.
            </p>
          </div>
          <Link
            to="/sell"
            className="inline-flex items-center justify-center rounded-lg bg-[#174C3C] px-4 py-2.5 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] transition-colors whitespace-nowrap shrink-0"
          >
            Post an Item
          </Link>
        </div>

        {/* Search & Sort Bar */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525C58]"
              aria-hidden="true"
            />
            <label htmlFor="marketplace-search" className="sr-only">
              Search listings by title or description
            </label>
            <input
              id="marketplace-search"
              type="search"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Search study tables, electric kettles, MBA books..."
              className="w-full rounded-lg border border-[#D4CEC0] bg-white py-2.5 pl-10 pr-4 text-sm text-[#242B29] placeholder:text-[#78827E] focus:border-[#174C3C] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowMobileFilters((prev) => !prev)}
              aria-expanded={showMobileFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-[#D4CEC0] bg-white px-4 py-2.5 text-sm font-medium text-[#242B29] lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
            </button>

            <div className="flex items-center gap-2">
              <label htmlFor="marketplace-sort" className="text-xs font-medium text-[#525C58] whitespace-nowrap">
                Sort by
              </label>
              <select
                id="marketplace-sort"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: e.target.value as SortOption,
                  }))
                }
                className="rounded-lg border border-[#D4CEC0] bg-white px-3 py-2.5 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters + Listings Layout */}
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Filter Panel */}
          <aside
            aria-label="Marketplace filters"
            className={`${
              showMobileFilters ? 'block' : 'hidden'
            } lg:block lg:col-span-3`}
          >
            <div className="rounded-xl border border-[#DDD7C9] bg-white p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-[#EDE9DF] pb-3">
                <h2 className="font-display text-base font-semibold text-[#242B29]">
                  Filter Items
                </h2>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#174C3C] hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    Clear all
                  </button>
                )}
              </div>

              <div>
                <label htmlFor="filter-category" className="block text-xs font-semibold text-[#242B29]">
                  Category
                </label>
                <select
                  id="filter-category"
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value as MarketplaceCategory | 'All',
                    }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3 py-2 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                >
                  <option value="All">All categories</option>
                  {CATEGORY_NAMES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-condition" className="block text-xs font-semibold text-[#242B29]">
                  Condition
                </label>
                <select
                  id="filter-condition"
                  value={filters.condition}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      condition: e.target.value as ItemCondition | 'All',
                    }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3 py-2 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                >
                  <option value="All">Any condition</option>
                  {ITEM_CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-location" className="block text-xs font-semibold text-[#242B29]">
                  Campus / Cluster Location
                </label>
                <select
                  id="filter-location"
                  value={filters.location}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, location: e.target.value }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3 py-2 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                >
                  <option value="">All locations</option>
                  {DEHRADUN_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#242B29]">
                  Price Range (INR)
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="filter-min-price" className="sr-only">
                      Minimum price
                    </label>
                    <input
                      id="filter-min-price"
                      type="number"
                      min={0}
                      placeholder="Min ₹"
                      value={filters.minPrice}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, minPrice: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3 py-2 text-sm tabular-nums text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="filter-max-price" className="sr-only">
                      Maximum price
                    </label>
                    <input
                      id="filter-max-price"
                      type="number"
                      min={0}
                      placeholder="Max ₹"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
                      }
                      className="w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3 py-2 text-sm tabular-nums text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2.5 text-sm text-[#242B29] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.availability === 'AvailableOnly'}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        availability: e.target.checked ? 'AvailableOnly' : 'ActiveOnly',
                      }))
                    }
                    className="h-4 w-4 rounded border-[#D4CEC0] accent-[#174C3C]"
                  />
                  <span>Show only Available items</span>
                </label>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3 py-2 text-xs font-semibold text-[#242B29] hover:bg-[#EDE9DF] transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </aside>

          {/* Listings Grid */}
          <div className="lg:col-span-9">
            <div className="mb-4 flex items-center justify-between text-xs text-[#525C58]">
              <span className="tabular-nums">
                Showing {filteredListings.length}{' '}
                {filteredListings.length === 1 ? 'listing' : 'listings'}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="font-semibold text-[#174C3C] hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>

            {loading ? (
              <ListingGridSkeleton count={6} />
            ) : errorMsg ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-900">
                {errorMsg}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="rounded-2xl border border-[#DDD7C9] bg-white p-10 text-center">
                <h2 className="font-display text-xl font-semibold text-[#242B29]">
                  No matching items found
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#525C58]">
                  {listings.length === 0
                    ? 'There are no active listings in the marketplace yet. Be the first student to list an essential.'
                    : 'Try clearing your active search terms or widening your price and category filters.'}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="rounded-lg border border-[#174C3C] bg-white px-4 py-2 text-sm font-semibold text-[#174C3C] hover:bg-[#EDE9DF]"
                    >
                      Clear All Filters
                    </button>
                  )}
                  <Link
                    to="/sell"
                    className="rounded-lg bg-[#174C3C] px-4 py-2 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065]"
                  >
                    Post an Item
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredListings.map((item) => (
                  <ListingCard
                    key={item.listingId}
                    listing={item}
                    isFavourite={favouriteIds.includes(item.listingId)}
                    onToggleFavourite={toggleFavourite}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
