export interface PatientContact {
  id: string;
  phone: string | null;
  alternativePhone: string | null;
  email: string | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientAddress {
  id: string;
  county: string;
  town: string;
  area: string | null;
  physicalAddress: string;
  postalAddress: string | null;
  isPrimary: boolean;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientEmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  alternativePhone: string | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientNextOfKin {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  address: string | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientInsurance {
  id: string;
  provider: string;
  memberNumber: string;
  policyNumber: string | null;
  principalMember: string | null;
  relationshipToPrincipal: string | null;
  validFrom: string | null;
  validUntil: string | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientCorporateProfile {
  id: string;
  company: string;
  employeeNumber: string | null;
  corporatePlan: string | null;
  eligibilityInformation: Record<string, unknown> | null;
  status: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfileData {
  contact: PatientContact | null;
  addresses: PatientAddress[];
  emergencyContacts: PatientEmergencyContact[];
  nextOfKin: PatientNextOfKin[];
  insurance: PatientInsurance[];
  corporateProfile: PatientCorporateProfile | null;
}
