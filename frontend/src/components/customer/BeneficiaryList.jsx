import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, ArrowUpRight, User, Loader2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Modal from '../common/Modal';

const BeneficiaryList = ({ onSelectSend }) => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
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
      setFormError(err.message || 'Failed to add beneficiary');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (beneficiaryId) => {
    if (!window.confirm('Are you sure you want to remove this beneficiary?')) return;
    try {
      const res = await axiosClient.delete(`/beneficiaries/${beneficiaryId}`);
      if (res.success) {
        setBeneficiaries((prev) => prev.filter((b) => b._id !== beneficiaryId));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete beneficiary');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80">
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Saved Beneficiaries</h3>
            <p className="text-xs text-slate-400">Quick contacts for recurring payments</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-semibold text-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Content */}
      <div className="mt-5">
        {loading ? (
          <div className="py-12 flex items-center justify-center text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading contacts...
          </div>
        ) : beneficiaries.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No beneficiaries added yet</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Add frequent contacts to your address book for rapid and secure money transfers.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Add First Beneficiary
            </button>
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
                  className="p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50/50 transition-all bg-white flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {displayName}
                        </h4>
                        <p className="text-xs text-slate-400 truncate max-w-[150px]">{email}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(b._id)}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove beneficiary"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Added {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => onSelectSend && onSelectSend(accountId)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <span>Pay</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
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
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Add New Beneficiary"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Recipient Registered Email
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. colleague@example.com"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nickname / Label
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Landlord or Bob Office"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              required
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-200 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Contact</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BeneficiaryList;
