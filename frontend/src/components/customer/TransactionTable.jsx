import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, History, Search, Loader2, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import axiosClient from '../../api/axiosClient';

const TransactionTable = ({ transactions = [], loading = false, onRefresh }) => {
  const { user, refreshWallet } = useAuth();
  const { fetchAlerts } = useAlerts();
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [resolvedTxMap, setResolvedTxMap] = useState({});
  const [notification, setNotification] = useState(null);

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const handleInlineConfirm = async (tx) => {
    const txId = tx._id;
    if (confirmingId || resolvedTxMap[txId]) return;

    setConfirmingId(txId);
    setNotification(null);

    try {
      const res = await axiosClient.post(`/transactions/${txId}/confirm`);
      const newStatus = res.data?.status || res.data?.transaction?.status || 'APPROVED';
      const formattedAmount = formatINR(tx.amount);

      setResolvedTxMap((prev) => ({
        ...prev,
        [txId]: {
          status: newStatus,
          message: newStatus === 'APPROVED' ? 'Payment Completed' : 'Payment Blocked'
        }
      }));

      if (newStatus === 'APPROVED') {
        setNotification({
          type: 'success',
          title: 'Payment Completed',
          message: `Your payment of ${formattedAmount} has been verified and settled to the recipient.`
        });
      } else if (newStatus === 'BLOCKED') {
        setNotification({
          type: 'blocked',
          title: 'Payment Blocked',
          message: `Payment of ${formattedAmount} was blocked during security screening. Escrow funds refunded to your wallet; recipient received ₹0.`
        });
      }

      if (refreshWallet) await refreshWallet();
      if (fetchAlerts) await fetchAlerts();
      if (onRefresh) await onRefresh();
    } catch (err) {
      if (err.data?.status === 'BLOCKED' || err.status === 'BLOCKED') {
        const formattedAmount = formatINR(tx.amount);
        setResolvedTxMap((prev) => ({
          ...prev,
          [txId]: {
            status: 'BLOCKED',
            message: 'Payment Blocked'
          }
        }));
        setNotification({
          type: 'blocked',
          title: 'Payment Blocked',
          message: `Payment of ${formattedAmount} was blocked during security screening. Escrow funds refunded to your wallet; recipient received ₹0.`
        });
        if (refreshWallet) await refreshWallet();
        if (fetchAlerts) await fetchAlerts();
        if (onRefresh) await onRefresh();
      } else {
        const errorMsg =
          err.message ||
          (err.code === 'CONCURRENT_CONFIRMATION'
            ? 'This payment is currently being processed.'
            : err.code === 'ALREADY_PROCESSED'
            ? 'This payment has already been verified.'
            : 'Payment verification failed. Please try again.');
        setNotification({
          type: 'error',
          title: 'Verification Failed',
          message: errorMsg
        });
      }
    } finally {
      setConfirmingId(null);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const currentStatus = resolvedTxMap[tx._id]?.status || tx.status;
    if (filter !== 'ALL' && currentStatus !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const note = (tx.note || '').toLowerCase();
      const sender = (tx.senderId?.name || tx.senderId?.email || '').toLowerCase();
      const recipient = (tx.recipientId?.name || tx.recipientId?.email || '').toLowerCase();
      return note.includes(term) || sender.includes(term) || recipient.includes(term);
    }
    return true;
  });

  return (
    <div className="bg-[#FAFCFA] rounded-xl p-5 sm:p-6 border border-[#D4E2DC] shadow-card space-y-4 text-[#17211D]">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4E2DC]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#EDF6F1] text-[#285C4D] flex items-center justify-center border border-[#D4E2DC]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#17211D]">Transaction History</h3>
            <p className="text-xs text-[#5A6E65]">Ledger of outbound and inbound payments</p>
          </div>
        </div>

        {/* Filter Pills and Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#5A6E65] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-xs text-[#17211D] placeholder-[#5A6E65]/60 focus:outline-none focus:border-[#285C4D] w-32 sm:w-40"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#EDF6F1] p-1 rounded-lg border border-[#D4E2DC]">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'CUSTOMER_VERIFICATION_REQUIRED', label: 'Verification Required' },
              { id: 'FLAGGED_FOR_REVIEW', label: 'In Review' },
              { id: 'BLOCKED', label: 'Blocked' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  filter === tab.id
                    ? 'bg-[#FAFCFA] text-[#285C4D] font-semibold shadow-xs'
                    : 'text-[#5A6E65] hover:text-[#17211D]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-medium flex items-center justify-between gap-3 ${
            notification.type === 'success'
              ? 'bg-[#EAF3EF] border-[#C8DCD2] text-[#1E473B]'
              : notification.type === 'blocked'
              ? 'bg-[#FBF0EF] border-[#E6BFBD] text-[#8C3E3A]'
              : 'bg-[#FBF0EF] border-[#E6BFBD] text-[#8C3E3A]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#285C4D]" />
            ) : notification.type === 'blocked' ? (
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#B65D59]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B65D59]" />
            )}
            <div>
              <strong className="font-semibold block">{notification.title}</strong>
              <span className="text-[11px] opacity-90">{notification.message}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs p-1 rounded hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-opacity"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Table Content */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#5A6E65]">
          Loading transaction activity...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-12 text-center text-xs text-[#5A6E65]">
          No transactions found matching your criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D4E2DC] text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider">
                <th className="pb-3 px-3">Type</th>
                <th className="pb-3 px-3">Counterparty</th>
                <th className="pb-3 px-3">Amount</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4E2DC]">
              {filteredTransactions.map((tx) => {
                const currentUserId = user?._id || user?.id;
                const isOutbound =
                  (tx.senderId?._id || tx.senderId) === currentUserId;
                const counterpartyName = isOutbound
                  ? tx.recipientId?.name || tx.recipientId?.email || 'Recipient'
                  : tx.senderId?.name || tx.senderId?.email || 'Sender';

                return (
                  <tr key={tx._id} className="hover:bg-[#F4F8F5] transition-colors">
                    {/* Direction Icon & Type */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isOutbound
                              ? 'bg-[#FBF0EF] text-[#8C3E3A]'
                              : 'bg-[#EAF3EF] text-[#1E473B]'
                          }`}
                        >
                          {isOutbound ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className="font-medium text-[#17211D]">
                          {isOutbound ? 'Transfer Out' : 'Received'}
                        </span>
                      </div>
                    </td>

                    {/* Counterparty */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#17211D]">
                        {counterpartyName}
                      </div>
                      {tx.note && (
                        <div className="text-[11px] text-[#5A6E65] truncate max-w-xs">
                          {tx.note}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3">
                      <span
                        className={`font-mono font-bold ${
                          isOutbound ? 'text-[#17211D]' : 'text-[#285C4D]'
                        }`}
                      >
                        {isOutbound ? '-' : '+'}
                        {formatINR(tx.amount)}
                      </span>
                    </td>

                    {/* Status Badge & Actions */}
                    <td className="py-3 px-3">
                      <div>
                        {(() => {
                          const currentStatus = resolvedTxMap[tx._id]?.status || tx.status;
                          return (
                            <>
                              <StatusBadge status={currentStatus} />
                              {currentStatus === 'APPROVED' && (
                                <div className="text-[10px] text-[#1E473B] font-medium mt-1">
                                  Payment completed
                                </div>
                              )}
                              {currentStatus === 'CUSTOMER_VERIFICATION_REQUIRED' && (
                                <div className="mt-1 space-y-1">
                                  <div className="text-[10px] text-[#946625] font-semibold">
                                    Verification Required
                                  </div>
                                  {isOutbound && !resolvedTxMap[tx._id] && (
                                    <button
                                      type="button"
                                      onClick={() => handleInlineConfirm(tx)}
                                      disabled={confirmingId !== null || !!resolvedTxMap[tx._id]}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#285C4D] text-white text-[10px] font-bold hover:bg-[#1d453a] transition-colors shadow-xs disabled:opacity-50"
                                    >
                                      {confirmingId === tx._id ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          <span>Verifying...</span>
                                        </>
                                      ) : (
                                        <span>Confirm Payment</span>
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                              {currentStatus === 'FLAGGED_FOR_REVIEW' && (
                                <div className="text-[10px] text-[#946625] font-medium mt-1">
                                  Funds held — under security review
                                </div>
                              )}
                              {currentStatus === 'BLOCKED' && (
                                <div className="text-[10px] text-[#8C3E3A] font-medium mt-1">
                                  Payment blocked — no funds deducted
                                </div>
                              )}
                              {currentStatus === 'REJECTED' && (
                                <div className="text-[10px] text-[#8C3E3A] font-medium mt-1">
                                  Review rejected — funds refunded
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-[#5A6E65] font-mono text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString()}{' '}
                      {new Date(tx.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
