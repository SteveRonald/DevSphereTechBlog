import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://codecraftacademy.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin-", "/studio/", "/auth/callback"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
