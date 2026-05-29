"use client";

import { useState } from "react";
import { FileUploader, InlineNotification } from "@carbon/react";

interface VideoDropzoneProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
}

const ACCEPTED_EXTS = [".mp4", ".mov", ".avi", ".webm"];

export default function VideoDropzone({ onFileSelected, selectedFile }: VideoDropzoneProps) {
  const [typeError, setTypeError] = useState<string | null>(null);

  const handleChange = (_e: React.ChangeEvent<HTMLInputElement>, { addedFiles }: { addedFiles: File[] }) => {
    const file = addedFiles[0];
    if (!file) return;
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) {
      setTypeError(`Unsupported file type "${ext}". Accepted: ${ACCEPTED_EXTS.join(", ")}`);
      return;
    }
    setTypeError(null);
    onFileSelected(file);
  };

  return (
    <div>
      <FileUploader
        labelTitle="Upload Video"
        labelDescription={
          selectedFile
            ? `Selected: ${selectedFile.name} — click or drag to replace`
            : "Drag and drop or click to select. Max 500 MB. Accepted: mp4, mov, avi, webm."
        }
        buttonLabel="Select file"
        filenameStatus="edit"
        accept={ACCEPTED_EXTS}
        multiple={false}
        dragAndDrop
        // @ts-expect-error Carbon's FileUploader onChange signature varies
        onChange={handleChange}
      />
      {typeError && (
        <InlineNotification
          kind="error"
          title={typeError}
          style={{ marginTop: "0.5rem" }}
        />
      )}
    </div>
  );
}
