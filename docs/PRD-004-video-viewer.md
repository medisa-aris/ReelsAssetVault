# PRD-004: Video Viewer (In-Table Player Modal)

| Field        | Value                                        |
|--------------|----------------------------------------------|
| Document ID  | PRD-004                                      |
| Feature      | Video Viewer — Play Button & Modal Player    |
| Depends On   | PRD-001 (Auth), PRD-002 (Assets)             |
| Status       | Draft                                        |
| Author       | medisa-aris                                  |
| Created      | 2026-05-28                                   |
| Last Updated | 2026-05-28                                   |

---

## 1. Overview

PRD-004 adds an inline video viewer to the asset library. A play button overlay appears on each row's snapshot thumbnail; clicking it opens a full-featured modal media player so users can preview the video without leaving the list page.

---

## 2. Problem Statement

Currently, the video list page (`/video`) shows a static thumbnail for each asset. To watch a clip, a user has no in-app option — they must navigate away, locate the file on disk, or open a separate player. This breaks the review workflow and slows down content approval decisions.

---

## 3. Goals

- Add a **play button overlay** on the snapshot thumbnail in `VideoTableRow`
- Clicking the thumbnail (or play button) opens a **modal media player**
- Use `react-player` as the media player library for broad format support and built-in controls
- Display key asset metadata (title, duration, resolution, file size) in the modal header
- Allow users to close the modal via the × button, clicking the backdrop, or pressing Escape
- Expose the video file URL from the backend so the frontend can construct the `<video>` src reliably

---

## 4. Non-Goals (Out of Scope for This PR)

- Video transcoding or adaptive streaming (HLS/DASH)
- Subtitles or captions
- Playback speed controls beyond what `react-player` provides natively
- Picture-in-picture mode
- Download button (may be a future PR)
- Mobile-specific player UI

---

## 5. User Story

> As a user browsing the video library, I want to click a thumbnail and immediately watch the video in a player modal so that I can review content without leaving the list.

**Acceptance Criteria:**
- A semi-transparent play button (▶) is visible on every thumbnail that has a video file
- Clicking the thumbnail or play button opens the modal
- Modal shows: video player (with play/pause, scrubber, volume, fullscreen), title, resolution, duration, file size
- Player starts paused on open
- Closing the modal (× / backdrop / Escape) stops playback and unmounts the player
- If the video cannot be loaded, a friendly error message appears inside the modal

---

## 6. UI Specification

### 6.1 Thumbnail Play Overlay (`VideoTableRow`)

```
┌──────────────────────────────────────────────────────────────────┐
│  SNAPSHOT         │ TITLE              │ RES  │ SIZE │ DUR │ ... │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  │                    │      │      │     │     │
│  │  [thumbnail]│  │ Video Title Here   │1920× │24 MB │0:45 │ ... │
│  │    [  ▶  ] │  │  #tag1 #tag2       │1080  │      │     │     │
│  └─────────────┘  │                    │      │      │     │     │
```

- Play icon: white circle with ▶ centered, semi-transparent black background
- Overlay appears at 60% opacity at rest; 100% on thumbnail hover
- Entire thumbnail cell is `cursor-pointer`

### 6.2 Video Player Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  [×]  Asset video sample reels capcut                            │
│  ─────────────────────────────────────────────────────────────  │
│  1920×1080 · 45s · 24.5 MB                                      │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │                   react-player                            │  │
│  │              (16:9, fills modal width)                    │  │
│  │                                                           │  │
│  │  ▶ ──────────────────────────────── 0:12 / 0:45  🔊 ⛶  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

- Modal max-width: `max-w-4xl` (896 px), centered, rounded-xl, shadow-2xl
- Background: black (`bg-black`) so letterboxed videos look clean
- Header: white bar with title and close button; metadata sub-line in gray
- Player fills full modal width with 16:9 aspect ratio (`aspect-video`)
- Backdrop: `bg-black/60 backdrop-blur-sm`, click-to-close

---

## 7. Technical Design

### 7.1 New Dependency

```bash
npm install react-player
```

`react-player` wraps an HTML5 `<video>` element and supports mp4, mov, webm, avi. It is lazy-loaded so it does not add to the initial bundle.

### 7.2 Backend Change — Expose `file_url`

The current `AssetResponse` schema (`backend/app/schemas/asset.py`) does not include the video file path. Add `file_url: str | None` to the response so the frontend can reference it directly.

**`backend/app/schemas/asset.py`** — add field:
```python
file_url: Optional[str] = None
```

**`backend/app/services/asset_service.py`** — populate in `_build_response()`:
```python
file_url: Optional[str] = None
if asset.file_path:
    file_url = f"/storage/{asset.file_path}"
```

**`frontend/lib/types.ts`** — add to `Asset` interface:
```typescript
file_url: string | null;
```

The frontend then constructs the playback URL with the existing `storageUrl()` utility:
```typescript
const videoSrc = storageUrl(asset.file_url);   // → http://localhost:8000/storage/uploads/{id}/original.mp4
```

### 7.3 New Component — `VideoPlayerModal`

**File:** `frontend/components/VideoPlayerModal.tsx`

```
Props:
  asset: Asset          — the asset being played
  onClose: () => void   — called when modal should close
```

**Behaviour:**
- Mounts `ReactPlayer` with `url={videoSrc}`, `controls={true}`, `playing={false}`, `width="100%"`, `height="100%"`
- `wrapper` class: `aspect-video bg-black`
- `onError` callback sets `playerError` state → shows error banner inside modal
- `useEffect` adds Escape key listener; returns cleanup
- Backdrop div has `onClick={onClose}`; inner container has `onClick={(e) => e.stopPropagation()}`

### 7.4 Modified Component — `VideoTableRow`

**File:** `frontend/components/VideoTableRow.tsx`

- Add `playingAsset: Asset | null` state (lifted to `VideoTable` or kept local — see §7.5)
- Thumbnail cell:
  - Wrap in `<button onClick={() => setPlayingAsset(asset)}>` (or callback prop)
  - Add overlay div with play icon, positioned absolute, fade on hover

### 7.5 State Lifting Strategy

Keep play state **in `VideoTable`** (same pattern as `editingAsset`):

```typescript
const [playingAsset, setPlayingAsset] = useState<Asset | null>(null);
```

- Pass `onPlay={(asset) => setPlayingAsset(asset)}` down to each `VideoTableRow`
- `VideoTable` renders `<VideoPlayerModal>` when `playingAsset !== null`
- `onClose` sets `playingAsset` back to `null`

This prevents multiple modals from opening simultaneously and mirrors the existing `EditMetadataModal` integration pattern exactly.

---

## 8. Files Modified / Created

### Backend (modified)
| File | Change |
|------|--------|
| `backend/app/schemas/asset.py` | Add `file_url: Optional[str]` to `AssetResponse` |
| `backend/app/services/asset_service.py` | Populate `file_url` in `_build_response()` |

### Frontend (new)
| File | Description |
|------|-------------|
| `frontend/components/VideoPlayerModal.tsx` | Modal with `react-player` inside |

### Frontend (modified)
| File | Change |
|------|--------|
| `frontend/lib/types.ts` | Add `file_url: string \| null` to `Asset` |
| `frontend/components/VideoTableRow.tsx` | Add thumbnail play overlay; accept `onPlay` prop |
| `frontend/components/VideoTable.tsx` | Add `playingAsset` state; render `VideoPlayerModal`; pass `onPlay` to rows |
| `frontend/package.json` | Add `react-player` dependency |

---

## 9. Acceptance Criteria

| # | Criteria | Verified By |
|---|----------|-------------|
| 1 | Play button overlay visible on all thumbnails | Visual inspection |
| 2 | Clicking thumbnail opens modal with correct video | End-to-end click test |
| 3 | Player renders with native controls (play/pause/scrubber/volume/fullscreen) | Visual |
| 4 | Modal header shows asset title, resolution, duration, file size | Visual |
| 5 | Pressing Escape closes the modal | Keyboard test |
| 6 | Clicking backdrop closes the modal | Click test |
| 7 | Closing the modal stops playback | Audio/visual test |
| 8 | If video fails to load, an error message appears in the modal | Error simulation |
| 9 | Only one player modal open at a time | Multi-click test |
| 10 | `GET /assets` response includes `file_url` field | API test |
| 11 | No impact on Edit Metadata modal behaviour | Regression test |

---

## 10. Future Scope

- Keyboard shortcuts inside the player (space = play/pause, ← → = seek ±10s)
- Download button in modal footer
- Picture-in-picture (PiP) toggle
- Loop toggle for review workflows
- Thumbnail seek preview on scrubber hover
