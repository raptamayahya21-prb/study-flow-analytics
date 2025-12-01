// Supabase Edge Function - AI Study Recommendations

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StudySession {
  duration_hours: number;
  efficiency_score: number;
  mood_score: number;
  focus_score: number;
  created_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessions } = await req.json() as { sessions: StudySession[] };

    if (!sessions || sessions.length < 3) {
      return new Response(
        JSON.stringify({ error: "Need at least 3 sessions for recommendations" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate statistics using real number operations
    const durations = sessions.map(s => s.duration_hours);
    const efficiencies = sessions.map(s => s.efficiency_score);
    const moods = sessions.map(s => s.mood_score);
    const focuses = sessions.map(s => s.focus_score);

    // Real number arithmetic mean
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const avgEfficiency = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
    const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
    const avgFocus = focuses.reduce((a, b) => a + b, 0) / focuses.length;

    // Find supremum and infimum (max and min)
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    // Prepare prompt for AI
    const systemPrompt = `You are a study analytics expert that provides personalized recommendations based on real mathematical analysis.

Your recommendations should:
- Be specific and actionable
- Reference the actual data patterns
- Suggest optimal study durations based on their patterns
- Identify their peak performance times
- Recommend improvements for focus and efficiency
- Keep recommendations concise (3-5 points)`;

    const userPrompt = `Analyze these study patterns and provide recommendations:

Study Statistics (Real Number Analysis):
- Total Sessions: ${sessions.length}
- Average Duration: ${avgDuration.toFixed(2)} hours (μ = Σxi/n)
- Duration Range: [${minDuration.toFixed(2)}h, ${maxDuration.toFixed(2)}h] (infimum to supremum)
- Average Efficiency: ${(avgEfficiency * 100).toFixed(1)}% (normalized to [0,1])
- Average Mood Score: ${avgMood.toFixed(1)}/10
- Average Focus Score: ${avgFocus.toFixed(1)}/10

Recent Sessions (last 5):
${sessions.slice(-5).map((s, i) => `
Session ${i + 1}:
- Duration: ${s.duration_hours.toFixed(2)}h
- Efficiency: ${(s.efficiency_score * 100).toFixed(1)}%
- Mood: ${s.mood_score.toFixed(1)}/10
- Focus: ${s.focus_score.toFixed(1)}/10
`).join('\n')}

Provide 3-5 specific, actionable recommendations to improve their study effectiveness.`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error("AI Gateway request failed");
    }

    const aiData = await aiResponse.json();
    const recommendations = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in study-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
