import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Clock, Trash2, Pencil, ArrowUpDown, Filter } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

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

type SortOption = "date-desc" | "date-asc" | "efficiency-desc" | "efficiency-asc" | "duration-desc" | "duration-asc";
type FilterOption = "all" | "high-efficiency" | "low-efficiency" | "long-duration" | "short-duration";

const sortLabels: Record<SortOption, string> = {
  "date-desc": "Terbaru",
  "date-asc": "Terlama",
  "efficiency-desc": "Efisiensi Tertinggi",
  "efficiency-asc": "Efisiensi Terendah",
  "duration-desc": "Durasi Terlama",
  "duration-asc": "Durasi Tersingkat",
};

const filterLabels: Record<FilterOption, string> = {
  "all": "Semua Sesi",
  "high-efficiency": "Efisiensi ≥ 70%",
  "low-efficiency": "Efisiensi < 70%",
  "long-duration": "Durasi ≥ 1 jam",
  "short-duration": "Durasi < 1 jam",
};

const WeeklyHistory = ({ sessions, onSessionDeleted }: WeeklyHistoryProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit form state
  const [editDuration, setEditDuration] = useState(0);
  const [editMood, setEditMood] = useState(5);
  const [editFocus, setEditFocus] = useState(5);
  const [editEfficiency, setEditEfficiency] = useState(0.5);
  const [editNotes, setEditNotes] = useState("");

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

  const handleEditClick = (session: StudySession) => {
    setEditingSession(session);
    setEditDuration(session.duration_minutes);
    setEditMood(session.mood_score);
    setEditFocus(session.focus_score);
    setEditEfficiency(session.efficiency_score);
    setEditNotes(session.notes || "");
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSession) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("study_sessions")
        .update({
          duration_minutes: editDuration,
          mood_score: editMood,
          focus_score: editFocus,
          efficiency_score: editEfficiency,
          notes: editNotes || null,
        })
        .eq("id", editingSession.id);

      if (error) throw error;

      toast.success("Sesi belajar berhasil diperbarui");
      setIsEditDialogOpen(false);
      setEditingSession(null);
      onSessionDeleted?.(); // Reuse callback to refresh data
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Gagal memperbarui sesi belajar");
    } finally {
      setIsSaving(false);
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

  // Filter sessions for current week
  const weekSessions = sessions.filter((session) => {
    const sessionDate = parseISO(session.created_at);
    return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
  });

  // Apply filter
  const filteredSessions = weekSessions.filter((session) => {
    switch (filterBy) {
      case "high-efficiency":
        return session.efficiency_score >= 0.7;
      case "low-efficiency":
        return session.efficiency_score < 0.7;
      case "long-duration":
        return session.duration_hours >= 1;
      case "short-duration":
        return session.duration_hours < 1;
      default:
        return true;
    }
  });

  // Apply sort
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "date-asc":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "efficiency-desc":
        return b.efficiency_score - a.efficiency_score;
      case "efficiency-asc":
        return a.efficiency_score - b.efficiency_score;
      case "duration-desc":
        return b.duration_hours - a.duration_hours;
      case "duration-asc":
        return a.duration_hours - b.duration_hours;
      default:
        return 0;
    }
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
    <>
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

          {/* Session Details with Filter & Sort */}
          {weekSessions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">Detail Sesi</h4>
                <div className="flex items-center gap-1">
                  {/* Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        <Filter className="w-3 h-3 mr-1" />
                        {filterBy !== "all" && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">1</Badge>}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-popover border z-50">
                      <DropdownMenuLabel className="text-xs">Filter</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(Object.keys(filterLabels) as FilterOption[]).map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() => setFilterBy(option)}
                          className={filterBy === option ? "bg-accent" : ""}
                        >
                          {filterLabels[option]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Sort Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        <ArrowUpDown className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">{sortLabels[sortBy]}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-popover border z-50">
                      <DropdownMenuLabel className="text-xs">Urutkan</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() => setSortBy(option)}
                          className={sortBy === option ? "bg-accent" : ""}
                        >
                          {sortLabels[option]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Active filter indicator */}
              {filterBy !== "all" && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {filterLabels[filterBy]}
                    <button
                      onClick={() => setFilterBy("all")}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {sortedSessions.length} dari {weekSessions.length} sesi
                  </span>
                </div>
              )}

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {sortedSessions.length > 0 ? (
                  sortedSessions.map((session) => (
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
                      <div className="flex items-center gap-1">
                        <Badge variant={session.efficiency_score >= 0.7 ? "default" : "secondary"}>
                          {(session.efficiency_score * 100).toFixed(0)}%
                        </Badge>
                        
                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                          onClick={() => handleEditClick(session)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>

                        {/* Delete Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingId === session.id}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
                  ))
                ) : (
                  <p className="text-xs text-center text-muted-foreground py-4">
                    Tidak ada sesi yang cocok dengan filter
                  </p>
                )}
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Sesi Belajar</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                {format(parseISO(editingSession.created_at), "EEEE, d MMMM yyyy - HH:mm", { locale: id })}
              </p>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Durasi (menit)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min={1}
                  max={480}
                  value={editDuration}
                  onChange={(e) => setEditDuration(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              {/* Mood Score */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Mood</Label>
                  <span className="text-sm text-muted-foreground">{editMood.toFixed(1)}/10</span>
                </div>
                <Slider
                  value={[editMood]}
                  onValueChange={([v]) => setEditMood(v)}
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>

              {/* Focus Score */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Fokus</Label>
                  <span className="text-sm text-muted-foreground">{editFocus.toFixed(1)}/10</span>
                </div>
                <Slider
                  value={[editFocus]}
                  onValueChange={([v]) => setEditFocus(v)}
                  min={1}
                  max={10}
                  step={0.5}
                />
              </div>

              {/* Efficiency Score */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Efisiensi</Label>
                  <span className="text-sm text-muted-foreground">{(editEfficiency * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[editEfficiency * 100]}
                  onValueChange={([v]) => setEditEfficiency(v / 100)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Catatan</Label>
                <Textarea
                  id="edit-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Catatan opsional..."
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WeeklyHistory;
