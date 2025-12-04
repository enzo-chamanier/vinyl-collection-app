/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // export statique pour Netlify
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.discogs.com' },
      { protocol: 'https', hostname: '**.githubusercontent.com' },
    ],
    unoptimized: true, // nécessaire pour export statique
  },
  headers: async () => [
    {
      source: '/manifest.json',
      headers: [
        { key: 'Content-Type', value: 'application/manifest+json' },
      ],
    },
  ],
};

module.exports = nextConfig;
