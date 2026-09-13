/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/login.html',
      },
      {
        source: '/login',
        destination: '/login.html',
      },
      {
        source: '/inspector',
        destination: '/inspector.html',
      },
      {
        source: '/officer',
        destination: '/officer.html',
      },
    ];
  },
};

module.exports = nextConfig;
