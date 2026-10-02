import { authenticatedApiRequest } from '../../../lib/auth-api.js';
import type { PatientDashboardResponse } from '../types/patient-dashboard.types.js';

export async function getMyPatientDashboard(): Promise<PatientDashboardResponse> {
  return authenticatedApiRequest<PatientDashboardResponse>(
    '/v1/patients/me',
  );
}

export async function approvePatientRelationshipRequest(
  requestId: string,
): Promise<void> {
  await authenticatedApiRequest(
    `/v1/patients/relationship-requests/${encodeURIComponent(requestId)}/approve`,
    {
      method: 'POST',
    },
  );
}

export async function declinePatientRelationshipRequest(
  requestId: string,
  reason?: string,
): Promise<void> {
  await authenticatedApiRequest(
    `/v1/patients/relationship-requests/${encodeURIComponent(requestId)}/decline`,
    {
      method: 'POST',
      body: JSON.stringify({
        reason: reason?.trim() || undefined,
      }),
    },
  );
}
