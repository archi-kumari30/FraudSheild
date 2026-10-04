import React, { useState, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import TransactionTable from '../../components/customer/TransactionTable';
import axiosClient from '../../api/axiosClient';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchAll();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Transfers & Activity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete historical audit trail of all sent and received digital wallet payments.
          </p>
        </div>

        <TransactionTable transactions={transactions} loading={loading} />
      </main>
    </div>
  );
};

export default TransactionsPage;
