import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient(undefined);
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');

    let query = supabase
      .from('career_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (published !== null) {
      query = query.eq('published', published === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching career listings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in admin career GET:', error);
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

    // Check if slug already exists
    const { data: existingCareer } = await supabase
      .from('career_listings')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingCareer) {
      return NextResponse.json(
        { error: 'A career listing with this slug already exists' },
        { status: 409 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const careerData = {
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
      featured: featured || false,
      published: published || false,
      created_by: user?.id,
      updated_by: user?.id,
    };

    const { data, error } = await supabase
      .from('career_listings')
      .insert([careerData])
      .select()
      .single();

    if (error) {
      console.error('Error creating career listing:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in admin career POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
