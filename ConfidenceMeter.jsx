import React from 'react';
import { getConfidenceColor, getSourceTypeDetails, getVerificationStatusDetails } from '../../utils/formatters';
import { ShieldCheck, Video, CheckCircle, Clock } from 'lucide-react';
import Badge from './Badge';

export const ConfidenceMeter = ({
  talentScore,
  confidenceScore = 65.0,
  sourceType = 'STANDARDIZED_FIELD_TEST',
  verificationStatus = 'UNVERIFIED',
  hasEvidence = false,
  evidenceUrl = null,
  size = 'md',
  className = ''
}) => {
  const source = getSourceTypeDetails(sourceType);
  const verification = getVerificationStatusDetails(verificationStatus);
  const confColor = getConfidenceColor(confidenceScore);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Metrics Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Talent Score Indicator */}
        {talentScore !== undefined && talentScore !== null && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Talent Index:</span>
            <span className="text-sm font-extrabold font-display text-[#06B6D4]">
              {Math.round(talentScore)}
              <span className="text-[10px] text-[#94A3B8] font-normal"> / 100</span>
            </span>
          </div>
        )}

        {/* Data Confidence Indicator */}
        <div className="flex items-center gap-1.5 ml-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="text-[10px] uppercase font-bold text-[#94A3B8]">Confidence:</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${confColor}`}>
            {confidenceScore.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Provenance Tags Row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="primary" size="sm" className={source.badgeColor}>
          <span className="mr-1">{source.icon}</span>
          {source.label}
        </Badge>

        <Badge variant="primary" size="sm" className={verification.badgeColor}>
          {verification.isVerified ? (
            <CheckCircle className="w-3 h-3 mr-1 text-[#22C55E] shrink-0 inline" />
          ) : (
            <Clock className="w-3 h-3 mr-1 text-[#F59E0B] shrink-0 inline" />
          )}
          {verification.label}
        </Badge>

        {hasEvidence && (
          <Badge variant="primary" size="sm" className="bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/30">
            <Video className="w-3 h-3 mr-1 inline" /> Video Proof
          </Badge>
        )}
      </div>

      {/* Confidence Bar */}
      <div className="w-full bg-[#1E293B] rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            confidenceScore >= 85
              ? 'bg-[#22C55E]'
              : confidenceScore >= 70
              ? 'bg-[#06B6D4]'
              : confidenceScore >= 50
              ? 'bg-[#F59E0B]'
              : 'bg-[#EF4444]'
          }`}
          style={{ width: `${Math.min(Math.max(confidenceScore, 5), 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ConfidenceMeter;
