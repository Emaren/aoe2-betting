const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Prevents PWA caching in dev mode
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    BACKEND_API: process.env.BACKEND_API || "https://your-flask-app.onrender.com",
    REPLAY_API: process.env.REPLAY_API || "https://your-flask-app.onrender.com",
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

module.exports = withPWA(nextConfig);
