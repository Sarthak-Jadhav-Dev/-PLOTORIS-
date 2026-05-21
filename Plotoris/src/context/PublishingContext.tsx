"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ResearchPaper, PaperStatus, ActivityLog } from '@/types/research';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

type PapersByStatus = Record<PaperStatus, ResearchPaper[]>;

interface PublishingContextProps {
  papersByStatus: PapersByStatus;
  activityLogs: ActivityLog[];
  movePaper: (paperId: string, toStatus: PaperStatus) => Promise<void>;
  createPaper: (title: string) => Promise<void>;
  deletePaper: (paperId: string) => Promise<void>;
  isLoading: boolean;
}

const PublishingContext = createContext<PublishingContextProps | undefined>(undefined);

export const PublishingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [papersByStatus, setPapersByStatus] = useState<PapersByStatus>({
    Drafting: [],
    'Pre-print': [],
    Submitted: [],
    'Under Review': [],
    Accepted: [],
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch papers
  const fetchPapers = async () => {
    const { data, error } = await supabase.from('research_papers').select('*');
    if (error) {
      console.error("Error fetching papers:", error.message || error);
    } else {
      const grouped: PapersByStatus = {
        Drafting: [],
        'Pre-print': [],
        Submitted: [],
        'Under Review': [],
        Accepted: [],
      };
      data?.forEach(p => {
        const status = p.status as PaperStatus;
        if (grouped[status]) {
          grouped[status].push(p as ResearchPaper);
        }
      });
      setPapersByStatus(grouped);
    }
  };

  // Helper to fetch logs
  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (error) {
      console.error("Error fetching activity logs:", error.message || error);
    } else {
      setActivityLogs(data as ActivityLog[]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPapers(), fetchLogs()]);
      setIsLoading(false);
    };

    loadData();

    // Listen to changes on papers
    const papersSub = supabase
      .channel('public:research_papers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'research_papers' }, () => {
        fetchPapers();
      })
      .subscribe();

    // Listen to changes on activity_logs
    const logsSub = supabase
      .channel('public:activity_logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setActivityLogs(prev => [payload.new as ActivityLog, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(papersSub);
      supabase.removeChannel(logsSub);
    };
  }, []);

  const createPaper = async (title: string) => {
    // 1. Insert Paper
    const { data: paperData, error: paperError } = await supabase
      .from('research_papers')
      .insert({ title, status: 'Drafting' })
      .select()
      .single();

    if (paperError || !paperData) {
      console.error("Error creating paper:", paperError?.message || paperError);
      toast.error("Failed to create paper: " + (paperError?.message || "Unknown error"));
      return;
    }

    // 2. Insert Log — store title in user_name field prefix since paper_title col may not exist
    await supabase.from('activity_logs').insert({
      paper_id: paperData.id,
      action: `CREATED::${title}`,
      user_name: 'You'
    });

    toast.success("Paper created successfully!");
  };

  const movePaper = async (paperId: string, toStatus: PaperStatus) => {
    let movingPaper: ResearchPaper | undefined;
    let fromStatus: PaperStatus | undefined;

    // Optimistic UI Update
    setPapersByStatus(prev => {
      const newState = { ...prev } as PapersByStatus;

      (Object.keys(newState) as PaperStatus[]).forEach(status => {
        const idx = newState[status].findIndex(p => p.id === paperId);
        if (idx !== -1) {
          movingPaper = newState[status][idx];
          fromStatus = status;
          newState[status] = newState[status].filter(p => p.id !== paperId);
        }
      });

      if (movingPaper && fromStatus !== toStatus) {
        movingPaper.status = toStatus;
        movingPaper.updated_at = new Date().toISOString();
        newState[toStatus] = [movingPaper, ...newState[toStatus]];
      }
      
      return newState;
    });

    if (!movingPaper || fromStatus === toStatus) return;

    // Database Update
    const { error } = await supabase
      .from('research_papers')
      .update({ status: toStatus, updated_at: new Date().toISOString() })
      .eq('id', paperId);

    if (error) {
      console.error("Supabase update error:", error);
      toast.error('Failed to update paper status');
      fetchPapers(); // Rollback
    } else {
      // Insert Activity Log — embed title in action string
      await supabase.from('activity_logs').insert({
        paper_id: paperId,
        action: `MOVED::${movingPaper.title}`,
        from_status: fromStatus,
        to_status: toStatus,
        user_name: 'You'
      });
      toast.success('Paper moved successfully');
    }
  };

  const deletePaper = async (paperId: string) => {
    // Optimistic remove from UI
    setPapersByStatus(prev => {
      const newState = { ...prev } as PapersByStatus;
      (Object.keys(newState) as PaperStatus[]).forEach(status => {
        newState[status] = newState[status].filter(p => p.id !== paperId);
      });
      return newState;
    });

    const { error } = await supabase.from('research_papers').delete().eq('id', paperId);
    if (error) {
      console.error('Error deleting paper:', error.message || error);
      toast.error('Failed to delete paper');
      fetchPapers(); // rollback
    } else {
      toast.success('Paper deleted');
    }
  };

  return (
    <PublishingContext.Provider value={{ papersByStatus, activityLogs, movePaper, createPaper, deletePaper, isLoading }}>
      {children}
    </PublishingContext.Provider>
  );
};

export const usePublishing = () => {
  const ctx = useContext(PublishingContext);
  if (!ctx) throw new Error('usePublishing must be used within PublishingProvider');
  return ctx;
};
