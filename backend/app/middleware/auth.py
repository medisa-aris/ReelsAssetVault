from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db

security = HTTPBearer()


def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(token.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_admin(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> str:
    """Dependency that allows only users with the 'admin' role."""
    from app.models.role import AppRole
    from app.models.user_role import AppUserRole

    rows = (
        db.query(AppRole.name)
        .join(AppUserRole, AppUserRole.role_id == AppRole.id)
        .filter(AppUserRole.user_id == UUID(user_id))
        .all()
    )
    roles = [r.name for r in rows]
    if "admin" not in roles:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user_id
