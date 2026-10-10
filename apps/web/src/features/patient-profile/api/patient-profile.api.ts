import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import { requestStepUpChallengeId } from '../../../lib/step-up.js';
import type {
  PatientAddress,
  PatientContact,
  PatientCorporateProfile,
  PatientEmergencyContact,
  PatientInsurance,
  PatientNextOfKin,
} from '../types/patient-profile.types.js';

const base = '/v1/patient-data';

export async function getPatientContact(): Promise<PatientContact | null> {
  const response = await authenticatedApiRequest<{
    data: PatientContact | null;
  }>(`${base}/contact`);
  return response.data;
}

export async function savePatientContact(
  payload: Record<string, unknown>,
): Promise<PatientContact> {
  const stepUpChallengeId = await requestStepUpChallengeId();
  const response = await authenticatedApiRequest<{
    data: PatientContact;
  }>(`${base}/contact`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    headers: { 'x-step-up-challenge-id': stepUpChallengeId },
  });
  return response.data;
}

export async function deletePatientContact(): Promise<void> {
  const stepUpChallengeId = await requestStepUpChallengeId();
  await authenticatedApiRequest(`${base}/contact`, {
    method: 'DELETE',
    headers: { 'x-step-up-challenge-id': stepUpChallengeId },
  });
}

export const getPatientAddresses = () =>
  authenticatedApiRequest<PatientAddress[]>(`${base}/addresses`);

export const createPatientAddress = (payload: Record<string, unknown>) =>
  authenticatedApiRequest<PatientAddress>(`${base}/addresses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updatePatientAddress = (
  id: string,
  payload: Record<string, unknown>,
) =>
  authenticatedApiRequest<PatientAddress>(
    `${base}/addresses/${encodeURIComponent(id)}`,
    { method: 'PUT', body: JSON.stringify(payload) },
  );

export const setPrimaryPatientAddress = (id: string) =>
  authenticatedApiRequest(`${base}/addresses/${encodeURIComponent(id)}/set-primary`, {
    method: 'POST',
  });

export const deletePatientAddress = (id: string) =>
  authenticatedApiRequest(`${base}/addresses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

export const getEmergencyContacts = () =>
  authenticatedApiRequest<PatientEmergencyContact[]>(
    `${base}/emergency-contacts`,
  );

export const createEmergencyContact = (payload: Record<string, unknown>) =>
  authenticatedApiRequest<PatientEmergencyContact>(
    `${base}/emergency-contacts`,
    { method: 'POST', body: JSON.stringify(payload) },
  );

export const updateEmergencyContact = (
  id: string,
  payload: Record<string, unknown>,
) =>
  authenticatedApiRequest<PatientEmergencyContact>(
    `${base}/emergency-contacts/${encodeURIComponent(id)}`,
    { method: 'PUT', body: JSON.stringify(payload) },
  );

export const deleteEmergencyContact = (id: string) =>
  authenticatedApiRequest(`${base}/emergency-contacts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

export const getNextOfKin = () =>
  authenticatedApiRequest<PatientNextOfKin[]>(`${base}/next-of-kin`);

export const createNextOfKin = (payload: Record<string, unknown>) =>
  authenticatedApiRequest<PatientNextOfKin>(`${base}/next-of-kin`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateNextOfKin = (
  id: string,
  payload: Record<string, unknown>,
) =>
  authenticatedApiRequest<PatientNextOfKin>(
    `${base}/next-of-kin/${encodeURIComponent(id)}`,
    { method: 'PUT', body: JSON.stringify(payload) },
  );

export const deleteNextOfKin = (id: string) =>
  authenticatedApiRequest(`${base}/next-of-kin/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

export const getPatientInsurance = () =>
  authenticatedApiRequest<PatientInsurance[]>(`${base}/insurance`);

export const createPatientInsurance = (payload: Record<string, unknown>) =>
  authenticatedApiRequest<PatientInsurance>(`${base}/insurance`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updatePatientInsurance = (
  id: string,
  payload: Record<string, unknown>,
) =>
  authenticatedApiRequest<PatientInsurance>(
    `${base}/insurance/${encodeURIComponent(id)}`,
    { method: 'PUT', body: JSON.stringify(payload) },
  );

export const deletePatientInsurance = (id: string) =>
  authenticatedApiRequest(`${base}/insurance/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });

export const getCorporateProfile = () =>
  authenticatedApiRequest<PatientCorporateProfile | null>(
    `${base}/corporate-profile`,
  );

export const saveCorporateProfile = (payload: Record<string, unknown>) =>
  authenticatedApiRequest<PatientCorporateProfile>(
    `${base}/corporate-profile`,
    { method: 'PUT', body: JSON.stringify(payload) },
  );

export const deleteCorporateProfile = () =>
  authenticatedApiRequest(`${base}/corporate-profile`, {
    method: 'DELETE',
  });
