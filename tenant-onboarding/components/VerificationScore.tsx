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
      bg: 'bg-emerald-500',
      bgLight: 'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-500/30',
      ring: 'ring-emerald-500/20',
    },
    blue: {
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-50 dark:bg-blue-500/10',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-500/30',
      ring: 'ring-blue-500/20',
    },
    amber: {
      bg: 'bg-amber-500',
      bgLight: 'bg-amber-50 dark:bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-500/30',
      ring: 'ring-amber-500/20',
    },
    gray: {
      bg: 'bg-gray-400',
      bgLight: 'bg-gray-50 dark:bg-white/5',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-white/10',
      ring: 'ring-gray-500/20',
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
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
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
            <h3 className="font-semibold text-gray-900 dark:text-white">Trust Score</h3>
            <p className={`text-sm font-medium ${colors.text}`}>{label}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${colors.text}`}>{totalPoints}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">of {maxPoints} points</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bg} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          <span>0</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {verificationScore.thresholds.minimum}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            {verificationScore.thresholds.recommended}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {verificationScore.thresholds.verified}
          </span>
          <span>{maxPoints}</span>
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
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
                    ? 'bg-white dark:bg-white/5 text-gray-900 dark:text-white'
                    : 'bg-transparent text-gray-400 dark:text-gray-500'
                  }
                `}
              >
                {item.completed ? (
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="truncate flex-1">{item.label}</span>
                <span className={`text-xs font-medium ${
                  item.completed ? 'text-emerald-500' : 'text-gray-400'
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
