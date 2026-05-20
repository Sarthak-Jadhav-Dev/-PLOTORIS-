import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/users/search?q=query — search users by name or email
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] }, { status: 200 });
  }

  try {
    const { data, error } = await supabase
      .from('Users')
      .select('id, user_name, email')
      .or(`user_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10);

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: 'Search failed', error: err.message }, { status: 500 });
  }
}
