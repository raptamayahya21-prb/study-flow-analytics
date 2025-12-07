import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Clock, Trash2 } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { calculateMean, findSupremum, findInfimum, simpleIntegration } from "@/lib/realNumberMath";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

interface WeeklyHistoryProps {
  sessions: StudySession[];
  onSessionDeleted?: () => void;
}

const WeeklyHistory = ({ sessions, onSessionDeleted }: WeeklyHistoryProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingId(sessionId);
    try {
      const { error } = await supabase
        .from("study_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Sesi belajar berhasil dihapus");
      onSessionDeleted?.();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Gagal menghapus sesi belajar");
    } finally {
      setDeletingId(null);
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  // Filter sessions for current week
  const weekSessions = sessions.filter((session) => {
    const sessionDate = parseISO(session.created_at);
    return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
  });

  // Calculate weekly stats
  const durations = weekSessions.map((s) => s.duration_hours);
  const efficiencies = weekSessions.map((s) => s.efficiency_score);
  
  const weekStats = {
    totalSessions: weekSessions.length,
    totalHours: durations.length > 0 ? simpleIntegration(durations, 1) : 0,
    avgDuration: durations.length > 0 ? calculateMean(durations) : 0,
    avgEfficiency: efficiencies.length > 0 ? calculateMean(efficiencies) : 0,
    supDuration: durations.length > 0 ? findSupremum(durations) : 0,
    infDuration: durations.length > 0 ? findInfimum(durations) : 0,
  };

  const goToPreviousWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToNextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const goToCurrentWeek = () => setCurrentWeek(new Date());

  // Group sessions by day
  const sessionsByDay: Record<string, StudySession[]> = {};
  weekSessions.forEach((session) => {
    const day = format(parseISO(session.created_at), "EEEE", { locale: id });
    if (!sessionsByDay[day]) sessionsByDay[day] = [];
    sessionsByDay[day].push(session);
  });

  const daysOfWeek = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            History Mingguan
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrentWeek} className="text-xs px-2">
              Hari Ini
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(weekStart, "d MMM", { locale: id })} - {format(weekEnd, "d MMM yyyy", { locale: id })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weekly Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Sesi</p>
            <p className="text-xl font-bold text-primary">{weekStats.totalSessions}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Jam</p>
            <p className="text-xl font-bold text-primary">{weekStats.totalHours.toFixed(1)}j</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Rata-rata</p>
            <p className="text-xl font-bold text-accent">{weekStats.avgDuration.toFixed(1)}j</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Efisiensi</p>
            <p className="text-xl font-bold text-accent">{(weekStats.avgEfficiency * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Daily Sessions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Aktivitas per Hari</h4>
          <div className="space-y-1">
            {daysOfWeek.map((day) => {
              const daySessions = sessionsByDay[day] || [];
              const dayTotal = daySessions.reduce((acc, s) => acc + s.duration_hours, 0);
              
              return (
                <div
                  key={day}
                  className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                    daySessions.length > 0 ? "bg-primary/5 hover:bg-primary/10" : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium w-16 ${daySessions.length > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                      {day.slice(0, 3)}
                    </span>
                    {daySessions.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {daySessions.length} sesi
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {daySessions.length > 0 ? (
                      <>
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{dayTotal.toFixed(1)}j</span>
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min((dayTotal / 4) * 100, 100)}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Session Details */}
        {weekSessions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Detail Sesi</h4>
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {weekSessions
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-2 bg-card border rounded-md text-sm group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {format(parseISO(session.created_at), "EEEE, d MMM", { locale: id })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(session.created_at), "HH:mm")} • {session.duration_hours.toFixed(1)} jam
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.efficiency_score >= 0.7 ? "default" : "secondary"}>
                        {(session.efficiency_score * 100).toFixed(0)}%
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deletingId === session.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Sesi Belajar?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sesi belajar pada {format(parseISO(session.created_at), "EEEE, d MMMM yyyy", { locale: id })} akan dihapus permanen.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteSession(session.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {weekSessions.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada sesi belajar minggu ini</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyHistory;
