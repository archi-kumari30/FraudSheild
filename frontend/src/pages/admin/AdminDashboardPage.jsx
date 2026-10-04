import React, { useState, useEffect, useCallback } from 'react';
import AdminNavbar from '../../components/admin/AdminNavbar';
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
      // Fetch fresh populated case details
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
    // Remove resolved case from local review queue state
    setReviews((prev) => prev.filter((r) => r._id !== transactionId));
    setToastMessage(
      decision === 'APPROVE'
        ? 'Transaction approved successfully. Escrow funds settled to recipient.'
        : decision === 'REJECT'
        ? 'Transaction rejected. Escrow funds refunded to sender.'
        : 'Queue synchronized with updated server state.'
    );
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNavbar queueCount={reviews.length} />

      {/* Success Notification Toast */}
      {toastMessage && (
        <div className="bg-slate-900 text-white px-4 py-3 text-xs font-semibold text-center border-b border-slate-800 flex items-center justify-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Fraud Incident Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time queue of transactions held in escrow by deterministic security rules awaiting analyst resolution.
          </p>
        </div>

        <ReviewQueueTable
          transactions={reviews}
          loading={loading}
          onInspect={handleInspect}
        />
      </main>

      {/* Dossier Modal */}
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
