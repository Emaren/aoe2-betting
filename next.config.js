const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const isDocker = process.env.DOCKER === 'true';
const FALLBACK_API = "https://aoe2hd-parser-api.onrender.com";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || FALLBACK_API;

module.exports = withPWA({
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  env: {
    BACKEND_API: API_BASE,
    REPLAY_API: process.env.REPLAY_API || '',
  },

  async rewrites() {
    return [
      {
        source: '/api/game_stats',
        destination: isDocker
          ? 'http://aoe2-backend:8002/api/game_stats'
          : `${FALLBACK_API}/api/game_stats`, // ✅ hard fallback here
      },
      {
        source: '/admin/users',
        destination: isDocker
          ? 'http://aoe2-backend:8002/admin/users'
          : `${FALLBACK_API}/admin/users`,
      },
      {
        source: '/api/parse_replay',
        destination: isDocker
          ? 'http://aoe2-backend:8002/api/parse_replay'
          : `${FALLBACK_API}/api/parse_replay`,
      },
      {
        source: '/api/user/me',
        destination: isDocker
          ? 'http://aoe2-backend:8002/api/user/me'
          : `${FALLBACK_API}/api/user/me`,
      },
      {
        source: '/api/user/update_name',
        destination: isDocker
          ? 'http://aoe2-backend:8002/api/user/update_name'
          : `${FALLBACK_API}/api/user/update_name`,
      },
    ];
  },
});
