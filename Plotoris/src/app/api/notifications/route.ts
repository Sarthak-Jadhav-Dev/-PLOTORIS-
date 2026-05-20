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

// POST /api/notifications — create a new notification for a specific user (by email)
export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { email, type, title, message, metadata } = await request.json();

    // Find the receiver user by email
    const { data: receiver, error: userError } = await supabase
      .from('Users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !receiver) {
      return NextResponse.json({ message: 'User with this email not found' }, { status: 404 });
    }

    let memberId = null;

    // If it's an invitation, insert a pending ProjectMembers record first
    if (type === 'invitation' && metadata?.projectId) {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from('ProjectMembers')
        .select('id')
        .eq('project_id', metadata.projectId)
        .eq('user_id', receiver.id)
        .single();

      if (existingMember) {
        return NextResponse.json({ message: 'User is already a member of this project' }, { status: 400 });
      }

      const { data: newMember, error: memberError } = await supabase
        .from('ProjectMembers')
        .insert({
          project_id: metadata.projectId,
          user_id: receiver.id,
          role: metadata.role || 'Contributor',
          status: 'pending',
          invited_by: user.id
        })
        .select('id')
        .single();

      if (memberError) throw memberError;
      memberId = newMember.id;
    }

    // Insert notification
    const { error: insertError } = await supabase
      .from('Notifications')
      .insert({
        user_id: receiver.id,
        type: type || 'invitation',
        title,
        message,
        metadata: {
          ...metadata,
          member_id: memberId
        }
      });

    if (insertError) throw insertError;

    return NextResponse.json({ message: 'Notification sent' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: 'Failed to send notification', error: err.message }, { status: 500 });
  }
}
