/**
 * TST-001: Authentication & User Management — Playwright API Tests
 *
 * Covers all 20 test cases defined in docs/TST-001-auth.md.
 * All tests are API-level (no browser). Backend must be running at BASE_URL.
 *
 * Run:  npx playwright test auth
 * Env:  copy tests/.env.example → tests/.env and fill in SECRET_KEY / ADMIN_EMAIL
 */

import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  DEFAULT_PASSWORD,
  registerUser,
  loginUser,
  expiredToken,
  decodeJwtPayload,
} from "../helpers/auth";

// ──────────────────────────────────────────────────────────────────────────────
// SECTION: Registration
// ──────────────────────────────────────────────────────────────────────────────

test.describe("Registration", () => {
  // TC-001 — Successful User Registration
  test("TST-001-TC-001 | Valid registration returns 201 with access_token", async ({
    request,
  }) => {
    const email = uniqueEmail("tc001");

    const res = await request.post("/api/v1/auth/register", {
      data: { email, password: DEFAULT_PASSWORD, full_name: "New User" },
    });

    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(body.token_type).toBe("bearer");
    expect(body.user.email).toBe(email);
    expect(Array.isArray(body.user.roles)).toBe(true);
    expect(body.user.id).toBeTruthy();
  });

  // TC-002 — Registration with Duplicate Email
  test("TST-001-TC-002 | Duplicate email registration returns 400", async ({
    request,
  }) => {
    const email = uniqueEmail("tc002");

    // First registration — should succeed
    const first = await request.post("/api/v1/auth/register", {
      data: { email, password: DEFAULT_PASSWORD, full_name: "First User" },
    });
    expect(first.status()).toBe(201);

    // Second registration with same email — should fail
    const second = await request.post("/api/v1/auth/register", {
      data: { email, password: DEFAULT_PASSWORD, full_name: "Clone" },
    });
    expect(second.status()).toBe(400);

    const body = await second.json();
    expect(body.detail).toMatch(/already registered/i);
  });

  // TC-003 — Registration with Weak Password
  test("TST-001-TC-003 | Weak password returns 422", async ({ request }) => {
    const res = await request.post("/api/v1/auth/register", {
      data: {
        email: uniqueEmail("tc003"),
        password: "abc", // too short, no uppercase, no digit
        full_name: "Weak",
      },
    });

    expect(res.status()).toBe(422);
  });

  // TC-004 — Registration with Missing Required Fields
  test("TST-001-TC-004 | Missing full_name returns 422", async ({ request }) => {
    const res = await request.post("/api/v1/auth/register", {
      data: {
        email: uniqueEmail("tc004"),
        password: DEFAULT_PASSWORD,
        // full_name intentionally omitted
      },
    });

    expect(res.status()).toBe(422);

    const body = await res.json();
    const fields = JSON.stringify(body);
    expect(fields).toMatch(/full_name/i);
  });

  // TC-005 — Registration with Invalid Email Format
  test("TST-001-TC-005 | Invalid email format returns 422", async ({
    request,
  }) => {
    const res = await request.post("/api/v1/auth/register", {
      data: {
        email: "not-an-email",
        password: DEFAULT_PASSWORD,
        full_name: "Bad Email",
      },
    });

    expect(res.status()).toBe(422);
  });

  // TC-018 — Case-Insensitive Email Duplicate Prevention (FP risk)
  test("TST-001-TC-018 | Uppercase variant of existing email returns 400 [FP guard]", async ({
    request,
  }) => {
    const base = uniqueEmail("tc018");
    const upper = base.toUpperCase();

    // Register with lowercase
    await request.post("/api/v1/auth/register", {
      data: { email: base, password: DEFAULT_PASSWORD, full_name: "Original" },
    });

    // Attempt with uppercase
    const res = await request.post("/api/v1/auth/register", {
      data: { email: upper, password: DEFAULT_PASSWORD, full_name: "Clone" },
    });

    // Must reject — email should be case-insensitively unique
    expect(res.status()).toBe(400);
  });

  // TC-019 — Public Endpoints Are Not Token-Gated
  test("TST-001-TC-019 | Register and login endpoints are public (no 401)", async ({
    request,
  }) => {
    const email = uniqueEmail("tc019");

    // Register without Authorization header — should succeed
    const regRes = await request.post("/api/v1/auth/register", {
      data: { email, password: DEFAULT_PASSWORD, full_name: "Public User" },
    });
    expect(regRes.status()).toBe(201);

    // Login without Authorization header — should succeed
    const loginRes = await request.post("/api/v1/auth/login", {
      data: { email, password: DEFAULT_PASSWORD },
    });
    expect(loginRes.status()).toBe(200);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION: Login
// ──────────────────────────────────────────────────────────────────────────────

test.describe("Login", () => {
  // TC-006 — Successful Login
  test("TST-001-TC-006 | Valid login returns 200 with access_token and roles", async ({
    request,
  }) => {
    const email = uniqueEmail("tc006");
    await registerUser(request, email);

    const res = await request.post("/api/v1/auth/login", {
      data: { email, password: DEFAULT_PASSWORD },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.access_token).toBeTruthy();
    expect(body.token_type).toBe("bearer");
    expect(Array.isArray(body.user.roles)).toBe(true);
  });

  // TC-007 — Login with Wrong Password
  test("TST-001-TC-007 | Wrong password returns 401 with generic message", async ({
    request,
  }) => {
    const email = uniqueEmail("tc007");
    await registerUser(request, email);

    const res = await request.post("/api/v1/auth/login", {
      data: { email, password: "WrongPass99!" },
    });

    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.detail).toMatch(/invalid credentials/i);
  });

  // TC-008 — Login with Non-Existent Email (no user enumeration)
  test("TST-001-TC-008 | Non-existent email returns 401 with same generic message", async ({
    request,
  }) => {
    const res = await request.post("/api/v1/auth/login", {
      data: {
        email: "ghost_does_not_exist_9999@example.com",
        password: DEFAULT_PASSWORD,
      },
    });

    expect(res.status()).toBe(401);

    const body = await res.json();
    // Must use the same generic message as TC-007 — no user enumeration
    expect(body.detail).toMatch(/invalid credentials/i);
  });

  // TC-009 — Login Response Includes Admin Role
  test("TST-001-TC-009 | Admin user login includes admin in roles", async ({
    request,
  }) => {
    test.skip(
      !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD,
      "ADMIN_EMAIL / ADMIN_PASSWORD not set in tests/.env — skipping TC-009"
    );

    const res = await request.post("/api/v1/auth/login", {
      data: {
        email: process.env.ADMIN_EMAIL!,
        password: process.env.ADMIN_PASSWORD!,
      },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.user.roles).toContain("admin");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION: JWT Authorization
// ──────────────────────────────────────────────────────────────────────────────

test.describe("JWT Authorization", () => {
  // TC-010 — Access Protected Endpoint Without Token
  test("TST-001-TC-010 | No token on protected endpoint returns 401", async ({
    request,
  }) => {
    const res = await request.get("/api/v1/assets");
    expect(res.status()).toBe(401);
  });

  // TC-011 — Access Protected Endpoint with Invalid Token
  test("TST-001-TC-011 | Invalid token on protected endpoint returns 401", async ({
    request,
  }) => {
    const res = await request.get("/api/v1/assets", {
      headers: { Authorization: "Bearer this.is.not.a.valid.jwt" },
    });

    expect(res.status()).toBe(401);
  });

  // TC-012 — Access Protected Endpoint with Expired Token
  test("TST-001-TC-012 | Expired token on protected endpoint returns 401", async ({
    request,
  }) => {
    test.skip(
      !process.env.SECRET_KEY,
      "SECRET_KEY not set in tests/.env — skipping TC-012"
    );

    const token = expiredToken(process.env.SECRET_KEY!);
    const res = await request.get("/api/v1/assets", {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(401);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION: Profile
// ──────────────────────────────────────────────────────────────────────────────

test.describe("Profile", () => {
  // TC-013 — GET /auth/me Returns Correct User
  test("TST-001-TC-013 | GET /auth/me returns correct user fields", async ({
    request,
  }) => {
    const email = uniqueEmail("tc013");
    const reg = await registerUser(request, email, DEFAULT_PASSWORD, "Profile User");

    const res = await request.get("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${reg.access_token}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.email).toBe(email);
    expect(body.full_name).toBe("Profile User");
    expect(Array.isArray(body.roles)).toBe(true);
    expect(body.created_at).toBeTruthy();
    expect(body.id).toBe(reg.user.id);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SECTION: Security
// ──────────────────────────────────────────────────────────────────────────────

test.describe("Security", () => {
  // TC-014 — Password Not Exposed in API Responses
  test("TST-001-TC-014 | Password field is never returned in API responses", async ({
    request,
  }) => {
    const email = uniqueEmail("tc014");

    // Check register response
    const regRes = await request.post("/api/v1/auth/register", {
      data: { email, password: DEFAULT_PASSWORD, full_name: "Secure User" },
    });
    const regBody = await regRes.json();
    expect(regBody.password).toBeUndefined();
    expect(regBody.user?.password).toBeUndefined();

    // Check /me response
    const meRes = await request.get("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${regBody.access_token}` },
    });
    const meBody = await meRes.json();
    expect(meBody.password).toBeUndefined();
  });

  // TC-015 — Default Roles Seeded (viewer auto-assigned on registration)
  test("TST-001-TC-015 | New user automatically receives viewer role", async ({
    request,
  }) => {
    const email = uniqueEmail("tc015");
    const reg = await registerUser(request, email);

    // viewer role must be present
    expect(reg.user.roles).toContain("viewer");
  });

  // TC-016 — [FP] Token Replay After Logout (Known Accepted Risk)
  test("TST-001-TC-016 | [FP] Token remains valid after client-side logout [known accepted risk]", async ({
    request,
  }) => {
    test.info().annotations.push({
      type: "known-fp",
      description:
        "No server-side blacklist implemented (PRD-001 §Non-Goals). " +
        "Token stays valid after logout until expiry. " +
        "This is a documented FP — do NOT fail the build for this.",
    });

    const email = uniqueEmail("tc016");
    const reg = await registerUser(request, email);

    // Simulate logout: client would clear localStorage, but token is still valid server-side
    // Replaying the token must still return 200 (the FP behaviour)
    const res = await request.get("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${reg.access_token}` },
    });

    // Assert the FP: server accepts the "logged out" token
    expect(res.status()).toBe(200);
  });

  // TC-017 — [FN] Admin Route Rejects Token Without Role Assignment
  test("TST-001-TC-017 | [FN] User without role assignment gets 403 on admin route", async ({
    request,
  }) => {
    // This scenario is hard to reproduce without direct DB access to skip role assignment.
    // We approximate it by using a freshly registered viewer (no admin role)
    // and verifying they get 403 on an admin-only route.
    const email = uniqueEmail("tc017");
    const reg = await registerUser(request, email);

    // New users get viewer role — they must NOT be able to access admin AI config
    const res = await request.get("/api/v1/admin/ai-config", {
      headers: { Authorization: `Bearer ${reg.access_token}` },
    });

    expect(res.status()).toBe(403);
  });

  // TC-020 — Token Carries Correct `sub` Claim
  test("TST-001-TC-020 | JWT sub claim matches registered user UUID", async ({
    request,
  }) => {
    const email = uniqueEmail("tc020");
    const reg = await registerUser(request, email);

    const payload = decodeJwtPayload(reg.access_token);

    // sub must equal the user's UUID from the register response
    expect(payload.sub).toBe(reg.user.id);

    // sub must look like a UUID
    expect(typeof payload.sub).toBe("string");
    expect((payload.sub as string)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    // Token must have an expiry
    expect(typeof payload.exp).toBe("number");
    expect((payload.exp as number)).toBeGreaterThan(Date.now() / 1000);
  });
});
