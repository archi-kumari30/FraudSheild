import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, KeyRound, Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    const tokenParam = params.get('token');
    if (emailParam) setEmail(emailParam);
    if (tokenParam) setResetToken(tokenParam);
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please provide your registered account email address.');
      return;
    }

    if (!resetToken.trim()) {
      setError('Please provide the cryptographic reset token.');
      return;
    }

    if (!newPassword || newPassword.length < 8 || !/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
      setError('New password must be at least 8 characters long and contain both letters and numbers.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email.trim(), resetToken.trim(), newPassword);
      setSuccess('Your password has been successfully reset. Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login', {
          state: {
            registeredEmail: email.trim(),
            message: 'Password has been reset successfully. Please sign in with your new credentials.'
          }
        });
      }, 1500);
    } catch (err) {
      if (err.code === 'NETWORK_ERROR' || err.status === 0) {
        setError('Unable to connect to the FraudShield server. Please ensure the backend is running.');
      } else {
        setError(err.message || 'Invalid or expired password reset token.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
          Reset Password
        </h2>
        <p className="mt-1 text-xs text-[#5A6E65] font-medium">
          Set a new password for your FraudShield account
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D] uppercase tracking-wider mb-1.5">
                Reset Token
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65]">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste reset token"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 font-mono text-xs rounded-xl bg-white border border-[#D4E2DC] focus:border-[#285C4D] focus:outline-none focus:ring-1 focus:ring-[#285C4D] text-[#285C4D] font-bold placeholder-[#5A6E65]/60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D] uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 chars with letters & numbers"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-[#D4E2DC] focus:border-[#285C4D] focus:outline-none focus:ring-1 focus:ring-[#285C4D] text-sm font-medium text-[#17211D] placeholder-[#5A6E65]/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6E65] hover:text-[#17211D]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D] uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-[#D4E2DC] focus:border-[#285C4D] focus:outline-none focus:ring-1 focus:ring-[#285C4D] text-sm font-medium text-[#17211D] placeholder-[#5A6E65]/60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6E65] hover:text-[#17211D]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#285C4D] hover:bg-[#20493D] text-white font-bold text-sm shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-[#D4E2DC] text-center flex items-center justify-between text-xs">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-[#5A6E65] hover:text-[#17211D] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>

            <Link
              to="/forgot-password"
              className="text-[#285C4D] hover:underline transition-colors font-medium"
            >
              Request New Token
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
