"use client";

import { useState } from "react";
import Link from "next/link";
import { Form, TextInput, PasswordInput, Button, InlineNotification } from "@carbon/react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && (
        <InlineNotification
          kind="error"
          title={error}
          style={{ marginBottom: "1rem" }}
        />
      )}

      <TextInput
        id="login-email"
        type="email"
        labelText="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        style={{ marginBottom: "1rem" }}
      />

      <PasswordInput
        id="login-password"
        labelText="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{ marginBottom: "1.5rem" }}
      />

      <Button
        type="submit"
        kind="primary"
        disabled={loading}
        style={{ width: "100%", maxWidth: "100%", marginBottom: "1rem" }}
      >
        {loading ? "Signing in..." : "Sign in"}
      </Button>

      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" style={{ color: "var(--cds-link-primary)" }}>
          Register
        </Link>
      </p>
    </Form>
  );
}
