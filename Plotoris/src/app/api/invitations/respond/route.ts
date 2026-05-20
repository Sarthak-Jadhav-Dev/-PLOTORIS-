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

export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { member_id, action, notification_id } = await request.json();

    if (!member_id || !action) {
      return NextResponse.json({ message: 'Missing member_id or action' }, { status: 400 });
    }

    if (action !== 'accept' && action !== 'decline') {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    // Update the ProjectMembers record
    const { error: memberError } = await supabase
      .from('ProjectMembers')
      .update({
        status: action === 'accept' ? 'accepted' : 'declined',
        responded_at: new Date().toISOString()
      })
      .eq('id', member_id)
      .eq('user_id', user.id); // Ensure the user actually owns this invitation

    if (memberError) {
      return NextResponse.json({ message: 'Failed to update invitation status', error: memberError.message }, { status: 500 });
    }

    // Mark the notification as read if provided
    if (notification_id) {
      await supabase
        .from('Notifications')
        .update({ is_read: true })
        .eq('id', notification_id)
        .eq('user_id', user.id);
    }

    return NextResponse.json({ message: `Invitation ${action}ed successfully` }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: 'Server error', error: err.message }, { status: 500 });
  }
}
