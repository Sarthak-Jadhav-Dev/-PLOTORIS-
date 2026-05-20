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

// GET /api/notifications — get notifications for logged in user
export async function GET(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { data, error } = await supabase
      .from('Notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: 'Failed to fetch notifications', error: err.message }, { status: 500 });
  }
}

// PATCH /api/notifications — mark notification(s) as read
export async function PATCH(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { ids } = await request.json(); // array of notification IDs or empty for all

    let query = supabase
      .from('Notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);

    if (ids?.length) {
      query = query.in('id', ids);
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ message: 'Marked as read' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: 'Failed to update notifications', error: err.message }, { status: 500 });
  }
}
