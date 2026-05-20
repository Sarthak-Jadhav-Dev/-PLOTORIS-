import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

function getUserFromRequest(request: Request) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'fallback_secret') as any;
  } catch { return null; }
}

// GET /api/projects — list projects where user is owner or member
export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    // Get projects user owns
    const { data: ownedProjects, error: ownedErr } = await supabase
      .from('Projects')
      .select('*, ProjectMembers(user_id, role, Users!ProjectMembers_user_id_fkey(id, user_name, email))')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false });

    if (ownedErr) throw ownedErr;

    // Get projects user is a member of (accepted)
    const { data: memberProjects, error: memberErr } = await supabase
      .from('ProjectMembers')
      .select('role, Projects(*, ProjectMembers(user_id, role, Users!ProjectMembers_user_id_fkey(id, user_name, email)))')
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .neq('Projects.owner_id', user.id);

    if (memberErr) throw memberErr;

    const memberProjectsList = memberProjects
      ?.map((m: any) => m.Projects)
      .filter(Boolean) ?? [];

    const allProjects = [...(ownedProjects ?? []), ...memberProjectsList];

    return NextResponse.json({ data: allProjects }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/projects error:', err);
    return NextResponse.json({ message: 'Failed to fetch projects', error: err.message }, { status: 500 });
  }
}

// POST /api/projects — create a new project
export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { name, description, category, color } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ message: 'Project name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('Projects')
      .insert([{
        name: name.trim(),
        description: description?.trim() ?? '',
        category: category ?? 'General',
        color: color ?? '#FF6B00',
        owner_id: user.id,
      }])
      .select()
      .single();

    if (error) throw error;

    // Add owner as a member with 'Owner' role
    await supabase.from('ProjectMembers').insert([{
      project_id: data.id,
      user_id: user.id,
      role: 'Owner',
      status: 'accepted',
    }]);

    return NextResponse.json({ message: 'Project created', data }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/projects error:', err);
    return NextResponse.json({ message: 'Failed to create project', error: err.message }, { status: 500 });
  }
}
