# PRD-002: Video Asset Management

| Field        | Value                        |
|--------------|------------------------------|
| Document ID  | PRD-002                      |
| Feature      | Video Asset Management       |
| Depends On   | PRD-001 (Authentication)     |
| Status       | Draft                        |
| Author       | medisa-aris                  |
| Created      | 2026-05-28                   |
| Last Updated | 2026-05-28 (decisions finalised) |

---

## 1. Overview

This document defines the requirements for the core video asset management feature: uploading videos, viewing a library list, and editing asset metadata. This is the primary value proposition of ReelsAssetVault — giving creators and teams a central place to organise and manage their short-form video assets.

---

## 2. Problem Statement

Without a structured asset library:
- Creators lose track of which video versions have been uploaded
- There is no central source of truth for resolution, duration, or file size
- Teams cannot find or reuse assets efficiently

---

## 3. Goals

- Let authenticated users upload video files with metadata
- Display a clean, scannable list of all uploaded assets with key technical specs at a glance
- Allow users to edit asset metadata (title, description, tags) after upload
- Lay the foundation for future features: search, tagging, versioning, publishing

---

## 4. Non-Goals (Out of Scope for This PR)

- Video playback / player
- Duplicate detection
- AI auto-tagging
- Cloud storage (S3/MinIO) — local storage only for now
- Asset versioning
- Bulk upload
- Video transcoding or compression
- Public sharing links

---

## 5. Navigation Structure

```
Top Navigation
└── Video
    ├── List Video   →  /video
    └── Upload       →  /video/upload
```

The **Video** menu item appears in the top navigation bar for all authenticated users. Unauthenticated users are redirected to `/login`.

---

## 6. User Stories

### List Video
> As a user, I want to see all videos uploaded by any user in a shared table so I can find and manage the team's asset library.

**Acceptance Criteria:**
- Page shows a table with one row per video across **all users**
- Each row shows: snapshot thumbnail, title, resolution, file size, duration, upload date, last updated by, and an edit action
- An **Add New Video** button in the page header links to `/video/upload`
- If no videos have been uploaded by anyone, the page shows an empty state with a prompt to upload
- Table is sorted by upload date descending by default
- Pagination: 20 rows per page

### Upload Video
> As a user, I want to upload a video file and fill in its metadata so it appears in my library.

**Acceptance Criteria:**
- User can select a video file via drag-and-drop or a file browser
- Accepted formats: `.mp4`, `.mov`, `.avi`, `.webm`
- Max file size: 500 MB
- After file is selected, resolution, duration, and file size are extracted automatically
- User fills in: Title (required), Description (optional), Tags (optional)
- On submit, asset is saved and user is redirected to the List Video page
- Progress indicator shown during upload

### Edit Metadata
> As a user, I want to edit the title, description, and tags of an uploaded video.

**Acceptance Criteria:**
- Clicking **Edit** in the Actions column opens a metadata form (modal or dedicated page)
- User can update: Title, Description, Tags
- Technical fields (resolution, duration, file size) are read-only
- On save, the table row updates immediately
- `updated_by` is set to the current user and `updated_at` is refreshed

---

## 7. UI Specification

### 7.1 Navigation Bar

```
┌─────────────────────────────────────────────────────────┐
│  ReelsAssetVault        [Video ▾]          Alice  Logout │
│                          ├ List Video                    │
│                          └ Upload                        │
└─────────────────────────────────────────────────────────┘
```

### 7.2 List Video Page (`/video`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Video Library                                    [+ Add New Video]          │
├────────────┬──────────────────┬────────────┬─────────┬──────────┬───────────┬────────────────┬─────────┤
│ Snapshot   │ Title            │ Resolution │ Size    │ Duration │ Uploaded  │ Last Updated By│ Actions │
├────────────┼──────────────────┼────────────┼─────────┼──────────┼───────────┼────────────────┼─────────┤
│ [thumb]    │ My Reel #1       │ 1920×1080  │ 24.5 MB │ 0:45     │ 2026-05-28│ alice          │ [Edit]  │
│ [thumb]    │ Product Demo     │ 1280×720   │ 8.2 MB  │ 0:22     │ 2026-05-27│ alice          │ [Edit]  │
└────────────┴──────────────────┴────────────┴─────────┴──────────┴───────────┴────────────────┴─────────┘
                                                                        Page 1 of 1   [< Prev] [Next >]
```

**Column Definitions:**

| Column Header | Data | Notes |
|---------------|------|-------|
| Snapshot | Thumbnail image extracted from video | Falls back to a video icon if unavailable |
| Title | `app_asset.title` | Clickable — opens edit metadata form |
| Resolution | `{width}×{height}` | e.g. `1920×1080` |
| Size | File size in MB | e.g. `24.5 MB` |
| Duration | Formatted seconds | e.g. `0:45` or `1:23` |
| Uploaded | `created_at` formatted as `YYYY-MM-DD` | |
| Last Updated By | `app_user.full_name` of `updated_by` | Falls back to uploader name |
| Actions | Edit button | Opens metadata edit form |

### 7.3 Upload Page (`/video/upload`)

```
┌──────────────────────────────────────────────────────┐
│  Upload New Video                                     │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │         Drag and drop your video here          │  │
│  │              or  [Browse Files]                │  │
│  │                                                │  │
│  │   Supported: mp4, mov, avi, webm  (max 500MB) │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ── Auto-detected ──────────────────────────────      │
│  Resolution:  —              Duration:  —             │
│  File Size:   —                                       │
│                                                       │
│  ── Metadata ───────────────────────────────────      │
│  Title *      [____________________________________]  │
│  Description  [____________________________________]  │
│               [____________________________________]  │
│  Tags         [▾ Select tags from list...]             │
│                                                       │
│               [Cancel]  [Upload Video]                │
└──────────────────────────────────────────────────────┘
```

**Field Definitions:**

| Field | Required | Notes |
|-------|----------|-------|
| Video file | Yes | Drag-drop or browse; auto-extracts technical specs on selection |
| Resolution | Auto | Read-only, extracted from file |
| Duration | Auto | Read-only, extracted from file |
| File Size | Auto | Read-only, calculated from file |
| Title | Yes | Max 255 chars |
| Description | No | Multi-line, max 1000 chars |
| Tags | No | Multi-select from predefined list (fetched from `GET /api/v1/tags`) |

### 7.4 Edit Metadata Form (Modal)

Opens when **Edit** is clicked in the list. Contains:
- Title (pre-filled, editable)
- Description (pre-filled, editable)
- Tags (pre-filled, multi-select from predefined list)
- Read-only info: Resolution, Duration, File Size, Upload Date
- Buttons: **Save Changes** / **Cancel**

---

## 8. Database Schema

### 8.1 `app_asset`

```sql
CREATE TABLE app_asset (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    filename          VARCHAR(255) NOT NULL,
    file_path         VARCHAR(500) NOT NULL,
    file_size_bytes   BIGINT       NOT NULL,
    duration_seconds  FLOAT,
    width             INTEGER,
    height            INTEGER,
    mime_type         VARCHAR(100),
    thumbnail_path    VARCHAR(500),
    updated_by        UUID         REFERENCES app_user(id),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_asset_user_id    ON app_asset(user_id);
CREATE INDEX idx_app_asset_created_at ON app_asset(created_at DESC);
```

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | PK, auto-generated |
| `user_id` | UUID | FK → `app_user.id` — uploader |
| `title` | VARCHAR(255) | Required — display name |
| `description` | TEXT | Optional free-text |
| `filename` | VARCHAR(255) | Original uploaded filename |
| `file_path` | VARCHAR(500) | Server-side storage path |
| `file_size_bytes` | BIGINT | Raw bytes |
| `duration_seconds` | FLOAT | Extracted from video stream |
| `width` | INTEGER | Video width in pixels |
| `height` | INTEGER | Video height in pixels |
| `mime_type` | VARCHAR(100) | e.g. `video/mp4` |
| `thumbnail_path` | VARCHAR(500) | Path to extracted thumbnail image |
| `updated_by` | UUID | FK → `app_user.id` of last editor |
| `created_at` | TIMESTAMPTZ | Upload timestamp |
| `updated_at` | TIMESTAMPTZ | Last metadata update timestamp |

---

### 8.2 `app_tag` (Predefined Tags)

Tags are managed as a shared predefined list, not free-form text. Admins seed and manage the tag list.

```sql
CREATE TABLE app_tag (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    slug       VARCHAR(100) NOT NULL UNIQUE,   -- URL-safe, e.g. 'product-demo'
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

**Initial seed data:**

| name | slug |
|------|------|
| Product Demo | product-demo |
| Brand | brand |
| Tutorial | tutorial |
| Behind the Scenes | behind-the-scenes |
| Announcement | announcement |
| Reels | reels |
| TikTok | tiktok |
| YouTube Shorts | youtube-shorts |
| Campaign | campaign |
| Archive | archive |

---

### 8.3 `app_asset_tags` (Asset ↔ Tag mapping)

```sql
CREATE TABLE app_asset_tags (
    asset_id UUID NOT NULL REFERENCES app_asset(id) ON DELETE CASCADE,
    tag_id   UUID NOT NULL REFERENCES app_tag(id)   ON DELETE CASCADE,
    PRIMARY KEY (asset_id, tag_id)
);

CREATE INDEX idx_app_asset_tags_asset_id ON app_asset_tags(asset_id);
CREATE INDEX idx_app_asset_tags_tag_id   ON app_asset_tags(tag_id);
```

---

## 9. API Endpoints

### `GET /api/v1/assets`

Return paginated list of **all assets across all users** (shared library). Requires authentication.

**Query Params:** `?page=1&limit=20`

**Response `200 OK`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "title": "My Reel #1",
      "filename": "reel1.mp4",
      "file_size_bytes": 25690112,
      "duration_seconds": 45.3,
      "width": 1920,
      "height": 1080,
      "mime_type": "video/mp4",
      "tags": ["product", "demo"],
      "thumbnail_url": "/storage/thumbnails/uuid.jpg",
      "updated_by_name": "Alice Smith",
      "created_at": "2026-05-28T10:00:00Z",
      "updated_at": "2026-05-28T10:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

### `POST /api/v1/assets/upload`

Upload a new video asset with metadata.

**Request:** `multipart/form-data`
- `file` — video file (required)
- `title` — string (required)
- `description` — string (optional)
- `tag_ids` — repeated field of tag UUIDs (optional, from predefined list)

**Response `201 Created`:**
```json
{
  "id": "uuid",
  "title": "My Reel #1",
  "filename": "reel1.mp4",
  "file_size_bytes": 25690112,
  "duration_seconds": 45.3,
  "width": 1920,
  "height": 1080,
  "mime_type": "video/mp4",
  "tags": ["product"],
  "thumbnail_url": "/storage/thumbnails/uuid.jpg",
  "created_at": "2026-05-28T10:00:00Z"
}
```

**Validations:**
- `file` must be a valid video MIME type
- File size ≤ 500 MB
- `title` is required and non-empty

---

### `GET /api/v1/assets/{id}`

Return a single asset's full detail.

**Response `200 OK`:** Same shape as list item.
**Response `404 Not Found`:** Asset not found.

---

### `PUT /api/v1/assets/{id}`

Update metadata for an existing asset.

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "New description",
  "tag_ids": ["uuid-of-reels-tag", "uuid-of-product-demo-tag"]
}
```

**Response `200 OK`:** Updated asset object.
**Notes:** Sets `updated_by` to current user, refreshes `updated_at`.

---

### `GET /api/v1/tags`

Return the full list of active predefined tags. Used to populate tag pickers on upload and edit forms.

**Response `200 OK`:**
```json
[
  { "id": "uuid", "name": "Product Demo", "slug": "product-demo" },
  { "id": "uuid", "name": "Reels",        "slug": "reels" }
]
```

---

### `DELETE /api/v1/assets/{id}`

**Hard-delete** — permanently removes the asset record and its files from disk.

**Response `204 No Content`**

---

## 10. Backend Implementation Notes

### Directory Structure

```
backend/app/
├── api/v1/
│   └── assets.py             # All asset endpoints
├── models/
│   └── asset.py              # AppAsset SQLAlchemy model
├── schemas/
│   └── asset.py              # AssetUploadRequest, AssetUpdateRequest, AssetResponse
├── services/
│   ├── asset_service.py      # List, get, update, delete logic
│   └── metadata_service.py   # Extract duration, resolution, generate thumbnail
└── storage/
    └── local_storage.py      # Save file to disk, serve static path
```

### Key Dependencies to Add

```
moviepy>=1.0.3             # Extract video metadata & generate thumbnail (no ffmpeg binary needed)
Pillow>=10.0.0             # Image processing for thumbnail save
aiofiles>=23.0.0           # Async file write
```

> **Note:** `ffmpeg` is not available on the deployment server. `moviepy` uses its own bundled codec pipeline and does not require a system ffmpeg binary.

### Metadata Extraction

When a file is uploaded, `metadata_service.py` should:
1. Open video using `moviepy.VideoFileClip`
2. Extract: `width`, `height`, `duration_seconds` from clip properties
3. Detect `mime_type` from the uploaded file's content-type header
4. Generate a thumbnail by capturing a frame at t=0 (first frame), save as `.jpg` via Pillow
5. Return extracted metadata dict to the service

### Storage

Store files under `storage/uploads/{user_id}/{asset_id}/`:
```
storage/
  uploads/
    {user_id}/
      {asset_id}/
        original.mp4
        thumbnail.jpg
```

Serve static files via FastAPI's `StaticFiles` mount:
```python
app.mount("/storage", StaticFiles(directory="storage"), name="storage")
```

---

## 11. Frontend Implementation Notes

### New Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/video` | `VideoListPage` | Table of all assets |
| `/video/upload` | `VideoUploadPage` | Upload + metadata form |

### New Components

| Component | Description |
|-----------|-------------|
| `Navigation.tsx` | Updated with Video dropdown menu |
| `VideoTable.tsx` | Table with columns per spec |
| `VideoTableRow.tsx` | Single row: thumbnail, metadata, edit button |
| `EditMetadataModal.tsx` | Modal form for editing title/description/tags |
| `VideoDropzone.tsx` | Drag-and-drop file picker |
| `TagInput.tsx` | Pill-style tag entry field |

### New Hooks

| Hook | Purpose |
|------|---------|
| `useAssets.ts` | Fetch paginated asset list |
| `useUpload.ts` | Handle file upload with progress |

### Helpers (`lib/utils.ts`)

```typescript
formatFileSize(bytes: number): string    // 25690112 → "24.5 MB"
formatDuration(seconds: number): string  // 45.3 → "0:45"
formatResolution(w: number, h: number): string  // "1920×1080"
```

---

## 12. Acceptance Criteria

| # | Criteria | Verified By |
|---|----------|-------------|
| 1 | List Video page shows correct table columns with appropriate headers | Visual |
| 2 | Each row displays snapshot, title, resolution, size, duration, upload date, last updated by, edit button | Visual |
| 3 | "Add New Video" button navigates to `/video/upload` | Click test |
| 4 | Empty state shown when no videos uploaded | Visual |
| 5 | Upload form accepts mp4/mov/avi/webm and rejects other types | Upload test |
| 6 | After file selected, resolution/duration/size auto-populate | Upload test |
| 7 | Submitting upload form creates asset and redirects to list | End-to-end |
| 8 | Edit modal pre-fills current metadata and saves changes | Edit test |
| 9 | All asset endpoints return `401` without a valid token | API test |
| 10 | DELETE permanently removes the asset record and file from disk | DB + file system check |
| 11 | Tag picker only shows predefined tags from `GET /api/v1/tags` | Visual + API test |
| 12 | List shows videos from all users, not just the logged-in user | Upload as two users, verify both appear | 

---

## 13. Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Should users only see their own videos, or all users' videos? | medisa-aris | Open |
| 2 | Is ffmpeg available on the deployment server for metadata extraction? | medisa-aris | Open |
| 3 | Should tags be free-form or drawn from a predefined list? | medisa-aris | Open |
| 4 | Should delete be hard delete or soft delete (hidden but recoverable)? | medisa-aris | Open |

---

## 14. Future Scope (Not in This PR)

- Video playback inline in the list
- Asset search and filter by tag/date/resolution
- Asset versioning (re-upload with version history)
- Bulk upload and bulk metadata edit
- S3/MinIO cloud storage
- AI auto-tagging from video content
- Instagram/TikTok direct publishing from list
