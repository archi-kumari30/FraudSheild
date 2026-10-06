import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, ArrowUpRight, Loader2, Clock, CheckCircle2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Modal from '../common/Modal';

const BeneficiaryList = ({ onSelectSend }) => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [recipientEmail, setRecipientEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBeneficiaries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/beneficiaries');
      if (res.success && Array.isArray(res.data?.beneficiaries)) {
        setBeneficiaries(res.data.beneficiaries);
      }
    } catch (err) {
      console.warn('Failed to load beneficiaries:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBeneficiaries();
  }, [fetchBeneficiaries]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await axiosClient.post('/beneficiaries', {
        recipientEmail: recipientEmail.trim(),
        nickname: nickname.trim()
      });
      if (res.success) {
        await fetchBeneficiaries();
        setIsAddModalOpen(false);
        setRecipientEmail('');
        setNickname('');
      }
    } catch (err) {
      const errorMsg = err.code === 'RECIPIENT_NOT_FOUND' || err.status === 404
        ? 'No FraudShield account found with this email. Ask the recipient to create an account first.'
        : (err.message || 'Failed to add beneficiary');
      setFormError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (beneficiaryId) => {
    if (!window.confirm('Remove this beneficiary from your address book?')) return;
    try {
      const res = await axiosClient.delete(`/beneficiaries/${beneficiaryId}`);
      if (res.success) {
        setBeneficiaries((prev) => prev.filter((b) => b._id !== beneficiaryId));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete beneficiary');
    }
  };

  const getAgeBadge = (createdAt) => {
    if (!createdAt) return null;
    const diffHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#946625] bg-[#FAF4EB] border border-[#EAD7BA] px-2 py-0.5 rounded">
          <Clock className="w-3 h-3" />
          <span>New ({Math.round(diffHours)}h old)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#1E473B] bg-[#EAF3EF] border border-[#C8DCD2] px-2 py-0.5 rounded">
        <CheckCircle2 className="w-3 h-3" />
        <span>Established</span>
      </span>
    );
  };

  return (
    <div className="bg-[#FAFCFA] rounded-xl p-5 sm:p-6 border border-[#D4E2DC] shadow-card space-y-4 text-[#17211D]">
      <div className="flex items-center justify-between pb-4 border-b border-[#D4E2DC]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#EDF6F1] text-[#285C4D] flex items-center justify-center border border-[#D4E2DC]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#17211D]">Beneficiary Directory</h3>
            <p className="text-xs text-[#5A6E65]">Whitelisted contacts and payee relationship ages</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Beneficiary</span>
        </button>
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="py-8 flex items-center justify-center text-[#5A6E65] text-xs">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#285C4D]" />
            Loading contacts...
          </div>
        ) : beneficiaries.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-10 h-10 rounded-lg bg-[#EDF6F1] border border-[#D4E2DC] text-[#5A6E65] flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-[#17211D]">No saved beneficiaries</p>
            <p className="text-[11px] text-[#5A6E65] mt-0.5">
              Add frequent payees to make fast, reliable transfers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {beneficiaries.map((b) => {
              const account = b.recipientAccountId || {};
              const displayName = b.nickname || account.name || 'Beneficiary';
              const email = account.email || '';
              const accountId = account._id || b.recipientAccountId;

              return (
                <div
                  key={b._id}
                  className="p-3.5 rounded-lg border border-[#D4E2DC] bg-[#EDF6F1] hover:border-[#285C4D]/40 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#DCEBE4] text-[#285C4D] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D4E2DC]">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[#17211D] truncate">{displayName}</h4>
                        <p className="text-[10px] text-[#5A6E65] truncate font-mono">{email}</p>
                        <span className="text-[10px] text-[#285C4D] font-medium block mt-0.5">Saved Recipient</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(b._id)}
                      className="p-1 text-[#5A6E65] hover:text-[#8C3E3A] rounded hover:bg-[#FBF0EF] transition-colors"
                      title="Remove contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#D4E2DC] flex items-center justify-between">
                    <div>{getAgeBadge(b.createdAt)}</div>
                    <button
                      onClick={() => onSelectSend(accountId)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#285C4D] hover:underline"
                    >
                      <span>Send Money</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Beneficiary Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setFormError('');
        }}
        title="Add Beneficiary"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <p className="text-xs text-[#5A6E65]">
            Add a recipient to your saved address book. Beneficiaries added less than 24 hours ago are monitored for high-value transfer spikes (Rule 4: New Beneficiary).
          </p>

          {formError && (
            <div className="p-3 rounded-lg bg-[#FBF0EF] border border-[#E6BFBD] text-[#8C3E3A] text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
              Name / Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
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
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
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
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#D4E2DC] text-[#5A6E65] hover:text-[#17211D] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Beneficiary'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BeneficiaryList;
