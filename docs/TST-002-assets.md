# TST-002: Video Asset Management — Test Cases

| Field        | Value                              |
|--------------|------------------------------------|
| Document ID  | TST-002                            |
| Covers       | PRD-002 Video Asset Management     |
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

---

## TC-001 — Upload a Valid MP4 Video

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-001 |
| **Type** | TP |
| **Category** | Upload — API |

**Preconditions:** Authenticated user with valid token. Test file: `sample.mp4` (< 500 MB, valid H.264 MP4).

**Steps:**
1. `POST /api/v1/assets/upload` multipart form: `file=sample.mp4`, `title="Test Video"`.

**Expected Result:** `201 Created`; response contains `id`, `title`, `filename`, `file_size_bytes`, `duration_seconds`, `width`, `height`, `mime_type: "video/mp4"`, `thumbnail_url`, `file_url`.

**Pass Criteria:** All metadata fields populated; thumbnail file exists at `storage/uploads/{id}/thumbnail.jpg`.

---

## TC-002 — Upload Non-Video File

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-002 |
| **Type** | TN |
| **Category** | Upload — Validation |

**Preconditions:** Authenticated user.

**Steps:**
1. `POST /api/v1/assets/upload` with `file=document.pdf`.

**Expected Result:** `400 Bad Request`; error referencing unsupported file type.

**Pass Criteria:** Status = 400, no asset record created.

---

## TC-003 — Upload Without Title

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-003 |
| **Type** | TN |
| **Category** | Upload — Validation |

**Preconditions:** Authenticated user.

**Steps:**
1. `POST /api/v1/assets/upload` with `file=sample.mp4`, no `title` field.

**Expected Result:** `422 Unprocessable Entity`; `title` listed as required.

**Pass Criteria:** Status = 422, no asset created.

---

## TC-004 — Upload Without Authentication

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-004 |
| **Type** | TN |
| **Category** | Upload — Authorization |

**Preconditions:** No token.

**Steps:**
1. `POST /api/v1/assets/upload` with no Authorization header.

**Expected Result:** `401 Unauthorized`.

**Pass Criteria:** Status = 401, no file stored.

---

## TC-005 — Metadata Extraction: Duration and Resolution

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-005 |
| **Type** | TP |
| **Category** | Upload — Metadata |

**Preconditions:** Authenticated user. Test file: `1080p_30s.mp4` (1920×1080, 30-second video).

**Steps:**
1. Upload `1080p_30s.mp4`.

**Expected Result:** `duration_seconds ≈ 30`, `width = 1920`, `height = 1080`, `file_size_bytes > 0`.

**Pass Criteria:** All four fields within ±5 % of known values.

---

## TC-006 — Thumbnail Generated on Upload

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-006 |
| **Type** | TP |
| **Category** | Upload — Thumbnail |

**Preconditions:** Authenticated user.

**Steps:**
1. Upload any valid MP4.
2. Note the returned `thumbnail_url`.
3. `GET {thumbnail_url}` (public static endpoint).

**Expected Result:** HTTP 200; body is a JPEG image.

**Pass Criteria:** `Content-Type: image/jpeg`; non-zero file size.

---

## TC-007 — file_url Returned in Asset Response

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-007 |
| **Type** | TP |
| **Category** | Upload — API Response |

**Preconditions:** Authenticated user.

**Steps:**
1. Upload valid MP4. Note `file_url` in response.
2. `GET {file_url}` (public static endpoint).

**Expected Result:** HTTP 200; `Content-Type: video/mp4`.

**Pass Criteria:** Video file downloadable via `file_url`.

---

## TC-008 — List Assets Paginated

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-008 |
| **Type** | TP |
| **Category** | List — API |

**Preconditions:** 25 assets in the database.

**Steps:**
1. `GET /api/v1/assets?page=1&limit=20`.
2. `GET /api/v1/assets?page=2&limit=20`.

**Expected Result:** Page 1 returns 20 items; page 2 returns 5 items; `total = 25`.

**Pass Criteria:** `items.length` correct per page; `total` accurate.

---

## TC-009 — List Assets Requires Authentication

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-009 |
| **Type** | TN |
| **Category** | List — Authorization |

**Preconditions:** No token.

**Steps:**
1. `GET /api/v1/assets`.

**Expected Result:** `401 Unauthorized`.

**Pass Criteria:** Status = 401, no data returned.

---

## TC-010 — Get Single Asset by ID

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-010 |
| **Type** | TP |
| **Category** | Read — API |

**Preconditions:** Asset with known UUID exists.

**Steps:**
1. `GET /api/v1/assets/{asset_id}` with valid token.

**Expected Result:** `200 OK`; full asset object including `tags` array.

**Pass Criteria:** `id` matches; all fields present.

---

## TC-011 — Get Non-Existent Asset

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-011 |
| **Type** | TN |
| **Category** | Read — API |

**Preconditions:** UUID that does not match any asset.

**Steps:**
1. `GET /api/v1/assets/00000000-0000-0000-0000-000000000000` with valid token.

**Expected Result:** `404 Not Found`.

**Pass Criteria:** Status = 404.

---

## TC-012 — Update Asset Metadata

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-012 |
| **Type** | TP |
| **Category** | Update — API |

**Preconditions:** Asset exists; valid tags pre-created.

**Steps:**
1. `PUT /api/v1/assets/{id}` with `{ title: "New Title", description: "Updated", tag_ids: [<uuid>] }`.

**Expected Result:** `200 OK`; response shows updated `title`, `description`, and tag in `tags` array.

**Pass Criteria:** Fields match updated values; `updated_by_name` set to current user.

---

## TC-013 — Update Asset with Empty Title

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-013 |
| **Type** | TN |
| **Category** | Update — Validation |

**Preconditions:** Asset exists.

**Steps:**
1. `PUT /api/v1/assets/{id}` with `{ title: "   " }` (whitespace only).

**Expected Result:** `422 Unprocessable Entity`; title validation error.

**Pass Criteria:** Status = 422, asset title unchanged.

---

## TC-014 — Delete Asset

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-014 |
| **Type** | TP |
| **Category** | Delete — API |

**Preconditions:** Asset exists; note `file_url`.

**Steps:**
1. `DELETE /api/v1/assets/{id}` with valid token.
2. `GET /api/v1/assets/{id}`.
3. `GET {file_url}`.

**Expected Result:** Step 1 → `204 No Content`. Step 2 → `404`. Step 3 → `404` (file removed from disk).

**Pass Criteria:** Record and files both removed.

---

## TC-015 — Delete Non-Existent Asset

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-015 |
| **Type** | TN |
| **Category** | Delete — API |

**Preconditions:** UUID not in DB.

**Steps:**
1. `DELETE /api/v1/assets/00000000-0000-0000-0000-000000000000` with valid token.

**Expected Result:** `404 Not Found`.

**Pass Criteria:** Status = 404.

---

## TC-016 — Upload MOV File (Alternative Format)

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-016 |
| **Type** | TP |
| **Category** | Upload — Format Compatibility |

**Preconditions:** Authenticated user. Test file: `clip.mov`.

**Steps:**
1. Upload `clip.mov`.

**Expected Result:** `201 Created`; `mime_type: "video/quicktime"` or similar; duration and resolution extracted.

**Pass Criteria:** Asset created; metadata populated.

---

## TC-017 — [FP Risk] Upload File with Spoofed MIME Type

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-017 |
| **Type** | FP |
| **Category** | Upload — Security |

**Preconditions:** Rename `malware.exe` to `video.mp4`.

**Steps:**
1. Upload `video.mp4` (actually an exe).

**Expected Result (Bug):** If validation relies only on file extension or `Content-Type` header, the file is accepted. A FP — invalid content accepted.

**Pass Criteria:** Backend should validate magic bytes or use OpenCV to detect non-video content. File should be rejected with 400 if it cannot be decoded as video.

---

## TC-018 — [FN Risk] Valid WebM File Rejected

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-018 |
| **Type** | FN |
| **Category** | Upload — Format |

**Preconditions:** Authenticated user. Test file: valid `clip.webm`.

**Steps:**
1. Upload `clip.webm`.

**Expected Result (Bug if rejected):** If the allowed-type list is too narrow (only mp4/mov), a valid webm is refused — FN.

**Pass Criteria:** WebM should be accepted; check `ALLOWED_MIME_TYPES` constant in upload service.

---

## TC-019 — Tags Returned in Asset Response

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-019 |
| **Type** | TP |
| **Category** | Metadata — Tags |

**Preconditions:** Asset with 2 tags assigned.

**Steps:**
1. `GET /api/v1/assets/{id}`.

**Expected Result:** `tags` array contains 2 objects, each with `id`, `name`, `slug`.

**Pass Criteria:** Tag count matches; each tag has all three fields.

---

## TC-020 — Updated_by_name Reflects Correct Editor

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-020 |
| **Type** | TP |
| **Category** | Metadata — Audit |

**Preconditions:** Asset created by user A; user B updates it.

**Steps:**
1. User B: `PUT /api/v1/assets/{id}` with new title.

**Expected Result:** `updated_by_name` in response equals user B's `full_name`.

**Pass Criteria:** `updated_by_name` is user B, not user A.

---

## TC-021 — Storage Files Isolated per Asset

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-021 |
| **Type** | TP |
| **Category** | Storage — Isolation |

**Preconditions:** Two assets uploaded.

**Steps:**
1. Check `storage/uploads/` directory.

**Expected Result:** Two separate subdirectories, each named by asset UUID, each containing `original.*` and `thumbnail.jpg`.

**Pass Criteria:** No cross-contamination between asset directories.

---

## TC-022 — [FP Risk] Concurrent Upload of Same File Creates Duplicate Records

| Field | Value |
|-------|-------|
| **ID** | TST-002-TC-022 |
| **Type** | FP |
| **Category** | Upload — Concurrency |

**Preconditions:** Authenticated user.

**Steps:**
1. Fire two simultaneous upload requests for identical files.

**Expected Result (Bug):** Both requests may succeed, creating two separate asset records for the same file — a FP (duplicate accepted).

**Pass Criteria:** Both records are valid (no uniqueness constraint on file content); acceptable behaviour but should be documented.
