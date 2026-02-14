import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, requireAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const supabase = createAdminClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('reviews')
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
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching review:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const transformedReview = {
      ...data,
      _source: 'supabase',
    };

    return NextResponse.json(transformedReview);
  } catch (error) {
    console.error('Error in admin review GET by ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const supabase = createAdminClient();
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
      product_name,
      product_url,
      rating,
      pros,
      cons,
      featured,
      published,
      read_time,
      meta_title,
      meta_description,
      tags,
    } = body;

    // Validation
    if (!title || !slug || !content || !product_name) {
      return NextResponse.json(
        { error: 'Title, slug, content, and product name are required' },
        { status: 400 }
      );
    }

    // Check if slug conflicts with another review
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'Another review with this slug already exists' },
        { status: 409 }
      );
    }

    // Get current review to check if publishing status changed
    const { data: currentReview } = await supabase
      .from('reviews')
      .select('published, published_at')
      .eq('id', id)
      .single();

    // Use the admin user from the gate check
    const user = gate.user;

    // Auto-generate excerpt if not provided
    const finalExcerpt = excerpt || content.substring(0, 200) + '...';

    // Calculate read time if not provided
    const finalReadTime = read_time || Math.max(1, Math.ceil(content.split(' ').length / 200));

    // Set published_at if publishing for the first time
    let publishedAt = currentReview?.published_at;
    if (published && !currentReview?.published) {
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
      category_id,
      product_name,
      product_url,
      rating,
      pros,
      cons,
      featured,
      published,
      read_time: finalReadTime,
      meta_title: meta_title || title,
      meta_description: meta_description || finalExcerpt,
      tags,
      updated_by: user?.id,
    };

    if (publishedAt) {
      updateData.published_at = publishedAt;
    }

    const { data, error } = await supabase
      .from('reviews')
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
        )
      `)
      .single();

    if (error) {
      console.error('Error updating review:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedReview = {
      ...data,
      _source: 'supabase',
    };

    return NextResponse.json(transformedReview);
  } catch (error) {
    console.error('Error in admin review PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const supabase = createAdminClient();
    const { id } = await params;

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin review DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
