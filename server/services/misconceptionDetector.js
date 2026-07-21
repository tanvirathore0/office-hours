// server/services/misconceptionDetector.js

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Analyzes a student's current code submission alongside their past 
 * submissions to detect recurring underlying misconceptions.
 * 
 * @param {Object} params
 * @param {string} params.currentCode - the code just submitted
 * @param {string} params.language - programming language
 * @param {Array} params.pastSubmissions - array of { code_text, timestamp } from earlier submissions
 * @returns {Promise<Array>} array of detected misconceptions matching your DB schema
 */
async function detectMisconceptions({ currentCode, language, pastSubmissions = [] }) {
  const pastCodeSummary = pastSubmissions.length > 0
    ? pastSubmissions
        .map((sub, i) => `Submission ${i + 1} (${sub.timestamp}):\n${sub.code_text}`)
        .join("\n\n---\n\n")
    : "No past submissions yet.";

  const systemPrompt = `You are a programming education diagnostic engine. Your job is NOT to review code for bugs. Your job is to identify underlying CONCEPTUAL MISCONCEPTIONS that explain a pattern of mistakes across multiple code submissions from the same student.

A misconception is a root misunderstanding (e.g. "boundary reasoning" - confusion about start/end limits in loops, arrays, or ranges) that can show up as different-looking surface bugs across different pieces of code.

Only report a misconception if there is real evidence of a PATTERN - either within the current code alone (if it shows the same conceptual issue in multiple places) or across the current code and past submissions. Do not invent misconceptions that aren't supported by the code.

Respond ONLY with valid JSON, no markdown formatting, no explanation outside the JSON. Use this exact structure:

{
  "misconceptions": [
    {
      "misconception_type": "short label, e.g. 'boundary_reasoning'",
      "explanation": "2-3 sentence plain-English explanation of the misconception and what evidence supports it, referencing specific parts of the code",
      "confidence": 0.0 to 1.0
    }
  ]
}

If no clear misconception pattern is found, return { "misconceptions": [] }.`;

  const userPrompt = `Language: ${language}

Current submission:
${currentCode}

Past submissions from this student:
${pastCodeSummary}

Analyze this student's code history and identify any underlying misconceptions.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-5.6-terra",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", response.status, errText);
      throw new Error(`OpenAI API returned status ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content;

    // Strip any accidental markdown code fences before parsing
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return parsed.misconceptions || [];
  } catch (err) {
    console.error("Misconception detection failed:", err);
    return []; // fail gracefully - don't crash the submission flow
  }
}

export { detectMisconceptions };