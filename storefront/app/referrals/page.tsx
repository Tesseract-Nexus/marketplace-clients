'use client';

import { ReferralProgram } from '@/components/marketing/ReferralProgram';
import { useMarketingConfig } from '@/context/TenantContext';
import { Users } from 'lucide-react';

export default function ReferralsPage() {
  const marketingConfig = useMarketingConfig();

  // Show disabled message if referral program is turned off
  if (!marketingConfig.enableReferralProgram) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-tenant py-8 md:py-12">
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Referral Program Unavailable
            </h1>
            <p className="text-gray-600">
              The referral program is currently not available. Please check back later!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-tenant py-8 md:py-12">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Referral Program
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Share the love and earn rewards! Invite your friends to join and both of you will receive bonus points.
          </p>
        </div>

        {/* Referral Program Component */}
        <ReferralProgram variant="full" />
      </div>
    </div>
  );
}
