"use client";

import { useState } from "react";
import Link from "next/link";
import { Form, TextInput, PasswordInput, Button, InlineNotification } from "@carbon/react";
import { useAuth } from "@/hooks/useAuth";

type ValidationError = { msg: string };

export default function RegisterForm() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, fullName);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string | ValidationError[] } } })
        ?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg || "Registration failed.");
      } else {
        setError(typeof detail === "string" ? detail : "Registration failed. Please try again.");
      }
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
        id="reg-fullname"
        labelText="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Jane Doe"
        required
        style={{ marginBottom: "1rem" }}
      />

      <TextInput
        id="reg-email"
        type="email"
        labelText="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        style={{ marginBottom: "1rem" }}
      />

      <PasswordInput
        id="reg-password"
        labelText="Password"
        helperText="Min. 8 characters, 1 uppercase letter, 1 digit"
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
        {loading ? "Creating account..." : "Create account"}
      </Button>

      <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--cds-link-primary)" }}>
          Sign in
        </Link>
      </p>
    </Form>
  );
}
