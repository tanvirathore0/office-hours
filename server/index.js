import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import db from './database/index.js';
import { detectMisconceptions } from './services/misconceptionDetector.js';
import { generateExercise } from './services/exerciseGenerator.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (_request, response) => {
  response.json({ message: 'Office Hours API is running.' });
});

app.post('/submit', async (request, response) => {
  const { student_id: studentId, code_text: codeText, language = 'plaintext' } = request.body;

  if (!Number.isInteger(studentId) || !codeText?.trim()) {
    return response.status(400).json({
      error: 'student_id (integer) and code_text (non-empty string) are required.'
    });
  }

  // Keep the scaffold easy to test: create a simple student record on first submission.
  db.prepare('INSERT OR IGNORE INTO students (id, name) VALUES (?, ?)').run(studentId, `Student ${studentId}`);
  const result = db.prepare(
    'INSERT INTO submissions (student_id, code_text, language) VALUES (?, ?, ?)'
  ).run(studentId, codeText.trim(), language);

  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(result.lastInsertRowid);

  // Pull past submissions (excluding this one) so the detector can look for patterns over time.
  const pastSubmissions = db.prepare(
    'SELECT code_text, timestamp FROM submissions WHERE student_id = ? AND id != ? ORDER BY timestamp DESC LIMIT 5'
  ).all(studentId, submission.id);

  // Run real misconception detection via GPT-5.6.
  const detected = await detectMisconceptions({
    currentCode: codeText.trim(),
    language,
    pastSubmissions
  });

  // Persist any detected misconceptions.
  const insertMisconception = db.prepare(
    'INSERT INTO misconceptions (submission_id, misconception_type, explanation, confidence) VALUES (?, ?, ?, ?)'
  );
  const savedMisconceptions = detected.map((m) => {
    const insertResult = insertMisconception.run(
      submission.id,
      m.misconception_type,
      m.explanation,
      m.confidence
    );
    return { id: insertResult.lastInsertRowid, ...m };
  });

  // Generate a personalized exercise for the highest-confidence misconception, if any.
  let generatedExercise = null;
  if (savedMisconceptions.length > 0) {
    const topMisconception = savedMisconceptions.reduce((a, b) => (a.confidence > b.confidence ? a : b));

    const exercise = await generateExercise({
      misconceptionType: topMisconception.misconception_type,
      explanation: topMisconception.explanation,
      studentCode: codeText.trim(),
      language
    });

    if (exercise) {
      const insertExercise = db.prepare(
        'INSERT INTO exercises (misconception_id, exercise_code, instructions) VALUES (?, ?, ?)'
      );
      const exerciseResult = insertExercise.run(
        topMisconception.id,
        exercise.exercise_code,
        exercise.instructions
      );
      generatedExercise = { id: exerciseResult.lastInsertRowid, misconception_id: topMisconception.id, ...exercise };
    }
  }

  return response.status(201).json({
    submission,
    diagnostic: {
      status: savedMisconceptions.length > 0 ? 'complete' : 'no_pattern_found',
      misconceptions: savedMisconceptions
    },
    exercise: generatedExercise
  });
});

app.get('/history/:student_id', (request, response) => {
  const studentId = Number(request.params.student_id);
  if (!Number.isInteger(studentId)) {
    return response.status(400).json({ error: 'student_id must be an integer.' });
  }

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  const submissions = db.prepare(`
    SELECT
      submissions.*,
      misconceptions.id AS misconception_id,
      misconceptions.misconception_type,
      misconceptions.explanation,
      misconceptions.confidence
    FROM submissions
    LEFT JOIN misconceptions ON misconceptions.submission_id = submissions.id
    WHERE submissions.student_id = ?
    ORDER BY submissions.timestamp DESC, submissions.id DESC
  `).all(studentId);

  const history = submissions.reduce((items, row) => {
    let submission = items.find((item) => item.id === row.id);
    if (!submission) {
      submission = {
        id: row.id,
        student_id: row.student_id,
        code_text: row.code_text,
        language: row.language,
        timestamp: row.timestamp,
        misconceptions: []
      };
      items.push(submission);
    }
    if (row.misconception_id) {
      submission.misconceptions.push({
        id: row.misconception_id,
        misconception_type: row.misconception_type,
        explanation: row.explanation,
        confidence: row.confidence
      });
    }
    return items;
  }, []);

  response.json({
    student: student ?? { id: studentId, name: `Student ${studentId}` },
    submissions: history
  });
});

// Additive class-wide view for teacher dashboards. It preserves the existing
// student history contract while exposing only aggregate learning signals.
app.get('/classroom', (_request, response) => {
  const students = db.prepare(`
    SELECT students.id, students.name, COUNT(submissions.id) AS submission_count
    FROM students
    LEFT JOIN submissions ON submissions.student_id = students.id
    GROUP BY students.id
    ORDER BY students.name COLLATE NOCASE
  `).all();
  const misconceptions = db.prepare(`
    SELECT misconceptions.misconception_type, COUNT(*) AS occurrences,
      COUNT(DISTINCT submissions.student_id) AS student_count,
      ROUND(AVG(misconceptions.confidence), 2) AS average_confidence
    FROM misconceptions
    JOIN submissions ON submissions.id = misconceptions.submission_id
    GROUP BY misconceptions.misconception_type
    ORDER BY occurrences DESC
  `).all();

  response.json({ students, misconceptions, student_count: students.length });
});

// Keep API failures machine-readable so the React client never receives
// Express's default HTML error document.
app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    error: 'The submission could not be stored. Please try again.'
  });
});

app.listen(port, () => {
  console.log(`Office Hours API listening on http://localhost:${port}`);
});