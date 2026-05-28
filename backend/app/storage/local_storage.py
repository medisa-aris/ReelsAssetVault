"""Local file storage helpers for video assets."""
from pathlib import Path
import aiofiles
from fastapi import UploadFile

# Resolve storage root relative to the project root (two levels above backend/)
STORAGE_ROOT: Path = Path(__file__).resolve().parent.parent.parent.parent / "storage"
UPLOADS_DIR: Path = STORAGE_ROOT / "uploads"


def get_asset_dir(asset_id: str) -> Path:
    """Return (and create) the directory for a specific asset's files."""
    d = UPLOADS_DIR / asset_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def get_file_path(asset_id: str, suffix: str) -> Path:
    """Return the full path for the asset's video file, e.g. .mp4"""
    return get_asset_dir(asset_id) / f"original{suffix}"


def get_thumbnail_path(asset_id: str) -> Path:
    """Return the full path for the asset's thumbnail image."""
    return get_asset_dir(asset_id) / "thumbnail.jpg"


def storage_relative_path(absolute_path: Path) -> str:
    """Convert absolute storage path to a relative URL path (/storage/uploads/...)."""
    return "/" + str(absolute_path.relative_to(STORAGE_ROOT.parent)).replace("\\", "/")


async def save_upload(upload: UploadFile, dest: Path) -> int:
    """Stream-write an UploadFile to dest, return bytes written."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    total = 0
    async with aiofiles.open(dest, "wb") as f:
        while chunk := await upload.read(1024 * 1024):  # 1 MB chunks
            await f.write(chunk)
            total += len(chunk)
    return total


def delete_asset_files(asset_id: str) -> None:
    """Remove the entire asset directory from disk."""
    import shutil
    asset_dir = UPLOADS_DIR / asset_id
    if asset_dir.exists():
        shutil.rmtree(asset_dir)
