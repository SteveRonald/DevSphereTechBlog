/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "").split("/")[0] || "*.supabase.co",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  async redirects() {
    return [
      // Redirect old post URLs to new blog URLs
      {
        source: "/post/:slug*",
        destination: "/blog/:slug*",
        permanent: true, // 301 redirect for SEO
      },
      // Redirect old category URLs to new blog category URLs
      {
        source: "/category/:category*",
        destination: "/blog/category/:category*",
        permanent: true, // 301 redirect for SEO
      },
    ];
  },
};

module.exports = nextConfig;

