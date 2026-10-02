import { apiRequest } from '../../../lib/api.js';
import { getRegistrationToken } from './registration-dashboard.api.js';

export type VerificationChannel = 'EMAIL' | 'PHONE';

export interface VerificationChallengeResponse {
  challengeId: string;
  channel: VerificationChannel;
  target: string;
  expiresAt: string;
  deliveryStatus: string;
}

export interface VerifyRegistrationResponse {
  verified: boolean;
  channel: VerificationChannel;
  challengeId: string;
  verificationStatus: string;
  registrationStatus: string;
}

function registrationHeaders(): HeadersInit {
  const token = getRegistrationToken();

  if (!token) {
    throw new Error('Registration session is required.');
  }

  return {
    'X-Registration-Token': token,
  };
}

export async function requestRegistrationVerification(
  channel: VerificationChannel,
): Promise<VerificationChallengeResponse> {
  return apiRequest<VerificationChallengeResponse>(
    '/v1/verification/registration/request',
    {
      method: 'POST',
      headers: registrationHeaders(),
      body: JSON.stringify({ channel }),
    },
  );
}

export async function verifyRegistrationCode(
  challengeId: string,
  code: string,
): Promise<VerifyRegistrationResponse> {
  return apiRequest<VerifyRegistrationResponse>(
    '/v1/verification/registration/verify',
    {
      method: 'POST',
      headers: registrationHeaders(),
      body: JSON.stringify({
        challengeId,
        code,
      }),
    },
  );
}
