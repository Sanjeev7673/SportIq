import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, Lock, Mail, User, Smartphone, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import { USER_ROLES } from '../../utils/constants';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [regMethod, setRegMethod] = useState('email'); // 'email' or 'phone'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    role: USER_ROLES.PLAYER,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleOptions = [
    { value: USER_ROLES.PLAYER, label: 'Athlete / Player' },
    { value: USER_ROLES.COACH, label: 'Coach / Trainer' },
    { value: USER_ROLES.SCOUT, label: 'Scout / Recruiter' },
    { value: USER_ROLES.ORGANIZER, label: 'Tournament Organizer / Academy' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Password confirmation check
    if (formData.password !== formData.confirm_password) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        password: formData.password,
        role: formData.role,
      };

      if (regMethod === 'email') {
        if (!formData.email) {
          setError('Please enter your email address.');
          setLoading(false);
          return;
        }
        payload.email = formData.email.trim();
      } else {
        if (!formData.phone_number) {
          setError('Please enter your 10-digit mobile number.');
          setLoading(false);
          return;
        }
        payload.phone_number = formData.phone_number.trim();
      }

      const res = await register(payload);
      const role = res.user?.role;
      if (role === 'PLAYER') navigate('/player/profile');
      else if (role === 'COACH') navigate('/coach/dashboard');
      else if (role === 'SCOUT') navigate('/scout/dashboard');
      else if (role === 'ORGANIZER') navigate('/organizer/dashboard');
      else if (role === 'ADMIN') navigate('/admin/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090808] text-[#ECEBEC] flex flex-col items-center justify-center p-4 radial-bg relative transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F71601] shadow-sm">
              <Activity className="h-6 w-6 text-[#ECEBEC]" />
            </div>
            <span className="font-display text-2xl font-bold tracking-tight text-[#ECEBEC]">
              Sport<span className="text-[#F71601]">IQ</span>
            </span>
          </Link>
          <p className="text-xs text-[#AFAFAF]">Create your athletic intelligence account</p>
        </div>

        {/* Card */}
        <Card className="border-[#343131] bg-[#171616]">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Method Toggle */}
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#AFAFAF] mb-2">
              Registration Method
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#090808] border border-[#343131] rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setRegMethod('email');
                  setError('');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  regMethod === 'email'
                    ? 'bg-[#171616] text-[#F71601] border border-[#F71601]/40 shadow-sm'
                    : 'text-[#AFAFAF] hover:text-[#ECEBEC]'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegMethod('phone');
                  setError('');
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  regMethod === 'phone'
                    ? 'bg-[#171616] text-[#F71601] border border-[#F71601]/40 shadow-sm'
                    : 'text-[#AFAFAF] hover:text-[#ECEBEC]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone Number</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Virat Kohli"
              required
              icon={User}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            {regMethod === 'email' ? (
              <Input
                label="Email Address"
                type="email"
                placeholder="athlete@sportiq.ai"
                required
                icon={Mail}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#AFAFAF] mb-1.5">
                  Indian Mobile Number
                </label>
                <div className="relative rounded-xl flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#AFAFAF] font-semibold text-xs">
                    <span className="text-[#F71601] font-bold mr-1">🇮🇳 +91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    required
                    className="block w-full rounded-xl bg-[#171616] border border-[#343131] text-[#ECEBEC] placeholder-[#AFAFAF]/60 focus:outline-none focus:ring-2 focus:ring-[#F71601] focus:border-[#F71601] text-sm pl-20 pr-3.5 py-2.5 transition-all duration-200"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>
                <p className="text-[11px] text-[#AFAFAF]/80 mt-1">Accepts standard 10-digit mobile numbers.</p>
              </div>
            )}

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              required
              icon={Lock}
              showPasswordToggle={true}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              required
              icon={Lock}
              showPasswordToggle={true}
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
            />

            <Select
              label="Account Role"
              options={roleOptions}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              size="md"
              loading={loading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#343131] text-center text-xs text-[#AFAFAF]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#F71601] hover:text-[#FF4938] font-semibold">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
