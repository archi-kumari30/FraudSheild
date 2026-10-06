import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import ReviewQueueTable from '../../components/admin/ReviewQueueTable';
import CaseDetailModal from '../../components/admin/CaseDetailModal';
import axiosClient from '../../api/axiosClient';

const AdminDashboardPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/admin/reviews');
      if (res.success && Array.isArray(res.data?.reviews)) {
        setReviews(res.data.reviews);
      }
    } catch (err) {
      console.warn('Failed to load review queue:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleInspect = async (tx) => {
    try {
      const res = await axiosClient.get(`/admin/reviews/${tx._id}`);
      if (res.success && res.data?.review) {
        setSelectedCase(res.data.review);
      } else {
        setSelectedCase(tx);
      }
    } catch (e) {
      setSelectedCase(tx);
    }
    setIsCaseModalOpen(true);
  };

  const handleCaseResolved = (transactionId, decision) => {
    setReviews((prev) => prev.filter((r) => r._id !== transactionId));
    setToastMessage(
      decision === 'APPROVE'
        ? 'Transaction approved successfully. Escrow funds settled to recipient.'
        : decision === 'REJECT'
        ? 'Transaction rejected. Escrow funds refunded to sender available balance.'
        : 'Review queue synchronized.'
    );
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-[#EAF3EF] border border-[#D4E2DC] text-[#285C4D] px-4 py-3 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#285C4D]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17211D]">
          Fraud Incident Review Queue
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E65] mt-1">
          Transactions quarantined in escrow by deterministic security heuristics awaiting human analyst determination.
        </p>
      </div>

      {/* Human-in-the-Loop Escrow Protocol Card */}
      <div className="p-4 rounded-xl bg-[#FAFCFA] border border-[#D4E2DC] text-xs text-[#17211D] leading-relaxed space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-[#17211D]">
          <span className="w-2 h-2 rounded-full bg-[#C89445] shrink-0" />
          <span>Human-in-the-Loop Escrow Protocol:</span>
        </div>
        <p className="text-[#5A6E65]">
          When transactions trigger heuristic risk scores between 31 and 70 (Medium Risk), funds are moved from sender available balance into held balance. AI models cannot approve or reject transactions. Verified analysts must examine signals and submit mandatory written audit notes (min 10 characters) to settle or refund funds.
        </p>
      </div>

      <ReviewQueueTable
        transactions={reviews}
        loading={loading}
        onInspect={handleInspect}
      />

      {/* Case Dossier Modal */}
      <CaseDetailModal
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        transaction={selectedCase}
        onResolved={handleCaseResolved}
      />
    </div>
  );
};

export default AdminDashboardPage;
