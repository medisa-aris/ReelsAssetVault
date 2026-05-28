# PRD-003: AI Ideation & Scriptwriting

| Field        | Value                              |
|--------------|------------------------------------|
| Document ID  | PRD-003                            |
| Feature      | AI Ideation & Scriptwriting        |
| Depends On   | PRD-001 (Auth), PRD-002 (Assets)   |
| Status       | Implemented                        |
| Author       | medisa-aris                        |
| Created      | 2026-05-28                         |
| Last Updated | 2026-05-28                         |

---

## 1. Overview

PRD-003 adds the AI-powered content creation layer to ReelsAssetVault. Users can generate a full week of social media content ideas via AI (Claude, ChatGPT, Ollama, or Kimi), manage those ideas through their lifecycle, and generate detailed video scripts from any ideation item. Admins configure the active AI provider and credentials through a dedicated settings page.

---

## 2. Problem Statement

Without structured content planning:
- Creators spend hours brainstorming what to post each day
- Content lacks strategic structure: hook, CTA, platform-appropriate tone
- Scripts are written in ad-hoc notes apps, disconnected from the asset library
- No single source of truth for content pipeline status (draft → approved → scripted → published)

---

## 3. Goals

- Let users generate a 7-day social media content plan in seconds using AI
- Provide a management interface for ideation items with status tracking, search, filter, and bulk operations
- Let users turn any ideation into a fully structured video script via AI
- Allow users to select script output language: **English** or **Bahasa Indonesia**
- Allow admins to configure which AI provider and credentials to use (global setting)
- Support manual ideation creation for non-AI workflows

---

## 4. Non-Goals (Out of Scope for This PR)

- Video generation from scripts
- Direct social media scheduling/publishing
- Per-user AI configuration (global admin config only)
- Languages beyond English and Bahasa Indonesia
- AI fine-tuning or custom prompts
- Version history for scripts or ideations
- Comments or collaboration on ideations/scripts

---

## 5. Navigation Structure

```
Top Navigation
├── Video (existing)
│   ├── List Video   → /video
│   └── Upload       → /video/upload
├── Script (new)
│   ├── Ideation     → /script/ideation
│   └── Scripts      → /script/scripts
└── Admin (new, admin role only)
    └── AI Config    → /admin/ai-config
```

---

## 6. User Stories

### AI Ideation Generation
> As a user, I want to describe my niche and preferences so that AI generates a 7-day content plan I can immediately use.

**Acceptance Criteria:**
- User fills in: niche/topic, target audience, platform, posting frequency, tone/style, week starting date
- Clicking "Generate Plan" calls the active AI provider
- 7 ideation items are created with title, hook, content summary, CTA, upload date, upload time, platform, and status = Draft
- Generated items appear in the Ideation list immediately
- If no AI provider is configured, a clear error message is shown

### Ideation Management
> As a user, I want to view, search, filter, sort, and bulk-manage my content ideas.

**Acceptance Criteria:**
- Table shows all ideation items with: Title, Platform, Upload Date, Status, Last Updated By, Actions
- Search by title or content
- Filter by status (Draft, Approved, Script Generated, Published)
- Sort by upload date (asc/desc)
- Pagination: 20 rows per page
- Select rows via checkbox → Bulk Delete or Bulk Status Update
- Each row has: View, Edit, Delete, Generate Script action buttons

### Manual Ideation Creation
> As a user, I want to create an ideation item manually without AI.

**Acceptance Criteria:**
- "Create Ideation" button opens a form page
- Fields: Title (required), Platform, Upload Date, Upload Time, Hook, Content Summary, CTA, Tags, Notes
- Saved item appears in the list with status = Draft

### Ideation View/Edit
> As a user, I want to switch between a clean read-only view and an editable form on the same page.

**Acceptance Criteria:**
- Page shows a segmented toggle: **View** | **Edit**
- View mode: all fields are read-only, styled as a card/document
- Edit mode: fields become editable inputs; a Save button appears
- Transition feels smooth (no page reload)

### Script Generation
> As a user, I want to generate a structured video script from any ideation item.

**Acceptance Criteria:**
- Clicking "Generate Script" on an ideation row calls the active AI provider
- Generated script includes: Hook Opening, Scene-by-scene talking points, B-roll suggestions, Caption suggestion, CTA ending, Hashtags
- Optional 15s, 30s, long-form versions included when AI returns them
- The source ideation's status updates to "Script Generated"
- Script appears in the Scripts list and detail page

### Script Management
> As a user, I want to view, edit, and export my scripts.

**Acceptance Criteria:**
- Scripts list shows: Title, Related Ideation, Created Date, actions
- Script detail uses the same View/Edit segmented toggle
- Script can be exported as: plain text (.txt), Markdown (.md), PDF, or copied to clipboard
- Filtering/search by title or related ideation

### Admin AI Config
> As an admin, I want to configure which AI provider the app uses and supply the credentials.

**Acceptance Criteria:**
- `/admin/ai-config` is only accessible to users with `admin` role
- Page shows one card per provider: Claude, ChatGPT, Ollama, Kimi
- Each card shows: provider name, API key field (masked), model field, base URL field (Ollama/Kimi only)
- Clicking "Activate" sets that provider as active; others become inactive
- "Test Connection" button sends a test prompt and shows success/error
- Non-admin users see a 403 from the API and cannot access the page

---

## 7. UI Specification

### 7.1 Ideation List (`/script/ideation`)

```
┌─────────────────────────────────────────────────────────────────┐
│  Ideation                         [+ Create Ideation] [✨ Generate AI Plan] │
│  [Search...] [Status ▾] [Sort: Upload Date ▾]                   │
├──┬─────────────────────┬──────────┬────────────┬────────┬───────┤
│☐ │ Title               │ Platform │ Upload Date│ Status │Actions│
├──┼─────────────────────┼──────────┼────────────┼────────┼───────┤
│☐ │ 5 Tips for Reels    │ Instagram│ 2026-06-01 │ Draft  │ ···   │
│☐ │ Morning Routine     │ TikTok   │ 2026-06-02 │Approved│ ···   │
└──┴─────────────────────┴──────────┴────────────┴────────┴───────┘
[< Prev]  Page 1 of 3  [Next >]
── Bulk action bar (floats when rows selected) ───────────────────
│ 2 selected  [Delete]  [Change Status ▾]                         │
```

### 7.2 Ideation Detail / View-Edit Toggle (`/script/ideation/[id]`)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Ideation                    [View] [Edit] ← toggle   │
│                                                                   │
│  5 Tips for Creating Viral Reels                                 │
│  ─────────────────────────────────────────────────────          │
│  Platform: Instagram    Upload: 2026-06-01 at 09:00              │
│  Status: [Draft ▾]     Tags: [Reels] [Tutorial]                  │
│                                                                   │
│  Hook                                                             │
│  "Did you know 90% of Reels fail in the first 3 seconds?"        │
│                                                                   │
│  Content Summary                                                  │
│  Walk through 5 specific editing techniques that keep viewers... │
│                                                                   │
│  CTA                                                              │
│  Save this post for your next shoot day                          │
│                                                                   │
│  Notes  (optional free-text)                                      │
│                                                                   │
│  [English] [Bahasa]   [⚡ Generate Script]                       │
│  └── language toggle ──┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

In **Edit** mode, each field becomes an input/textarea with a **Save Changes** button at the bottom.

> **Language toggle** is a segmented pill control (`English` / `Bahasa`) displayed inline with the Generate Script button. It controls the `language` parameter sent to the AI. Defaults to English.

### 7.3 AI Generation Form (`/script/ideation/generate`)

```
┌──────────────────────────────────────────────────┐
│  Generate 1-Week Content Plan                     │
│                                                   │
│  Niche / Topic *   [______________________]       │
│  Target Audience   [______________________]       │
│  Platform *        [Instagram ▾]                  │
│  Posting Frequency [Daily ▾]                      │
│  Tone / Style      [Casual, Motivational]         │
│  Week Starting *   [2026-06-01]                   │
│                                                   │
│  [Cancel]  [✨ Generate Plan]                     │
│                                                   │
│  (spinner + "Generating your content plan…")      │
└──────────────────────────────────────────────────┘
```

### 7.4 Script Detail (`/script/scripts/[id]`)

Sections rendered as labeled cards in View mode, textareas in Edit mode:
- Hook Opening · Scenes · B-roll Suggestions · Caption · CTA Ending · Hashtags
- Collapsible: 15s Version · 30s Version · Long-form Version
- Export bar: [Copy] [.txt] [.md] [PDF]

### 7.5 Admin AI Config (`/admin/ai-config`)

Four provider cards in a 2×2 grid. Each card shows:
- Provider logo/name
- Status badge: Active / Inactive
- API Key (masked input with show/hide toggle)
- Model name input
- Base URL input (Ollama, Kimi)
- [Save] [Test] [Activate] buttons

---

## 8. Database Schema

### 8.1 `app_ai_config`

```sql
CREATE TABLE app_ai_config (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    provider    VARCHAR(50) NOT NULL UNIQUE,
    api_key     TEXT,
    model       VARCHAR(100),
    base_url    VARCHAR(500),
    is_active   BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_by  UUID        REFERENCES app_user(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Seeded with 4 inactive rows (one per provider).

### 8.2 `app_ideation`

```sql
CREATE TABLE app_ideation (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    niche             VARCHAR(255),
    target_audience   TEXT,
    platform          VARCHAR(100),
    posting_frequency VARCHAR(100),
    tone_style        VARCHAR(255),
    hook              TEXT,
    content_summary   TEXT,
    cta               TEXT,
    upload_date       DATE,
    upload_time       TIME,
    status            VARCHAR(50)  NOT NULL DEFAULT 'Draft',
    notes             TEXT,
    is_ai_generated   BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_by        UUID         REFERENCES app_user(id),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_app_ideation_user_id    ON app_ideation(user_id);
CREATE INDEX idx_app_ideation_status     ON app_ideation(status);
CREATE INDEX idx_app_ideation_upload_date ON app_ideation(upload_date DESC);
```

### 8.3 `app_ideation_tags`

```sql
CREATE TABLE app_ideation_tags (
    ideation_id UUID NOT NULL REFERENCES app_ideation(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES app_tag(id)      ON DELETE CASCADE,
    PRIMARY KEY (ideation_id, tag_id)
);
```

### 8.4 `app_script`

```sql
CREATE TABLE app_script (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    ideation_id         UUID         REFERENCES app_ideation(id) ON DELETE SET NULL,
    user_id             UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    hook_opening        TEXT,
    scenes              TEXT,
    broll_suggestions   TEXT,
    caption_suggestion  TEXT,
    cta_ending          TEXT,
    hashtags            TEXT,
    version_15s         TEXT,
    version_30s         TEXT,
    version_long        TEXT,
    is_ai_generated     BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_by          UUID         REFERENCES app_user(id),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_app_script_ideation_id ON app_script(ideation_id);
CREATE INDEX idx_app_script_user_id     ON app_script(user_id);
```

---

## 9. API Endpoints

### Admin — `GET /api/v1/admin/ai-config`
Returns all 4 provider configs. Admin only.

### Admin — `PUT /api/v1/admin/ai-config/{id}`
Update api_key, model, base_url for a provider. Admin only.

### Admin — `PATCH /api/v1/admin/ai-config/{id}/activate`
Set provider as active; deactivate all others. Admin only.

### Admin — `POST /api/v1/admin/ai-config/test`
Send test prompt to the active (or specified) provider. Returns `{success, message}`.

### Ideation — `GET /api/v1/ideations`
Query params: `page`, `limit`, `search`, `status`, `sort_by` (upload_date|created_at), `sort_dir` (asc|desc).

### Ideation — `POST /api/v1/ideations`
Create manually. Body: title, platform, upload_date, upload_time, hook, content_summary, cta, notes, tag_ids.

### Ideation — `POST /api/v1/ideations/generate`
Body: niche, target_audience, platform, posting_frequency, tone_style, week_starting.
Creates 7 `app_ideation` rows via AI. Returns `{items: [...], count: 7}`.

### Ideation — `GET /api/v1/ideations/{id}`
Single ideation with tags.

### Ideation — `PUT /api/v1/ideations/{id}`
Update all metadata fields.

### Ideation — `DELETE /api/v1/ideations/{id}`
Delete single.

### Ideation — `DELETE /api/v1/ideations/bulk`
Body: `{ids: [...]}`. Delete multiple.

### Ideation — `PATCH /api/v1/ideations/bulk-status`
Body: `{ids: [...], status: "Approved"}`. Update status for multiple.

### Scripts — `GET /api/v1/scripts`
Query: `page`, `limit`, `search`, `ideation_id`.

### Scripts — `POST /api/v1/scripts/generate`
Body: `{ideation_id: "uuid", language: "en"|"id"}`. Calls AI in the specified language, creates script, updates ideation status to "Script Generated". `language` defaults to `"en"` (English); `"id"` produces Bahasa Indonesia output.

### Scripts — `GET /api/v1/scripts/{id}`

### Scripts — `PUT /api/v1/scripts/{id}`
Update any text sections.

### Scripts — `DELETE /api/v1/scripts/{id}`

### Scripts — `GET /api/v1/scripts/{id}/export`
Query: `format=txt|md|pdf`. Returns file download response.

---

## 10. Backend Implementation Notes

### AI Service (`ai_service.py`)

Supports two SDK paths:
- **Claude**: `anthropic.Anthropic(api_key=...).messages.create(model=..., system=..., messages=[{role:"user", content:...}])`
- **OpenAI-compatible** (ChatGPT, Ollama, Kimi): `openai.OpenAI(api_key=..., base_url=...).chat.completions.create(...)`

All AI calls return a string; callers parse it as JSON with a fallback for malformed responses.

### Prompt Design

**Ideation prompt:** Instructs AI to return a JSON array of 7 objects with keys: `title`, `hook`, `content_summary`, `cta`, `upload_date`, `upload_time`, `platform`. System prompt enforces JSON-only output.

**Script prompt:** Instructs AI to return a JSON object with keys: `hook_opening`, `scenes`, `broll_suggestions`, `caption_suggestion`, `cta_ending`, `hashtags`, and optionally `version_15s`, `version_30s`, `version_long`.

### Language-Aware Script Generation

The script system prompt is built by `_build_script_system(language: str)` which appends a language instruction block:

| `language` | Instruction injected into system prompt |
|----------|----------------------------------------|
| `"en"` | "Write the entire script in English. Use natural, engaging English suited for the target platform." |
| `"id"` | "Tulis seluruh skrip dalam Bahasa Indonesia. Gunakan bahasa Indonesia yang natural, santai, dan sesuai platform target. Pastikan caption, hashtag, dan semua bagian menggunakan Bahasa Indonesia." |

The `language` field is passed through the API request → `script_service.generate_script_from_ideation()` → `ai_service.generate_script_for_ideation()` → `_build_script_system(language)`.

### PDF Export (reportlab)

Build a `SimpleDocTemplate` with section headings and paragraphs for each script field. Stream response as `application/pdf` with `Content-Disposition: attachment`.

### Admin Role Check

New `require_admin` dependency in `middleware/auth.py`:
```python
def require_admin(user_id=Depends(get_current_user), db=Depends(get_db)) -> str:
    from app.services.auth_service import _get_user_roles
    roles = _get_user_roles(db, UUID(user_id))
    if "admin" not in roles:
        raise HTTPException(403, "Admin access required")
    return user_id
```

---

## 11. Frontend Implementation Notes

### Segmented Toggle
```tsx
<div className="flex bg-gray-100 p-1 rounded-full">
  {['View','Edit'].map(m => (
    <button key={m}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode===m ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
      onClick={() => setMode(m)}>
      {m}
    </button>
  ))}
</div>
```

### LanguageToggle
Pill-style two-option toggle (`English` / `Bahasa`). Used in:
- **Ideation Detail page** — inline with the Generate Script button; persists for the session
- **Ideation Table row** — shown inline after clicking the "Script" button; user picks language then clicks "Go"

Exports `Language = "en" | "id"` type used by both callsites.

### BulkActionBar
Fixed bottom bar, only visible when `selectedIds.length > 0`. Z-index above table footer.

### Status colors
| Status | Classes |
|--------|---------|
| Draft | `bg-gray-100 text-gray-600` |
| Approved | `bg-green-100 text-green-700` |
| Script Generated | `bg-blue-100 text-blue-700` |
| Published | `bg-indigo-100 text-indigo-700` |

---

## 12. Acceptance Criteria

| # | Criteria | Verified By |
|---|----------|-------------|
| 1 | Admin can set active AI provider and API key at `/admin/ai-config` | UI + API test |
| 2 | Non-admin cannot access `/admin/ai-config` (403 from API) | Role check |
| 3 | AI generates exactly 7 ideation items with all required fields | End-to-end |
| 4 | Generated items appear in ideation list with status = Draft | Visual |
| 5 | Manual ideation creation saves and appears in list | Form test |
| 6 | View/Edit toggle switches modes without page reload | Visual |
| 7 | Search, filter by status, sort by date all work correctly | UI test |
| 8 | Bulk delete removes selected items; bulk status update changes their status | Interaction test |
| 9 | "Generate Script" creates a script and updates ideation status to "Script Generated" | End-to-end |
| 10 | Script export works for .txt, .md, PDF, and copy to clipboard | Download test |
| 11 | All endpoints return 401 without a valid token | API test |
| 12 | Admin menu only visible to users with admin role | Role-based UI check |
| 13 | Language toggle (English / Bahasa) on script generation produces output in the selected language | End-to-end |

---

## 13. Future Scope (Not in This PR)

- Per-user AI provider preferences
- Prompt customization (user edits the system prompt)
- Content calendar view (weekly/monthly grid)
- Script version history
- Collaboration comments on ideations
- Direct social media publishing integration
