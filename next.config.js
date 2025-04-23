// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const isDocker = process.env.DOCKER === "true";
const isProd = process.env.ENV === "production";
console.log(`🛠 Running inside Docker: ${isDocker}`);

const FALLBACK_API = "https://aoe2hd-parser-api.onrender.com";

// Correctly use your environment variables:
const API_BASE = isDocker
  ? "http://aoe2-backend:8002"
  : (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || FALLBACK_API);

console.log(`🌐 Backend API base URL: ${API_BASE}`);

module.exports = withPWA({
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  env: {
    BACKEND_API: API_BASE,
    REPLAY_API: process.env.REPLAY_API || "",
  },

  async rewrites() {
    return [
      {
        source: "/api/game_stats",
        destination: `${API_BASE}/api/game_stats`,
      },
      {
        source: "/api/admin/users",
        destination: `${API_BASE}/api/admin/users`,
      },
      {
        source: "/api/parse_replay",
        destination: `${API_BASE}/api/parse_replay`,
      },
      {
        source: "/api/user/me",
        destination: `${API_BASE}/api/user/me`,
      },
      {
        source: "/api/user/update_name",
        destination: `${API_BASE}/api/user/update_name`,
      },
      {
        source: "/api/user/register",
        destination: `${API_BASE}/api/user/register`,
      },
      {
        source: "/api/online_users",
        destination: `${API_BASE}/api/user/online`,
      },
      {
        source: "/api/user/update_wallet",
        destination: `${API_BASE}/api/user/update_wallet`,
      },
      {
        source: "/api/user/verify_token",
        destination: `${API_BASE}/api/user/verify_token`,
      },
      {
        source: "/api/health",
        destination: `${API_BASE}/api/health`,
      },
    ];
  },
});
