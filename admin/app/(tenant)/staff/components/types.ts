import { StaffRole, EmploymentType } from '@/lib/api/types';

export interface StaffFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  displayName: string;
  email: string;
  alternateEmail: string;
  phoneNumber: string;
  mobileNumber: string;
  role: StaffRole;
  employmentType: EmploymentType;
  startDate: string;
  endDate: string;
  jobTitle: string;
  salary: number | undefined;
  currencyCode: string;
  departmentId: string;
  teamId: string;
  managerId: string;
  locationId: string;
  // Address fields (aligned with onboarding)
  streetAddress: string;
  streetAddress2: string;
  city: string;
  state: string;
  stateCode: string;
  postalCode: string;
  country: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
  formattedAddress: string;
  placeId: string;
}

export const initialFormData: StaffFormData = {
  firstName: '',
  lastName: '',
  middleName: '',
  displayName: '',
  email: '',
  alternateEmail: '',
  phoneNumber: '',
  mobileNumber: '',
  role: 'employee',
  employmentType: 'full_time',
  startDate: '',
  endDate: '',
  jobTitle: '',
  salary: undefined,
  currencyCode: 'USD',
  departmentId: '',
  teamId: '',
  managerId: '',
  locationId: '',
  // Address fields
  streetAddress: '',
  streetAddress2: '',
  city: '',
  state: '',
  stateCode: '',
  postalCode: '',
  country: '',
  countryCode: '',
  latitude: undefined,
  longitude: undefined,
  formattedAddress: '',
  placeId: '',
};

export interface StaffFormStepProps {
  formData: StaffFormData;
  setFormData: React.Dispatch<React.SetStateAction<StaffFormData>>;
  isEditing?: boolean;
  roles?: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  description?: string;
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
}
