import { apiRequest } from '../../../lib/api.js';
import type { RegistrationDashboardResponse } from '../types/registration-dashboard.types.js';

const REGISTRATION_TOKEN_KEY = 'revaltrix_registration_token';

export function getRegistrationToken(): string | null {
  return window.sessionStorage.getItem(REGISTRATION_TOKEN_KEY);
}

export function setRegistrationToken(token: string): void {
  window.sessionStorage.setItem(REGISTRATION_TOKEN_KEY, token);
}

export function clearRegistrationToken(): void {
  window.sessionStorage.removeItem(REGISTRATION_TOKEN_KEY);
}

export async function getRegistrationDashboard(): Promise<RegistrationDashboardResponse> {
  const token = getRegistrationToken();

  if (!token) {
    throw new Error('Registration session is required.');
  }

  return apiRequest<RegistrationDashboardResponse>(
    '/v1/registration-dashboard',
    {
      headers: {
        'X-Registration-Token': token,
      },
    },
  );
}
