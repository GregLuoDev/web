"use client";

import { useRef, useState } from "react";
import { Alert, Box, TextField, Typography } from "@mui/material";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";

interface ClipboardFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  minRows?: number;
}

interface ImagePart {
  type: "text" | "image";
  value: string;
  alt?: string;
}

function partsForValue(value: string): ImagePart[] {
  const pattern = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g;
  const parts: ImagePart[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) parts.push({ type: "text", value: value.slice(cursor, match.index) });
    parts.push({ type: "image", value: match[2], alt: match[1] });
    cursor = pattern.lastIndex;
  }
  if (cursor < value.length) parts.push({ type: "text", value: value.slice(cursor) });
  if (parts.length === 0 && value) parts.push({ type: "text", value });
  return parts;
}

export function ClipboardField({
  label,
  value,
  onChange,
  multiline = false,
  required,
  error,
  helperText,
  minRows = 3,
}: ClipboardFieldProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const parts = partsForValue(value);

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const item = Array.from(event.clipboardData.items).find((entry) => entry.type.startsWith("image/"));
    if (!item) return;
    event.preventDefault();
    const file = item.getAsFile();
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)) {
      setPasteError("Paste a PNG, JPEG, GIF, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPasteError("Pasted image must be no larger than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const input = inputRef.current;
      const start = input?.selectionStart ?? value.length;
      const end = input?.selectionEnd ?? start;
      const next = `${value.slice(0, start)}![Pasted image](${reader.result})${value.slice(end)}`;
      setPasteError(null);
      onChange(next);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box className="clipboard-field">
      <TextField
        inputRef={inputRef}
        fullWidth
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onPaste={handlePaste}
        multiline={multiline}
        minRows={minRows}
        required={required}
        error={error}
        helperText={helperText}
        className="editor-field"
      />
      {pasteError ? <Alert severity="warning" className="paste-error">{pasteError}</Alert> : null}
      {parts.some((part) => part.type === "image") ? (
        <Box className="image-preview" aria-label={`${label} image preview`}>
          <Typography component="span" className="image-preview__label">
            <ImageRoundedIcon fontSize="small" />
            Pasted image preview
          </Typography>
          {parts.map((part, index) => (
            part.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={`${part.value.slice(0, 30)}-${index}`} src={part.value} alt={part.alt ?? "Pasted"} />
            ) : (
              <Typography component="span" key={index} className="preview-text">{part.value}</Typography>
            )
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
