// ===========================================
// Staff Document Types
// ===========================================

// Document Type Enum
export type StaffDocumentType =
  | 'id_proof_government_id'
  | 'id_proof_passport'
  | 'id_proof_drivers_license'
  | 'address_proof'
  | 'employment_contract'
  | 'tax_w9'
  | 'tax_i9'
  | 'tax_w4'
  | 'tax_other'
  | 'background_check'
  | 'professional_certification'
  | 'education_certificate'
  | 'emergency_contact_form'
  | 'nda_agreement'
  | 'non_compete_agreement'
  | 'other';

// Verification Status Enum
export type DocumentVerificationStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'requires_update';

// Access Level Enum
export type DocumentAccessLevel =
  | 'self_only'
  | 'manager'
  | 'hr_only'
  | 'public';

// Staff Info (embedded in document responses)
export interface StaffInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

// Staff Document
export interface StaffDocument {
  id: string;
  tenantId: string;
  vendorId?: string;
  staffId: string;
  documentType: StaffDocumentType;
  documentName: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  storagePath?: string;
  fileUrl?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
  verificationStatus: DocumentVerificationStatus;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  isMandatory: boolean;
  accessLevel: DocumentAccessLevel;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
  // Optional staff info when returned with documents list
  staff?: StaffInfo;
}

// Emergency Contact
export interface EmergencyContact {
  id: string;
  tenantId: string;
  vendorId?: string;
  staffId: string;
  name: string;
  relationship?: string;
  phonePrimary: string;
  phoneSecondary?: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create/Update Requests
export interface CreateStaffDocumentRequest {
  documentType: StaffDocumentType;
  documentName: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  storagePath?: string;
  fileUrl?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
  isMandatory?: boolean;
  accessLevel?: DocumentAccessLevel;
}

export interface UpdateStaffDocumentRequest {
  documentName?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  storagePath?: string;
  fileUrl?: string;
  fileMimeType?: string;
  fileSizeBytes?: number;
  isMandatory?: boolean;
  accessLevel?: DocumentAccessLevel;
}

export interface VerifyDocumentRequest {
  status: 'verified' | 'rejected' | 'requires_update';
  notes?: string;
  rejectionReason?: string;
}

export interface CreateEmergencyContactRequest {
  name: string;
  relationship?: string;
  phonePrimary: string;
  phoneSecondary?: string;
  email?: string;
  address?: string;
  isPrimary?: boolean;
}

export interface UpdateEmergencyContactRequest {
  name?: string;
  relationship?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  email?: string;
  address?: string;
}

// Compliance Types
export interface DocumentComplianceItem {
  documentType: StaffDocumentType;
  displayName: string;
  category: string;
  isMandatory: boolean;
  status: 'missing' | 'pending' | 'verified' | 'expired' | 'rejected';
  documentId?: string;
  expiresAt?: string;
  daysUntilExpiry?: number;
}

export interface StaffComplianceStatus {
  staffId: string;
  staffName: string;
  totalRequired: number;
  completed: number;
  pending: number;
  expired: number;
  missing: number;
  compliancePercentage: number;
  isFullyCompliant: boolean;
  items: DocumentComplianceItem[];
}

// Document Type Metadata
export interface DocumentTypeInfo {
  type: StaffDocumentType;
  displayName: string;
  category: 'identity' | 'address' | 'employment' | 'tax' | 'verification' | 'legal' | 'other';
  description: string;
  isMandatory: boolean;
  hasExpiry: boolean;
  expiryReminderDays?: number;
}

// Document Type Configuration
export const DOCUMENT_TYPE_INFO: Record<StaffDocumentType, DocumentTypeInfo> = {
  id_proof_government_id: {
    type: 'id_proof_government_id',
    displayName: 'Government ID',
    category: 'identity',
    description: 'Government-issued identification card (national ID, SSN card, etc.)',
    isMandatory: true,
    hasExpiry: true,
    expiryReminderDays: 90,
  },
  id_proof_passport: {
    type: 'id_proof_passport',
    displayName: 'Passport',
    category: 'identity',
    description: 'Valid passport for identity verification',
    isMandatory: false,
    hasExpiry: true,
    expiryReminderDays: 180,
  },
  id_proof_drivers_license: {
    type: 'id_proof_drivers_license',
    displayName: "Driver's License",
    category: 'identity',
    description: 'Valid driving license',
    isMandatory: false,
    hasExpiry: true,
    expiryReminderDays: 90,
  },
  address_proof: {
    type: 'address_proof',
    displayName: 'Address Proof',
    category: 'address',
    description: 'Utility bill, bank statement, or official letter (within 3 months)',
    isMandatory: true,
    hasExpiry: false,
  },
  employment_contract: {
    type: 'employment_contract',
    displayName: 'Employment Contract',
    category: 'employment',
    description: 'Signed employment agreement',
    isMandatory: true,
    hasExpiry: true,
    expiryReminderDays: 30,
  },
  tax_w9: {
    type: 'tax_w9',
    displayName: 'W-9 Form',
    category: 'tax',
    description: 'Request for Taxpayer Identification Number (US)',
    isMandatory: false,
    hasExpiry: false,
  },
  tax_i9: {
    type: 'tax_i9',
    displayName: 'I-9 Form',
    category: 'tax',
    description: 'Employment Eligibility Verification (US)',
    isMandatory: false,
    hasExpiry: false,
  },
  tax_w4: {
    type: 'tax_w4',
    displayName: 'W-4 Form',
    category: 'tax',
    description: "Employee's Withholding Certificate (US)",
    isMandatory: false,
    hasExpiry: false,
  },
  tax_other: {
    type: 'tax_other',
    displayName: 'Other Tax Document',
    category: 'tax',
    description: 'Other tax-related documentation',
    isMandatory: false,
    hasExpiry: false,
  },
  background_check: {
    type: 'background_check',
    displayName: 'Background Check',
    category: 'verification',
    description: 'Criminal background verification results',
    isMandatory: true,
    hasExpiry: true,
    expiryReminderDays: 365,
  },
  professional_certification: {
    type: 'professional_certification',
    displayName: 'Professional Certification',
    category: 'verification',
    description: 'Industry or professional certifications',
    isMandatory: false,
    hasExpiry: true,
    expiryReminderDays: 60,
  },
  education_certificate: {
    type: 'education_certificate',
    displayName: 'Education Certificate',
    category: 'verification',
    description: 'Degree or diploma certificates',
    isMandatory: false,
    hasExpiry: false,
  },
  emergency_contact_form: {
    type: 'emergency_contact_form',
    displayName: 'Emergency Contact Form',
    category: 'employment',
    description: 'Emergency contact information form',
    isMandatory: true,
    hasExpiry: false,
  },
  nda_agreement: {
    type: 'nda_agreement',
    displayName: 'NDA Agreement',
    category: 'legal',
    description: 'Non-Disclosure Agreement',
    isMandatory: false,
    hasExpiry: false,
  },
  non_compete_agreement: {
    type: 'non_compete_agreement',
    displayName: 'Non-Compete Agreement',
    category: 'legal',
    description: 'Non-Compete Agreement',
    isMandatory: false,
    hasExpiry: true,
    expiryReminderDays: 90,
  },
  other: {
    type: 'other',
    displayName: 'Other Document',
    category: 'other',
    description: 'Other staff-related documentation',
    isMandatory: false,
    hasExpiry: false,
  },
};

// Verification Status Styles
export const VERIFICATION_STATUS_STYLES: Record<
  DocumentVerificationStatus,
  { label: string; color: string; bgColor: string; borderColor: string; icon: string }
> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: 'Clock',
  },
  under_review: {
    label: 'Under Review',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: 'Search',
  },
  verified: {
    label: 'Verified',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: 'CheckCircle',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: 'XCircle',
  },
  expired: {
    label: 'Expired',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: 'AlertTriangle',
  },
  requires_update: {
    label: 'Requires Update',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: 'RefreshCw',
  },
};

// Document Category Groupings
export const DOCUMENT_CATEGORIES = [
  {
    id: 'identity',
    name: 'Identity Documents',
    description: 'Government-issued identification',
    types: ['id_proof_government_id', 'id_proof_passport', 'id_proof_drivers_license'] as StaffDocumentType[],
  },
  {
    id: 'address',
    name: 'Address Verification',
    description: 'Proof of residence',
    types: ['address_proof'] as StaffDocumentType[],
  },
  {
    id: 'employment',
    name: 'Employment Documents',
    description: 'Employment agreements and forms',
    types: ['employment_contract', 'emergency_contact_form'] as StaffDocumentType[],
  },
  {
    id: 'tax',
    name: 'Tax Documents',
    description: 'Tax-related forms and documents',
    types: ['tax_w9', 'tax_i9', 'tax_w4', 'tax_other'] as StaffDocumentType[],
  },
  {
    id: 'verification',
    name: 'Verification Documents',
    description: 'Background checks and certifications',
    types: ['background_check', 'professional_certification', 'education_certificate'] as StaffDocumentType[],
  },
  {
    id: 'legal',
    name: 'Legal Agreements',
    description: 'Legal contracts and agreements',
    types: ['nda_agreement', 'non_compete_agreement'] as StaffDocumentType[],
  },
];
