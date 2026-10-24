import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import ThemeToggle from '../../components/common/ThemeToggle';
import ForgotPasswordModal from '../../components/auth/ForgotPasswordModal';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await login(identifier.trim(), password);
      const role = res.user?.role;
      // Redirect to respective dashboard
      if (role === 'PLAYER') navigate('/player/dashboard');
      else if (role === 'COACH') navigate('/coach/dashboard');
      else if (role === 'SCOUT') navigate('/scout/dashboard');
      else if (role === 'ORGANIZER') navigate('/organizer/dashboard');
      else if (role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Invalid email/phone or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F8FAFC] flex flex-col items-center justify-center p-4 radial-bg relative transition-colors duration-200">
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle size="sm" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] shadow-sm">
              <Activity className="h-6 w-6 text-[#F8FAFC]" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-[#F8FAFC]">
              Sport<span className="text-[#06B6D4]">IQ</span>
            </span>
          </Link>
          <p className="text-xs text-[#94A3B8]">Sign in to your sports analytics workspace</p>
        </div>

        {/* Card */}
        <Card className="border-[#1E293B] bg-[#111C2E]">
          {successMsg && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email or Mobile Phone Number"
              type="text"
              placeholder="athlete@sportiq.ai or 9876543210"
              required
              icon={User}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs text-[#2563EB] hover:text-[#3B82F6] font-semibold transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <Input
                type="password"
                placeholder="••••••••"
                required
                icon={Lock}
                showPasswordToggle={true}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              size="md"
              loading={loading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#1E293B] text-center text-xs text-[#94A3B8]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#2563EB] hover:text-[#3B82F6] font-semibold">
              Create an account
            </Link>
          </div>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onResetSuccess={() => {
          setSuccessMsg('Password updated successfully! Please sign in with your new password.');
        }}
      />
    </div>
  );
};

export default LoginPage;
