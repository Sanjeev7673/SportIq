import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  Save,
  Globe,
  Sliders,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    platform_name: 'SportIQ',
    platform_description: 'AI-Driven Sports Talent Assessment & Opportunity Discovery Platform',
    default_event_visibility: 'PUBLIC',
    event_verification_required: true,
    organizer_verification_required: true,
    default_event_expiry_behavior: 'AUTO_EXPIRE_PAST_DATE'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await adminService.getSettings();
        if (data) setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await adminService.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading platform configuration settings..." className="py-24" />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Platform Configuration Settings
            </h1>
            <Badge variant="primary" size="sm">System Governance</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure system verification policies, platform metadata, and opportunity lifecycle defaults.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>System configuration settings updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Platform Branding */}
        <Card title="Platform Information" icon={Globe}>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platform_name}
                onChange={(e) => handleChange('platform_name', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Platform Tagline / Description
              </label>
              <textarea
                rows={2}
                value={settings.platform_description}
                onChange={(e) => handleChange('platform_description', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>
        </Card>

        {/* Verification Policy Switches */}
        <Card title="Verification & Governance Policies" icon={ShieldCheck}>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white block">Event Verification Required</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Organizer-submitted tournaments require SportIQ Admin review before appearing on the public Event Hub.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.event_verification_required}
                  onChange={(e) => handleChange('event_verification_required', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white block">Organizer Accreditation Required</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Sports academies must be verified by administrators prior to submitting verified tournament circulars.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.organizer_verification_required}
                  onChange={(e) => handleChange('organizer_verification_required', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-cyan-600"></div>
              </label>
            </div>
          </div>
        </Card>

        {/* Discovery & Lifecycle */}
        <Card title="Discovery & Opportunity Lifecycle" icon={Sliders}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Default Event Visibility
              </label>
              <select
                value={settings.default_event_visibility}
                onChange={(e) => handleChange('default_event_visibility', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
              >
                <option value="PUBLIC">Public to All (Athletes, Coaches, Scouts)</option>
                <option value="REGISTERED_ONLY">Authenticated Users Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Event Expiry Mechanism
              </label>
              <select
                value={settings.default_event_expiry_behavior}
                onChange={(e) => handleChange('default_event_expiry_behavior', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
              >
                <option value="AUTO_EXPIRE_PAST_DATE">Auto-expire past tournament end date</option>
                <option value="MANUAL_EXPIRATION">Manual archive by administrator</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Save}
            loading={saving}
          >
            Save System Settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
