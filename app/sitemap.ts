import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://codecraftacademy.vercel.app";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/free-courses`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/reviews`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/career`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/newsletter`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/donate`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  // Dynamic pages from Supabase
  let blogPages: MetadataRoute.Sitemap = [];
  let coursePages: MetadataRoute.Sitemap = [];
  let careerPages: MetadataRoute.Sitemap = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Blog posts
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("published", true);

    if (posts) {
      blogPages = posts.map((post: { slug: string; updated_at: string; published_at: string }) => ({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at || post.published_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }

    // Courses
    const { data: courses } = await supabase
      .from("courses")
      .select("slug, updated_at")
      .eq("is_published", true);

    if (courses) {
      coursePages = courses.map((course: { slug: string; updated_at: string }) => ({
        url: `${siteUrl}/courses/${course.slug}`,
        lastModified: new Date(course.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }

    // Career posts
    const { data: careers } = await supabase
      .from("career_posts")
      .select("slug, updated_at")
      .eq("published", true);

    if (careers) {
      careerPages = careers.map((career: { slug: string; updated_at: string }) => ({
        url: `${siteUrl}/career/${career.slug}`,
        lastModified: new Date(career.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }

  return [...staticPages, ...blogPages, ...coursePages, ...careerPages];
}
