import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { sanityClient } from '@/lib/sanity';

// Types for dual-source blog posts
interface SanityPost {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  mainImage?: {
    asset: {
      _ref: string;
      _type: string;
    };
    alt?: string;
  };
  publishedAt: string;
  readTime: number;
  featured: boolean;
  tags: string[];
  categories: Array<{
    title: string;
    slug: { current: string };
  }>;
  author: {
    name: string;
    image?: {
      asset: {
        _ref: string;
      };
    };
    role?: string;
  };
  body: any[];
  _source: 'sanity';
}

interface SupabasePost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  main_image_url: string | null;
  main_image_alt: string | null;
  published_at: string | null;
  read_time: number;
  featured: boolean;
  tags: string[] | null;
  blog_categories: {
    title: string;
    slug: string;
  } | null;
  blog_authors: {
    id: string;
    name: string;
    image_url: string | null;
    role: string | null;
  } | null;
  user_profiles: {
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
  created_at: string;
  updated_at: string;
  _source: 'supabase';
}

type UnifiedPost = SanityPost | SupabasePost;

// Helper function to check if a post is from Sanity
function isSanityPost(post: UnifiedPost): post is SanityPost {
  return (post as any)._source === 'sanity';
}

// Helper function to check if a post is from Supabase
function isSupabasePost(post: UnifiedPost): post is SupabasePost {
  return (post as any)._source === 'supabase';
}

// Transform Sanity post to unified format
function transformSanityPost(post: any): SanityPost {
  return {
    ...post,
    _source: 'sanity' as const,
  };
}

// Transform Supabase post to unified format
function transformSupabasePost(post: any): SupabasePost {
  return {
    ...post,
    _source: 'supabase' as const,
  };
}

// Get unified post title
function getPostTitle(post: UnifiedPost): string {
  if (isSanityPost(post)) {
    return post.title;
  }
  return post.title;
}

// Get unified post slug
function getPostSlug(post: UnifiedPost): string {
  if (isSanityPost(post)) {
    return post.slug.current;
  }
  return post.slug;
}

// Get unified post excerpt
function getPostExcerpt(post: UnifiedPost): string {
  if (isSanityPost(post)) {
    return post.excerpt;
  }
  return post.excerpt || '';
}

// Get unified post image
function getPostImage(post: UnifiedPost): string | null {
  if (isSanityPost(post)) {
    return post.mainImage ? 
      `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${post.mainImage.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp')}` 
      : null;
  }
  return post.main_image_url;
}

// Get unified post published date
function getPostPublishedAt(post: UnifiedPost): string {
  if (isSanityPost(post)) {
    return post.publishedAt;
  }
  return post.published_at || post.created_at;
}

// Get unified post author
function getPostAuthor(post: UnifiedPost): { name: string; image?: string | null; role?: string | null } {
  if (isSanityPost(post)) {
    return {
      name: post.author.name,
      image: post.author.image ? 
        `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${post.author.image.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp')}` 
        : null,
      role: post.author.role,
    };
  }
  
  // For Supabase, try to get author from blog_authors first, then user_profiles
  if (post.blog_authors) {
    return {
      name: post.blog_authors.name,
      image: post.blog_authors.image_url,
      role: post.blog_authors.role,
    };
  }
  
  if (post.user_profiles) {
    const displayName = post.user_profiles.display_name || 
      `${post.user_profiles.first_name || ''} ${post.user_profiles.last_name || ''}`.trim();
    return {
      name: displayName || 'Anonymous',
      image: null,
      role: null,
    };
  }
  
  return {
    name: 'Anonymous',
    image: null,
    role: null,
  };
}

// Get unified post categories
function getPostCategories(post: UnifiedPost): Array<{ title: string; slug: string }> {
  if (isSanityPost(post)) {
    return post.categories?.map(cat => ({
      title: cat.title,
      slug: cat.slug.current,
    })) || [];
  }
  
  return post.blog_categories ? [{
    title: post.blog_categories.title,
    slug: post.blog_categories.slug,
  }] : [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const featured = searchParams.get('featured');
    const source = searchParams.get('source'); // 'sanity', 'supabase', or 'all' (default)

    let sanityPosts: SanityPost[] = [];
    let supabasePosts: SupabasePost[] = [];

    // Fetch from Sanity if not excluded
    if (!source || source === 'sanity' || source === 'all') {
      try {
        const sanityQuery = `
          *[_type == "post" && publishedAt <= now()]{
            _id,
            title,
            slug,
            excerpt,
            mainImage,
            publishedAt,
            readTime,
            featured,
            tags,
            categories[]->{
              title,
              slug
            },
            author->{
              name,
              image,
              role
            },
            body
          } | order(publishedAt desc)
        `;

        // Add category filter if specified
        const filteredQuery = category 
          ? sanityQuery.replace('_type == "post"', `_type == "post" && $category in categories[]->slug.current`)
          : sanityQuery;

        // Add tag filter if specified
        const finalQuery = tag
          ? filteredQuery.replace('publishedAt <= now()', 'publishedAt <= now() && $tag in tags')
          : filteredQuery;

        // Add featured filter if specified
        const featuredQuery = featured === 'true'
          ? finalQuery.replace('publishedAt <= now()', 'publishedAt <= now() && featured == true')
          : finalQuery;

        const params: any = {};
        if (category) params.category = category;
        if (tag) params.tag = tag;

        sanityPosts = await sanityClient.fetch(featuredQuery, params);
        sanityPosts = sanityPosts.map(transformSanityPost);
      } catch (error) {
        console.error('Error fetching from Sanity:', error);
        // Continue with Supabase if Sanity fails
      }
    }

    // Fetch from Supabase if not excluded
    if (!source || source === 'supabase' || source === 'all') {
      try {
        const supabase = await createServerClient(undefined);
        let query = supabase
          .from('blog_posts')
         .select(`
            *,
            blog_categories (
              title,
              slug
            ),
            blog_authors:blog_author_id (
              id,
              name,
              image_url,
              role
            )
          `)
          .eq('published', true);

        // Apply filters
        if (category) {
          query = query.eq('blog_categories.slug', category);
        }
        if (tag) {
          query = query.contains('tags', [tag]);
        }
        if (featured === 'true') {
          query = query.eq('featured', true);
        }

        const { data, error } = await query.order('published_at', { ascending: false });

        if (!error && data) {
          supabasePosts = data.map(transformSupabasePost);
        }
      } catch (error) {
        console.error('Error fetching from Supabase:', error);
        // Continue with Sanity if Supabase fails
      }
    }

    // Combine and sort posts
    let allPosts: UnifiedPost[] = [];

    if (source === 'sanity') {
      allPosts = sanityPosts;
    } else if (source === 'supabase') {
      allPosts = supabasePosts;
    } else {
      allPosts = [...sanityPosts, ...supabasePosts];
    }

    // Sort by published date (newest first)
    allPosts.sort((a, b) => {
      const dateA = new Date(getPostPublishedAt(a));
      const dateB = new Date(getPostPublishedAt(b));
      return dateB.getTime() - dateA.getTime();
    });

    // Transform to unified response format
    const unifiedPosts = allPosts.map(post => ({
      id: isSanityPost(post) ? post._id : post.id,
      title: getPostTitle(post),
      slug: getPostSlug(post),
      excerpt: getPostExcerpt(post),
      mainImage: getPostImage(post),
      mainImageAlt: isSanityPost(post) ? post.mainImage?.alt : post.main_image_alt,
      publishedAt: getPostPublishedAt(post),
      readTime: isSanityPost(post) ? post.readTime : post.read_time,
      featured: isSanityPost(post) ? post.featured : post.featured,
      tags: isSanityPost(post) ? post.tags : (post.tags || []),
      categories: getPostCategories(post),
      author: getPostAuthor(post),
      source: (post as any)._source,
      body: isSanityPost(post) ? post.body : null,
      content: isSupabasePost(post) ? post.content : null,
    }));

    return NextResponse.json(unifiedPosts);
  } catch (error) {
    console.error('Error in dual blog API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
