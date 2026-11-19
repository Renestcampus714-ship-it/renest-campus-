import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Handshake, MessageSquare, XCircle } from 'lucide-react';
import { DashboardSkeleton } from '../components/Skeletons';
import { DEHRADUN_LOCATIONS, MVP_SERVICE_FEE_INR } from '../constants/marketplace';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import {
  closeEnquiryByBuyer,
  subscribeBuyerEnquiries,
  subscribeSellerEnquiries,
  updateEnquiryBySeller,
} from '../services/enquiryService';
import { acceptEnquiryAndCreateTransaction } from '../services/transactionService';
import type { Enquiry } from '../types/marketplace';
import { formatInr, formatShortDate } from '../utils/marketplaceLogic';

export function MyEnquiriesPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [received, setReceived] = useState<Enquiry[]>([]);
  const [sent, setSent] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [acceptingEnquiry, setAcceptingEnquiry] = useState<Enquiry | null>(null);
  const [handoverLocation, setHandoverLocation] = useState<string>(DEHRADUN_LOCATIONS[0]);
  const [handoverWindow, setHandoverWindow] = useState<string>('Tomorrow, 5:00 PM – 6:30 PM');
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;
    let done = 0;
    const checkDone = () => {
      done += 1;
      if (done >= 2) setLoading(false);
    };

    const unsubSeller = subscribeSellerEnquiries(firebaseUser.uid, (data) => {
      setReceived(data);
      checkDone();
    });
    const unsubBuyer = subscribeBuyerEnquiries(firebaseUser.uid, (data) => {
      setSent(data);
      checkDone();
    });

    return () => {
      unsubSeller();
      unsubBuyer();
    };
  }, [firebaseUser]);

  const handleSellerReply = async (
    enquiry: Enquiry,
    status: 'Responded' | 'Declined' | 'Closed'
  ) => {
    setSubmittingAction(true);
    try {
      await updateEnquiryBySeller(
        enquiry,
        status,
        replyDrafts[enquiry.enquiryId] || enquiry.sellerReply
      );
      showToast(`Enquiry ${status.toLowerCase()}`, 'success');
    } catch (error) {
      showToast(
        'Could not update enquiry',
        'error',
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenAcceptModal = (enquiry: Enquiry) => {
    setAcceptingEnquiry(enquiry);
    setHandoverLocation(enquiry.preferredHandoverLocation || DEHRADUN_LOCATIONS[0]);
  };

  const handleConfirmAcceptTransaction = async () => {
    if (!acceptingEnquiry) return;
    if (handoverLocation.trim().length < 2) {
      showToast('Handover location required', 'error', 'Enter a valid campus pickup spot.');
      return;
    }

    setSubmittingAction(true);
    try {
      await acceptEnquiryAndCreateTransaction({
        enquiry: acceptingEnquiry,
        handoverLocation: handoverLocation.trim(),
        handoverWindow: handoverWindow.trim(),
        sellerReply:
          replyDrafts[acceptingEnquiry.enquiryId] ||
          `Accepted! Let's meet at ${handoverLocation.trim()}.`,
      });
      setAcceptingEnquiry(null);
      showToast(
        'Handover agreed & item reserved',
        'success',
        'Transaction record created in Transactions.'
      );
    } catch (error) {
      showToast(
        'Could not reserve item',
        'error',
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleBuyerClose = async (enquiryId: string) => {
    try {
      await closeEnquiryByBuyer(enquiryId);
      showToast('Enquiry closed', 'success');
    } catch (error) {
      showToast('Could not close enquiry', 'error', error instanceof Error ? error.message : undefined);
    }
  };

  return (
    <DashboardLayout
      title="My Enquiries"
      subtitle="Respond to interested buyers, accept campus handover offers, or track your sent messages."
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Segmented Tab Bar */}
          <div className="inline-flex rounded-lg border border-[#DDD7C9] bg-[#EDE9DF] p-1">
            <button
              type="button"
              onClick={() => setTab('received')}
              className={`rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                tab === 'received'
                  ? 'bg-white text-[#174C3C] shadow-xs'
                  : 'text-[#525C58] hover:text-[#242B29]'
              }`}
            >
              Received as Seller ({received.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('sent')}
              className={`rounded-md px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                tab === 'sent'
                  ? 'bg-white text-[#174C3C] shadow-xs'
                  : 'text-[#525C58] hover:text-[#242B29]'
              }`}
            >
              Sent as Buyer ({sent.length})
            </button>
          </div>

          {tab === 'received' ? (
            received.length === 0 ? (
              <div className="rounded-2xl border border-[#DDD7C9] bg-white p-10 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-[#525C58]" aria-hidden="true" />
                <p className="mt-3 text-sm text-[#525C58]">
                  You have not received any buyer enquiries yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {received.map((enq) => {
                  const isTerminal =
                    enq.enquiryStatus === 'Declined' ||
                    enq.enquiryStatus === 'Closed' ||
                    enq.enquiryStatus === 'Accepted';

                  return (
                    <div
                      key={enq.enquiryId}
                      className="rounded-xl border border-[#DDD7C9] bg-white p-5 space-y-4"
                    >
                      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                        <div>
                          <Link
                            to={`/listing/${enq.listingId}`}
                            className="font-display text-base font-semibold text-[#242B29] hover:text-[#174C3C]"
                          >
                            {enq.listingTitle}
                          </Link>
                          <p className="mt-0.5 text-xs text-[#525C58]">
                            From <strong className="text-[#242B29]">{enq.buyerName}</strong> ·{' '}
                            <span className="font-mono font-semibold text-[#174C3C] tabular-nums">
                              {formatInr(enq.listingPrice)}
                            </span>{' '}
                            · {formatShortDate(enq.createdAt)}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-[#174C3C]">
                          Status: {enq.enquiryStatus}
                        </span>
                      </div>

                      <div className="rounded-lg bg-[#F8F7F2] p-3.5 text-sm text-[#242B29]">
                        <p>{enq.message}</p>
                        {enq.preferredHandoverLocation && (
                          <p className="mt-1.5 text-xs text-[#525C58]">
                            Suggested handover: {enq.preferredHandoverLocation}
                          </p>
                        )}
                      </div>

                      {enq.sellerReply && (
                        <p className="text-xs text-[#525C58]">
                          Your reply: <span className="text-[#242B29]">{enq.sellerReply}</span>
                        </p>
                      )}

                      {!isTerminal && (
                        <div className="space-y-3 border-t border-[#EDE9DF] pt-3">
                          <div>
                            <label
                              htmlFor={`reply-${enq.enquiryId}`}
                              className="block text-xs font-semibold text-[#242B29]"
                            >
                              Reply to {enq.buyerName}
                            </label>
                            <input
                              id={`reply-${enq.enquiryId}`}
                              type="text"
                              value={replyDrafts[enq.enquiryId] ?? ''}
                              onChange={(e) =>
                                setReplyDrafts((prev) => ({
                                  ...prev,
                                  [enq.enquiryId]: e.target.value,
                                }))
                              }
                              placeholder="Share item availability or pickup timings..."
                              className="mt-1 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3 py-2 text-sm text-[#242B29]"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={submittingAction}
                              onClick={() => handleOpenAcceptModal(enq)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#174C3C] px-3.5 py-2 text-xs font-semibold text-[#F8F7F2] hover:bg-[#2F8065] disabled:opacity-60"
                            >
                              <Handshake className="h-3.5 w-3.5" aria-hidden="true" />
                              Accept &amp; Reserve Item
                            </button>
                            <button
                              type="button"
                              disabled={submittingAction}
                              onClick={() => handleSellerReply(enq, 'Responded')}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#174C3C] bg-white px-3.5 py-2 text-xs font-semibold text-[#174C3C] hover:bg-[#EDE9DF] disabled:opacity-60"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Send Reply
                            </button>
                            <button
                              type="button"
                              disabled={submittingAction}
                              onClick={() => handleSellerReply(enq, 'Declined')}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                              Decline
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : sent.length === 0 ? (
            <div className="rounded-2xl border border-[#DDD7C9] bg-white p-10 text-center">
              <p className="text-sm text-[#525C58]">
                You have not sent any enquiries yet.
              </p>
              <Link
                to="/marketplace"
                className="mt-4 inline-flex rounded-lg bg-[#174C3C] px-5 py-2.5 text-sm font-semibold text-[#F8F7F2]"
              >
                Explore Marketplace
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {sent.map((enq) => (
                <div
                  key={enq.enquiryId}
                  className="rounded-xl border border-[#DDD7C9] bg-white p-5 space-y-3"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <Link
                        to={`/listing/${enq.listingId}`}
                        className="font-display text-base font-semibold text-[#242B29] hover:text-[#174C3C]"
                      >
                        {enq.listingTitle}
                      </Link>
                      <p className="mt-0.5 text-xs text-[#525C58]">
                        Seller: <strong className="text-[#242B29]">{enq.sellerName}</strong> ·{' '}
                        <span className="font-mono font-semibold text-[#174C3C] tabular-nums">
                          {formatInr(enq.listingPrice)}
                        </span>{' '}
                        · {formatShortDate(enq.createdAt)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#174C3C]">
                      Status: {enq.enquiryStatus}
                    </span>
                  </div>

                  <p className="rounded-lg bg-[#F8F7F2] p-3 text-sm text-[#242B29]">
                    {enq.message}
                  </p>

                  {enq.sellerReply && (
                    <div className="rounded-lg border border-[#C6DED4] bg-[#EDF5F1] p-3 text-xs text-[#174C3C]">
                      <strong>Seller response:</strong> {enq.sellerReply}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    {enq.enquiryStatus === 'Accepted' ? (
                      <Link
                        to="/transactions"
                        className="text-xs font-semibold text-[#174C3C] hover:underline"
                      >
                        View Handover Transaction →
                      </Link>
                    ) : (
                      <span />
                    )}

                    {(enq.enquiryStatus === 'Pending' || enq.enquiryStatus === 'Responded') && (
                      <button
                        type="button"
                        onClick={() => handleBuyerClose(enq.enquiryId)}
                        className="rounded-lg border border-[#D4CEC0] px-3 py-1.5 text-xs font-medium text-[#525C58] hover:bg-[#EDE9DF]"
                      >
                        Close Enquiry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Atomic Accept & Create Transaction Modal */}
          {acceptingEnquiry && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="accept-modal-title"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            >
              <div className="w-full max-w-md rounded-2xl border border-[#DDD7C9] bg-white p-6 shadow-xl">
                <h2 id="accept-modal-title" className="font-display text-xl font-bold text-[#242B29]">
                  Confirm Campus Handover
                </h2>
                <p className="mt-1 text-xs text-[#525C58] leading-relaxed">
                  Reserving <strong>{acceptingEnquiry.listingTitle}</strong> for{' '}
                  <strong>{acceptingEnquiry.buyerName}</strong>. This atomically locks the listing to Reserved so no other buyer can reserve it simultaneously.
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label
                      htmlFor="tx-handover-loc"
                      className="block text-xs font-semibold text-[#242B29]"
                    >
                      Handover Location
                    </label>
                    <input
                      id="tx-handover-loc"
                      type="text"
                      value={handoverLocation}
                      onChange={(e) => setHandoverLocation(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3 py-2 text-sm text-[#242B29]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tx-handover-window"
                      className="block text-xs font-semibold text-[#242B29]"
                    >
                      Pickup Window
                    </label>
                    <input
                      id="tx-handover-window"
                      type="text"
                      value={handoverWindow}
                      onChange={(e) => setHandoverWindow(e.target.value)}
                      placeholder="e.g. Tomorrow, 5:00 PM – 6:30 PM"
                      className="mt-1 w-full rounded-lg border border-[#D4CEC0] bg-[#F8F7F2] px-3 py-2 text-sm text-[#242B29]"
                    />
                  </div>

                  <div className="rounded-lg bg-[#F8F7F2] p-3 text-xs text-[#525C58] space-y-1">
                    <div className="flex justify-between">
                      <span>Agreed Item Price:</span>
                      <span className="font-mono font-semibold text-[#242B29] tabular-nums">
                        {formatInr(acceptingEnquiry.listingPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Proposed MVP Service Fee (Planning Assumption):</span>
                      <span className="font-mono font-semibold text-[#174C3C] tabular-nums">
                        ₹{MVP_SERVICE_FEE_INR}
                      </span>
                    </div>
                    <p className="pt-1 text-[11px] text-[#78827E]">
                      No online payment is processed in this MVP. Settle directly at handover.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAcceptingEnquiry(null)}
                    className="rounded-lg border border-[#D4CEC0] bg-white px-4 py-2 text-xs font-semibold text-[#242B29]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submittingAction}
                    onClick={handleConfirmAcceptTransaction}
                    className="rounded-lg bg-[#174C3C] px-4 py-2 text-xs font-semibold text-[#F8F7F2] hover:bg-[#2F8065] disabled:opacity-60"
                  >
                    {submittingAction ? 'Reserving...' : 'Confirm Reservation'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
