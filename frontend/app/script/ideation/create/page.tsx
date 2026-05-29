"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import IdeationForm, { type IdeationFormData } from "@/components/IdeationForm";
import { api } from "@/lib/api";
import type { Ideation } from "@/lib/types";

export default function CreateIdeationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data: IdeationFormData) => {
    setSaving(true);
    try {
      const res = await api.post<Ideation>("/ideations", data);
      router.push(`/script/ideation/${res.data.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="md">
        {/* Header — 10px margin after title (no subtitle) */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
          <Link
            href="/script/ideation"
            style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}
          >
            ← Ideation
          </Link>
          <span style={{ color: "#c6c6c6" }}>/</span>
          <h1 className="cds--type-productive-heading-04">Create Ideation</h1>
        </div>

        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0", padding: "1.5rem" }}>
          <IdeationForm onSubmit={handleSubmit} submitLabel="Create Ideation" loading={saving} />
        </div>
      </PageLayout>
    </>
  );
}
