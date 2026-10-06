import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setSuccessMessage('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      setSuccessMessage('Account created successfully. Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login', {
          state: {
            registeredEmail: email.trim(),
            message: 'Account created successfully. Please sign in to access your digital wallet.'
          }
        });
      }, 1000);
    } catch (err) {
      if (err.status === 429 || err.code === 'RATE_LIMIT_EXCEEDED') {
        setError('Too many registration attempts. Please wait before trying again.');
      } else {
        setError(err.message || 'Registration failed. Email may already be in use.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDF6F1] text-[#17211D] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Clickable FraudShield Logo & Brand Name */}
        <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="w-11 h-11 rounded-xl bg-[#285C4D] text-white flex items-center justify-center shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <span className="font-serif font-bold text-2xl tracking-tight text-[#17211D]">
            FraudShield
          </span>
        </Link>

        {/* Back to Home Link */}
        <div className="mt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A6E65] hover:text-[#285C4D] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Home</span>
          </Link>
        </div>

        <h2 className="mt-5 text-2xl font-serif font-bold tracking-tight text-[#17211D]">
          Create Customer Account
        </h2>
        <p className="mt-1 text-xs text-[#5A6E65]">
          Use a simulated digital wallet to safely test secure payments.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FAFCFA] border border-[#D4E2DC] py-8 px-6 sm:px-10 rounded-xl shadow-card">
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-[#EAF3EF] border border-[#C8DCD2] text-[#1E473B] text-xs font-medium flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#285C4D]" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-[#FBF0EF] border border-[#E6BFBD] text-[#8C3E3A] text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B65D59]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65]">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alice Sharma"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] focus:border-[#285C4D] focus:outline-none focus:ring-1 focus:ring-[#285C4D] text-sm text-[#17211D] placeholder-[#5A6E65]/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65]">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@example.com"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] focus:border-[#285C4D] focus:outline-none focus:ring-1 focus:ring-[#285C4D] text-sm text-[#17211D] placeholder-[#5A6E65]/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] focus:border-[#285C4D] focus:outline-none focus:ring-1 focus:ring-[#285C4D] text-sm text-[#17211D] placeholder-[#5A6E65]/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65] hover:text-[#17211D]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#17211D] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] focus:border-[#285C4D] focus:outline-none focus:ring-1 focus:ring-[#285C4D] text-sm text-[#17211D] placeholder-[#5A6E65]/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65] hover:text-[#17211D]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[#5A6E65]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#285C4D] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
