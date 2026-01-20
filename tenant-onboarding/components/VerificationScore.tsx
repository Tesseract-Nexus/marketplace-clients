'use client';

import React from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Check,
  Circle,
  Info,
} from 'lucide-react';
import { config } from '../lib/config/app';

export interface VerificationItem {
  key: string;
  label: string;
  completed: boolean;
  points: number;
  optional?: boolean;
}

interface VerificationScoreProps {
  items: VerificationItem[];
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export function VerificationScore({
  items,
  className = '',
  showDetails = true,
  compact = false,
}: VerificationScoreProps) {
  const { verificationScore } = config;
  const totalPoints = items.reduce((sum, item) => sum + (item.completed ? item.points : 0), 0);
  const maxPoints = verificationScore.maxScore;
  const percentage = Math.round((totalPoints / maxPoints) * 100);

  const getScoreLevel = () => {
    if (totalPoints >= verificationScore.thresholds.verified) {
      return { level: 'verified', label: 'Fully Verified', color: 'emerald' };
    }
    if (totalPoints >= verificationScore.thresholds.recommended) {
      return { level: 'recommended', label: 'Well Verified', color: 'blue' };
    }
    if (totalPoints >= verificationScore.thresholds.minimum) {
      return { level: 'minimum', label: 'Basic Verification', color: 'amber' };
    }
    return { level: 'incomplete', label: 'Incomplete', color: 'gray' };
  };

  const { level, label, color } = getScoreLevel();

  const getShieldIcon = () => {
    switch (level) {
      case 'verified':
        return <ShieldCheck className="w-6 h-6" />;
      case 'recommended':
        return <Shield className="w-6 h-6" />;
      default:
        return <ShieldAlert className="w-6 h-6" />;
    }
  };

  const colorClasses = {
    emerald: {
      bg: 'bg-sage-500',
      bgLight: 'bg-sage-50',
      text: 'text-sage-600',
      border: 'border-sage-200',
      ring: 'ring-sage-500/20',
    },
    blue: {
      bg: 'bg-terracotta-500',
      bgLight: 'bg-warm-50',
      text: 'text-terracotta-600',
      border: 'border-terracotta-200',
      ring: 'ring-terracotta-500/20',
    },
    amber: {
      bg: 'bg-warm-500',
      bgLight: 'bg-warm-50',
      text: 'text-warm-600',
      border: 'border-warm-200',
      ring: 'ring-warm-500/20',
    },
    gray: {
      bg: 'bg-warm-400',
      bgLight: 'bg-warm-50',
      text: 'text-foreground-secondary',
      border: 'border-warm-200',
      ring: 'ring-warm-500/20',
    },
  };

  const colors = colorClasses[color as keyof typeof colorClasses];

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bgLight} ${colors.text}`}>
          {getShieldIcon()}
          <span className="text-sm font-semibold">{totalPoints}/{maxPoints}</span>
        </div>
        <span className="text-sm text-foreground-secondary">{label}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border ${colors.border} ${colors.bgLight} p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${colors.bgLight} ${colors.text} ring-4 ${colors.ring}`}>
            {getShieldIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Trust Score</h3>
            <p className={`text-sm font-medium ${colors.text}`}>{label}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${colors.text}`}>{totalPoints}</div>
          <div className="text-xs text-foreground-secondary">of {maxPoints} points</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-warm-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bg} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-foreground-tertiary">
          <span>0</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-warm-400" />
            {verificationScore.thresholds.minimum}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-terracotta-400" />
            {verificationScore.thresholds.recommended}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sage-400" />
            {verificationScore.thresholds.verified}
          </span>
          <span>{maxPoints}</span>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-foreground-secondary mb-2">
            <Info className="w-3.5 h-3.5" />
            <span>Complete more items to increase your trust score</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <div
                key={item.key}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                  ${item.completed
                    ? 'bg-white text-foreground'
                    : 'bg-transparent text-foreground-tertiary'
                  }
                `}
              >
                {item.completed ? (
                  <Check className="w-4 h-4 text-sage-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="truncate flex-1">{item.label}</span>
                <span className={`text-xs font-medium ${
                  item.completed ? 'text-sage-600' : 'text-foreground-tertiary'
                }`}>
                  +{item.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper hook to calculate verification items
export function useVerificationScore(data: {
  emailVerified: boolean;
  phoneVerified: boolean;
  businessInfoComplete: boolean;
  addressComplete: boolean;
  addressProofUploaded: boolean;
  businessProofUploaded: boolean;
  logoUploaded: boolean;
  storeConfigComplete: boolean;
}): VerificationItem[] {
  const weights = config.verificationScore.weights;

  return [
    {
      key: 'email',
      label: 'Email Verified',
      completed: data.emailVerified,
      points: weights.emailVerified,
    },
    {
      key: 'phone',
      label: 'Phone Verified',
      completed: data.phoneVerified,
      points: weights.phoneVerified,
      optional: true,
    },
    {
      key: 'business',
      label: 'Business Info',
      completed: data.businessInfoComplete,
      points: weights.businessInfoComplete,
    },
    {
      key: 'address',
      label: 'Address Complete',
      completed: data.addressComplete,
      points: weights.addressComplete,
    },
    {
      key: 'addressProof',
      label: 'Address Proof',
      completed: data.addressProofUploaded,
      points: weights.addressProofUploaded,
      optional: !config.features.documents.requireAddressProof,
    },
    {
      key: 'businessProof',
      label: 'Business Proof',
      completed: data.businessProofUploaded,
      points: weights.businessProofUploaded,
      optional: !config.features.documents.requireBusinessProof,
    },
    {
      key: 'logo',
      label: 'Company Logo',
      completed: data.logoUploaded,
      points: weights.logoUploaded,
      optional: !config.features.documents.requireLogo,
    },
    {
      key: 'store',
      label: 'Store Setup',
      completed: data.storeConfigComplete,
      points: weights.storeConfigComplete,
    },
  ];
}

export default VerificationScore;
