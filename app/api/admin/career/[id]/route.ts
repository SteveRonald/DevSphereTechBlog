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
      .from('career_listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching career listing:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in admin career GET by ID:', error);
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
      company,
      location,
      job_type,
      salary_range,
      description,
      requirements,
      responsibilities,
      benefits,
      application_url,
      application_email,
      application_deadline,
      featured,
      published,
    } = body;

    // Validation
    if (!title || !slug || !company || !location || !job_type || !description || !requirements || !responsibilities) {
      return NextResponse.json(
        { error: 'Title, slug, company, location, job type, description, requirements, and responsibilities are required' },
        { status: 400 }
      );
    }

    // Check if slug conflicts with another career listing
    const { data: existingCareer } = await supabase
      .from('career_listings')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single();

    if (existingCareer) {
      return NextResponse.json(
        { error: 'Another career listing with this slug already exists' },
        { status: 409 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const updateData = {
      title,
      slug,
      company,
      location,
      job_type,
      salary_range,
      description,
      requirements,
      responsibilities,
      benefits,
      application_url,
      application_email,
      application_deadline,
      featured,
      published,
      updated_by: user?.id,
    };

    const { data, error } = await supabase
      .from('career_listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating career listing:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in admin career PUT:', error);
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
      .from('career_listings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting career listing:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin career DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
