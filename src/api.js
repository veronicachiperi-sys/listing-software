const API_URL = "https://api.anthropic.com/v1/messages";

export async function analyzeReviews(reviews, apiKey) {
  const batchSize = 10;
  const results = [];

  for (let i = 0; i < reviews.length; i += batchSize) {
    const batch = reviews.slice(i, i + batchSize);

    const prompt = `Analyze these short-term rental guest reviews. For each review, return a JSON array with objects containing:
- id: the review id I provide
- sentiment: "positive", "neutral", or "negative"
- score: sentiment score 1-5 (5=very positive)
- topics: array of topics mentioned (e.g. "cleanliness", "location", "noise", "check-in", "communication", "amenities", "accuracy", "value", "wifi", "parking", "kitchen", "bathroom", "bed comfort", "decor", "view", "pool", "heating/cooling")
- upsides: array of specific things praised
- downsides: array of specific things complained about
- removal_candidate: boolean, true if the review violates typical OTA policies (mentions other guests by name, is about weather/external factors beyond host control, contains discriminatory language, guest admits rule violations)
- removal_reason: string explaining why if removal_candidate is true, null otherwise
- response_suggestion: a brief professional host response (2-3 sentences)

Reviews:
${batch.map((r) => `[ID: ${r.id}] Rating: ${r.rating}/5 | OTA: ${r.ota} | Property: ${r.property} | "${r.text}"`).join("\n\n")}

Return ONLY the JSON array, no other text, no markdown fences.`;

    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`API returned ${resp.status}: ${errText}`);
      }

      const data = await resp.json();
      const text = data.content
        ?.map((c) => c.text || "")
        .join("")
        .replace(/```json|```/g, "")
        .trim();

      const parsed = JSON.parse(text);
      results.push(...parsed);
    } catch (e) {
      console.error("AI analysis error for batch:", e);
      // Return fallback entries so the UI doesn't break
      batch.forEach((r) =>
        results.push({
          id: r.id,
          sentiment: "neutral",
          score: 3,
          topics: [],
          upsides: [],
          downsides: [],
          removal_candidate: false,
          removal_reason: null,
          response_suggestion: "",
          error: true,
          errorMessage: e.message,
        })
      );
    }
  }

  return results;
}
