"use client";

import { Accordion, AccordionItem, TextArea } from "@carbon/react";
import type { Script } from "@/lib/types";

interface Section {
  key: keyof Script;
  label: string;
  rows?: number;
  placeholder?: string;
}

const SECTIONS: Section[] = [
  { key: "hook_opening", label: "Hook / Opening", rows: 3, placeholder: "Attention-grabbing opening line..." },
  { key: "scenes", label: "Scenes", rows: 8, placeholder: "Scene-by-scene breakdown..." },
  { key: "broll_suggestions", label: "B-Roll Suggestions", rows: 4, placeholder: "Visual footage ideas..." },
  { key: "caption_suggestion", label: "Caption", rows: 3, placeholder: "Suggested caption for the post..." },
  { key: "cta_ending", label: "Call To Action / Ending", rows: 2, placeholder: "How to close the video..." },
  { key: "hashtags", label: "Hashtags", rows: 2, placeholder: "#hashtag1 #hashtag2..." },
  { key: "version_15s", label: "15-Second Version", rows: 4, placeholder: "Ultra-short version..." },
  { key: "version_30s", label: "30-Second Version", rows: 5, placeholder: "Short version..." },
  { key: "version_long", label: "Long-Form Version", rows: 8, placeholder: "Extended script..." },
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

export default function ScriptSections(props: ScriptSectionsProps) {
  return (
    <Accordion>
      {SECTIONS.map(({ key, label, rows, placeholder }) => {
        const value = (props.script[key] as string | null) ?? "";
        return (
          <AccordionItem key={key} title={label} open={!!value}>
            {props.mode === "edit" ? (
              <TextArea
                id={`script-${key}`}
                labelText=""
                hideLabel
                value={value}
                onChange={(e) =>
                  (props as ScriptSectionsEditProps).onChange(key, e.target.value)
                }
                rows={rows ?? 4}
                placeholder={placeholder}
              />
            ) : (
              <div
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  fontSize: "0.875rem",
                  color: value ? "var(--cds-text-primary)" : "var(--cds-text-placeholder)",
                  fontStyle: value ? "normal" : "italic",
                }}
              >
                {value || "Not provided"}
              </div>
            )}
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
