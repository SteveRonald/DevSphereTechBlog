import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, requireAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');

    let query = supabase
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
      .order('created_at', { ascending: false });

    if (published !== null) {
      query = query.eq('published', published === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedReviews = (data || []).map((review: any) => ({
      ...review,
      _source: 'supabase',
    }));

    return NextResponse.json(transformedReviews);
  } catch (error) {
    console.error('Error in admin reviews GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status });
    }

    const supabase = createAdminClient();
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

    // Check if slug already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'A review with this slug already exists' },
        { status: 409 }
      );
    }

    // Use the admin user from the gate check
    const user = gate.user;

    // Auto-generate excerpt if not provided
    const finalExcerpt = excerpt || content.substring(0, 200) + '...';

    // Calculate read time if not provided
    const finalReadTime = read_time || Math.max(1, Math.ceil(content.split(' ').length / 200));

    const reviewData: any = {
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
      featured: featured || false,
      published: published || false,
      read_time: finalReadTime,
      meta_title: meta_title || title,
      meta_description: meta_description || finalExcerpt,
      tags,
      created_by: user?.id,
      updated_by: user?.id,
    };

    if (published) {
      reviewData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
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
      console.error('Error creating review:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformedReview = {
      ...data,
      _source: 'supabase',
    };

    return NextResponse.json(transformedReview, { status: 201 });
  } catch (error) {
    console.error('Error in admin reviews POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
