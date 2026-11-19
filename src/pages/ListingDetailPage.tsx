import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Calendar,
  Flag,
  Heart,
  MapPin,
  MessageSquare,
  Pencil,
  Shield,
} from 'lucide-react';
import { ListingImage } from '../components/ProductArtwork';
import { MVP_SERVICE_FEE_INR, REPORT_REASONS } from '../constants/marketplace';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MainLayout } from '../layouts/MainLayout';
import { createEnquiry } from '../services/enquiryService';
import { fetchListingById } from '../services/listingService';
import { submitListingReport } from '../services/notificationAndReportService';
import type { Listing, ReportReason } from '../types/marketplace';
import { formatInr, formatShortDate } from '../utils/marketplaceLogic';
import {
  enquirySchema,
  reportSchema,
  type EnquiryFormValues,
  type ReportFormValues,
} from '../validations/schemas';

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { firebaseUser, profile, toggleFavourite, markRecentlyViewed } = useAuth();
  const { showToast } = useToast();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [enquirySent, setEnquirySent] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  const {
    register: regEnquiry,
    handleSubmit: handleEnquirySubmit,
    reset: resetEnquiry,
    formState: { errors: enquiryErrors, isSubmitting: sendingEnquiry },
  } = useForm<EnquiryFormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { message: '', preferredHandoverLocation: '' },
  });

  const {
    register: regReport,
    handleSubmit: handleReportSubmit,
    reset: resetReport,
    formState: { errors: reportErrors, isSubmitting: sendingReport },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: REPORT_REASONS[0], description: '' },
  });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setErrorMsg('Listing ID is missing.');
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchListingById(id)
      .then((fetched) => {
        if (cancelled) return;
        if (!fetched) {
          setErrorMsg('This listing could not be found or has been removed.');
          setListing(null);
        } else {
          setListing(fetched);
          setErrorMsg(null);
          void markRecentlyViewed(fetched.listingId);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : 'Unable to load listing details.');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, markRecentlyViewed]);

  const onSendEnquiry = async (values: EnquiryFormValues) => {
    if (!firebaseUser || !profile) {
      navigate('/login', { state: { from: { pathname: `/listing/${id}` } } });
      return;
    }
    if (!listing) return;

    try {
      await createEnquiry({
        listing,
        buyer: profile,
        message: values.message,
        preferredHandoverLocation: values.preferredHandoverLocation || listing.location,
      });
      setEnquirySent(true);
      resetEnquiry();
      showToast(
        'Enquiry sent to seller',
        'success',
        'Track seller responses in My Enquiries.'
      );
    } catch (error) {
      showToast(
        'Could not send enquiry',
        'error',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  const onSubmitReport = async (values: ReportFormValues) => {
    if (!firebaseUser || !listing) {
      navigate('/login');
      return;
    }
    try {
      await submitListingReport({
        listingId: listing.listingId,
        reportedBy: firebaseUser.uid,
        reason: values.reason as ReportReason,
        description: values.description,
      });
      resetReport();
      setShowReportForm(false);
      showToast('Report submitted', 'success', 'Thank you for helping keep ReNest Campus safe.');
    } catch (error) {
      showToast(
        'Could not submit report',
        'error',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  const isOwner = Boolean(firebaseUser && listing && firebaseUser.uid === listing.sellerId);
  const isFavourite = Boolean(listing && profile?.favouriteIds?.includes(listing.listingId));

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#525C58] hover:text-[#174C3C] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Marketplace
        </Link>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-[#EDE9DF] lg:col-span-7" />
            <div className="h-96 animate-pulse rounded-2xl bg-[#EDE9DF] lg:col-span-5" />
          </div>
        ) : errorMsg || !listing ? (
          <div className="mt-8 rounded-2xl border border-[#DDD7C9] bg-white p-10 text-center">
            <h1 className="font-display text-2xl font-bold text-[#242B29]">
              Listing Unavailable
            </h1>
            <p className="mt-2 text-sm text-[#525C58]">{errorMsg}</p>
            <Link
              to="/marketplace"
              className="mt-6 inline-flex rounded-lg bg-[#174C3C] px-5 py-2.5 text-sm font-semibold text-[#F8F7F2]"
            >
              Browse Active Listings
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Gallery + Full Description */}
            <div className="space-y-6 lg:col-span-7">
              <div className="overflow-hidden rounded-2xl border border-[#DDD7C9] bg-[#EDE9DF] aspect-[4/3]">
                <ListingImage
                  src={listing.images[activeImageIdx]}
                  alt={listing.title}
                  category={listing.category}
                />
              </div>

              {listing.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {listing.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      aria-label={`View photo ${idx + 1} of ${listing.title}`}
                      className={`h-20 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        activeImageIdx === idx
                          ? 'border-[#174C3C]'
                          : 'border-[#DDD7C9] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <ListingImage
                        src={imgUrl}
                        alt={`${listing.title} thumbnail ${idx + 1}`}
                        category={listing.category}
                      />
                    </button>
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-[#DDD7C9] bg-white p-6">
                <h2 className="font-display text-lg font-semibold text-[#242B29]">
                  Item Description
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm text-[#242B29] leading-relaxed">
                  {listing.description}
                </p>

                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[#EDE9DF] pt-5 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-[#525C58]">Category</dt>
                    <dd className="mt-0.5 font-medium text-[#242B29]">{listing.category}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#525C58]">Condition</dt>
                    <dd className="mt-0.5 font-medium text-[#242B29]">{listing.condition}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#525C58]">Availability</dt>
                    <dd className="mt-0.5 font-semibold text-[#174C3C]">
                      {listing.availabilityStatus}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Sticky Purchase / Enquiry Module */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-5">
                <div className="rounded-2xl border border-[#DDD7C9] bg-white p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs text-[#525C58]">
                      <span>{listing.category}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{listing.condition}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFavourite(listing.listingId)}
                      aria-label={isFavourite ? 'Remove from favourites' : 'Save to favourites'}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isFavourite
                          ? 'border-[#174C3C] bg-[#174C3C] text-[#F8F7F2]'
                          : 'border-[#DDD7C9] bg-[#F8F7F2] text-[#242B29] hover:border-[#174C3C]'
                      }`}
                    >
                      <Heart
                        className="h-3.5 w-3.5"
                        fill={isFavourite ? 'currentColor' : 'none'}
                        aria-hidden="true"
                      />
                      {isFavourite ? 'Saved' : 'Save'}
                    </button>
                  </div>

                  <h1 className="mt-2 font-display text-2xl font-bold text-[#242B29]">
                    {listing.title}
                  </h1>

                  <div className="mt-3 flex items-baseline justify-between gap-4">
                    <span className="font-mono text-3xl font-bold text-[#174C3C] tabular-nums">
                      {formatInr(listing.price)}
                    </span>
                    <span className="text-sm font-semibold text-[#174C3C]">
                      {listing.availabilityStatus}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 border-y border-[#EDE9DF] py-4 text-sm text-[#525C58]">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-[#2F8065]" aria-hidden="true" />
                      <span>{listing.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0 text-[#2F8065]" aria-hidden="true" />
                      <span>Listed on {formatShortDate(listing.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 shrink-0 text-[#2F8065]" aria-hidden="true" />
                      <span>
                        Seller: <strong className="font-medium text-[#242B29]">{listing.sellerName}</strong>{' '}
                        ({listing.sellerCollege} · {listing.sellerAccountStatus})
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-[#F8F7F2] p-3 text-xs text-[#525C58] leading-relaxed">
                    <strong className="font-semibold text-[#242B29]">MVP Handover Note:</strong>{' '}
                    ReNest Campus proposes a ₹{MVP_SERVICE_FEE_INR} convenience/service fee for coordinated handover planning (separate from the {formatInr(listing.price)} item price; no online payment is collected here).
                  </div>

                  {/* Owner vs Buyer action */}
                  {isOwner ? (
                    <div className="mt-5 space-y-2.5">
                      <Link
                        to={`/edit-listing/${listing.listingId}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#174C3C] px-4 py-2.5 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] transition-colors"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit Listing
                      </Link>
                      <Link
                        to="/my-listings"
                        className="inline-flex w-full items-center justify-center rounded-lg border border-[#D4CEC0] bg-white px-4 py-2.5 text-sm font-semibold text-[#242B29] hover:bg-[#EDE9DF] transition-colors"
                      >
                        Manage in My Listings
                      </Link>
                    </div>
                  ) : listing.availabilityStatus !== 'Available' ? (
                    <div className="mt-5 rounded-xl border border-[#DDD7C9] bg-[#F8F7F2] p-4 text-sm text-[#525C58]">
                      This item is currently <strong className="text-[#242B29]">{listing.availabilityStatus}</strong> and is not accepting new handover requests.
                    </div>
                  ) : !firebaseUser ? (
                    <div className="mt-5 space-y-3">
                      <Link
                        to="/login"
                        state={{ from: { pathname: `/listing/${listing.listingId}` } }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#174C3C] px-4 py-3 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        Sign In to Contact Seller
                      </Link>
                      <p className="text-center text-xs text-[#525C58]">
                        Seller contact details stay private until you send an authenticated enquiry.
                      </p>
                    </div>
                  ) : enquirySent ? (
                    <div className="mt-5 rounded-xl border border-[#C6DED4] bg-[#EDF5F1] p-4">
                      <p className="text-sm font-semibold text-[#174C3C]">
                        Enquiry sent to {listing.sellerName}
                      </p>
                      <p className="mt-1 text-xs text-[#525C58]">
                        You can track replies and handover scheduling in My Enquiries.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Link
                          to="/enquiries"
                          className="rounded-lg bg-[#174C3C] px-3.5 py-2 text-xs font-semibold text-[#F8F7F2]"
                        >
                          View My Enquiries
                        </Link>
                        <button
                          type="button"
                          onClick={() => setEnquirySent(false)}
                          className="rounded-lg border border-[#D4CEC0] bg-white px-3.5 py-2 text-xs font-semibold text-[#242B29]"
                        >
                          Send Another Message
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleEnquirySubmit(onSendEnquiry)} className="mt-5 space-y-3">
                      <div>
                        <label
                          htmlFor="enquiry-message"
                          className="block text-xs font-semibold text-[#242B29]"
                        >
                          Contact Seller / Send Enquiry
                        </label>
                        <textarea
                          id="enquiry-message"
                          rows={3}
                          placeholder={`Hi ${listing.sellerName}, is "${listing.title}" available for pickup this week?`}
                          {...regEnquiry('message')}
                          className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] p-3 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                        />
                        {enquiryErrors.message && (
                          <p className="mt-1 text-xs text-red-700">{enquiryErrors.message.message}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="enquiry-location"
                          className="block text-xs font-semibold text-[#242B29]"
                        >
                          Preferred Handover Point (Optional)
                        </label>
                        <input
                          id="enquiry-location"
                          type="text"
                          placeholder={listing.location}
                          {...regEnquiry('preferredHandoverLocation')}
                          className="mt-1.5 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3 py-2 text-sm text-[#242B29] focus:border-[#174C3C] focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={sendingEnquiry}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#174C3C] px-4 py-3 text-sm font-semibold text-[#F8F7F2] hover:bg-[#2F8065] disabled:opacity-60 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        {sendingEnquiry ? 'Sending Enquiry...' : 'Send Enquiry'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Report Listing */}
                {firebaseUser && !isOwner && (
                  <div className="rounded-xl border border-[#DDD7C9] bg-white p-4">
                    <button
                      type="button"
                      onClick={() => setShowReportForm((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-[#525C58] hover:text-red-700"
                    >
                      <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                      {showReportForm ? 'Cancel report' : 'Report this listing'}
                    </button>

                    {showReportForm && (
                      <form
                        onSubmit={handleReportSubmit(onSubmitReport)}
                        className="mt-3 space-y-3 border-t border-[#EDE9DF] pt-3"
                      >
                        <div>
                          <label htmlFor="report-reason" className="block text-xs font-semibold text-[#242B29]">
                            Reason
                          </label>
                          <select
                            id="report-reason"
                            {...regReport('reason')}
                            className="mt-1 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3 py-2 text-xs text-[#242B29]"
                          >
                            {REPORT_REASONS.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="report-description" className="block text-xs font-semibold text-[#242B29]">
                            Details
                          </label>
                          <textarea
                            id="report-description"
                            rows={2}
                            placeholder="Explain why this listing should be reviewed..."
                            {...regReport('description')}
                            className="mt-1 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] p-2.5 text-xs text-[#242B29]"
                          />
                          {reportErrors.description && (
                            <p className="mt-1 text-xs text-red-700">
                              {reportErrors.description.message}
                            </p>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={sendingReport}
                          className="rounded-lg bg-red-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                        >
                          {sendingReport ? 'Submitting...' : 'Submit Report'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
