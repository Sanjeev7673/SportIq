import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import {
  Building,
  ShieldCheck,
  Clock,
  XCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';

export const OrganizerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    organization_name: '',
    contact_person: '',
    email: '',
    phone: '',
    organization_type: '',
    website: '',
    description: ''
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await eventService.organizerGetProfile();
      setProfile(data);
      if (data) {
        setFormData({
          organization_name: data.organization_name || '',
          contact_person: data.contact_person || '',
          email: data.email || '',
          phone: data.phone || '',
          organization_type: data.organization_type || 'Sports Academy / Association',
          website: data.website || '',
          description: data.description || ''
        });
      }
    } catch (err) {
      setError('Unable to load organization profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSaving(true);
    try {
      const updated = await eventService.organizerUpdateProfile(formData);
      setProfile(updated);
      setSuccess('Organization profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading organization profile..." className="py-24" />;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
        <div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">
            Organization Profile
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Maintain your official sports association credentials and contact information.
          </p>
        </div>

        <div>
          {profile?.verification_status === 'VERIFIED' ? (
            <Badge variant="success" className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Organizer</span>
            </Badge>
          ) : profile?.verification_status === 'REJECTED' ? (
            <Badge variant="danger" className="font-bold flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Verification Rejected</span>
            </Badge>
          ) : (
            <Badge variant="warning" className="font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Verification Pending</span>
            </Badge>
          )}
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center gap-2 text-xs font-semibold text-[#22C55E]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center gap-2 text-xs font-semibold text-[#EF4444]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card title="Organization Credentials" icon={Building}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Organization / Academy Name"
            required
            value={formData.organization_name}
            onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Person Name"
              required
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
            <Input
              label="Organization Type"
              placeholder="e.g. District Association, Academy, University"
              value={formData.organization_type}
              onChange={(e) => setFormData({ ...formData, organization_type: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Official Contact Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Official Phone Number"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Input
            label="Official Website URL (Optional)"
            placeholder="https://association.org"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Organization Background & Bio
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of the sports association, academy history, and affiliated sports..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" variant="primary" size="md" loading={saving}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default OrganizerProfile;
