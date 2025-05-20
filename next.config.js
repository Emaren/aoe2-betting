// next.config.js
const isDev = process.env.NODE_ENV === "development";
const isDocker = process.env.DOCKER === "true";
console.log(`🛠 Running inside Docker: ${isDocker}`);

const FALLBACK_API = "https://aoe2hd-parser-api.onrender.com";
const API_BASE = isDocker
  ? "http://aoe2-backend:8002"
  : process.env.NEXT_PUBLIC_API_BASE_URL || FALLBACK_API;
console.log(`🌐 Backend API base URL: ${API_BASE}`);

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev, // disable in dev to prevent Workbox + HMR loops
});

module.exports = withPWA({
  reactStrictMode: false, // avoid double-render during dev
  productionBrowserSourceMaps: false, // don't generate giant .map files
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    BACKEND_API: API_BASE,
    REPLAY_API: process.env.REPLAY_API || "",
  },
  async rewrites() {
    return [
      { source: "/api/game_stats",         destination: `${API_BASE}/api/game_stats` },
      { source: "/api/admin/users",        destination: `${API_BASE}/api/admin/users` },
      { source: "/api/parse_replay",       destination: `${API_BASE}/api/parse_replay` },
      { source: "/api/user/me",            destination: `${API_BASE}/api/user/me` },
      { source: "/api/user/register",      destination: `${API_BASE}/api/user/register` },
      { source: "/api/user/update_name",   destination: `${API_BASE}/api/user/update_name` },
      { source: "/api/user/update_wallet", destination: `${API_BASE}/api/user/update_wallet` },
      { source: "/api/user/verify_token",  destination: `${API_BASE}/api/user/verify_token` },
      { source: "/api/online_users",       destination: `${API_BASE}/api/user/online` },
      { source: "/api/health",             destination: `${API_BASE}/api/health` },
    ];
  },
});
