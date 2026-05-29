import { Tile } from "@carbon/react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--cds-background)",
        padding: "3rem 1rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "24rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--cds-text-primary)", margin: 0 }}>
            ReelsAssetVault
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
            Sign in to your account
          </p>
        </div>
        <Tile style={{ padding: "1.5rem" }}>
          <LoginForm />
        </Tile>
      </div>
    </div>
  );
}
