import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, Calendar, MapPin } from 'lucide-react';
import { DashboardSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import {
  subscribeBuyerTransactions,
  subscribeSellerTransactions,
  updateTransactionStatusAtomic,
} from '../services/transactionService';
import type { TransactionRecord, TransactionStatus } from '../types/marketplace';
import { formatInr, formatShortDate, toMillis } from '../utils/marketplaceLogic';

export function TransactionsPage() {
  const { firebaseUser } = useAuth();
  const { showToast } = useToast();

  const [buyerTxs, setBuyerTxs] = useState<TransactionRecord[]>([]);
  const [sellerTxs, setSellerTxs] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    let done = 0;
    const markDone = () => {
      done += 1;
      if (done >= 2) setLoading(false);
    };

    const unsubBuyer = subscribeBuyerTransactions(firebaseUser.uid, (data) => {
      setBuyerTxs(data);
      markDone();
    });
    const unsubSeller = subscribeSellerTransactions(firebaseUser.uid, (data) => {
      setSellerTxs(data);
      markDone();
    });

    return () => {
      unsubBuyer();
      unsubSeller();
    };
  }, [firebaseUser]);

  const allTransactions = [...sellerTxs, ...buyerTxs].sort(
    (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)
  );

  const handleUpdateStatus = async (
    tx: TransactionRecord,
    nextStatus: TransactionStatus
  ) => {
    if (!firebaseUser) return;
    setUpdatingId(tx.transactionId);
    try {
      await updateTransactionStatusAtomic(tx, nextStatus, firebaseUser.uid);
      showToast(
        `Transaction updated to ${nextStatus}`,
        'success',
        nextStatus === 'Completed'
          ? 'The listing has been marked Sold.'
          : nextStatus === 'Cancelled'
          ? 'The listing has been returned to Available.'
          : undefined
      );
    } catch (error) {
      showToast(
        'Could not update transaction',
        'error',
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <DashboardLayout
      title="Transactions & Handovers"
      subtitle="Coordinate local campus pickups and track mutually agreed student exchanges."
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#DDD7C9] bg-[#EDE9DF]/70 p-4 text-xs text-[#242B29] leading-relaxed">
            <strong>MVP Payment Notice:</strong> ReNest Campus does not process automated online
            payments or refunds in Version 1. Agreed item prices are settled directly between
            students at handover, and the proposed{' '}
            <strong className="font-mono">₹40</strong> service fee is displayed as an MVP
            planning assumption.
          </div>

          {allTransactions.length === 0 ? (
            <div className="rounded-2xl border border-[#DDD7C9] bg-white p-10 text-center">
              <ArrowLeftRight className="mx-auto h-8 w-8 text-[#525C58]" aria-hidden="true" />
              <p className="mt-3 text-sm text-[#525C58]">
                No handover transactions recorded yet. Accept an enquiry in My Enquiries or
                enquire on an available listing to begin.
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
              {allTransactions.map((tx) => {
                const isSeller = firebaseUser?.uid === tx.sellerId;
                const isTerminal =
                  tx.transactionStatus === 'Completed' ||
                  tx.transactionStatus === 'Cancelled';

                return (
                  <article
                    key={tx.transactionId}
                    className="rounded-xl border border-[#DDD7C9] bg-white p-5 space-y-4"
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#525C58]">
                          <span className="font-semibold text-[#174C3C]">
                            {isSeller ? 'Selling' : 'Buying'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {isSeller
                              ? `Buyer: ${tx.buyerName}`
                              : `Seller: ${tx.sellerName}`}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{formatShortDate(tx.createdAt)}</span>
                        </div>
                        <Link
                          to={`/listing/${tx.listingId}`}
                          className="mt-1 block font-display text-lg font-semibold text-[#242B29] hover:text-[#174C3C]"
                        >
                          {tx.itemTitle}
                        </Link>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs font-semibold text-[#174C3C]">
                          {tx.transactionStatus}
                        </span>
                        <p className="mt-0.5 font-mono text-lg font-bold text-[#242B29] tabular-nums">
                          {formatInr(tx.itemPrice)}
                        </p>
                        <p className="text-[11px] text-[#525C58] tabular-nums">
                          + ₹{tx.serviceFee} proposed MVP fee (planning assumption)
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 border-y border-[#EDE9DF] py-3 text-xs text-[#525C58]">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-[#2F8065]" aria-hidden="true" />
                        Handover: <strong className="text-[#242B29]">{tx.handoverLocation}</strong>
                      </span>
                      {tx.handoverWindow && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#2F8065]" aria-hidden="true" />
                          Window: <strong className="text-[#242B29]">{tx.handoverWindow}</strong>
                        </span>
                      )}
                    </div>

                    {!isTerminal && (
                      <div className="flex flex-wrap items-center gap-2">
                        {isSeller && tx.transactionStatus === 'Accepted' && (
                          <button
                            type="button"
                            disabled={updatingId === tx.transactionId}
                            onClick={() => handleUpdateStatus(tx, 'Handover Scheduled')}
                            className="rounded-lg border border-[#174C3C] bg-white px-3.5 py-2 text-xs font-semibold text-[#174C3C] hover:bg-[#EDE9DF] disabled:opacity-60"
                          >
                            Mark Handover Scheduled
                          </button>
                        )}
                        {isSeller && (
                          <button
                            type="button"
                            disabled={updatingId === tx.transactionId}
                            onClick={() => handleUpdateStatus(tx, 'Completed')}
                            className="rounded-lg bg-[#174C3C] px-3.5 py-2 text-xs font-semibold text-[#F8F7F2] hover:bg-[#2F8065] disabled:opacity-60"
                          >
                            Mark Handover Completed
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={updatingId === tx.transactionId}
                          onClick={() => handleUpdateStatus(tx, 'Cancelled')}
                          className="rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          Cancel Transaction
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
