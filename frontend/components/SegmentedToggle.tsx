interface SegmentedToggleProps {
  value: "view" | "edit";
  onChange: (v: "view" | "edit") => void;
}

export default function SegmentedToggle({ value, onChange }: SegmentedToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {(["view", "edit"] as const).map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
            value === opt
              ? "bg-white text-gray-900 shadow-sm border border-gray-200"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {opt === "view" ? "View" : "Edit"}
        </button>
      ))}
    </div>
  );
}
