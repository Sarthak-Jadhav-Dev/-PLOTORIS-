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

// GET /api/projects/[id]/stats — get statistics for a project
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const projectId = params.id;

  try {
    // Verify user has access to this project (owner or member)
    const { data: project, error: projectError } = await supabase
      .from('Projects')
      .select('id, owner_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Check if user is owner or accepted member
    const { data: memberCheck } = await supabase
      .from('ProjectMembers')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .single();

    if (project.owner_id !== user.id && !memberCheck) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Calculate stats
    const [
      { count: teamMembersCount },
      { count: papersAnalyzedCount },
      { count: insightsCount },
      { count: openIssuesCount }
    ] = await Promise.all([
      // Team members: count accepted members
      supabase
        .from('ProjectMembers')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'accepted'),
      
      // Papers analyzed: count papers in project
      supabase
        .from('Papers')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId),
      
      // Insights: count insights in project
      supabase
        .from('Insights')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId),
      
      // Open issues: count tasks that are not completed
      supabase
        .from('Tasks')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('completed', false)
    ]);

    // Calculate sub-texts
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { count: recentPapers } = await supabase
      .from('Papers')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .gte('created_at', oneWeekAgo);

    const { count: unreviewedInsights } = await supabase
      .from('Insights')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('is_reviewed', false);

    const { count: highPriorityTasks } = await supabase
      .from('Tasks')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('completed', false)
      .eq('priority', 'high');

    const stats = {
      papersAnalyzed: {
        value: papersAnalyzedCount || 0,
        sub: recentPapers && recentPapers > 0 ? `+${recentPapers} this week` : 'No recent uploads'
      },
      insights: {
        value: insightsCount || 0,
        sub: unreviewedInsights && unreviewedInsights > 0 ? `${unreviewedInsights} need review` : 'All reviewed'
      },
      teamMembers: {
        value: teamMembersCount || 0,
        sub: `${teamMembersCount || 0} members`
      },
      openIssues: {
        value: openIssuesCount || 0,
        sub: highPriorityTasks && highPriorityTasks > 0 ? `${highPriorityTasks} high priority` : 'All clear'
      }
    };

    return NextResponse.json({ data: stats }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/projects/[id]/stats error:', err);
    return NextResponse.json({ message: 'Failed to fetch stats', error: err.message }, { status: 500 });
  }
}
