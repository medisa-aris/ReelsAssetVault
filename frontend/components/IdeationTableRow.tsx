"use client";

import Link from "next/link";
import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import LanguageToggle, { type Language } from "@/components/LanguageToggle";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Ideation, Script } from "@/lib/types";

interface IdeationTableRowProps {
  ideation: Ideation;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onDeleted: (id: string) => void;
  onScriptGenerated: (scriptId: string) => void;
}

export default function IdeationTableRow({
  ideation,
  selected,
  onSelect,
  onDeleted,
  onScriptGenerated,
}: IdeationTableRowProps) {
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [showLangPicker, setShowLangPicker] = useState(false);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setRowError(null);
    try {
      await api.delete(`/ideations/${ideation.id}`);
      onDeleted(ideation.id);
    } catch {
      setRowError("Delete failed. Please try again.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleGenerateScript = async (lang: Language) => {
    setGenerating(true);
    setShowLangPicker(false);
    setRowError(null);
    try {
      const res = await api.post<Script>("/scripts/generate", { ideation_id: ideation.id, language: lang });
      onScriptGenerated(res.data.id);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setRowError(msg || "Script generation failed. Ensure an AI provider is active in Admin → AI Config.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${selected ? "bg-indigo-50" : ""}`}>
        {/* Checkbox */}
        <td className="px-4 py-3 w-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(ideation.id, e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </td>

        {/* Title */}
        <td className="px-4 py-3">
          <Link
            href={`/script/ideation/${ideation.id}`}
            className="font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2"
          >
            {ideation.title}
          </Link>
          {ideation.is_ai_generated && (
            <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">AI</span>
          )}
          {ideation.niche && (
            <p className="text-xs text-gray-400 mt-0.5">{ideation.niche}</p>
          )}
        </td>

        {/* Platform */}
        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
          {ideation.platform ?? "—"}
        </td>

        {/* Status */}
        <td className="px-4 py-3 whitespace-nowrap">
          <StatusBadge status={ideation.status} />
        </td>

        {/* Upload date */}
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          {ideation.upload_date ? formatDate(ideation.upload_date) : "—"}
        </td>

        {/* Actions */}
        <td className="px-4 py-3 whitespace-nowrap">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 font-medium">Delete?</span>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="text-xs px-2.5 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "…" : "Yes"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/script/ideation/${ideation.id}`}
                className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                View
              </Link>
              <Link
                href={`/script/ideation/${ideation.id}?mode=edit`}
                className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Edit
              </Link>
              {showLangPicker ? (
                <div className="flex items-center gap-1.5">
                  <LanguageToggle value={language} onChange={setLanguage} />
                  <button
                    onClick={() => handleGenerateScript(language)}
                    disabled={generating}
                    className="text-xs px-2.5 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {generating ? "…" : "Go"}
                  </button>
                  <button
                    onClick={() => setShowLangPicker(false)}
                    className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-400 hover:bg-gray-50"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLangPicker(true)}
                  disabled={generating}
                  title="Generate Script from this ideation"
                  className="text-xs px-2.5 py-1 rounded border border-indigo-300 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                >
                  {generating ? "…" : "Script"}
                </button>
              )}
              <button
                onClick={() => { setConfirmDelete(true); setRowError(null); }}
                className="text-xs px-2.5 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Inline error row */}
      {rowError && (
        <tr className="bg-red-50">
          <td colSpan={6} className="px-4 py-2 text-xs text-red-700 flex items-center justify-between">
            <span>{rowError}</span>
            <button onClick={() => setRowError(null)} className="ml-4 font-bold text-red-400 hover:text-red-600">×</button>
          </td>
        </tr>
      )}
    </>
  );
}
