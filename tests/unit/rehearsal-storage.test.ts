import { describe, expect, it } from "vitest";
import {
  buildRehearsalStoragePath,
  sanitizeFilename,
  validateRehearsalFile,
} from "@/lib/storage/rehearsal";

describe("rehearsal storage path", () => {
  it("builds deterministic path with scoped ids", () => {
    const path = buildRehearsalStoragePath({
      userId: "user-1",
      projectId: "project-1",
      sessionId: "session-1",
      timestampMs: 1700000000000,
      filename: "demo clip.mp4",
    });

    expect(path).toBe(
      "rehearsal/user-1/project-1/session-1/1700000000000_demo_clip.mp4",
    );
  });

  it("sanitizes unsupported filename characters", () => {
    expect(sanitizeFilename(" de*mo?.mp4 ")).toBe("demo.mp4");
  });
});

describe("rehearsal file validation", () => {
  it("accepts valid audio/video files", () => {
    const file = new File(["123"], "sample.mp3", {
      type: "audio/mpeg",
    });
    const result = validateRehearsalFile(file);
    expect(result.valid).toBe(true);
  });

  it("rejects unsupported file type", () => {
    const file = new File(["123"], "sample.txt", {
      type: "text/plain",
    });
    const result = validateRehearsalFile(file);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("audio/video");
    }
  });
});
