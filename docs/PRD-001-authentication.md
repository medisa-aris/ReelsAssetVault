# PRD-001: Authentication & User Management

| Field        | Value                        |
|--------------|------------------------------|
| Document ID  | PRD-001                      |
| Feature      | Authentication & User Management |
| Status       | Draft                        |
| Author       | medisa-aris                  |
| Created      | 2026-05-28                   |
| Last Updated | 2026-05-28                   |

---

## 1. Overview

This document defines the requirements for the authentication and user management system in ReelsAssetVault. This is the foundational feature (PR #1) that all other features depend on — no asset management, search, or collaboration feature can function without knowing who the user is and what they are permitted to do.

---

## 2. Problem Statement

ReelsAssetVault is a multi-user platform. Without authentication:
- Anyone with the URL can access all assets
- There is no concept of ownership or access control
- Role-based permissions (e.g., admin vs viewer) cannot be enforced

---

## 3. Goals

- Allow users to register and log in securely
- Issue and validate session tokens for API access
- Establish a role-based access control (RBAC) foundation that can be extended to cover granular permissions per feature

---

## 4. Non-Goals (Out of Scope for This PR)

- OAuth / social login (Google, Facebook, etc.)
- Password reset via email
- Two-factor authentication (2FA)
- Granular permission assignment to roles (structure will be created; mapping to features is future work)
- Admin UI for managing users and roles

---

## 5. User Stories

### Registration
> As a new user, I want to create an account with my email and password so that I can access the platform.

**Acceptance Criteria:**
- User provides `email`, `password`, `full_name`
- Email must be unique — duplicate registration returns a clear error
- Password is stored hashed (bcrypt), never in plain text
- On success, user record is created and a JWT token is returned
- On failure (validation error, duplicate email), a descriptive error is returned

### Login
> As a registered user, I want to log in with my email and password so that I can access my assets.

**Acceptance Criteria:**
- User provides `email` and `password`
- Backend validates credentials against stored hash
- On success, a JWT access token is returned
- On failure (wrong credentials), a `401 Unauthorized` response is returned — no detail about which field is wrong (security)
- Token expires after 24 hours

### Protected Routes
> As the system, I want to reject unauthenticated requests to protected endpoints so that assets are only accessible to logged-in users.

**Acceptance Criteria:**
- All API endpoints except `/auth/register` and `/auth/login` require a valid JWT in the `Authorization: Bearer <token>` header
- Expired or invalid tokens return `401 Unauthorized`
- A missing token returns `401 Unauthorized`

---

## 6. Database Schema

### 6.1 `app_user`

Stores registered user accounts.

```sql
CREATE TABLE app_user (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    full_name   VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,       -- bcrypt hash
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_user_email ON app_user (email);
```

| Column       | Type         | Notes                              |
|--------------|--------------|------------------------------------|
| `id`         | UUID         | Primary key, auto-generated        |
| `email`      | VARCHAR(255) | Unique, used for login             |
| `full_name`  | VARCHAR(255) | Display name                       |
| `password`   | VARCHAR(255) | bcrypt hash — never plain text     |
| `is_active`  | BOOLEAN      | Soft disable without deleting user |
| `created_at` | TIMESTAMPTZ  | Record creation timestamp          |
| `updated_at` | TIMESTAMPTZ  | Last update timestamp              |

---

### 6.2 `app_roles`

Defines available roles in the system. Roles represent a named permission group (e.g., `admin`, `editor`, `viewer`). Each role will later be mapped to granular feature-level permissions.

```sql
CREATE TABLE app_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,  -- e.g. 'admin', 'editor', 'viewer'
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_roles (name, description) VALUES
    ('admin',   'Full access to all features and user management'),
    ('editor',  'Can upload, edit, and delete own assets'),
    ('viewer',  'Read-only access to assets');
```

| Column        | Type         | Notes                                    |
|---------------|--------------|------------------------------------------|
| `id`          | UUID         | Primary key, auto-generated              |
| `name`        | VARCHAR(100) | Unique role identifier, used in code     |
| `description` | TEXT         | Human-readable description               |
| `is_active`   | BOOLEAN      | Allows disabling a role without deletion |
| `created_at`  | TIMESTAMPTZ  | Record creation timestamp                |
| `updated_at`  | TIMESTAMPTZ  | Last update timestamp                    |

**Seeded Roles:**

| Role     | Description                                          |
|----------|------------------------------------------------------|
| `admin`  | Full access to all features and user management      |
| `editor` | Can upload, edit, and delete own assets              |
| `viewer` | Read-only access to assets                           |

---

### 6.3 `app_user_roles`

Many-to-many mapping between users and roles. A user can hold multiple roles.

```sql
CREATE TABLE app_user_roles (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role_id    UUID NOT NULL REFERENCES app_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES app_user(id),  -- who granted this role

    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX idx_app_user_roles_user_id ON app_user_roles (user_id);
CREATE INDEX idx_app_user_roles_role_id ON app_user_roles (role_id);
```

| Column        | Type        | Notes                                          |
|---------------|-------------|------------------------------------------------|
| `id`          | UUID        | Primary key, auto-generated                    |
| `user_id`     | UUID        | FK → `app_user.id`, cascades on delete         |
| `role_id`     | UUID        | FK → `app_roles.id`, cascades on delete        |
| `assigned_at` | TIMESTAMPTZ | When the role was granted                      |
| `assigned_by` | UUID        | FK → `app_user.id` of the admin who assigned   |

**Constraint:** A user cannot be assigned the same role twice (`UNIQUE (user_id, role_id)`).

---

### 6.4 Entity Relationship Diagram

```
app_user                 app_user_roles            app_roles
─────────────────        ──────────────────         ──────────────────
id (PK)         ◄────── user_id (FK)               id (PK)
email                    role_id (FK)  ──────────► name
full_name                assigned_at               description
password                 assigned_by               is_active
is_active                                          created_at
created_at
updated_at
```

---

## 7. API Endpoints

### `POST /api/v1/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "Jane Doe"
}
```

**Validation Rules:**
- `email`: valid email format, required
- `password`: minimum 8 characters, at least one uppercase, one digit, required
- `full_name`: non-empty string, required

**Response `201 Created`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Doe"
  }
}
```

**Response `400 Bad Request` (duplicate email):**
```json
{
  "detail": "Email already registered"
}
```

---

### `POST /api/v1/auth/login`

Authenticate a user and receive a token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "roles": ["editor"]
  }
}
```

**Response `401 Unauthorized`:**
```json
{
  "detail": "Invalid credentials"
}
```

---

### `GET /api/v1/auth/me`

Return the currently authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response `200 OK`:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "roles": ["editor"],
  "created_at": "2026-05-28T10:00:00Z"
}
```

---

## 8. Security Requirements

| Requirement               | Implementation                                          |
|---------------------------|---------------------------------------------------------|
| Password storage          | bcrypt with salt rounds ≥ 12                            |
| Token format              | JWT signed with HS256 (or RS256 for production)         |
| Token expiry              | 24 hours (`exp` claim)                                  |
| Failed login response     | Generic "Invalid credentials" — do not reveal which field failed |
| HTTPS                     | Required in staging and production                      |
| Token invalidation        | Not in scope for this PR (no refresh token or blacklist) |

---

## 9. Backend Implementation Notes

### Directory Structure

```
backend/app/
├── api/v1/
│   └── auth.py               # Register, login, me endpoints
├── models/
│   ├── user.py               # AppUser SQLAlchemy model
│   ├── role.py               # AppRole SQLAlchemy model
│   └── user_role.py          # AppUserRole SQLAlchemy model
├── schemas/
│   ├── auth.py               # RegisterRequest, LoginRequest, TokenResponse
│   └── user.py               # UserResponse
├── services/
│   └── auth_service.py       # Register, login, get_current_user logic
└── middleware/
    └── auth.py               # JWT decode dependency (FastAPI Depends)
```

### Key Dependencies to Add (`requirements.txt`)

```
passlib[bcrypt]==1.7.4     # Password hashing
python-jose[cryptography]  # JWT encode/decode
python-multipart           # Form parsing (for login form if needed)
```

### JWT Auth Dependency Pattern

```python
# middleware/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jose import JWTError, jwt

security = HTTPBearer()

async def get_current_user(token=Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id
```

Usage in any protected endpoint:
```python
@router.get("/assets")
async def list_assets(current_user=Depends(get_current_user)):
    ...
```

---

## 10. Frontend Implementation Notes

### Pages Required

| Route           | Component         | Description                        |
|-----------------|-------------------|------------------------------------|
| `/login`        | `LoginPage`       | Email + password form              |
| `/register`     | `RegisterPage`    | Full name, email, password form    |

### Auth State

- Store JWT in `httpOnly` cookie (preferred) or `localStorage`
- Create `useAuth` hook exposing `user`, `login()`, `register()`, `logout()`
- Redirect unauthenticated users to `/login`
- Redirect authenticated users away from `/login` and `/register`

---

## 11. Acceptance Criteria Summary

| # | Criteria                                                                 | Verified By         |
|---|--------------------------------------------------------------------------|---------------------|
| 1 | User can register with valid email, password, full name                  | API test + UI       |
| 2 | Duplicate email registration returns `400` with clear message            | API test            |
| 3 | User can log in with correct credentials and receive JWT                 | API test + UI       |
| 4 | Invalid credentials return `401` with generic message                    | API test            |
| 5 | Protected endpoints return `401` without valid token                     | API test            |
| 6 | `app_user`, `app_roles`, `app_user_roles` tables created via migration   | DB migration test   |
| 7 | Default roles (`admin`, `editor`, `viewer`) are seeded                   | DB seed test        |
| 8 | Passwords are stored as bcrypt hashes, never plain text                  | Code review + DB    |
| 9 | JWT tokens expire after 24 hours                                         | API test            |

---

## 12. Open Questions

| # | Question                                                                 | Owner       | Status  |
|---|--------------------------------------------------------------------------|-------------|---------|
| 1 | Should new registrations be assigned `viewer` role by default?           | medisa-aris | Open    |
| 2 | Should the first registered user automatically get `admin` role?         | medisa-aris | Open    |
| 3 | Do we need refresh tokens in this PR, or is a 24h expiry sufficient?    | medisa-aris | Open    |

---

## 13. Future Scope (Not in This PR)

- Password reset via email (forgot password flow)
- OAuth2 login (Google, GitHub)
- Two-factor authentication
- Admin UI: manage users, assign/revoke roles
- Granular permission mapping: link `app_roles` to specific features/actions
- Token blacklisting / logout invalidation
- Refresh token rotation
