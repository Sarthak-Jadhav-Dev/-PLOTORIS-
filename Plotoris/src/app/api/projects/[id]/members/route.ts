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

// ─── Helper: verify caller is Owner or Admin of the project ──────────────────
async function getCallerMembership(projectId: string, userId: string) {
  const { data } = await supabase
    .from('ProjectMembers')
    .select('id, role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .single();
  return data; // null if not a member
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/projects/[id]/members
// Returns all members + allowed_phases for the project.
// Accessible to any accepted member (they need to see the team list).
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;

  // Confirm caller has access to this project
  const callerMember = await getCallerMembership(projectId, user.id);
  if (!callerMember) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('ProjectMembers')
    .select('id, user_id, role, status, allowed_phases, Users!ProjectMembers_user_id_fkey(id, user_name, email)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const members = (data || []).map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    email: m.Users?.email || '',
    user_name: m.Users?.user_name || '',
    role: m.role,
    status: m.status,
    // allowed_phases: null/undefined means ALL (for Admin/Owner); array means restricted
    allowed_phases: m.allowed_phases ?? null,
  }));

  return NextResponse.json({ data: members });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/projects/[id]/members  — update a member's role and/or allowed_phases
// Body: { memberId: string, role?: "Admin"|"Member", allowed_phases?: string[]|null }
// Rules:
//   - Only Owner can promote someone to Admin or demote Admins
//   - Owner row itself cannot be modified
//   - A member cannot edit their own role
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;

  const callerMember = await getCallerMembership(projectId, user.id);
  if (!callerMember) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  // Only Owner and Admin can modify members
  if (callerMember.role !== 'Owner' && callerMember.role !== 'Admin') {
    return NextResponse.json({ message: 'Only Admins and Owners can manage permissions' }, { status: 403 });
  }

  const { memberId, role, allowed_phases } = await request.json();
  if (!memberId) return NextResponse.json({ message: 'memberId is required' }, { status: 400 });

  // Fetch the target member
  const { data: target, error: targetErr } = await supabase
    .from('ProjectMembers')
    .select('id, user_id, role, status')
    .eq('id', memberId)
    .eq('project_id', projectId)
    .single();

  if (targetErr || !target) return NextResponse.json({ message: 'Member not found' }, { status: 404 });

  // Guard: cannot modify Owner row at all
  if (target.role === 'Owner') {
    return NextResponse.json({ message: 'The project Owner cannot be modified' }, { status: 403 });
  }

  // Guard: a member/admin cannot edit their own role
  if (target.user_id === user.id) {
    return NextResponse.json({ message: 'You cannot modify your own role' }, { status: 403 });
  }

  // Guard: only Owner can promote/demote Admins
  if (role === 'Admin' || (target.role === 'Admin' && role === 'Member')) {
    if (callerMember.role !== 'Owner') {
      return NextResponse.json({ message: 'Only the Owner can promote or demote Admins' }, { status: 403 });
    }
  }

  // Build update payload
  const updatePayload: Record<string, any> = {};
  if (role !== undefined) updatePayload.role = role;
  if (allowed_phases !== undefined) {
    // Admins always get null (full access); Members get the provided array
    updatePayload.allowed_phases = (role === 'Admin' || (role === undefined && target.role === 'Admin'))
      ? null
      : allowed_phases;
  }

  const { error: updateErr } = await supabase
    .from('ProjectMembers')
    .update(updatePayload)
    .eq('id', memberId);

  if (updateErr) return NextResponse.json({ message: updateErr.message }, { status: 500 });

  return NextResponse.json({ message: 'Member updated successfully' });
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/projects/[id]/members  — remove a member from the project
// Body: { memberId: string }
// Rules:
//   - Cannot delete Owner
//   - Cannot delete yourself
//   - Only Owner can delete Admins
//   - Admins can delete regular Members
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id: projectId } = await params;

  const callerMember = await getCallerMembership(projectId, user.id);
  if (!callerMember) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  if (callerMember.role !== 'Owner' && callerMember.role !== 'Admin') {
    return NextResponse.json({ message: 'Only Admins and Owners can remove members' }, { status: 403 });
  }

  const { memberId } = await request.json();
  if (!memberId) return NextResponse.json({ message: 'memberId is required' }, { status: 400 });

  // Fetch the target member
  const { data: target, error: targetErr } = await supabase
    .from('ProjectMembers')
    .select('id, user_id, role')
    .eq('id', memberId)
    .eq('project_id', projectId)
    .single();

  if (targetErr || !target) return NextResponse.json({ message: 'Member not found' }, { status: 404 });

  // Guard: cannot remove the Owner
  if (target.role === 'Owner') {
    return NextResponse.json({ message: 'The project Owner cannot be removed' }, { status: 403 });
  }

  // Guard: cannot remove yourself
  if (target.user_id === user.id) {
    return NextResponse.json({ message: 'You cannot remove yourself from the project' }, { status: 403 });
  }

  // Guard: only Owner can remove Admins
  if (target.role === 'Admin' && callerMember.role !== 'Owner') {
    return NextResponse.json({ message: 'Only the Owner can remove Admins' }, { status: 403 });
  }

  const { error: deleteErr } = await supabase
    .from('ProjectMembers')
    .delete()
    .eq('id', memberId);

  if (deleteErr) return NextResponse.json({ message: deleteErr.message }, { status: 500 });

  return NextResponse.json({ message: 'Member removed successfully' });
}
