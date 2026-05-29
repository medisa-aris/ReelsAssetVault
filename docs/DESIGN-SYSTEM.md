# ReelsAssetVault — Enterprise Design Document

> **Based on:** PRD-001 through PRD-005  
> **Design System:** IBM Carbon Design System  
> **Standard:** RBAC + FBAC Authorization Model  
> **Last Updated:** 2026-05-29  
> **Author:** Design Specialist · AI-assisted  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Personas & Authorization Model](#2-user-personas--authorization-model)
3. [Information Architecture](#3-information-architecture)
4. [Menu Taxonomy](#4-menu-taxonomy)
5. [Role & Permission Matrix](#5-role--permission-matrix)
6. [Process Flows](#6-process-flows)
7. [Step-by-Step UX Flows](#7-step-by-step-ux-flows)
8. [Wireframe Specifications](#8-wireframe-specifications)
9. [IBM Carbon Component Mapping](#9-ibm-carbon-component-mapping)
10. [Validation Matrix](#10-validation-matrix)
11. [Database-Driven Configuration Requirements](#11-database-driven-configuration-requirements)
12. [API Reference Summary](#12-api-reference-summary)
13. [Audit Requirements](#13-audit-requirements)
14. [Error Handling Strategy](#14-error-handling-strategy)
15. [Accessibility Considerations](#15-accessibility-considerations)
16. [Carbon Migration Roadmap](#16-carbon-migration-roadmap)

---

## 1. System Overview

### 1.1 Product Summary

**ReelsAssetVault** is a multi-user digital asset management platform for short-form video content creators and teams. It covers the complete content production pipeline:

```
[Register / Login] → [Upload Assets] → [Ideate Content] → [Script Writing] → [Schedule Publishing]
     PRD-001              PRD-002           PRD-003            PRD-003             PRD-005
                                                 ↑
                                         [Video Viewer]
                                           PRD-004
```

### 1.2 Business Objectives

| Module | Business Goal | Success Metric |
|--------|--------------|----------------|
| Auth (PRD-001) | Secure, role-gated access | Zero unauthorized access incidents |
| Video Assets (PRD-002) | Central shared asset library | Asset retrieval time < 5 seconds |
| AI Ideation/Script (PRD-003) | 10× content planning speed | 7 ideas generated in < 30 seconds |
| Video Viewer (PRD-004) | In-app content review | Eliminates context-switching to external players |
| Publish Schedule (PRD-005) | Structured publish pipeline with approval gate | 100% of published posts have reviewer sign-off |

### 1.3 Technology Stack

| Layer | Current | Carbon Upgrade Target |
|-------|---------|----------------------|
| Frontend | Next.js 14 + Tailwind CSS | Next.js 14 + `@carbon/react` |
| Design Tokens | Tailwind custom colors | Carbon Design Tokens (White/G10 theme) |
| Components | Custom hand-rolled | Carbon `DataTable`, `Modal`, `SidePanel`, etc. |
| Icons | Inline SVGs | `@carbon/icons-react` |
| Type scale | Tailwind `text-sm/base/lg` | Carbon type tokens (`body-01`, `heading-03`, etc.) |

---

## 2. User Personas & Authorization Model

### 2.1 Personas

#### Persona 1 — Content Creator (Viewer / Editor)
| Attribute | Detail |
|-----------|--------|
| Role | `viewer` (default on register) |
| Primary tasks | Upload videos, generate ideations, write scripts, create schedule entries, submit for review |
| Key pain point | Manually copying captions from notes to scheduling tools |
| Authorization level | CRUD on own content; read on all content; cannot approve |

#### Persona 2 — Content Reviewer
| Attribute | Detail |
|-----------|--------|
| Role | `reviewer` |
| Primary tasks | Approve or reject publish schedule entries; view all schedules |
| Key pain point | No structured review queue — entries arrive via chat/email |
| Authorization level | All viewer capabilities + approve/reject workflow transitions |

#### Persona 3 — Platform Administrator
| Attribute | Detail |
|-----------|--------|
| Role | `admin` |
| Primary tasks | Configure AI providers; manage user roles; all reviewer capabilities |
| Key pain point | AI provider keys stored as plain environment variables |
| Authorization level | Full system access including configuration and user management |

#### Persona 4 — AI System (Non-human)
| Attribute | Detail |
|-----------|--------|
| Role | Internal service actor |
| Primary tasks | Generate ideation plans; generate scripts; return structured JSON |
| Governance | Provider, model, prompt template, token limits all DB-configured by admin |

### 2.2 Authorization Model

```
RBAC (Role-Based)     FBAC (Function-Based)
──────────────────    ──────────────────────────────────────────
admin                 ASSET:READ, ASSET:WRITE, ASSET:DELETE
reviewer              IDEATION:READ, IDEATION:WRITE, IDEATION:APPROVE
viewer (default)      SCRIPT:READ, SCRIPT:WRITE
                      SCHEDULE:READ, SCHEDULE:WRITE, SCHEDULE:SUBMIT
                      SCHEDULE:APPROVE, SCHEDULE:REJECT
                      AI:GENERATE
                      ADMIN:AI_CONFIG, ADMIN:USER_MANAGE
```

---

## 3. Information Architecture

### 3.1 Module Hierarchy

```
ReelsAssetVault
├── Authentication
│   ├── Login                   /login
│   └── Register                /register
│
├── Video Library (PRD-002, PRD-004)
│   ├── Asset List              /video
│   ├── Upload Asset            /video/upload
│   └── [Video Viewer Modal]    (in-page, no route)
│
├── Script (PRD-003)
│   ├── Ideation
│   │   ├── Ideation List       /script/ideation
│   │   ├── Create Ideation     /script/ideation/create
│   │   ├── AI Generate         /script/ideation/generate
│   │   └── Ideation Detail     /script/ideation/[id]
│   └── Scripts
│       ├── Script List         /script/scripts
│       └── Script Detail       /script/scripts/[id]
│
├── Production (PRD-005)
│   └── Publish Schedule
│       ├── Schedule List       /production/schedule
│       ├── Create Schedule     /production/schedule/create
│       └── Schedule Detail     /production/schedule/[id]
│
└── Admin (admin role only)
    └── AI Configuration        /admin/ai-config
```

### 3.2 Data Entity Relationships

```
app_user ──────────────────────────────────────────────────────────┐
  │                                                                  │
  ├──< app_user_roles >──── app_roles                               │
  │                                                                  │
  ├──< app_asset                                                     │
  │       └──< app_asset_tags >──── app_tag                         │
  │                                                                  │
  ├──< app_ideation                                                  │
  │       └──< app_ideation_tags >──── app_tag                      │
  │                                                                  │
  ├──< app_script                                                    │
  │       └── ideation_id FK → app_ideation                         │
  │                                                                  │
  ├──< app_publish_schedule                                          │
  │       ├── asset_id FK → app_asset (SET NULL)                    │
  │       ├── ideation_id FK → app_ideation (SET NULL)              │
  │       ├── script_id FK → app_script (SET NULL)                  │
  │       └── approved_by FK → app_user (SET NULL)                  │
  │                                                                  │
  └──< app_ai_config (global, not per-user) ─────────────────────┘
```

---

## 4. Menu Taxonomy

### 4.1 Navigation Structure

| Code | Name | Parent | Order | Required Permission | Visible To | Route |
|------|------|--------|-------|--------------------|-----------:|-------|
| `NAV-VIDEO` | Video | root | 1 | `ASSET:READ` | All authenticated | — |
| `NAV-VIDEO-LIST` | List Video | NAV-VIDEO | 1 | `ASSET:READ` | All authenticated | `/video` |
| `NAV-VIDEO-UPLOAD` | Upload | NAV-VIDEO | 2 | `ASSET:WRITE` | All authenticated | `/video/upload` |
| `NAV-SCRIPT` | Script | root | 2 | `IDEATION:READ` | All authenticated | — |
| `NAV-SCRIPT-IDEATION` | Ideation | NAV-SCRIPT | 1 | `IDEATION:READ` | All authenticated | `/script/ideation` |
| `NAV-SCRIPT-SCRIPTS` | Scripts | NAV-SCRIPT | 2 | `SCRIPT:READ` | All authenticated | `/script/scripts` |
| `NAV-PRODUCTION` | Production | root | 3 | `SCHEDULE:READ` | All authenticated | — |
| `NAV-PROD-SCHEDULE` | Publish Schedule | NAV-PRODUCTION | 1 | `SCHEDULE:READ` | All authenticated | `/production/schedule` |
| `NAV-ADMIN` | Admin | root | 4 | `ADMIN:AI_CONFIG` | admin only | — |
| `NAV-ADMIN-AI` | AI Config | NAV-ADMIN | 1 | `ADMIN:AI_CONFIG` | admin only | `/admin/ai-config` |

### 4.2 Carbon Navigation Component

**Current implementation** uses a custom `Navigation.tsx` with dropdown menus.  
**Carbon target:** `Header` + `HeaderNavigation` + `HeaderMenu` + `HeaderMenuItem`

```tsx
// Carbon target pattern
<Header aria-label="ReelsAssetVault">
  <HeaderName href="/">ReelsAssetVault</HeaderName>
  <HeaderNavigation>
    <HeaderMenu aria-label="Video" menuLinkName="Video">
      <HeaderMenuItem href="/video">List Video</HeaderMenuItem>
      <HeaderMenuItem href="/video/upload">Upload</HeaderMenuItem>
    </HeaderMenu>
    <HeaderMenu aria-label="Script" menuLinkName="Script">
      <HeaderMenuItem href="/script/ideation">Ideation</HeaderMenuItem>
      <HeaderMenuItem href="/script/scripts">Scripts</HeaderMenuItem>
    </HeaderMenu>
    <HeaderMenu aria-label="Production" menuLinkName="Production">
      <HeaderMenuItem href="/production/schedule">Publish Schedule</HeaderMenuItem>
    </HeaderMenu>
    {isAdmin && (
      <HeaderMenu aria-label="Admin" menuLinkName="Admin">
        <HeaderMenuItem href="/admin/ai-config">AI Config</HeaderMenuItem>
      </HeaderMenu>
    )}
  </HeaderNavigation>
  <HeaderGlobalBar>
    <HeaderGlobalAction aria-label={user.full_name}>
      <UserAvatar20 />
    </HeaderGlobalAction>
    <HeaderGlobalAction aria-label="Logout" onClick={logout}>
      <Logout20 />
    </HeaderGlobalAction>
  </HeaderGlobalBar>
</Header>
```

---

## 5. Role & Permission Matrix

### 5.1 Feature-Level Permissions

| Permission | viewer | reviewer | admin |
|------------|:------:|:--------:|:-----:|
| **Assets** | | | |
| View all assets | ✓ | ✓ | ✓ |
| Upload asset | ✓ | ✓ | ✓ |
| Edit asset metadata | ✓ | ✓ | ✓ |
| Delete asset | ✓ | ✓ | ✓ |
| Play video (viewer modal) | ✓ | ✓ | ✓ |
| **Ideation** | | | |
| View ideations | ✓ | ✓ | ✓ |
| Create ideation (manual) | ✓ | ✓ | ✓ |
| Generate ideation (AI) | ✓ | ✓ | ✓ |
| Edit ideation | ✓ | ✓ | ✓ |
| Delete ideation | ✓ | ✓ | ✓ |
| Bulk delete / bulk status | ✓ | ✓ | ✓ |
| Approve ideation status | ✓ | ✓ | ✓ |
| **Scripts** | | | |
| View scripts | ✓ | ✓ | ✓ |
| Generate script (AI) | ✓ | ✓ | ✓ |
| Edit script | ✓ | ✓ | ✓ |
| Delete script | ✓ | ✓ | ✓ |
| Export script (txt/md/pdf) | ✓ | ✓ | ✓ |
| **Publish Schedule** | | | |
| View schedules | ✓ | ✓ | ✓ |
| Create schedule entry | ✓ | ✓ | ✓ |
| Edit schedule (Draft/Rejected) | ✓ | ✓ | ✓ |
| Edit schedule (Approved/Scheduled/Published) | ✗ | ✗ | ✗ |
| Delete schedule (Draft/Rejected) | ✓ | ✓ | ✓ |
| Delete schedule (Approved/Scheduled/Published) | ✗ | ✗ | ✗ |
| Submit for review | ✓ | ✓ | ✓ |
| **Approve** schedule | ✗ | ✓ | ✓ |
| **Reject** schedule | ✗ | ✓ | ✓ |
| Mark Scheduled / Published | ✗ | ✓ | ✓ |
| **Administration** | | | |
| View AI config | ✗ | ✗ | ✓ |
| Update AI provider config | ✗ | ✗ | ✓ |
| Activate AI provider | ✗ | ✗ | ✓ |
| Test AI connection | ✗ | ✗ | ✓ |
| Manage users / assign roles | ✗ | ✗ | ✓ (future) |

### 5.2 UI-Level Permission Enforcement

| UI Element | Rule | Implementation |
|------------|------|----------------|
| Admin nav menu | Hidden for non-admin | `user.roles.includes('admin')` |
| Approve / Reject buttons | Hidden for viewer | `isApprover` prop from role check |
| Mark Scheduled / Published | Hidden for viewer | Same `isApprover` gate |
| Edit form | Disabled if status locked | `LOCKED_STATUSES = {Approved, Scheduled, Published}` |
| Delete button | Hidden if status locked | Same lock check |
| AI Generate button | Disabled if no active AI config | Backend 400 propagated as error |

---

## 6. Process Flows

### 6.1 Authentication Flow (PRD-001)

```
User arrives at protected route
        │
        ▼
  Token in cookie?
   /     \
 YES      NO
  │        │
  ▼        ▼
 Allow   Redirect → /login
  access      │
              ▼
          Submit email + password
              │
          ┌───┴───────────────────┐
          │  Valid credentials?   │
          └──┬────────────────────┘
           YES │         │ NO
               ▼         ▼
          JWT issued   401 → "Invalid credentials"
          Stored in    (generic, no field hint)
          cookie
               │
               ▼
          Redirect → /video (home)
```

**SLA:** Login response < 500ms (bcrypt + DB query)

### 6.2 Content Pipeline Flow (PRD-002 → PRD-005)

```
[Upload Video] ──────────────────────────────────────────────────────────┐
     PRD-002                                                              │
        │                                                                 │
        ▼                                                                 │
[Generate Ideation] ─── AI Provider ─── 7 draft ideation items           │
     PRD-003                                                              │
        │                                                                 │
        ▼                                                                 │
[Approve Ideation] (status: Approved)                                     │
        │                                                                 │
        ▼                                                                 │
[Generate Script] ──── AI Provider ─── structured script JSON            │
     PRD-003                                                              │
        │                                                                 │
        ▼                                                                 │
[Create Schedule] ←───────────────────────────────────────────────── ────┘
     PRD-005         picks Asset + Ideation + Script
        │            pre-fills caption + hashtags
        │
        ▼
  status: Draft
        │
        ▼  [Submit for Review]
  status: Pending Review
        │
   ┌────┴─────────────────────────────┐
   │  Reviewer or Admin decision?     │
   └────┬────────────────────┬────────┘
  Approve                 Reject (+ reason required)
        │                        │
        ▼                        ▼
  status: Approved         status: Rejected
        │                        │
        │                        ▼
        │                  [Edit + Re-submit]
        │                        │
        ▼                        │
  [Mark Scheduled] ◄─────────────┘ (approver only)
  status: Scheduled
        │
        ▼
  [Mark Published] (approver only)
  status: Published
```

### 6.3 AI Generation Governance Flow (PRD-003)

```
User clicks "Generate"
        │
        ▼
Active AI config exists?
   /          \
 NO            YES
  │             │
  ▼             ▼
Error:       Fetch prompt template (DB)
"No AI       Apply user inputs
 config"     Send to provider API
configured        │
              ┌───┴──────────────────────┐
              │  API response valid JSON? │
              └──┬───────────────────────┘
             YES │          │ NO
                 ▼          ▼
           Parse + save   Error toast
           to DB          "AI generation failed"
                 │
                 ▼
           Redirect to ideation list
           (items status = Draft)
```

---

## 7. Step-by-Step UX Flows

### 7.1 PRD-001: Registration

| Step | Detail |
|------|--------|
| **Purpose** | Create a new user account |
| **Entry** | `/register` or "Create account" link on login page |
| **Fields** | Full Name (required), Email (required, unique), Password (required, min 8 chars + 1 uppercase + 1 digit) |
| **Validation** | Inline on blur: email format, password strength meter |
| **Business rule** | Email normalized to lowercase before uniqueness check |
| **On success** | JWT issued → redirect to `/video` |
| **On failure** | Inline error below field; "Email already registered" toast for duplicate |
| **Carbon components** | `Form`, `TextInput`, `PasswordInput` (with show/hide toggle), `Button` (primary), `InlineNotification` |

### 7.2 PRD-002: Upload Video

| Step | Detail |
|------|--------|
| **Purpose** | Ingest a new video asset into the shared library |
| **Entry** | "Add New Video" button on `/video` |
| **Step 1 — File selection** | Drag-drop zone or `FileUploader`; accepted: mp4/mov/avi/webm; max 500MB |
| **Step 2 — Auto-extraction** | Resolution, duration, file size auto-populate as read-only after file selected |
| **Step 3 — Metadata** | Title (required, max 255), Description (optional), Tags (multi-select from predefined list) |
| **Validation** | File type server-validated; title required; size ≤ 500MB |
| **Progress** | `InlineLoading` / upload progress bar during file transfer |
| **On success** | Redirect to `/video`; new row appears at top |
| **Error — wrong format** | "Unsupported file type. Please upload mp4, mov, avi, or webm." |
| **Error — size exceeded** | "File exceeds the 500MB limit." |
| **Carbon components** | `FileUploader`, `TextInput`, `TextArea`, `MultiSelect`, `ProgressBar`, `Button` |

### 7.3 PRD-002: Edit Asset Metadata

| Step | Detail |
|------|--------|
| **Purpose** | Correct or enrich asset metadata after upload |
| **Entry** | "Edit" button in `VideoTableRow` actions column |
| **UI** | `ComposedModal` with `ModalHeader`, `ModalBody`, `ModalFooter` |
| **Editable fields** | Title, Description, Tags |
| **Read-only** | Resolution, Duration, File Size, Upload Date |
| **On save** | `PUT /api/v1/assets/{id}` → table row updates; `updated_by_name` refreshed |
| **On cancel** | Modal closes, no changes |
| **Carbon components** | `ComposedModal`, `TextInput`, `TextArea`, `MultiSelect`, `StructuredList` (read-only metadata) |

### 7.4 PRD-003: AI Ideation Generation

| Step | Detail |
|------|--------|
| **Purpose** | Generate 7 content ideas for the week using AI |
| **Entry** | "Generate with AI" button on `/script/ideation` |
| **Step 1 — Inputs** | Niche/Topic, Target Audience, Platform (select), Posting Frequency, Tone/Style, Week Starting (date picker) |
| **Step 2 — Generate** | "Generate Plan" button triggers `POST /api/v1/ideations/generate` |
| **Loading state** | Full-button `InlineLoading` + disabled state; spinner in main content area |
| **Step 3 — Result** | 7 ideation cards appear with status = Draft; redirect to `/script/ideation` |
| **Error — no config** | `InlineNotification` kind="error": "No AI provider configured. Ask your admin to set up AI Config." |
| **Error — API timeout** | "Generation timed out. Please try again." |
| **Carbon components** | `Form`, `TextInput`, `TextArea`, `Select`, `DatePicker`, `Button`, `InlineLoading`, `InlineNotification` |

### 7.5 PRD-005: Create Publish Schedule

| Step | Detail |
|------|--------|
| **Purpose** | Assemble one post's complete package (asset + ideation + script + date) |
| **Entry** | "New Schedule" button on `/production/schedule` |
| **Step 1 — Asset** | Picker modal: searchable grid of video assets with thumbnails |
| **Step 2 — Ideation** | Picker modal: searchable list of ideations with status badges |
| **Step 3 — Script** | Picker modal: list of scripts; selecting auto-fills Caption + Hashtags |
| **Step 4 — Date/Time** | Date (min = today) + Time (default 09:00) |
| **Step 5 — Caption** | Pre-filled from script; user-editable; `TextArea` |
| **Step 6 — Hashtags** | Pre-filled from script; user-editable; `TextInput` |
| **Step 7 — Notes** | Optional internal notes; `TextArea` |
| **On save** | `POST /api/v1/production/schedules` → redirect to detail; status = Draft |
| **Validation** | scheduled_date ≥ today (server + client) |
| **Carbon components** | `ComposedModal` (pickers), `DatePicker`, `TimePicker`, `TextArea`, `TextInput`, `Button` |

### 7.6 PRD-005: Schedule Review Workflow

| Step | Detail |
|------|--------|
| **Submit (any user)** | "Submit for Review" → `PATCH /schedules/{id}/submit` → status: Pending Review |
| **Approve (reviewer/admin)** | "Approve" button visible when status = Pending Review AND user has approver role |
| **Reject (reviewer/admin)** | "Reject" opens a `Modal` with required reason field → `PATCH /schedules/{id}/reject` |
| **Re-submit** | Rejected entry editable; "Submit for Review" clears rejection_reason |
| **Mark Scheduled** | Available after Approved; approver only; `PATCH /schedules/{id}/status {status: "Scheduled"}` |
| **Mark Published** | Available after Scheduled; approver only; `PATCH /schedules/{id}/status {status: "Published"}` |
| **Lock enforcement** | PUT/DELETE blocked at Approved/Scheduled/Published → 409 → toast notification |
| **Carbon components** | `InlineNotification`, `Modal` (reject reason), `Button`, `Tag` (status) |

---

## 8. Wireframe Specifications

### SCR-001: Login Page (`/login`)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                   ReelsAssetVault                           │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │                  Sign In                             │  │
│   │                                                      │  │
│   │  Email address                                       │  │
│   │  ┌────────────────────────────────────────────────┐  │  │
│   │  │ user@example.com                               │  │  │
│   │  └────────────────────────────────────────────────┘  │  │
│   │                                                      │  │
│   │  Password                                            │  │
│   │  ┌────────────────────────────────────────────────┐  │  │
│   │  │ ••••••••••                              [Show] │  │  │
│   │  └────────────────────────────────────────────────┘  │  │
│   │                                                      │  │
│   │  [▸ Sign In ──────────────────────────────────────]  │  │
│   │                                                      │  │
│   │  Don't have an account? Create one →                 │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Attribute | Value |
|-----------|-------|
| Screen ID | SCR-001 |
| Module | Authentication |
| Actors | Unauthenticated user |
| Permissions | Public |
| Carbon components | `Form`, `TextInput`, `PasswordInput`, `Button (primary)`, `Link` |
| Empty state | N/A |
| Error state | `InlineNotification` kind="error" below form: "Invalid credentials" |
| Responsive | Single column, centered card; max-width 400px |
| Accessibility | `aria-label` on all inputs; autofocus on email field; Enter submits form |

---

### SCR-002: Video Library (`/video`)

```
┌─ Carbon Header ──────────────────────────────────────────────────────────────┐
│  ReelsAssetVault  [Video ▾] [Script ▾] [Production ▾] [Admin ▾]  Alice  ⎋   │
└──────────────────────────────────────────────────────────────────────────────┘
│
│  Video Library                                          [+ Add New Video]
│  12 videos
│
│  ┌──────────────────────────────────────────────────────────────────────────┐
│  │ □ │ Snapshot │ Title           │ Resolution │ Size    │ Duration │ Date   │ By     │ Actions  │
│  ├───┼──────────┼─────────────────┼────────────┼─────────┼──────────┼────────┼────────┼──────────┤
│  │ □ │ [thumb ▶]│ Weekend Coding  │ 2160×3840  │ 125.8MB │ 0:27     │May 28 │ Alice  │ [Edit]   │
│  │ □ │ [thumb ▶]│ Product Launch  │ 1920×1080  │  24.5MB │ 0:45     │May 27 │ Bob    │ [Edit]   │
│  ├───┴──────────┴─────────────────┴────────────┴─────────┴──────────┴────────┴────────┴──────────┤
│  │                                            Page 1 of 1    [< Prev]  [Next >]                   │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Attribute | Value |
|-----------|-------|
| Screen ID | SCR-002 |
| Module | Video Assets |
| Actors | All authenticated users |
| Permissions | `ASSET:READ` |
| Carbon components | `DataTable`, `TableHead`, `TableRow`, `TableCell`, `TableToolbar`, `Pagination`, `Button` |
| Empty state | `Tile` with centered icon + "No videos yet. Upload your first video." + `Button` |
| Loading state | `DataTableSkeleton` (full table skeleton) |
| Play overlay | Custom overlay on thumbnail cell; opens `VideoPlayerModal` |
| Responsive | Horizontal scroll on mobile; thumbnail col hides below 640px |
| Accessibility | `aria-label="Video Library"` on table; keyboard-navigable rows |

---

### SCR-003: Video Upload (`/video/upload`)

```
┌─ Carbon Header ─────────────────────────────────────────────────────────────┐
│  ReelsAssetVault  [Video ▾] ...                                  Alice  ⎋   │
└─────────────────────────────────────────────────────────────────────────────┘
│
│  ← Video Library        Upload New Video
│
│  ┌─────────────────────────────────────────────────────────────────────────┐
│  │                                                                          │
│  │         ┌──────────────────────────────────────────────────────────┐    │
│  │         │                                                            │   │
│  │         │    📁  Drag and drop your video file here                 │   │
│  │         │         or [Browse Files]                                  │   │
│  │         │         Supported: mp4, mov, avi, webm · Max 500MB       │   │
│  │         └──────────────────────────────────────────────────────────┘   │
│  │                                                                          │
│  │  ── Auto-detected ──────────────────────────────                        │
│  │  Resolution   1920×1080          Duration   0:45                        │
│  │  File Size    24.5 MB                                                    │
│  │                                                                          │
│  │  ── Metadata ───────────────────────────────────                        │
│  │  Title *      [Product Launch Demo                                ]      │
│  │  Description  [______________________________________________________]   │
│  │               [______________________________________________________]   │
│  │  Tags         [▾ Reels  ×] [▾ Product Demo  ×]  [+ Add tag...]         │
│  │                                                                          │
│  │                           [Cancel]  [▸ Upload Video]                    │
│  └─────────────────────────────────────────────────────────────────────────┘
```

| Attribute | Value |
|-----------|-------|
| Screen ID | SCR-003 |
| Module | Video Assets |
| Carbon components | `FileUploader`, `StructuredList` (auto-detected specs), `TextInput`, `TextArea`, `MultiSelect` (tags), `Button`, `ProgressBar` |
| Progress state | `ProgressBar` + percent label during upload |
| Error — wrong type | `InlineNotification` kind="error": "Unsupported file type" |
| Error — too large | `InlineNotification` kind="error": "File exceeds 500MB limit" |
| Accessibility | `aria-required="true"` on Title; `aria-live` on progress bar |

---

### SCR-004: Video Player Modal (PRD-004)

```
┌─ Backdrop (click to close) ─────────────────────────────────────────────────┐
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Weekend Coding Reel                                             [×]  │  │
│   │  2160×3840  ·  0:27  ·  125.8 MB                                     │  │
│   ├──────────────────────────────────────────────────────────────────────┤  │
│   │                                                                      │  │
│   │                                                                      │  │
│   │              [  ▶  VIDEO PLAYER AREA  16:9  ]                       │  │
│   │                                                                      │  │
│   │                                                                      │  │
│   ├──────────────────────────────────────────────────────────────────────┤  │
│   │  📄 a3d8c9f7.mp4                                              MP4   │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Attribute | Value |
|-----------|-------|
| Screen ID | SCR-004 |
| Module | Video Assets |
| Carbon components | `ComposedModal` wrapper (custom dark theme), `ModalHeader`, `ModalBody`, `ModalFooter` |
| Player | `react-player` (no `playing` controlled prop — user-controlled) |
| Close triggers | × button, backdrop click, Escape key |
| Error state | Error overlay inside player area with dismiss button |
| Accessibility | Focus trapped in modal; Escape closes; `aria-modal="true"` |

---

### SCR-005: Ideation List (`/script/ideation`)

```
┌─ Carbon Header ─────────────────────────────────────────────────────────────┐
┌──────────────────────────────────────────────────────────────────────────────┐
│  Ideation                       [Generate with AI]  [+ Create Manually]      │
│                                                                              │
│  [Search ideations...]  [Status ▾ All]  [Sort by ▾]      [Bulk Delete]      │
│                                                                              │
│  □ │ Title                          │ Platform  │ Date    │ Status    │ Actions │
│  ──┼────────────────────────────────┼───────────┼─────────┼───────────┼─────────│
│  □ │ Weekend Coding Lab Ideas       │ Instagram │ Jun 02  │ [Draft]   │ ⋯       │
│  □ │ Your 9-5 Is Building Something │ TikTok    │ Jun 03  │ [Approved]│ ⋯       │
│  ──────────────────────────────────────────────────────────────────────────────
│  3 selected  [Delete Selected]  [Change Status ▾]                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Attribute | Value |
|-----------|-------|
| Screen ID | SCR-005 |
| Carbon components | `DataTable` with `TableSelectAll`, `TableSelectRow`, `Search`, `Dropdown`, `Tag` (status), `OverflowMenu`, `Button`, `TableBatchActions` |
| Bulk action bar | `TableBatchActions` appears when rows selected |
| Status badges | `Tag` component: Draft=gray, Approved=green, Script Generated=blue, Published=teal |
| Empty state | `Tile`: "No ideations yet. Generate your first content plan." |

---

### SCR-006: AI Ideation Generator (`/script/ideation/generate`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ← Ideation          Generate Content Plan with AI                           │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Niche / Topic *   [DevOps and Cloud Computing for IT Professionals ] │   │
│  │                                                                      │   │
│  │  Target Audience   [Indonesian IT employees / SysAdmins             ] │   │
│  │  Platform *        [▾ Instagram                                     ] │   │
│  │  Posting Frequency [▾ 3x per week                                   ] │   │
│  │  Tone / Style      [Casual, Educational, Motivational               ] │   │
│  │  Week Starting *   [📅 2026-06-02                                   ] │   │
│  │  Output Language   [● English  ○ Bahasa Indonesia]                   │   │
│  │                                                                      │   │
│  │                     [Cancel]  [⟳ Generate Plan]                      │   │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ⟳  Generating your 7-day content plan...  (spinner)                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Attribute | Value |
|-----------|-------|
| Screen ID | SCR-006 |
| Carbon components | `Form`, `TextInput`, `TextArea`, `Select`, `DatePicker`, `RadioButtonGroup`, `Button`, `InlineLoading` |
| Loading state | Button replaced with `InlineLoading`; form fields disabled |
| Error state | `InlineNotification` kind="error" below form |

---

### SCR-007: Publish Schedule List (`/production/schedule`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Publish Schedule                                       [+ New Schedule]     │
│  Plan and track your content publishing pipeline                             │
│                                                                              │
│  [Search by caption...]  [Status ▾ All statuses]                            │
│                                                                              │
│  Asset  │ Caption / Ideation           │ Scheduled    │ Status        │ Actions    │
│  ───────┼──────────────────────────────┼──────────────┼───────────────┼────────────│
│  [img]  │ Weekend bukan cuma buat...   │ 2026-06-02   │ [Draft]       │ View Submit│
│         │ Ideation: Your 9-5 Is...     │ 09:00        │               │            │
│  [img]  │ OpenShift tutorial tips...   │ 2026-06-03   │ [Pending Rev] │ View       │
│         │ Asset: Sample reels          │ 09:00        │               │ Approve    │
│                                                                        │ Reject     │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Attribute | Value |
|-----------|-------|
| Screen ID | SCR-007 |
| Carbon components | `DataTable`, `Search`, `Dropdown` (status filter), `Tag` (6 status variants), `Button`, `Pagination` |
| Status colors | Draft=gray, Pending Review=yellow, Approved=green, Scheduled=blue, Published=teal, Rejected=red |

---

### SCR-008: Schedule Detail / Edit (`/production/schedule/[id]`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ← Publish Schedule     Schedule Detail     [Approved ▮]                    │
│                                                                              │
│  [View | Edit]  ← SegmentedControl (only shown if Draft or Rejected)         │
│                                                                              │
│  ┌─ Linked Content ──────────────────────────────────────────────────────┐  │
│  │  Asset:     [thumb] Weekend Coding Reel                               │  │
│  │  Ideation:  Your 9-5 Is Building Something Bigger                     │  │
│  │  Script:    OpenShift Weekend Lab Script                              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  Scheduled Date    2026-06-02        Scheduled Time  09:00                  │
│  Caption           Weekend bukan cuma buat rebahan...                        │
│  Hashtags          #OpenShift #WeekendCoding #TechLife...                   │
│  Approved By       medisa-aris        Approved At  2026-05-30 14:22         │
│                                                                              │
│  [Submit for Review]   [Approve]   [Reject]   [Mark Scheduled]              │
│                                             (approver only)  (approver only) │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Attribute | Value |
|-----------|-------|
| Screen ID | SCR-008 |
| Carbon components | `StructuredList` (view mode), `Form` (edit mode), `ContentSwitcher` (View/Edit toggle), `Tag`, `Button`, `Modal` (reject reason), `InlineNotification` |
| Lock behavior | Edit form hidden / read-only when status in {Approved, Scheduled, Published} |
| Reject modal | `ComposedModal` with required `TextArea` for reason |

---

### SCR-009: Admin — AI Config (`/admin/ai-config`)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  AI Provider Configuration                                                   │
│  Select and configure the active AI provider for content generation.         │
│                                                                              │
│  ┌─ Claude (Anthropic) ─────────────────────────── [Active ✓] [Edit] ──────┐ │
│  │  Model:    claude-opus-4-5                                               │ │
│  │  API Key:  ••••abcd                                                      │ │
│  │  Base URL: —                                                             │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ ChatGPT (OpenAI) ───────────────────────────── [Inactive] [Edit] ──────┐ │
│  │  Model:    gpt-4o                                                        │ │
│  │  API Key:  not set                                                       │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│  [Test Connection]                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Attribute | Value |
|-----------|-------|
| Screen ID | SCR-009 |
| Module | Administration |
| Permissions | `ADMIN:AI_CONFIG` (admin only) |
| Carbon components | `Tile` (per provider), `Tag` (Active/Inactive), `Button`, `SidePanel` (edit form), `PasswordInput` (API key), `InlineNotification` (test result) |

---

## 9. IBM Carbon Component Mapping

### 9.1 Current → Carbon Replacement Map

| Screen | Current Implementation | Carbon Target Component | Carbon Package |
|--------|----------------------|------------------------|----------------|
| Navigation bar | Custom `Navigation.tsx` with Tailwind | `Header`, `HeaderNavigation`, `HeaderMenu` | `@carbon/react` |
| Video library table | Custom table markup | `DataTable`, `TableToolbar`, `Pagination` | `@carbon/react` |
| Edit metadata | Custom modal + form | `ComposedModal`, `TextInput`, `TextArea`, `MultiSelect` | `@carbon/react` |
| Upload zone | Custom `VideoDropzone.tsx` | `FileUploader` | `@carbon/react` |
| Tag picker | Custom `TagInput.tsx` | `MultiSelect` | `@carbon/react` |
| Status badges | Custom `StatusBadge.tsx`, `ScheduleStatusBadge.tsx` | `Tag` with kind prop | `@carbon/react` |
| View/Edit toggle | Custom `SegmentedToggle.tsx` | `ContentSwitcher` | `@carbon/react` |
| Bulk action bar | Custom `BulkActionBar.tsx` | `TableBatchActions` | `@carbon/react` |
| Video player modal | Custom dark modal | `ComposedModal` (with dark class override) | `@carbon/react` |
| Reject reason modal | `prompt()` call | `ComposedModal` + `TextArea` | `@carbon/react` |
| AI generator form | Custom form fields | `Form` + Carbon inputs | `@carbon/react` |
| Script sections | Custom `ScriptSections.tsx` | `Accordion` + `AccordionItem` | `@carbon/react` |
| Ideation table | Custom `IdeationTable.tsx` | `DataTable` with `TableSelectAll` | `@carbon/react` |
| Picker modals | Custom `AssetPickerModal.tsx` etc. | `ComposedModal` + `Search` + `DataTable` | `@carbon/react` |
| Notifications | `alert()` calls | `ToastNotification` / `InlineNotification` | `@carbon/react` |
| Loading states | Ad-hoc spinners | `InlineLoading` / `DataTableSkeleton` | `@carbon/react` |
| Icons | Inline SVG paths | `@carbon/icons-react` (e.g. `Add20`, `Play20`, `Calendar20`) | `@carbon/icons-react` |

### 9.2 Carbon Design Tokens for Status Colors

```scss
// Replace custom Tailwind status colors with Carbon semantic tokens

// Draft → Gray
$status-draft: $gray-30;

// Pending Review → Yellow
$status-pending: $yellow-30;
.cds--tag--yellow { } // kind="warm-gray" or custom

// Approved → Green
$status-approved: $green-30;
.cds--tag--green { }

// Scheduled → Blue
$status-scheduled: $blue-30;
.cds--tag--blue { }

// Published → Teal
$status-published: $teal-30;
.cds--tag--teal { }

// Rejected → Red
$status-rejected: $red-30;
.cds--tag--red { }

// Ideation statuses
// Draft → gray, Approved → green, Script Generated → blue, Published → teal
```

### 9.3 Carbon Installation

```bash
npm install @carbon/react @carbon/icons-react
# Optional: Carbon Charts for future analytics
npm install @carbon/charts @carbon/charts-react
```

```tsx
// _app.tsx or layout.tsx
import '@carbon/react/scss/globals/scss/styles.scss';
// or CSS
import '@carbon/react/css/styles.css';
```

---

## 10. Validation Matrix

### 10.1 Authentication (PRD-001)

| Field | Type | Required | Format | Business Rule | Error Message | Severity |
|-------|------|----------|--------|--------------|---------------|----------|
| email | string | Yes | RFC 5322 email | Normalized to lowercase; unique in DB | "Please enter a valid email address" | Error |
| password | string | Yes | Min 8 chars, 1 uppercase, 1 digit | Never stored plain text | "Password must be at least 8 characters with one uppercase letter and one number" | Error |
| full_name | string | Yes | Non-empty | Max 255 chars | "Full name is required" | Error |
| email (login) | string | Yes | Valid email | Must exist in DB (no user enumeration) | "Invalid credentials" | Error |

### 10.2 Video Asset Upload (PRD-002)

| Field | Type | Required | Format | Business Rule | Error Message | Severity |
|-------|------|----------|--------|--------------|---------------|----------|
| file | File | Yes | mp4/mov/avi/webm | Max 500MB; MIME validated server-side | "Unsupported file type. Use mp4, mov, avi, or webm" | Error |
| title | string | Yes | Max 255 chars | Non-empty after trim | "Title is required" | Error |
| description | string | No | Max 1000 chars | — | — | — |
| tag_ids | UUID[] | No | Valid UUIDs from predefined list | Must exist in `app_tag` | "Invalid tag selected" | Error |

### 10.3 Publish Schedule (PRD-005)

| Field | Type | Required | Format | Cross-field Rule | Business Rule | Error Message | Severity |
|-------|------|----------|--------|-----------------|---------------|---------------|----------|
| scheduled_date | date | Yes | YYYY-MM-DD | — | Must be ≥ today | "Scheduled date must be today or in the future" | Error |
| scheduled_time | string | Yes | HH:MM | — | Default 09:00 | "Invalid time format" | Error |
| caption | string | No | Text | — | Pre-filled from script; editable | — | — |
| rejection_reason | string | Yes (on reject) | Non-empty | Only required when action=reject | Cannot approve AND provide rejection reason | "Rejection reason is required" | Error |
| status (advance) | string | Yes | Enum | Approved→Scheduled; Scheduled→Published only | Cannot skip states | "Invalid status transition" | Error |

### 10.4 AI Configuration (PRD-003)

| Field | Type | Required | Format | Business Rule | Error Message | Severity |
|-------|------|----------|--------|--------------|---------------|----------|
| provider | string | Yes | claude/chatgpt/ollama/kimi | Only one row active at a time | — | — |
| api_key | string | Conditional | Non-empty | Required for all except Ollama | "API key is required for this provider" | Error |
| model | string | Yes | Non-empty | Must be valid for the provider | "Model name is required" | Error |
| base_url | string | Conditional | Valid URL | Required for Ollama and Kimi | "Base URL is required for this provider" | Error |

---

## 11. Database-Driven Configuration Requirements

All values that MUST be configurable from the Administration module (no hardcoding):

### 11.1 AI Provider Configuration

| Config Key | Type | Admin Editable | Notes |
|------------|------|----------------|-------|
| Active AI provider | Enum(claude, chatgpt, ollama, kimi) | Yes | Single active row in `app_ai_config` |
| API key per provider | Encrypted string | Yes | Masked in UI (last 4 chars only) |
| Model name per provider | String | Yes | e.g. `claude-opus-4-5`, `gpt-4o` |
| Base URL per provider | URL | Yes | Required for Ollama, Kimi |
| Max tokens | Integer | Future | Currently hardcoded in prompt |
| Prompt template — ideation | Text | Future | Currently inline in `ai_service.py` |
| Prompt template — script | Text | Future | Currently inline in `ai_service.py` |

### 11.2 Status Enumerations (Currently Hardcoded — Should be DB-Driven)

| Enum | Values | Module | Priority |
|------|--------|--------|----------|
| Publish schedule status | Draft, Pending Review, Approved, Scheduled, Published, Rejected | Production | High |
| Ideation status | Draft, Approved, Script Generated, Published | Script | High |
| Workflow locked statuses | Approved, Scheduled, Published | Production | High |
| User role names | admin, reviewer, viewer, editor | Auth | Medium |

### 11.3 Predefined Tags (Seeded — Admin Manageable)

Tags in `app_tag` are seeded but should be manageable via Admin UI:

| Tag | Slug |
|-----|------|
| Product Demo | product-demo |
| Reels | reels |
| TikTok | tiktok |
| YouTube Shorts | youtube-shorts |
| Campaign | campaign |
| Tutorial | tutorial |
| Brand | brand |
| Archive | archive |
| Behind the Scenes | behind-the-scenes |
| Announcement | announcement |

### 11.4 System Parameters (Future Admin Config)

| Parameter | Current Value | Should be configurable |
|-----------|--------------|----------------------|
| Max upload file size | 500 MB | Yes |
| Accepted video formats | mp4/mov/avi/webm | Yes |
| Default pagination limit | 20 items/page | Yes |
| JWT expiry | 24 hours | Yes |
| Default schedule time | 09:00 | Yes |
| Default output language | Bahasa Indonesia | Yes |

---

## 12. API Reference Summary

### 12.1 Authentication (PRD-001)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/auth/register` | POST | Public | Register new user; returns JWT |
| `/api/v1/auth/login` | POST | Public | Login; returns JWT + roles |
| `/api/v1/auth/me` | GET | Bearer | Get current user profile |

### 12.2 Video Assets (PRD-002, PRD-004)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/assets` | GET | Bearer | Paginated asset list (all users) |
| `/api/v1/assets/upload` | POST | Bearer | Upload video + metadata |
| `/api/v1/assets/{id}` | GET | Bearer | Single asset detail |
| `/api/v1/assets/{id}` | PUT | Bearer | Update metadata |
| `/api/v1/assets/{id}` | DELETE | Bearer | Hard delete asset |
| `/api/v1/tags` | GET | Bearer | All active predefined tags |

### 12.3 AI Ideation & Scripts (PRD-003)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/ideations` | GET | Bearer | Paginated ideation list |
| `/api/v1/ideations` | POST | Bearer | Create manual ideation |
| `/api/v1/ideations/generate` | POST | Bearer | AI-generate 7 ideations |
| `/api/v1/ideations/{id}` | GET | Bearer | Single ideation |
| `/api/v1/ideations/{id}` | PUT | Bearer | Update ideation |
| `/api/v1/ideations/{id}` | DELETE | Bearer | Delete ideation |
| `/api/v1/ideations/bulk` | DELETE | Bearer | Bulk delete |
| `/api/v1/ideations/bulk-status` | PATCH | Bearer | Bulk status update |
| `/api/v1/scripts` | GET | Bearer | Paginated script list |
| `/api/v1/scripts/generate` | POST | Bearer | AI-generate script from ideation |
| `/api/v1/scripts/{id}` | GET | Bearer | Single script |
| `/api/v1/scripts/{id}` | PUT | Bearer | Update script sections |
| `/api/v1/scripts/{id}` | DELETE | Bearer | Delete script |
| `/api/v1/scripts/{id}/export` | GET | Bearer | Export as txt/md/pdf |
| `/api/v1/admin/ai-config` | GET | Bearer + admin | List all provider configs |
| `/api/v1/admin/ai-config/{id}` | PUT | Bearer + admin | Update provider config |
| `/api/v1/admin/ai-config/{id}/activate` | PATCH | Bearer + admin | Set as active provider |
| `/api/v1/admin/ai-config/test` | POST | Bearer + admin | Test connectivity |

### 12.4 Publish Schedule (PRD-005)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/v1/production/schedules` | GET | Bearer | Paginated schedule list |
| `/api/v1/production/schedules` | POST | Bearer | Create schedule entry |
| `/api/v1/production/schedules/{id}` | GET | Bearer | Single schedule |
| `/api/v1/production/schedules/{id}` | PUT | Bearer | Update (Draft/Rejected only) |
| `/api/v1/production/schedules/{id}` | DELETE | Bearer | Delete (Draft/Rejected only) |
| `/api/v1/production/schedules/{id}/submit` | PATCH | Bearer | Submit for review |
| `/api/v1/production/schedules/{id}/approve` | PATCH | Bearer + approver | Approve entry |
| `/api/v1/production/schedules/{id}/reject` | PATCH | Bearer + approver | Reject with reason |
| `/api/v1/production/schedules/{id}/status` | PATCH | Bearer + approver | Advance to Scheduled/Published |

---

## 13. Audit Requirements

### 13.1 Audit Fields Per Entity

| Entity | Created By | Updated By | Approved By / At | AI Generated Flag | Notes |
|--------|-----------|-----------|-----------------|------------------|-------|
| `app_asset` | `user_id` | `updated_by` | — | — | upload event |
| `app_ideation` | `user_id` | `updated_by` | — | `is_ai_generated` | generation source |
| `app_script` | `user_id` | `updated_by` | — | `is_ai_generated` | generation source |
| `app_publish_schedule` | `user_id` | `updated_by` | `approved_by`, `approved_at` | — | full approval history |
| `app_ai_config` | — | `updated_by` | — | — | key rotation events |

### 13.2 Critical Actions Requiring Audit Trail

| Action | Fields Captured | Future Enhancement |
|--------|----------------|-------------------|
| Video upload | `user_id`, `created_at`, `filename`, `file_size_bytes` | SHA-256 file hash |
| Asset metadata edit | `updated_by`, `updated_at` | Field-level diff |
| AI generation (ideation) | `user_id`, `is_ai_generated=true`, `created_at` | Prompt log, token count |
| AI generation (script) | `user_id`, `is_ai_generated=true`, `created_at` | Prompt log, token count |
| Schedule approval | `approved_by`, `approved_at` | Notification sent to creator |
| Schedule rejection | `rejection_reason`, `updated_by`, `updated_at` | Rejection history |
| AI config change | `updated_by`, `updated_at` | Previous value captured |

---

## 14. Error Handling Strategy

### 14.1 Error Categories and Carbon Patterns

| Error Category | Trigger | Carbon Component | Behavior |
|----------------|---------|-----------------|----------|
| Form field validation | Blur / submit | `TextInput` invalid state + helper text | Inline, non-blocking |
| API 400 Bad Request | Form submit | `InlineNotification` kind="error" | Above form, dismissible |
| API 401 Unauthorized | Any request | Redirect to `/login` | Page-level redirect |
| API 403 Forbidden | Role-gated action | `InlineNotification` kind="error": "You don't have permission" | Toast or inline |
| API 404 Not Found | Direct URL | Full-page error state with Back button | Page-level |
| API 409 Conflict | Edit locked record | `ToastNotification` kind="error" | 3s auto-dismiss |
| API 422 Validation | Date in past, etc. | Field-level invalid + `InlineNotification` | Field inline |
| Network error | No connectivity | `ToastNotification` kind="error": "Connection error. Please try again." | Persistent until dismissed |
| AI generation failure | Provider error | `InlineNotification` kind="error" with provider-specific guidance | Above form |
| File upload failure | Disk / network | `FileUploaderItem` status="edit" with error message | Inline in uploader |

### 14.2 Recovery Guidance

| Error | User Action Available |
|-------|-----------------------|
| 401 on token expiry | Auto-redirect to login with "Session expired. Please sign in again." message |
| 409 on locked record | "This entry is locked. Contact a reviewer to make changes." |
| AI provider failure | Link to `/admin/ai-config` in error message (for admin) |
| Upload type mismatch | Show accepted formats; re-trigger file picker |
| Schedule date in past | Auto-reset to today's date with warning |

---

## 15. Accessibility Considerations

### 15.1 WCAG 2.1 AA Compliance Checklist

| Requirement | Current Status | Carbon Solution |
|-------------|---------------|-----------------|
| Color contrast 4.5:1 (text) | Tailwind colors vary | Carbon tokens guarantee AA compliance |
| Color contrast 3:1 (UI elements) | Varies | Carbon components built to spec |
| Keyboard navigation | Partial (custom components) | All Carbon components fully keyboard-accessible |
| Focus visible | Basic browser default | Carbon provides consistent focus ring via `$focus` token |
| Screen reader labels | Missing on icon buttons | `aria-label` on all `IconButton`; Carbon pattern |
| Modal focus trap | Missing in custom modals | `ComposedModal` traps focus automatically |
| Status conveyed by color alone | Status badges color-only | Add text label + `aria-label` to `Tag` components |
| Form field associations | Inconsistent | Carbon `TextInput` links `label` + `id` automatically |
| Live region for async | Missing | `aria-live="polite"` on loading/success areas |
| Skip navigation | Missing | Carbon `SkipToContent` component |

### 15.2 Screen-Specific Accessibility Notes

| Screen | Priority Fix |
|--------|-------------|
| Video player modal | `aria-modal="true"`, focus on close button on open |
| Bulk action bar | `aria-live="polite"` on selection count |
| AI generation | `aria-live="assertive"` when generation completes |
| Schedule status badges | `aria-label="Status: Draft"` (not just color) |
| Picker modals | Focus on search input on open; Escape closes |
| PasswordInput | Show/hide toggle with `aria-label` change |

---

## 16. Carbon Migration Roadmap

### 16.1 Phase 1 — Foundation (Week 1)

| Task | Files | Priority |
|------|-------|----------|
| Install `@carbon/react` + `@carbon/icons-react` | `package.json` | Critical |
| Replace global CSS with Carbon SCSS | `app/globals.css` | Critical |
| Replace `Navigation.tsx` with Carbon `Header` | `components/Navigation.tsx` | Critical |
| Replace all `alert()` calls with `ToastNotification` | All action handlers | Critical |
| Replace inline SVGs with `@carbon/icons-react` | All components | High |

### 16.2 Phase 2 — Tables & Lists (Week 2)

| Task | Files | Priority |
|------|-------|----------|
| Replace `VideoTable.tsx` with `DataTable` | `components/VideoTable.tsx` | High |
| Replace `IdeationTable.tsx` with `DataTable` + `TableBatchActions` | `components/IdeationTable.tsx` | High |
| Replace `ScheduleTable.tsx` with `DataTable` | `components/ScheduleTable.tsx` | High |
| Replace custom pagination with `Pagination` | All table components | High |

### 16.3 Phase 3 — Forms & Modals (Week 3)

| Task | Files | Priority |
|------|-------|----------|
| Replace `EditMetadataModal` with `ComposedModal` | `components/EditMetadataModal.tsx` | High |
| Replace `VideoPlayerModal` with Carbon modal wrapper | `components/VideoPlayerModal.tsx` | Medium |
| Replace `AssetPickerModal`, `IdeationPickerModal`, `ScriptPickerModal` | 3 modal files | Medium |
| Replace `TagInput.tsx` with `MultiSelect` | `components/TagInput.tsx` | High |
| Replace `VideoDropzone.tsx` with `FileUploader` | `components/VideoDropzone.tsx` | High |
| Replace `SegmentedToggle.tsx` with `ContentSwitcher` | `components/SegmentedToggle.tsx` | Medium |
| Replace `BulkActionBar.tsx` with `TableBatchActions` | `components/BulkActionBar.tsx` | High |

### 16.4 Phase 4 — Status & Feedback (Week 4)

| Task | Files | Priority |
|------|-------|----------|
| Replace `StatusBadge.tsx` with `Tag` | `components/StatusBadge.tsx` | Medium |
| Replace `ScheduleStatusBadge.tsx` with `Tag` | `components/ScheduleStatusBadge.tsx` | Medium |
| Add `InlineLoading` to all async buttons | All form pages | High |
| Add `DataTableSkeleton` to all list pages | All list pages | Medium |
| Add `SkipToContent` | `app/layout.tsx` | Medium |

### 16.5 Implementation Example — DataTable for Video Library

```tsx
// components/VideoTable.tsx — Carbon target
import {
  DataTable, TableContainer, Table, TableHead, TableRow,
  TableHeader, TableBody, TableCell, Pagination,
  DataTableSkeleton, TableToolbar, TableToolbarContent,
  Button
} from '@carbon/react';
import { Add } from '@carbon/icons-react';

const headers = [
  { key: 'thumbnail', header: 'Snapshot' },
  { key: 'title', header: 'Title' },
  { key: 'resolution', header: 'Resolution' },
  { key: 'file_size_bytes', header: 'Size' },
  { key: 'duration_seconds', header: 'Duration' },
  { key: 'created_at', header: 'Uploaded' },
  { key: 'updated_by_name', header: 'Last Updated By' },
  { key: 'actions', header: 'Actions' },
];

export default function VideoTable({ assets, loading, total, page, onPageChange }) {
  if (loading) return <DataTableSkeleton columnCount={8} rowCount={5} />;

  const rows = assets.map(a => ({
    id: a.id,
    thumbnail: a.thumbnail_url,
    title: a.title,
    resolution: a.width ? `${a.width}×${a.height}` : '—',
    file_size_bytes: formatFileSize(a.file_size_bytes),
    duration_seconds: a.duration_seconds ? formatDuration(a.duration_seconds) : '—',
    created_at: formatDate(a.created_at),
    updated_by_name: a.updated_by_name ?? '—',
    actions: a,
  }));

  return (
    <DataTable rows={rows} headers={headers}>
      {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
        <TableContainer>
          <TableToolbar>
            <TableToolbarContent>
              <Button renderIcon={Add} href="/video/upload">
                Add New Video
              </Button>
            </TableToolbarContent>
          </TableToolbar>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map(header => (
                  <TableHeader key={header.key} {...getHeaderProps({ header })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id} {...getRowProps({ row })}>
                  {row.cells.map(cell => (
                    <TableCell key={cell.id}>{cell.value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            totalItems={total}
            pageSize={20}
            page={page}
            onChange={({ page }) => onPageChange(page)}
          />
        </TableContainer>
      )}
    </DataTable>
  );
}
```

---

## Appendix A: File Structure After Carbon Migration

```
frontend/
├── app/
│   ├── layout.tsx              ← Add Carbon SCSS import + SkipToContent
│   ├── login/page.tsx          ← Carbon Form + TextInput + PasswordInput
│   ├── register/page.tsx       ← Carbon Form
│   ├── video/
│   │   ├── page.tsx            ← Carbon DataTable
│   │   └── upload/page.tsx     ← Carbon FileUploader + Form
│   ├── script/
│   │   ├── ideation/page.tsx   ← Carbon DataTable + TableBatchActions
│   │   └── scripts/page.tsx    ← Carbon DataTable
│   ├── production/
│   │   └── schedule/page.tsx   ← Carbon DataTable + Tag (status)
│   └── admin/
│       └── ai-config/page.tsx  ← Carbon Tile + SidePanel
│
├── components/
│   ├── Navigation.tsx          ← Carbon Header + HeaderNavigation
│   ├── VideoTable.tsx          ← Carbon DataTable
│   ├── ScheduleStatusBadge.tsx ← Carbon Tag
│   ├── StatusBadge.tsx         ← Carbon Tag
│   ├── SegmentedToggle.tsx     ← Carbon ContentSwitcher
│   ├── BulkActionBar.tsx       ← Carbon TableBatchActions
│   └── ...                     ← All others migrated per Phase 3
│
└── lib/
    └── carbon-theme.ts         ← Theme configuration (White / G10)
```

---

*Document Version: 1.0 | Status: Draft | Aligned with PRD-001 through PRD-005*
