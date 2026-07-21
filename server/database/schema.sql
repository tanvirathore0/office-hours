CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  code_text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'plaintext',
  timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS misconceptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL,
  misconception_type TEXT NOT NULL,
  explanation TEXT NOT NULL,
  confidence REAL NOT NULL,
  FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  misconception_id INTEGER NOT NULL,
  exercise_code TEXT NOT NULL,
  instructions TEXT NOT NULL,
  FOREIGN KEY (misconception_id) REFERENCES misconceptions(id)
);
