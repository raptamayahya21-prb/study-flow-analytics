import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudySession {
  duration_hours: number;
  efficiency_score: number;
  mood_score: number;
  focus_score: number;
  created_at: string;
}

interface AIRecommendationsProps {
  sessions: StudySession[];
}

const AIRecommendations = ({ sessions }: AIRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchRecommendations = async () => {
    if (sessions.length < 3) {
      toast.error("Need at least 3 study sessions for AI recommendations");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("study-recommendations", {
        body: { sessions },
      });

      if (error) throw error;

      setRecommendations(data.recommendations);
      toast.success("AI recommendations generated!");
    } catch (error: any) {
      console.error("Error fetching recommendations:", error);
      toast.error(error.message || "Failed to generate recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          AI Study Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!recommendations ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Get personalized study recommendations based on your patterns
            </p>
            <Button
              onClick={fetchRecommendations}
              disabled={isLoading || sessions.length < 3}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Recommendations
                </>
              )}
            </Button>
            {sessions.length < 3 && (
              <p className="text-xs text-muted-foreground mt-2">
                Need at least 3 sessions
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {recommendations}
              </div>
            </div>
            <Button
              variant="outline"
              onClick={fetchRecommendations}
              disabled={isLoading}
              className="w-full"
            >
              Refresh Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRecommendations;
