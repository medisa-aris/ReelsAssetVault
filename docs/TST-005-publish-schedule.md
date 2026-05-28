# TST-005: Publish Schedule — Test Cases

| Field        | Value                              |
|--------------|------------------------------------|
| Document ID  | TST-005                            |
| Covers       | PRD-005 Publish Schedule           |
| Author       | medisa-aris                        |
| Created      | 2026-05-28                         |
| Last Updated | 2026-05-28                         |

---

## Test Classification Key

| Type | Meaning |
|------|---------|
| **TP** | Valid input → system accepts → **PASS expected** |
| **TN** | Invalid input → system rejects → **PASS expected** |
| **FP** | Invalid input → system accepts → **BUG** (too permissive) |
| **FN** | Valid input → system rejects → **BUG** (too restrictive) |

> **Testing Layer Notes:**
> API tests use HTTP requests directly.
> UI tests are verified via browser interaction (manual or Playwright).

---

## ── CREATE SCHEDULE ENTRY ─────────────────────────────────────────

## TC-001 — Create Schedule with Video, Ideation, and Approved Script

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-001 |
| **Type** | TP |
| **Category** | Schedule — Create |

**Preconditions:** Authenticated user; valid `asset_id`, `ideation_id`, and `script_id` (script must have `status = "Approved"`); `scheduled_date` is a future date.

**Steps:**
1. `POST /api/v1/schedule` with `{ asset_id, ideation_id, script_id, scheduled_date: "2026-06-10", scheduled_time: "09:00", caption: "Check this out!", hashtags: "#fitness #reels" }`.

**Expected Result:** `201 Created`; response contains all submitted fields; `status = "Draft"`.

**Pass Criteria:** Record created in DB; `status` defaults to `"Draft"`; `approved_by` and `approved_at` are null.

---

## TC-002 — Create Schedule with Video Only (No Ideation or Script)

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-002 |
| **Type** | TP |
| **Category** | Schedule — Create |

**Preconditions:** Authenticated user; valid `asset_id`; `ideation_id` and `script_id` omitted.

**Steps:**
1. `POST /api/v1/schedule` with `{ asset_id, scheduled_date: "2026-06-15", scheduled_time: "18:00" }`.

**Expected Result:** `201 Created`; `ideation_id = null`; `script_id = null`; `status = "Draft"`.

**Pass Criteria:** Schedule created without requiring ideation or script linkage.

---

## TC-003 — Create Schedule Without Required Fields

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-003 |
| **Type** | TN |
| **Category** | Schedule — Validation |

**Preconditions:** Authenticated user.

**Steps:**
1. `POST /api/v1/schedule` with `{}` (no `asset_id`, no `scheduled_date`).

**Expected Result:** `422 Unprocessable Entity`; `asset_id` and `scheduled_date` listed as required fields.

**Pass Criteria:** Status = 422; no record created.

---

## TC-004 — Create Schedule Without Authentication

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-004 |
| **Type** | TN |
| **Category** | Schedule — Authorization |

**Preconditions:** No token.

**Steps:**
1. `POST /api/v1/schedule` with no `Authorization` header.

**Expected Result:** `401 Unauthorized`.

**Pass Criteria:** Status = 401; no record created.

---

## TC-005 — Create Schedule with Non-Existent Asset ID

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-005 |
| **Type** | TN |
| **Category** | Schedule — Validation |

**Preconditions:** Authenticated user.

**Steps:**
1. `POST /api/v1/schedule` with `{ asset_id: "00000000-0000-0000-0000-000000000000", scheduled_date: "2026-06-10", scheduled_time: "09:00" }`.

**Expected Result:** `404 Not Found`; no record created.

**Pass Criteria:** Status = 404.

---

## TC-006 — Create Schedule with Past Scheduled Date

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-006 |
| **Type** | TN |
| **Category** | Schedule — Validation |

**Preconditions:** Authenticated user; valid `asset_id`.

**Steps:**
1. `POST /api/v1/schedule` with `{ asset_id, scheduled_date: "2020-01-01", scheduled_time: "09:00" }`.

**Expected Result:** `422 Unprocessable Entity`; error references that `scheduled_date` must be in the future.

**Pass Criteria:** Status = 422; no record created.

---

## TC-007 — Caption and Hashtags Pre-filled from Linked Script

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-007 |
| **Type** | TP |
| **Category** | Schedule — UI Pre-fill |

**Preconditions:** Ideation with an approved script containing `caption_suggestion = "Morning fuel ☀️"` and `hashtags = "#morning #fitness"`.

**Steps:**
1. Navigate to `/production/schedule/create`.
2. Select the linked ideation; pick its approved script.

**Expected Result:** Caption input auto-fills with `"Morning fuel ☀️"`; hashtags input auto-fills with `"#morning #fitness"`.

**Pass Criteria:** Both fields pre-populated from script values; user can still edit before saving.

---

## ── READ & LIST ────────────────────────────────────────────────────

## TC-008 — List Schedule Entries Paginated

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-008 |
| **Type** | TP |
| **Category** | Schedule — List |

**Preconditions:** 15 schedule entries in DB.

**Steps:**
1. `GET /api/v1/schedule?page=1&limit=10`.
2. `GET /api/v1/schedule?page=2&limit=10`.

**Expected Result:** Page 1 returns 10 items; page 2 returns 5 items; `total = 15`.

**Pass Criteria:** `items.length` correct per page; `total` accurate.

---

## TC-009 — Get Single Schedule Entry by ID

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-009 |
| **Type** | TP |
| **Category** | Schedule — Read |

**Preconditions:** Schedule entry with known UUID exists.

**Steps:**
1. `GET /api/v1/schedule/{id}` with valid token.

**Expected Result:** `200 OK`; full schedule object with `asset`, `ideation`, `script` nested objects.

**Pass Criteria:** All fields present; nested objects hydrated.

---

## TC-010 — Get Non-Existent Schedule Entry

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-010 |
| **Type** | TN |
| **Category** | Schedule — Read |

**Preconditions:** UUID not in DB.

**Steps:**
1. `GET /api/v1/schedule/00000000-0000-0000-0000-000000000000` with valid token.

**Expected Result:** `404 Not Found`.

**Pass Criteria:** Status = 404.

---

## TC-011 — Filter Schedule by Status

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-011 |
| **Type** | TP |
| **Category** | Schedule — Filter |

**Preconditions:** Mix of Draft, Pending Review, and Approved entries.

**Steps:**
1. `GET /api/v1/schedule?status=Pending+Review`.

**Expected Result:** Only entries with `status = "Pending Review"` returned.

**Pass Criteria:** All items in response have `status = "Pending Review"`.

---

## TC-012 — Search Schedule by Caption

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-012 |
| **Type** | TP |
| **Category** | Schedule — Search |

**Preconditions:** 3 entries with captions: "Morning routine", "Evening workout", "Lunch prep".

**Steps:**
1. `GET /api/v1/schedule?search=morning`.

**Expected Result:** Only "Morning routine" entry returned (case-insensitive).

**Pass Criteria:** `items.length === 1`; caption matches.

---

## ── UPDATE SCHEDULE ENTRY ─────────────────────────────────────────

## TC-013 — Edit Draft Entry

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-013 |
| **Type** | TP |
| **Category** | Schedule — Update |

**Preconditions:** Schedule entry in `"Draft"` status.

**Steps:**
1. `PUT /api/v1/schedule/{id}` with `{ caption: "Updated caption", scheduled_date: "2026-07-01" }`.

**Expected Result:** `200 OK`; updated fields reflected in response; `status` still `"Draft"`.

**Pass Criteria:** Fields updated; status unchanged.

---

## TC-014 — Edit Rejected Entry

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-014 |
| **Type** | TP |
| **Category** | Schedule — Update |

**Preconditions:** Schedule entry in `"Rejected"` status with `rejection_reason` set.

**Steps:**
1. `PUT /api/v1/schedule/{id}` with `{ caption: "Revised caption", notes: "Fixed per reviewer feedback" }`.

**Expected Result:** `200 OK`; changes saved; `status` remains `"Rejected"` (user must re-submit separately).

**Pass Criteria:** Updated fields stored; entry remains editable while rejected.

---

## TC-015 — [TN] Edit Approved Entry

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-015 |
| **Type** | TN |
| **Category** | Schedule — Update Lock |

**Preconditions:** Schedule entry in `"Approved"` status.

**Steps:**
1. `PUT /api/v1/schedule/{id}` with `{ caption: "Trying to change" }`.

**Expected Result:** `409 Conflict` (or `403 Forbidden`); editing an approved entry is not allowed.

**Pass Criteria:** Status = 409/403; entry unchanged in DB.

---

## TC-016 — [TN] Edit Scheduled Entry

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-016 |
| **Type** | TN |
| **Category** | Schedule — Update Lock |

**Preconditions:** Schedule entry in `"Scheduled"` status.

**Steps:**
1. `PUT /api/v1/schedule/{id}` with `{ scheduled_time: "22:00" }`.

**Expected Result:** `409 Conflict`; entry in Scheduled state is locked.

**Pass Criteria:** Status = 409; scheduled time unchanged.

---

## ── STATUS WORKFLOW ───────────────────────────────────────────────

## TC-017 — Submit Entry for Review

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-017 |
| **Type** | TP |
| **Category** | Schedule — Status Workflow |

**Preconditions:** Schedule entry in `"Draft"` status.

**Steps:**
1. `POST /api/v1/schedule/{id}/submit` with valid user token.

**Expected Result:** `200 OK`; `status` changes to `"Pending Review"`.

**Pass Criteria:** Status updated; `updated_at` refreshed.

---

## TC-018 — Submit Already-Pending Entry

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-018 |
| **Type** | TN |
| **Category** | Schedule — Status Workflow |

**Preconditions:** Schedule entry already in `"Pending Review"` status.

**Steps:**
1. `POST /api/v1/schedule/{id}/submit`.

**Expected Result:** `409 Conflict`; cannot submit an entry that is already pending.

**Pass Criteria:** Status = 409; entry status unchanged.

---

## TC-019 — Approver Approves Entry

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-019 |
| **Type** | TP |
| **Category** | Schedule — Approval |

**Preconditions:** User with `admin` or `reviewer` role; entry in `"Pending Review"`.

**Steps:**
1. `POST /api/v1/schedule/{id}/approve` with approver token.

**Expected Result:** `200 OK`; `status = "Approved"`; `approved_by` = approver's user ID; `approved_at` = current timestamp.

**Pass Criteria:** Status, `approved_by`, and `approved_at` all updated correctly.

---

## TC-020 — Non-Approver Cannot Approve Entry

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-020 |
| **Type** | TN |
| **Category** | Schedule — Authorization |

**Preconditions:** User with `editor` role only (not admin or reviewer); entry in `"Pending Review"`.

**Steps:**
1. `POST /api/v1/schedule/{id}/approve` with editor token.

**Expected Result:** `403 Forbidden`; editor role cannot approve.

**Pass Criteria:** Status = 403; entry status unchanged.

---

## TC-021 — Approver Rejects Entry with Reason

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-021 |
| **Type** | TP |
| **Category** | Schedule — Rejection |

**Preconditions:** User with `reviewer` role; entry in `"Pending Review"`.

**Steps:**
1. `POST /api/v1/schedule/{id}/reject` with `{ reason: "Caption needs more engagement hooks" }`.

**Expected Result:** `200 OK`; `status = "Rejected"`; `rejection_reason` stored; `approved_by` is null.

**Pass Criteria:** Status and reason updated; entry not approved.

---

## TC-022 — Reject Entry Without Providing Reason

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-022 |
| **Type** | TN |
| **Category** | Schedule — Validation |

**Preconditions:** User with `reviewer` role; entry in `"Pending Review"`.

**Steps:**
1. `POST /api/v1/schedule/{id}/reject` with `{}` (no reason).

**Expected Result:** `422 Unprocessable Entity`; `reason` is required for rejection.

**Pass Criteria:** Status = 422; entry status unchanged.

---

## TC-023 — Re-submit After Rejection

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-023 |
| **Type** | TP |
| **Category** | Schedule — Status Workflow |

**Preconditions:** Entry in `"Rejected"` status after a prior rejection.

**Steps:**
1. `PUT /api/v1/schedule/{id}` with updated `caption`.
2. `POST /api/v1/schedule/{id}/submit`.

**Expected Result:** Step 1 → `200 OK` (Draft or Rejected entries are editable). Step 2 → `200 OK`; `status = "Pending Review"`; `rejection_reason` cleared.

**Pass Criteria:** Re-submission resets to Pending Review; rejection reason nullified.

---

## TC-024 — Approve Entry That Is Not Pending Review

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-024 |
| **Type** | TN |
| **Category** | Schedule — Status Workflow |

**Preconditions:** User with `admin` role; entry in `"Draft"` status.

**Steps:**
1. `POST /api/v1/schedule/{id}/approve` with admin token.

**Expected Result:** `409 Conflict`; can only approve entries in `"Pending Review"`.

**Pass Criteria:** Status = 409; entry remains in `"Draft"`.

---

## TC-025 — Status Transitions to Scheduled After Approval

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-025 |
| **Type** | TP |
| **Category** | Schedule — Status Workflow |

**Preconditions:** Approved entry with `scheduled_date` = tomorrow.

**Steps:**
1. Trigger the scheduler job (or manually call `PATCH /api/v1/schedule/{id}/status` with `{ status: "Scheduled" }`).
2. `GET /api/v1/schedule/{id}`.

**Expected Result:** `status = "Scheduled"`.

**Pass Criteria:** Entry moves from `"Approved"` → `"Scheduled"` once scheduling is confirmed.

---

## ── DELETE SCHEDULE ENTRY ─────────────────────────────────────────

## TC-026 — Delete Draft Schedule Entry

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-026 |
| **Type** | TP |
| **Category** | Schedule — Delete |

**Preconditions:** Entry in `"Draft"` status.

**Steps:**
1. `DELETE /api/v1/schedule/{id}` with valid token.
2. `GET /api/v1/schedule/{id}`.

**Expected Result:** Step 1 → `204 No Content`. Step 2 → `404 Not Found`.

**Pass Criteria:** Record deleted from DB.

---

## TC-027 — Delete Approved Entry

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-027 |
| **Type** | TN |
| **Category** | Schedule — Delete Lock |

**Preconditions:** Entry in `"Approved"` status.

**Steps:**
1. `DELETE /api/v1/schedule/{id}` with valid token.

**Expected Result:** `409 Conflict`; approved entries cannot be deleted.

**Pass Criteria:** Status = 409; entry remains in DB.

---

## TC-028 — Delete Non-Existent Schedule Entry

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-028 |
| **Type** | TN |
| **Category** | Schedule — Delete |

**Preconditions:** UUID not in DB.

**Steps:**
1. `DELETE /api/v1/schedule/00000000-0000-0000-0000-000000000000`.

**Expected Result:** `404 Not Found`.

**Pass Criteria:** Status = 404.

---

## ── ROLE & AUTHORIZATION ───────────────────────────────────────────

## TC-029 — Viewer Role Can View Schedule List

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-029 |
| **Type** | TP |
| **Category** | Schedule — Authorization |

**Preconditions:** User with `viewer` role only.

**Steps:**
1. `GET /api/v1/schedule` with viewer token.

**Expected Result:** `200 OK`; paginated list returned.

**Pass Criteria:** Viewer can read schedule entries.

---

## TC-030 — Viewer Role Cannot Create Schedule Entry

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-030 |
| **Type** | TN |
| **Category** | Schedule — Authorization |

**Preconditions:** User with `viewer` role only.

**Steps:**
1. `POST /api/v1/schedule` with `{ asset_id, scheduled_date, scheduled_time }` and viewer token.

**Expected Result:** `403 Forbidden`.

**Pass Criteria:** Status = 403; no record created.

---

## TC-031 — Reviewer Role Can Approve But Not Create Entries

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-031 |
| **Type** | TP |
| **Category** | Schedule — Authorization |

**Preconditions:** User with `reviewer` role only; entry in `"Pending Review"`.

**Steps:**
1. `POST /api/v1/schedule/{id}/approve` with reviewer token.
2. `POST /api/v1/schedule` (create) with reviewer token.

**Expected Result:** Step 1 → `200 OK`. Step 2 → `403 Forbidden` (reviewer cannot create, only approve/reject).

**Pass Criteria:** Approval succeeds; creation blocked.

---

## TC-032 — Admin Role Has Full Access

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-032 |
| **Type** | TP |
| **Category** | Schedule — Authorization |

**Preconditions:** User with `admin` role.

**Steps:**
1. Create entry (`POST /api/v1/schedule`).
2. Submit entry (`POST /api/v1/schedule/{id}/submit`).
3. Approve entry (`POST /api/v1/schedule/{id}/approve`).
4. Delete a Draft entry (`DELETE /api/v1/schedule/{other_id}`).

**Expected Result:** All four operations succeed.

**Pass Criteria:** Admin can perform all lifecycle operations.

---

## ── UI BEHAVIOURS ─────────────────────────────────────────────────

## TC-033 — Asset Picker Modal Filters to Video Assets Only

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-033 |
| **Type** | TP |
| **Category** | UI — Asset Picker |

**Preconditions:** Library contains 5 video assets and 2 image assets.

**Steps:**
1. Navigate to `/production/schedule/create`.
2. Click "Pick from Video List".

**Expected Result:** Asset picker modal shows only the 5 video assets; images excluded.

**Pass Criteria:** All items in modal have `mime_type` matching `video/*`.

---

## TC-034 — Ideation Picker Modal Filters to Approved Ideations

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-034 |
| **Type** | TP |
| **Category** | UI — Ideation Picker |

**Preconditions:** Mix of Draft, Approved, and Script Generated ideations.

**Steps:**
1. Click "Pick from Ideation List" in the schedule create page.

**Expected Result:** Only ideations with `status = "Approved"` or `status = "Script Generated"` appear (content ready for scheduling).

**Pass Criteria:** Draft ideations not listed in picker.

---

## TC-035 — Script Picker Shows Only Approved Scripts

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-035 |
| **Type** | TP |
| **Category** | UI — Script Picker |

**Preconditions:** Ideation selected; linked scripts include one Draft and one Approved.

**Steps:**
1. After selecting an ideation, click "Pick Script".

**Expected Result:** Only the Approved script is selectable; Draft script is either hidden or shown as disabled.

**Pass Criteria:** User cannot link a non-approved script to the schedule.

---

## TC-036 — Status Badge Shows Correct Color for Each Status

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-036 |
| **Type** | TP |
| **Category** | UI — Status Badge |

**Preconditions:** Schedule list has entries in all 6 statuses.

**Steps:**
1. Navigate to `/production/schedule`.
2. Inspect status badge colors.

**Expected Result:**
- Draft → gray
- Pending Review → yellow/amber
- Approved → green
- Scheduled → blue
- Published → indigo
- Rejected → red

**Pass Criteria:** Each status maps to its designated color; no two statuses share the same color.

---

## TC-037 — Approve/Reject Panel Visible Only to Approvers

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-037 |
| **Type** | TP |
| **Category** | UI — Role-based UI |

**Preconditions:** Entry in `"Pending Review"` status.

**Steps:**
1. Log in as `editor` → navigate to entry detail.
2. Log out; log in as `reviewer` → navigate to same entry.

**Expected Result:** Step 1 → No "Approve" or "Reject" buttons visible. Step 2 → ApproveRejectPanel visible with both buttons.

**Pass Criteria:** UI gating based on `user.roles.includes("admin") || user.roles.includes("reviewer")`.

---

## TC-038 — Edit Buttons Disabled for Locked Statuses in UI

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-038 |
| **Type** | TP |
| **Category** | UI — Edit Lock |

**Preconditions:** Entry in `"Approved"` status.

**Steps:**
1. Navigate to entry detail page.

**Expected Result:** Edit fields are read-only; Save button is hidden or disabled; banner reads "This entry is locked — contact an approver to make changes."

**Pass Criteria:** No editing possible through UI for locked statuses.

---

## ── FALSE POSITIVE & FALSE NEGATIVE RISKS ────────────────────────

## TC-039 — [FP Risk] Non-Approver Approves via Direct API Call

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-039 |
| **Type** | FP |
| **Category** | Security — Role Bypass |

**Preconditions:** User with `editor` role only; entry in `"Pending Review"`.

**Steps:**
1. Craft direct HTTP request: `POST /api/v1/schedule/{id}/approve` with editor token (bypassing UI).

**Expected Result (Bug if accepted):** If `require_approver` dependency is missing or misconfigured, the editor's approval request succeeds — an FP (invalid role accepted).

**Pass Criteria:** Status = 403; `require_approver` must check `{"admin", "reviewer"} & set(roles)` server-side.

---

## TC-040 — [FP Risk] Viewer Creates Entry via Direct API Call

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-040 |
| **Type** | FP |
| **Category** | Security — Role Bypass |

**Preconditions:** User with `viewer` role only.

**Steps:**
1. `POST /api/v1/schedule` directly with viewer token and valid body.

**Expected Result (Bug if accepted):** If the create endpoint lacks role guard, viewer can create entries — an FP.

**Pass Criteria:** Status = 403; create route must have `require_editor_or_above` dependency.

---

## TC-041 — [FP Risk] Editing Approved Entry Accepted via API

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-041 |
| **Type** | FP |
| **Category** | Security — Status Lock |

**Preconditions:** Entry in `"Approved"` status; authenticated editor user.

**Steps:**
1. `PUT /api/v1/schedule/{id}` with modified `caption`.

**Expected Result (Bug if accepted):** If the update endpoint does not check current status, the edit goes through — an FP (approved entry mutated without re-approval).

**Pass Criteria:** Status = 409; update service must validate `status not in ("Approved", "Scheduled", "Published")`.

---

## TC-042 — [FP Risk] Duplicate Schedule Entries for Same Asset and Date

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-042 |
| **Type** | FP |
| **Category** | Schedule — Duplicate |

**Preconditions:** Authenticated user; existing entry for `asset_id` on `2026-06-10`.

**Steps:**
1. `POST /api/v1/schedule` with same `asset_id` and `scheduled_date: "2026-06-10"`.

**Expected Result (Bug if accepted):** Two entries exist for the same asset on the same day — an FP if uniqueness is not enforced.

**Pass Criteria:** Service should warn (or block) scheduling the same asset on the same date. If duplicates are allowed by design, document it clearly.

---

## TC-043 — [FN Risk] Valid Reviewer Token Rejected on Approve Endpoint

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-043 |
| **Type** | FN |
| **Category** | Security — Role Resolution |

**Preconditions:** User has `reviewer` role in `app_user_roles` but `require_approver` is buggy (checks wrong field name).

**Steps:**
1. `POST /api/v1/schedule/{id}/approve` with reviewer's valid token.

**Expected Result (Bug if rejected):** If `require_approver` queries roles incorrectly (e.g., wrong join or wrong column), a valid reviewer gets `403` — an FN.

**Pass Criteria:** Verify `require_approver` uses the same role-resolution logic as `require_admin` and is tested with seeded reviewer user.

---

## TC-044 — [FN Risk] Valid Future Date Rejected Due to Timezone Mismatch

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-044 |
| **Type** | FN |
| **Category** | Schedule — Validation |

**Preconditions:** Server runs in UTC; user submits `scheduled_date: "2026-06-10"` from UTC+7 timezone at 23:30 local (which is UTC+7 next day).

**Steps:**
1. `POST /api/v1/schedule` with `scheduled_date: "2026-06-10"` at a time that is "past" in UTC but "future" in local timezone.

**Expected Result (Bug if rejected):** If the backend compares `scheduled_date` naively to `datetime.utcnow()`, the date may be rejected as "past" even though it is future in the user's local timezone — an FN.

**Pass Criteria:** Date validation should use date-only comparison (`scheduled_date >= date.today()`) without timezone-sensitive time component, or use user's timezone offset.

---

## TC-045 — [FN Risk] Re-submission from Rejected Status Fails

| Field | Value |
|-------|-------|
| **ID** | TST-005-TC-045 |
| **Type** | FN |
| **Category** | Schedule — Status Workflow |

**Preconditions:** Entry in `"Rejected"` status.

**Steps:**
1. `POST /api/v1/schedule/{id}/submit`.

**Expected Result (Bug if rejected):** If the submit endpoint only allows transition from `"Draft"` and not from `"Rejected"`, a valid re-submission is blocked — an FN.

**Pass Criteria:** Submit endpoint must accept transitions from both `"Draft"` and `"Rejected"` statuses.
