import { apiRequest } from '../../../lib/api.js';
import { setRegistrationToken } from './registration-dashboard.api.js';

export type TenantType =
  | 'HOSPITAL'
  | 'CLINIC'
  | 'SPECIALIST_PRACTICE'
  | 'MEDICAL_CENTER'
  | 'DIAGNOSTIC_CENTER'
  | 'LABORATORY'
  | 'RADIOLOGY_CENTER'
  | 'PHARMACY'
  | 'DENTAL_CLINIC'
  | 'OPTICAL_CENTER'
  | 'MATERNITY_CENTER'
  | 'REHABILITATION_CENTER'
  | 'HOME_HEALTH_PROVIDER'
  | 'AMBULANCE_PROVIDER'
  | 'HEALTHCARE_NETWORK'
  | 'CORPORATE_HEALTH_PROVIDER'
  | 'INSURER'
  | 'EXTERNAL_PROVIDER'
  | 'OTHER_HEALTHCARE_PROVIDER';

export interface RegisterPatientInput {
  firstName: string;
  secondName: string;
  email: string;
  phone: string;
  location: string;
}

export interface RegisterTenantInput {
  tenantType: TenantType;
  businessName: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
}

export interface RegistrationResponse {
  registrationId: string;
  tenantId?: string;
  userId: string;
  status: string;
  verificationStatus: string;
  onboardingStatus: string;
  registrationToken: string;
  registrationTokenExpiresAt: string;
}

export async function registerPatient(
  input: RegisterPatientInput,
): Promise<RegistrationResponse> {
  const response = await apiRequest<RegistrationResponse>(
    '/v1/registration/patients',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );

  setRegistrationToken(response.registrationToken);

  return response;
}

export async function registerTenant(
  input: RegisterTenantInput,
): Promise<RegistrationResponse> {
  const response = await apiRequest<RegistrationResponse>(
    '/v1/registration/tenants',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );

  setRegistrationToken(response.registrationToken);

  return response;
}
