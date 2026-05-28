# ReelsAssetVault Developer Guide

A comprehensive guide for developers working on ReelsAssetVault, a digital asset management platform for short-form video content.

---

## Quick Start

Get the project running in 5 minutes:

```bash
# Clone and navigate
git clone https://github.com/yourusername/ReelsAssetVault.git
cd ReelsAssetVault

# Frontend (Terminal 1)
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000

# Backend (Terminal 2)
cd ../backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# Runs on http://localhost:8000

# Database
# Ensure PostgreSQL is running, then create database:
createdb reelsassetvault
# Backend will run migrations on startup
```

---

## Architecture Overview

ReelsAssetVault follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  - Pages: Upload, Browse, Search, Asset Details             │
│  - Components: VideoPlayer, TagEditor, MetadataDisplay      │
│  - Hooks: useAssets, useSearch, useUpload                   │
│  - API client: lib/api.ts                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────▼──────────────────────────────────────┐
│                  Backend (FastAPI)                           │
│  - Routes: /api/v1/assets, /api/v1/tags, /api/v1/search    │
│  - Services: AssetService, StorageService, MetadataService  │
│  - Models: Asset, Tag, Version, User                        │
│  - Middleware: Auth, CORS, Logging                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ SQL
┌──────────────────────▼──────────────────────────────────────┐
│              Database (PostgreSQL)                           │
│  - Tables: assets, tags, versions, users, asset_tags        │
│  - Migrations: Alembic (in db/migrations/)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │ File Operations
┌──────────────────────▼──────────────────────────────────────┐
│            Storage Layer (Local/S3/MinIO)                    │
│  - Local: storage/uploads/                                   │
│  - S3/MinIO: (Future) Cloud object storage                  │
└──────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. User uploads video via frontend
2. Frontend sends to `/api/v1/assets/upload` endpoint
3. Backend validates, stores file, extracts metadata
4. Database record created with metadata
5. Asset appears in user's library

---

## Technology Stack & Rationale

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js + TypeScript | Server-side rendering, great dev experience, built-in API routes for future |
| | Tailwind CSS | Utility-first styling, rapid development, maintainable design system |
| **Backend** | Python + FastAPI | Fast (async), great for media processing, automatic API docs, easy to extend |
| | PostgreSQL | Reliable ACID transactions, great for relational data (assets, tags, users) |
| **Storage** | Local (initial) | Simplicity for development and MVP |
| | S3/MinIO (planned) | Scalability, production readiness, cloud-native architecture |
| **DevOps** | Docker (planned) | Consistency across environments, easy deployment |

---

## Directory Structure & Organization

```
ReelsAssetVault/
│
├── frontend/                    # Next.js frontend application
│   ├── app/                     # App router pages
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home/dashboard
│   │   ├── upload/page.tsx       # Upload page
│   │   ├── [id]/page.tsx        # Asset detail page
│   │   └── search/page.tsx       # Search results page
│   ├── components/              # Reusable components
│   │   ├── VideoUpload.tsx       # Upload form component
│   │   ├── AssetCard.tsx         # Asset preview card
│   │   ├── SearchBar.tsx         # Search interface
│   │   └── TagEditor.tsx         # Tag management
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAssets.ts          # Fetch assets data
│   │   ├── useSearch.ts          # Search functionality
│   │   └── useUpload.ts          # Upload state management
│   ├── lib/                     # Utilities and helpers
│   │   ├── api.ts               # API client configuration
│   │   ├── storage.ts           # Local storage helpers
│   │   └── utils.ts             # Common utilities
│   ├── styles/                  # Global and component styles
│   ├── package.json             # Dependencies
│   ├── tsconfig.json            # TypeScript config
│   └── next.config.js           # Next.js config
│
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── main.py              # FastAPI app initialization
│   │   ├── config.py            # Configuration (DB, auth, etc.)
│   │   ├── database.py          # Database connection and session
│   │   ├── api/
│   │   │   ├── v1/              # API v1 endpoints
│   │   │   │   ├── assets.py     # Asset CRUD endpoints
│   │   │   │   ├── tags.py       # Tag management endpoints
│   │   │   │   ├── search.py     # Search endpoints
│   │   │   │   └── auth.py       # Authentication endpoints
│   │   │   └── __init__.py
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── asset.py          # Asset model
│   │   │   ├── tag.py            # Tag model
│   │   │   ├── version.py        # Version model
│   │   │   └── user.py           # User model
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   │   ├── asset.py          # Asset schemas
│   │   │   ├── tag.py            # Tag schemas
│   │   │   └── user.py           # User schemas
│   │   ├── services/            # Business logic
│   │   │   ├── asset_service.py  # Asset operations
│   │   │   ├── storage_service.py # File storage operations
│   │   │   ├── metadata_service.py # Metadata extraction
│   │   │   └── search_service.py  # Search operations
│   │   └── middleware/          # Custom middleware
│   │       ├── auth.py           # Authentication middleware
│   │       └── logging.py        # Request logging
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Example environment variables
│
├── database/                    # Database management
│   ├── migrations/              # Alembic migrations
│   │   ├── env.py               # Alembic config
│   │   ├── script.py.mako       # Migration template
│   │   └── versions/            # Migration files (auto-generated)
│   ├── schema.sql               # Initial schema (reference)
│   └── seeds/                   # Test data (optional)
│
├── storage/                     # Storage and file handling
│   ├── uploads/                 # Local file storage (gitignored)
│   ├── config.py                # Storage configuration
│   └── handlers/                # File handling utilities
│
├── docs/                        # Documentation
│   ├── API.md                   # API endpoint reference
│   ├── DATABASE.md              # Schema and data model docs
│   ├── DEPLOYMENT.md            # Deployment instructions
│   └── ARCHITECTURE.md          # Detailed architecture docs
│
├── .gitignore                   # Git ignore patterns
├── README.md                    # Project overview
├── CLAUDE.md                    # This file - developer guide
├── LICENSE                      # MIT License
└── docker-compose.yml           # Docker composition (planned)
```

**Organization Principles:**
- **Separation of concerns**: Each layer (frontend, backend, database) is independent
- **Modularity**: Features are self-contained (e.g., all upload logic in one place)
- **Scalability**: Easy to add new features without impacting existing code
- **Testability**: Business logic in services, easy to mock and test

---

## Development Setup

### Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.9+ (for backend)
- **PostgreSQL** 13+ (for database)
- **Git** (for version control)

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local for environment variables
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=ReelsAssetVault
EOF

# Start development server
npm run dev
```

**Available Scripts:**
- `npm run dev` - Start dev server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env for configuration
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost/reelsassetvault
SECRET_KEY=your-secret-key-here
DEBUG=True
EOF

# Run database migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

**Database URL Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**Available Commands:**
- `uvicorn app.main:app --reload` - Start dev server with auto-reload
- `alembic upgrade head` - Run all pending migrations
- `alembic downgrade -1` - Rollback last migration
- `pytest` - Run tests

### Database Setup

```bash
# Create database
createdb reelsassetvault

# Connect and verify
psql -d reelsassetvault

# Run migrations from backend directory
cd backend && alembic upgrade head
```

**Connection Verification:**
```bash
psql postgresql://user:password@localhost/reelsassetvault
```

---

## Running the Application

**Complete Setup (All Services):**

```bash
# Terminal 1: Frontend
cd frontend
npm install
npm run dev
# http://localhost:3000

# Terminal 2: Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
# http://localhost:8000

# Terminal 3: PostgreSQL (if not running as service)
# Use your system's PostgreSQL service or:
pg_ctl start -D /path/to/postgresql/data
```

**Health Checks:**
- Frontend: Visit http://localhost:3000
- Backend: Visit http://localhost:8000/docs (Swagger UI)
- Database: `psql -d reelsassetvault -c "SELECT 1;"`

---

## Code Conventions & Patterns

### REST API Conventions (FastAPI)

**Endpoint Structure:**
```
/api/v1/{resource}/{action}
```

**Examples:**
```
GET    /api/v1/assets              # List all assets
GET    /api/v1/assets/{id}         # Get specific asset
POST   /api/v1/assets              # Create asset
PUT    /api/v1/assets/{id}         # Update asset
DELETE /api/v1/assets/{id}         # Delete asset
GET    /api/v1/assets/search       # Search assets
POST   /api/v1/assets/{id}/tags    # Add tags to asset
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "video.mp4",
    "size": 1024000,
    "created_at": "2026-05-28T10:00:00Z"
  },
  "message": "Asset created successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File size exceeds limit"
  }
}
```

**HTTP Status Codes:**
- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

**Example Endpoint (assets.py):**
```python
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.schemas.asset import AssetCreate, AssetResponse
from app.services.asset_service import AssetService

router = APIRouter(prefix="/api/v1/assets", tags=["assets"])

@router.post("", response_model=AssetResponse)
async def create_asset(file: UploadFile = File(...)):
    """Upload a new video asset."""
    service = AssetService()
    try:
        asset = await service.create_asset(file)
        return asset
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str):
    """Get asset details by ID."""
    service = AssetService()
    asset = await service.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset
```

### Frontend Code Organization (Next.js)

**Pages Structure:**
```typescript
// app/[id]/page.tsx - Asset detail page
'use client';

import { useParams } from 'next/navigation';
import { useAsset } from '@/hooks/useAssets';
import VideoPlayer from '@/components/VideoPlayer';
import MetadataDisplay from '@/components/MetadataDisplay';
import TagEditor from '@/components/TagEditor';

export default function AssetPage() {
  const { id } = useParams();
  const { asset, loading, error } = useAsset(id as string);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!asset) return <div>Asset not found</div>;

  return (
    <div className="container mx-auto p-6">
      <VideoPlayer src={asset.file_url} />
      <MetadataDisplay asset={asset} />
      <TagEditor assetId={asset.id} />
    </div>
  );
}
```

**Component Structure:**
```typescript
// components/AssetCard.tsx
interface AssetCardProps {
  asset: Asset;
  onSelect?: (id: string) => void;
}

export default function AssetCard({ asset, onSelect }: AssetCardProps) {
  return (
    <div onClick={() => onSelect?.(asset.id)} className="card cursor-pointer">
      <img src={asset.thumbnail_url} alt={asset.filename} />
      <h3>{asset.filename}</h3>
      <p className="text-sm text-gray-500">{asset.duration}s</p>
      <div className="tags">
        {asset.tags.map(tag => (
          <span key={tag.id} className="badge">{tag.name}</span>
        ))}
      </div>
    </div>
  );
}
```

**Custom Hooks Pattern:**
```typescript
// hooks/useAssets.ts
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function useAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await api.get('/assets');
        setAssets(response.data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  return { assets, loading, error };
}
```

**Naming Conventions:**
- Components: `PascalCase` (e.g., `VideoPlayer.tsx`)
- Hooks: `useFeatureName` (e.g., `useAssets.ts`)
- Pages: `lowercase` with brackets for dynamic routes (e.g., `[id].tsx`)
- Utilities: `camelCase` (e.g., `formatFileSize.ts`)

### Database Migration Strategy

**Creating a New Migration:**

```bash
cd backend

# Generate empty migration
alembic revision --autogenerate -m "add_description_to_assets"

# This creates: database/migrations/versions/abc123_add_description_to_assets.py
```

**Migration File Structure:**
```python
# database/migrations/versions/abc123_add_description_to_assets.py
from alembic import op
import sqlalchemy as sa

revision = 'abc123'
down_revision = 'xyz789'

def upgrade():
    """Add description column to assets table."""
    op.add_column('assets', sa.Column('description', sa.String(500), nullable=True))

def downgrade():
    """Remove description column from assets table."""
    op.drop_column('assets', 'description')
```

**Running Migrations:**
```bash
alembic upgrade head       # Apply all pending migrations
alembic downgrade -1       # Rollback last migration
alembic current            # Show current migration
alembic history            # View migration history
```

**Best Practices:**
- One logical change per migration
- Always include both `upgrade()` and `downgrade()`
- Test migrations on local database first
- Use descriptive names: `add_user_authentication`, `create_asset_versions_table`
- Don't modify existing migrations; create new ones

---

## Key Development Tasks

### Adding a New API Endpoint

**Step 1: Define Schema (backend/app/schemas/)**
```python
# schemas/asset.py
from pydantic import BaseModel
from datetime import datetime

class AssetUpdate(BaseModel):
    title: str
    description: str
    tags: list[str]

class AssetResponse(BaseModel):
    id: str
    title: str
    description: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

**Step 2: Create Service Method (backend/app/services/)**
```python
# services/asset_service.py
class AssetService:
    def update_asset(self, asset_id: str, data: AssetUpdate) -> Asset:
        """Update asset metadata."""
        session = get_db()
        asset = session.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            raise ValueError("Asset not found")
        
        for key, value in data.dict().items():
            setattr(asset, key, value)
        
        session.commit()
        return asset
```

**Step 3: Create Route (backend/app/api/v1/)**
```python
# api/v1/assets.py
from fastapi import APIRouter, HTTPException
from app.schemas.asset import AssetUpdate, AssetResponse
from app.services.asset_service import AssetService

router = APIRouter(prefix="/api/v1/assets", tags=["assets"])

@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: str, data: AssetUpdate):
    """Update asset details."""
    service = AssetService()
    try:
        asset = service.update_asset(asset_id, data)
        return asset
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

**Step 4: Register Route (backend/app/main.py)**
```python
from app.api.v1 import assets

app = FastAPI()

app.include_router(assets.router)
```

**Step 5: Test the Endpoint**
```bash
# Visit http://localhost:8000/docs for Swagger UI
# Or use curl:
curl -X PUT http://localhost:8000/api/v1/assets/123 \
  -H "Content-Type: application/json" \
  -d '{"title": "New Title", "description": "...", "tags": []}'
```

### Creating a New Frontend Page/Component

**Step 1: Create Component (frontend/components/)**
```typescript
// components/AssetEditor.tsx
'use client';

import { useState } from 'react';
import { Asset } from '@/lib/types';

interface AssetEditorProps {
  asset: Asset;
  onSave: (data: Partial<Asset>) => Promise<void>;
}

export default function AssetEditor({ asset, onSave }: AssetEditorProps) {
  const [formData, setFormData] = useState(asset);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      alert('Asset updated!');
    } catch (error) {
      alert('Error saving asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        placeholder="Title"
      />
      {/* More form fields */}
      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

**Step 2: Create Page (frontend/app/)**
```typescript
// app/assets/[id]/edit/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useAsset } from '@/hooks/useAssets';
import AssetEditor from '@/components/AssetEditor';
import { api } from '@/lib/api';

export default function EditAssetPage() {
  const { id } = useParams();
  const { asset, loading } = useAsset(id as string);

  const handleSave = async (data) => {
    await api.put(`/assets/${id}`, data);
  };

  if (loading) return <div>Loading...</div>;
  if (!asset) return <div>Asset not found</div>;

  return (
    <div className="container mx-auto p-6">
      <h1>Edit {asset.filename}</h1>
      <AssetEditor asset={asset} onSave={handleSave} />
    </div>
  );
}
```

**Step 3: Add Navigation**
Update `components/Navigation.tsx` or menu to link to new page.

### Adding Database Schema Changes

**Step 1: Modify SQLAlchemy Model**
```python
# backend/app/models/asset.py
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    title = Column(String)  # NEW FIELD
    description = Column(String(500))  # NEW FIELD
    size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
```

**Step 2: Create and Run Migration**
```bash
cd backend
alembic revision --autogenerate -m "add_title_and_description_to_assets"
alembic upgrade head
```

**Step 3: Update Backend Schema Definition**
```python
# backend/app/schemas/asset.py
class AssetResponse(BaseModel):
    id: str
    filename: str
    title: str | None  # NEW
    description: str | None  # NEW
    size: int
    created_at: datetime
```

### Adding Tests

**Backend Tests (pytest):**
```python
# backend/tests/test_assets.py
import pytest
from app.services.asset_service import AssetService

@pytest.fixture
def asset_service():
    return AssetService()

def test_get_asset_returns_asset(asset_service):
    # Arrange
    asset_id = "test-123"
    
    # Act
    asset = asset_service.get_asset(asset_id)
    
    # Assert
    assert asset is not None
    assert asset.id == asset_id

def test_update_asset_with_invalid_id_raises_error(asset_service):
    # Arrange
    invalid_id = "nonexistent"
    
    # Act & Assert
    with pytest.raises(ValueError):
        asset_service.update_asset(invalid_id, {})
```

**Frontend Tests (Jest):**
```typescript
// frontend/__tests__/components/AssetCard.test.tsx
import { render, screen } from '@testing-library/react';
import AssetCard from '@/components/AssetCard';

describe('AssetCard', () => {
  const mockAsset = {
    id: '1',
    filename: 'test.mp4',
    duration: 30,
    tags: []
  };

  it('renders asset filename', () => {
    render(<AssetCard asset={mockAsset} />);
    expect(screen.getByText('test.mp4')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<AssetCard asset={mockAsset} onSelect={onSelect} />);
    screen.getByText('test.mp4').click();
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

**Running Tests:**
```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm test
```

---

## Git Workflow & Branching

### Branch Naming Convention

```
feature/{feature-name}      # New features
fix/{bug-name}              # Bug fixes
docs/{doc-name}             # Documentation
refactor/{refactor-name}    # Code refactoring
test/{test-name}            # Tests
chore/{task-name}           # Maintenance tasks
```

**Examples:**
```
feature/video-upload
fix/search-performance
docs/api-authentication
refactor/asset-service
test/asset-endpoints
chore/update-dependencies
```

### Commit Message Format

```
[TYPE] Brief description (50 chars max)

Longer explanation if needed (72 chars per line).
- Bullet points for lists
- Explain the why, not just the what

Fixes #123 (if applicable)
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`

**Examples:**
```
feat: Add video upload endpoint with metadata extraction

- Implemented POST /api/v1/assets/upload
- Extracts filename, size, resolution, duration
- Returns asset with metadata
- Includes file validation and error handling

test: Add tests for upload validation

fix: Correct duration extraction from MP4 files

docs: Update API documentation with upload endpoint details
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make Changes & Commit**
   ```bash
   git add .
   git commit -m "feat: Description"
   ```

3. **Push to Remote**
   ```bash
   git push -u origin feature/my-feature
   ```

4. **Create Pull Request on GitHub**
   - Title: `[TYPE] Brief description`
   - Description: What changed and why
   - Link related issues: `Fixes #123`

5. **Address Review Comments**
   ```bash
   # Make requested changes
   git add .
   git commit -m "review: Address feedback"
   git push
   ```

6. **Merge to Main**
   - Use "Squash and merge" for feature branches
   - Use "Create a merge commit" for release branches

---

## Code Review & Collaboration

### Code Review Checklist

**Before Requesting Review:**
- [ ] Code follows project conventions
- [ ] All tests pass (`npm test` / `pytest`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript types are correct
- [ ] Database migrations are included (if applicable)
- [ ] Updated documentation if needed
- [ ] No sensitive data in code

**As a Reviewer:**
- [ ] Code is readable and maintainable
- [ ] No obvious bugs or performance issues
- [ ] Tests cover new functionality
- [ ] No breaking changes without discussion
- [ ] Follows project conventions
- [ ] Appropriate error handling

**Common Comments:**
```
# Blocking issues
"This breaks the API contract in a way that needs discussion"
"This approach conflicts with the migration strategy"

# Questions
"Why did you choose X over Y?"
"Can you explain this logic?"

# Suggestions
"Consider using the useAssets hook here"
"This could be extracted to a helper function"

# Approval
"Looks good! A few minor suggestions above."
"Approved with minor changes"
```

### Communication

- **GitHub Issues**: Track bugs, features, and discussions
- **Commit Messages**: Explain the why, not just the what
- **PR Descriptions**: Clear explanation of changes and testing
- **Code Comments**: Only for non-obvious logic (the why, not the what)
- **Documentation**: Update README, API docs, and CLAUDE.md when needed

### Pair Programming

When working together:
1. One person writes code, other reviews in real-time
2. Rotate roles frequently
3. Use video calls for complex features
4. Document decisions and learnings

---

## Testing Strategy

### Backend Testing (pytest)

**Test Structure:**
```
tests/
├── unit/                    # Unit tests (no DB)
│   ├── test_services/
│   └── test_utils/
├── integration/             # Integration tests (with DB)
│   ├── test_api/
│   └── test_models/
└── conftest.py             # Shared fixtures
```

**Running Tests:**
```bash
# All tests
pytest

# Specific file
pytest tests/unit/test_services/test_asset_service.py

# With coverage
pytest --cov=app tests/

# Specific marker
pytest -m "not slow"

# Verbose output
pytest -v
```

**Test Fixtures:**
```python
# tests/conftest.py
@pytest.fixture
def db_session():
    """Create test database session."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = SessionLocal(bind=engine)
    yield session
    session.close()

@pytest.fixture
def sample_asset(db_session):
    """Create sample asset for testing."""
    asset = Asset(id="123", filename="test.mp4", size=1024)
    db_session.add(asset)
    db_session.commit()
    return asset
```

### Frontend Testing (Jest)

**Test Structure:**
```
__tests__/
├── components/              # Component tests
├── hooks/                   # Hook tests
├── lib/                     # Utility tests
└── integration/             # Full page tests
```

**Running Tests:**
```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific file
npm test -- AssetCard
```

**Component Testing:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('AssetUpload', () => {
  it('uploads file on form submission', async () => {
    const user = userEvent.setup();
    render(<AssetUpload />);
    
    const input = screen.getByLabelText('Select file');
    const file = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    
    await user.upload(input, file);
    await user.click(screen.getByText('Upload'));
    
    expect(await screen.findByText('Upload complete')).toBeInTheDocument();
  });
});
```

### Test Coverage Goals

- Backend: >= 80% (critical paths 100%)
- Frontend: >= 70% (components and hooks)
- Never aim for 100% coverage; focus on meaningful tests

---

## Deployment & Environments

### Local Development
```bash
# All services running on localhost
Frontend:  http://localhost:3000
Backend:   http://localhost:8000
Database:  localhost:5432
Storage:   ./storage/uploads/
```

### Staging Environment
- Deployed to staging server
- Uses staging database
- S3/MinIO for storage (via config)
- All tests must pass

### Production Environment
- Deployed to production server
- PostgreSQL with backups
- S3/MinIO for cloud storage
- CDN for static assets
- SSL/TLS encryption

### Environment Variables

**Backend (.env):**
```
DATABASE_URL=postgresql://user:pass@localhost/reelsassetvault
SECRET_KEY=your-secret-here
DEBUG=False
ENVIRONMENT=production
STORAGE_TYPE=s3  # or 'local'
S3_BUCKET=reelsassetvault
S3_REGION=us-east-1
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=https://api.reelsassetvault.com
NEXT_PUBLIC_ENVIRONMENT=production
```

### Docker Deployment (Future)

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: reelsassetvault
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres/reelsassetvault

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Troubleshooting

### Common Issues

**Backend won't start - "Address already in use"**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
uvicorn app.main:app --port 8001
```

**Frontend won't connect to API**
```
Check NEXT_PUBLIC_API_URL in .env.local
Verify backend is running on http://localhost:8000
Check CORS settings in backend/app/config.py
```

**Database connection refused**
```
Verify PostgreSQL is running
Check DATABASE_URL in .env
Test connection: psql postgresql://user:pass@localhost/reelsassetvault
```

**Migration errors**
```bash
# Check current migration
alembic current

# Check migration history
alembic history

# Rollback to previous migration
alembic downgrade -1

# Try upgrade again
alembic upgrade head
```

**Tests fail locally but pass in CI**
```bash
# Clear cache
rm -rf .pytest_cache __pycache__

# Recreate virtual environment
deactivate
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Getting Help

1. Check existing GitHub issues
2. Search project documentation (docs/)
3. Ask in team chat with error message
4. Create a new GitHub issue with:
   - Error message/logs
   - Steps to reproduce
   - Environment (OS, Python version, Node version)
   - What you've already tried

---

## Future Features & Roadmap

These are planned features from the README. See [README.md](README.md) for the full vision.

### Phase 1 (Current/MVP)
- ✅ Upload and manage video assets
- ✅ Asset versioning
- ✅ Search and tagging
- ✅ Metadata extraction
- ✅ Basic authentication

### Phase 2 (Planned)
- [ ] AI auto-tagging
- [ ] Video transcription
- [ ] Duplicate asset detection
- [ ] Cloud storage (S3/MinIO)

### Phase 3 (Future)
- [ ] Team collaboration features
- [ ] Instagram/TikTok publishing workflow
- [ ] Background rendering pipeline
- [ ] Analytics dashboard

---

## Quick Reference

### Important Files
- `README.md` - Project overview
- `backend/app/main.py` - Backend entry point
- `frontend/app/page.tsx` - Frontend home page
- `backend/requirements.txt` - Python dependencies
- `frontend/package.json` - Node dependencies

### Useful Commands
```bash
# Start all services
npm run dev          # Frontend
uvicorn ...         # Backend
createdb ...        # Database

# Run tests
pytest              # Backend tests
npm test            # Frontend tests

# Database
alembic upgrade head
alembic downgrade -1

# Linting & Types
npm run lint        # Frontend linting
mypy backend        # Python type checking
```

### Port Reference
```
Frontend:   3000
Backend:    8000
Database:   5432
```

---

## Questions?

Refer to [README.md](README.md) for project vision and [docs/](docs/) directory for detailed documentation.
