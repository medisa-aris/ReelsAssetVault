"""Extract video metadata and generate a thumbnail using OpenCV + Pillow.

No system ffmpeg binary is required — OpenCV reads video natively via its own
codec pipeline (VideoCapture).
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


def extract_metadata(video_path: str) -> dict:
    """Read width, height, and duration from a video file.

    Returns a dict with keys: width, height, duration_seconds.
    Missing values are None (not all containers expose all fields).
    """
    try:
        import cv2  # lazy import to keep startup fast

        cap = cv2.VideoCapture(video_path)
        try:
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

            duration: Optional[float] = None
            if fps and fps > 0 and frame_count > 0:
                duration = round(frame_count / fps, 2)

            return {
                "width": width if width > 0 else None,
                "height": height if height > 0 else None,
                "duration_seconds": duration,
            }
        finally:
            cap.release()
    except Exception as exc:  # pragma: no cover
        logger.warning("Metadata extraction failed for %s: %s", video_path, exc)
        return {"width": None, "height": None, "duration_seconds": None}


def generate_thumbnail(video_path: str, thumbnail_path: str) -> bool:
    """Capture the first frame of *video_path* and save it as a JPEG thumbnail.

    Returns True on success, False if the frame could not be read.
    """
    try:
        import cv2
        from PIL import Image

        cap = cv2.VideoCapture(video_path)
        try:
            ret, frame = cap.read()
            if not ret or frame is None:
                logger.warning("Could not read first frame from %s", video_path)
                return False

            # BGR → RGB
            frame_rgb = frame[:, :, ::-1]
            img = Image.fromarray(frame_rgb)
            img.thumbnail((320, 180), Image.LANCZOS)

            Path(thumbnail_path).parent.mkdir(parents=True, exist_ok=True)
            img.save(thumbnail_path, "JPEG", quality=85)
            return True
        finally:
            cap.release()
    except Exception as exc:  # pragma: no cover
        logger.warning("Thumbnail generation failed for %s: %s", video_path, exc)
        return False
