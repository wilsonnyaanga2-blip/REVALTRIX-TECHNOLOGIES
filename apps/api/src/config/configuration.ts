export default () => ({
  app: {
    name: process.env.APP_NAME ?? 'Revaltrix Platform API',
    environment: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 5000),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    webAppUrl: process.env.WEB_APP_URL ?? 'http://localhost:5173',
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
});
