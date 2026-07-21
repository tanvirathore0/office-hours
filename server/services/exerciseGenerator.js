// server/services/exerciseGenerator.js

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Generates a tiny personalized practice exercise targeting a specific 
 * detected misconception, using the student's own code style.
 * 
 * @param {Object} params
 * @param {string} params.misconceptionType - e.g. "boundary_reasoning"
 * @param {string} params.explanation - the explanation of the misconception
 * @param {string} params.studentCode - the student's original code (for style/naming reference)
 * @param {string} params.language - programming language
 * @returns {Promise<Object|null>} { exercise_code, instructions } or null on failure
 */
async function generateExercise({ misconceptionType, explanation, studentCode, language }) {
  const systemPrompt = `You are a programming education exercise generator. Given a student's detected misconception and their own code style, create ONE tiny, focused practice exercise that isolates and targets that exact misconception.

Rules:
- Use variable names, function naming style, and formatting similar to the student's own code, so the exercise feels personal, not generic.
- Keep the exercise SMALL - a single function or short snippet, not a whole program.
- The exercise should have a deliberate gap, bug, or task the student must complete/fix that directly relates to the misconception - don't just explain the concept, make them practice it.
- Instructions should be 2-4 sentences, clear and encouraging, written directly to the student.

Respond ONLY with valid JSON, no markdown formatting, no extra text. Use this exact structure:

{
  "exercise_code": "the starter code for the exercise, as a string, using \\n for line breaks",
  "instructions": "clear instructions for what the student needs to do"
}`;

  const userPrompt = `Language: ${language}

Detected misconception: ${misconceptionType}
Explanation: ${explanation}

Student's own code (for style reference):
${studentCode}

Generate a tiny personalized exercise targeting this misconception, styled like the student's own code.`;

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
      console.error("OpenAI API error (exercise generation):", response.status, errText);
      return null;
    }

    const data = await response.json();
    const rawText = data.choices[0].message.content;
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return {
      exercise_code: parsed.exercise_code,
      instructions: parsed.instructions
    };
  } catch (err) {
    console.error("Exercise generation failed:", err);
    return null;
  }
}

export { generateExercise };