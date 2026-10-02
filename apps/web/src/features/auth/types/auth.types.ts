export interface LoginInput {
  identityType: 'EMAIL' | 'PHONE';
  identifier: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresAt: string;
  userId: string;
}
