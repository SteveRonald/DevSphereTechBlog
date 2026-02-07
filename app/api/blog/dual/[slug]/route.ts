import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { sanityClient } from '@/lib/sanity';

// Types (reusing from parent route)
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

// Helper functions (reusing from parent route)
function isSanityPost(post: UnifiedPost): post is SanityPost {
  return (post as any)._source === 'sanity';
}

function isSupabasePost(post: UnifiedPost): post is SupabasePost {
  return (post as any)._source === 'supabase';
}

function transformSanityPost(post: any): SanityPost {
  return {
    ...post,
    _source: 'sanity' as const,
  };
}

function transformSupabasePost(post: any): SupabasePost {
  return {
    ...post,
    _source: 'supabase' as const,
  };
}

function getPostTitle(post: UnifiedPost): string {
  return isSanityPost(post) ? post.title : post.title;
}

function getPostSlug(post: UnifiedPost): string {
  return isSanityPost(post) ? post.slug.current : post.slug;
}

function getPostExcerpt(post: UnifiedPost): string {
  return isSanityPost(post) ? post.excerpt : (post.excerpt || '');
}

function getPostImage(post: UnifiedPost): string | null {
  if (isSanityPost(post)) {
    return post.mainImage ? 
      `https://cdn.sanity.io/images/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET}/${post.mainImage.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp')}` 
      : null;
  }
  return post.main_image_url;
}

function getPostPublishedAt(post: UnifiedPost): string {
  return isSanityPost(post) ? post.publishedAt : (post.published_at || post.created_at);
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source'); // 'sanity', 'supabase', or 'all' (default)

    let sanityPost: SanityPost | null = null;
    let supabasePost: SupabasePost | null = null;

    // Try Sanity first if not excluded
    if (!source || source === 'sanity' || source === 'all') {
      try {
        const sanityQuery = `
          *[_type == "post" && slug.current == $slug && publishedAt <= now()][0]{
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
          }
        `;

        const post = await sanityClient.fetch(sanityQuery, { slug });
        if (post) {
          sanityPost = transformSanityPost(post);
        }
      } catch (error) {
        console.error('Error fetching from Sanity:', error);
      }
    }

    // Try Supabase if not excluded and Sanity didn't find it
    if ((!sanityPost || source === 'supabase' || source === 'all') && (!source || source !== 'sanity')) {
      try {
        const supabase = await createServerClient(undefined);
        const { data, error } = await supabase
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
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (!error && data) {
          supabasePost = transformSupabasePost(data);
        }
      } catch (error) {
        console.error('Error fetching from Supabase:', error);
      }
    }

    // Determine which post to return
    let finalPost: UnifiedPost | null = null;

    if (source === 'sanity') {
      finalPost = sanityPost;
    } else if (source === 'supabase') {
      finalPost = supabasePost;
    } else {
      // Prefer Sanity if both exist, otherwise return whichever exists
      finalPost = sanityPost || supabasePost;
    }

    if (!finalPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Transform to unified response format
    const unifiedPost = {
      id: isSanityPost(finalPost) ? finalPost._id : finalPost.id,
      title: getPostTitle(finalPost),
      slug: getPostSlug(finalPost),
      excerpt: getPostExcerpt(finalPost),
      mainImage: getPostImage(finalPost),
      mainImageAlt: isSanityPost(finalPost) ? finalPost.mainImage?.alt : finalPost.main_image_alt,
      publishedAt: getPostPublishedAt(finalPost),
      readTime: isSanityPost(finalPost) ? finalPost.readTime : finalPost.read_time,
      featured: isSanityPost(finalPost) ? finalPost.featured : finalPost.featured,
      tags: isSanityPost(finalPost) ? finalPost.tags : (finalPost.tags || []),
      categories: getPostCategories(finalPost),
      author: getPostAuthor(finalPost),
      source: (finalPost as any)._source,
      body: isSanityPost(finalPost) ? finalPost.body : null,
      content: isSupabasePost(finalPost) ? finalPost.content : null,
      createdAt: isSupabasePost(finalPost) ? finalPost.created_at : null,
      updatedAt: isSupabasePost(finalPost) ? finalPost.updated_at : null,
    };

    return NextResponse.json(unifiedPost);
  } catch (error) {
    console.error('Error in dual blog slug API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}
