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
  images: {
    domains: ['firebasestorage.googleapis.com', 'placehold.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

module.exports = nextConfig
