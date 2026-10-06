import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [devTokenNotice, setDevTokenNotice] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your account email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPassword(email.trim());
      if (res.resetToken) {
        setDevTokenNotice(res.resetToken);
      }
      setSuccess('Password reset request processed.');
    } catch (err) {
      if (err.code === 'NETWORK_ERROR' || err.status === 0) {
        setError('Unable to connect to the FraudShield server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'Unable to process reset request. Please check your email.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyToken = () => {
    if (!devTokenNotice) return;
    navigator.clipboard.writeText(devTokenNotice);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleProceedToReset = () => {
    navigate(`/reset-password?email=${encodeURIComponent(email.trim())}&token=${encodeURIComponent(devTokenNotice || '')}`);
  };

  return (
    <div className="min-h-screen bg-[#EDF6F1] text-[#17211D] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-12 h-12 rounded-2xl bg-[#285C4D] text-white flex items-center justify-center mx-auto shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#17211D]">
          Forgot Password
        </h2>
        <p className="mt-1 text-xs text-[#5A6E65] font-medium">
          Account credential recovery for FraudShield digital banking
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FAFCFA] border border-[#D4E2DC] py-8 px-6 sm:px-10 rounded-2xl shadow-xs space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FBF0EF] border border-[#F2D6D3] text-[#8C3E3A] text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B65D59]" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-[#EAF3EF] border border-[#D4E2DC] text-[#285C4D] text-xs font-medium flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#285C4D]" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleRequestToken} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-[#17211D] uppercase tracking-wider mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65]">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#D4E2DC] focus:border-[#285C4D] focus:outline-none focus:ring-1 focus:ring-[#285C4D] text-sm font-medium text-[#17211D] placeholder-[#5A6E65]/60"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[#5A6E65]">
                Enter your email to request a cryptographic password recovery token.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#285C4D] hover:bg-[#20493D] text-white font-bold text-sm shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Request Reset Token</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Development Mode Token Notice */}
          {devTokenNotice && (
            <div className="p-4 rounded-xl bg-[#F4F8F5] border border-[#D4E2DC] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#285C4D]">
                  Development Mode Token Notice
                </span>
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5A6E65] hover:text-[#17211D]"
                >
                  {copiedToken ? <Check className="w-3 h-3 text-[#285C4D]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-[11px] text-[#5A6E65] leading-relaxed">
                In production, this token is dispatched securely to the user's verified inbox via SMTP. Because email delivery is not configured in this development environment, the cryptographic token is provided below for immediate evaluation.
              </p>

              <div className="p-2.5 rounded-lg bg-white border border-[#D4E2DC] font-mono text-[11px] text-[#285C4D] break-all select-all font-bold">
                {devTokenNotice}
              </div>

              <button
                type="button"
                onClick={handleProceedToReset}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#EAF3EF] hover:bg-[#DCEBE4] text-[#285C4D] border border-[#D4E2DC] text-xs font-bold transition-colors"
              >
                <span>Proceed to Reset Password Form</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-[#D4E2DC] text-center flex items-center justify-between text-xs">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-[#5A6E65] hover:text-[#17211D] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>

            <Link
              to="/reset-password"
              className="text-[#285C4D] hover:underline transition-colors font-medium"
            >
              Have a token? Reset Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
