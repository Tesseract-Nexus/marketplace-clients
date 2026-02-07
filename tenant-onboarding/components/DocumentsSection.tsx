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
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-terracotta-500 to-terracotta-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Documents & Verification</h2>
          <p className="text-foreground-secondary">Upload documents to verify your business</p>
        </div>
      </div>

      {/* Trust Score Card */}
      <VerificationScore items={verificationItems} showDetails={true} />

      {/* Optional Banner */}
      {!isAddressProofRequired && !isBusinessProofRequired && !isLogoRequired && (
        <div className="flex items-start gap-3 p-4 bg-warm-50 border border-warm-200 rounded-xl">
          <Sparkles className="w-5 h-5 text-terracotta-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              These documents are optional but recommended
            </p>
            <p className="text-sm text-terracotta-600 mt-0.5">
              Uploading verification documents increases your trust score and unlocks additional features.
            </p>
          </div>
        </div>
      )}

      {/* Document Upload Cards */}
      <div className="space-y-6">
        {/* Address Proof Section */}
        <div className="p-6 bg-white border border-warm-200 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-terracotta-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Address Verification
                {!isAddressProofRequired && (
                  <span className="ml-2 text-xs font-normal text-foreground-tertiary">(Optional)</span>
                )}
              </h3>
              <p className="text-sm text-foreground-secondary">
                Proof of your business address
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
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
        <div className="p-6 bg-white border border-warm-200 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-terracotta-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Business Verification
                {!isBusinessProofRequired && (
                  <span className="ml-2 text-xs font-normal text-foreground-tertiary">(Optional)</span>
                )}
              </h3>
              <p className="text-sm text-foreground-secondary">
                Official business registration or tax document
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Document Type
                <span className="ml-2 text-xs font-normal text-foreground-tertiary">
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
        <div className="p-6 bg-white border border-warm-200 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
              <Palette className="w-5 h-5 text-terracotta-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Company Logo
                {!isLogoRequired && (
                  <span className="ml-2 text-xs font-normal text-foreground-tertiary">(Optional)</span>
                )}
              </h3>
              <p className="text-sm text-foreground-secondary">
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
      <div className="flex items-start gap-3 p-4 bg-warm-50 border border-warm-200 rounded-xl">
        <Shield className="w-5 h-5 text-foreground-tertiary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-foreground-secondary">
            Your documents are encrypted and stored securely. We only use them for verification purposes.
          </p>
          <p className="text-xs text-foreground-tertiary mt-1">
            Documents are automatically deleted after verification is complete.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DocumentsSection;
