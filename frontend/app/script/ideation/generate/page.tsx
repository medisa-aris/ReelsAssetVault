"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { PageLayout } from "@/components/PageLayout";
import AIGeneratorForm, { type AIGeneratorFormData } from "@/components/AIGeneratorForm";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import type { Ideation } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface GenerateResponse {
  items: Ideation[];
  count: number;
}

export default function GenerateIdeationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<Ideation[] | null>(null);

  const handleSubmit = async (data: AIGeneratorFormData) => {
    setLoading(true);
    try {
      const res = await api.post<GenerateResponse>("/ideations/generate", data);
      setGenerated(res.data.items);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <PageLayout maxWidth="md">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
          <Link href="/script/ideation" style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)" }}>
            ← Ideation
          </Link>
          <span style={{ color: "#c6c6c6" }}>/</span>
          <h1 className="cds--type-productive-heading-04">Generate 7-Day Plan</h1>
        </div>

        {/* Info banner (subtitle) — 10px margin after */}
        <div style={{
          backgroundColor: "#f6f2ff",
          border: "1px solid #d4bbff",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "10px",
          fontSize: "0.875rem",
          color: "#6929c4",
        }}>
          <strong>AI Content Planner</strong> — Fill in your content parameters and we&apos;ll generate 7 content ideas
          using the active AI provider. Make sure Admin → AI Config has an active provider before generating.
        </div>

        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0", padding: "1.5rem", marginBottom: "2rem" }}>
          <AIGeneratorForm onSubmit={handleSubmit} loading={loading} />
        </div>

        {/* Generated results */}
        {generated && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#161616" }}>
                Generated {generated.length} ideas
              </h2>
              <Link href="/script/ideation" style={{ fontSize: "0.875rem", color: "#0f62fe", fontWeight: 500 }}>
                View all ideations →
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {generated.map((item) => (
                <div
                  key={item.id}
                  style={{ backgroundColor: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "1.25rem" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <Link href={`/script/ideation/${item.id}`} style={{ fontWeight: 600, color: "#161616" }}>
                          {item.title}
                        </Link>
                        <span style={{ fontSize: "0.75rem", backgroundColor: "#f0e6ff", color: "#6929c4", padding: "2px 6px", borderRadius: "4px", fontWeight: 500 }}>AI</span>
                      </div>
                      {item.hook && (
                        <p style={{ fontSize: "0.875rem", color: "var(--cds-text-secondary)", marginBottom: "8px" }}>{item.hook}</p>
                      )}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.75rem", color: "var(--cds-text-secondary)" }}>
                        {item.platform && <span>{item.platform}</span>}
                        {item.upload_date && <span>📅 {formatDate(item.upload_date)}</span>}
                        {item.upload_time && <span>🕐 {item.upload_time}</span>}
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageLayout>
    </>
  );
}
