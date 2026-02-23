import { describe, expect, it } from "vitest";
import { analyzeTranscript } from "@/lib/analysis/analyze";

describe("analyzeTranscript", () => {
  it("computes speaking rate from explicit duration", () => {
    const transcript = Array.from({ length: 180 }, (_, i) => `word${i}`).join(" ");
    const result = analyzeTranscript({
      transcriptText: transcript,
      durationSec: 60,
    });

    expect(result.isEstimated).toBe(false);
    expect(result.speakingRateWpm).toBe(180);
  });

  it("uses estimated mode when duration is missing", () => {
    const transcript = Array.from({ length: 150 }, (_, i) => `word${i}`).join(" ");
    const result = analyzeTranscript({
      transcriptText: transcript,
    });

    expect(result.isEstimated).toBe(true);
    expect(result.speakingRateWpm).toBe(150);
    expect(result.feedback.some((tip) => tip.includes("estimated"))).toBe(true);
  });

  it("counts fillers and emits pause markers", () => {
    const transcript = "um like 음 어 그 uh like";
    const result = analyzeTranscript({
      transcriptText: transcript,
      durationSec: 80,
    });

    expect(result.fillerCounts.um).toBe(1);
    expect(result.fillerCounts.like).toBe(2);
    expect(result.fillerCounts["음"]).toBe(1);
    expect(result.pauses).toEqual([
      { second: 25, label: "Estimated pause @ 25s" },
      { second: 50, label: "Estimated pause @ 50s" },
      { second: 75, label: "Estimated pause @ 75s" },
    ]);
  });
});
