'use client';

import React from 'react';
import { FileText, ArrowLeft, ArrowRight, SkipForward } from 'lucide-react';
import { DocumentsSection } from '../DocumentsSection';
import { config } from '../../lib/config/app';
import type { DocumentsStepProps } from './types';

export function DocumentsStep({
  setCurrentSection,
  sessionId,
  addressForm,
  storeSetupForm,
  businessInfo,
  businessAddress,
  addressProofType,
  setAddressProofType,
  addressProofDocument,
  setAddressProofDocument,
  businessProofType,
  setBusinessProofType,
  businessProofDocument,
  setBusinessProofDocument,
  logoDocument,
  setLogoDocument,
  onContinue,
}: DocumentsStepProps) {
  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-warm-100 border border-warm-200 flex items-center justify-center">
            <FileText className="w-6 h-6 text-warm-600" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-medium text-foreground">Documents & Verification</h1>
            <p className="text-muted-foreground">Upload documents to verify your business (optional)</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="p-6 bg-warm-50 rounded-xl border border-warm-200">
          <p className="text-sm text-muted-foreground mb-4">
            {config.features.documents.requireAddressProof || config.features.documents.requireBusinessProof
              ? 'Upload the required documents to verify your business.'
              : 'Upload documents to increase your trust score and unlock additional features. This step is optional.'}
          </p>
          <DocumentsSection
            countryCode={addressForm.watch('country') || ''}
            sessionId={sessionId || undefined}
            addressProofType={addressProofType}
            onAddressProofTypeChange={setAddressProofType}
            addressProofDocument={addressProofDocument}
            onAddressProofDocumentChange={setAddressProofDocument}
            businessProofType={businessProofType}
            onBusinessProofTypeChange={setBusinessProofType}
            businessProofDocument={businessProofDocument}
            onBusinessProofDocumentChange={setBusinessProofDocument}
            logoDocument={logoDocument}
            onLogoDocumentChange={setLogoDocument}
            verificationState={{
              phoneVerified: false,
              businessInfoComplete: !!(businessInfo as Record<string, unknown>)?.business_name && !!(businessInfo as Record<string, unknown>)?.business_type,
              addressComplete: !!(businessAddress as Record<string, unknown>)?.street_address && !!(businessAddress as Record<string, unknown>)?.city,
              storeConfigComplete: !!storeSetupForm.watch('subdomain') && !!storeSetupForm.watch('currency'),
            }}
          />
        </div>

        {/* Navigation buttons */}
        <div className="pt-6 flex gap-4">
          <button
            type="button"
            onClick={() => setCurrentSection(3)}
            className="flex-1 h-14 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 h-14 border border-border rounded-lg font-medium text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-2"
          >
            <SkipForward className="w-5 h-5" /> Skip
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group"
          >
            Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </>
  );
}
