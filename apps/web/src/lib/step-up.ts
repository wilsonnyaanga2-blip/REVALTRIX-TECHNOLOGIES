import { authenticatedApiRequest } from './auth-api.js';

export async function requestStepUpChallengeId(): Promise<string> {
  const challenge = await authenticatedApiRequest<{
    data: { challengeId: string };
  }>('/v1/patient-family/step-up/request', { method: 'POST' });
  const code = window.prompt(
    'A one-time security code was sent to your verified email. Enter it to confirm this action:',
  );
  if (!code) throw new Error('Security verification was cancelled.');

  await authenticatedApiRequest('/v1/patient-family/step-up/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId: challenge.data.challengeId, code: code.trim() }),
  });
  return challenge.data.challengeId;
}
