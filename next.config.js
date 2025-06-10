// next.config.js — PWA removed, backend local on same VPS

const withPWA = require("next-pwa")({
  dest: "public",
  disable: true,
});

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8003";

module.exports = withPWA({
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  productionBrowserSourceMaps: false,
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
      { source: "/api/user/online",        destination: `${API_BASE}/api/user/online` },
      { source: "/api/user/online_users", destination: `${API_BASE}/api/user/online_users` },
      { source: "/api/user/ping",          destination: `${API_BASE}/api/user/ping` },
      { source: "/api/chain-id",           destination: `${API_BASE}/api/chain-id` },
      { source: "/api/health",             destination: `${API_BASE}/api/health` },
    ];
  },
});
