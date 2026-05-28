import { APIRequestContext } from "@playwright/test";
import * as jwt from "jsonwebtoken";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a unique email address per test run to avoid duplicate-email
 * conflicts between tests.
 *
 * Example: "user_1717000000000@example.com"
 */
export function uniqueEmail(prefix = "user"): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 9999)}@example.com`;
}

/** Default valid password that satisfies backend rules (8+ chars, uppercase, digit). */
export const DEFAULT_PASSWORD = "Secure123!";

/**
 * Register a new user and return the full TokenResponse.
 * Throws if the response is not 2xx.
 */
export async function registerUser(
  request: APIRequestContext,
  email: string,
  password: string = DEFAULT_PASSWORD,
  fullName: string = "Test User"
): Promise<TokenResponse> {
  const res = await request.post("/api/v1/auth/register", {
    data: { email, password, full_name: fullName },
  });
  return res.json() as Promise<TokenResponse>;
}

/**
 * Log in an existing user and return the full TokenResponse.
 */
export async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<TokenResponse> {
  const res = await request.post("/api/v1/auth/login", {
    data: { email, password },
  });
  return res.json() as Promise<TokenResponse>;
}

/**
 * Craft a JWT whose `exp` claim is in the past (1 hour ago).
 * Requires SECRET_KEY to match the backend's signing key.
 */
export function expiredToken(secret: string): string {
  return jwt.sign(
    { sub: "00000000-0000-0000-0000-000000000000" },
    secret,
    { expiresIn: -3600 } // expired 1 hour ago
  );
}

/**
 * Base64url-decode the payload segment of a JWT and parse it as JSON.
 * Does NOT verify the signature — for assertion purposes only.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Not a valid JWT");
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
}
