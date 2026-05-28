# TST-003: AI Ideation & Scriptwriting — Test Cases

| Field        | Value                                  |
|--------------|----------------------------------------|
| Document ID  | TST-003                                |
| Covers       | PRD-003 AI Ideation & Scriptwriting    |
| Author       | medisa-aris                            |
| Created      | 2026-05-28                             |
| Last Updated | 2026-05-28                             |

---

## Test Classification Key

| Type | Meaning |
|------|---------|
| **TP** | Valid input → system accepts → **PASS expected** |
| **TN** | Invalid input → system rejects → **PASS expected** |
| **FP** | Invalid input → system accepts → **BUG** (too permissive) |
| **FN** | Valid input → system rejects → **BUG** (too restrictive) |

---

## ── IDEATION GENERATION ───────────────────────────────────────────

## TC-001 — Generate 7-Day Ideation Plan (English)

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-001 |
| **Type** | TP |
| **Category** | Ideation — AI Generation |

**Preconditions:** Admin has configured and activated an AI provider in `/admin/ai-config`. API key is valid.

**Steps:**
1. `POST /api/v1/ideations/generate` with `{ niche: "Fitness", target_audience: "Young adults", platform: "Instagram", posting_frequency: "Daily", tone_style: "Motivational", week_starting: "2026-06-01" }`.

**Expected Result:** `201 Created`; response contains `items` array of exactly **7** ideation objects, each with `title`, `hook`, `content_summary`, `cta`, `upload_date` (Mon–Sun of the week), `upload_time`, `platform`.

**Pass Criteria:** `items.length === 7`; all required fields populated; all `status === "Draft"`.

---

## TC-002 — Generate Ideation with No Active AI Config

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-002 |
| **Type** | TN |
| **Category** | Ideation — AI Config |

**Preconditions:** No AI provider marked `is_active = true` in `app_ai_config`.

**Steps:**
1. `POST /api/v1/ideations/generate` with valid inputs.

**Expected Result:** `400 Bad Request`; `detail` mentions no active AI provider.

**Pass Criteria:** Status = 400, no ideation rows created.

---

## TC-003 — Generate Ideation Without Authentication

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-003 |
| **Type** | TN |
| **Category** | Ideation — Authorization |

**Preconditions:** None.

**Steps:**
1. `POST /api/v1/ideations/generate` with no Authorization header.

**Expected Result:** `401 Unauthorized`.

**Pass Criteria:** Status = 401.

---

## TC-004 — Generate Ideation with Invalid API Key

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-004 |
| **Type** | TN |
| **Category** | Ideation — AI Config |

**Preconditions:** AI provider active but `api_key` is `"invalid-key"`.

**Steps:**
1. `POST /api/v1/ideations/generate` with valid inputs.

**Expected Result:** `500` or `400`; error propagated from AI provider (e.g., authentication failure).

**Pass Criteria:** Descriptive error returned; no partial ideation rows created.

---

## ── IDEATION CRUD ─────────────────────────────────────────────────

## TC-005 — Create Ideation Manually

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-005 |
| **Type** | TP |
| **Category** | Ideation — Create |

**Preconditions:** Authenticated user.

**Steps:**
1. `POST /api/v1/ideations` with `{ title: "My Idea", platform: "TikTok", upload_date: "2026-06-05" }`.

**Expected Result:** `201 Created`; `status = "Draft"`, `is_ai_generated = false`.

**Pass Criteria:** Record in DB; all provided fields stored correctly.

---

## TC-006 — Create Ideation Without Title

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-006 |
| **Type** | TN |
| **Category** | Ideation — Validation |

**Preconditions:** Authenticated user.

**Steps:**
1. `POST /api/v1/ideations` with `{}` (no title).

**Expected Result:** `422 Unprocessable Entity`; `title` listed as required.

**Pass Criteria:** Status = 422.

---

## TC-007 — Get Ideation by ID

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-007 |
| **Type** | TP |
| **Category** | Ideation — Read |

**Preconditions:** Ideation with known UUID exists; has 2 tags.

**Steps:**
1. `GET /api/v1/ideations/{id}`.

**Expected Result:** `200 OK`; all fields; `tags` array with 2 items.

**Pass Criteria:** Fields match; tags present.

---

## TC-008 — Update Ideation Status Manually

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-008 |
| **Type** | TP |
| **Category** | Ideation — Update |

**Preconditions:** Ideation in "Draft" status.

**Steps:**
1. `PUT /api/v1/ideations/{id}` with `{ status: "Approved" }`.

**Expected Result:** `200 OK`; `status: "Approved"`.

**Pass Criteria:** Status updated in DB.

---

## TC-009 — Ideation Status Auto-Updates to "Script Generated" on Script Creation

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-009 |
| **Type** | TP |
| **Category** | Ideation — Status Lifecycle |

**Preconditions:** AI provider active; Ideation in "Draft" status.

**Steps:**
1. `POST /api/v1/scripts/generate` with `{ ideation_id: "<id>", language: "en" }`.
2. `GET /api/v1/ideations/{id}`.

**Expected Result:** Ideation `status` changed to `"Script Generated"`.

**Pass Criteria:** Status updated automatically.

---

## TC-010 — Bulk Delete Ideations

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-010 |
| **Type** | TP |
| **Category** | Ideation — Bulk Operations |

**Preconditions:** 3 ideations with known UUIDs.

**Steps:**
1. `DELETE /api/v1/ideations/bulk` with `{ ids: [<id1>, <id2>, <id3>] }`.

**Expected Result:** `204 No Content`; all 3 records deleted.

**Pass Criteria:** `GET /api/v1/ideations/{id1}` returns `404` for each.

---

## TC-011 — Bulk Status Update

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-011 |
| **Type** | TP |
| **Category** | Ideation — Bulk Operations |

**Preconditions:** 2 ideations in "Draft" status.

**Steps:**
1. `PATCH /api/v1/ideations/bulk-status` with `{ ids: [<id1>, <id2>], status: "Approved" }`.

**Expected Result:** `200 OK`; both ideations now have `status: "Approved"`.

**Pass Criteria:** Status updated for all specified IDs.

---

## TC-012 — Bulk Status Update with Invalid Status Value

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-012 |
| **Type** | TN |
| **Category** | Ideation — Validation |

**Preconditions:** Authenticated user.

**Steps:**
1. `PATCH /api/v1/ideations/bulk-status` with `{ ids: [<id>], status: "RandomStatus" }`.

**Expected Result:** `422 Unprocessable Entity`; invalid status rejected.

**Pass Criteria:** Status = 422; ideation status unchanged.

---

## ── SCRIPT GENERATION ─────────────────────────────────────────────

## TC-013 — Generate Script in English

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-013 |
| **Type** | TP |
| **Category** | Script — AI Generation |

**Preconditions:** AI provider active; ideation exists.

**Steps:**
1. `POST /api/v1/scripts/generate` with `{ ideation_id: "<id>", language: "en" }`.

**Expected Result:** `201 Created`; response has all script sections (`hook_opening`, `scenes`, `broll_suggestions`, `caption_suggestion`, `cta_ending`, `hashtags`). Content is in English.

**Pass Criteria:** All required fields non-null; language is English.

---

## TC-014 — Generate Script in Bahasa Indonesia

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-014 |
| **Type** | TP |
| **Category** | Script — Language |

**Preconditions:** AI provider active; ideation exists.

**Steps:**
1. `POST /api/v1/scripts/generate` with `{ ideation_id: "<id>", language: "id" }`.

**Expected Result:** `201 Created`; `hook_opening`, `scenes`, `caption_suggestion`, `hashtags` are in Bahasa Indonesia.

**Pass Criteria:** Script content uses Indonesian language (spot-check key words).

---

## TC-015 — Generate Script with Invalid Language Code

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-015 |
| **Type** | TN |
| **Category** | Script — Validation |

**Preconditions:** Authenticated user.

**Steps:**
1. `POST /api/v1/scripts/generate` with `{ ideation_id: "<id>", language: "fr" }`.

**Expected Result:** `422 Unprocessable Entity`; `language` must be `"en"` or `"id"`.

**Pass Criteria:** Status = 422.

---

## TC-016 — Generate Script with Non-Existent Ideation ID

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-016 |
| **Type** | TN |
| **Category** | Script — Validation |

**Preconditions:** Authenticated user.

**Steps:**
1. `POST /api/v1/scripts/generate` with `{ ideation_id: "00000000-0000-0000-0000-000000000000", language: "en" }`.

**Expected Result:** `404 Not Found`.

**Pass Criteria:** Status = 404; no script created.

---

## TC-017 — Script Export as TXT

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-017 |
| **Type** | TP |
| **Category** | Script — Export |

**Preconditions:** Script exists.

**Steps:**
1. `GET /api/v1/scripts/{id}/export?format=txt`.

**Expected Result:** `200 OK`; `Content-Disposition: attachment; filename="*.txt"`; `Content-Type: text/plain`. Body contains all script sections.

**Pass Criteria:** File downloads successfully; non-empty text content.

---

## TC-018 — Script Export as Markdown

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-018 |
| **Type** | TP |
| **Category** | Script — Export |

**Preconditions:** Script exists.

**Steps:**
1. `GET /api/v1/scripts/{id}/export?format=md`.

**Expected Result:** `200 OK`; `Content-Type: text/markdown`; body uses `##` headings for each section.

**Pass Criteria:** Response is valid Markdown.

---

## TC-019 — Script Export as PDF

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-019 |
| **Type** | TP |
| **Category** | Script — Export |

**Preconditions:** Script exists; `reportlab` installed.

**Steps:**
1. `GET /api/v1/scripts/{id}/export?format=pdf`.

**Expected Result:** `200 OK`; `Content-Type: application/pdf`; file starts with `%PDF-`.

**Pass Criteria:** Valid PDF downloaded.

---

## TC-020 — Script Export with Invalid Format

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-020 |
| **Type** | TN |
| **Category** | Script — Export Validation |

**Preconditions:** Script exists.

**Steps:**
1. `GET /api/v1/scripts/{id}/export?format=docx`.

**Expected Result:** `422 Unprocessable Entity`; format must match `txt|md|pdf`.

**Pass Criteria:** Status = 422.

---

## ── ADMIN AI CONFIG ───────────────────────────────────────────────

## TC-021 — Admin Can View AI Config

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-021 |
| **Type** | TP |
| **Category** | Admin — AI Config |

**Preconditions:** User with `admin` role.

**Steps:**
1. `GET /api/v1/admin/ai-config`.

**Expected Result:** `200 OK`; array of 4 provider objects (claude, chatgpt, ollama, kimi).

**Pass Criteria:** 4 records; `api_key_masked` field (not full key).

---

## TC-022 — Non-Admin Cannot Access AI Config

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-022 |
| **Type** | TN |
| **Category** | Admin — Authorization |

**Preconditions:** User with `viewer` or `editor` role only.

**Steps:**
1. `GET /api/v1/admin/ai-config` with viewer token.

**Expected Result:** `403 Forbidden`.

**Pass Criteria:** Status = 403.

---

## TC-023 — Admin Activates AI Provider

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-023 |
| **Type** | TP |
| **Category** | Admin — AI Config |

**Preconditions:** Admin token; Claude config has valid API key.

**Steps:**
1. `PATCH /api/v1/admin/ai-config/{claude_id}/activate`.
2. `GET /api/v1/admin/ai-config`.

**Expected Result:** Claude `is_active = true`; all other providers `is_active = false` (only one active at a time).

**Pass Criteria:** Exactly one provider active.

---

## TC-024 — [FP Risk] Ideation Generated with Fewer than 7 Items Accepted

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-024 |
| **Type** | FP |
| **Category** | AI Generation — Response Parsing |

**Preconditions:** AI provider active but model returns malformed JSON with only 5 items.

**Steps:**
1. Configure a mock AI that returns 5 items instead of 7.
2. `POST /api/v1/ideations/generate`.

**Expected Result (Bug):** If the service saves whatever the AI returns without validating the count, only 5 ideations are created — a FP (partial result silently accepted).

**Pass Criteria:** Service should validate `len(items) == 7`; raise error if not.

---

## TC-025 — [FN Risk] Valid Script Generation Fails Due to JSON Parse Error

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-025 |
| **Type** | FN |
| **Category** | AI Generation — Parsing |

**Preconditions:** AI provider active; model returns JSON wrapped in markdown fences (```json ... ```).

**Steps:**
1. `POST /api/v1/scripts/generate` when AI wraps JSON in markdown.

**Expected Result (Bug):** If `json.loads()` is called directly without stripping fences, it throws — a FN (valid response rejected).

**Pass Criteria:** Service strips markdown code fences before parsing; fallback parser in place.

---

## TC-026 — Search Ideations by Title

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-026 |
| **Type** | TP |
| **Category** | Ideation — Search |

**Preconditions:** 3 ideations: "Fitness Tips", "Morning Routine", "Cooking Basics".

**Steps:**
1. `GET /api/v1/ideations?search=fitness`.

**Expected Result:** Only "Fitness Tips" returned (case-insensitive).

**Pass Criteria:** `items.length === 1`; title matches.

---

## TC-027 — Filter Ideations by Status

| Field | Value |
|-------|-------|
| **ID** | TST-003-TC-027 |
| **Type** | TP |
| **Category** | Ideation — Filter |

**Preconditions:** Mix of Draft and Approved ideations.

**Steps:**
1. `GET /api/v1/ideations?status=Approved`.

**Expected Result:** Only Approved ideations returned.

**Pass Criteria:** All items have `status: "Approved"`.
