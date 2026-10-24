import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { playerService } from '../../services/playerService';
import { DEFAULT_SPORTS, SPORT_POSITIONS } from '../../utils/constants';
import { getImageUrl } from '../../utils/formatters';
import { User, Save, CheckCircle2, AlertCircle, Camera, Trash2, Palette } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import ThemeSelector from '../../components/common/ThemeSelector';

export const PlayerProfile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    sport: 'Football',
    position: 'Forward',
    age: 20,
    gender: 'Male',
    experience: 3,
    height: 180,
    weight: 75,
    achievements: '',
    profile_image: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await playerService.getMyProfile();
        if (data) {
          setProfile(data);
          setFormData({
            sport: data.sport || 'Football',
            position: data.position || '',
            age: data.age || 20,
            gender: data.gender || 'Male',
            experience: data.experience || 0,
            height: data.height || 180,
            weight: data.weight || 75,
            achievements: data.achievements || '',
            profile_image: data.profile_image || '',
          });
          if (data.profile_image) {
            setPreviewUrl(getImageUrl(data.profile_image));
          }
        }
      } catch (e) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSportChange = (newSport) => {
    const availablePositions = SPORT_POSITIONS[newSport] || [];
    setFormData((prev) => ({
      ...prev,
      sport: newSport,
      position: availablePositions[0] || ''
    }));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, JPEG, PNG, or WEBP).');
      return;
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Selected image size exceeds the maximum limit of 5 MB.');
      return;
    }

    setError('');
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // If profile exists, upload directly
    if (profile?.id) {
      setUploadingPhoto(true);
      try {
        const res = await playerService.uploadPhoto(file);
        setFormData((prev) => ({ ...prev, profile_image: res.profile_image }));
        setProfile(res);
        setMessage('Profile photo uploaded and saved successfully!');
      } catch (err) {
        setError(err.message || 'Failed to upload photo');
      } finally {
        setUploadingPhoto(false);
      }
    } else {
      setMessage('Profile photo preview loaded. It will be saved when you create your profile.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (profile) {
        const updated = await playerService.updateMyProfile(formData);
        setProfile(updated);
        setMessage('Athletic profile updated successfully!');
      } else {
        const created = await playerService.createProfile(formData);
        setProfile(created);
        // If there is a selected file in input, upload now
        if (fileInputRef.current?.files?.[0]) {
          const photoRes = await playerService.uploadPhoto(fileInputRef.current.files[0]);
          setProfile(photoRes);
          setFormData((prev) => ({ ...prev, profile_image: photoRes.profile_image }));
        }
        setMessage('Athletic profile created successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading athletic profile..." className="py-24" />;
  }

  const positions = SPORT_POSITIONS[formData.sport] || ['Standard Position'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F8FAFC] font-display tracking-tight">Athletic Profile & Settings</h1>
        <p className="text-xs text-[#94A3B8]">Manage your verified athletic specifications, appearance themes, and achievements</p>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Appearance & Theme Settings Card */}
      <Card title="Appearance & Theme" subtitle="Choose how SportIQ looks on your device" icon={Palette}>
        <div className="space-y-3">
          <p className="text-xs text-[#94A3B8]">
            Select your preferred display theme. System default automatically syncs with your device day/night mode.
          </p>
          <ThemeSelector layout="grid" />
        </div>
      </Card>

      <Card title="Player Information" subtitle="Physical attributes and sports specifications" icon={User}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo Upload Component */}
          <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar Preview */}
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-[#111C2E] border-2 border-[#06B6D4]/30 flex items-center justify-center shrink-0 shadow-sm group">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Athlete Avatar Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                  <User className="w-10 h-10" />
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-[#0B1220]/80 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <span className="text-sm font-bold text-[#F8FAFC] block">Athlete Profile Photo</span>
              <p className="text-xs text-[#94A3B8]">
                Upload a clear portrait or action photo. Accepted formats: JPG, JPEG, PNG, WEBP (Max 5 MB).
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploadingPhoto}
                  icon={Camera}
                >
                  {previewUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}
                </Button>

                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setFormData((prev) => ({ ...prev, profile_image: '' }));
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-2 text-[#94A3B8] hover:text-[#EF4444] rounded-lg hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Primary Sport"
              options={DEFAULT_SPORTS}
              value={formData.sport}
              onChange={(e) => handleSportChange(e.target.value)}
              required
            />

            <Select
              label="Position / Role"
              options={positions}
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              required
            />

            <Input
              label="Age (Years)"
              type="number"
              min="10"
              max="60"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
              required
            />

            <Select
              label="Gender"
              options={['Male', 'Female', 'Other']}
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            />

            <Input
              label="Height (cm)"
              type="number"
              min="50"
              max="250"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
            />

            <Input
              label="Weight (kg)"
              type="number"
              min="20"
              max="250"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
            />

            <Input
              label="Experience (Years)"
              type="number"
              min="0"
              max="40"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5">
              Career Achievements & Honors
            </label>
            <textarea
              rows={3}
              placeholder="e.g. State Championship Gold Medalist 2025, Regional League MVP..."
              className="block w-full rounded-xl bg-[#111C2E] border border-[#1E293B] text-[#F8FAFC] placeholder-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-sm p-3.5"
              value={formData.achievements}
              onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-[#1E293B]">
            <Button type="submit" variant="primary" size="md" loading={saving} icon={Save}>
              {profile ? 'Save Profile Changes' : 'Create Athletic Profile'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
export default PlayerProfile;
