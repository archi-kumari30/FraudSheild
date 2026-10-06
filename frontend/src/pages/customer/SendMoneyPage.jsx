import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  CreditCard,
  FileText,
  Users,
  Plus,
  Clock,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { useAlerts } from '../../context/AlertContext';
import Modal from '../../components/common/Modal';

const SendMoneyPage = () => {
  const { wallet, refreshWallet } = useAuth();
  const { fetchAlerts } = useAlerts();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1); // 1: Beneficiary, 2: Amount, 3: Review, 4: Result
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [recipientMode, setRecipientMode] = useState('saved'); // 'saved' | 'custom'
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [customRecipientInput, setCustomRecipientInput] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [outcome, setOutcome] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Quick Add Beneficiary inline modal
  const [isAddBenModalOpen, setIsAddBenModalOpen] = useState(false);
  const [newBenName, setNewBenName] = useState('');
  const [newBenEmail, setNewBenEmail] = useState('');
  const [addBenError, setAddBenError] = useState('');
  const [isAddingBen, setIsAddingBen] = useState(false);

  const fetchBeneficiariesList = async () => {
    try {
      const res = await axiosClient.get('/beneficiaries');
      if (res.success && Array.isArray(res.data?.beneficiaries)) {
        setBeneficiaries(res.data.beneficiaries);

        const paramRecipient = searchParams.get('recipientId');
        if (paramRecipient) {
          const match = res.data.beneficiaries.find(
            (b) =>
              (b.recipientAccountId?._id || b.recipientAccountId) === paramRecipient ||
              b._id === paramRecipient
          );
          if (match) {
            setSelectedRecipientId(match.recipientAccountId?._id || match.recipientAccountId);
            setRecipientMode('saved');
          } else {
            setCustomRecipientInput(paramRecipient);
            setRecipientMode('custom');
          }
        } else if (res.data.beneficiaries.length > 0 && !selectedRecipientId) {
          const first = res.data.beneficiaries[0];
          setSelectedRecipientId(first.recipientAccountId?._id || first.recipientAccountId);
        }
      }
    } catch (err) {
      console.warn('Could not load beneficiaries:', err.message);
    }
  };

  useEffect(() => {
    fetchBeneficiariesList();
  }, [searchParams]);

  const handleAddBeneficiarySubmit = async (e) => {
    e.preventDefault();
    setAddBenError('');
    setIsAddingBen(true);
    try {
      const res = await axiosClient.post('/beneficiaries', {
        recipientEmail: newBenEmail.trim(),
        nickname: newBenName.trim()
      });
      if (res.success) {
        await fetchBeneficiariesList();
        const createdAccount = res.data?.beneficiary?.recipientAccountId;
        if (createdAccount) {
          setSelectedRecipientId(createdAccount._id || createdAccount);
          setRecipientMode('saved');
        }
        setIsAddBenModalOpen(false);
        setNewBenName('');
        setNewBenEmail('');
      }
    } catch (err) {
      const errorMsg = err.code === 'RECIPIENT_NOT_FOUND' || err.status === 404
        ? 'No FraudShield account found with this email. Ask the recipient to create an account first.'
        : (err.message || 'Failed to add beneficiary');
      setAddBenError(errorMsg);
    } finally {
      setIsAddingBen(false);
    }
  };

  const getRecipientDisplayName = () => {
    if (recipientMode === 'custom') {
      return customRecipientInput.trim();
    }
    const found = beneficiaries.find(
      (b) => (b.recipientAccountId?._id || b.recipientAccountId) === selectedRecipientId
    );
    if (found) {
      return found.nickname || found.recipientAccountId?.name || found.recipientAccountId?.email || 'Saved Contact';
    }
    return selectedRecipientId || 'Selected Beneficiary';
  };

  const getRecipientSubtext = () => {
    if (recipientMode === 'custom') {
      return 'Direct manual account entry';
    }
    const found = beneficiaries.find(
      (b) => (b.recipientAccountId?._id || b.recipientAccountId) === selectedRecipientId
    );
    if (found && found.recipientAccountId?.email) {
      return found.recipientAccountId.email;
    }
    return '';
  };

  const getBeneficiaryAgeHours = () => {
    if (recipientMode !== 'saved') return null;
    const found = beneficiaries.find(
      (b) => (b.recipientAccountId?._id || b.recipientAccountId) === selectedRecipientId
    );
    if (!found || !found.createdAt) return null;
    const diffMs = Date.now() - new Date(found.createdAt).getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60));
  };

  const handleNextFromStep1 = (e) => {
    if (e) e.preventDefault();
    setFormError('');

    let target = recipientMode === 'saved' ? selectedRecipientId : customRecipientInput.trim();
    if (!target) {
      setFormError('Please choose a beneficiary or enter a recipient identifier.');
      return;
    }
    setCurrentStep(2);
  };

  const handleNextFromStep2 = (e) => {
    if (e) e.preventDefault();
    setFormError('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Please enter a valid positive transfer amount.');
      return;
    }
    if (wallet && numericAmount > wallet.availableBalance) {
      setFormError(`Insufficient available balance (Available: ₹${wallet.availableBalance.toLocaleString('en-IN')})`);
      return;
    }
    setCurrentStep(3);
  };

  const handleConfirmAndSend = async () => {
    if (isSubmitting) return;
    setFormError('');
    setIsSubmitting(true);

    let targetRecipientId = recipientMode === 'saved' ? selectedRecipientId : customRecipientInput.trim();

    try {
      const res = await axiosClient.post('/transactions', {
        recipientId: targetRecipientId,
        amount: parseFloat(amount),
        note: note.trim()
      });

      const txStatus = res.data?.status || res.data?.transaction?.status || 'APPROVED';
      const txData = res.data?.transaction || {};
      const riskScore = res.data?.riskScore ?? txData.riskScore ?? 0;
      const riskLevel = res.data?.riskLevel ?? txData.riskLevel ?? 'LOW';
      const triggeredRules = txData.triggeredRules || [];

      setOutcome({
        status: txStatus,
        transaction: txData,
        riskScore,
        riskLevel,
        triggeredRules
      });
      setCurrentStep(4);
      await refreshWallet();
      await fetchAlerts();
    } catch (err) {
      if (err.data?.status === 'BLOCKED' || err.status === 'BLOCKED') {
        const txData = err.data?.transaction || {};
        setOutcome({
          status: 'BLOCKED',
          transaction: txData,
          riskScore: err.data?.riskScore ?? txData.riskScore ?? 85,
          riskLevel: err.data?.riskLevel ?? txData.riskLevel ?? 'HIGH',
          triggeredRules: txData.triggeredRules || [],
          message: err.message || 'Transaction was blocked due to elevated security risk.'
        });
        setCurrentStep(4);
        await fetchAlerts();
      } else {
        const errorMsg = err.code === 'RECIPIENT_NOT_FOUND' || err.status === 404
          ? 'No FraudShield account found with this email. Ask the recipient to create an account first.'
          : (err.message || 'Failed to initiate transfer. Please verify recipient details.');
        setFormError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!outcome?.transaction?._id) return;
    setIsVerifying(true);
    setVerificationError('');
    try {
      const res = await axiosClient.post(`/transactions/${outcome.transaction._id}/confirm`);
      if (res.success && res.data) {
        const updatedTx = res.data.transaction;
        const newStatus = res.data.status || updatedTx.status;
        setOutcome((prev) => ({
          ...prev,
          status: newStatus,
          transaction: updatedTx,
          message: res.message
        }));
        await refreshWallet();
        await fetchAlerts();
      }
    } catch (err) {
      if (err.data?.status === 'BLOCKED' || err.status === 'BLOCKED') {
        setOutcome((prev) => ({
          ...prev,
          status: 'BLOCKED',
          transaction: err.data?.transaction || prev.transaction,
          message: err.message || 'Payment Blocked'
        }));
        await refreshWallet();
        await fetchAlerts();
      } else {
        setVerificationError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReportUnauthorized = async () => {
    if (!outcome?.transaction?._id) return;
    setIsVerifying(true);
    setVerificationError('');
    try {
      const res = await axiosClient.post(`/transactions/${outcome.transaction._id}/escalate`, {
        reason: 'Customer reported they did not initiate this payment'
      });
      if (res.success && res.data) {
        setOutcome((prev) => ({
          ...prev,
          status: 'FLAGGED_FOR_REVIEW',
          transaction: res.data.transaction,
          message: 'Transaction reported and escalated to Fraud Operations.'
        }));
        await refreshWallet();
        await fetchAlerts();
      }
    } catch (err) {
      setVerificationError(err.message || 'Failed to escalate. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setAmount('');
    setNote('');
    setOutcome(null);
    setFormError('');
    setVerificationError('');
    setIsVerifying(false);
    setCurrentStep(1);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#17211D]">
          Send Money
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E65] mt-1">
          Peer-to-peer transfers evaluated by deterministic fraud heuristics in real time.
        </p>
      </div>

      {/* Multi-Step Indicator */}
      {currentStep < 4 && (
        <div className="flex items-center justify-between border-b border-[#D4E2DC] pb-4 text-xs font-semibold">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-[#285C4D]' : 'text-[#5A6E65]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 1 ? 'bg-[#285C4D] text-white font-bold' : 'bg-[#DCEBE4] text-[#5A6E65]'}`}>
              1
            </span>
            <span>Choose Beneficiary</span>
          </div>
          <div className="h-0.5 flex-1 bg-[#D4E2DC] mx-3" />
          <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-[#285C4D]' : 'text-[#5A6E65]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 2 ? 'bg-[#285C4D] text-white font-bold' : 'bg-[#DCEBE4] text-[#5A6E65]'}`}>
              2
            </span>
            <span>Transfer Amount</span>
          </div>
          <div className="h-0.5 flex-1 bg-[#D4E2DC] mx-3" />
          <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-[#285C4D]' : 'text-[#5A6E65]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${currentStep >= 3 ? 'bg-[#285C4D] text-white font-bold' : 'bg-[#DCEBE4] text-[#5A6E65]'}`}>
              3
            </span>
            <span>Review Payment</span>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {formError && (
        <div className="p-3.5 rounded-lg bg-[#FBF0EF] border border-[#E6BFBD] text-[#8C3E3A] text-xs font-medium">
          {formError}
        </div>
      )}

      {/* STEP 1: CHOOSE BENEFICIARY */}
      {currentStep === 1 && (
        <div className="bg-[#FAFCFA] rounded-xl p-6 sm:p-8 border border-[#D4E2DC] shadow-card space-y-6 text-[#17211D]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#17211D]">Step 1: Choose Beneficiary</h2>
              <p className="text-xs text-[#5A6E65] mt-0.5">
                Select a saved payee or enter a recipient account identifier.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#EDF6F1] p-1 rounded-lg border border-[#D4E2DC] text-xs font-medium text-[#5A6E65] self-start sm:self-center">
              <button
                type="button"
                onClick={() => setRecipientMode('saved')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  recipientMode === 'saved' ? 'bg-[#FAFCFA] text-[#285C4D] font-semibold shadow-xs' : ''
                }`}
              >
                Saved Beneficiaries
              </button>
              <button
                type="button"
                onClick={() => setRecipientMode('custom')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  recipientMode === 'custom' ? 'bg-[#FAFCFA] text-[#285C4D] font-semibold shadow-xs' : ''
                }`}
              >
                Enter Email / ID
              </button>
            </div>
          </div>

          {recipientMode === 'saved' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {beneficiaries.map((b) => {
                  const account = b.recipientAccountId || {};
                  const id = account._id || b.recipientAccountId;
                  const name = b.nickname || account.name || 'Saved Recipient';
                  const email = account.email || '';
                  const isSelected = selectedRecipientId === id;

                  const diffHours = b.createdAt
                    ? (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60)
                    : 100;
                  const isNew = diffHours < 24;

                  return (
                    <button
                      key={b._id}
                      type="button"
                      onClick={() => {
                        setSelectedRecipientId(id);
                        setFormError('');
                      }}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-[#285C4D] bg-[#EAF3EF] ring-1 ring-[#285C4D] shadow-xs'
                          : 'border-[#D4E2DC] bg-[#FAFCFA] hover:bg-[#EDF6F1]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-[#285C4D] text-white border-[#285C4D]'
                              : 'bg-[#DCEBE4] text-[#285C4D] border-[#D4E2DC]'
                          }`}
                        >
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#17211D] truncate">{name}</h4>
                          <p className="text-[11px] text-[#5A6E65] truncate font-mono">{email}</p>
                          <div className="mt-1">
                            {isNew ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#946625] bg-[#FAF4EB] border border-[#EAD7BA] px-1.5 py-0.5 rounded">
                                <Clock className="w-2.5 h-2.5" />
                                <span>New ({Math.round(diffHours)}h)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#1E473B] bg-[#EAF3EF] border border-[#C8DCD2] px-1.5 py-0.5 rounded">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Established</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#285C4D] text-white flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}

                {/* Add New Beneficiary Card */}
                <button
                  type="button"
                  onClick={() => setIsAddBenModalOpen(true)}
                  className="p-4 rounded-xl border border-dashed border-[#D4E2DC] hover:border-[#285C4D] bg-[#FAFCFA] hover:bg-[#EDF6F1] text-left transition-all flex items-center justify-center gap-2 group min-h-[90px]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#EDF6F1] group-hover:bg-[#285C4D] group-hover:text-white text-[#285C4D] flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-[#285C4D]">
                    Add New Beneficiary
                  </span>
                </button>
              </div>

              {beneficiaries.length === 0 && (
                <div className="p-6 text-center bg-[#EDF6F1] rounded-xl border border-[#D4E2DC] text-xs text-[#5A6E65]">
                  <p className="font-semibold text-[#17211D]">No saved beneficiaries found.</p>
                  <p className="text-[11px] mt-1">
                    Click "Add New Beneficiary" above or switch to "Enter Email / ID" to send directly.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
                  Recipient's FraudShield Email
                </label>
                <input
                  type="email"
                  value={customRecipientInput}
                  onChange={(e) => {
                    setCustomRecipientInput(e.target.value);
                    setFormError('');
                  }}
                  placeholder="e.g. priya.recipient@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-[#17211D] focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] text-sm placeholder-[#5A6E65]/50"
                  required
                />
                <span className="text-[11px] text-[#5A6E65] block mt-1">
                  Enter the email address of an existing FraudShield customer.
                </span>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#D4E2DC] flex items-center justify-between">
            <span className="text-xs text-[#5A6E65]">
              {recipientMode === 'saved' && selectedRecipientId
                ? `Selected: ${getRecipientDisplayName()}`
                : recipientMode === 'custom' && customRecipientInput.trim()
                ? `Target: ${customRecipientInput.trim()}`
                : 'Select or enter a recipient to proceed'}
            </span>

            <button
              type="button"
              onClick={handleNextFromStep1}
              disabled={recipientMode === 'saved' ? !selectedRecipientId : !customRecipientInput.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs disabled:opacity-50 transition-colors"
            >
              <span>Continue to Amount</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ENTER AMOUNT */}
      {currentStep === 2 && (
        <div className="bg-[#FAFCFA] rounded-xl p-6 sm:p-8 border border-[#D4E2DC] shadow-card space-y-6 text-[#17211D]">
          <div className="flex items-center justify-between pb-3 border-b border-[#D4E2DC]">
            <div>
              <span className="text-[11px] text-[#5A6E65] block">Recipient</span>
              <div className="text-sm font-bold text-[#17211D]">{getRecipientDisplayName()}</div>
              {getRecipientSubtext() && (
                <div className="text-[10px] text-[#5A6E65] font-mono">{getRecipientSubtext()}</div>
              )}
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs text-[#285C4D] font-semibold hover:underline"
            >
              Change Recipient
            </button>
          </div>

          <form onSubmit={handleNextFromStep2} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
                Transfer Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65] font-semibold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-[#17211D] font-mono font-bold text-base focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D]"
                  required
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-[#5A6E65]">
                  Available Balance: <strong className="font-mono text-[#17211D]">₹{wallet?.availableBalance?.toLocaleString('en-IN') || 0}</strong>
                </span>
              </div>
            </div>

            {/* Quick Amounts */}
            <div>
              <span className="text-[11px] font-semibold text-[#5A6E65] uppercase tracking-wider block mb-1.5">
                Quick Select
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[500, 2000, 15000, 55000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className="py-1.5 px-2 rounded-lg bg-[#EDF6F1] hover:bg-[#DCEBE4] border border-[#D4E2DC] text-xs font-semibold text-[#17211D] transition-colors"
                  >
                    ₹{val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
                Transfer Note / Reference (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What is this transfer for?"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-[#17211D] text-sm focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] placeholder-[#5A6E65]/50"
              />
            </div>

            <div className="pt-4 border-t border-[#D4E2DC] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg border border-[#D4E2DC] text-[#5A6E65] hover:text-[#17211D] hover:bg-[#EDF6F1] font-medium text-xs transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs transition-colors"
              >
                <span>Review Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: REVIEW PAYMENT */}
      {currentStep === 3 && (
        <div className="bg-[#FAFCFA] rounded-xl p-6 sm:p-8 border border-[#D4E2DC] shadow-card space-y-6 text-[#17211D]">
          <div>
            <h2 className="text-base font-semibold text-[#17211D]">Step 3: Review Payment</h2>
            <p className="text-xs text-[#5A6E65] mt-0.5">
              Please review the payment details before sending.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#EDF6F1] border border-[#D4E2DC] space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[#5A6E65]">Recipient:</span>
              <span className="font-semibold text-[#17211D]">{getRecipientDisplayName()}</span>
            </div>
            {getRecipientSubtext() && (
              <div className="flex justify-between">
                <span className="text-[#5A6E65]">Account / Email:</span>
                <span className="font-mono text-[11px] text-[#17211D]">{getRecipientSubtext()}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[#5A6E65]">Transfer Amount:</span>
              <span className="font-mono font-bold text-lg text-[#17211D]">
                ₹{parseFloat(amount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5A6E65]">Payment Source:</span>
              <span className="text-[#17211D]">Simulated Digital Wallet</span>
            </div>
            {note && (
              <div className="flex justify-between">
                <span className="text-[#5A6E65]">Note:</span>
                <span className="text-[#17211D]">{note}</span>
              </div>
            )}
          </div>

          {/* High-level Security Assurance Message */}
          <div className="p-3.5 rounded-lg bg-[#F4F8F5] border border-[#D4E2DC] text-xs text-[#5A6E65] flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#285C4D] shrink-0" />
            <span>
              FraudShield will automatically evaluate this payment before settlement.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#D4E2DC]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg border border-[#D4E2DC] text-[#5A6E65] hover:text-[#17211D] hover:bg-[#EDF6F1] font-medium text-xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmAndSend}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 py-2.5 px-6 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating & Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirm & Send Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: OUTCOME & RESULT */}
      {currentStep === 4 && outcome && (
        <div className="bg-[#FAFCFA] rounded-xl p-6 sm:p-8 border border-[#D4E2DC] text-center space-y-6 shadow-card text-[#17211D]">
          {/* LOW RISK: APPROVED */}
          {outcome.status === 'APPROVED' && (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#EAF3EF] border border-[#C8DCD2] text-[#285C4D] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#17211D]">Payment Completed</h2>
              <p className="text-xs text-[#5A6E65] max-w-md mx-auto">
                Money has been transferred. Your payment of <strong className="text-[#285C4D] font-mono font-bold">₹{parseFloat(amount).toLocaleString('en-IN')}</strong> to <strong className="text-[#17211D]">{getRecipientDisplayName()}</strong> completed instantly.
              </p>
            </div>
          )}

          {/* MEDIUM RISK: CUSTOMER VERIFICATION REQUIRED */}
          {outcome.status === 'CUSTOMER_VERIFICATION_REQUIRED' && (
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#FAF4EB] border border-[#EAD7BA] text-[#C89445] flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#946625]">Additional Verification Required</h2>
              <div className="p-4 rounded-lg bg-[#FAF4EB] border border-[#EAD7BA] text-left text-xs text-[#946625] leading-relaxed max-w-lg mx-auto space-y-3">
                <p className="font-semibold text-[#17211D]">
                  Your payment is temporarily on hold while we verify that you initiated this transaction.
                </p>
                <p className="text-xs text-[#5A6E65]">
                  FraudShield detected unusual activity. Please confirm that you initiated this payment.
                </p>
                <div className="text-[11px] text-[#5A6E65] space-y-1 pt-1 border-t border-[#EAD7BA]/60">
                  <div>• Amount of <strong className="font-mono text-[#17211D]">₹{parseFloat(amount).toLocaleString('en-IN')}</strong> has been temporarily placed in your <strong>heldBalance</strong> escrow.</div>
                  <div>• Recipient has received ₹0 until you confirm this transaction.</div>
                  <div>• Once confirmed, FraudShield will verify and immediately settle funds to the recipient.</div>
                </div>
              </div>

              {verificationError && (
                <div className="p-3 rounded-lg bg-[#FBF0EF] border border-[#E6BFBD] text-[#8C3E3A] text-xs font-semibold max-w-lg mx-auto">
                  {verificationError}
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isVerifying}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Settling...</span>
                    </>
                  ) : (
                    <span>Confirm Payment</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReportUnauthorized}
                  disabled={isVerifying}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#D4E2DC] text-[#5A6E65] hover:text-[#8C3E3A] hover:bg-[#FBF0EF] font-medium text-xs transition-colors disabled:opacity-50"
                >
                  I Didn't Initiate This
                </button>
              </div>
            </div>
          )}

          {/* MEDIUM RISK: FLAGGED FOR REVIEW (ESCALATED TO ADMIN) */}
          {outcome.status === 'FLAGGED_FOR_REVIEW' && (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#FAF4EB] border border-[#EAD7BA] text-[#C89445] flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#946625]">Payment Under Security Review</h2>
              <div className="p-4 rounded-lg bg-[#FAF4EB] border border-[#EAD7BA] text-left text-xs text-[#946625] leading-relaxed max-w-lg mx-auto space-y-2">
                <p className="font-semibold text-[#17211D]">
                  Your payment has been escalated to Fraud Operations for investigation.
                </p>
                <div className="text-[11px] text-[#5A6E65] space-y-1">
                  <div>• Amount of <strong className="font-mono text-[#17211D]">₹{parseFloat(amount).toLocaleString('en-IN')}</strong> remains in escrow.</div>
                  <div>• Recipient has received ₹0 while a fraud analyst investigates.</div>
                  <div>• If approved by an administrator, funds transfer to recipient; if rejected, funds return to your available balance.</div>
                </div>
              </div>
            </div>
          )}

          {/* HIGH RISK: BLOCKED */}
          {outcome.status === 'BLOCKED' && (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#FBF0EF] border border-[#E6BFBD] text-[#B65D59] flex items-center justify-center mx-auto">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-serif font-bold text-[#8C3E3A]">Payment Blocked</h2>
              <div className="p-4 rounded-lg bg-[#FBF0EF] border border-[#E6BFBD] text-left text-xs text-[#8C3E3A] leading-relaxed max-w-lg mx-auto space-y-2">
                <p className="font-semibold text-[#17211D]">
                  FraudShield blocked this payment because multiple security signals indicated a high-risk transaction.
                </p>
                <div className="text-[11px] text-[#5A6E65] space-y-1">
                  <div>• <strong>Zero funds</strong> were transferred to recipient.</div>
                  <div>• Recipient has received ₹0.</div>
                  <div>• An immutable security alert and incident audit log have been recorded.</div>
                </div>
              </div>
            </div>
          )}

          {/* Customer Payment Information Receipt */}
          <div className="bg-[#EDF6F1] border border-[#D4E2DC] rounded-xl p-5 text-left space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4E2DC]">
              <h3 className="text-xs font-semibold text-[#17211D]">
                Payment Information
              </h3>
              <span className="text-[10px] text-[#285C4D] font-mono">
                {outcome.transaction?._id ? `#${outcome.transaction._id}` : 'Transaction Reference'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#FAFCFA] p-3 rounded-lg border border-[#D4E2DC]">
                <span className="text-[10px] text-[#5A6E65] block">Transfer Amount</span>
                <span className="text-sm font-bold font-mono text-[#17211D]">
                  ₹{parseFloat(amount).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="bg-[#FAFCFA] p-3 rounded-lg border border-[#D4E2DC]">
                <span className="text-[10px] text-[#5A6E65] block">Recipient</span>
                <span className="text-xs font-bold text-[#17211D] truncate block">
                  {getRecipientDisplayName()}
                </span>
              </div>
              <div className="bg-[#FAFCFA] p-3 rounded-lg border border-[#D4E2DC]">
                <span className="text-[10px] text-[#5A6E65] block">Security Tier</span>
                <span className={`text-xs font-bold ${
                  (outcome.riskLevel ?? 'LOW') === 'HIGH' ? 'text-[#8C3E3A]' :
                  (outcome.riskLevel ?? 'LOW') === 'MEDIUM' ? 'text-[#946625]' : 'text-[#1E473B]'
                }`}>
                  {outcome.riskLevel ?? outcome.transaction?.riskLevel ?? 'LOW'}
                </span>
              </div>
              <div className="bg-[#FAFCFA] p-3 rounded-lg border border-[#D4E2DC]">
                <span className="text-[10px] text-[#5A6E65] block">Status</span>
                <span className="text-xs font-bold text-[#17211D]">
                  {outcome.status === 'APPROVED' ? 'Approved' :
                   outcome.status === 'CUSTOMER_VERIFICATION_REQUIRED' ? 'Verification Required' :
                   outcome.status === 'FLAGGED_FOR_REVIEW' ? 'Flagged for Review' :
                   outcome.status === 'BLOCKED' ? 'Blocked' : outcome.status}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#D4E2DC] flex items-center gap-2 text-xs text-[#5A6E65]">
              <ShieldCheck className="w-4 h-4 text-[#285C4D] shrink-0" />
              <span>
                FraudShield automatically evaluates every payment before settlement to safeguard your account against unauthorized transactions.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#D4E2DC] flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs transition-colors"
            >
              Send Another Payment
            </button>
            <Link
              to="/transactions"
              className="px-5 py-2.5 rounded-lg bg-[#FAFCFA] hover:bg-[#EDF6F1] text-[#17211D] font-medium text-xs border border-[#D4E2DC] transition-colors"
            >
              View Transactions
            </Link>
            <Link
              to="/security"
              className="px-5 py-2.5 rounded-lg bg-[#FAFCFA] hover:bg-[#EDF6F1] text-[#17211D] font-medium text-xs border border-[#D4E2DC] transition-colors"
            >
              Security Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Quick Add Beneficiary Modal */}
      <Modal
        isOpen={isAddBenModalOpen}
        onClose={() => {
          setIsAddBenModalOpen(false);
          setAddBenError('');
        }}
        title="Add Beneficiary"
      >
        <form onSubmit={handleAddBeneficiarySubmit} className="space-y-4">
          <p className="text-xs text-[#5A6E65]">
            Add a recipient to your address book. Beneficiaries added within 24 hours are subject to Rule 4 for transfers above ₹10,000.
          </p>

          {addBenError && (
            <div className="p-3 rounded-lg bg-[#FBF0EF] border border-[#E6BFBD] text-[#8C3E3A] text-xs font-medium">
              {addBenError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
              Name / Nickname
            </label>
            <input
              type="text"
              value={newBenName}
              onChange={(e) => setNewBenName(e.target.value)}
              placeholder="e.g. Rahul Kumar"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-[#17211D] focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
              Recipient's FraudShield Email
            </label>
            <input
              type="email"
              value={newBenEmail}
              onChange={(e) => setNewBenEmail(e.target.value)}
              placeholder="e.g. rahul@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] text-[#17211D] focus:border-[#285C4D] focus:ring-1 focus:ring-[#285C4D] text-sm"
              required
            />
            <span className="text-[11px] text-[#5A6E65] block mt-1">
              Enter the email address of an existing FraudShield customer.
            </span>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-[#D4E2DC]">
            <button
              type="button"
              onClick={() => setIsAddBenModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#D4E2DC] text-[#5A6E65] hover:text-[#17211D] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAddingBen}
              className="px-5 py-2 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs disabled:opacity-50"
            >
              {isAddingBen ? 'Adding...' : 'Add Beneficiary'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SendMoneyPage;
