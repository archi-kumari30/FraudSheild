import React from 'react';
import { useNavigate } from 'react-router-dom';
import BeneficiaryList from '../../components/customer/BeneficiaryList';

const BeneficiariesPage = () => {
  const navigate = useNavigate();

  const handlePay = (recipientId) => {
    navigate(`/send-money?recipientId=${recipientId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#17211D]">
          Saved Beneficiaries
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E65] mt-1">
          Whitelisted transfer recipients and verified payee accounts.
        </p>
      </div>

      <BeneficiaryList onSelectSend={handlePay} />
    </div>
  );
};

export default BeneficiariesPage;
