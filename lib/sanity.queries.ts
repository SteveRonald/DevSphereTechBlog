import { groq } from "next-sanity";

// Get all posts (only published ones)
export const postsQuery = groq`*[_type == "post" && defined(publishedAt)] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  mainImage,
  publishedAt,
  readTime,
  featured,
  "author": author->{
    name,
    image,
    role
  },
  "categories": categories[]->{
    title,
    slug
  }
}`;

// Get featured posts
export const featuredPostsQuery = groq`*[_type == "post" && featured == true && defined(publishedAt)] | order(publishedAt desc) [0...3] {
  _id,
  title,
  slug,
  excerpt,
  mainImage,
  publishedAt,
  readTime,
  "author": author->{
    name,
    image,
    role
  },
  "categories": categories[]->{
    title,
    slug
  }
}`;

// Get single post by slug
export const postBySlugQuery = groq`*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  excerpt,
  mainImage,
  publishedAt,
  readTime,
  featured,
  body,
  tags,
  "author": author->{
    name,
    image,
    role,
    bio,
    "socialLinks": socialLinks
  },
  "categories": categories[]->{
    title,
    slug
  }
}`;

// Get posts by category (only published ones)
export const postsByCategoryQuery = groq`*[_type == "post" && defined(publishedAt) && $category in categories[]->slug.current] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  mainImage,
  publishedAt,
  readTime,
  "author": author->{
    name,
    image,
    role
  },
  "categories": categories[]->{
    title,
    slug
  }
}`;

// Get all categories with post counts
export const categoriesQuery = groq`*[_type == "category"] | order(title asc) {
  _id,
  title,
  slug,
  description,
  "count": count(*[_type == "post" && defined(publishedAt) && references(^._id)])
}`;

// Get recent posts (only published ones)
export const recentPostsQuery = groq`*[_type == "post" && defined(publishedAt)] | order(publishedAt desc) [0...6] {
  _id,
  title,
  slug,
  excerpt,
  mainImage,
  publishedAt,
  readTime,
  "author": author->{
    name,
    image
  },
  "categories": categories[]->{
    title,
    slug
  }
}`;

