import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const isExpired = queryParams.get('expired') === 'true';

  useEffect(() => {
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
    }
    if (location.state?.message) {
      setSuccessNotice(location.state.message);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.status === 429 || err.code === 'RATE_LIMIT_EXCEEDED') {
        setError('Too many login attempts. Please wait before trying again.');
      } else if (err.code === 'NETWORK_ERROR' || err.status === 0) {
        setError('Unable to connect to the FraudShield server. Please ensure the backend is running.');
      } else if (err.status === 401 || err.code === 'INVALID_CREDENTIALS') {
        setError('Incorrect email or password.');
      } else {
        setError(err.message || 'Incorrect email or password.');
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
          Sign In to FraudShield
        </h2>
        <p className="mt-1 text-xs text-[#5A6E65]">
          Deterministic Rule-Based Fraud Detection & Risk Scoring
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FAFCFA] border border-[#D4E2DC] py-8 px-6 sm:px-10 rounded-xl shadow-card">
          {successNotice && (
            <div className="mb-5 p-3.5 rounded-lg bg-[#EAF3EF] border border-[#C8DCD2] text-[#1E473B] text-xs font-medium flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#285C4D]" />
              <span>{successNotice}</span>
            </div>
          )}

          {isExpired && (
            <div className="mb-5 p-3.5 rounded-lg bg-[#FAF4EB] border border-[#EAD7BA] text-[#946625] text-xs font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#C89445]" />
              <span>Your session has expired. Please sign in again.</span>
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
                  placeholder="name@example.com"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] focus:border-[#285C4D] focus:outline-none focus:ring-1 focus:ring-[#285C4D] text-sm text-[#17211D] placeholder-[#5A6E65]/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#17211D]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#285C4D] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E65]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[#FAFCFA] border border-[#D4E2DC] focus:border-[#285C4D] focus:outline-none focus:ring-1 focus:ring-[#285C4D] text-sm text-[#17211D] placeholder-[#5A6E65]/50"
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#285C4D] hover:bg-[#1d453a] text-white font-medium text-xs shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-[#5A6E65]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#285C4D] font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
