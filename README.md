# Office Hours

Initial scaffold for an AI learning diagnostic tool for programming education.

## Run locally

```bash
npm install
npm run install:all
npm run dev
```

The client runs at `http://localhost:5173` and the API at `http://localhost:3001`.

## API

- `GET /` — API status
- `POST /submit` — store a submission (`student_id`, `code_text`, optional `language`)
- `GET /history/:student_id` — submissions and placeholder misconceptions for one student

The SQLite database is created automatically at `server/database/office-hours.db`.
