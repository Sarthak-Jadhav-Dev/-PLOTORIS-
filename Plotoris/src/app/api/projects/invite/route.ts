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

// POST /api/projects/invite — invite a user to a project
export async function POST(request: Request) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { project_id, invitee_email, role } = await request.json();

    if (!project_id || !invitee_email || !role) {
      return NextResponse.json({ message: 'project_id, invitee_email, and role are required' }, { status: 400 });
    }

    // Verify the requester is the project owner
    const { data: project, error: projErr } = await supabase
      .from('Projects')
      .select('id, owner_id, name')
      .eq('id', project_id)
      .single();

    if (projErr || !project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }
    if (project.owner_id !== user.id) {
      return NextResponse.json({ message: 'Only the project owner can send invitations' }, { status: 403 });
    }

    // Find the invitee user
    const { data: invitee, error: inviteeErr } = await supabase
      .from('Users')
      .select('id, user_name, email')
      .eq('email', invitee_email)
      .single();

    if (inviteeErr || !invitee) {
      return NextResponse.json({ message: 'User with that email not found' }, { status: 404 });
    }

    if (invitee.id === user.id) {
      return NextResponse.json({ message: 'Cannot invite yourself' }, { status: 400 });
    }

    // Check if already invited/member
    const { data: existing } = await supabase
      .from('ProjectMembers')
      .select('id, status')
      .eq('project_id', project_id)
      .eq('user_id', invitee.id)
      .single();

    if (existing) {
      return NextResponse.json({
        message: existing.status === 'accepted' ? 'User is already a member' : 'Invitation already sent',
      }, { status: 409 });
    }

    // Create invitation (pending)
    const { data: member, error: memberErr } = await supabase
      .from('ProjectMembers')
      .insert([{
        project_id,
        user_id: invitee.id,
        role,
        status: 'pending',
        invited_by: user.id,
      }])
      .select()
      .single();

    if (memberErr) throw memberErr;

    // Create notification for invitee
    await supabase.from('Notifications').insert([{
      user_id: invitee.id,
      type: 'invitation',
      title: `Project Invitation: ${project.name}`,
      message: `${user.name} invited you to join "${project.name}" as ${role}`,
      metadata: {
        project_id,
        project_name: project.name,
        member_id: member.id,
        role,
        inviter_name: user.name,
      },
      is_read: false,
    }]);

    return NextResponse.json({ message: 'Invitation sent successfully' }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/projects/invite error:', err);
    return NextResponse.json({ message: 'Failed to send invitation', error: err.message }, { status: 500 });
  }
}
