import React, { useState, useEffect } from 'react';
import { Mail, Smartphone, Lock, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, KeyRound, Info, Wrench } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { authService } from '../../services/authService';

export const ForgotPasswordModal = ({ isOpen, onClose, onResetSuccess }) => {
  const [step, setStep] = useState(1); // 1: Identifier, 2: Choose Destination, 3: OTP Code, 4: New Password, 5: Done
  const [identifier, setIdentifier] = useState('');
  const [maskedDestination, setMaskedDestination] = useState('');
  const [destinationType, setDestinationType] = useState('EMAIL');
  const [availableDestinations, setAvailableDestinations] = useState([]);
  const [selectedDestType, setSelectedDestType] = useState('EMAIL');

  // Dev mode info
  const [isDevMode, setIsDevMode] = useState(false);
  const [devNote, setDevNote] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    let interval = null;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const resetModalState = () => {
    setStep(1);
    setIdentifier('');
    setMaskedDestination('');
    setDestinationType('EMAIL');
    setAvailableDestinations([]);
    setIsDevMode(false);
    setDevNote('');
    setDevOtp('');
    setOtpCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setLoading(false);
    setResendCooldown(0);
  };

  const handleClose = () => {
    resetModalState();
    onClose();
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    const cleanIdent = identifier.trim();
    if (!cleanIdent) {
      setError('Please enter your registered email or phone number.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword(cleanIdent);
      const data = res?.data || res || {};

      const dest = data.masked_destination || cleanIdent;
      const type = data.destination_type || (cleanIdent.includes('@') ? 'EMAIL' : 'PHONE');
      const avDest = data.available_destinations || [type];

      setMaskedDestination(dest);
      setDestinationType(type);
      setSelectedDestType(type);
      setAvailableDestinations(avDest);

      if (data.is_dev_mode) {
        setIsDevMode(true);
        setDevNote(data.dev_note || 'Development Mode: Provider not configured.');
        setDevOtp(data.dev_otp || '');
      } else {
        setIsDevMode(false);
      }

      if (avDest && avDest.length > 1) {
        setStep(2);
      } else {
        setStep(3);
        setResendCooldown(60);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to request verification code');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Select destination (if multiple)
  const handleSelectDestination = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(identifier.trim(), selectedDestType);
      const data = res?.data || res || {};

      setMaskedDestination(data.masked_destination || identifier);
      setDestinationType(selectedDestType);

      if (data.is_dev_mode) {
        setIsDevMode(true);
        setDevNote(data.dev_note || 'Development Mode: Provider not configured.');
        setDevOtp(data.dev_otp || '');
      }

      setStep(3);
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(identifier.trim(), destinationType);
      const data = res?.data || res || {};
      if (data.is_dev_mode) {
        setIsDevMode(true);
        setDevOtp(data.dev_otp || '');
      }
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await authService.verifyResetCode(identifier.trim(), cleanCode);
      const data = res?.data || res || {};
      const token = data.reset_token || res.reset_token;

      if (!token) {
        throw new Error('Verification failed to issue a reset session token.');
      }

      setResetToken(token);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Incorrect verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await authService.resetPassword(resetToken, newPassword, confirmPassword);
      setStep(5);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 5 ? "Password Updated" : "Reset Password"}
      subtitle={step === 5 ? "Your account security has been updated" : "Secure single-use verification code process"}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Enter Identifier */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Enter your registered email address or Indian mobile number. We will send a 6-digit verification code to reset your password.
            </p>

            <Input
              label="Email or Mobile Phone Number"
              type="text"
              placeholder="e.g. athlete@sportiq.ai or 9876543210"
              required
              autoFocus
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={loading} icon={KeyRound}>
                Send Verification Code
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Choose Destination (If both email & phone exist) */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Where would you like to receive your 6-digit verification code?
            </p>

            <div className="space-y-2">
              <label
                onClick={() => setSelectedDestType('EMAIL')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedDestType === 'EMAIL'
                    ? 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold">
                  <Mail className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Send via Email
                </span>
                <input
                  type="radio"
                  name="dest_type"
                  checked={selectedDestType === 'EMAIL'}
                  onChange={() => setSelectedDestType('EMAIL')}
                  className="text-cyan-500"
                />
              </label>

              <label
                onClick={() => setSelectedDestType('PHONE')}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedDestType === 'PHONE'
                    ? 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold">
                  <Smartphone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Send via SMS (Phone)
                </span>
                <input
                  type="radio"
                  name="dest_type"
                  checked={selectedDestType === 'PHONE'}
                  onChange={() => setSelectedDestType('PHONE')}
                  className="text-cyan-500"
                />
              </label>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} icon={ArrowLeft}>
                Back
              </Button>
              <Button variant="primary" size="sm" loading={loading} onClick={handleSelectDestination}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Enter OTP */}
        {step === 3 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
              We sent a 6-digit code to{' '}
              <strong className="text-cyan-600 dark:text-cyan-400 font-mono">{maskedDestination}</strong>. Please enter the code below.
            </div>

            {/* Development Mode Notice Banner */}
            {isDevMode && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                  <Wrench className="w-3.5 h-3.5" /> Development Mode Notice
                </div>
                <p className="text-[11px] text-amber-700/90 dark:text-amber-200/90 leading-relaxed">
                  Email/SMS provider (SMTP/Twilio) is not configured in backend environment.
                </p>
                {devOtp && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/20 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Dev Test OTP:</span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(devOtp)}
                      className="font-mono font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 underline cursor-pointer"
                      title="Click to auto-fill test code"
                    >
                      {devOtp} (Click to Fill)
                    </button>
                  </div>
                )}
              </div>
            )}

            <Input
              label="6-Digit Verification Code"
              type="text"
              placeholder="e.g. 847291"
              maxLength={6}
              required
              autoFocus
              className="tracking-widest font-mono text-center text-lg"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400">Didn't receive the code?</span>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || loading}
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-semibold disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} icon={ArrowLeft}>
                Change Identifier
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={loading} icon={ShieldCheck}>
                Verify Code
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: Create New Password */}
        {step === 4 && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Verification confirmed! Please choose a new secure password for your SportIQ account.
            </p>

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              required
              autoFocus
              icon={Lock}
              showPasswordToggle={true}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              required
              icon={Lock}
              showPasswordToggle={true}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button type="submit" variant="primary" size="sm" loading={loading} icon={CheckCircle2}>
                Update Password
              </Button>
            </div>
          </form>
        )}

        {/* STEP 5: Success State */}
        {step === 5 && (
          <div className="space-y-4 text-center py-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Password Updated Successfully</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can now sign in to your SportIQ account using your new password.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="primary"
                className="w-full"
                size="md"
                onClick={() => {
                  handleClose();
                  if (onResetSuccess) onResetSuccess();
                }}
              >
                Return to Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ForgotPasswordModal;
