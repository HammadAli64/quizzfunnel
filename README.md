# AI Quiz Funnel System

Full-stack quiz funnel with:
- Frontend: Next.js
- Backend API: FastAPI (Python)
- Database: SQLite
- AI: OpenAI API

## Folder Structure

```text
funnelquizz/
├─ backend/
│  ├─ app/
│  │  ├─ __init__.py
│  │  ├─ ai_service.py
│  │  ├─ crud.py
│  │  ├─ database.py
│  │  ├─ main.py
│  │  ├─ models.py
│  │  ├─ quiz_data.py
│  │  └─ schemas.py
│  ├─ data/
│  ├─ .env.example
│  └─ requirements.txt
├─ frontend/
│  ├─ app/
│  │  ├─ globals.css
│  │  ├─ layout.js
│  │  ├─ page.js
│  │  ├─ quiz/page.js
│  │  └─ result/page.js
│  ├─ components/
│  │  └─ ProgressBar.js
│  ├─ lib/
│  │  └─ api.js
│  ├─ .env.local.example
│  ├─ jsconfig.json
│  ├─ next.config.mjs
│  └─ package.json
└─ README.md
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Frontend Setup

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:8000`

## API Endpoints

- `GET /api/quiz-questions`
- `POST /api/submit-answers`

## Scoring Rules

- A = 1
- B = 3
- C = 5
- D = 10

## Category Rules

- 10-30: Beginner
- 31-60: Intermediate
- 61-85: Advanced
- 86-100: Expert
