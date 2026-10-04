import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import BeneficiaryList from '../../components/customer/BeneficiaryList';
import SendMoneyModal from '../../components/customer/SendMoneyModal';

const BeneficiariesPage = () => {
  const [isSendMoneyOpen, setIsSendMoneyOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const handlePay = (recipientId) => {
    setSelectedRecipient(recipientId);
    setIsSendMoneyOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Address Book
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your verified beneficiaries and contacts for expedited payments.
          </p>
        </div>

        <BeneficiaryList onSelectSend={handlePay} />
      </main>

      <SendMoneyModal
        isOpen={isSendMoneyOpen}
        onClose={() => {
          setIsSendMoneyOpen(false);
          setSelectedRecipient(null);
        }}
        initialRecipient={selectedRecipient}
      />
    </div>
  );
};

export default BeneficiariesPage;
