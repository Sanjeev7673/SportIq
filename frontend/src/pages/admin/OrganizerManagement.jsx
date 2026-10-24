import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import {
  Building,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Globe,
  Search,
  AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';

export const OrganizerManagement = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [actionType, setActionType] = useState('VERIFIED');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadOrganizers = async () => {
    try {
      setLoading(true);
      const data = await eventService.adminGetOrganizers();
      setOrganizers(data || []);
    } catch (err) {
      console.error('Failed to load organizers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizers();
  }, []);

  const openVerifyModal = (org, action) => {
    setSelectedOrg(org);
    setActionType(action);
    setRejectionReason(action === 'REJECTED' ? 'Organization credentials could not be verified.' : '');
    setVerifyModalOpen(true);
  };

  const handleExecuteVerification = async (e) => {
    e.preventDefault();
    if (!selectedOrg) return;

    setProcessing(true);
    try {
      await eventService.adminVerifyOrganizer(selectedOrg.id, {
        status: actionType,
        rejection_reason: rejectionReason
      });

      setOrganizers(prev => prev.map(o => o.id === selectedOrg.id ? { ...o, verification_status: actionType } : o));
      setVerifyModalOpen(false);
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="primary" size="sm" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">🟢 Verified</Badge>;
      case 'PENDING':
        return <Badge variant="primary" size="sm" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">🟡 Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" size="sm">🔴 Rejected</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  if (loading) {
    return <Loader message="Loading registered organizers..." className="py-24" />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Sports Organizers & Academies
            </h1>
            <Badge variant="primary" size="sm">{organizers.length} Registered</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify sports federations, academies, and tournament hosts to establish trusted event listings.
          </p>
        </div>
      </div>

      {organizers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {organizers.map(org => (
            <Card key={org.id} className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{org.organization_name}</h3>
                    <span className="text-[11px] text-slate-400 block">{org.organization_type || 'Sports Association'}</span>
                  </div>
                  {getStatusBadge(org.verification_status)}
                </div>

                {org.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {org.description}
                  </p>
                )}

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Contact:</span>
                    <span>{org.contact_person}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span className="truncate">{org.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{org.phone}</span>
                  </div>
                  {org.website && (
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-cyan-600 truncate">{org.website}</a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                {org.verification_status !== 'VERIFIED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 border-emerald-600"
                    onClick={() => openVerifyModal(org, 'VERIFIED')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>Approve & Verify</span>
                  </Button>
                )}

                {org.verification_status !== 'REJECTED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="text-xs"
                    onClick={() => openVerifyModal(org, 'REJECTED')}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    <span>Reject</span>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center space-y-3">
          <Building className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No organizers registered</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When organizations create accounts, they will be listed here for accreditation and verification.
          </p>
        </Card>
      )}

      {/* Verify / Reject Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title={actionType === 'VERIFIED' ? 'Approve Organizer Accreditation' : 'Reject Organizer Accreditation'}
      >
        <form onSubmit={handleExecuteVerification} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white text-sm block">{selectedOrg?.organization_name}</span>
            <span className="text-slate-500 block mt-0.5">{selectedOrg?.contact_person} ({selectedOrg?.email})</span>
          </div>

          {actionType === 'REJECTED' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Rejection Reason
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setVerifyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={actionType === 'VERIFIED' ? 'primary' : 'danger'}
              size="sm"
              loading={processing}
            >
              Confirm {actionType === 'VERIFIED' ? 'Accreditation' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrganizerManagement;
