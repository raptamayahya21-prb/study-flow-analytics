import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

interface StudySession {
  created_at: string;
  duration_hours: number;
  efficiency_score: number;
}

interface StudyChartProps {
  sessions: StudySession[];
}

const StudyChart = ({ sessions }: StudyChartProps) => {
  if (sessions.length === 0) {
    return null;
  }

  const chartData = sessions.map((session) => ({
    date: format(new Date(session.created_at), "MMM dd"),
    hours: parseFloat(session.duration_hours.toFixed(2)),
    efficiency: parseFloat((session.efficiency_score * 100).toFixed(1)),
  }));

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Progress Belajar</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--foreground))" 
              fontSize={12}
            />
            <YAxis 
              yAxisId="left"
              stroke="hsl(var(--primary))" 
              fontSize={12}
              label={{ value: 'Jam', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--accent))" 
              fontSize={12}
              label={{ value: 'Efisiensi %', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="hours" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              name="Durasi (jam)"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="efficiency" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--accent))', r: 4 }}
              name="Efisiensi (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default StudyChart;
