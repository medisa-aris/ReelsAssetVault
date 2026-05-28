"use client";

import type { Script } from "@/lib/types";

interface Section {
  key: keyof Script;
  label: string;
  rows?: number;
  placeholder?: string;
}

const SECTIONS: Section[] = [
  { key: "hook_opening", label: "Hook / Opening", rows: 3, placeholder: "Attention-grabbing opening line…" },
  { key: "scenes", label: "Scenes", rows: 8, placeholder: "Scene-by-scene breakdown…" },
  { key: "broll_suggestions", label: "B-Roll Suggestions", rows: 4, placeholder: "Visual footage ideas…" },
  { key: "caption_suggestion", label: "Caption", rows: 3, placeholder: "Suggested caption for the post…" },
  { key: "cta_ending", label: "Call To Action / Ending", rows: 2, placeholder: "How to close the video…" },
  { key: "hashtags", label: "Hashtags", rows: 2, placeholder: "#hashtag1 #hashtag2…" },
  { key: "version_15s", label: "15-Second Version", rows: 4, placeholder: "Ultra-short version…" },
  { key: "version_30s", label: "30-Second Version", rows: 5, placeholder: "Short version…" },
  { key: "version_long", label: "Long-Form Version", rows: 8, placeholder: "Extended script…" },
];

interface ScriptSectionsViewProps {
  script: Script;
}

interface ScriptSectionsEditProps {
  script: Script;
  onChange: (key: keyof Script, value: string) => void;
}

type ScriptSectionsProps =
  | ({ mode: "view" } & ScriptSectionsViewProps)
  | ({ mode: "edit" } & ScriptSectionsEditProps);

function Empty() {
  return <span className="text-gray-400 italic text-sm">Not provided</span>;
}

export default function ScriptSections(props: ScriptSectionsProps) {
  const fieldClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <div className="space-y-6">
      {SECTIONS.map(({ key, label, rows, placeholder }) => {
        const value = (props.script[key] as string | null) ?? "";
        return (
          <div key={key}>
            <p className={labelClass}>{label}</p>
            {props.mode === "edit" ? (
              <textarea
                value={value}
                onChange={(e) => (props as ScriptSectionsEditProps).onChange(key, e.target.value)}
                rows={rows ?? 4}
                placeholder={placeholder}
                className={fieldClass}
              />
            ) : (
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-3 min-h-[2.5rem]">
                {value || <Empty />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
