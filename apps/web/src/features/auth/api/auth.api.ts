import { apiRequest } from '../../../lib/api.js';
import type {
  LoginInput,
  LoginResponse,
} from '../types/auth.types.js';

export async function login(
  input: LoginInput,
): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(
    '/v1/core/authentication/login',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}
