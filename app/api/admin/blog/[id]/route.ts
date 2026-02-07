import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient(undefined);
    const { id } = await params;

    const { data, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching admin blog post:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    // Add source info
    const transformedPost = {
      ...data,
      _source: 'supabase',
    };

    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error('Error in admin blog GET by ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient(undefined);
    const { id } = await params;
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
      featured,
      published,
      read_time,
      meta_title,
      meta_description,
      tags,
    } = body;

    // Validation
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Check if slug conflicts with another post
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single();

    if (existingPost) {
      return NextResponse.json(
        { error: 'Another post with this slug already exists' },
        { status: 409 }
      );
    }

    // Get current post to check if publishing status changed
    const { data: currentPost } = await supabase
      .from('blog_posts')
      .select('published, published_at')
      .eq('id', id)
      .single();

    // Auto-generate excerpt if not provided
    const finalExcerpt = excerpt || content.substring(0, 200) + '...';

    // Calculate read time if not provided
    const finalReadTime = read_time || Math.max(1, Math.ceil(content.split(' ').length / 200));

    // Set published_at if publishing for the first time
    let publishedAt = currentPost?.published_at;
    if (published && !currentPost?.published) {
      publishedAt = new Date().toISOString();
    }

    const updateData: any = {
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
      read_time: finalReadTime,
      meta_title,
      meta_description,
      tags,
      updated_by: author_id,
    };

    if (publishedAt) {
      updateData.published_at = publishedAt;
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
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
      .single();

    if (error) {
      console.error('Error updating blog post:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add source info
    const transformedPost = {
      ...data,
      _source: 'supabase',
    };

    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error('Error in admin blog PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient(undefined);
    const { id } = await params;

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog post:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin blog DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
