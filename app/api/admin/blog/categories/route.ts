import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(undefined);
    
    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in categories GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient(undefined);
    const body = await request.json();

    const { title, slug, description } = body;

    // Validation
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existingCategory } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('blog_categories')
      .insert({
        title,
        slug,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in categories POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
