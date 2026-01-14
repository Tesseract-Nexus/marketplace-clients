'use client';

import React, { useMemo } from 'react';
import {
  FileText,
  Building2,
  MapPin,
  Palette,
  ChevronDown,
  Shield,
  Sparkles,
} from 'lucide-react';
import { DocumentUpload, type UploadedDocument } from './DocumentUpload';
import { SearchableSelect } from './SearchableSelect';
import { VerificationScore, useVerificationScore } from './VerificationScore';
import { config } from '../lib/config/app';

interface DocumentsSectionProps {
  countryCode: string;
  sessionId?: string;  // Required for actual GCS uploads
  // Document states
  addressProofType: string;
  onAddressProofTypeChange: (value: string) => void;
  addressProofDocument: UploadedDocument | null;
  onAddressProofDocumentChange: (doc: UploadedDocument | null) => void;
  businessProofType: string;
  onBusinessProofTypeChange: (value: string) => void;
  businessProofDocument: UploadedDocument | null;
  onBusinessProofDocumentChange: (doc: UploadedDocument | null) => void;
  logoDocument: UploadedDocument | null;
  onLogoDocumentChange: (doc: UploadedDocument | null) => void;
  // Verification state for score
  verificationState: {
    emailVerified: boolean;
    phoneVerified: boolean;
    businessInfoComplete: boolean;
    addressComplete: boolean;
    storeConfigComplete: boolean;
  };
  className?: string;
}

export function DocumentsSection({
  countryCode,
  sessionId,
  addressProofType,
  onAddressProofTypeChange,
  addressProofDocument,
  onAddressProofDocumentChange,
  businessProofType,
  onBusinessProofTypeChange,
  businessProofDocument,
  onBusinessProofDocumentChange,
  logoDocument,
  onLogoDocumentChange,
  verificationState,
  className = '',
}: DocumentsSectionProps) {
  const { features, documents } = config;

  // Get country-specific business document types
  const businessDocTypes = useMemo(() => {
    const countryDocs = documents.businessDocumentTypes[countryCode as keyof typeof documents.businessDocumentTypes];
    return countryDocs || documents.businessDocumentTypes.DEFAULT;
  }, [countryCode]);

  // Calculate verification score
  const verificationItems = useVerificationScore({
    ...verificationState,
    addressProofUploaded: addressProofDocument?.status === 'success',
    businessProofUploaded: businessProofDocument?.status === 'success',
    logoUploaded: logoDocument?.status === 'success',
  });

  const isAddressProofRequired = features.documents.requireAddressProof;
  const isBusinessProofRequired = features.documents.requireBusinessProof;
  const isLogoRequired = features.documents.requireLogo;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documents & Verification</h2>
          <p className="text-gray-500 dark:text-white/50">Upload documents to verify your business</p>
        </div>
      </div>

      {/* Trust Score Card */}
      <VerificationScore items={verificationItems} showDetails={true} />

      {/* Optional Banner */}
      {!isAddressProofRequired && !isBusinessProofRequired && !isLogoRequired && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
          <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              These documents are optional but recommended
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
              Uploading verification documents increases your trust score and unlocks additional features.
            </p>
          </div>
        </div>
      )}

      {/* Document Upload Cards */}
      <div className="space-y-6">
        {/* Address Proof Section */}
        <div className="p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Address Verification
                {!isAddressProofRequired && (
                  <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">(Optional)</span>
                )}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Proof of your business address
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Type
              </label>
              <SearchableSelect
                options={documents.addressProofTypes.map(type => ({
                  value: type.value,
                  label: type.label,
                }))}
                value={addressProofType}
                onChange={onAddressProofTypeChange}
                placeholder="Select document type"
                enableSearch={false}
              />
            </div>
            <DocumentUpload
              id="address-proof"
              label="Upload Document"
              accept={documents.allowedTypes.addressProof}
              required={isAddressProofRequired}
              value={addressProofDocument}
              onChange={onAddressProofDocumentChange}
              hint="Recent document (less than 3 months old)"
              sessionId={sessionId}
              category="address_proof"
              documentType={addressProofType || undefined}
            />
          </div>
        </div>

        {/* Business Proof Section */}
        <div className="p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Business Verification
                {!isBusinessProofRequired && (
                  <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">(Optional)</span>
                )}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Official business registration or tax document
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Document Type
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({countryCode || 'Select country first'})
                </span>
              </label>
              <SearchableSelect
                options={businessDocTypes.map(type => ({
                  value: type.value,
                  label: type.label,
                }))}
                value={businessProofType}
                onChange={onBusinessProofTypeChange}
                placeholder="Select document type"
                enableSearch={false}
                disabled={!countryCode}
              />
            </div>
            <DocumentUpload
              id="business-proof"
              label="Upload Document"
              accept={documents.allowedTypes.businessProof}
              required={isBusinessProofRequired}
              value={businessProofDocument}
              onChange={onBusinessProofDocumentChange}
              hint="Official government-issued document"
              disabled={!countryCode}
              sessionId={sessionId}
              category="business_proof"
              documentType={businessProofType || undefined}
            />
          </div>
        </div>

        {/* Logo Upload Section */}
        <div className="p-6 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Company Logo
                {!isLogoRequired && (
                  <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">(Optional)</span>
                )}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your brand logo for the storefront
              </p>
            </div>
          </div>

          <DocumentUpload
            id="company-logo"
            label="Upload Logo"
            description="Square format recommended (1:1 ratio). This will appear on your store."
            accept={documents.allowedTypes.logo}
            required={isLogoRequired}
            value={logoDocument}
            onChange={onLogoDocumentChange}
            hint="PNG, JPG, SVG or WebP. Recommended: 512x512px or larger"
            sessionId={sessionId}
            category="logo"
          />
        </div>
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
        <Shield className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Your documents are encrypted and stored securely. We only use them for verification purposes.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Documents are automatically deleted after verification is complete.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DocumentsSection;
