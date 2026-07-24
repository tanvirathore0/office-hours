# Office Hours: An AI Learning Diagnostic Engine

**Built for OpenAI Build Week: Build with Codex and ChatGPT 5.6**
**Track: Education**

## What is this?

Office Hours is not a coding tutor. It doesn't answer questions or write code for students. Instead, it watches how a student codes over time, across multiple submissions, and identifies the underlying conceptual misconception causing a pattern of surface-level mistakes, even when those mistakes look completely unrelated on the surface. 

For example: a student who writes an off-by-one loop bug in one file, and an incorrect array indexing bug in a different file, isn't making two unrelated mistakes; they likely share one underlying misunderstanding, like boundary reasoning (difficulty identifying correct start/end limits). Office Hours detects that pattern using real evidence pulled from the student's own code, then generates a tiny, personalized practice exercise written in the student's own coding style, targeting the root cause rather than the symptom. 

Think of it as an MRI for programming education, rather than a tutor. Codex built the entire application: the React frontend, Express backend, database schema, and the full "diagnostic scan" UI, through natural language prompts. GPT-5.6, accessed live via the OpenAI API, powers the actual reasoning: analyzing a student's submission history to find genuine conceptual patterns (not just isolated bugs), and generating each personalized exercise from scratch. 

Project built by Tanvi Rathore, a high school coding instructor who teaches Python and Scratch programming and works as a code coach at theCoderSchool, and is also currently conducting research on fMRI-CLIP brain-AI alignment. This project was inspired directly by watching students make the same conceptual mistakes repeatedly, in different disguises, without realizing they were the same gap.


## How it works

1. **Submit code** — a student pastes a code snippet along with their student ID that is used to recognize the student, and the language of code they submitted
2. **Pattern detection** — the system analyzes the current submission *alongside the student's past submissions*, looking for a recurring conceptual pattern (not just isolated bugs)
3. **Diagnosis** — if a pattern is found, it's returned with a plain English explanation, a confidence score, and specific evidence pulled from the student's own code
4. **Personalized exercise generation** — a tiny practice exercise is generated, styled after the student's own code, targeting exactly the misconception found
5. **Dashboard** — students see their diagnostic map, submission history, and confidence trend over time. A separate Teacher View aggregates misconceptions across a whole class

## Tech stack

- **Frontend:** React + Vite, Framer Motion for animation, Recharts for data visualization
- **Backend:** Node.js + Express
- **Database:** SQLite
- **AI:** OpenAI API (GPT-5.6) for both misconception detection and exercise generation

## How Codex and GPT-5.6 were used

**Codex** built the entire application from scratch through natural-language prompts, including:
- The full project scaffold (React + Vite frontend, Express + SQLite backend, database schema)
- The complete UI — including the "diagnostic scan" visual theme, animated components, the interactive dashboard, submission flow, and teacher view
- Debugging and fixing issues throughout development (module import errors, API wiring issues, state bugs)

**GPT-5.6**, accessed via the OpenAI API at runtime, powers the actual "intelligence" of the product:
- **Misconception detection:** GPT-5.6 is prompted with a student's current code submission plus their recent submission history, and asked to identify a genuine underlying conceptual misconception — with specific evidence — rather than a superficial bug list. It returns structured JSON matching the app's data model.
- **Exercise generation:** GPT-5.6 is separately prompted with the detected misconception and the student's own code style, and generates a small, targeted practice exercise mimicking the student's naming conventions and formatting.

### Key decisions
- I scoped detection to require *evidence of a pattern* (not a single isolated bug) — this was a specific instruction in the GPT-5.6 prompt design, since the whole premise of the product depends on distinguishing one-off mistakes from real conceptual gaps.
- I chose to keep the exercise generator as a *separate* GPT-5.6 call from the detector, rather than one combined call, so each prompt could stay focused and produce more reliable structured output.
- Codex session used for the majority of core functionality: `019f7edf-dab1-7c20-91cd-3afccec74abd` (my codex ID)

## Setup instructions

### Prerequisites
- Node.js (v18+)
- An OpenAI API key with billing enabled for this project ([platform.openai.com](https://platform.openai.com))

### Installation

1. Clone the repository:
 git clone https://github.com/tanvirathore0/office-hours.git
cd office-hours

3. Install dependencies:
npm install --prefix server
npm install --prefix client
npm install

5. Set up your environment variables. Create a file at `server/.env`:
OPENAI_API_KEY=your_openai_api_key_here (template!)

7. Run the app: npm run dev
5. Open `http://localhost:5173` in your browser. The SQLite database is created automatically on first run.

### Sample data / testing the app

Try submitting this Python code as a first attempt (Student ID: `1`):
```python
def get_last_item(items):
    return items[len(items)]

def get_last_char(word):
    return word[len(word)]
```

This should trigger a **boundary reasoning** misconception detection, since both functions incorrectly index at `len()` instead of `len() - 1`. After detection, click "Open focused practice" to see a personalized exercise generated from this pattern.

To see the pattern strengthen across submissions, submit 2-3 similar snippets with the same student ID over time, then view the Dashboard to see the confidence trend.

## Project structure
office-hours/
├── client/ # React + Vite frontend
│ └── src/
│ ├── App.jsx # Main app, all pages/components
│ └── components/ # 3D brain hero visual, etc.
├── server/ # Express backend
│ ├── index.js # API routes
│ ├── database/ # SQLite schema + connection
│ └── services/
│ ├── misconceptionDetector.js # GPT-5.6 pattern detection
│ └── exerciseGenerator.js # GPT-5.6 exercise generation


## About

Built by Tanvi Rathore, a high school coding instructor who teaches Python and Scratch programming and works as a code coach at theCoderSchool, and is  also currently conducting research on fMRI-CLIP brain-AI alignment. This  project was inspired directly by watching students make the same conceptual  mistakes repeatedly, in different disguises, without realizing they were the same gap. Learn more about me here: https://portfolio-showcase--tanvirathore200.replit.app/ 
