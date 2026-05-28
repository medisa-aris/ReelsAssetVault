# ReelsAssetVault

ReelsAssetVault is a modern digital asset management platform for organizing and managing short-form video assets — Instagram Reels, TikTok videos, YouTube Shorts, and other creative media — with an integrated AI-powered content ideation and scriptwriting pipeline.

Built with **Next.js 14**, **Python (FastAPI)**, and **PostgreSQL**.

---

## Features

### Video Library
- Upload and manage video assets (mp4, mov, webm, avi)
- Automatic metadata extraction: filename, file size, resolution, duration, MIME type
- Custom tagging and categorization
- Inline video preview — click any thumbnail to play the video in a modal player
- Download original video files directly from the library
- Edit metadata (title, description, tags) without leaving the list

### AI Ideation & Scriptwriting
- Generate a 7-day social media content plan in seconds using AI
- Supports Claude, ChatGPT, Ollama, and Kimi as AI providers
- Manage ideation items through a full lifecycle: Draft → Approved → Script Generated → Published
- Search, filter by status, sort, and bulk-manage ideation items
- Turn any ideation into a fully structured video script via AI
- **Language selection**: generate scripts in English or Bahasa Indonesia
- Export scripts as `.txt`, `.md`, or PDF

### Admin
- Configure the active AI provider and API credentials from a dedicated admin page
- Role-based access: Admin menu only visible to users with the `admin` role

### Authentication
- JWT-based login / logout
- Role-based access control (viewer, editor, admin)
- All API endpoints protected; admin endpoints return 403 for non-admin users

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend** | Python 3.x, FastAPI |
| **Database** | PostgreSQL + Alembic migrations |
| **AI SDKs** | `anthropic` (Claude), `openai` (ChatGPT / Ollama / Kimi) |
| **Media Player** | `react-player` |
| **PDF Export** | `reportlab` |
| **Storage** | Local filesystem (S3 / MinIO planned) |

---

## Project Structure

```
ReelsAssetVault/
├── frontend/                  # Next.js 14 app
│   ├── app/
│   │   ├── video/             # Video library + upload
│   │   ├── script/
│   │   │   ├── ideation/      # Ideation list, create, generate, detail
│   │   │   └── scripts/       # Script list + detail
│   │   └── admin/
│   │       └── ai-config/     # AI provider configuration
│   ├── components/            # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # API client, types, utilities
├── backend/
│   └── app/
│       ├── api/v1/            # REST endpoints (assets, ideations, scripts, admin)
│       ├── models/            # SQLAlchemy models
│       ├── schemas/           # Pydantic schemas
│       ├── services/          # Business logic + AI service
│       └── middleware/        # Auth, CORS, logging
├── database/
│   └── migrations/versions/   # Alembic migration files (0001–0003)
├── storage/uploads/           # Local video file storage (gitignored)
└── docs/                      # PRD documents
    ├── PRD-001-auth.md
    ├── PRD-002-assets.md
    ├── PRD-003-script.md
    └── PRD-004-video-viewer.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL 13+

### 1. Clone

```bash
git clone https://github.com/yourusername/ReelsAssetVault.git
cd ReelsAssetVault
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL and SECRET_KEY

# Run migrations
alembic upgrade head

# Start server (http://localhost:8000)
uvicorn app.main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local

# Start dev server (http://localhost:3000)
npm run dev
```

### 4. Database

```sql
CREATE DATABASE reelsassetvault;
```

Update `DATABASE_URL` in `backend/.env`:
```
DATABASE_URL=postgresql://user:password@localhost/reelsassetvault
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | Obtain JWT token |
| `GET` | `/api/v1/assets` | List paginated video assets |
| `POST` | `/api/v1/assets/upload` | Upload a new video |
| `PUT` | `/api/v1/assets/{id}` | Update asset metadata |
| `GET` | `/api/v1/ideations` | List ideation items |
| `POST` | `/api/v1/ideations/generate` | AI-generate 7 ideation items |
| `POST` | `/api/v1/scripts/generate` | Generate a script from an ideation |
| `GET` | `/api/v1/scripts/{id}/export` | Export script as txt / md / PDF |
| `GET` | `/api/v1/admin/ai-config` | List AI provider configs (admin) |
| `PATCH` | `/api/v1/admin/ai-config/{id}/activate` | Set active AI provider (admin) |

Full API docs: `http://localhost:8000/docs` (Swagger UI)

---

## Roadmap

### Implemented
- [x] JWT authentication & role-based access control
- [x] Video upload with automatic metadata extraction
- [x] Asset library with search, tagging, pagination
- [x] Inline video player (click thumbnail to preview)
- [x] Download video files from the library
- [x] AI-powered 7-day content ideation generation
- [x] Ideation management (CRUD, bulk ops, status lifecycle)
- [x] AI script generation from ideation items
- [x] Script output language: English / Bahasa Indonesia
- [x] Script export: .txt, .md, PDF, copy to clipboard
- [x] Admin AI config page (Claude, ChatGPT, Ollama, Kimi)

### Planned
- [ ] Cloud storage (S3 / MinIO)
- [ ] Video transcription
- [ ] AI auto-tagging from video content
- [ ] Duplicate asset detection
- [ ] Content calendar view (weekly/monthly grid)
- [ ] Direct social media publishing integration
- [ ] Analytics dashboard
- [ ] Docker deployment

---

## License

MIT License
