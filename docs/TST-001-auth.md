# TST-001: Authentication & User Management — Test Cases

| Field        | Value                              |
|--------------|------------------------------------|
| Document ID  | TST-001                            |
| Covers       | PRD-001 Authentication             |
| Author       | medisa-aris                        |
| Created      | 2026-05-28                         |
| Last Updated | 2026-05-28                         |

---

## Test Classification Key

| Type | Meaning |
|------|---------|
| **TP** (True Positive) | Valid input → system accepts → **PASS expected** |
| **TN** (True Negative) | Invalid input → system rejects → **PASS expected** (correct rejection) |
| **FP** (False Positive) | Invalid input → system accepts → **BUG** (too permissive) |
| **FN** (False Negative) | Valid input → system rejects → **BUG** (too restrictive) |

---

## TC-001 — Successful User Registration

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-001 |
| **Type** | TP |
| **Category** | Registration — API |

**Preconditions:** Email `newuser@example.com` does not exist in `app_user`.

**Steps:**
1. `POST /api/v1/auth/register` with `{ email: "newuser@example.com", password: "Secure123!", full_name: "New User" }`

**Expected Result:** `201 Created`; response contains `access_token`, `token_type: "bearer"`, and `user.email = "newuser@example.com"`.

**Pass Criteria:** Status = 201, token present, user record created in DB.

---

## TC-002 — Registration with Duplicate Email

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-002 |
| **Type** | TN |
| **Category** | Registration — API |

**Preconditions:** User `existing@example.com` already registered.

**Steps:**
1. `POST /api/v1/auth/register` with `{ email: "existing@example.com", password: "Secure123!", full_name: "Clone" }`

**Expected Result:** `400 Bad Request`; `detail: "Email already registered"`. No second record created.

**Pass Criteria:** Status = 400, original user record unchanged.

---

## TC-003 — Registration with Weak Password

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-003 |
| **Type** | TN |
| **Category** | Registration — Validation |

**Preconditions:** None.

**Steps:**
1. `POST /api/v1/auth/register` with `{ email: "weak@example.com", password: "abc", full_name: "Weak" }`

**Expected Result:** `422 Unprocessable Entity`; validation error referencing password requirements (min 8 chars, uppercase, digit).

**Pass Criteria:** Status = 422, no user created.

---

## TC-004 — Registration with Missing Required Fields

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-004 |
| **Type** | TN |
| **Category** | Registration — Validation |

**Preconditions:** None.

**Steps:**
1. `POST /api/v1/auth/register` with `{ email: "nofullname@example.com", password: "Secure123!" }` (omit `full_name`)

**Expected Result:** `422 Unprocessable Entity`; `full_name` listed as required field.

**Pass Criteria:** Status = 422, no user created.

---

## TC-005 — Registration with Invalid Email Format

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-005 |
| **Type** | TN |
| **Category** | Registration — Validation |

**Preconditions:** None.

**Steps:**
1. `POST /api/v1/auth/register` with `{ email: "not-an-email", password: "Secure123!", full_name: "Bad Email" }`

**Expected Result:** `422 Unprocessable Entity`; error references invalid email format.

**Pass Criteria:** Status = 422.

---

## TC-006 — Successful Login

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-006 |
| **Type** | TP |
| **Category** | Login — API |

**Preconditions:** User `user@example.com` / `Secure123!` registered and active.

**Steps:**
1. `POST /api/v1/auth/login` with `{ email: "user@example.com", password: "Secure123!" }`

**Expected Result:** `200 OK`; `access_token` present; `user.roles` array present.

**Pass Criteria:** Status = 200, valid JWT in response.

---

## TC-007 — Login with Wrong Password

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-007 |
| **Type** | TN |
| **Category** | Login — API |

**Preconditions:** User `user@example.com` registered.

**Steps:**
1. `POST /api/v1/auth/login` with `{ email: "user@example.com", password: "WrongPass99!" }`

**Expected Result:** `401 Unauthorized`; `detail: "Invalid credentials"`. Response does NOT mention which field is wrong.

**Pass Criteria:** Status = 401, generic error message (not "wrong password").

---

## TC-008 — Login with Non-Existent Email

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-008 |
| **Type** | TN |
| **Category** | Login — API |

**Preconditions:** Email `ghost@example.com` not registered.

**Steps:**
1. `POST /api/v1/auth/login` with `{ email: "ghost@example.com", password: "Secure123!" }`

**Expected Result:** `401 Unauthorized`; `detail: "Invalid credentials"`. Response does NOT reveal the email doesn't exist.

**Pass Criteria:** Status = 401, same generic error as TC-007 (no user enumeration).

---

## TC-009 — Login Response Includes Roles

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-009 |
| **Type** | TP |
| **Category** | Login — API |

**Preconditions:** Admin user `admin@example.com` has `admin` role assigned in `app_user_roles`.

**Steps:**
1. Login with admin credentials.

**Expected Result:** `user.roles` array contains `"admin"`.

**Pass Criteria:** `roles` field is an array with at least one entry.

---

## TC-010 — Access Protected Endpoint Without Token

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-010 |
| **Type** | TN |
| **Category** | JWT — Authorization |

**Preconditions:** None.

**Steps:**
1. `GET /api/v1/assets` with no `Authorization` header.

**Expected Result:** `401 Unauthorized`.

**Pass Criteria:** Status = 401, no asset data returned.

---

## TC-011 — Access Protected Endpoint with Invalid Token

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-011 |
| **Type** | TN |
| **Category** | JWT — Authorization |

**Preconditions:** None.

**Steps:**
1. `GET /api/v1/assets` with `Authorization: Bearer this.is.not.a.valid.jwt`

**Expected Result:** `401 Unauthorized`; `detail: "Invalid token"`.

**Pass Criteria:** Status = 401.

---

## TC-012 — Access Protected Endpoint with Expired Token

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-012 |
| **Type** | TN |
| **Category** | JWT — Expiry |

**Preconditions:** A JWT signed with `exp` set in the past.

**Steps:**
1. Forge or wait for a token with past `exp` claim.
2. `GET /api/v1/assets` with that expired token.

**Expected Result:** `401 Unauthorized`.

**Pass Criteria:** Status = 401, expired token not accepted.

---

## TC-013 — GET /auth/me Returns Correct User

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-013 |
| **Type** | TP |
| **Category** | Profile — API |

**Preconditions:** Valid token for `user@example.com`.

**Steps:**
1. `GET /api/v1/auth/me` with valid `Authorization: Bearer <token>`

**Expected Result:** `200 OK`; body contains `email: "user@example.com"`, `full_name`, `roles`, `created_at`.

**Pass Criteria:** Status = 200, fields match registered user.

---

## TC-014 — Password Stored as Bcrypt Hash (Not Plaintext)

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-014 |
| **Type** | TP |
| **Category** | Security — DB |

**Preconditions:** User registered.

**Steps:**
1. Query `SELECT password FROM app_user WHERE email = 'user@example.com'`

**Expected Result:** Value starts with `$2b$` (bcrypt prefix). Does NOT equal the plaintext password.

**Pass Criteria:** Stored value is a bcrypt hash.

---

## TC-015 — Default Roles Seeded in Database

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-015 |
| **Type** | TP |
| **Category** | Migration — DB |

**Preconditions:** Migration `0001` applied.

**Steps:**
1. `SELECT name FROM app_roles ORDER BY name`

**Expected Result:** Rows for `admin`, `editor`, `viewer` exist.

**Pass Criteria:** Exactly these three role names present.

---

## TC-016 — [FP Risk] Login Accepts Token After Logout (No Blacklist)

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-016 |
| **Type** | FP |
| **Category** | Security — JWT |

**Preconditions:** User logged in; token issued.

**Steps:**
1. User "logs out" (frontend clears localStorage/cookie).
2. Replay the original token against `GET /api/v1/auth/me`.

**Expected Result (Bug):** `200 OK` — token still valid because server-side blacklisting is not implemented.

**Notes:** This is a known accepted risk documented in PRD-001 § Non-Goals. Treat as FP until refresh token / blacklist is implemented.

**Pass Criteria:** Document this behaviour; do NOT fail the build for this.

---

## TC-017 — [FN Risk] Valid Admin Token Rejected on Role-Gated Route Due to Missing Role Assignment

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-017 |
| **Type** | FN |
| **Category** | Authorization — Role |

**Preconditions:** User has valid token but `app_user_roles` record was not created (role assignment step skipped during seed).

**Steps:**
1. `GET /api/v1/admin/ai-config` with token of user without any role assignment.

**Expected Result (Bug):** `403 Forbidden` — even if the user was intended to be admin.

**Notes:** Ensure seeding script always creates `app_user_roles` entries alongside the user.

---

## TC-018 — [FP Risk] Case-Insensitive Email Allows Duplicate Registration

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-018 |
| **Type** | FP |
| **Category** | Registration — Edge Case |

**Preconditions:** `user@example.com` already registered.

**Steps:**
1. `POST /api/v1/auth/register` with `email: "USER@EXAMPLE.COM"`.

**Expected Result (Bug):** If the unique constraint is case-sensitive at DB level, this creates a second account for the same email — a FP that allows duplicate registration.

**Pass Criteria:** Registration should fail with `400`. Verify email is lowercased before insert.

---

## TC-019 — Public Endpoints Are Not Token-Gated

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-019 |
| **Type** | TP |
| **Category** | Authorization — Public Routes |

**Preconditions:** None.

**Steps:**
1. `POST /api/v1/auth/register` with no Authorization header.
2. `POST /api/v1/auth/login` with no Authorization header.

**Expected Result:** Both return their normal responses (201 / 200). They are public.

**Pass Criteria:** No `401` on public endpoints.

---

## TC-020 — Token Carries Correct `sub` Claim

| Field | Value |
|-------|-------|
| **ID** | TST-001-TC-020 |
| **Type** | TP |
| **Category** | JWT — Payload |

**Preconditions:** Valid token issued after login.

**Steps:**
1. Decode the JWT payload (base64 decode the middle segment).
2. Check `sub` claim.

**Expected Result:** `sub` equals the user's UUID from `app_user.id`.

**Pass Criteria:** `sub` is a valid UUID matching the user record.
