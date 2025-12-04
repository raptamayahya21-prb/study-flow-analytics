import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, BarChart3, FileDown, Loader2 } from "lucide-react";
import StudySessionForm from "@/components/StudySessionForm";
import StudyStats from "@/components/StudyStats";
import StudyChart from "@/components/StudyChart";
import AIRecommendations from "@/components/AIRecommendations";
import { toast } from "sonner";
import { generateStudyPDF } from "@/lib/pdfExport";

interface StudySession {
  id: string;
  duration_minutes: number;
  duration_hours: number;
  mood_score: number;
  focus_score: number;
  efficiency_score: number;
  notes: string | null;
  created_at: string;
  week_start: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState("");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      setSessions(data || []);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      toast.error("Gagal memuat sesi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleNewSession = async (data: {
    durationMinutes: number;
    moodScore: number;
    focusScore: number;
    efficiencyScore: number;
    notes: string;
  }) => {
    if (!user) return;

    // Get week start using our SQL function
    const today = new Date().toISOString().split("T")[0];
    const { data: weekData } = await supabase.rpc("get_week_start", {
      input_date: today,
    });

    const { error } = await supabase.from("study_sessions").insert({
      user_id: user.id,
      duration_minutes: data.durationMinutes,
      mood_score: data.moodScore,
      focus_score: data.focusScore,
      efficiency_score: data.efficiencyScore,
      notes: data.notes || null,
      week_start: weekData || today,
    });

    if (error) throw error;

    await fetchSessions();
  };

  const handleExportPDF = async () => {
    if (sessions.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    setIsExporting(true);
    try {
      const fileName = await generateStudyPDF(
        sessions,
        chartRef.current,
        aiRecommendations
      );
      toast.success(`PDF berhasil diunduh: ${fileName}`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Gagal mengekspor PDF");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Analisis Belajar</h1>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPDF}
                disabled={isExporting || sessions.length === 0}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                Ekspor PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <StudySessionForm onSubmit={handleNewSession} />
          </div>

          <div className="lg:col-span-2 space-y-8">
            <StudyStats sessions={sessions} />
            <div ref={chartRef}>
              <StudyChart sessions={sessions} />
            </div>
            <AIRecommendations 
              sessions={sessions} 
              onRecommendationsChange={setAiRecommendations}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
