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

// POST /api/invitations/respond — accept or decline invitation
export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { member_id, action, notification_id } = await request.json();
    // action: 'accept' | 'decline'

    if (!member_id || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ message: 'member_id and action (accept|decline) are required' }, { status: 400 });
    }

    // Verify the membership belongs to this user
    const { data: member, error: memberErr } = await supabase
      .from('ProjectMembers')
      .select('*, Projects(name)')
      .eq('id', member_id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ message: 'Invitation not found or already responded' }, { status: 404 });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    const { error: updateErr } = await supabase
      .from('ProjectMembers')
      .update({ status: newStatus, responded_at: new Date().toISOString() })
      .eq('id', member_id);

    if (updateErr) throw updateErr;

    // Mark the notification as read
    if (notification_id) {
      await supabase
        .from('Notifications')
        .update({ is_read: true })
        .eq('id', notification_id);
    }

    return NextResponse.json({
      message: action === 'accept'
        ? `You have joined the project as ${member.role}`
        : 'Invitation declined',
    }, { status: 200 });
  } catch (err: any) {
    console.error('POST /api/invitations/respond error:', err);
    return NextResponse.json({ message: 'Failed to respond to invitation', error: err.message }, { status: 500 });
  }
}
