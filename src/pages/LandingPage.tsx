import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Handshake, Leaf, MapPin, ShieldCheck, Wallet } from 'lucide-react';
import { ListingCard } from '../components/ListingCard';
import { HeroRoomIllustration } from '../components/ProductArtwork';
import { ListingGridSkeleton } from '../components/Skeletons';
import { MARKETPLACE_CATEGORIES } from '../constants/marketplace';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../layouts/MainLayout';
import { subscribeActiveListings } from '../services/listingService';
import type { Listing } from '../types/marketplace';

export function LandingPage() {
  const { profile, toggleFavourite } = useAuth();
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeActiveListings(
      (items) => {
        setRecentListings(items.slice(0, 6));
        setLoading(false);
        setLoadError(null);
      },
      (err) => {
        setLoading(false);
        setLoadError(
          err instanceof Error ? err.message : 'Could not load recent listings.'
        );
      }
    );
    return () => unsubscribe();
  }, []);

  const favouriteIds = profile?.favouriteIds || [];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="border-b border-[#DDD7C9] bg-[#F8F7F2]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold tracking-wide text-[#2F8065]">
                Buy Smart. Sell Easy. Reuse Together.
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight text-[#242B29] sm:text-5xl text-balance">
                Give Your Essentials a Second Life.
              </h1>
              <p className="mt-5 max-w-xl text-base text-[#525C58] leading-relaxed">
                Discover affordable student essentials, sell items you no longer need and
                connect with other students through ReNest Campus.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  to="/marketplace"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#174C3C] px-6 py-3 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] transition-colors whitespace-nowrap"
                >
                  Explore Marketplace
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/sell"
                  className="inline-flex items-center justify-center rounded-lg border border-[#174C3C] bg-white px-6 py-3 text-sm font-semibold text-[#174C3C] hover:bg-[#EDE9DF] transition-colors whitespace-nowrap"
                >
                  Sell an Item
                </Link>
              </div>
              <p className="mt-6 text-xs text-[#525C58]">
                Built for DBS Global University &amp; Dehradun student accommodation clusters — open to students across campuses.
              </p>
            </div>

            <div className="lg:col-span-6">
              <HeroRoomIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* How ReNest Works */}
      <section className="border-b border-[#DDD7C9] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-[#242B29] sm:text-3xl">
              How ReNest Works
            </h2>
            <p className="mt-2 text-sm text-[#525C58]">
              Designed around student move-in and move-out schedules to eliminate frantic last-minute selling.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-[#DDD7C9] bg-[#F8F7F2] p-6">
              <span className="font-mono text-xs font-semibold text-[#174C3C]">01. List in Minutes</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-[#242B29]">
                Post your room essentials
              </h3>
              <p className="mt-2 text-sm text-[#525C58] leading-relaxed">
                Add photos, condition, asking price in INR, and your hostel or PG cluster before semester move-out.
              </p>
            </div>
            <div className="rounded-xl border border-[#DDD7C9] bg-[#F8F7F2] p-6">
              <span className="font-mono text-xs font-semibold text-[#174C3C]">02. Connect Directly</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-[#242B29]">
                Receive student enquiries
              </h3>
              <p className="mt-2 text-sm text-[#525C58] leading-relaxed">
                Interested buyers message you through ReNest Campus without exposing personal phone numbers publicly.
              </p>
            </div>
            <div className="rounded-xl border border-[#DDD7C3] bg-[#F8F7F2] p-6">
              <span className="font-mono text-xs font-semibold text-[#174C3C]">03. Local Handover</span>
              <h3 className="mt-2 font-display text-lg font-semibold text-[#242B29]">
                Reserve &amp; exchange on campus
              </h3>
              <p className="mt-2 text-sm text-[#525C58] leading-relaxed">
                Accept an enquiry to reserve the item atomically, schedule a campus handover point, and mark it completed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Browse Popular Categories */}
      <section className="border-b border-[#DDD7C9] bg-[#F8F7F2]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#242B29] sm:text-3xl">
                Browse Popular Categories
              </h2>
              <p className="mt-1.5 text-sm text-[#525C58]">
                Everything needed to furnish a hostel room, PG, or shared flat on a student budget.
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#174C3C] hover:text-[#2F8065] whitespace-nowrap"
            >
              View all items
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MARKETPLACE_CATEGORIES.map((cat) => (
              <Link
                key={cat.categoryId}
                to={`/marketplace?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col justify-between rounded-xl border border-[#DDD7C9] bg-white p-5 transition-colors hover:border-[#174C3C]"
              >
                <div>
                  <h3 className="font-display text-base font-semibold text-[#242B29] group-hover:text-[#174C3C]">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-[#525C58] leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#174C3C]">
                  Explore
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recently Listed Items */}
      <section className="border-b border-[#DDD7C9] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#242B29] sm:text-3xl">
                Recently Listed Items
              </h2>
              <p className="mt-1.5 text-sm text-[#525C58]">
                Live active listings published directly by students in Cloud Firestore.
              </p>
            </div>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#174C3C] hover:text-[#2F8065] whitespace-nowrap"
            >
              Open full marketplace
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8">
            {loading ? (
              <ListingGridSkeleton count={3} />
            ) : loadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-900">
                {loadError}
              </div>
            ) : recentListings.length === 0 ? (
              <div className="rounded-2xl border border-[#DDD7C9] bg-[#F8F7F2] p-10 text-center">
                <h3 className="font-display text-xl font-semibold text-[#242B29]">
                  The campus marketplace is ready for its first listing
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#525C58]">
                  No active student items have been listed yet. Register or sign in to post the first study table, kettle, or textbook set.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    to="/sell"
                    className="rounded-lg bg-[#174C3C] px-5 py-2.5 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] transition-colors"
                  >
                    Create First Listing
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg border border-[#174C3C] bg-white px-5 py-2.5 text-sm font-semibold text-[#174C3C] hover:bg-[#EDE9DF] transition-colors"
                  >
                    Join as Student
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recentListings.map((item) => (
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
      </section>

      {/* Why Choose ReNest Campus? & Join CTA */}
      <section className="bg-[#F8F7F2]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h2 className="font-display text-2xl font-bold text-[#242B29] sm:text-3xl">
                Why Choose ReNest Campus?
              </h2>
              <p className="mt-2 text-sm text-[#525C58]">
                Buy Smart. Sell Easy. Reuse Together. Built around the real move-out friction students face every semester.
              </p>

              <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <li className="flex items-start gap-3 rounded-xl border border-[#DDD7C9] bg-white p-4">
                  <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-[#174C3C]" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#242B29]">Affordable essentials</h3>
                    <p className="mt-1 text-xs text-[#525C58] leading-relaxed">
                      Save significantly compared to buying brand-new furniture and appliances for a short semester stay.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-xl border border-[#DDD7C9] bg-white p-4">
                  <Handshake className="mt-0.5 h-5 w-5 shrink-0 text-[#174C3C]" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#242B29]">Easier student-to-student exchanges</h3>
                    <p className="mt-1 text-xs text-[#525C58] leading-relaxed">
                      Structured enquiries and reservation tracking replace buried WhatsApp group messages.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-xl border border-[#DDD7C9] bg-white p-4">
                  <Leaf className="mt-0.5 h-5 w-5 shrink-0 text-[#174C3C]" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#242B29]">Reduced unnecessary waste</h3>
                    <p className="mt-1 text-xs text-[#525C58] leading-relaxed">
                      Keep usable desks, lamps, books, and kitchenware circulating across incoming student batches.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-xl border border-[#DDD7C9] bg-white p-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#174C3C]" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#242B29]">Convenient local handovers</h3>
                    <p className="mt-1 text-xs text-[#525C58] leading-relaxed">
                      Coordinate pickups at DBS Global University gates, Selaqui hostels, Prem Nagar, or Bidholi PGs.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-xl border border-[#DDD7C9] bg-white p-4 sm:col-span-2">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#174C3C]" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#242B29]">A dedicated marketplace for student needs</h3>
                    <p className="mt-1 text-xs text-[#525C58] leading-relaxed">
                      Honest account statuses (Registered User vs. Email Verified), protected privacy, and atomic reservation guards prevent conflicting deals.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-[#174C3C] p-8 text-[#F8F7F2] lg:col-span-5">
              <h2 className="font-display text-2xl font-bold leading-snug">
                Join the Student Marketplace
              </h2>
              <p className="mt-3 text-sm text-[#E2ECE7] leading-relaxed">
                Moving into a new hostel room or clearing out before finals? Create your ReNest Campus account in under a minute.
              </p>
              <ul className="mt-5 space-y-2.5 text-xs text-[#E2ECE7]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#A9D6C3]" aria-hidden="true" />
                  Open registration for students across universities
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#A9D6C3]" aria-hidden="true" />
                  Free listing creation with up to 5 photos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#A9D6C3]" aria-hidden="true" />
                  Transparent ₹40 MVP handover planning assumption
                </li>
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="rounded-lg bg-[#F8F7F2] px-5 py-2.5 text-sm font-semibold text-[#174C3C] hover:bg-[#EDE9DF] transition-colors"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/marketplace"
                  className="rounded-lg border border-[#F8F7F2]/40 px-5 py-2.5 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] transition-colors"
                >
                  Browse Items
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
