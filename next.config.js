// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

const isDocker = process.env.DOCKER === "true";
console.log(`🛠 Running inside Docker: ${isDocker}`);

const FALLBACK_API = "https://aoe2hd-parser-api.onrender.com";

const API_BASE = isDocker
  ? "http://aoe2-backend:8002" // Now we definitely call "aoe2-backend:8002"
  : process.env.NEXT_PUBLIC_API_BASE_URL || FALLBACK_API;

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
        destination: isDocker
          ? "http://aoe2-backend:8002/api/game_stats"
          : `${API_BASE}/api/game_stats`,
      },
      {
        source: "/api/admin/users",
        destination: isDocker
          ? "http://aoe2-backend:8002/api/admin/users"
          : `${API_BASE}/api/admin/users`,
      },
      {
        source: "/api/parse_replay",
        destination: isDocker
          ? "http://aoe2-backend:8002/api/parse_replay"
          : `${API_BASE}/api/parse_replay`,
      },
      {
        source: "/api/user/me",
        destination: isDocker
          ? "http://aoe2-backend:8002/api/user/me"
          : `${API_BASE}/api/user/me`,
      },
      {
        source: "/api/user/update_name",
        destination: isDocker
          ? "http://aoe2-backend:8002/api/user/update_name"
          : `${API_BASE}/api/user/update_name`,
      },
      {
        source: "/api/user/register",
        destination: isDocker
          ? "http://aoe2-backend:8002/api/user/register"
          : `${API_BASE}/api/user/register`,
      },
      {
        source: "/api/online_users",
        destination: isDocker
          ? "http://aoe2-backend:8002/api/user/online"
          : `${API_BASE}/api/user/online`,
      },
    ];
  },
});
