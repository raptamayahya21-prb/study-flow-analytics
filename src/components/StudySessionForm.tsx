import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { createReal, clampReal } from "@/lib/realNumberMath";
import { toast } from "sonner";

interface StudySessionFormProps {
  onSubmit: (data: {
    durationMinutes: number;
    moodScore: number;
    focusScore: number;
    efficiencyScore: number;
    notes: string;
  }) => Promise<void>;
}

const StudySessionForm = ({ onSubmit }: StudySessionFormProps) => {
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [moodScore, setMoodScore] = useState([5]);
  const [focusScore, setFocusScore] = useState([5]);
  const [efficiencyScore, setEfficiencyScore] = useState([0.5]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate duration as real number
      const durationReal = createReal(parseFloat(durationMinutes));
      if (!durationReal.isValid) {
        toast.error(durationReal.errorMessage || "Durasi tidak valid");
        setIsSubmitting(false);
        return;
      }

      // Clamp values to valid ranges using real number operations
      const validMood = clampReal(moodScore[0], 0, 10);
      const validFocus = clampReal(focusScore[0], 0, 10);
      const validEfficiency = clampReal(efficiencyScore[0], 0, 1);

      await onSubmit({
        durationMinutes: durationReal.value,
        moodScore: validMood,
        focusScore: validFocus,
        efficiencyScore: validEfficiency,
        notes,
      });

      // Reset form
      setDurationMinutes("");
      setMoodScore([5]);
      setFocusScore([5]);
      setEfficiencyScore([0.5]);
      setNotes("");

      toast.success("Sesi belajar berhasil dicatat!");
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan sesi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Catat Sesi Belajar</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="duration">Durasi (menit) *</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              step="1"
              placeholder="60"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Akan dikonversi ke jam menggunakan pembagian bilangan real
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Skor Mood</Label>
              <span className="text-sm font-medium">{moodScore[0].toFixed(1)}</span>
            </div>
            <Slider
              value={moodScore}
              onValueChange={setMoodScore}
              min={0}
              max={10}
              step={0.1}
              className="w-full"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">0 (sedih) hingga 10 (senang)</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Skor Fokus</Label>
              <span className="text-sm font-medium">{focusScore[0].toFixed(1)}</span>
            </div>
            <Slider
              value={focusScore}
              onValueChange={setFocusScore}
              min={0}
              max={10}
              step={0.1}
              className="w-full"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">0 (terganggu) hingga 10 (sangat fokus)</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Skor Efisiensi</Label>
              <span className="text-sm font-medium">{efficiencyScore[0].toFixed(2)}</span>
            </div>
            <Slider
              value={efficiencyScore}
              onValueChange={setEfficiencyScore}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">0.00 (tidak efisien) hingga 1.00 (optimal)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Apa yang Anda pelajari? Wawasan apa yang didapat?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Sesi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StudySessionForm;
