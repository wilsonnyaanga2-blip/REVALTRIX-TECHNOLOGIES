import { apiRequest } from '../../../lib/api.js';
import { getRegistrationToken } from './registration-dashboard.api.js';

export interface CompleteOnboardingResponse {
  registration: {
    id: string;
    type: 'TENANT' | 'PATIENT';
    status: 'COMPLETED';
    verificationStatus: 'VERIFIED';
    onboardingStatus: 'COMPLETED';
  };
  onboardingStatus: 'COMPLETED';
  completed: true;
  userId: string;
  authentication: {
    accessToken: string;
    refreshToken: string;
    sessionId: string;
    expiresAt: string;
    userId: string;
  };
}

export async function completeOnboarding(): Promise<CompleteOnboardingResponse> {
  const token = getRegistrationToken();

  if (!token) {
    throw new Error('Registration session is required.');
  }

  return apiRequest<CompleteOnboardingResponse>(
    '/v1/onboarding/complete',
    {
      method: 'POST',
      headers: {
        'X-Registration-Token': token,
      },
    },
  );
}
