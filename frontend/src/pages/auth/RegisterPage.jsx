import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import ThemeToggle from '../../components/common/ThemeToggle';
import { USER_ROLES } from '../../utils/constants';
import api from '../../services/api';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm_password: '', role: USER_ROLES.PLAYER });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { api.get('/health').catch(() => {}); }, []);

  const roleOptions = [
    { value: USER_ROLES.PLAYER, label: 'Athlete / Player' },
    { value: USER_ROLES.COACH, label: 'Coach / Trainer' },
    { value: USER_ROLES.SCOUT, label: 'Scout / Recruiter' },
    { value: USER_ROLES.ORGANIZER, label: 'Tournament Organizer / Academy' },
  ];
  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (formData.password !== formData.confirm_password) return setError('Passwords do not match.');
    if (formData.password.length < 8) return setError('Use a password with at least 8 characters.');
    setLoading(true);
    try {
      const result = await api.post('/auth/register', {
        name: formData.name.trim(), email: formData.email.trim().toLowerCase(),
        password: formData.password, role: formData.role,
      });
      setSuccess(result?.message || 'Account created successfully. You can sign in now.');
      setFormData((prev) => ({ ...prev, password: '', confirm_password: '' }));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 radial-bg relative transition-colors duration-200">
      <div className="absolute top-4 right-4"><ThemeToggle size="sm" /></div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff251f]"><Activity className="h-6 w-6 text-white" /></div>
            <span className="font-display text-2xl font-bold tracking-tight">Sport<span className="text-[#ff6a4d]">IQ</span></span>
          </Link>
          <p className="text-xs text-[var(--text-secondary)]">Create your sports intelligence account</p>
        </div>
        <Card className="border-[var(--border-color)] bg-[var(--bg-card)]">
          {success && <div role="status" className="flex items-start gap-2 p-3 mb-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-sm"><CheckCircle2 className="w-5 h-5 shrink-0" /><span>{success} <Link className="underline font-semibold" to="/login">Go to sign in</Link></span></div>}
          {error && <div role="alert" className="flex items-center gap-2 p-3 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-sm"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full name" type="text" placeholder="Your full name" required icon={User} value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
            <Input label="Email address" type="email" placeholder="you@example.com" required icon={Mail} value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
            <Select label="I am a" options={roleOptions} value={formData.role} onChange={(event) => handleChange('role', event.target.value)} />
            <Input label="Password" type="password" placeholder="At least 8 characters" required icon={Lock} showPasswordToggle value={formData.password} onChange={(e) => handleChange('password', e.target.value)} />
            <Input label="Confirm password" type="password" placeholder="Re-enter your password" required icon={Lock} showPasswordToggle value={formData.confirm_password} onChange={(e) => handleChange('confirm_password', e.target.value)} />
            <p className="text-xs text-[var(--text-secondary)]">Email verification is temporarily disabled while we test the platform. You can sign in immediately after creating your account.</p>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</Button>
          </form>
          <p className="text-center text-sm mt-5 text-[var(--text-secondary)]">Already registered? <Link to="/login" className="font-semibold text-[#ff251f]">Sign in</Link></p>
        </Card>
      </div>
    </div>
  );
};
export default RegisterPage;
