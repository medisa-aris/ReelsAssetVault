from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
from fastapi import HTTPException
from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.role import AppRole
from app.models.user import AppUser
from app.models.user_role import AppUserRole
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.user import UserResponse


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _get_user_roles(db: Session, user_id: UUID) -> list[str]:
    rows = (
        db.query(AppRole.name)
        .join(AppUserRole, AppUserRole.role_id == AppRole.id)
        .filter(AppUserRole.user_id == user_id)
        .all()
    )
    return [r.name for r in rows]


def _user_response(user: AppUser, roles: list[str]) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        roles=roles,
        created_at=user.created_at,
    )


def register(db: Session, data: RegisterRequest) -> dict:
    if db.query(AppUser).filter(AppUser.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = AppUser(email=data.email, full_name=data.full_name, password=_hash_password(data.password))
    db.add(user)
    db.flush()

    viewer = db.query(AppRole).filter(AppRole.name == "viewer").first()
    if viewer:
        db.add(AppUserRole(user_id=user.id, role_id=viewer.id))

    db.commit()
    db.refresh(user)

    roles = _get_user_roles(db, user.id)
    return {
        "access_token": _create_token(str(user.id)),
        "token_type": "bearer",
        "user": _user_response(user, roles),
    }


def login(db: Session, data: LoginRequest) -> dict:
    user = db.query(AppUser).filter(AppUser.email == data.email).first()
    if not user or not _verify_password(data.password, user.password) or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    roles = _get_user_roles(db, user.id)
    return {
        "access_token": _create_token(str(user.id)),
        "token_type": "bearer",
        "user": _user_response(user, roles),
    }


def get_profile(db: Session, user_id: str) -> UserResponse:
    user = db.query(AppUser).filter(AppUser.id == UUID(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_response(user, _get_user_roles(db, user.id))
