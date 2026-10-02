import { randomBytes } from 'node:crypto';

export default () => {
  const environment = process.env.NODE_ENV ?? 'development';
  const configuredSecret = process.env.JWT_ACCESS_SECRET;

  if (environment === 'production' && !configuredSecret) {
    throw new Error(
      'JWT_ACCESS_SECRET must be configured when NODE_ENV=production',
    );
  }

  return {
    authentication: {
      jwt: {
        secret:
          configuredSecret ??
          randomBytes(64).toString('hex'),
        issuer:
          process.env.JWT_ISSUER ??
          'revaltrix-platform',
        audience:
          process.env.JWT_AUDIENCE ??
          'revaltrix-api',
        accessTokenTtl:
          process.env.JWT_ACCESS_TTL ??
          '15m',
      },
    },
  };
};
