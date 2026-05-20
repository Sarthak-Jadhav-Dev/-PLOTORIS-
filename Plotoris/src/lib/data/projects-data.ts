export interface ProjectTask {
  id: string;
  title: string;
  sub: string;
  badge: string;
  badgeColor: string;
  completed: boolean;
}

export interface ProjectActivity {
  id: string;
  user: string;
  action: string;
  time: string;
  color: string;
}

export interface ProjectTeamMember {
  id: string;
  init: string;
  name: string;
  role: string;
  status: "Active" | "Away" | "Offline";
  statusColor: string;
}

export interface ProjectStats {
  papersAnalyzed: { value: string; sub: string };
  insights: { value: string; sub: string };
  teamMembers: { value: string; sub: string };
  openIssues: { value: string; sub: string };
}

export interface PhaseProgress {
  name: string;
  status: "done" | "in-progress" | "pending";
  progressPercent?: number; // For in-progress
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  currentPhase: string;
  dueDate: string;
  resumeBanner: {
    title: string;
    description: string;
  };
  stats: ProjectStats;
  phases: PhaseProgress[];
  tasks: ProjectTask[];
  activity: ProjectActivity[];
  team: ProjectTeamMember[];
  apiKey?: string; // e.g. for settings
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "AI in Education Meta-Analysis",
    description: "A comprehensive review of AI applications in K-12 education.",
    category: "Meta-Analysis",
    currentPhase: "Phase 2 of 8 · Literature review in progress",
    dueDate: "Due Dec 2025",
    resumeBanner: {
      title: "Resume where you left off",
      description: "You were reviewing Smith et al. 2023. Next suggested: compare methodology with Jones 2022. Hypothesis draft is pending your input."
    },
    stats: {
      papersAnalyzed: { value: "14", sub: "+3 this week" },
      insights: { value: "7", sub: "2 need review" },
      teamMembers: { value: "4", sub: "2 active now" },
      openIssues: { value: "2", sub: "1 blocking" },
    },
    phases: [
      { name: "Problem definition", status: "done" },
      { name: "Literature review", status: "in-progress", progressPercent: 55 },
      { name: "Hypothesis", status: "pending" },
      { name: "Research design", status: "pending" },
      { name: "Data collection", status: "pending" },
    ],
    tasks: [
      { id: "t1", title: "Annotate Jones 2022 methodology section", sub: "Literature review · assigned to you", badge: "Overdue", badgeColor: "text-red-500 bg-red-500/10 border-red-500/20", completed: false },
      { id: "t2", title: "Compare gap analysis with team", sub: "Literature review · with Priya", badge: "Today", badgeColor: "text-orange-400 bg-orange-400/10 border-orange-400/20", completed: false },
      { id: "t3", title: "Draft null hypothesis v1", sub: "Hypothesis · unlocks next phase", badge: "Upcoming", badgeColor: "text-blue-400 bg-blue-400/10 border-blue-400/20", completed: false },
      { id: "t4", title: "Add 3 more papers on neural plasticity", sub: "Literature review · AI suggested", badge: "Backlog", badgeColor: "text-gray-400 bg-gray-500/10 border-gray-500/20", completed: false },
    ],
    activity: [
      { id: "a1", user: "Priya", action: "annotated Chen 2021 — 3 insights added", time: "2h ago", color: "bg-[#10b981]" },
      { id: "a2", user: "You", action: "uploaded Smith et al. 2023", time: "5h ago", color: "bg-[#f59e0b]" },
      { id: "a3", user: "Rahul", action: "commented on Hypothesis draft 1", time: "Yesterday", color: "bg-[#9333ea]" },
      { id: "a4", user: "AI", action: "detected gap between Smith 2023 and Jones 2022", time: "Yesterday", color: "bg-[#3b82f6]" },
    ],
    team: [
      { id: "m1", init: "SJ", name: "Sarthak Jadhav", role: "Lead researcher · you", status: "Active", statusColor: "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20" },
      { id: "m2", init: "PM", name: "Priya Mehta", role: "Contributor", status: "Active", statusColor: "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20" },
      { id: "m3", init: "RK", name: "Rahul Kulkarni", role: "Reviewer", status: "Away", statusColor: "text-[#888] bg-[#333] border-[#444]" },
    ]
  },
  {
    id: "p2",
    name: "Climate Change & Urban Migration",
    description: "Modeling population shifts due to coastal flooding.",
    category: "Quantitative",
    currentPhase: "Phase 4 of 8 · Research design finalized",
    dueDate: "Due Jan 2026",
    resumeBanner: {
      title: "Data Collection Phase unlocked",
      description: "You have completed the research design. Start uploading datasets or connecting to the survey module."
    },
    stats: {
      papersAnalyzed: { value: "32", sub: "+0 this week" },
      insights: { value: "19", sub: "All reviewed" },
      teamMembers: { value: "2", sub: "1 active now" },
      openIssues: { value: "0", sub: "All clear" },
    },
    phases: [
      { name: "Problem definition", status: "done" },
      { name: "Literature review", status: "done" },
      { name: "Hypothesis", status: "done" },
      { name: "Research design", status: "done" },
      { name: "Data collection", status: "in-progress", progressPercent: 10 },
    ],
    tasks: [
      { id: "t5", title: "Import Census Data 2020", sub: "Data Collection · assigned to you", badge: "Today", badgeColor: "text-orange-400 bg-orange-400/10 border-orange-400/20", completed: false },
      { id: "t6", title: "Review Ethics Board submission", sub: "Research Design · waiting on approval", badge: "Blocked", badgeColor: "text-red-500 bg-red-500/10 border-red-500/20", completed: false },
    ],
    activity: [
      { id: "a5", user: "You", action: "finalized Research Design", time: "1 day ago", color: "bg-[#10b981]" },
      { id: "a6", user: "AI", action: "suggested 2 public datasets for migration tracking", time: "1 day ago", color: "bg-[#3b82f6]" },
    ],
    team: [
      { id: "m1", init: "SJ", name: "Sarthak Jadhav", role: "Lead researcher · you", status: "Active", statusColor: "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20" },
      { id: "m4", init: "JL", name: "Jessica Lee", role: "Data Scientist", status: "Offline", statusColor: "text-[#888] bg-[#333] border-[#444]" },
    ]
  }
];
