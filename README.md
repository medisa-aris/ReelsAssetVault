# ReelsAssetVault

ReelsAssetVault is a modern digital asset management platform for organizing and managing short-form video assets such as Instagram Reels, TikTok videos, YouTube Shorts, and other creative media.

Built with **Next.js**, **Python**, and **PostgreSQL**, the platform helps creators, editors, and media teams manage large collections of video assets with metadata tracking, versioning, and searchable organization.

---

## Features

* 🎬 Upload and manage video assets
* 🗂 Asset versioning and re-upload history
* 🔍 Search assets by title, tags, and description
* 📊 Automatic metadata extraction:

  * Filename
  * File size
  * Resolution
  * Duration
  * File type
  * Upload version
* 🏷 Custom tagging and categorization
* 👥 Multi-user ready architecture
* 🔐 Authentication and access management
* ⚡ API-first backend design
* ☁️ Ready for S3 / MinIO storage integration

---

## Tech Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS

### Backend

* Python (FastAPI)

### Database

* PostgreSQL

### Storage

* Local Storage (initial)
* S3 / MinIO (planned)

---

## Project Structure

```bash
reelsassetvault/
├── frontend/         # Next.js frontend
├── backend/          # Python FastAPI backend
├── database/         # Database schema and migrations
├── storage/          # Local storage / asset handling
├── docs/             # Documentation
└── docker-compose.yml
```

---

## Planned Features

* AI auto-tagging
* Video transcription
* Duplicate asset detection
* Team collaboration
* Instagram/TikTok publishing workflow
* Cloud object storage support
* Background rendering pipeline
* Analytics dashboard

---

## Getting Started

### Clone Repository

```bash
git clone https://github.com/yourusername/ReelsAssetVault.git
cd ReelsAssetVault
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Database

```bash
PostgreSQL required
```

Create a database:

```sql
CREATE DATABASE reelsassetvault;
```

---

## Vision

ReelsAssetVault aims to become a lightweight but powerful media vault for modern content operations — helping creators and teams organize, reuse, and scale their short-form video production workflows.

---

## License

MIT License
