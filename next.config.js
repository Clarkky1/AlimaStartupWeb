/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  optimizeFonts: false,
  experimental: {
    missingSuspenseWithCSRBailout: false
  },
  // Add redirects configuration
  async redirects() {
    return [
      {
        source: '/services',
        destination: '/popular-today',
        permanent: false,
      },
    ];
  },
}

module.exports = nextConfig
