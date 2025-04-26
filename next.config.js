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
  // Add security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' https://res.cloudinary.com data: blob:; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' https://*.firebaseapp.com https://*.googleapis.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://api.cloudinary.com; frame-ancestors 'none'"
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  images: {
    domains: ['firebasestorage.googleapis.com', 'placehold.co', 'res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

module.exports = nextConfig
