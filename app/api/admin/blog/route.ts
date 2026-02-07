import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(undefined);
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    const category = searchParams.get('category');

    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        blog_categories (
          title,
          slug
        ),
        blog_authors:author_id (
          id,
          name,
          image_url,
          role
        ),
        user_profiles:author_id (
          display_name,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (published !== null) {
      query = query.eq('published', published === 'true');
    }
    if (category) {
      query = query.eq('blog_categories.slug', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching admin blog posts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform posts to include source info
    const transformedPosts = (data || []).map((post: any) => ({
      ...post,
      _source: 'supabase',
    }));

    return NextResponse.json(transformedPosts);
  } catch (error) {
    console.error('Error in admin blog GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient(undefined);
    const body = await request.json();

    const {
      title,
      slug,
      excerpt,
      content,
      content_type = 'markdown',
      main_image_url,
      main_image_alt,
      author_id,
      category_id,
      featured = false,
      published = false,
      read_time,
      meta_title,
      meta_description,
      tags = [],
    } = body;

    // Validation
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }

    // Auto-generate excerpt if not provided
    const finalExcerpt = excerpt || content.substring(0, 200) + '...';

    // Calculate read time if not provided
    const finalReadTime = read_time || Math.max(1, Math.ceil(content.split(' ').length / 200));

    // Set published_at if publishing
    const publishedAt = published ? new Date().toISOString() : null;

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        excerpt: finalExcerpt,
        content,
        content_type,
        main_image_url,
        main_image_alt,
        author_id,
        category_id: category_id || null,
        blog_author_id: author_id || null,
        featured,
        published,
        published_at: publishedAt,
        read_time: finalReadTime,
        meta_title,
        meta_description,
        tags,
        created_by: author_id,
        updated_by: author_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add source info
    const transformedPost = {
      ...data,
      _source: 'supabase',
    };

    return NextResponse.json(transformedPost, { status: 201 });
  } catch (error) {
    console.error('Error in admin blog POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
