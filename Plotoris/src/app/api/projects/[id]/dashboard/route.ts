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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  try {
    // 1. Fetch Project Details
    const { data: project, error: projectError } = await supabase
      .from('Projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // 2. Fetch Team Members
    const { data: members } = await supabase
      .from('ProjectMembers')
      .select('id, role, status, Users(user_name)')
      .eq('project_id', projectId);

    // 3. Fetch Tasks
    const { data: tasks } = await supabase
      .from('ProjectTasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // 4. Fetch Activity
    const { data: activity } = await supabase
      .from('ProjectActivity')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 5. Fetch Document Count (Papers Analyzed)
    const { count: docsCount } = await supabase
      .from('Documents')
      .select('id', { count: 'exact', head: true })
      .contains('metadata', { project_id: projectId });

    // Format Team Members
    const formattedTeam = (members || []).map(m => {
      const name = (m.Users as any)?.user_name || 'Unknown User';
      const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
      let statusColor = "text-[#888] bg-[#333] border-[#444]"; // Offline
      let displayStatus = "Offline";
      
      if (m.status === 'accepted') {
        statusColor = "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20";
        displayStatus = "Active";
      } else if (m.status === 'pending') {
        statusColor = "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20";
        displayStatus = "Pending";
      }

      return {
        id: m.id,
        init: initials,
        name: name,
        role: m.role,
        status: displayStatus as any,
        statusColor
      };
    });

    // Format Tasks
    let formattedTasks = (tasks || []).map(t => ({
      id: t.id,
      title: t.title,
      sub: t.sub || 'General Task',
      badge: t.badge || 'New',
      badgeColor: t.badge_color || 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      completed: t.completed
    }));

    // Format Activity
    let formattedActivity = (activity || []).map(a => {
      // Calculate time ago
      const diffMs = Date.now() - new Date(a.created_at).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHrs / 24);
      let timeStr = 'just now';
      if (diffDays > 0) timeStr = `${diffDays}d ago`;
      else if (diffHrs > 0) timeStr = `${diffHrs}h ago`;
      else if (diffMins > 0) timeStr = `${diffMins}m ago`;

      return {
        id: a.id,
        user: a.user_name,
        action: a.action,
        time: timeStr,
        color: a.color
      };
    });

    // ==========================================
    // FALLBACK DATA (For empty DB testing)
    // ==========================================
    if (formattedTasks.length === 0) {
      formattedTasks = [
        { id: "t1", title: "Upload your first research paper", sub: "Getting Started", badge: "Action Required", badgeColor: "text-orange-400 bg-orange-400/10 border-orange-400/20", completed: false }
      ];
    }
    if (formattedActivity.length === 0) {
      formattedActivity = [
        { id: "a1", user: "System", action: "initialized project workspace", time: "just now", color: "bg-[#10b981]" }
      ];
    }
    if (formattedTeam.length === 0) {
      // If no members in DB yet, inject the current user
      formattedTeam.push({
        id: "m_self",
        init: user.user_name ? user.user_name.substring(0, 2).toUpperCase() : "ME",
        name: user.user_name || "Me",
        role: "Lead Researcher",
        status: "Active",
        statusColor: "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20"
      });
    }

    // Construct the final Project object for the UI
    const dashboardData = {
      id: project.id,
      name: project.name,
      description: project.description || '',
      category: project.category || 'General',
      currentPhase: "Phase 1 of 9 · Initialization", // Hardcoded until Phase table exists
      dueDate: "TBD", // Not in schema yet
      resumeBanner: {
        title: "Welcome to your new project",
        description: "Start by uploading research papers to build your knowledge graph."
      },
      stats: {
        papersAnalyzed: { value: (docsCount || 0).toString(), sub: "+0 this week" },
        insights: { value: "0", sub: "0 generated" },
        teamMembers: { value: formattedTeam.length.toString(), sub: "Total members" },
        openIssues: { value: formattedTasks.filter(t => !t.completed).length.toString(), sub: "Needs attention" },
      },
      phases: [
        { name: "Problem definition", status: "in-progress", progressPercent: 20 },
        { name: "Literature review", status: "pending" },
        { name: "Hypothesis", status: "pending" },
      ],
      tasks: formattedTasks,
      activity: formattedActivity,
      team: formattedTeam,
    };

    return NextResponse.json({ data: dashboardData }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ message: 'Failed to fetch dashboard', error: err.message }, { status: 500 });
  }
}
