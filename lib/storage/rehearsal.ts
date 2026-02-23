const SUPPORTED_UPLOAD_MIME_PREFIXES = ["audio/", "video/"];
const MAX_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024;

export function sanitizeFilename(filename: string) {
  const trimmed = filename.trim().replace(/\s+/g, "_");
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "");
}

export function buildRehearsalStoragePath(input: {
  userId: string;
  projectId: string;
  sessionId: string;
  timestampMs: number;
  filename: string;
}) {
  const safeFilename = sanitizeFilename(input.filename || "upload.bin");
  return `rehearsal/${input.userId}/${input.projectId}/${input.sessionId}/${input.timestampMs}_${safeFilename}`;
}

export function validateRehearsalFile(file: File) {
  if (!file || !file.name) {
    return { valid: false, error: "No file selected." };
  }

  const isSupported = SUPPORTED_UPLOAD_MIME_PREFIXES.some((prefix) =>
    file.type.startsWith(prefix),
  );

  if (!isSupported) {
    return {
      valid: false,
      error: "Only audio/video files are supported.",
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: "Uploaded file is empty." };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      error: "File is too large. Max size is 200MB.",
    };
  }

  return { valid: true as const };
}

export function isPlayableMime(mime?: string | null) {
  if (!mime) {
    return false;
  }

  return SUPPORTED_UPLOAD_MIME_PREFIXES.some((prefix) => mime.startsWith(prefix));
}

