import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  calculateMean, 
  findSupremum, 
  findInfimum, 
  simpleIntegration,
  calculateZScore,
  calculateStdDev
} from "@/lib/realNumberMath";

interface StudySession {
  duration_hours: number;
  efficiency_score: number;
  mood_score: number;
  focus_score: number;
}

interface StudyStatsProps {
  sessions: StudySession[];
}

const StudyStats = ({ sessions }: StudyStatsProps) => {
  if (sessions.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No data yet. Record your first study session!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Extract arrays for calculations
  const durations = sessions.map(s => s.duration_hours);
  const efficiencies = sessions.map(s => s.efficiency_score);
  
  // Real number calculations
  const avgDuration = calculateMean(durations);
  const supDuration = findSupremum(durations);
  const infDuration = findInfimum(durations);
  const totalHours = simpleIntegration(durations, 1);
  const avgEfficiency = calculateMean(efficiencies);
  
  // Z-score for latest session
  const stdDev = calculateStdDev(durations);
  const latestZScore = sessions.length > 0 
    ? calculateZScore(durations[durations.length - 1], avgDuration, stdDev)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
          <Badge variant="outline">Σ</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{totalHours.toFixed(2)}h</div>
          <p className="text-xs text-muted-foreground mt-1">
            Integration: Σ(hours × 1)
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
          <Badge variant="outline">μ</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{avgDuration.toFixed(2)}h</div>
          <p className="text-xs text-muted-foreground mt-1">
            Mean: Σ(xi) / n = {avgDuration.toFixed(4)}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Supremum (Max)</CardTitle>
          <Badge variant="outline">sup</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">{supDuration.toFixed(2)}h</div>
          <p className="text-xs text-muted-foreground mt-1">
            Least upper bound
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Infimum (Min)</CardTitle>
          <Badge variant="outline">inf</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">{infDuration.toFixed(2)}h</div>
          <p className="text-xs text-muted-foreground mt-1">
            Greatest lower bound
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Efficiency</CardTitle>
          <Badge variant="outline">μ(ε)</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {(avgEfficiency * 100).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Normalized to [0, 1]
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Latest Z-Score</CardTitle>
          <Badge variant="outline">z</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{latestZScore.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            (x - μ) / σ
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyStats;
