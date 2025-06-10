module.exports = {
  apps: [
    {
      name: 'app-staging',
      script: 'yarn',
      args: 'start',
      cwd: '/var/www/app-staging',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        NEXT_PUBLIC_API_BASE_URL: 'https://api-staging.aoe2hdbets.com',
        FASTAPI_API_URL: 'http://localhost:8003'
      }
    }
  ]
};
