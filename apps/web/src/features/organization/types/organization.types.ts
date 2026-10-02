import type { TenantType } from '../../dashboard/types.js';

export interface OrganizationResponse {
  tenant: {
    id: string;
    name: string;
    legalName: string | null;
    code: string;
    type: TenantType;
    status: string;
  };
  profile: {
    businessName: string | null;
    legalName: string | null;
    registrationNumber: string | null;
    taxIdentificationNumber: string | null;
    country: string;
    county: string | null;
    subcounty: string | null;
    address: string | null;
    postalCode: string | null;
    website: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    description: string | null;
    ownershipType: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface UpdateOrganizationInput {
  businessName?: string;
  legalName?: string;
  registrationNumber?: string;
  taxIdentificationNumber?: string;
  country?: string;
  county?: string;
  subcounty?: string;
  address?: string;
  postalCode?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  ownershipType?: string;
}
