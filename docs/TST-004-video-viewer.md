# TST-004: Video Viewer — Test Cases

| Field        | Value                              |
|--------------|------------------------------------|
| Document ID  | TST-004                            |
| Covers       | PRD-004 Video Viewer               |
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
> UI/visual tests in this document are verified via browser interaction (manual or Playwright).
> API tests use HTTP requests directly.

---

## ── THUMBNAIL PLAY OVERLAY ────────────────────────────────────────

## TC-001 — Play Overlay Visible on Asset with Thumbnail

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-001 |
| **Type** | TP |
| **Category** | UI — Thumbnail Overlay |

**Preconditions:** Logged in; video list has at least one asset with a thumbnail.

**Steps:**
1. Navigate to `/video`.
2. Inspect the SNAPSHOT cell of any asset row.

**Expected Result:** A semi-transparent ▶ play icon is visible over the thumbnail image.

**Pass Criteria:** Play icon element present in DOM (`<div>` overlay + `<svg>` play path inside the `<button>` wrapper).

---

## TC-002 — Play Overlay Opacity Increases on Thumbnail Hover

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-002 |
| **Type** | TP |
| **Category** | UI — Hover State |

**Preconditions:** Video list with at least one asset.

**Steps:**
1. Navigate to `/video`.
2. Hover mouse over the thumbnail.

**Expected Result:** The overlay div transitions from `opacity-60` to `opacity-100` (play button becomes fully opaque).

**Pass Criteria:** CSS class `group-hover:opacity-100` applied on hover; smooth transition visible.

---

## TC-003 — Play Overlay Visible for Asset Without Thumbnail

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-003 |
| **Type** | TP |
| **Category** | UI — Fallback Thumbnail |

**Preconditions:** Asset where `thumbnail_url` is null (thumbnail generation failed).

**Steps:**
1. Navigate to `/video`.
2. Locate the asset with no thumbnail (video icon placeholder shown).

**Expected Result:** Play overlay is still rendered over the placeholder icon.

**Pass Criteria:** Play button button element present even with no `<img>` rendered.

---

## ── VIDEO PLAYER MODAL ────────────────────────────────────────────

## TC-004 — Click Thumbnail Opens Player Modal

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-004 |
| **Type** | TP |
| **Category** | UI — Modal Open |

**Preconditions:** Video list with asset; `file_url` or `filename` present.

**Steps:**
1. Navigate to `/video`.
2. Click the thumbnail of any asset.

**Expected Result:** A modal overlay appears containing the asset title, metadata sub-line (resolution · duration · size), a `<video>` element with controls, and the filename in the footer.

**Pass Criteria:** Modal DOM element with class `fixed inset-0 z-50` visible; video element rendered.

---

## TC-005 — Player Modal Shows Correct Asset Metadata

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-005 |
| **Type** | TP |
| **Category** | UI — Modal Metadata |

**Preconditions:** Asset with title "Sample Reel", resolution 2160×3840, duration 27 s, size 125.8 MB.

**Steps:**
1. Click that asset's thumbnail.

**Expected Result:** Modal header shows `"Sample Reel"` as title; sub-line shows `"2160×3840 · 0:27 · 125.8 MB"`.

**Pass Criteria:** All three metadata values match; no placeholder text visible.

---

## TC-006 — Video Loads and is Playable

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-006 |
| **Type** | TP |
| **Category** | UI — Playback |

**Preconditions:** Asset with valid video file at `file_url`.

**Steps:**
1. Open modal for the asset.
2. Click the play button inside the player.

**Expected Result:** Video plays; `currentTime` advances; no error overlay shown.

**Pass Criteria:** `videoElement.paused === false` after click; `currentTime > 0` after 2 s.

---

## TC-007 — Video Starts Paused on Modal Open

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-007 |
| **Type** | TP |
| **Category** | UI — Autoplay |

**Preconditions:** Valid asset.

**Steps:**
1. Open modal.

**Expected Result:** Video is paused at `0:00`; user must explicitly press play.

**Pass Criteria:** `videoElement.paused === true` immediately after modal renders.

---

## TC-008 — Close Modal via × Button

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-008 |
| **Type** | TP |
| **Category** | UI — Modal Close |

**Preconditions:** Modal is open; video playing.

**Steps:**
1. Click the × (close) button in the modal header.

**Expected Result:** Modal unmounts; video playback stops; list page visible again.

**Pass Criteria:** Modal DOM element no longer in the document; no audio continuing.

---

## TC-009 — Close Modal via Backdrop Click

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-009 |
| **Type** | TP |
| **Category** | UI — Modal Close |

**Preconditions:** Modal is open.

**Steps:**
1. Click on the dark backdrop area (outside the modal container).

**Expected Result:** Modal closes.

**Pass Criteria:** Modal unmounted after backdrop click.

---

## TC-010 — Close Modal via Escape Key

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-010 |
| **Type** | TP |
| **Category** | UI — Modal Close |

**Preconditions:** Modal is open.

**Steps:**
1. Press the `Escape` key.

**Expected Result:** Modal closes.

**Pass Criteria:** `keydown` listener removes modal; focus returns to list.

---

## TC-011 — Only One Modal Open at a Time

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-011 |
| **Type** | TP |
| **Category** | UI — State Management |

**Preconditions:** Video list with 2+ assets.

**Steps:**
1. Click thumbnail of asset A → modal opens.
2. Without closing, click the backdrop (modal closes).
3. Click thumbnail of asset B → modal opens.

**Expected Result:** Only one modal is ever visible at a time; asset B's title appears after step 3.

**Pass Criteria:** At most one `fixed inset-0 z-50` element in DOM at any time.

---

## TC-012 — Clicking Inner Modal Container Does Not Close Modal

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-012 |
| **Type** | TP |
| **Category** | UI — Event Propagation |

**Preconditions:** Modal is open.

**Steps:**
1. Click directly on the modal's content area (header, video, footer).

**Expected Result:** Modal stays open; click event is stopped by `stopPropagation`.

**Pass Criteria:** Modal remains visible after clicking inside it.

---

## TC-013 — Error Overlay When Video Cannot Load

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-013 |
| **Type** | TP |
| **Category** | UI — Error Handling |

**Preconditions:** Asset with `file_url` pointing to a deleted or non-existent file.

**Steps:**
1. Open modal for that asset.

**Expected Result:** Player's `onError` callback fires; an error overlay appears inside the player area with a descriptive message.

**Pass Criteria:** Error overlay visible; "Unable to load video" or similar message shown.

---

## TC-014 — [FN Risk] Valid Video Not Playing Due to Null file_url and Broken Fallback

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-014 |
| **Type** | FN |
| **Category** | UI — URL Construction |

**Preconditions:** Asset where `file_url` is `null` (backend not restarted after schema change) AND `filename` has no extension (e.g., `filename = "video"`).

**Steps:**
1. Open modal.

**Expected Result (Bug):** Fallback `ext = filename.split(".").pop()` returns `"video"` (no dot), resulting in a broken URL like `.../original.video`. Video cannot play — FN.

**Pass Criteria:** Handle missing extension gracefully; show "No video file available" message rather than a broken player.

---

## TC-015 — [FP Risk] Modal Opens for Asset with No File

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-015 |
| **Type** | FP |
| **Category** | UI — Edge Case |

**Preconditions:** Asset record exists in DB but `file_path` is null (corrupted upload).

**Steps:**
1. Click thumbnail.

**Expected Result (Bug):** Modal opens and shows "No video file available for this asset." — this is correct behaviour. If instead the player tries to load an empty URL and silently fails, that is an FP (modal accepted but shows nothing useful).

**Pass Criteria:** Explicit "no file" message shown rather than an empty black player.

---

## ── DOWNLOAD BUTTON ───────────────────────────────────────────────

## TC-016 — Download Button Present in Actions Column

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-016 |
| **Type** | TP |
| **Category** | UI — Download |

**Preconditions:** Video list loaded.

**Steps:**
1. Navigate to `/video`.
2. Inspect the ACTIONS cell.

**Expected Result:** Both "Edit" and "Download" buttons present; Download has a ↓ icon.

**Pass Criteria:** Two buttons in the actions cell.

---

## TC-017 — Download Button Triggers File Download

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-017 |
| **Type** | TP |
| **Category** | UI — Download |

**Preconditions:** Asset with valid `file_url` (or fallback URL resolves correctly).

**Steps:**
1. Click "Download" on any asset row.

**Expected Result:** Browser initiates file download with the original filename (from `asset.filename`).

**Pass Criteria:** Download dialog appears (or file saves); filename matches `asset.filename`.

---

## TC-018 — Download Button Disabled When No File Available

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-018 |
| **Type** | TP |
| **Category** | UI — Download Disabled State |

**Preconditions:** Asset where both `file_url` is null and fallback URL cannot be constructed.

**Steps:**
1. Check Download button state.

**Expected Result:** Button has `disabled` attribute; `cursor-not-allowed` style; no download triggered on click.

**Pass Criteria:** `button[disabled]` attribute present; click is a no-op.

---

## TC-019 — Background Scroll Locked While Modal is Open

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-019 |
| **Type** | TP |
| **Category** | UI — UX |

**Preconditions:** Video list is long enough to scroll.

**Steps:**
1. Open player modal.
2. Attempt to scroll the page behind the modal.

**Expected Result:** `document.body.style.overflow = "hidden"` prevents background scroll.

**Pass Criteria:** Page does not scroll while modal is open; overflow restored on close.

---

## TC-020 — Video URL Construction: file_url Takes Priority Over Fallback

| Field | Value |
|-------|-------|
| **ID** | TST-004-TC-020 |
| **Type** | TP |
| **Category** | API — URL Resolution |

**Preconditions:** Asset with `file_url: "/storage/uploads/{id}/original.mp4"`.

**Steps:**
1. Inspect the `src` attribute of the `<video>` element inside the modal.

**Expected Result:** `src = "http://localhost:8000/storage/uploads/{id}/original.mp4"` (constructed via `storageUrl(asset.file_url)`, not the fallback path).

**Pass Criteria:** `src` uses `file_url`; does not fall back to filename-derived URL when `file_url` is present.
