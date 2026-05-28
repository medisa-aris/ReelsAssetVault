"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";

interface VideoDropzoneProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
}

const ACCEPTED = [".mp4", ".mov", ".avi", ".webm"];
const ACCEPTED_MIME = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/avi"];

export default function VideoDropzone({ onFileSelected, selectedFile }: VideoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [typeError, setTypeError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext) && !ACCEPTED_MIME.includes(file.type)) {
      setTypeError(`Unsupported file type "${ext}". Accepted: ${ACCEPTED.join(", ")}`);
      return;
    }
    setTypeError(null);
    onFileSelected(file);
  };

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          dragging
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={onInputChange}
        />

        {selectedFile ? (
          <div className="space-y-1">
            <div className="text-2xl">🎬</div>
            <p className="font-medium text-gray-800">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">Click to change file</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.2}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-base font-medium text-gray-700">
              Drag and drop your video here
            </p>
            <p className="text-sm text-gray-500">
              or{" "}
              <span className="text-indigo-600 font-medium underline underline-offset-2">
                Browse Files
              </span>
            </p>
            <p className="text-xs text-gray-400">
              Supported: {ACCEPTED.join(", ")} &nbsp;·&nbsp; Max 500 MB
            </p>
          </div>
        )}
      </div>

      {typeError && (
        <p className="mt-2 text-sm text-red-600">{typeError}</p>
      )}
    </div>
  );
}
