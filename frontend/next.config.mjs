/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  output: 'standalone', // Force standalone to ensure SW generation

  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.discogs.com',
      },
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
      }
    ],
    unoptimized: true,
  },
  headers: async () => [
    {
      source: '/manifest.json',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/manifest+json',
        },
      ],
    },
  ],
}

console.log("NEXT CONFIG LOADED. OUTPUT:", nextConfig.output);
export default nextConfig;
