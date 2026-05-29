"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@carbon/react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: "var(--cds-text-secondary)" }}>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="max">
        <div style={{ padding: "2rem 0" }}>
          <h2 className="cds--type-productive-heading-04" style={{ marginLeft: "10px" }}>
            Welcome, {user.full_name}!
          </h2>
          <p style={{ marginTop: "0.75rem", marginLeft: "10px", color: "var(--cds-text-secondary)", fontSize: "1rem" }}>
            ReelsAssetVault is your central library for short-form video assets.
          </p>
          <div style={{ marginTop: "2rem", marginLeft: "10px", display: "flex", gap: "1rem" }}>
            <Button kind="primary" onClick={() => router.push("/video")}>
              Browse Library
            </Button>
            <Button kind="secondary" onClick={() => router.push("/video/upload")}>
              Upload Video
            </Button>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
