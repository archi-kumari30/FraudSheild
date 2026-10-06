import React, { useState, useEffect } from 'react';
import TransactionTable from '../../components/customer/TransactionTable';
import axiosClient from '../../api/axiosClient';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const TransactionsPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/transactions');
      if (res.success && Array.isArray(res.data?.transactions)) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.warn('Failed to load transaction history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#17211D]">
          Transactions & Activity
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E65] mt-1">
          Historical ledger of all sent, received, held, and screened wallet payments.
        </p>
      </div>

      <TransactionTable
        transactions={transactions}
        loading={loading}
        onRefresh={fetchAll}
      />

      {/* Transaction Detail Modal if selected */}
      {selectedTx && (
        <Modal
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title="Payment Details"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-lg bg-[#EDF6F1] border border-[#D4E2DC] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[#5A6E65]">Status</span>
                <StatusBadge status={selectedTx.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5A6E65]">Amount</span>
                <span className="text-lg font-bold font-mono text-[#17211D]">{formatINR(selectedTx.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5A6E65]">Date</span>
                <span className="text-[#17211D] font-mono">{new Date(selectedTx.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5A6E65]">Reference ID</span>
                <span className="font-mono text-[#17211D]">{selectedTx._id}</span>
              </div>
            </div>

            {selectedTx.note && (
              <div className="p-3 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC]">
                <span className="text-[#5A6E65] block mb-1">Transfer Note</span>
                <span className="text-[#17211D] font-medium">{selectedTx.note}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TransactionsPage;
