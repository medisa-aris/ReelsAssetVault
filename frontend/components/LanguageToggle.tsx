export type Language = "en" | "id";

interface LanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
}

const LABELS: Record<Language, string> = {
  en: "English",
  id: "Bahasa",
};

export default function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
      {(["en", "id"] as Language[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={`px-3 py-1 rounded-md transition-all ${
            value === lang
              ? "bg-white text-gray-900 shadow-sm border border-gray-200"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {LABELS[lang]}
        </button>
      ))}
    </div>
  );
}
