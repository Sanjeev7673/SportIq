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
    <div className="min-h-screen bg-[#090b0b] text-[#f8f6f2] flex flex-col items-center justify-center p-4 radial-bg relative transition-colors duration-200">
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle size="sm" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff251f] shadow-sm">
              <Activity className="h-6 w-6 text-[#f8f6f2]" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-[#f8f6f2]">
              Sport<span className="text-[#ff6a4d]">IQ</span>
            </span>
          </Link>
          <p className="text-xs text-[#b7b7b2]">Sign in to your sports analytics workspace</p>
        </div>

        {/* Card */}
        <Card className="border-[#303632] bg-[#141716]">
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#b7b7b2]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs text-[#ff251f] hover:text-[#3B82F6] font-semibold transition-colors cursor-pointer"
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

          <div className="mt-6 pt-5 border-t border-[#303632] text-center text-xs text-[#b7b7b2]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#ff251f] hover:text-[#3B82F6] font-semibold">
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
