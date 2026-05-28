# PRD-005: Production — Publish Schedule

| Field        | Value                                        |
|--------------|----------------------------------------------|
| Document ID  | PRD-005                                      |
| Feature      | Production — Publish Schedule                |
| Depends On   | PRD-001 (Auth), PRD-002 (Assets), PRD-003 (Script) |
| Status       | Draft                                        |
| Author       | medisa-aris                                  |
| Created      | 2026-05-28                                   |
| Last Updated | 2026-05-28                                   |

---

## 1. Overview

PRD-005 introduces the **Production** module — the final stage in the content pipeline. Users assemble a publish schedule entry by combining a video asset, an ideation item, and an approved script, then set a target date/time and caption. The entry moves through a review workflow before being marked Scheduled or Published. Only users with the **admin** or **reviewer** role may approve or reject entries.

---

## 2. Problem Statement

After content is ideated and scripted, there is no structured handoff from creative work to publishing:

- Creators have no single place to confirm which video + script combination goes live on which date
- There is no review gate to catch mistakes before a post goes out
- Captions and hashtags are copied manually from scripts into external tools
- No audit trail of who approved what and when

---

## 3. Goals

- Let users compose a publish schedule entry by selecting a **video**, an **ideation**, and an **approved script**, then setting **date / time / caption**
- Provide a **status workflow**: Draft → Pending Review → Approved → Scheduled → Published (plus Rejected)
- Gate approval/rejection behind the **admin** or **reviewer** role
- Pre-fill caption from the linked script's `caption_suggestion` field (editable)
- Display schedule entries in a sortable, filterable list with status badges
- Allow inline status updates for authorised users

---

## 4. Non-Goals (Out of Scope for This PR)

- Direct API publishing to Instagram, TikTok, or YouTube (integration is a future PRD)
- Automated publish at the scheduled time (no background job scheduler in this PR)
- Multi-platform posting from a single entry
- Calendar / Gantt view (future scope)
- Comment threads on entries

---

## 5. Navigation Structure

```
Top Navigation
├── Video         → existing
├── Script        → existing
├── Production    (new)
│   └── Publish Schedule  → /production/schedule
└── Admin         → existing (admin only)
```

The **Production** dropdown is visible to all authenticated users.

---

## 6. User Stories

### Create a Schedule Entry
> As a user, I want to pick a video, an ideation, and a script and set a publish date so that everything needed for one post is in one place.

**Acceptance Criteria:**
- "New Schedule" button opens a creation form
- User can search/select from the full video list
- User can search/select from the full ideation list
- User can search/select from the **approved-only** script list
- Caption field is pre-filled from the selected script's `caption_suggestion` (editable)
- Hashtags field is pre-filled from the selected script's `hashtags` (editable)
- Date and time fields are required; time defaults to 09:00
- Saved entry appears in the list with status = **Draft**

### Review Workflow
> As a reviewer or admin, I want to approve or reject schedule entries so that only quality-checked content gets scheduled.

**Acceptance Criteria:**
- Any user can submit a Draft entry for review (status → **Pending Review**)
- Only users with `admin` or `reviewer` role see the [Approve] / [Reject] buttons
- Approving sets status → **Approved**, records `approved_by` and `approved_at`
- Rejecting requires a rejection reason; sets status → **Rejected**, stores reason
- A rejected entry can be edited and re-submitted

### Status Management
> As a user, I want to see the current status of each schedule entry so I can track what's ready to publish.

**Acceptance Criteria:**
- Status badges visible in the list and detail views
- Authorised users can manually advance status to **Scheduled** or **Published** (post-approval)
- Status history not required (out of scope), but `approved_by` / `approved_at` are stored

---

## 7. UI Specification

### 7.1 Publish Schedule List (`/production/schedule`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Publish Schedule                              [+ New Schedule]      │
│  [Search...] [Status ▾] [Sort: Scheduled Date ▾]                    │
├──┬───────────────────┬──────────────────┬──────────────┬────────────┤
│  │ Video Snapshot    │ Title / Ideation │ Sched. Date  │ Status     │
├──┼───────────────────┼──────────────────┼──────────────┼────────────┤
│  │ [thumbnail]       │ 5 Tips for Reels │ 2026-06-01   │ Approved   │
│  │                   │ 5 Tips Ideation  │ 09:00        │            │
├──┼───────────────────┼──────────────────┼──────────────┼────────────┤
│  │ [thumbnail]       │ Morning Routine  │ 2026-06-02   │ Draft      │
└──┴───────────────────┴──────────────────┴──────────────┴────────────┘
[< Prev]  Page 1 of 2  [Next >]
```

Columns: Video Snapshot · Caption Title · Ideation Title · Scheduled Date & Time · Status · Actions (View / Edit / Delete)

For `admin` / `reviewer` rows in **Pending Review** state, Actions also shows **[Approve]** and **[Reject]**.

### 7.2 Create / Edit Form (`/production/schedule/create` and `[id]?mode=edit`)

```
┌──────────────────────────────────────────────────────────────────┐
│  New Publish Schedule                                             │
│  ──────────────────────────────────────────────────────────────  │
│  Video *           [Search and select video…        ▾]           │
│                    ┌────────┐                                     │
│                    │ thumb  │  Asset video sample reels capcut    │
│                    └────────┘  2160×3840 · 0:27 · 125.8 MB       │
│                                                                   │
│  Ideation          [Search and select ideation…     ▾]           │
│                                                                   │
│  Script            [Approved scripts only…          ▾]           │
│                    Shows: title + linked ideation name            │
│                                                                   │
│  Scheduled Date *  [2026-06-01]   Time *  [09:00]                │
│                                                                   │
│  Caption *         [____________________________________]         │
│                    (pre-filled from script caption_suggestion)    │
│                                                                   │
│  Hashtags          [____________________________________]         │
│                    (pre-filled from script hashtags)              │
│                                                                   │
│  Notes             [____________________________________]         │
│                                                                   │
│                           [Cancel]  [Save as Draft]               │
└──────────────────────────────────────────────────────────────────┘
```

### 7.3 Detail View (`/production/schedule/[id]`)

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Publish Schedule      [View] [Edit] ← segmented toggle        │
│                                                                   │
│  5 Tips for Creating Viral Reels                                  │
│  ──────────────────────────────────────────────────────────────  │
│  Status: [Pending Review]   Scheduled: 2026-06-01 at 09:00       │
│                                                                   │
│  VIDEO                                                            │
│  [thumbnail]  Asset video sample reels capcut  (▶ preview)       │
│                                                                   │
│  IDEATION      5 Tips for Creating Viral Reels                    │
│  SCRIPT        Script: Hook, Scenes, CTA…  (→ view script)       │
│                                                                   │
│  CAPTION                                                          │
│  Did you know 90% of Reels fail in the first 3 seconds?…         │
│                                                                   │
│  HASHTAGS   #reels #instagram #contentcreator                     │
│                                                                   │
│  NOTES      (optional)                                            │
│                                                                   │
│  ── Review ────────────────────────────────────────────────────  │
│  Approved by: —   Approved at: —                                  │
│                                                                   │
│  [Submit for Review]          (admin/reviewer only below)         │
│  [Approve]  [Reject]                                              │
└──────────────────────────────────────────────────────────────────┘
```

**Submit for Review** visible to all users when status is Draft or Rejected.
**Approve / Reject** visible only to `admin` and `reviewer` roles when status is Pending Review.

### 7.4 Status Badge Colours

| Status | Tailwind Classes |
|--------|-----------------|
| Draft | `bg-gray-100 text-gray-600` |
| Pending Review | `bg-yellow-100 text-yellow-700` |
| Approved | `bg-green-100 text-green-700` |
| Scheduled | `bg-blue-100 text-blue-700` |
| Published | `bg-indigo-100 text-indigo-700` |
| Rejected | `bg-red-100 text-red-600` |

---

## 8. Database Schema

### 8.1 New role seed: `reviewer`

Add a `reviewer` row to `app_roles` in migration `0004` if it does not already exist. The `reviewer` role can approve/reject schedule entries but has no access to Admin settings.

### 8.2 `app_publish_schedule`

```sql
CREATE TABLE app_publish_schedule (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Linked content (all nullable so a draft can be saved incomplete)
    asset_id          UUID         REFERENCES app_asset(id)     ON DELETE SET NULL,
    ideation_id       UUID         REFERENCES app_ideation(id)  ON DELETE SET NULL,
    script_id         UUID         REFERENCES app_script(id)    ON DELETE SET NULL,

    -- Scheduling
    scheduled_date    DATE         NOT NULL,
    scheduled_time    TIME         NOT NULL DEFAULT '09:00',

    -- Caption / copy
    caption           TEXT,
    hashtags          TEXT,
    notes             TEXT,

    -- Workflow
    status            VARCHAR(50)  NOT NULL DEFAULT 'Draft',
                      -- values: Draft | Pending Review | Approved | Scheduled | Published | Rejected
    rejection_reason  TEXT,
    approved_by       UUID         REFERENCES app_user(id)      ON DELETE SET NULL,
    approved_at       TIMESTAMPTZ,

    -- Audit
    user_id           UUID         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    updated_by        UUID         REFERENCES app_user(id),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_publish_schedule_status         ON app_publish_schedule(status);
CREATE INDEX idx_app_publish_schedule_scheduled_date ON app_publish_schedule(scheduled_date DESC);
CREATE INDEX idx_app_publish_schedule_user_id        ON app_publish_schedule(user_id);
```

---

## 9. API Endpoints

### `GET /api/v1/production/schedules`
Paginated list. Query params: `page`, `limit`, `search`, `status`, `sort_by` (scheduled_date|created_at), `sort_dir` (asc|desc).

### `POST /api/v1/production/schedules`
Create a new schedule entry. Body: `asset_id`, `ideation_id`, `script_id`, `scheduled_date`, `scheduled_time`, `caption`, `hashtags`, `notes`. All FKs nullable. Status defaults to `Draft`.

### `GET /api/v1/production/schedules/{id}`
Single entry with joined titles: `asset_title`, `ideation_title`, `script_title`, `asset_thumbnail_url`.

### `PUT /api/v1/production/schedules/{id}`
Update editable fields. Allowed only when status is `Draft` or `Rejected`.

### `DELETE /api/v1/production/schedules/{id}`
Delete. Allowed only when status is `Draft` or `Rejected`.

### `PATCH /api/v1/production/schedules/{id}/submit`
Moves status `Draft` → `Pending Review`. Any authenticated user.

### `PATCH /api/v1/production/schedules/{id}/approve`
Sets status → `Approved`, records `approved_by` and `approved_at`. **Requires `admin` or `reviewer` role.**

### `PATCH /api/v1/production/schedules/{id}/reject`
Body: `{reason: "..."}`. Sets status → `Rejected`, stores `rejection_reason`. **Requires `admin` or `reviewer` role.**

### `PATCH /api/v1/production/schedules/{id}/status`
Body: `{status: "Scheduled"|"Published"}`. Advance an Approved entry. **Requires `admin` or `reviewer` role.**

---

## 10. Backend Implementation Notes

### Role Dependency — `require_approver`

New dependency in `backend/app/middleware/auth.py` following the existing `require_admin` pattern:

```python
def require_approver(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> str:
    """Allows users with 'admin' or 'reviewer' role."""
    from app.models.role import AppRole
    from app.models.user_role import AppUserRole
    rows = (
        db.query(AppRole.name)
        .join(AppUserRole, AppUserRole.role_id == AppRole.id)
        .filter(AppUserRole.user_id == UUID(user_id))
        .all()
    )
    roles = [r.name for r in rows]
    if not {"admin", "reviewer"} & set(roles):
        raise HTTPException(403, "Approver access required (admin or reviewer role)")
    return user_id
```

### Script filter for selection

The `GET /api/v1/scripts` endpoint should support an optional `?approved_only=true` query param (or the frontend filters client-side from the full list) to limit the script picker to scripts whose linked ideation has status `Script Generated` or `Approved`.

> **Note:** `app_script` has no status field of its own. "Approved script" in this context means the **ideation** it belongs to has been approved — or simply any script that exists (since generating a script already validates the ideation). The frontend picker label reads "Approved Scripts" and filters to scripts where `ideation.status IN ('Approved', 'Script Generated', 'Published')`.

### Caption pre-fill

`POST /api/v1/production/schedules` — when `script_id` is provided, the service layer fetches `script.caption_suggestion` and `script.hashtags` and uses them as the initial values for `caption` and `hashtags` if the request body leaves those fields null.

---

## 11. Frontend Implementation Notes

### New Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/production/schedule` | `ScheduleListPage` | Table with filters, status badges, approve/reject actions |
| `/production/schedule/create` | `CreateSchedulePage` | Multi-select form: video picker, ideation picker, script picker |
| `/production/schedule/[id]` | `ScheduleDetailPage` | View/Edit toggle; shows linked asset thumbnail; approve/reject panel |

### New Components

| Component | Description |
|-----------|-------------|
| `AssetPickerModal.tsx` | Searchable modal listing assets with thumbnails; returns selected Asset |
| `IdeationPickerModal.tsx` | Searchable modal listing ideation items; returns selected Ideation |
| `ScriptPickerModal.tsx` | Searchable modal listing scripts (filtered); returns selected Script |
| `ScheduleStatusBadge.tsx` | Extended StatusBadge covering all 6 schedule statuses |
| `ApproveRejectPanel.tsx` | Conditional panel (approver role only): [Approve] button + [Reject] button with reason textarea |

### Role-gated UI

```typescript
const canApprove = user?.roles?.some(r => r === "admin" || r === "reviewer");
```

- `canApprove === true` → show `ApproveRejectPanel` and inline Approve/Reject in list rows
- `canApprove === false` → show only "Submit for Review" button when status is Draft/Rejected

### New Hook

`frontend/hooks/useSchedules.ts` — paginated + filtered list, mirrors `useIdeations.ts` pattern.

### Navigation update

Add `Production` dropdown to `Navigation.tsx` (visible to all authenticated users):
```tsx
<NavDropdown label="Production" active={!!pathname?.startsWith("/production")}>
  <DropdownLink href="/production/schedule" icon={CalendarIcon} pathname={pathname}>
    Publish Schedule
  </DropdownLink>
</NavDropdown>
```

---

## 12. Files Modified / Created

### Backend (new)
| File | Description |
|------|-------------|
| `backend/app/models/schedule.py` | `AppPublishSchedule` ORM model |
| `backend/app/schemas/schedule.py` | `ScheduleResponse`, `ScheduleCreateRequest`, `ScheduleUpdateRequest`, `ScheduleApproveRequest`, `ScheduleRejectRequest` |
| `backend/app/services/schedule_service.py` | CRUD + submit/approve/reject + caption pre-fill logic |
| `backend/app/api/v1/production.py` | REST endpoints (prefix `/api/v1/production`) |
| `database/migrations/versions/0004_create_publish_schedule.py` | Creates `app_publish_schedule`; seeds `reviewer` role |

### Backend (modified)
| File | Change |
|------|--------|
| `backend/app/models/__init__.py` | Export `AppPublishSchedule` |
| `backend/app/middleware/auth.py` | Add `require_approver` dependency |
| `backend/app/main.py` | Register `production.router` |
| `database/migrations/env.py` | Import `AppPublishSchedule` |

### Frontend (new)
| File | Description |
|------|-------------|
| `frontend/app/production/schedule/page.tsx` | Schedule list page |
| `frontend/app/production/schedule/create/page.tsx` | Create form |
| `frontend/app/production/schedule/[id]/page.tsx` | Detail / edit with approval panel |
| `frontend/components/AssetPickerModal.tsx` | Asset selection modal |
| `frontend/components/IdeationPickerModal.tsx` | Ideation selection modal |
| `frontend/components/ScriptPickerModal.tsx` | Script selection modal |
| `frontend/components/ScheduleStatusBadge.tsx` | 6-status badge component |
| `frontend/components/ApproveRejectPanel.tsx` | Approver actions panel |
| `frontend/hooks/useSchedules.ts` | Paginated + filtered schedules hook |

### Frontend (modified)
| File | Change |
|------|--------|
| `frontend/components/Navigation.tsx` | Add Production dropdown |
| `frontend/lib/types.ts` | Add `PublishSchedule`, `PublishScheduleListResponse`, `ScheduleStatus` types |

---

## 13. Acceptance Criteria

| # | Criteria | Verified By |
|---|----------|-------------|
| 1 | User can create a schedule entry selecting a video, ideation, and script | Form test |
| 2 | Caption and hashtags pre-filled from the selected script | Auto-fill test |
| 3 | New entry starts with status = Draft | Visual |
| 4 | User can submit a Draft entry for review (status → Pending Review) | Interaction test |
| 5 | Only admin/reviewer users see Approve and Reject buttons | Role-based UI check |
| 6 | Approving sets status → Approved, records approved_by and approved_at | API test |
| 7 | Rejecting requires a reason; sets status → Rejected with reason stored | Interaction test |
| 8 | Rejected entry can be edited and re-submitted | End-to-end |
| 9 | Admin/reviewer can advance status to Scheduled or Published | Role-based test |
| 10 | Non-approver receives 403 on approve/reject endpoints | API test |
| 11 | Schedule list supports search, filter by status, sort by scheduled date | UI test |
| 12 | Linked asset thumbnail visible in list and detail view | Visual |
| 13 | Production navigation item visible to all authenticated users | UI check |
| 14 | All endpoints return 401 without a valid token | API test |

---

## 14. Future Scope

- Automated publish via platform APIs (Instagram Graph API, TikTok Content API)
- Scheduled job that auto-advances status to Published at the scheduled time
- Content calendar view (weekly grid) across all schedule entries
- Multi-platform selection per entry (one post → Instagram + TikTok)
- Bulk approve / bulk schedule from the list view
- Notification system (email or in-app) when an entry is approved or rejected
