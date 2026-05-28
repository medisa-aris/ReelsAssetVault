from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.auth import router as auth_router
from app.api.v1.assets import router as assets_router
from app.api.v1.tags import router as tags_router
from app.api.v1.admin import router as admin_router
from app.api.v1.ideations import router as ideations_router
from app.api.v1.scripts import router as scripts_router
from app.config import settings

app = FastAPI(title="ReelsAssetVault API", version="1.0.0")

_cors_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(assets_router)
app.include_router(tags_router)
app.include_router(admin_router)
app.include_router(ideations_router)
app.include_router(scripts_router)

# Serve uploaded files and thumbnails as static content
_storage_root = Path(__file__).resolve().parent.parent.parent / "storage"
_storage_root.mkdir(parents=True, exist_ok=True)
(_storage_root / "uploads").mkdir(parents=True, exist_ok=True)

app.mount("/storage", StaticFiles(directory=str(_storage_root)), name="storage")
